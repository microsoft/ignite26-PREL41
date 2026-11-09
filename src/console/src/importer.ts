import { RecordBatchReader, Table, tableToIPC, vectorFromArray, type Schema } from 'apache-arrow';
import { Message } from 'apache-arrow/ipc/metadata/message';
import { MAX_BYTES, type Resource, type TableTransport } from './transport';

export interface Progress { bytes: number; batches: number; rows: number; stream: number; streams: number }
export interface ImportTarget {
  begin(resource: Resource): Promise<void>;
  append(ipc: Uint8Array, create: boolean): Promise<void>;
  publish(resource: Resource): Promise<void>;
  discard(): Promise<void>;
}
export interface Budget { bytes: number; limit: number }
export const newBudget = (): Budget => ({ bytes: 0, limit: MAX_BYTES });

// Validate framing independently: Arrow readers can otherwise accept a truncated EOF.
export class IpcFraming {
  private buffer = new Uint8Array(0);
  private body = 0;
  private metadataLength = -1;
  private ended = false;
  private schemas = 0;
  push(chunk: Uint8Array): void {
    let bytes = chunk;
    while (bytes.length) {
      if (this.ended) throw new Error('Arrow stream contains data after its end marker.');
      if (this.body) {
        const n = Math.min(this.body, bytes.length);
        this.body -= n; bytes = bytes.subarray(n); continue;
      }
      const needed = (this.metadataLength < 0 ? 8 : this.metadataLength) - this.buffer.length;
      const n = Math.min(needed, bytes.length);
      const next = new Uint8Array(this.buffer.length + n);
      next.set(this.buffer); next.set(bytes.subarray(0, n), this.buffer.length);
      this.buffer = next; bytes = bytes.subarray(n);
      if (this.metadataLength < 0 && this.buffer.length === 8) {
        const view = new DataView(this.buffer.buffer);
        if (view.getInt32(0, true) !== -1) throw new Error('Expected modern Arrow IPC stream framing.');
        const length = view.getInt32(4, true);
        if (!length) { this.ended = true; this.buffer = new Uint8Array(0); }
        else {
          if (length < 0 || length > MAX_BYTES || length % 8) throw new Error('Invalid Arrow metadata length.');
          this.metadataLength = length; this.buffer = new Uint8Array(0);
        }
      } else if (this.metadataLength >= 0 && this.buffer.length === this.metadataLength) {
        const message = Message.decode(this.buffer);
        if (message.isSchema()) this.schemas++;
        if (this.schemas !== 1) throw new Error('Each allocation stream must contain exactly one schema.');
        if (!Number.isSafeInteger(message.bodyLength) || message.bodyLength < 0 || message.bodyLength > MAX_BYTES)
          throw new Error('Invalid Arrow body length.');
        this.body = message.bodyLength;
        this.metadataLength = -1; this.buffer = new Uint8Array(0);
      }
    }
  }
  finish(): void {
    if (!this.ended || this.schemas !== 1 || this.body || this.buffer.length)
      throw new Error('Incomplete Arrow stream: missing schema, body bytes, or end marker.');
  }
}

function signature(schema: Schema): string {
  return JSON.stringify(schema.fields.map(f => [f.name, String(f.type), f.nullable, [...f.metadata]]));
}

export async function importTable(
  transport: TableTransport, resource: Resource, target: ImportTarget,
  signal: AbortSignal, budget: Budget = newBudget(), onProgress: (progress: Progress) => void = () => {},
): Promise<Progress> {
  const progress: Progress = { bytes: 0, batches: 0, rows: 0, stream: 0, streams: 0 };
  let created = false, expectedSchema: string | undefined;
  await target.begin(resource);
  try {
    const allocation = await transport.allocate(resource, resource.columns ? { columns: [...resource.columns] } : {}, signal);
    progress.streams = allocation.streamIds.length;
    for (const id of allocation.streamIds) {
      signal.throwIfAborted(); progress.stream++;
      const stream = await transport.openStream(resource, id, signal);
      const network = stream.getReader();
      const framing = new IpcFraming();
      const abort = () => { void network.cancel().catch(() => undefined); };
      signal.addEventListener('abort', abort, { once: true });
      async function* chunks() {
        for (;;) {
          signal.throwIfAborted();
          const { value, done } = await network.read();
          signal.throwIfAborted();
          if (done) break;
          budget.bytes += value.byteLength; progress.bytes += value.byteLength;
          if (budget.bytes > budget.limit) throw new Error('Import exceeds the 128 MiB total download budget. Reset the connection to start a new budget.');
          framing.push(value); onProgress({ ...progress }); yield value;
        }
      }
      const source = chunks();
      let reader: Awaited<ReturnType<typeof RecordBatchReader.from>> | undefined;
      try {
        reader = await RecordBatchReader.from(source);
        await reader.open({ autoDestroy: false });
        if (!reader.schema) throw new Error('Arrow stream has no schema.');
        const actualSchema = signature(reader.schema);
        if (expectedSchema && actualSchema !== expectedSchema) throw new Error('Independent streams returned incompatible schemas.');
        expectedSchema = actualSchema;
        for await (const batch of reader) {
          signal.throwIfAborted();
          await target.append(tableToIPC(new Table(batch), 'stream'), !created);
          created = true;
          progress.batches++; progress.rows += batch.numRows; onProgress({ ...progress });
        }
        // Consume through HTTP EOF even when the decoder stops at the IPC end marker.
        for await (const _chunk of source) { /* framing and budget are checked above */ }
        framing.finish();
        if (!created) {
          // A schema-only dictionary stream needs empty dictionaries and a zero-row
          // batch for DuckDB's Arrow scanner to materialize its columns.
          const empty = new Table(Object.fromEntries(reader.schema.fields.map(f => [f.name, vectorFromArray([], f.type)])));
          await target.append(tableToIPC(empty, 'stream'), true);
          created = true;
        }
      } finally {
        signal.removeEventListener('abort', abort);
        await reader?.cancel();
        await network.cancel().catch(() => undefined);
        network.releaseLock();
      }
    }
    signal.throwIfAborted();
    if (!created) throw new Error('No schema-bearing Arrow streams were returned.');
    await target.publish(resource);
    return progress;
  } catch (error) {
    await target.discard();
    if (signal.aborted) throw new DOMException('Read cancelled; no partial data published.', 'AbortError');
    // Transport errors are sanitized; Arrow/engine diagnostics may contain row values.
    if (error instanceof Error && /^(Import exceeds|Independent streams|Incomplete Arrow|Arrow stream|Expected modern|Invalid Arrow|Each allocation|Allocation |Malformed allocation|Duplicate allocation|Invalid allocation|Network request|Access denied|Authentication|Unavailable or|Service request)/.test(error.message))
      throw error;
    throw new Error('Arrow decoding or local import failed. No partial data was published.');
  }
}
