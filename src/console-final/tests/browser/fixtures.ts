import { tableFromArrays, tableToIPC } from 'apache-arrow';

/** Synthetic test-only model. Never imported by production application code. */
export function fixtureTables(variant: 'full' | 'restricted' = 'full') {
  const lots = [
    { lot_id: 'YG-2291', product_id: 'PRD-007', supplier_id: 'SUP-014', production_line: 'AVD-L2',
      production_start_utc: '2026-10-11T20:00:00Z', production_end_utc: '2026-10-12T00:00:00Z', expires_on: '2026-11-08' },
    { lot_id: 'YG-2284', product_id: 'PRD-007', supplier_id: 'SUP-014', production_line: 'AVD-L2',
      production_start_utc: '2026-10-04T20:00:00Z', production_end_utc: '2026-10-05T00:00:00Z', expires_on: '2026-11-01' },
    { lot_id: 'SYN-0081', product_id: 'PRD-011', supplier_id: 'SUP-008', production_line: 'FPP-L1',
      production_start_utc: '2026-10-02T06:00:00Z', production_end_utc: '2026-10-02T12:00:00Z', expires_on: '2026-10-16' },
    { lot_id: 'SYN-0211', product_id: 'PRD-018', supplier_id: 'SUP-021', production_line: 'NFF-L1',
      production_start_utc: '2026-10-03T06:00:00Z', production_end_utc: '2026-10-03T12:00:00Z', expires_on: '2026-10-30' },
    { lot_id: 'SYN-0212', product_id: 'PRD-018', supplier_id: 'SUP-021', production_line: 'NFF-L1',
      production_start_utc: '2026-10-07T06:00:00Z', production_end_utc: '2026-10-07T12:00:00Z', expires_on: '2026-11-03' },
  ];
  const shipments = Array.from({ length: 13 }, (_, i) => ({
    shipment_id: `SYNTHETIC-${i}`, line_no: 1, store_id: `STORE-${i + 1}`, lot_id: 'YG-2291', carrier_id: 'CAR-02',
  }));
  // Restricted identity: OneLake row security returns only the SUP-014 lots.
  const visibleLots = variant === 'full' ? lots : lots.filter(l => l.supplier_id === 'SUP-014');
  const tables: Record<string, Record<string, unknown>[]> = {
    lots: visibleLots,
    products: [{ product_id: 'PRD-007', product_name: 'Synthetic Greek yogurt 500 g' }],
    locations: [...Array.from({ length: 13 }, (_, i) => ({ location_id: `STORE-${i + 1}`, location_type: 'store', region: i < 8 ? 'North' : 'South' })),
      { location_id: 'DC-01', location_type: 'dc', region: 'North' }],
    store_inventory: [...Array.from({ length: 9 }, (_, i) => ({ location_id: `STORE-${i + 1}`, lot_id: 'YG-2291', units_on_hand: i + 1 })),
      { location_id: 'DC-01', lot_id: 'YG-2291', units_on_hand: 100 },
      { location_id: 'STORE-10', lot_id: 'YG-2291', units_on_hand: 0 }],
    supplier_certificates: [{ certificate_id: 'SYNTHETIC-CERT', supplier_id: 'SUP-014',
      certificate_type: 'Synthetic safety certificate', status: 'Test only',
      expiration_date: '2027-01-01', document_path: 'certificates/SUP-014.txt' }],
    // YG-2250 started at 03:00 Paris time, outside the weekly run.
    lot_history: [...lots, { lot_id: 'YG-2250', supplier_id: 'SUP-014', production_line: 'AVD-L2', production_start_utc: '2026-10-05T01:00:00Z' }]
      .map(({ lot_id, supplier_id, production_line, production_start_utc }) => ({ lot_id, supplier_id, production_line, production_start_utc })),
    shipment_history: [...shipments.map(({ lot_id, store_id }) => ({ lot_id, store_id })),
      { lot_id: 'YG-2284', store_id: 'STORE-1' }, { lot_id: 'YG-2250', store_id: 'STORE-2' }],
  };
  return Object.fromEntries(Object.entries(tables).map(([name, rows]) => {
    const columns = Object.fromEntries(Object.keys(rows[0]).map(k => [k, rows.map(row => row[k])]));
    return [name, tableToIPC(tableFromArrays(columns), 'stream')];
  }));
}
