import * as duckdb from '@duckdb/duckdb-wasm';
import mvpWasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url';
import mvpWorker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url';
import ehWasm from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url';
import ehWorker from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url';
import { importTable, type Budget, type Progress, type ImportTarget } from './importer';
import type { Resource, TableTransport } from './transport';

export const ident = (s: string) => `"${s.replaceAll('"', '""')}"`;
export const literal = (s: string) => `'${s.replaceAll("'", "''")}'`;
export const qualified = (r: Resource) => `${ident(r.schema)}.${ident(r.table)}`;
export interface Result { columns: { name: string; type: string }[]; rows: string[][]; more: boolean }
export type Row = Record<string, unknown>;

export function formatTimestamp(value: bigint, unit: number): string {
  const precision = [0, 3, 6, 9][unit];
  if (precision === undefined) return value.toString();
  const nanos = value * [1000000000n, 1000000n, 1000n, 1n][unit];
  let seconds = nanos / 1000000000n, remainder = nanos % 1000000000n;
  if (remainder < 0) { seconds--; remainder += 1000000000n; }
  const date = new Date(Number(seconds * 1000n));
  if (Number.isNaN(date.getTime())) return value.toString();
  return `${date.toISOString().slice(0, -5)}${precision ? `.${remainder.toString().padStart(9, '0').slice(0, precision)}` : ''}Z`;
}

