/** `columns` asks the Table API to return only those columns. */
export interface Resource { schema: string; table: string; columns?: readonly string[] }
export interface Connection {
  endpoint: string;
  workspace: string;
  lakehouse: string;
  token: string;
}
export interface ReadOptions { columns?: string[] }
export interface Allocation { streamIds: readonly string[] }
/** Adapter boundary: streams are independent Arrow IPC streams, never JSON/base64. */
export interface TableTransport {
  allocate(resource: Resource, options: ReadOptions, signal: AbortSignal): Promise<Allocation>;
  openStream(resource: Resource, streamId: string, signal: AbortSignal): Promise<ReadableStream<Uint8Array>>;
}
export interface Trace {
  at: string;
  event: string;
  operation?: 'allocate' | 'stream' | 'import' | 'query';
  method?: 'GET' | 'POST';
  resource?: string;
  status?: number;
  elapsedMs?: number;
  bytes?: number;
  batches?: number;
  rows?: number;
}
export type TraceSink = (trace: Trace) => void;
export const MAX_BYTES = 128 * 1024 * 1024;
const MAX_ALLOCATION = 1024 * 1024;

export function validateConnection(c: Connection): Connection {
  let url: URL;
  try { url = new URL(c.endpoint); } catch { throw new Error('Enter an absolute HTTPS Table API endpoint.'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash)
    throw new Error('The endpoint must be HTTPS without credentials, query parameters, or a fragment.');
  for (const value of [c.workspace, c.lakehouse]) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value))
      throw new Error('Workspace and lakehouse must be valid resource UUIDs.');
  }
  const token = c.token.replace(/^Bearer\s+/i, '').trim();
  if (!token || /[\s\r\n]/.test(token)) throw new Error('Enter a bearer token without whitespace.');
  return { ...c, endpoint: url.href.replace(/\/+$/, ''), token };
}
export function validateResource(r: Resource): Resource {
  for (const value of [r.schema, r.table])
    if (!value.trim() || value.length > 128 || /[\u0000-\u001f]/.test(value))
      throw new Error('Schema and table must be nonempty names of at most 128 characters.');
  return r;
}
export function extractStreamIds(value: unknown): string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid allocation object.');
  const obj = value as Record<string, unknown>;
  const keys = ['streams', 'streamIds', 'streamIDs', 'value'].filter(k => Object.hasOwn(obj, k));
  if (keys.length !== 1) throw new Error('Allocation must contain exactly one supported stream list.');
  const list = obj[keys[0]];
  if (!Array.isArray(list) || list.length === 0 || list.length > 1024)
    throw new Error('Allocation requires 1–1024 streams; empty results must include an Arrow schema.');
  const ids = list.map(member => {
    if (typeof member === 'string') return member;
    if (member && typeof member === 'object' && !Array.isArray(member)) {
      const m = member as Record<string, unknown>;
      const aliases = ['id', 'streamId', 'streamID', 'name'].filter(k => Object.hasOwn(m, k));
      if (aliases.length === 1 && typeof m[aliases[0]] === 'string') return m[aliases[0]] as string;
    }
    throw new Error('Malformed allocation stream member.');
  });
  if (ids.some(id => !id.trim() || id.length > 4096 || /[\u0000-\u001f]/.test(id)))
    throw new Error('Invalid allocation stream identifier.');
  if (new Set(ids).size !== ids.length) throw new Error('Duplicate allocation stream identifiers.');
  return ids;
}

export class DirectTransport implements TableTransport {
  private readonly config: Connection;
  constructor(config: Connection, private readonly trace: TraceSink, private readonly request = fetch) {
    this.config = validateConnection(config);
  }
  private path(resource: Resource): string {
    validateResource(resource);
    const c = this.config;
    return `${c.endpoint}/v1.0/workspaces/${encodeURIComponent(c.workspace)}/items/${encodeURIComponent(c.lakehouse)}/schemas/${encodeURIComponent(resource.schema)}/tables/${encodeURIComponent(resource.table)}`;
  }
  private async send(url: string, init: RequestInit, operation: 'allocate' | 'stream', resource: Resource): Promise<Response> {
    const start = performance.now();
    const context = { operation, method: operation === 'allocate' ? 'POST' : 'GET', resource: `${resource.schema}.${resource.table}` } as const;
    let response: Response;
    try {
      const request = this.request;
      response = await request(url, { ...init, redirect: 'error', credentials: 'omit',
        referrerPolicy: 'no-referrer', cache: 'no-store',
        headers: { Authorization: `Bearer ${this.config.token}`, ...(init.headers ?? {}) } });
    } catch {
      if (init.signal?.aborted) throw new DOMException('Read cancelled.', 'AbortError');
      this.trace({ at: new Date().toISOString(), event: 'Network / CORS failure', ...context });
      throw new Error('Network request failed. Check the endpoint, connectivity, and browser CORS permissions.');
    }
    this.trace({ at: new Date().toISOString(), event: operation === 'allocate' ? '/read' : '/readStream/{id}',
      ...context, status: response.status, elapsedMs: Math.round(performance.now() - start) });
    if (!response.ok) {
      await response.body?.cancel();
      const hint = response.status === 401 ? 'Authentication expired or invalid.' :
        response.status === 403 ? 'Access denied.' : response.status === 404 ? 'Unavailable or not visible to this identity.' : 'Service request failed.';
      throw new Error(`${hint} HTTP ${response.status}.`);
    }
    return response;
  }
  async allocate(resource: Resource, options: ReadOptions, signal: AbortSignal): Promise<Allocation> {
    if (options.columns && (!options.columns.length || options.columns.some(c => typeof c !== 'string' || !c.trim())))
      throw new Error('Projection requires nonempty column names.');
    const response = await this.send(`${this.path(resource)}/read`, {
      method: 'POST', signal, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options.columns ? { columns: options.columns } : {}),
    }, 'allocate', resource);
    if (!response.body) throw new Error('Allocation response has no body.');
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let text = '', size = 0;
    try {
      for (;;) {
        signal.throwIfAborted();
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > MAX_ALLOCATION) throw new Error('Allocation exceeds the 1 MiB metadata limit.');
        text += decoder.decode(value, { stream: true });
      }
      text += decoder.decode();
      let json: unknown;
      try { json = JSON.parse(text); } catch { throw new Error('Allocation is not valid JSON.'); }
      return { streamIds: extractStreamIds(json) };
    } finally { await reader.cancel().catch(() => undefined); reader.releaseLock(); }
  }
  async openStream(resource: Resource, id: string, signal: AbortSignal): Promise<ReadableStream<Uint8Array>> {
    const response = await this.send(`${this.path(resource)}/readStream/${encodeURIComponent(id)}`, { signal }, 'stream', resource);
    if (!response.body) throw new Error('Arrow stream has no response body.');
    return response.body;
  }
}
