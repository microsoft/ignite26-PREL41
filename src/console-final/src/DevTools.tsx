import { useEffect, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';

export type DevtoolsTab = 'tables' | 'sql' | 'network' | 'identity';
export interface DevtoolsState { open: boolean; tab: DevtoolsTab; height: number }
export const DEVTOOLS_TABS: readonly [DevtoolsTab, string][] = [
  ['tables', 'Tables'], ['sql', 'SQL'], ['network', 'Network'], ['identity', 'Identity'],
];
export const MIN_HEIGHT = 180;
export const COLLAPSED_HEIGHT = 34;
const maxHeight = () => Math.max(MIN_HEIGHT, Math.round(window.innerHeight * 0.8));
const clamp = (h: number) => Math.min(maxHeight(), Math.max(MIN_HEIGHT, Math.round(h)));

interface Props {
  state: DevtoolsState;
  onChange: (patch: Partial<DevtoolsState>) => void;
  status: ReactNode;
  panels: Record<DevtoolsTab, ReactNode>;
}

export function DevTools({ state, onChange, status, panels }: Props) {
  useEffect(() => {
    const fit = () => { if (state.height > maxHeight()) onChange({ height: clamp(state.height) }); };
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [state.height, onChange]);

  function startResize(event: ReactPointerEvent) {
    event.preventDefault();
    const startY = event.clientY, startHeight = state.height;
    const move = (e: PointerEvent) => onChange({ height: clamp(startHeight + startY - e.clientY) });
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }
  function resizeKeys(event: ReactKeyboardEvent) {
    const step = event.shiftKey ? 96 : 24;
    if (event.key === 'ArrowUp') { event.preventDefault(); onChange({ height: clamp(state.height + step) }); }
    if (event.key === 'ArrowDown') { event.preventDefault(); onChange({ height: clamp(state.height - step) }); }
  }
  function tabKeys(event: ReactKeyboardEvent, index: number) {
    const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const n = DEVTOOLS_TABS.length;
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? n - 1 : (index + (event.key === 'ArrowRight' ? 1 : n - 1)) % n;
    onChange({ tab: DEVTOOLS_TABS[next][0] });
    document.getElementById(`devtools-tab-${DEVTOOLS_TABS[next][0]}`)?.focus();
  }

  return <section className={`devtools${state.open ? ' open' : ''}`} aria-label="DevTools"
    style={{ height: state.open ? state.height : COLLAPSED_HEIGHT }}>
    {state.open && <div className="devtools-resize" role="separator" aria-orientation="horizontal" aria-label="Resize DevTools"
      aria-valuenow={state.height} aria-valuemin={MIN_HEIGHT} aria-valuemax={maxHeight()} tabIndex={0}
      onPointerDown={startResize} onKeyDown={resizeKeys} />}
    <div className="devtools-bar">
      <button className="devtools-toggle" aria-expanded={state.open} aria-controls="devtools-panel"
        onClick={() => onChange({ open: !state.open })}>
        <span aria-hidden="true">{state.open ? '▾' : '▴'}</span> DevTools
      </button>
      {state.open && <div role="tablist" aria-label="DevTools panels" className="devtools-tabs">
        {DEVTOOLS_TABS.map(([id, label], i) => <button key={id} role="tab" id={`devtools-tab-${id}`}
          aria-selected={state.tab === id} aria-controls="devtools-panel" tabIndex={state.tab === id ? 0 : -1}
          onKeyDown={e => tabKeys(e, i)} onClick={() => onChange({ tab: id })}>{label}</button>)}
      </div>}
      <div className="devtools-status">{status}</div>
      <kbd title="Toggle DevTools">Ctrl + `</kbd>
    </div>
    {state.open && <div id="devtools-panel" role="tabpanel" aria-labelledby={`devtools-tab-${state.tab}`} className="devtools-panel">
      {panels[state.tab]}
    </div>}
  </section>;
}
