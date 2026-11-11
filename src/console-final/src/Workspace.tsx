import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { DirectTransport, validateResource, type Resource, type Trace } from './transport';
import { LocalDatabase, qualified, type Result, type Row } from './database';
import { newBudget, type Progress } from './importer';
import { AS_OF, dashboardQueries, documentUrl, HISTORY, key, MANIFEST, RUN_WINDOW, type SectionName } from './dashboard';
import { identityName, remaining, SLOT_LABEL, type Slot, type TokenClaims } from './identity';
import { createPortal } from 'react-dom';
import { DevTools, type DevtoolsState, type DevtoolsTab } from './DevTools';

export interface Settings { endpoint: string; workspace: string; lakehouse: string; documentRoot: string }
export interface IdentityState { key: string; token: string; claims: TokenClaims; expired: boolean }

type TableState = { state: 'unloaded' | 'loading' | 'loaded' | 'error'; message?: string; progress?: Progress };
type Section = { state: 'waiting' | 'loading' | 'ready' | 'error'; rows: Row[]; message?: string };
const waiting: Section = { state: 'waiting', rows: [] };
const initialSections = () => Object.fromEntries(Object.keys(dashboardQueries('YG-2291')).map(k => [k, waiting])) as Record<SectionName, Section>;
const text = (value: unknown) => value === undefined || value === null || value === '' ? '—' : String(value);
const count = (value: unknown) => value === undefined || value === null ? '—' : BigInt(String(value)).toLocaleString();
const SAFE = /^(Enter |The endpoint|Workspace |Schema |Projection |Allocation |Invalid allocation|Malformed allocation|Duplicate allocation|Network request|Access denied|Authentication|Unavailable or|Service request|Import exceeds|Independent streams|Incomplete Arrow|Arrow stream|Expected modern|Invalid Arrow|Each allocation)/;
/** OneLake answers 403 or 404 when a table is outside the identity's roles. */
const BLOCKED = /^(Access denied|Unavailable or not visible)/;
const safeFailure = (e: unknown) => e instanceof DOMException && e.name === 'AbortError' ? 'Cancelled. No partial data was published.' :
  e instanceof Error && SAFE.test(e.message) ? e.message : 'Local data operation failed. Check the table schema, permissions, and browser memory.';
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

function TableAccess({ state }: { state?: TableState }) {
  if (state?.state === 'loaded') return <><span className="pill ok">Readable</span><small>{state.progress?.rows.toLocaleString() ?? '—'} rows</small></>;
  if (state?.state === 'loading') return <span className="pill">Loading…</span>;
  if (state?.state === 'error') {
    const status = /HTTP (\d{3})/.exec(state.message ?? '')?.[1];
    return BLOCKED.test(state.message ?? '')
      ? <><span className="pill denied">Blocked</span><small>{status ? `HTTP ${status}` : ''}</small></>
      : <><span className="pill warn">Failed</span><small title={state.message}>{status ? `HTTP ${status}` : 'error'}</small></>;
  }
  return <span className="pill">Not loaded</span>;
}

function ResultGrid({ result, empty }: { result?: Result; empty: string }) {
  if (!result) return <p className="dt-muted">{empty}</p>;
  return <div className="dt-grid" tabIndex={0} role="region" aria-label="Query results">
    <table><thead><tr>{result.columns.map((c, i) => <th key={i}>{c.name}<small>{c.type}</small></th>)}</tr></thead>
      <tbody>{result.rows.map((row, i) => <tr key={i}>{row.map((v, j) => <td key={j} className={v === 'NULL' ? 'null' : ''}>{v}</td>)}</tr>)}</tbody>
    </table>{!result.rows.length && <p className="dt-muted">0 rows · returned columns shown.</p>}
  </div>;
}
function Evidence({ section, children }: { section: Section; children: ReactNode }) {
  if (section.state === 'loading') return <p role="status" className="state">Calculating…</p>;
  if (section.state === 'error') return <p className="state error">{section.message}</p>;
  if (section.state === 'waiting') return <p className="state">Not loaded</p>;
  return <>{children}</>;
}

