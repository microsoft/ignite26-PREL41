# Build the Contoso Fresh recall console

At 6:00 AM, a supplier warns Contoso Fresh about a possible contamination in
yogurt lot **YG-2291**. As a data and analytics engineer, you must unify the
operational, historical, streaming, and document data needed to help regional
managers act before noon.

In this workshop, you will build a governed data estate in Microsoft Fabric and
use it to answer five recall questions:

1. Which stores have the affected lot?
1. Where else has the supplier's product traveled?
1. Were the trucks kept below the required temperature?
1. Which users are allowed to see each part of the data?
1. Can regional managers use one console to investigate the recall?

**Duration:** Approximately 4 hours, including a 10-minute break.

**Prerequisites:** The Skillable environment provides a Microsoft Fabric
workspace, workshop data, and access to the Contoso Fresh SharePoint content.
Use only the accounts and resources supplied in the lab.

**Success criteria:** At the end of the workshop, you can demonstrate a recall
console that combines the affected stores, shipment history, temperature
status, and supplier documents while respecting OneLake Security.

> [!Note] This workshop uses pre-provisioned resources. Do not create additional
> capacities, tenants, or external accounts.

===

# Prepare your environment

In this module, you will confirm that the supplied services and data are ready
before you begin the recall investigation.

## Exercise 0.1: Open the lab

Sign in with the account supplied by Skillable and open the pre-provisioned
Contoso Fresh workspace.

**Completion check:** The workspace opens and its supplied Fabric items are
visible.

Use this same instruction sequence for both delivery paths. In a guided
session, follow the instructor's checkpoints. When working self-paced,
complete each check before moving on.

Before continuing, locate the operational data source, the schema-enabled
lakehouse, the Module 2 notebook, and the supplied SharePoint connection.
Later modules also require the telemetry replay, restricted test identities,
and Recall Console starter. If an item or identity is missing, notify the
instructor; do not create a personal replacement or use your own account.

## Exercise 0.2: Review the recall

Review the five recall questions on the workshop landing page and identify the
data source that contributes to each answer.

**Completion check:** You can explain why the investigation requires
operational data, historical data, telemetry, supplier documents, and governed
access.

===

# Unify operational data

In this module, you will bring operational and unstructured data into a single
OneLake view without building a copy pipeline.

## Exercise 1.1: Explore operations

Explore the supplied Contoso Fresh current-state data and identify the lots,
products, suppliers, locations, and store inventory needed for the recall.

1. Open the supplied operational data source, **contoso_operations**.
1. Find lot **YG-2291** and identify its product and supplier.
1. Find the store inventory records for that lot.
1. Use the location records to identify each store's region.

The current-state source contains seven tables: `suppliers`, `products`,
`locations`, `carriers`, `trucks`, `lots`, and `store_inventory`. Keep its SQL
analytics endpoint separate from the destination lakehouse's endpoint:
Module 2 creates its own Iceberg representation of the same reference data.
Do not load current-state tables into the destination lakehouse's `dbo`
schema manually.

YG-2291 is **Contoso Fresh Greek Yogurt 500 g**, supplied by **SUP-014**.
Its production line is **AVD-L2**. The production interval is
2026-10-11 20:00 to 2026-10-12 00:00 UTC, or 22:00 to 02:00 Europe/Paris.
The investigation clock is fixed at **2026-10-13 04:00 UTC**; it does not
advance with today's date.

Current-state inventory answers which stores hold the lot now. It does not
contain orders or shipment records. In Module 2, you will use historical
shipments to find every store that received the lot, including stores that no
longer hold it.

**Completion check:** You can locate the affected lot in the operational data
and explain the difference between stock currently held and historical
deliveries.

## Exercise 1.2: Link supplier documents

The supplier certificates and recall procedure remain in SharePoint. In this
exercise, you will make that content available in OneLake without copying it or
creating an ingestion pipeline.

### Check for an existing shortcut

1. In the lakehouse **Explorer** pane, expand **Files**.
1. Look for a shortcut named **SupplierQuality**.
1. If the shortcut exists, open it and verify that you can see the supplier
   certificate content and recall procedure, then continue to the completion
   check.

> [!Note] This state check makes the exercise safe to resume. Do not create a
> second shortcut with a different name.

### Start the shortcut

