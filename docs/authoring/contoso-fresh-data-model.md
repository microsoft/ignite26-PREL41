# Contoso Fresh data model

Module 2 defines this model and generates its data. Module 1 and the later
modules use it to join their data to Module 2's shipment history. All records
are synthetic.

## Fixed facts

These facts come from the Supplier Quality content in
[`data/sharepoint/`](../../data/sharepoint/). The generated data agrees with
them.

| Fact | Value |
|---|---|
| Affected lot | YG-2291, Contoso Fresh Greek Yogurt 500 g |
| Supplier | SUP-014 Alpine Valley Dairy Cooperative |
| Production window | 2026-10-11 22:00 to 2026-10-12 02:00 Europe/Paris |
| Recall notice | RCL-2026-1013-01, issued 2026-10-13 06:00 Europe/Paris |
| Suppliers | SUP-008 Fabrikam Produce Partners, SUP-014 Alpine Valley Dairy Cooperative, SUP-021 Northwind Frozen Foods, SUP-027 Woodgrove Creamery |
| Cold-chain rule | Above 4 C for more than 20 minutes |
| Access rules | Regional managers see one region. Logistics partners see only their own shipments and never supplier cost. |

## Scenario clock

The data stops at `AS_OF`, 2026-10-13 06:00 Europe/Paris, which is 04:00 UTC.
The generator and the notebook use this constant instead of the current time,
so the recall answer stays the same after the event.

- History starts on 2021-10-13.
- The last 90 days start at 2026-07-15 04:00 UTC.
- Timestamps are stored in UTC. Queries compare production windows in
  Europe/Paris time. Every date in scope falls in summer time, UTC+2.

## Conventions

| Entity | ID format | Example |
|---|---|---|
| Supplier | `SUP-` and three digits | SUP-014 |
| Product | `PRD-` and three digits | PRD-007 |
| Store | `STR-` and three digits | STR-042 |
| Distribution center | `DC-` and two digits | DC-02 |
| Carrier | `CAR-` and two digits | CAR-03 |
| Truck | `TRK-` and three digits | TRK-017 |
| Lot | A two-letter product code, a hyphen, and four digits | YG-2291 |
| Shipment | `SHP-` and six digits | SHP-104233 |

Columns ending in `_utc` hold ISO 8601 UTC timestamps, such as
`2026-10-11T20:00:00Z`. Dates use `YYYY-MM-DD`. Amounts ending in `_eur` are
euros with two decimals.

## Current-state tables

Module 1 owns these tables. Module 2's generator writes them as CSV files in
`data/reference/`, one file per table, such as `data/reference/lots.csv`. The
files are committed to the repository, and Skillable loads them for Module 1.
The generator is the first code cell of
[`module-2-shipment-history.ipynb`](../../src/notebooks/module-2-shipment-history.ipynb).
To regenerate the files, run that cell outside Fabric from anywhere inside the
repository. In Fabric, the cell also writes them to `Files/reference/` in the
lakehouse.

| Table | Key | Other columns | Rows |
|---|---|---|---|
| suppliers | supplier_id | supplier_name, category, country | 4 |
| products | product_id | product_name, supplier_id, category, pack_size, shelf_life_days, max_storage_c | 24, 6 per supplier |
| locations | location_id | location_name, location_type, city, region, opened_on | 80 stores and 3 distribution centers |
| carriers | carrier_id | carrier_name, is_logistics_partner | 4 |
| trucks | truck_id | carrier_id, home_dc_id, reefer_model | 40 |
| lots | lot_id | product_id, supplier_id, production_line, production_start_utc, production_end_utc, expires_on, units_produced, supplier_unit_cost_eur | About 300 |
| store_inventory | location_id, lot_id | units_on_hand, last_counted_utc | About 1,500 |

- `location_type` is `store` or `dc`. Regions are North, South, East, West,
  and Central.
- The carriers are Contoso Fresh Fleet, Wide World Logistics, Relecloud
  Freight, and Proseware Transport. `is_logistics_partner` is true for the
  three outside carriers and false for Contoso Fresh Fleet.
- `lots` holds only unexpired lots. Every row in `lots` also appears in
  `lot_history`.
- These tables have no orders or shipments. Shipment records live only in
  `shipment_history`.

## History tables

Module 2 owns these tables. The first code cell of the Module 2 notebook
generates them as CSV files under `Files/history/` in the lakehouse. Spark then
writes them as Apache Iceberg tables. They aren't committed to the repository.

### lot_history

