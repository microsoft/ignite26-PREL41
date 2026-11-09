import { useEffect, useRef, useState, type FormEvent } from 'react';
import { identityKey, identityName, inspectToken, remaining, SLOT_LABEL, SLOTS, type Slot, type TokenInspection } from './identity';
import { validateConnection } from './transport';
import { DEFAULTS } from './config';
import type { IdentityState, Settings } from './Workspace';

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CLI = 'az account get-access-token --resource https://storage.azure.com --query accessToken -o tsv';

export function toIdentity(slot: Slot, inspection: TokenInspection): IdentityState {
  return { key: identityKey(slot, inspection.claims), token: inspection.token, claims: inspection.claims, expired: false };
}

export function TokenField({ slot, value, onChange, inspection, autoFocus }: {
  slot: Slot; value: string; onChange: (v: string) => void; inspection?: TokenInspection; autoFocus?: boolean;
}) {
  const id = `token-${slot}`;
  const c = inspection?.claims;
  return <div className="token-field">
    <label htmlFor={id}>{SLOT_LABEL[slot]} access token</label>
    <input id={id} type="password" autoComplete="off" spellCheck={false} value={value} autoFocus={autoFocus}
      placeholder={slot === 'user' ? 'eyJ0eXAiOiJKV1Qi…' : 'Service principal access token'} onChange={e => onChange(e.target.value)}
      aria-describedby={`${id}-info`} />
    <div id={`${id}-info`} className="token-info" aria-live="polite">
      {inspection && !inspection.errors.length && c && c.kind !== 'unknown' && <span className={`claim ${c.kind}`}>
        {c.kind === 'app' ? 'Application' : 'User'} · {identityName(c)} · {remaining(c.expiresAt)}</span>}
      {inspection?.errors.map(e => <span key={e} className="claim-error">{e}</span>)}
      {inspection?.warnings.map(w => <span key={w} className="claim-warn">{w}</span>)}
    </div>
  </div>;
}