1. In the **Explorer** pane, select the ellipsis (**...**) next to **Files**.
1. Select **New shortcut**.
1. In the **New shortcut** window, under **External sources**, select
   **SharePoint Folder**.

> [!Knowledge] A shortcut is a pointer to the source location. The files remain
> in SharePoint, and deleting the shortcut does not delete the source content.

### Select the supplier content

1. On the connection page, select **Existing connection**.
1. Select the connection supplied for the Contoso Fresh Supplier Quality
   content.
1. Select **Next**.
1. Browse to the **supplierQuality** library or folder.
1. Select the checkbox next to the folder that contains the supplier
   certificates and recall procedure.
1. Select **Next**.

> [!Alert] Use only the connection supplied in the lab. If the connection is
> missing or Fabric asks you to create or sign in to a connection, stop and
> notify the instructor.

### Create and inspect the shortcut

1. On the **Transform** page, select **Skip**. You will transform the
   certificate metadata in Exercise 1.3.
1. On the review page, select the pencil icon for the shortcut.
1. For the shortcut name, enter ++SupplierQuality++, and then save the name.
1. Verify that the selected source is the **supplierQuality** content, and then
   select **Create**.
1. Wait for the lakehouse to refresh and display **SupplierQuality** under
   **Files**.
1. Open **SupplierQuality** and verify that you can browse the supplier
   certificates and recall procedure.

> [!Help] If the shortcut appears but its content is unavailable, refresh the
> lakehouse. If the problem continues, confirm that you selected the Supplier
> **supplierQuality** folder and notify the instructor so the supplied
> SharePoint access can be checked.

**Completion check:** The supplier certificates and recall procedure are
visible under **Files** > **SupplierQuality**, and no source files were copied
into the lakehouse.

## Exercise 1.3: Prepare certificate data

Transform the supplied certificate metadata into a queryable table for the
recall investigation.

### Check the source and resume state

1. Open **Files** > **SupplierQuality** > **metadata** and confirm that
   `supplier-certificates.csv` is readable.
1. Confirm that the folder contains the supplied CSV, not a mixture of CSV
   and JSON versions. If both versions were provisioned, notify the instructor
   before starting the transformation.
1. Under **Tables** > **dbo**, look for **supplier_certificates**. If it
   exists, open its shortcut management details and confirm that it points to
   the supplied metadata folder. Reuse a matching, successful transformation.
   Do not replace an unrelated table or create a duplicate.

### Create the certificate table

1. In the destination lakehouse, open the menu for the **dbo** schema under
   **Tables**, then select **New table shortcut**.
1. Choose **SharePoint Folder** and the same supplied existing connection
   used in Exercise 1.2.
1. Select the **metadata** folder within **supplierQuality**, rather than the
   whole library. The certificate text, notice, and procedure files are not
   tabular input.
1. Configure CSV transformation with a comma delimiter and **First row as
   headers** enabled.
1. Name the table shortcut ++supplier_certificates++. Disable
   **Include subfolders** if that option is shown, review the source and
   destination, then create the shortcut.
1. Use **Manage shortcut** to inspect its status and refresh history. Wait
   for a successful initial transformation before opening the table.

> [!Knowledge] The document shortcut in Exercise 1.2 remains a pointer to
> SharePoint. This structured-file transformation is different: Fabric
> materializes a managed Delta table and synchronizes it with the source.
> You have not built a copy pipeline, but the transformed table is a copy.
> Do not edit its rows directly; the source metadata owns those records.

### Inspect the result

Confirm that the table has **4 certificate records** with distinct
`certificate_id` values. Find **CERT-2026-014**, for **SUP-014**:

- Certificate type: **SQF Food Safety Code**.
- Status: **Active**, with `is_current` true.
- Expiration date: **2027-02-28**.
- Audit score: **96**.
- Document path: `certificates/SUP-014_SQF_Certificate.txt`, relative to
  **Files** > **SupplierQuality**.

Open that certificate through the document shortcut. Also open
`notices/YG-2291_Supplier_Recall_Notice.txt` and the recall procedure under
`procedures`. An active supplier certificate does not make a recalled lot
safe: the recall notice still applies.

If the transformation fails, inspect its reported error and source folder.
Do not upload a local substitute or repeatedly recreate the shortcut.

**Completion check:** `dbo.supplier_certificates` contains four records,
SUP-014 resolves to its readable certificate, and the original document
shortcut remains available.

## Exercise 1.4: Find affected stores