interface Props {
  slot: Slot;
  identity: IdentityState;
  settings: Settings;
  active: boolean;
  devtools: DevtoolsState;
  onDevtools: (patch: Partial<DevtoolsState>) => void;
  /** Shell-owned mount: only the active identity renders the single DevTools bar. */
  devtoolsHost: HTMLElement | null;
  onAuthFailure: (slot: Slot) => void;
  now: number;
}

export function Workspace({ slot, identity, settings, active, devtools, onDevtools, devtoolsHost, onAuthFailure, now }: Props) {
  const [tables, setTables] = useState<Resource[]>(MANIFEST);
  const [states, setStates] = useState<Record<string, TableState>>({});
  const [sections, setSections] = useState(initialSections);
  const [lot, setLot] = useState('YG-2291');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [traces, setTraces] = useState<Trace[]>([]);
  const [selected, setSelected] = useState(key(MANIFEST[0]));
  const [sql, setSql] = useState('SELECT * FROM dbo.lots');
  const [result, setResult] = useState<Result>();
  const [resultSource, setResultSource] = useState<'preview' | 'sql'>();
  const [queryError, setQueryError] = useState('');
  const [queryBusy, setQueryBusy] = useState(false);
  const [page, setPage] = useState(0);
  const [addSchema, setAddSchema] = useState('dbo');
  const [addTable, setAddTable] = useState('');
  const [docRoot, setDocRoot] = useState(settings.documentRoot);
  const [procedure, setProcedure] = useState('');
  const [dbVersion, setDbVersion] = useState(0);
  const db = useRef<LocalDatabase | null>(null);
  const budget = useRef(newBudget());
  const generation = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const token = useRef(identity.token);
  token.current = identity.token;
  // History tables load on demand and stay out of the core table count.
  const all = [...tables, ...HISTORY];

  useEffect(() => {
    db.current = new LocalDatabase();
    return () => { generation.current++; controller.current?.abort(); void db.current?.close(); db.current = null; };
  }, []);
  useEffect(() => { if (!active) controller.current?.abort(); }, [active]);

  function trace(t: Trace, version = generation.current) {
    if (version === generation.current) setTraces(prev => [...prev.slice(-499), t]);
  }
  function resetLocalData() {
    generation.current++; controller.current?.abort(); controller.current = null;
    void db.current?.close(); db.current = new LocalDatabase(); budget.current = newBudget();
    setBusy(false); setStates({}); setSections(initialSections()); setTraces([]);
    setResult(undefined); setQueryError(''); setQueryBusy(false); setPage(0); setNotice('Local data cleared.');
    setDbVersion(v => v + 1);
  }

  async function load(resources: Resource[]) {
    const database = db.current;
    if (!database || busy || identity.expired) return;
    const version = generation.current;
    let transport;
    try {
      transport = new DirectTransport({ endpoint: settings.endpoint, workspace: settings.workspace,
        lakehouse: settings.lakehouse, token: token.current }, t => trace(t, version));
    } catch (error) { setNotice(safeFailure(error)); return; }
    const abort = new AbortController(); controller.current = abort;
    setBusy(true); setNotice(`Loading ${resources.length} table${resources.length === 1 ? '' : 's'}…`);
    let failed = 0, blocked = 0, authFailed = false;
    for (const resource of resources) {
      if (abort.signal.aborted || version !== generation.current) break;
      const name = key(resource);
      setStates(s => ({ ...s, [name]: { state: 'loading' } }));
      try {
        const progress = await database.load(transport, resource, abort.signal, budget.current, p => {
          if (version === generation.current) setStates(s => ({ ...s, [name]: { state: 'loading', progress: p } }));
        });
        if (version !== generation.current) break;
        setStates(s => ({ ...s, [name]: { state: 'loaded', progress } }));
        trace({ at: new Date().toISOString(), event: 'Published to local DuckDB', operation: 'import', resource: name,
          bytes: progress.bytes, batches: progress.batches, rows: progress.rows }, version);
      } catch (error) {
        if (version !== generation.current) break;
        const message = safeFailure(error);
        if (BLOCKED.test(message)) blocked++; else failed++;
        setStates(s => ({ ...s, [name]: { state: 'error', message } }));
        trace({ at: new Date().toISOString(), event: abort.signal.aborted ? 'Import cancelled; staging discarded' : 'Import failed; staging discarded',
          operation: 'import', resource: name }, version);
        if (error instanceof Error && error.message.startsWith('Authentication')) { authFailed = true; onAuthFailure(slot); break; }
      }
    }
    if (version === generation.current) {
      setBusy(false); controller.current = null;
      setNotice(authFailed ? 'The token was rejected. Replace it under Identities, then reload.' :
        abort.signal.aborted ? 'Load cancelled. Completed tables remain; partial tables were discarded.' :
        ['Load finished.', blocked && `${plural(blocked, 'table')} not readable by this identity.`,
          failed && `${plural(failed, 'table')} failed.`].filter(Boolean).join(' '));
    }
  }

  const loadedSignature = all.filter(r => states[key(r)]?.state === 'loaded').map(key).join('|');
  const failedSignature = all.filter(r => states[key(r)]?.state === 'error').map(r => `${key(r)}:${states[key(r)].message}`).join('|');
  useEffect(() => {
    const database = db.current;
    const version = generation.current;
    let cancelled = false;
    const queries = dashboardQueries(lot, new Set(all.filter(r => states[key(r)]?.state === 'loaded').map(key)));
    for (const name of Object.keys(queries) as SectionName[]) {
      const query = queries[name];
      const failedTable = query.requires.find(r => states[r]?.state === 'error');
      if (failedTable || !query.requires.every(r => states[r]?.state === 'loaded')) {
        setSections(s => ({ ...s, [name]: failedTable ? { state: 'error', rows: [], message: `${failedTable}: ${states[failedTable].message}` } : waiting }));
        continue;
      }
      if (!database) continue;
      setSections(s => ({ ...s, [name]: { state: 'loading', rows: [] } }));
      void database.records(query.sql).then(rows => {
        if (!cancelled && version === generation.current) setSections(s => ({ ...s, [name]: { state: 'ready', rows } }));
      }).catch(() => {
        if (!cancelled && version === generation.current) setSections(s => ({ ...s, [name]: { state: 'error', rows: [], message: 'Required columns are not available to this identity.' } }));
      });
    }
    return () => { cancelled = true; };
    // State signatures avoid re-querying for each HTTP chunk.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadedSignature, failedSignature, lot, dbVersion]);

  async function runQuery(source: 'preview' | 'sql', nextPage = 0) {
    const database = db.current;
    if (!database || queryBusy) return;
    const resource = all.find(r => key(r) === selected);
    if (source === 'preview' && (!resource || states[selected]?.state !== 'loaded')) {
      setQueryError('Load this table before previewing it.'); return;
    }
    const version = generation.current;
    setQueryBusy(true); setQueryError(''); setResult(undefined); setResultSource(source);
    const start = performance.now();
    try {
      const data = await database.query(source === 'preview' ? `SELECT * FROM ${qualified(resource!)}` : sql, nextPage);
      if (version !== generation.current) return;
      setResult(data); setPage(nextPage);
      trace({ at: new Date().toISOString(), event: source === 'preview' ? 'Local preview' : 'Local SQL', operation: 'query',
        rows: data.rows.length, elapsedMs: Math.round(performance.now() - start) }, version);
    } catch {
      if (version === generation.current) setQueryError('Query rejected or failed. Use a single SELECT or WITH over loaded tables. External access and extension loading are disabled.');
    } finally { if (version === generation.current) setQueryBusy(false); }
  }
  function addResource(event: FormEvent) {
    event.preventDefault();
    try {
      const resource = validateResource({ schema: addSchema.trim(), table: addTable.trim() });
      if (all.some(r => key(r) === key(resource))) throw new Error('duplicate');
      setTables(t => [...t, resource]); setSelected(key(resource)); setAddTable('');
    } catch { setNotice('Enter a unique schema and table name (up to 128 characters each).'); }
  }

  const lotRow = sections.lot.rows[0];
  const loaded = tables.filter(t => states[key(t)]?.state === 'loaded').length;
  const blockedTables = tables.filter(t => states[key(t)]?.state === 'error' && BLOCKED.test(states[key(t)].message ?? '')).length;
  const supplierRows = sections.supplierLots.rows;
  const visibleLots = supplierRows.reduce((n, r) => n + Number(r.lots), 0);
  const procedureUrl = documentUrl(docRoot, procedure);
  const related = sections.relatedLots.rows;
  const reach = sections.relatedReach.rows;
  const reachStores = reach.reduce((n, r) => n + Number(r.stores), 0);
  const historyBusy = HISTORY.some(r => states[key(r)]?.state === 'loading');
  const historyLoaded = HISTORY.every(r => states[key(r)]?.state === 'loaded');
  const requests = traces.filter(t => t.operation === 'allocate' || t.operation === 'stream');
  const last = requests[requests.length - 1];
  const selectedState = states[selected];
  const claims = identity.claims;

  const status = <>
    <span className={`dt-chip ${slot}`}><span aria-hidden="true">●</span> {SLOT_LABEL[slot]} · {claims.kind}</span>
    <span>{requests.length} requests</span>
    {last && <span className={last.status && last.status >= 400 ? 'dt-bad' : 'dt-ok'}>last: {last.method} {last.status ?? 'ERR'}{last.elapsedMs !== undefined ? ` · ${last.elapsedMs} ms` : ''}</span>}
    <span>{loaded}/{tables.length} tables</span>
    {busy && <span className="dt-busy">loading…</span>}
  </>;

  const panels: Record<DevtoolsTab, ReactNode> = {
    tables: <div className="dt-split">
      <aside className="dt-tree" aria-label="Tables">
        {[...new Set(all.map(r => r.schema))].map(schema => <details key={schema} open><summary>{schema}</summary><ul>
          {all.filter(r => r.schema === schema).map(r => {
            const s = states[key(r)];
            return <li key={key(r)}><button className={selected === key(r) ? 'selected' : ''} aria-current={selected === key(r) || undefined}
              onClick={() => { setSelected(key(r)); setResult(undefined); setQueryError(''); setPage(0); }}>
              <span className={`dot ${s?.state ?? 'unloaded'}`} aria-hidden="true" />{r.table}
              <small>{s?.state ?? 'unloaded'}{s?.progress && s.state === 'loaded' ? ` · ${s.progress.rows.toLocaleString()}` : ''}</small></button></li>;
          })}</ul></details>)}
        <form onSubmit={addResource} className="dt-add"><input aria-label="Schema" value={addSchema} onChange={e => setAddSchema(e.target.value)} />
          <input aria-label="Table" placeholder="table" value={addTable} onChange={e => setAddTable(e.target.value)} /><button>Add</button></form>
      </aside>
      <div className="dt-main">
        <div className="dt-toolbar"><strong>{selected}</strong>
          <span className="dt-muted">{selectedState?.state ?? 'unloaded'}{selectedState?.progress ? ` · stream ${selectedState.progress.stream}/${selectedState.progress.streams} · ${(selectedState.progress.bytes / 1024).toFixed(1)} KiB · ${selectedState.progress.batches} batches · ${selectedState.progress.rows.toLocaleString()} rows` : ''}</span>
          <button disabled={busy || identity.expired} onClick={() => { const r = all.find(t => key(t) === selected); if (r) void load([r]); }}>{selectedState?.state === 'loaded' ? 'Reload' : 'Load'}</button>
          <button disabled={queryBusy || selectedState?.state !== 'loaded'} onClick={() => void runQuery('preview')}>Preview</button>
          <button onClick={resetLocalData} disabled={busy}>Clear local data</button>
        </div>
        {selectedState?.message && <p className="dt-error">{selectedState.message}</p>}
        {queryError && resultSource === 'preview' && <p className="dt-error" role="alert">{queryError}</p>}
        <ResultGrid result={resultSource === 'preview' ? result : undefined} empty="Preview reads local data only; it does not call OneLake." />
        {result && resultSource === 'preview' && <Pager page={page} result={result} busy={queryBusy} go={p => void runQuery('preview', p)} />}
      </div>
    </div>,
    sql: <div className="dt-sql">
      <label className="dt-editor"><span>Local SQL · DuckDB · {loaded} loaded tables</span>
        <textarea value={sql} spellCheck={false} rows={6} aria-label="SQL query"
          onChange={e => { setSql(e.target.value); setResult(undefined); setPage(0); }}
          onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); void runQuery('sql'); } }} /></label>
      <div className="dt-toolbar"><button className="dt-run" disabled={queryBusy} onClick={() => void runQuery('sql')}>{queryBusy ? 'Running…' : '▶ Run'}</button>
        <span className="dt-muted">Ctrl+Enter · 100 rows per page · no OneLake request</span></div>
      {queryError && resultSource === 'sql' && <p className="dt-error" role="alert">{queryError}</p>}
      <ResultGrid result={resultSource === 'sql' ? result : undefined} empty="Run a SELECT or WITH query over loaded tables." />
      {result && resultSource === 'sql' && <Pager page={page} result={result} busy={queryBusy} go={p => void runQuery('sql', p)} />}
    </div>,
    network: <div className="dt-network">
      <div className="dt-toolbar"><span className="dt-muted">{requests.length} requests · {traces.length} events · tokens, stream IDs and payloads are never recorded</span>
        <button onClick={() => setTraces([])} disabled={!traces.length}>Clear</button></div>
      {traces.length ? <div className="dt-grid" tabIndex={0} role="region" aria-label="Network log"><table className="dt-log">
        <thead><tr><th>Time</th><th>Type</th><th>Method</th><th>Table</th><th>Request</th><th>Status</th><th>ms</th><th>Bytes</th><th>Batches</th><th>Rows</th></tr></thead>
        <tbody>{traces.map((t, i) => <tr key={i}>
          <td>{t.at.slice(11, 23)}</td><td>{t.operation ?? ''}</td><td className={`m-${t.method ?? ''}`}>{t.method ?? ''}</td>
          <td>{t.resource ?? ''}</td><td>{t.event}</td>
          <td className={t.status === undefined ? '' : t.status < 300 ? 's-ok' : t.status < 500 ? 's-warn' : 's-bad'}>{t.status ?? ''}</td>
          <td>{t.elapsedMs ?? ''}</td><td>{t.bytes?.toLocaleString() ?? ''}</td><td>{t.batches ?? ''}</td><td>{t.rows?.toLocaleString() ?? ''}</td>
        </tr>)}</tbody></table></div> : <p className="dt-muted">No requests yet.</p>}
    </div>,
    identity: <dl className="dt-claims">
      <dt>Slot</dt><dd>{SLOT_LABEL[slot]}</dd>
      <dt>Type</dt><dd>{claims.kind === 'app' ? 'Application (service principal)' : claims.kind === 'user' ? 'User' : 'Unknown'}</dd>
      <dt>Name</dt><dd>{claims.name ?? '—'}</dd>
      <dt>UPN</dt><dd>{claims.upn ?? '—'}</dd>
      <dt>App ID</dt><dd>{claims.appId ?? '—'}</dd>
      <dt>Object ID</dt><dd>{claims.objectId ?? '—'}</dd>
      <dt>Tenant</dt><dd>{claims.tenantId ?? '—'}</dd>
      <dt>Audience</dt><dd>{claims.audience ?? '—'}</dd>
      <dt>Issued</dt><dd>{claims.issuedAt?.toISOString() ?? '—'}</dd>
      <dt>Expires</dt><dd>{claims.expiresAt ? `${claims.expiresAt.toISOString()} (${remaining(claims.expiresAt, now)})` : '—'}</dd>
      <dt>Token</dt><dd>Held in memory only · {identity.expired ? 'expired or rejected' : 'active'}</dd>
    </dl>,
  };

  return <div className="workspace">
    {identity.expired && <div className="banner danger" role="alert">The {SLOT_LABEL[slot]} token expired or was rejected. Replace it under Identities.</div>}
    <section className="toolbar" aria-label="Data">
      <label className="lot-field">Lot<input aria-label="Lot" value={lot} maxLength={128} onChange={e => setLot(e.target.value)} /></label>
      <span className="as-of">As of {AS_OF} UTC</span>
      <span className="toolbar-status">{loaded}/{tables.length} tables loaded · {identityName(claims)}</span>
      {busy && <button onClick={() => controller.current?.abort()}>Cancel</button>}
      <button className="primary" disabled={busy || identity.expired} onClick={() => void load(tables)}>{loaded ? 'Reload data' : 'Load data'}</button>
    </section>
    <p className="notice" role="status">{notice}</p>

    <section className="card lot-card" aria-label="Lot">
      <header><h2>{lot || '—'}</h2><span className="pill recall">Recall investigation</span></header>
      <Evidence section={sections.lot}>{lotRow ? <dl className="facts">
        <div><dt>Product</dt><dd>{lotRow.product_name ? <>{text(lotRow.product_name)} <small>{text(lotRow.product_id)}</small></> : text(lotRow.product_id)}</dd></div>
        <div><dt>Supplier</dt><dd>{text(lotRow.supplier_id)}</dd></div>
        <div><dt>Production line</dt><dd>{text(lotRow.production_line)}</dd></div>
        <div><dt>Production window (UTC)</dt><dd>{text(lotRow.production_start_utc)} → {text(lotRow.production_end_utc)}</dd></div>
        <div><dt>Expires</dt><dd>{text(lotRow.expires_on)}</dd></div>
      </dl> : <p className="state">No matching lot in the data returned to this identity.</p>}</Evidence>
    </section>

    <section className="kpis" aria-label="Reach and access">
      <article className="card kpi"><h3>Current inventory</h3><Evidence section={sections.inventory}>
        <p className="kpi-value">{count(sections.inventory.rows[0]?.stores)} <span>stores</span></p>
        <p className="kpi-sub">{count(sections.inventory.rows[0]?.units)} units on hand</p></Evidence>
        <p className="kpi-foot">Stores with stock now</p></article>
      <article className="card kpi" id="supplier-lots" aria-label="Lots by supplier"><h3>Lots by supplier</h3><Evidence section={sections.supplierLots}>
        <p className="kpi-value">{visibleLots.toLocaleString()} <span>lots</span></p>
        <p className="kpi-sub">from {plural(supplierRows.length, 'supplier')}</p>
        <ul className="bars">{supplierRows.map(r => {
          const lots = Number(r.lots);
          return <li key={String(r.supplier_id)} className={r.supplier_id === lotRow?.supplier_id ? 'current' : ''}>
            <span>{text(r.supplier_id)}</span>
            <span className="bar" aria-hidden="true"><span style={{ width: `${visibleLots ? Math.max(2, lots / visibleLots * 100) : 0}%` }} /></span>
            <strong>{lots.toLocaleString()}</strong></li>;
        })}</ul></Evidence>
        <p className="kpi-foot">Every row of dbo.lots returned to this identity</p></article>
      <article className="card kpi" id="table-access" aria-label="Table access"><h3>Table access</h3>
        <p className="kpi-value">{loaded}/{tables.length} <span>tables readable</span></p>
        <p className="kpi-sub">{blockedTables ? `${blockedTables} blocked by OneLake` : 'None blocked'}</p>
        <ul className="access">{tables.map(r => <li key={key(r)}><code>{key(r)}</code><TableAccess state={states[key(r)]} /></li>)}</ul>
        <p className="kpi-foot">What OneLake returned to this identity</p></article>
    </section>

      <section className="card" id="documents" aria-label="Supplier documents">
        <header><h3>Supplier certificates</h3>
          <details className="doc-settings"><summary aria-label="Document settings">⚙</summary><div className="doc-panel">
            <label>Document library URL<input value={docRoot} onChange={e => setDocRoot(e.target.value)} placeholder="https://…/SupplierQuality/" /></label>
            <label>Recall procedure path<input value={procedure} onChange={e => setProcedure(e.target.value)} placeholder="procedures/recall.txt" /></label>
          </div></details></header>
        <Evidence section={sections.documents}>{sections.documents.rows.length ? <ul className="docs">{sections.documents.rows.map((r, i) => {
          const url = documentUrl(docRoot, String(r.document_path ?? ''));
          return <li key={i}><div><strong>{text(r.certificate_type)}</strong><small>{text(r.certificate_id)} · expires {text(r.expiration_date)}</small></div>
            <span className={`pill ${String(r.status).toLowerCase() === 'active' ? 'ok' : 'warn'}`}>{text(r.status)}</span>
            {url ? <a href={url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">Open</a> : <span className="dim" title="Set an HTTPS document library URL">No link</span>}</li>;
        })}</ul> : <p className="state warn">No certificate returned.</p>}</Evidence>
        {procedureUrl && <a className="procedure" href={procedureUrl} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">Recall procedure</a>}
      </section>
    <section className="card" id="related-lots" aria-label="Related lots">
      <header><h3>Related lots</h3><span className="pill">Shipment history</span>
        <button className="history-load" disabled={busy || identity.expired} onClick={() => void load(HISTORY)}>
          {historyBusy ? 'Loading history…' : historyLoaded ? 'Reload history' : 'Load history'}</button></header>
      <p className="meta">Lots from the same supplier and production line that started in the weekly run ({RUN_WINDOW}) in the 90 days before the recall, and the stores that received them.</p>
      <div className="columns">
        <div><h4>Lots in the run</h4><Evidence section={sections.relatedLots}>
          <p className="kpi-value">{related.length} <span>related lots</span></p>
          <p className="kpi-sub">{lot ? `${lot} is ${related.some(r => r.lot_id === lot) ? 'in' : 'not in'} the list` : '—'}</p>
          <ul className="docs">{related.map(r => <li key={String(r.lot_id)}><div><strong>{text(r.lot_id)}</strong>
            <small>Started {text(r.start_paris)} Paris time</small></div></li>)}</ul>
        </Evidence></div>
        <div><h4>Stores reached</h4><Evidence section={sections.relatedReach}>
          <p className="kpi-value">{reachStores.toLocaleString()} <span>stores</span></p>
          <p className="kpi-sub">in {plural(reach.length, 'region')}</p>
          <ul className="bars">{reach.map(r => {
            const stores = Number(r.stores);
            return <li key={String(r.region)}><span>{text(r.region)}</span>
              <span className="bar" aria-hidden="true"><span style={{ width: `${reachStores ? Math.max(2, stores / reachStores * 100) : 0}%` }} /></span>
              <strong>{stores.toLocaleString()}</strong></li>;
          })}</ul>
        </Evidence></div>
      </div>
    </section>
    {active && devtoolsHost && createPortal(<DevTools state={devtools} onChange={onDevtools} status={status} panels={panels} />, devtoolsHost)}
  </div>;
}

function Pager({ page, result, busy, go }: { page: number; result: Result; busy: boolean; go: (page: number) => void }) {
  return <div className="dt-pager"><button disabled={page === 0 || busy} onClick={() => go(page - 1)}>Previous</button>
    <span>Page {page + 1} · {result.rows.length} rows</span>
    <button disabled={!result.more || busy} onClick={() => go(page + 1)}>Next</button></div>;
}