export function SignIn({ onSignIn }: { onSignIn: (settings: Settings, identities: Partial<Record<Slot, IdentityState>>) => void }) {
  const [saved] = useState(() => {
    try {
      return {
        workspace: localStorage.getItem('recall-console.workspaceId') ?? DEFAULTS.workspace,
        lakehouse: localStorage.getItem('recall-console.lakehouseId') ?? DEFAULTS.lakehouse,
        error: '',
      };
    } catch {
      return { workspace: DEFAULTS.workspace, lakehouse: DEFAULTS.lakehouse,
        error: 'Browser storage is unavailable. Workspace and lakehouse IDs cannot be remembered between sessions.' };
    }
  });
  const [endpoint, setEndpoint] = useState(DEFAULTS.endpoint);
  const [workspace, setWorkspace] = useState(saved.workspace);
  const [lakehouse, setLakehouse] = useState(saved.lakehouse);
  const [storageError, setStorageError] = useState(saved.error);
  const [documentRoot, setDocumentRoot] = useState(DEFAULTS.documentRoot);
  const [tokens, setTokens] = useState<Record<Slot, string>>({ user: '', spn: '' });
  const [showSpn, setShowSpn] = useState(false);
  const [error, setError] = useState('');
  const inspect = (slot: Slot) => tokens[slot].trim() ? inspectToken(tokens[slot], slot) : undefined;
  const inspections = { user: inspect('user'), spn: inspect('spn') };

  useEffect(() => {
    try {
      localStorage.setItem('recall-console.workspaceId', workspace);
      localStorage.setItem('recall-console.lakehouseId', lakehouse);
      setStorageError('');
    } catch {
      setStorageError('Browser storage is unavailable. Workspace and lakehouse IDs cannot be remembered between sessions.');
    }
  }, [workspace, lakehouse]);

  function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    const provided = SLOTS.filter(s => inspections[s]);
    if (!provided.length) { setError('Paste at least one access token.'); return; }
    if (provided.some(s => inspections[s]!.errors.length)) { setError('Fix the token errors above.'); return; }
    if (!GUID.test(workspace.trim()) || !GUID.test(lakehouse.trim())) { setError('Workspace and lakehouse must be GUIDs.'); return; }
    let settings: Settings;
    try {
      const checked = validateConnection({ endpoint: endpoint.trim(), workspace: workspace.trim(), lakehouse: lakehouse.trim(), token: inspections[provided[0]]!.token });
      settings = { endpoint: checked.endpoint, workspace: checked.workspace, lakehouse: checked.lakehouse, documentRoot: documentRoot.trim() };
    } catch (e) { setError(e instanceof Error ? e.message : 'Invalid connection settings.'); return; }
    const identities: Partial<Record<Slot, IdentityState>> = {};
    for (const slot of provided) identities[slot] = toIdentity(slot, inspections[slot]!);
    onSignIn(settings, identities);
  }

  return <div className="signin">
    <form className="signin-card" onSubmit={submit} aria-labelledby="signin-title" noValidate>
      <div className="signin-brand"><span className="logo" aria-hidden="true">CF</span>
        <div><h1 id="signin-title">Recall Console</h1><p>Contoso Fresh · Quality operations</p></div></div>
      <h2>Sign in with an access token</h2>
      <fieldset><legend>Data source</legend>
        <label>Table API endpoint<input value={endpoint} onChange={e => setEndpoint(e.target.value)} spellCheck={false} required /></label>
        <div className="row">
          <label>Workspace ID<input value={workspace} onChange={e => setWorkspace(e.target.value)} placeholder="00000000-0000-0000-0000-000000000000" spellCheck={false} required /></label>
          <label>Lakehouse ID<input value={lakehouse} onChange={e => setLakehouse(e.target.value)} placeholder="00000000-0000-0000-0000-000000000000" spellCheck={false} required /></label>
        </div>
      </fieldset>
      <fieldset><legend>Identities</legend>
        <TokenField slot="user" value={tokens.user} onChange={v => setTokens(t => ({ ...t, user: v }))} inspection={inspections.user} />
        {showSpn ? <TokenField slot="spn" value={tokens.spn} onChange={v => setTokens(t => ({ ...t, spn: v }))} inspection={inspections.spn} autoFocus />
          : <button type="button" className="link" onClick={() => setShowSpn(true)}>+ Add a service principal token</button>}
        <details className="cli-help"><summary>Get a token with Azure CLI</summary><code>{CLI}</code></details>
      </fieldset>
      <details className="more"><summary>Documents</summary>
        <label>Document library URL (optional)<input value={documentRoot} onChange={e => setDocumentRoot(e.target.value)} placeholder="https://…/SupplierQuality/" spellCheck={false} /></label>
      </details>
      {storageError && <p className="form-error" role="alert">{storageError}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="primary wide">Sign in</button>
      <p className="fine">Workspace and lakehouse IDs are remembered in this browser's local storage.</p>
      <p className="fine">Tokens stay in this browser tab's memory and are sent only with Table API requests.</p>
    </form>
  </div>;
}

export function IdentityManager({ identities, onSave, onRemove, onClose }: {
  identities: Partial<Record<Slot, IdentityState>>;
  onSave: (slot: Slot, inspection: TokenInspection) => void;
  onRemove: (slot: Slot) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [tokens, setTokens] = useState<Record<Slot, string>>({ user: '', spn: '' });
  useEffect(() => { const d = ref.current; if (d && !d.open) d.showModal(); }, []);
  return <dialog ref={ref} className="identity-dialog" aria-labelledby="identities-title" onClose={onClose}>
    <header><h2 id="identities-title">Identities</h2><button aria-label="Close" onClick={() => ref.current?.close()}>✕</button></header>
    {SLOTS.map(slot => {
      const current = identities[slot];
      const inspection = tokens[slot].trim() ? inspectToken(tokens[slot], slot) : undefined;
      return <section key={slot} className="identity-slot" aria-label={SLOT_LABEL[slot]}>
        <h3>{SLOT_LABEL[slot]}</h3>
        <p className="dim">{current ? `${identityName(current.claims)} · ${current.expired ? 'expired or rejected' : remaining(current.claims.expiresAt)}` : 'Not signed in'}</p>
        <TokenField slot={slot} value={tokens[slot]} onChange={v => setTokens(t => ({ ...t, [slot]: v }))} inspection={inspection} autoFocus={!current && slot === 'spn'} />
        <div className="actions">
          <button className="primary" disabled={!inspection || inspection.errors.length > 0}
            onClick={() => { onSave(slot, inspection!); setTokens(t => ({ ...t, [slot]: '' })); }}>{current ? 'Replace token' : 'Sign in'}</button>
          {current && <button onClick={() => onRemove(slot)}>Sign out</button>}
        </div>
      </section>;
    })}
  </dialog>;
}