Use the SQL analytics endpoint to join the operational data and identify stores
that currently hold lot **YG-2291**.

1. Open the SQL analytics endpoint of **contoso_operations**, the supplied operational source,
   not the destination lakehouse that Module 2 has yet to populate.
1. Create a SQL query and run:

   ```sql
   SELECT
       i.location_id AS store_id,
       l.location_name,
       l.region,
       i.units_on_hand
   FROM dbo.store_inventory AS i
   INNER JOIN dbo.locations AS l
       ON l.location_id = i.location_id
   WHERE i.lot_id = 'YG-2291'
       AND i.units_on_hand > 0
       AND l.location_type = 'store'
   ORDER BY i.location_id;
   ```

1. Confirm **9 stores**. The North stores are **STR-003, STR-004, STR-008,
   STR-010, STR-013, STR-014, STR-015, and STR-016**. **STR-028** is in
   **East**.
1. Keep the result for comparison with Module 2. This is current inventory,
   not every store that received the lot.

If the tables are missing, verify that you opened the supplied source's
endpoint and ask the instructor to check provisioning. Do not generate
Module 2's data early to hide a missing operational source.

**Completion check:** The query returns the nine stores above, with eight in
North and one in East, and all quantities are positive.

===

# Add shipment history

In this module, you will write five years of shipment history as Apache Iceberg
tables in OneLake. You will then read the same tables with Spark, DuckDB, AI
Functions, and a Fabric data agent to find where else the supplier's product
has traveled.

All of Module 2 runs in the **module-2-shipment-history** notebook. Complete
the exercises in order:

1. [Exercise 2.1: Prepare the notebook and data](module-2/exercise-2-1-prepare-the-notebook-and-data.md)
1. [Exercise 2.2: Explore current state through OneLake](module-2/exercise-2-2-explore-current-state-through-onelake.md)
1. [Exercise 2.3: Write shipment history as Iceberg](module-2/exercise-2-3-write-shipment-history-as-iceberg.md)
1. [Exercise 2.4: Trace related lots with DuckDB](module-2/exercise-2-4-trace-related-lots-with-duckdb.md)
1. [Exercise 2.5: Read shipment notes with AI Functions](module-2/exercise-2-5-read-shipment-notes-with-ai-functions.md)
1. [Exercise 2.6: Ask the recall agent](module-2/exercise-2-6-ask-the-recall-agent.md)

After Exercise 2.6, return to this page and continue with the next module.

## Recover from an unavailable Spark session

If Spark cannot start or an exercise fails, keep the error and ask the
instructor to check the supplied environment. Do not repeatedly select
**Run all**, switch runtimes, install replacement packages, or delete tables.

The supplied **contoso_recall_fallback** lakehouse contains independently
loaded, corrected Delta data for the historical investigation. With
instructor approval:

1. Open that lakehouse's **SQL analytics endpoint**, not the notebook.
1. Run [the fallback recall checks](../src/sql/fallback-recall-checks.sql).
1. Confirm nine current stores, thirteen receiving stores, thirteen related
   lots, forty-five reached stores in five regions, 16,961 lot rows,
   1,165,374 shipment rows, and zero duplicate shipment keys or removed
   duplicate lines.
1. Continue the read-only historical investigation with the instructor while
   the notebook environment is repaired.

This path supplies corrected answers, not Spark execution, Iceberg snapshots,
DuckDB credential vending, AI Functions, or SDK validation. Record those
exercises as not completed rather than claiming a pass from fallback results.
Do not attach the exercise notebook to the fallback or copy its Delta tables
over the notebook's owned Iceberg tables.

The fallback is on the same Fabric capacity and does not solve a capacity-wide
outage. It also does not automatically rebind later-module telemetry, document
shortcuts, application connectors, or reader permissions. The instructor must
verify any recovery handoff before continuing those modules; do not silently
substitute a different endpoint.

===

# Check temperature telemetry

In this module, you will add the real-time signal needed to determine whether
affected products remained within the cold-chain threshold.

## Exercise 3.1: Replay truck telemetry

Start the supplied Eventstream and observe new truck telemetry arriving in the
lakehouse.

1. Locate **contoso_truck_telemetry** and confirm that its lakehouse destination
   is **dbo.truck_temperature_events** in the supplied lakehouse.