One row per lot made since 2021-10-13, about 17,000 rows. It has the columns
of `lots` plus `qa_note`, a short QA comment on about 5% of lots. The key is
`lot_id`.

### shipment_history

One row per shipment line. A shipment is one truck delivery from a
distribution center to one store, and each line carries one lot. The table
holds about 110,000 shipments and 1.2 million lines. The key is
`shipment_id` and `line_no`. The table is partitioned by
`month(shipped_at_utc)`.

| Column | Joins to | Notes |
|---|---|---|
| shipment_id, line_no | | Key |
| shipped_at_utc, delivered_at_utc | | |
| origin_dc_id | locations | |
| store_id | locations | |
| carrier_id | carriers | |
| truck_id | trucks | Module 3 joins telemetry on truck and time. |
| lot_id | lot_history | |
| product_id | products | |
| supplier_id | suppliers | |
| cases | | |
| supplier_cost_eur | | Module 4 hides this column from logistics partners. |
| status | | `delivered`, `short`, `refused`, or `late` |
| driver_note | | Free text on about 4% of lines. About a third are in French. |

### Correction file

The generator also writes `Files/history/corrections_2026-10-13.csv`, a late
carrier file. Module 2 applies it to `shipment_history` with Iceberg DML. Each
row has the `shipment_history` columns and an `action` column set to `insert`,
`update`, or `delete`. Rows match on `shipment_id` and `line_no`.

| Action | Change |
|---|---|
| insert | Adds a late YG-2291 shipment to a 13th store. |
| update | Corrects the store on one related-lot shipment. |
| delete | Removes 20 duplicate lines from a double upload. |

## Where the tables live

Module 2 writes everything to one lakehouse with schemas on: the lakehouse
that holds Module 1's `SupplierQuality` shortcut. Skillable sets its name.

| Data | Location | Format |
|---|---|---|
| Current-state files | `Files/reference/`, one file per table | CSV |
| History files and the correction file | `Files/history/` | CSV |
| suppliers, products, locations, carriers, trucks, lots, store_inventory | `dbo` schema | Apache Iceberg |
| lot_history, shipment_history | `history` schema | Apache Iceberg |

Module 2 builds its `dbo` tables from `Files/reference/` and doesn't read
Module 1's copy of the current state.

Spark writes each table to the lakehouse **Tables** folder, at
`Tables/<schema>/<table>`. Other engines read the tables through the OneLake
Iceberg REST catalog at `https://onelake.table.fabric.microsoft.com/iceberg`,
with the warehouse `<workspace ID>/<lakehouse ID>`. The SQL analytics endpoint
and Fabric data agents read the same files as Delta tables, which OneLake
builds from the Iceberg metadata without copying data.

## Recall answer

The recall SOP asks which historical lots relate to the supplier batch window.
The data treats that window as a recurring slot. SUP-014 makes Greek yogurt on
production line `AVD-L2` every Sunday night from 22:00 to 02:00 Europe/Paris.

A related lot is a SUP-014 lot on `AVD-L2` whose production starts inside that
window, from 22:00 up to but not including 02:00, on or after the 90-day
cutoff. The data has 13 related lots: YG-2291 and one lot on each of the 12
Sundays before it, from 2026-07-19 to 2026-10-04.

Start times vary across the window. 8 related lots start before midnight
Paris time, YG-2291 among them, and 5 start after midnight. In UTC the window
runs from Sunday 20:00 to Monday 00:00. A query that checks 22:00 to 02:00 on
the UTC clock returns 6 lots, the 5 late starters and the 02:00 control lot
below, and misses YG-2291.

The data also holds control lots that a correct query excludes. Times are
Paris time.

| Control lot | Why the query excludes it |
|---|---|
| `AVD-L2`, Sunday 2026-07-12 at 22:00 | Before the 90-day cutoff |
| `AVD-L1`, Sunday 2026-09-27 inside the window | Different production line |
| `AVD-L2`, Monday 2026-10-12 at 02:00, the lot after YG-2291 | The window ends before 02:00 |
| `AVD-L2`, Saturday 2026-09-19 at 23:00 | Wrong day |
| SUP-027 Woodgrove Creamery, inside the window | Different supplier |

Other results the data produces:

- 9 stores hold YG-2291 in `store_inventory`. That's the answer to
  Exercise 1.4.
- YG-2291 shipped to 12 stores in the North and East regions. After the
  correction file, it shipped to 13.
- The 13 related lots together reached 44 stores in all five regions, and 45
  after the correction file.
