import { createRequire } from 'node:module';
import { expect, test } from 'vitest';
import { ConsoleLogger, createDuckDB, NODE_RUNTIME } from '@duckdb/duckdb-wasm/blocking';
import { dashboardQueries } from '../src/dashboard';

const require = createRequire(import.meta.url);

test.each(['VARCHAR', 'TIMESTAMP', 'TIMESTAMPTZ'])('related lots use the Paris clock for %s start times', async type => {
  const dist = require.resolve('@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm').replace(/duckdb-mvp\.wasm$/, '');
  const db = await createDuckDB({ mvp: { mainModule: `${dist}duckdb-mvp.wasm`, mainWorker: `${dist}duckdb-node-mvp.worker.cjs` } },
    new ConsoleLogger(), NODE_RUNTIME);
  await db.instantiate();
  const conn = db.connect();
  // Same lockdown as the app: no time zone extension is available.
  conn.query('SET enable_external_access = false');
  conn.query('SET autoload_known_extensions = false');
  conn.query('CREATE SCHEMA history; CREATE SCHEMA dbo');
  conn.query(`CREATE TABLE history.lot_history AS SELECT * FROM (VALUES
    ('YG-2291', 'SUP-014', 'AVD-L2', CAST('2026-10-11T20:00:00Z' AS ${type})),
    ('SUMMER-0000', 'SUP-014', 'AVD-L2', CAST('2026-10-04T22:00:00Z' AS ${type})),
    ('UTC-ONLY', 'SUP-014', 'AVD-L2', CAST('2026-10-05T01:00:00Z' AS ${type})),
    ('WINTER-2200', 'SUP-014', 'AVD-L2', CAST('2026-10-25T21:00:00Z' AS ${type})),
    ('WINTER-0030', 'SUP-014', 'AVD-L2', CAST('2026-10-25T23:30:00Z' AS ${type})),
    ('TOO-OLD', 'SUP-014', 'AVD-L2', CAST('2026-07-12T20:00:00Z' AS ${type})),
    ('OTHER-LINE', 'SUP-014', 'AVD-L1', CAST('2026-10-11T20:00:00Z' AS ${type}))
  ) t(lot_id, supplier_id, production_line, production_start_utc)`);
  conn.query(`CREATE TABLE history.shipment_history AS SELECT * FROM (VALUES
    ('YG-2291', 'STR-001'), ('YG-2291', 'STR-001'), ('YG-2291', 'STR-002'), ('WINTER-2200', 'STR-050'),
    ('SUMMER-0000', 'STR-099'), ('OTHER-LINE', 'STR-003')) t(lot_id, store_id)`);
  conn.query(`CREATE TABLE dbo.locations AS SELECT * FROM (VALUES
    ('STR-001', 'North'), ('STR-002', 'North'), ('STR-003', 'North'), ('STR-050', 'South')) t(location_id, region)`);

  const queries = dashboardQueries('YG-2291');
  expect(conn.query(queries.relatedLots.sql).toArray().map(r => r.toJSON())).toEqual([
    { lot_id: 'SUMMER-0000', start_paris: '2026-10-05 00:00:00' },
    { lot_id: 'YG-2291', start_paris: '2026-10-11 22:00:00' },
    { lot_id: 'WINTER-2200', start_paris: '2026-10-25 22:00:00' },
    { lot_id: 'WINTER-0030', start_paris: '2026-10-26 00:30:00' },
  ]);
  expect(conn.query(queries.relatedReach.sql).toArray().map(r => ({ ...r.toJSON(), stores: Number(r.stores) }))).toEqual([
    { region: 'North', stores: 2 },
    { region: 'Region not visible', stores: 1 },
    { region: 'South', stores: 1 },
  ]);
  conn.close();
  await db.reset();
});