1. Start the Eventstream and use the replay control supplied by the lab,
   or [run the supplied replay utility](#run-the-supplied-replay-utility)
   in its authorized terminal.
   If the control or producer is missing, stop and notify the instructor or lab
   support; do not create a personal connection or paste endpoint keys into
   browser code.
1. Confirm that the destination is running, then use the lakehouse SQL
   analytics endpoint to inspect:

   ```sql
   SELECT
       COUNT(*) AS raw_rows,
       COUNT(DISTINCT event_id) AS distinct_events,
       COUNT(DISTINCT shipment_id) AS shipments
   FROM dbo.truck_temperature_events;
   ```

1. If the supplied replay uses the workshop boundary fixture, expect **34
   distinct events for six shipments**. Its 35 input messages contain an
   intentional retry. Replaying can increase raw rows without changing the
   distinct events or their meaning.
1. Confirm that records contain `event_id`, `shipment_id`, `truck_id`,
   `event_time_utc`, and numeric `temperature_c`.

The first write can take longer than an ordinary batch. A **Running** inlet or
an accepted send is not proof that the destination table exists. If the table
is missing, have the instructor check actual sink output and SQL metadata
registration; do not substitute a local file upload.

**Completion check:** The destination contains actual replay observations,
with the expected distinct IDs, shipment IDs, observation times, and
temperatures.

### Run the supplied replay utility

Use this path only in the lab's authorized terminal with an existing Python
3.9 or newer interpreter, Fabio, and supplied account. Do not install tools or sign in
with a personal account to compensate for missing lab provisioning.

From the repository root, first validate the complete input:

```bash
python3 src/telemetry/replay.py \
  --input data/telemetry/replay-contract.jsonl --validate-only
```

Expect `validated_messages: 35`. Set `WORKSPACE_ID`, `EVENTSTREAM_ID`, and
`SOURCE_ID` to the supplied workspace, **contoso_truck_telemetry** item, and
**truck_replay** inlet IDs. Check the destination is **Running** before
publishing:

```bash
fabio eventstream get-topology \
  --workspace "$WORKSPACE_ID" --id "$EVENTSTREAM_ID" \
  --query 'destinations[].{name:name,status:status}'
```

Pipe the source connection directly into the producer. Never print, save,
or paste this response into application code:

```bash
set -o pipefail
fabio eventstream get-source-connection \
  --workspace "$WORKSPACE_ID" --id "$EVENTSTREAM_ID" --source-id "$SOURCE_ID" \
  --query '{fullyQualifiedNamespace:fullyQualifiedNamespace,eventHubName:eventHubName,accessKeys:{primaryConnectionString:accessKeys.primaryConnectionString}}' \
  | python3 src/telemetry/replay.py \
      --input data/telemetry/replay-contract.jsonl
```

Expect `accepted_messages: 35`. The accompanying
`destination_verified: false` is intentional: return to the SQL check above
to verify actual output. If publishing fails partway through, resolve the
reported problem and replay the same file. Do not change retry IDs or delete
the destination table. Do not enable shell tracing or verbose HTTP logging.

## Exercise 3.2: Identify temperature breaches

Find shipments that remained above **4 C** for more than 20 minutes and join
them to the affected lots.

The rule is strict: **4 C is not above 4 C**, and **20 minutes is not more
than 20 minutes**.

Open [the supplied temperature-status SQL](../src/sql/module-3-temperature-status.sql)
and run the complete batch in the lakehouse's SQL analytics endpoint.
It validates input before producing a result. If it reports an error, stop
and investigate that message rather than deleting its validation statements.
Run it outside an existing transaction: it uses its own read transaction so
validation and calculation see the same snapshot while new events arrive.
This is the engineer's investigation query; it does not grant reader
identities access to the raw telemetry table.

1. Deduplicate exact event retries before calculating duration. Conflicting
   payloads for one event ID, or different readings at the same journey
   timestamp, require investigation rather than an arbitrary choice.
1. Order readings by `event_time_utc` within each shipment and truck, not by
   arrival order. The boundary fixture uses a five-minute cadence.
1. Treat a reading as applying until the next observation only when the gap
   is at most five minutes. A larger gap breaks continuity. A final reading
   without a successor has no demonstrated duration.
1. Measure each uninterrupted above-threshold interval separately. A cooling
   reading closes the interval; never sum separate hot intervals to cross
   the twenty-minute threshold.
1. Join journey context from shipment history using both `shipment_id` and
   `truck_id`, checking observation times against the delivery interval.
   Deduplicate the shipment's line-level context first so a reading is not
   multiplied by the number of lots on that shipment.
1. Compare the boundary fixture's observed-window results:

   | Shipment | Longest confirmed hot interval | Expected window result |
   |---|---:|---|
   | SHP-209403 | 25 minutes | Breach |
   | SHP-209404 | 20 minutes | No observed breach |
   | SHP-209408 | 0 minutes | No observed breach; readings are exactly 4 C |
   | SHP-209410 | 15 minutes | No observed breach; do not add its separate hot intervals |
   | SHP-209414 | 5 minutes | Insufficient data across its observation gap |
   | SHP-209415 | 25 minutes | Breach, despite out-of-order arrival and a retry |

The fixture does not cover complete journeys. A confirmed breach is sufficient
to flag a shipment, but a partial window without a breach does not prove that
the entire delivery stayed cold. For these fixtures, **SHP-209403** and
**SHP-209415** are breached; the other four shipments have **Insufficient
data** for a whole-journey conclusion.

The query includes **all 13 shipments carrying YG-2291**, including the seven
without any fixture observations. Those seven also report **Insufficient
data**, with zero readings and no calculated hot duration. A shipment must
not disappear from the recall investigation just because its sensor is
missing.

### Complete the recall delivery coverage

After checking the boundary cases, replay the supplied
[coverage supplement](../data/telemetry/recall-coverage-supplement.jsonl)
through the same Eventstream. Use the replay procedure above with
`--input data/telemetry/recall-coverage-supplement.jsonl`. Validate first,
then expect **404 accepted messages**. Do not delete the original fixture.

1. Verify actual output now has **438 distinct event IDs for 13 shipments**.
   Raw counts can be higher after retries.
1. Run the complete temperature-status SQL again. Every affected delivery
   should now have observations at its start and end, without a gap exceeding
   five minutes.
1. Confirm **two breaches**—SHP-209403 and SHP-209415—and **eleven
   no-breach journeys**. SHP-209414 now has explicit readings in its formerly
   missing window; its longest hot interval is ten minutes. SHP-209416
   shares its truck's exactly-twenty-minute hot period and is not breached.
1. Have the instructor refresh and verify the governed temperature snapshot
   before continuing to the console.

These are additional synthetic observations, not a fallback that assumes
missing temperatures were safe. Without the supplement's actual persisted
records, preserve the original insufficient-data results.

**Completion check:** Your investigation distinguishes a confirmed breach,
no breach over a fully observed journey, and insufficient data. It does not
silently label missing telemetry as compliant.

===

# Govern recall access

In this module, you will apply OneLake Security so regional managers and a
logistics partner see only the data required for their roles.

## Exercise 4.1: Limit a regional manager

Create the **RegionalManagerNorth** role and limit regional records to North.
Use this alphanumeric role name; do not add spaces or punctuation.

### Check your starting point

The corrected history contains 13 receiving stores for YG-2291. Have the
instructor confirm that the destination lakehouse's SQL analytics endpoint
uses **User's identity access mode**. Delegated identity mode evaluates the
owner's SQL permissions instead of the reader's OneLake policies and is not
a valid way to test this exercise.

The restricted manager and partner accounts must have only the supplied
reader access. Do not make either account a workspace Admin, Member, or
Contributor, and do not grant it ReadAll access or access to the separate
operational source. Your engineer account remains able to configure the lab;
it is not a substitute for a restricted identity.

### Configure the role

1. Open the lakehouse's **Manage OneLake security** view. If
   **RegionalManagerNorth** already exists, inspect its configuration and
   reuse it only if it matches this exercise.
1. Create a grant role with **Read**, not **ReadWrite**, and **Selected
   data**, not **All data**.
1. Include `dbo.locations`, `dbo.store_inventory`, and
   `history.shipment_history`. Set row security separately on each table.
1. For `dbo.locations`, use:

   ```sql
   SELECT * FROM dbo.locations WHERE region = 'North'
   ```

1. North's stores in the fixed workshop data are **STR-001** through
   **STR-016**. Set the inventory rule to:

   ```sql
   SELECT * FROM dbo.store_inventory
   WHERE location_id IN (
       'STR-001', 'STR-002', 'STR-003', 'STR-004',
       'STR-005', 'STR-006', 'STR-007', 'STR-008',
       'STR-009', 'STR-010', 'STR-011', 'STR-012',
       'STR-013', 'STR-014', 'STR-015', 'STR-016'
   )
   ```

1. Set the shipment rule to the same explicit store list, using `store_id`:

   ```sql
   SELECT * FROM history.shipment_history
   WHERE store_id IN (
       'STR-001', 'STR-002', 'STR-003', 'STR-004',
       'STR-005', 'STR-006', 'STR-007', 'STR-008',
       'STR-009', 'STR-010', 'STR-011', 'STR-012',
       'STR-013', 'STR-014', 'STR-015', 'STR-016'
   )
   ```

   OneLake row rules do not support a join to `locations`. These lists are
   specific to the workshop snapshot, not a dynamic production-region policy.
1. Include `dbo.recall_temperature_status` and apply the same North
   `store_id` list in its own rule:

   ```sql
   SELECT * FROM dbo.recall_temperature_status
   WHERE store_id IN (
       'STR-001', 'STR-002', 'STR-003', 'STR-004',
       'STR-005', 'STR-006', 'STR-007', 'STR-008',
       'STR-009', 'STR-010', 'STR-011', 'STR-012',
       'STR-013', 'STR-014', 'STR-015', 'STR-016'
   )
   ```

   If the table is missing, have the instructor create and verify the derived
   snapshot. Do not substitute access to `dbo.truck_temperature_events`.
1. Include the shared reference tables `dbo.suppliers`, `dbo.products`,
   `dbo.carriers`, `dbo.trucks`, `dbo.lots`, and `history.lot_history`,
   plus `dbo.supplier_certificates` and **Files/SupplierQuality**. These
   references describe products and suppliers rather than regional activity.
   Do not grant **Files/reference**, **Files/history**, or **Files/.staging**: those raw CSVs
   would bypass table row rules.
1. Add only the supplied North manager identity and save the role.
1. Review that identity's other grants, including **DefaultReader** and any
   permission-group membership. OneLake grants are additive: a broader role
   can defeat the intended restriction. Ask the instructor to remove a
   conflicting grant for the test identity; do not delete a shared default
   role or change unrelated users' permissions.

**Completion check:** The role has four explicit regional table rules,
shared-reference access only where required, and the supplied manager as its
restricted member. Effective access is checked in Exercise 4.3.

## Exercise 4.2: Limit a logistics partner

Create the **LogisticsPartner** role, limit it to the partner's shipments, and
hide supplier cost columns.

The workshop partner is **Wide World Logistics**, **CAR-02**. Its account is
supplied separately from the North manager account.

1. Create or inspect **LogisticsPartner** as a **Read**, **Selected data**
   role.
1. Include `history.shipment_history` with this row rule:

   ```sql
   SELECT * FROM history.shipment_history WHERE carrier_id = 'CAR-02'
   ```

1. On that table's column security settings, set **supplier_cost_eur** to
   **Hide**. Save both the row and column restrictions.
1. Include `dbo.carriers` and `dbo.trucks`, each with a rule restricting its
   own `carrier_id` to `CAR-02`. Use that table's actual schema-qualified
   name in each `SELECT` rule.
1. Include the cost-free derived table `dbo.recall_temperature_status` with:

   ```sql
   SELECT * FROM dbo.recall_temperature_status WHERE carrier_id = 'CAR-02'
   ```

   Do not include the raw `dbo.truck_temperature_events` table.
1. Allow the nonfinancial reference tables `dbo.products` and
   `dbo.locations`, and the supplier certificate table and document shortcut.
   These provide product, destination, and certification context.
1. Do **not** include `dbo.lots`, `history.lot_history`,
   `dbo.store_inventory`, **Files/reference**, **Files/history**, or
   **Files/.staging**. The lot
   tables contain `supplier_unit_cost_eur`, and raw source files do not
   inherit table column restrictions.
1. Add only the supplied partner identity. Check that no other role or
   inherited permission grants it broader access.

**Completion check:** The role limits shipment, truck, carrier, and derived-temperature records
to CAR-02, hides shipment costs, and grants no alternative route to lot costs
or raw shipment data.

## Exercise 4.3: Compare identities

Run the same investigation as the supplied test identities and compare the
results.

Use separate browser profiles for the engineer, manager, and partner.
Verify the signed-in identity before each read. Do not reuse an engineer's
cached result or access token for a restricted account.

1. As the engineer, run the current-inventory query from Exercise 1.4
   against the **destination lakehouse**, now populated by Module 2. Expect
   nine stores, including East's **STR-028**.
1. As the North manager, run the same query without adding a region filter.
   Expect only **STR-003, STR-004, STR-008, STR-010, STR-013, STR-014,
   STR-015, and STR-016**.
1. Still as the manager, explicitly request **STR-028** from inventory and
   shipment history. Neither read may return East's records.
1. As the partner, query shipment history without adding a carrier filter.
   Every returned row must have `carrier_id = 'CAR-02'`. Request
   `carrier_id = 'CAR-01'` explicitly and confirm that no rows are returned.
   For YG-2291 specifically, the fixed dataset has eight CAR-02 shipment
   lines reaching eight distinct stores.
1. Request `supplier_cost_eur` explicitly as the partner. It must not be
   readable. Confirm that `dbo.lots`, `history.lot_history`, and the raw
   history and reference file folders are also unavailable.
1. Confirm that each permitted identity can still open a required supplier
   certificate through the document shortcut.
1. Query `dbo.recall_temperature_status` without adding region or carrier
   filters. The North manager must see only eight North rows, and the
   partner only eight CAR-02 rows. Explicitly request an out-of-scope store
   or carrier and verify that no rows are returned.
1. As either restricted identity, request `dbo.truck_temperature_events`
   and the snapshot staging files. Neither may be readable. A missing raw
   table is not a denial pass: have the engineer confirm that the resource
   exists before testing access.

Allow up to five minutes for SQL analytics endpoint security synchronization
after a policy change. Refresh the restricted session and repeat the checks.
An unavailable endpoint, missing table, or expired sign-in is an error to
resolve, not evidence of successful denial.

Do not share the engineer's data agent or application credentials as a
shortcut around these checks. Later telemetry and application reads require
their own effective-identity verification before they can be considered
governed.

**Completion check:** The engineer sees nine current stores, the manager sees
only its eight North stores, and the partner cannot read other carriers'
shipments, supplier costs, or ungoverned raw files.

===

# Build the recall console

In this module, you will build the application that regional managers use to
investigate the recall.

## Exercise 5.1: Start the application

Create a Rayfin application from the supplied starter template.

Fabric Apps (preview) is built on Rayfin. In this lab, use only the supplied
starter and its configured workspace/item; do not scaffold a new project or
install a different framework.

1. Open the starter's own instructions and confirm its project manifest,
   `rayfin/rayfin.yml`, and existing start/deploy tooling are present.
1. Confirm its configured workspace and app item match the supplied lab
   resources. If **contoso_recall_console** is already supplied, reuse that
   item rather than creating a second app.
1. Run the starter's documented start command and sign in using the supplied
   account. Fabio authentication does not establish that the app's separate
   sign-in has succeeded.
1. Open the actual app URL and check that its authenticated session is visible.
   An AppBackend item in the workspace, without deployed application content,
   is not a running starter.

If the starter, toolchain, or app URL is missing, stop and notify the
instructor or lab support. Do not paste the engineer's tokens into a browser,
enable anonymous recall-data access, or substitute an owner-authenticated
mock application.

**Completion check:** The starter application runs in the lab environment.

## Exercise 5.2: Read OneLake data

Connect the application through the OneLake Read API and display affected
stores, truck temperature status, and supplier certificate links.

Use only the starter's provisioned connector. Verify these results separately:

| Console area | Engineer's expected result |
|---|---|
| Current inventory | Nine stores currently hold YG-2291. |
| Shipment history | Thirteen stores received YG-2291, including the correction-file shipment. |
| Related products | Thirteen related lots reached 45 stores. |
| Temperature investigation | After complete-recall replay, SHP-209403 and SHP-209415 have confirmed breaches and the other 11 affected shipments have complete no-breach coverage. With only the boundary fixture, those 11 must remain insufficient data. |
| Supplier documents | Certificate links open the matching files through the supplied document access, not a public URL or embedded credential. |

Keep raw telemetry and supplier costs out of the application response unless
the signed-in identity is explicitly authorized. The engineer's investigation
SQL is not a deployed governed-result service. The console must read a
provisioned governed result, or a verified user-identity query path, rather
than broadening the existing roles just to make a page load.

The provisioned derived table is **dbo.recall_temperature_status**. It contains
all 13 affected shipments with no raw events or supplier costs. Display its
`analysis_time_utc` as the analysis timestamp: this is a snapshot, not a
continuously refreshed feed. Have the instructor refresh and verify it after
the intended replay. A successful replay alone does not update this table.
The North and CAR-02 roles have separate row rules for the snapshot, but
their actual application identity propagation still requires the next
exercise's checks.

**Completion check:** The console displays the current recall data from
OneLake.

## Exercise 5.3: Verify governed results

Use the supplied manager and partner identities to verify that the application
respects the security configured in the previous module.

1. Use separate signed-in sessions for the engineer, North manager, and
   CAR-02 partner. Confirm the displayed identity each time.
1. Check the manager sees only eight North current stores and its permitted
   North shipment history. Check the partner sees only CAR-02 shipments and
   never supplier costs.
1. Inspect the app's network responses, not only visible table cells. Hidden
   columns, other carriers' rows, or out-of-region records must not arrive
   in the browser for the app to filter away.
1. Repeat the relevant denied-access checks from Exercise 4.3 through the
   application's actual data path. App sign-in or **Run and interact**
   permission alone is not proof of downstream OneLake authorization.
1. Switch identities and refresh. Results from an earlier session must not
   remain in shared caches or appear after a lower-privilege sign-in.

**Completion check:** The console changes its rows and columns for each
identity without application-specific filtering.

===

# Complete the workshop

You unified operational, historical, streaming, and document data in OneLake,
governed access to that data, and used it in a recall console.

## Review the investigation

Confirm that the recall console answers all five questions from the opening
scenario.

| Recall question | Evidence to demonstrate |
|---|---|
| Which stores have the affected lot? | Nine stores currently hold YG-2291: eight North and one East. Keep this current-inventory answer separate from historical deliveries. |
| Where else has the supplier's product traveled? | Thirteen stores received YG-2291 after the carrier corrections. The thirteen related production lots reached forty-five stores across five regions. |
| Were the trucks kept within the cold-chain rule? | After complete-recall replay, SHP-209403 and SHP-209415 have a confirmed continuous breach; the other eleven deliveries have full no-breach coverage. Exactly 4 C and exactly twenty minutes are not breaches. Before the supplement, preserve insufficient-data results. |
| Which users can see each part? | The North manager sees eight permitted current stores and eight derived shipment results. The CAR-02 partner sees only its carrier's shipments and eight derived results, without supplier costs or raw-event access. Demonstrate denied reads, not only visible page filters. |
| Can managers investigate through one console? | The deployed app shows the signed-in identity, governed inventory/history/temperature results, analysis timestamp, and authorized supplier-document links. A workspace app item without deployed content does not satisfy this question. |

Use the fixed investigation clock, **2026-10-13 04:00 UTC**, when explaining
the historical recall. Keep the temperature snapshot's actual analysis time
separate from observation time and from that fixed scenario clock.

## Hand off the recall

1. State which lot, supplier, production line, and production window are
   affected: **YG-2291**, **SUP-014**, **AVD-L2**, and
   **2026-10-11 20:00 to 2026-10-12 00:00 UTC**.
1. Show current stock, historical delivery reach, and the wider related-lot
   investigation as distinct results. Do not count every historical receiving
   store as a current holder.
1. Show the two confirmed temperature breaches and the evidence coverage used
   to classify the other deliveries. Do not present a partial or stale
   snapshot as live complete telemetry.
1. Open an authorized certificate and the recall procedure through the
   supplied document path.
1. Switch to each supplied restricted identity and repeat the positive and
   negative access checks. Confirm that the browser receives no out-of-scope
   rows or hidden costs.
1. Record any skipped exercise, missing resource, failed sign-in, or
   unverified integration. Do not mark the workshop complete if the app or
   effective-identity checks were replaced by engineer-only queries.

If you used the historical fallback, identify which technology exercises were
not completed and which endpoint supplied the investigation results. A correct
fallback answer does not retrospectively validate an unavailable runtime.

## Optional extensions

If the instructor confirms that the optional resources are available, explore
one of these paths:

- Query the governed OneLake data from the supplied external analytics service.
- Ask a question about the governed data using the supplied AI or productivity
  experience.

> [!Note] Optional extensions are not required to complete the workshop.