export function formatValue(value: unknown, type?: { typeId: number; scale?: number }): string {
  if (value === null || value === undefined) return 'NULL';
  if (type?.typeId === 7 && ArrayBuffer.isView(value)) {
    const words = value as unknown as Int32Array;
    let n = 0n;
    for (let i = words.length - 1; i >= 0; i--) n = (n << 32n) | BigInt(words[i] >>> 0);
    if (words[words.length - 1] < 0) n -= 1n << BigInt(words.length * 32);
    const negative = n < 0n;
    const digits = (negative ? -n : n).toString().padStart((type.scale ?? 0) + 1, '0');
    const scale = type.scale ?? 0;
    if (scale < 0) return `${negative ? '-' : ''}${digits}${'0'.repeat(-scale)}`;
    return `${negative ? '-' : ''}${scale ? `${digits.slice(0, -scale)}.${digits.slice(-scale)}` : digits}`;
  }
  if (type?.typeId === 10 || type?.typeId === 8) {
    const date = new Date(Number(value));
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object')
    return JSON.stringify(value, (_, v) => typeof v === 'bigint' ? v.toString() : v);
  return String(value);
}

function formatCell(
  vector: { get(index: number): unknown; data: readonly unknown[] } | null,
  row: number, type: { typeId: number; scale?: number; unit?: number },
): string {
  const value = vector?.get(row);
  if (value !== null && value !== undefined && type.typeId === 10 && vector) {
    let offset = row;
    for (const item of vector.data) {
      const data = item as { length: number; values: ArrayLike<unknown> };
      if (offset >= data.length) { offset -= data.length; continue; }
      const raw = data.values[offset];
      if (typeof raw === 'bigint') return formatTimestamp(raw, type.unit ?? 1);
      break;
    }
  }
  return formatValue(value, type);
}

export class LocalDatabase {
  private worker?: Worker;
  private db?: duckdb.AsyncDuckDB;
  private conn?: duckdb.AsyncDuckDBConnection;
  private pending: Promise<unknown> = Promise.resolve();
  private disposed = false;
  private ready: Promise<void>;
  constructor() { this.ready = this.initialize(); void this.ready.catch(() => undefined); }
  private async initialize() {
    const bundle = await duckdb.selectBundle({
      mvp: { mainModule: mvpWasm, mainWorker: mvpWorker },
      eh: { mainModule: ehWasm, mainWorker: ehWorker },
    });
    if (this.disposed) return;
    this.worker = new Worker(bundle.mainWorker!);
    this.db = new duckdb.AsyncDuckDB(new duckdb.VoidLogger(), this.worker);
    await this.db.instantiate(bundle.mainModule, bundle.pthreadWorker);
    await this.db.open({ query: { castBigIntToDouble: false, castDecimalToDouble: false, castTimestampToDate: false } });
    this.conn = await this.db.connect();
    await this.conn.query("SET enable_external_access = false");
    await this.conn.query("SET autoinstall_known_extensions = false");
    await this.conn.query("SET autoload_known_extensions = false");
    await this.conn.query("SET lock_configuration = true");
    const settings = await this.conn.query("SELECT current_setting('enable_external_access') AS external, current_setting('lock_configuration') AS locked");
    if (settings.get(0)?.external !== false || settings.get(0)?.locked !== true)
      throw new Error('Local database security settings could not be locked.');
  }
  private exclusive<T>(fn: (conn: duckdb.AsyncDuckDBConnection) => Promise<T>): Promise<T> {
    const operation = this.pending.catch(() => undefined).then(async () => {
      await this.ready;
      if (this.disposed || !this.conn) throw new Error('Local connection has been reset.');
      return fn(this.conn);
    });
    this.pending = operation;
    return operation;
  }
  load(transport: TableTransport, resource: Resource, signal: AbortSignal, budget: Budget, progress: (p: Progress) => void) {
    return this.exclusive(async conn => {
      const stage = `_import_${crypto.randomUUID().replaceAll('-', '')}`;
      const target: ImportTarget = {
        begin: async () => { await conn.query(`CREATE SCHEMA IF NOT EXISTS ${ident(resource.schema)}`); },
        append: async (bytes, create) => { await conn.insertArrowFromIPCStream(bytes, { name: stage, create }); },
        publish: async r => {
          signal.throwIfAborted();
          await conn.query('BEGIN TRANSACTION');
          try {
            await conn.query(`DROP TABLE IF EXISTS ${qualified(r)}`);
            await conn.query(`CREATE TABLE ${qualified(r)} AS SELECT * FROM ${ident(stage)}`);
            await conn.query(`DROP TABLE ${ident(stage)}`);
            signal.throwIfAborted();
            await conn.query('COMMIT');
          } catch (e) { await conn.query('ROLLBACK'); throw e; }
        },
        discard: async () => { await conn.query(`DROP TABLE IF EXISTS ${ident(stage)}`); },
      };
      return importTable(transport, resource, target, signal, budget, progress);
    });
  }
  records(sql: string): Promise<Row[]> {
    return this.exclusive(async conn => {
      const table = await conn.query(sql);
      return Array.from({ length: table.numRows }, (_, row) =>
        Object.fromEntries(table.schema.fields.map((field, col) => [field.name,
          [7, 8, 10].includes(field.type.typeId) ? formatCell(table.getChildAt(col), row, field.type) : table.getChildAt(col)?.get(row)])));
    });
  }
  query(sql: string, page = 0): Promise<Result> {
    return this.exclusive(async conn => {
      const query = sql.trim().replace(/;$/, '');
      if (!/^(select|with)\b/i.test(query) || query.includes(';'))
        throw new Error('Use a single SELECT or WITH to query already imported local data.');
      const table = await conn.query(`SELECT * FROM (${query}) AS local_result LIMIT 101 OFFSET ${Math.max(0, Math.floor(page)) * 100}`);
      const vectors = table.schema.fields.map((_, i) => table.getChildAt(i));
      return { columns: table.schema.fields.map(f => ({ name: f.name, type: String(f.type) })),
        rows: Array.from({ length: Math.min(100, table.numRows) }, (_, row) =>
          table.schema.fields.map((f, col) => formatCell(vectors[col], row, f.type))),
        more: table.numRows > 100 };
    });
  }
  async close() {
    this.disposed = true;
    // Terminating the worker also cancels a currently running query/import.
    this.worker?.terminate();
  }
}
