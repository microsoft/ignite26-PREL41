import { literal } from './database';
import type { Resource } from './transport';

export const AS_OF = '2026-10-13 04:00:00';
export const MANIFEST: Resource[] = ['lots', 'products', 'locations', 'store_inventory', 'supplier_certificates']
  .map(table => ({ schema: 'dbo', table }));
export const key = (r: Resource) => `${r.schema}.${r.table}`;
/** Loaded on demand. Only the columns the related-lot analysis needs keep shipment_history inside the download budget. */
export const HISTORY: Resource[] = [
  { schema: 'history', table: 'lot_history', columns: ['lot_id', 'supplier_id', 'production_line', 'production_start_utc'] },
  { schema: 'history', table: 'shipment_history', columns: ['lot_id', 'store_id'] },
];
/** Related lots: same supplier and line, started in the 90 days before AS_OF. */
export const LOOKBACK_START_UTC = '2026-07-15 04:00:00';
/** The weekly run is scheduled on Paris time: Sunday 22:00 to Monday 02:00. */
export const RUN_WINDOW = 'Sunday 22:00 to Monday 02:00, Paris time';

// DuckDB's time zone extension can't load here (external access is off), so apply the EU daylight saving rule:
// UTC+2 from 01:00 UTC on the last Sunday of March to 01:00 UTC on the last Sunday of October, otherwise UTC+1.
const lastSunday = (month: number) =>
  `CAST(make_date(year(start_utc), ${month}, 31) - CAST(dayofweek(make_date(year(start_utc), ${month}, 31)) AS INTEGER) AS TIMESTAMP) + INTERVAL 1 HOUR`;
function relatedLotsSql(l: string) {
  return `WITH target AS (SELECT supplier_id, production_line FROM history.lot_history WHERE lot_id = ${l} LIMIT 1),
    utc AS (SELECT h.lot_id, CAST(h.production_start_utc AS TIMESTAMP) AS start_utc
      FROM history.lot_history h JOIN target t USING(supplier_id, production_line)),
    paris AS (SELECT lot_id, start_utc + CASE WHEN start_utc >= ${lastSunday(3)} AND start_utc < ${lastSunday(10)}
      THEN INTERVAL 2 HOUR ELSE INTERVAL 1 HOUR END AS start_paris FROM utc
      WHERE start_utc >= TIMESTAMP '${LOOKBACK_START_UTC}')
    SELECT lot_id, start_paris FROM paris
    WHERE (dayofweek(start_paris) = 0 AND hour(start_paris) >= 22) OR (dayofweek(start_paris) = 1 AND hour(start_paris) < 2)`;
}

/** `loaded` lists the tables this identity could read; the lot card joins product names only when available. */
export function dashboardQueries(lot: string, loaded: ReadonlySet<string> = new Set()) {
  const l = literal(lot);
  const products = loaded.has('dbo.products');
  return {
    lot: {
      requires: ['dbo.lots'],
      sql: `SELECT l.lot_id, l.product_id, ${products ? 'p.product_name' : 'NULL AS product_name'}, l.supplier_id,
        l.production_line, l.production_start_utc, l.production_end_utc, l.expires_on
        FROM dbo.lots l ${products ? 'LEFT JOIN dbo.products p ON p.product_id = l.product_id ' : ''}WHERE l.lot_id = ${l}`,
    },
    supplierLots: {
      requires: ['dbo.lots'],
      sql: `SELECT supplier_id, COUNT(*) AS lots FROM dbo.lots GROUP BY supplier_id ORDER BY supplier_id`,
    },
    inventory: {
      requires: ['dbo.store_inventory', 'dbo.locations'],
      sql: `SELECT COUNT(DISTINCT i.location_id) AS stores, COALESCE(SUM(i.units_on_hand), 0) AS units
        FROM dbo.store_inventory i JOIN dbo.locations loc USING(location_id)
        WHERE i.lot_id = ${l} AND i.units_on_hand > 0 AND loc.location_type = 'store'`,
    },
    documents: {
      requires: ['dbo.supplier_certificates', 'dbo.lots'],
      sql: `SELECT c.certificate_id, c.certificate_type, c.status, c.expiration_date, c.document_path
        FROM dbo.supplier_certificates c JOIN dbo.lots l USING(supplier_id)
        WHERE l.lot_id = ${l} ORDER BY c.certificate_id`,
    },
    relatedLots: {
      requires: ['history.lot_history'],
      sql: `SELECT lot_id, CAST(start_paris AS VARCHAR) AS start_paris FROM (${relatedLotsSql(l)}) ORDER BY start_paris`,
    },
    relatedReach: {
      requires: ['history.lot_history', 'history.shipment_history', 'dbo.locations'],
      sql: `SELECT COALESCE(loc.region, 'Region not visible') AS region, COUNT(DISTINCT s.store_id) AS stores
        FROM history.shipment_history s JOIN (${relatedLotsSql(l)}) r USING(lot_id)
        LEFT JOIN dbo.locations loc ON loc.location_id = s.store_id
        GROUP BY ALL ORDER BY region`,
    },
  };
}
export type SectionName = keyof ReturnType<typeof dashboardQueries>;

/** Only explicit HTTPS roots and traversal-free relative document paths are linkable. */
export function documentUrl(base: string, path: string): string | undefined {
  try {
    const root = new URL(base.endsWith('/') ? base : `${base}/`);
    if (root.protocol !== 'https:' || root.username || root.password || root.search || root.hash) return;
    let decoded = path;
    for (let i = 0; i < 5; i++) {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    }
    if (!decoded || /[:\\?#%\u0000-\u0020]/.test(decoded) || decoded.startsWith('/') ||
      decoded.split('/').some(s => !s || s === '.' || s === '..')) return;
    const url = new URL(decoded.split('/').map(encodeURIComponent).join('/'), root);
    if (url.origin !== root.origin || !url.pathname.startsWith(root.pathname)) return;
    return url.href;
  } catch { return; }
}
