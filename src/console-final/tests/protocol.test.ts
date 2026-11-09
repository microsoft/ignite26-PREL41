import { describe, expect, it, vi } from 'vitest';
import { Table, tableFromArrays, tableToIPC, vectorFromArray, Int64, Utf8, Decimal, TimestampMicrosecond } from 'apache-arrow';
import { DirectTransport, extractStreamIds, validateConnection, type TableTransport } from '../src/transport';
import { importTable, newBudget, type ImportTarget } from '../src/importer';
import { documentUrl } from '../src/dashboard';
import { formatTimestamp, formatValue } from '../src/database';

const resource = { schema: 'dbo', table: 'synthetic' };
const config = { endpoint: 'https://example.test', workspace: '00000000-0000-0000-0000-000000000001',
  lakehouse: '00000000-0000-0000-0000-000000000002', token: 'test-secret' };
const ipc = (values = [1, 2]) => tableToIPC(tableFromArrays({ id: Int32Array.from(values) }), 'stream');
function body(bytes: Uint8Array, size = 17, fail = false) {
  let offset = 0;
  return new ReadableStream<Uint8Array>({ pull(controller) {
    if (offset >= bytes.length) { if (fail) controller.error(new Error('upstream private body test-secret')); else controller.close(); return; }
    controller.enqueue(bytes.slice(offset, offset += size));
  } });
}
function transport(streams: Uint8Array[], size?: number): TableTransport {
  return { allocate: async () => ({ streamIds: streams.map((_, i) => String(i)) }),
    openStream: async (_r, id) => body(streams[Number(id)], size) };
}
function target(): ImportTarget & { staged: Uint8Array[]; published: Uint8Array[]; discarded: boolean } {
  return {
    staged: [], published: [ipc([99])], discarded: false,
    async begin() { this.staged = []; },
    async append(bytes) { this.staged.push(bytes); },
    async publish() { this.published = this.staged; this.staged = []; },
    async discard() { this.staged = []; this.discarded = true; },
  };
}
describe('allocation contract', () => {
  it.each(['streams', 'streamIds', 'streamIDs', 'value'])('accepts %s strings', key => {
    expect(extractStreamIds({ [key]: ['a', 'b'] })).toEqual(['a', 'b']);
  });
  it.each(['id', 'streamId', 'streamID', 'name'])('accepts %s object IDs', key => {
    expect(extractStreamIds({ streams: [{ [key]: 'a' }, { [key]: 'b' }] })).toEqual(['a', 'b']);
  });
  it.each([null, {}, { streams: [] }, { streams: ['a', 3] }, { streams: ['a', 'a'] },
    { streams: [{ id: 'a', name: 'b' }] }, { streams: ['a'], streamIds: ['b'] },
    { value: [null] }, { streams: [' '] }, { streams: [{ id: 8 }] }, { streamIds: 'x' }])('rejects malformed or ambiguous allocation %#', json => {
    expect(() => extractStreamIds(json)).toThrow();
  });
  it('uses the sample path, projection and bearer header; never returned URLs', async () => {
    const request = vi.fn(async () => new Response(JSON.stringify({ streams: ['https://untrusted.test/private'] })));
    const direct = new DirectTransport(config, () => {}, request);
    await direct.allocate({ schema: 's p', table: 't/x' }, { columns: ['id'] }, new AbortController().signal);
    const [url, options] = request.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`${config.endpoint}/v1.0/workspaces/${config.workspace}/items/${config.lakehouse}/schemas/s%20p/tables/t%2Fx/read`);
    expect(options.body).toBe('{"columns":["id"]}');
    expect(options.redirect).toBe('error');
    expect(options.headers).toMatchObject({ Authorization: 'Bearer test-secret' });
  });
  it.each([401, 403, 404, 500])('redacts HTTP %i response bodies and status text', async status => {
    const traces: unknown[] = [];
    const request = vi.fn(async () => new Response('private test-secret', { status, statusText: 'private test-secret' }));
    const direct = new DirectTransport(config, t => traces.push(t), request);
    const error = await direct.allocate(resource, {}, new AbortController().signal).catch(e => e);
    expect(error.message).toContain(`HTTP ${status}`);
    expect(error.message).not.toContain('test-secret');
    expect(JSON.stringify(traces)).not.toContain('test-secret');
  });
  it('bounds allocation metadata and rejects invalid JSON', async () => {
    for (const data of ['not json', 'a'.repeat(1024 * 1024 + 1)]) {
      const direct = new DirectTransport(config, () => {}, async () => new Response(data));
      await expect(direct.allocate(resource, {}, new AbortController().signal)).rejects.toThrow();
    }
  });
  it('redacts network errors', async () => {
    const direct = new DirectTransport(config, () => {}, async () => { throw new Error('https://private/test-secret'); });
    await expect(direct.allocate(resource, {}, new AbortController().signal)).rejects.not.toThrow('test-secret');
  });
  it.each(['http://example.test', 'https://user:pass@example.test', 'https://example.test/?token=secret', 'https://example.test/#secret'])('rejects unsafe endpoint %s', endpoint => {
    expect(() => validateConnection({ ...config, endpoint })).toThrow();
  });
});
describe('incremental atomic Arrow import (synthetic only)', () => {
  it.each([1, 3, 8, 17, 100000])('loads every stream with %i-byte chunks', async chunk => {
    const destination = target();
    const result = await importTable(transport([ipc(), ipc([3])], chunk), resource, destination, new AbortController().signal);
    expect(result.rows).toBe(3); expect(result.streams).toBe(2); expect(result.batches).toBe(2);
    expect(destination.discarded).toBe(false); expect(destination.published.length).toBe(2);
  });
  it('publishes authorized zero rows with a schema', async () => {
    const data = tableToIPC(new Table(tableFromArrays({ id: Int32Array.of(1) }).schema), 'stream');
    const destination = target();
    const result = await importTable(transport([data]), resource, destination, new AbortController().signal);
    expect(result.rows).toBe(0); expect(destination.published.length).toBeGreaterThan(0);
  });
  it('rejects inconsistent schemas, retaining the previously published table', async () => {
    const destination = target(), prior = destination.published;
    await expect(importTable(transport([ipc(), tableToIPC(tableFromArrays({ other: ['x'] }), 'stream')]), resource, destination, new AbortController().signal)).rejects.toThrow('incompatible');
    expect(destination.published).toBe(prior); expect(destination.staged).toEqual([]);
  });
  it.each([1, 5, 9, 20])('rejects %i truncated bytes even after valid batches', async missing => {
    const bytes = ipc(), destination = target();
    await expect(importTable(transport([bytes.subarray(0, bytes.length - missing)]), resource, destination, new AbortController().signal)).rejects.toThrow();
    expect(destination.discarded).toBe(true);
  });
  it('rejects trailing data after EOS', async () => {
    const data = ipc(), bytes = new Uint8Array(data.length + 1); bytes.set(data); bytes[data.length] = 9;
    await expect(importTable(transport([bytes]), resource, target(), new AbortController().signal)).rejects.toThrow();
  });
  it('fails atomically on HTTP-body error after 200 and permits a clean retry', async () => {
    const destination = target(), prior = destination.published;
    const t: TableTransport = { ...transport([ipc()]), openStream: async () => body(ipc().slice(0, -8), 16, true) };
    await expect(importTable(t, resource, destination, new AbortController().signal)).rejects.not.toThrow('test-secret');
    expect(destination.published).toBe(prior);
    const result = await importTable(transport([ipc([3])]), resource, destination, new AbortController().signal);
    expect(result.rows).toBe(1); expect(destination.published).not.toBe(prior);
  });
  it('enforces shared total bytes, not a per-stream limit', async () => {
    const budget = { bytes: 0, limit: ipc().length + 10 }, destination = target();
    await expect(importTable(transport([ipc(), ipc()]), resource, destination, new AbortController().signal, budget)).rejects.toThrow('budget');
    expect(destination.discarded).toBe(true);
    expect(newBudget().limit).toBe(128 * 1024 * 1024);
  });
  it('cancels after a valid batch without publishing', async () => {
    const abort = new AbortController(), destination = target();
    await expect(importTable(transport([ipc(), ipc()]), resource, destination, abort.signal, newBudget(), p => {
      if (p.rows) abort.abort();
    })).rejects.toMatchObject({ name: 'AbortError' });
    expect(destination.discarded).toBe(true);
  });
  it('preserves bigint, nulls and Arrow type schemas', async () => {
    const data = new Table({
      big: vectorFromArray([9007199254740993n, null], new Int64()),
      label: vectorFromArray(['hello', null], new Utf8()),
      at: vectorFromArray([new Date('2026-10-13T04:00:00Z'), null], new TimestampMicrosecond()),
    });
    const destination = target();
    const result = await importTable(transport([tableToIPC(data, 'stream')], 7), resource, destination, new AbortController().signal);
    expect(result.rows).toBe(2);
    expect(formatValue(9007199254740993n)).toBe('9007199254740993');
    expect(formatValue(null)).toBe('NULL');
    expect(formatValue(Int32Array.from([12345, 0, 0, 0]), new Decimal(2, 10, 128))).toBe('123.45');
    expect(formatValue(Int32Array.from([-12345, -1, -1, -1]), new Decimal(2, 10, 128))).toBe('-123.45');
    expect(formatTimestamp(1791864000123456n, 2)).toBe('2026-10-13T04:00:00.123456Z');
    expect(formatTimestamp(-1n, 3)).toBe('1969-12-31T23:59:59.999999999Z');
  });
});
describe('authorized document roots', () => {
  it('only links explicitly configured root plus a relative document path', () => {
    expect(documentUrl('https://docs.example.test/quality/', 'certificates/SUP-014.txt')).toBe('https://docs.example.test/quality/certificates/SUP-014.txt');
    expect(documentUrl('', 'certificates/SUP-014.txt')).toBeUndefined();
  });
  it.each(['../private', '/outside', '//evil.test/x', 'https://evil.test', '%2e%2e/private', '%252e%252e/private',
    'folder\\outside', 'x?token=secret', 'x#secret', 'javascript:alert(1)'])('rejects unsafe document path %s', path => {
    expect(documentUrl('https://docs.example.test/quality/', path)).toBeUndefined();
  });
});
