import { useCallback, useEffect, useState, type KeyboardEvent } from 'react';
import { identityName, remaining, SLOT_LABEL, SLOTS, type Slot, type TokenInspection } from './identity';
import { IdentityManager, SignIn, toIdentity } from './SignIn';
import { Workspace, type IdentityState, type Settings } from './Workspace';
import { COLLAPSED_HEIGHT, type DevtoolsState } from './DevTools';
import { shortId } from './config';

export default function App() {
  const [settings, setSettings] = useState<Settings>();
  const [identities, setIdentities] = useState<Partial<Record<Slot, IdentityState>>>({});
  const [active, setActive] = useState<Slot>('user');
  const [managing, setManaging] = useState(false);
  const [devtools, setDevtools] = useState<DevtoolsState>({ open: false, tab: 'tables', height: 320 });
  const [now, setNow] = useState(() => Date.now());
  const [devtoolsHost, setDevtoolsHost] = useState<HTMLElement | null>(null);
  const onDevtools = useCallback((patch: Partial<DevtoolsState>) => setDevtools(d => ({ ...d, ...patch })), []);
  const onAuthFailure = useCallback((slot: Slot) => setIdentities(ids => ids[slot] ? { ...ids, [slot]: { ...ids[slot]!, expired: true } } : ids), []);

  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 15000); return () => clearInterval(timer); }, []);
  useEffect(() => {
    const toggle = (e: globalThis.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '`') { e.preventDefault(); setDevtools(d => ({ ...d, open: !d.open })); }
    };
    window.addEventListener('keydown', toggle);
    return () => window.removeEventListener('keydown', toggle);
  }, []);

  const signedIn = SLOTS.filter(s => identities[s]);
  if (!settings || !signedIn.length) {
    return <SignIn onSignIn={(next, ids) => { setSettings(next); setIdentities(ids); setActive(ids.user ? 'user' : 'spn'); }} />;
  }

  function signOutAll() { setIdentities({}); setSettings(undefined); setManaging(false); }
  function save(slot: Slot, inspection: TokenInspection) {
    setIdentities(ids => {
      const next = toIdentity(slot, inspection);
      const current = ids[slot];
      // Same principal: keep its loaded data and use the fresh token for new reads.
      return { ...ids, [slot]: current && current.key === next.key ? { ...current, token: next.token, claims: next.claims, expired: false } : next };
    });
    setActive(slot);
  }
  function remove(slot: Slot) {
    const remainingSlots = signedIn.filter(s => s !== slot);
    if (!remainingSlots.length) { signOutAll(); return; }
    setIdentities(ids => { const next = { ...ids }; delete next[slot]; return next; });
    if (active === slot) setActive(remainingSlots[0]);
  }
  function switchKeys(event: KeyboardEvent) {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key) || signedIn.length < 2) return;
    event.preventDefault();
    const next = signedIn[(signedIn.indexOf(active) + 1) % signedIn.length];
    setActive(next);
    document.getElementById(`identity-${next}`)?.focus();
  }
  const isExpired = (id: IdentityState) => id.expired || (!!id.claims.expiresAt && id.claims.expiresAt.getTime() <= now);

  return <div className="shell" style={{ paddingBottom: (devtools.open ? devtools.height : COLLAPSED_HEIGHT) + 16 }}>
    <header className="appbar">
      <div className="brand"><span className="logo" aria-hidden="true">CF</span>
        <div><strong>Recall Console</strong><small>Contoso Fresh</small></div></div>
      <div className="env" title={`Workspace ${settings.workspace} · Lakehouse ${settings.lakehouse}`}>
        <span>WS {shortId(settings.workspace)}</span><span>LH {shortId(settings.lakehouse)}</span>
      </div>
      <div className="identity-switch" role="radiogroup" aria-label="Active identity" onKeyDown={switchKeys}>
        {SLOTS.map(slot => {
          const id = identities[slot];
          if (!id) return <button key={slot} className="identity-add" onClick={() => setManaging(true)}>+ {SLOT_LABEL[slot]}</button>;
          const expired = isExpired(id);
          return <button key={slot} id={`identity-${slot}`} role="radio" aria-checked={active === slot} tabIndex={active === slot ? 0 : -1}
            className={`identity ${slot}${active === slot ? ' active' : ''}${expired ? ' expired' : ''}`} onClick={() => setActive(slot)}>
            <span className="identity-label">{SLOT_LABEL[slot]}</span>
            <small>{identityName(id.claims)} · {expired ? 'expired' : remaining(id.claims.expiresAt, now)}</small>
          </button>;
        })}
      </div>
      <div className="appbar-actions">
        <button onClick={() => setManaging(true)}>Identities</button>
        <button onClick={signOutAll}>Sign out</button>
      </div>
    </header>
    {SLOTS.map(slot => {
      const id = identities[slot];
      return id && <div key={id.key} hidden={slot !== active}>
        <Workspace slot={slot} identity={{ ...id, expired: isExpired(id) }} settings={settings} active={slot === active}
          devtools={devtools} onDevtools={onDevtools} devtoolsHost={devtoolsHost} onAuthFailure={onAuthFailure} now={now} />
      </div>;
    })}
    <div ref={setDevtoolsHost} />
    {managing && <IdentityManager identities={identities} onSave={save} onRemove={remove} onClose={() => setManaging(false)} />}
  </div>;
}
