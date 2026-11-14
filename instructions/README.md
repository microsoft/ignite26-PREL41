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

## Workshop modules

1. [SharePoint shortcuts and transformations](#module-1-sharepoint-shortcuts-and-transformations)
1. [Use a Spark notebook with OneLake Table APIs](#module-2-use-a-spark-notebook-with-onelake-table-apis)
1. [Build a data app with Rayfin](#module-3-build-a-data-app-with-rayfin)
1. [Apply OneLake Security, then revisit the app](#module-4-apply-onelake-security-then-revisit-the-app)
1. [Query Fabric with DuckDB and ClickHouse](#module-5-query-fabric-with-duckdb-and-clickhouse)

Module 5 is an instructor-approved extension with implemented exercises,
outside the four-hour core schedule. Allow approximately 45-60 additional
minutes, plus workload approval, provisioning, and sync time; this allowance
has not been measured in a learner run.
The [optional telemetry path](optional-telemetry.md) retains the original
replay and pipeline exercises outside this core sequence.

Use these elapsed-time checkpoints in both delivery paths. They are planning
targets, not measured service guarantees:

| By elapsed time | Checkpoint |
|---|---|
| 00:15 | Environment and supplied resources checked |
| 01:05 | Operational mirroring and supplier certificates complete |
| 01:55 | Shipment-history exercises complete |
| 02:05 | Ten-minute break complete |
| 02:30 | Plain console and supplied temperature snapshot inspected |
| 03:05 | Recall Console deployed as a Fabric App and verified with your token |
| 03:45 | Service principal created and compared with your account in the app |
| 04:00 | Recall evidence and handoff complete |

If a service delay prevents a checkpoint, keep the error and ask the instructor
to repair the supplied environment. Do not mark a skipped exercise complete
to meet the schedule. Optional extensions are outside this four-hour core path.

**Prerequisites:** The Skillable environment provides a Microsoft Fabric
workspace, workshop data, and access to the Contoso Fresh SharePoint content.
Use only the accounts and resources supplied in the lab.

**Success criteria:** At the end of the workshop, you can demonstrate a recall
console that combines the affected stores, shipment history, temperature
status, and supplier documents while respecting OneLake Security.

> [!Note] This workshop uses pre-provisioned resources. Do not create additional
> capacities, tenants, or external accounts. For Module 5 only, the instructor
> must approve the ClickHouse workload's automatically provisioned organization
> and service, its trial or funding, and AI data processing before you begin.

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
Later modules also require the Recall Console starter and permission to
create the Module 4 service principal. Telemetry replay is optional
supporting material. If an item is missing, notify the instructor; do not
create a personal replacement.

## Exercise 0.2: Review the recall

Review the five recall questions on the workshop landing page and identify the
data source that contributes to each answer.

**Completion check:** You can explain why the investigation requires
operational data, historical data, telemetry, supplier documents, and governed
access.

===

<a id="unify-operational-data"></a>

# Module 1: SharePoint shortcuts and transformations

In this module, you will bring operational and unstructured data into a single
OneLake view without building a copy pipeline.

## Exercise 1.1: Explore operations

Explore the supplied Contoso Fresh current-state data and identify the lots,
products, suppliers, locations, and store inventory needed for the recall.

1. Open the supplied **contoso_operations_sql** SQL database.
1. Find lot **YG-2291** and identify its product and supplier.
1. Find the store inventory records for that lot.
1. Use the location records to identify each store's region.

The current-state source contains seven tables: `suppliers`, `products`,
`locations`, `carriers`, `trucks`, `lots`, and `store_inventory`. Keep its SQL
analytics endpoint separate from both the transactional database and the
destination lakehouse's endpoint:
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

### Observe changes arriving through mirroring

The SQL database automatically replicates supported tables into OneLake as
Delta data. Its separate **SQL analytics endpoint** queries that read-only
mirror; it does not query the transactional source directly. Mirroring
replicates data, unlike the zero-copy document pointer in the next exercise.

Use only the supplied `workshop.mirroring_probe` training table. Do not change
the seven recall tables, upload replacement files, or change the scenario clock.

1. In the **SQL database** query editor, open
   [the mirroring exercise SQL](../src/sql/mirroring-probe.sql). Run its default
   `inspect` action. A fresh source returns zero probe rows.
1. In the separate **contoso_operations_sql SQL analytics endpoint**, run:

   ```sql
   SELECT COUNT_BIG(*) AS probe_rows,
       MAX(probe_value) AS probe_value,
       MAX(changed_at_utc) AS changed_at_utc
   FROM workshop.mirroring_probe
   WHERE probe_id = 'PREL41-mirroring';
   ```

1. Before starting a fresh run, confirm both source and mirror return zero
   rows, with null value and timestamp. If the source has value **1** or
   **2**, resume that step instead of inserting again. If only the mirror
   still has an old row, wait for deletion to arrive.
1. In the source query, change only `@action` from `inspect` to `insert`
   and run the whole batch once. Expect one row with value **1** and a
   source-generated UTC timestamp.
1. Repeat the read-only mirror query until its count, value, and timestamp
   match the source. An old value or timestamp is not a completed step.
1. Change the source action to `update`, run once, and observe value **2**
   with the new matching timestamp in the mirror.
1. Only after seeing that update, change the source action to `delete`,
   run once, and observe zero rows and null value/timestamp in both places.
   Leave the training table empty.

Changes are asynchronous. If a state has not arrived within three minutes,
keep the source result and notify the instructor rather than advancing or
copying rows into the mirror. Do not turn mirroring off or reconfigure it;
SQL database in Fabric manages this replication automatically. Source pause,
capacity state, and workload can affect timing.

On resume, value **1** means observe insert, then update and delete; value
**2** means observe update, then delete. The supplied batch rejects duplicate
inserts and out-of-order updates/deletes instead of silently changing a
different state.

**Completion check:** You can locate the affected lot, distinguish current
stock from historical deliveries, and demonstrate source insert/update/delete
arriving through the separate mirror without an ingestion or copy command.

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
`certificate_id` values. Fabric can add `__filepath__`, `__corrupt__`, and
`__ingestion_timestamp__` columns. Every `__corrupt__` value must be null;
do not accept missing records or rows with parsing errors even if the
transformation reports success. Find **CERT-2026-014**, for **SUP-014**:

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

1. Open the SQL analytics endpoint of **contoso_operations_sql**, the supplied operational source,
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

<a id="add-shipment-history"></a>

# Module 2: Use a Spark notebook with OneLake Table APIs

Continue with the existing authored notebook and its catalog/engine paths
below. This module title does not introduce a replacement Table API notebook
or change the contributed exercises.

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

## If a Module 2 cell fails

If Spark cannot start or an exercise fails, keep the error and ask the
instructor to check the supplied environment. Do not repeatedly select
**Run all**, switch runtimes, install replacement packages, or delete tables.
Stay on the same notebook, lakehouse, and exercise sequence. Module 2 has no
alternate-data or SQL-answer completion path. Resume the unfinished exercise
after the environment is repaired, and record it as incomplete until its own
completion check passes.

===

# Module 3: Build a data app with Rayfin

Build the Recall Console, a React, TypeScript, Tailwind, Vite, and DuckDB-Wasm
app that reads OneLake through the Table API, and deploy it as a Fabric App
with Rayfin. Start from **src/console/**. The independent
**src/console-final/** folder is the completed reference.

> **Why bearer tokens?** The console doesn't sign you in through Microsoft
> Entra for you. You paste an access token that you generate with Azure CLI,
> and OneLake applies that token's identity, roles, and row- and column-level
> security to every read. Because each token is one identity, the same app can
> compare identities. In this module you use **your own account**. In
> Module 4 you add a **service principal** and switch between the two.

The dashboard shows the affected lot, current inventory, lots by supplier,
the tables the signed-in identity can read, and supplier certificates. A
**DevTools** bar, docked at the bottom and collapsed by default, shows the
tables, local SQL, every Table API request, and the active token's claims.

The original
telemetry and pipeline exercises remain [optional supporting material](optional-telemetry.md).

Complete the exercises in order for guided and self-paced delivery:

1. [Exercise 3.1: Get your token and run the console](module-3/exercise-3-1-run-the-plain-console.md)
1. [Exercise 3.2: Initialize Rayfin and the Fabric App](module-3/exercise-3-2-initialize-rayfin.md)
1. [Exercise 3.3: Deploy and verify the app](module-3/exercise-3-3-deploy-and-verify.md)

The console calls the Table API directly from the browser and streams Arrow
results incrementally; there is no proxy or server-side code. Rayfin hosts the
built app as a Fabric App, so users sign in to Fabric to open it, but OneLake
always sees the bearer token you paste.

===

<a id="govern-recall-access"></a>

# Module 4: Apply OneLake Security, then revisit the app

> **Revisit the app.** Exercise 4.3 creates a service principal, adds it
> directly to the **RecallSupplierReader** role, signs in to the Recall
> Console with its token, queries what OneLake returns, then compares it
> with your own account. Switching
> between your account and the service principal shows OneLake returning
> different rows and tables for each identity, with no filtering in the app.

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
   and `dbo.recall_temperature_pipeline_candidate`. Neither may be readable.
   Have the engineer confirm both tables exist before testing access.
   If the environment also retains snapshot staging files, test those
   existing files; an absent file is not a denial pass.
1. Try to open the separate **contoso_operations_sql** database and its
   mirrored SQL endpoint as each restricted identity. Neither may provide
   an unfiltered alternative to the destination's governed tables. Confirm
   that the source, mirror, and `workshop.mirroring_probe` are inaccessible.
   A successful query returning zero rows from the empty probe is not a
   denial pass. The same exclusion applies to any supplied operational
   query fallback.

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

# Module 5: Query Fabric with DuckDB and ClickHouse

Extend the recall investigation with the **ClickHouse workload for Microsoft
Fabric (public preview)**. You already queried OneLake directly with DuckDB
in Exercise 2.4. Now discover the same lakehouse tables, sync selected tables
into ClickHouse for acceleration, and use SQL and ClickHouse Assistant to
prepare a regional delivery report.

This extension requires workload approval, an approved ClickHouse trial or
funding, and permission to read the Module 2 tables. Its AI exercise also
requires enabled AI features and approved consent. Use only the synthetic
lab data and your engineer account; OneLake's row and column security does
not automatically transfer to accelerated copies.

Complete the exercises in order:

1. [Exercise 5.1: Add the ClickHouse workload](module-5/exercise-5-1-add-the-clickhouse-workload.md)
1. [Exercise 5.2: Discover and sync OneLake tables](module-5/exercise-5-2-sync-onelake-tables.md)
1. [Exercise 5.3: Query the accelerated recall data](module-5/exercise-5-3-query-the-accelerated-data.md)
1. [Exercise 5.4: Engineer and report with the ClickHouse AI agent](module-5/exercise-5-4-use-the-clickhouse-ai-agent.md)

**Completion check:** Five tables have completed point-in-time syncs.
ClickHouse returns 9 current holders and 13 historical receiving stores,
and the reviewed AI-assisted reporting view reconciles to 13 stores.

> [!Note] This preview uses dedicated ClickHouse Cloud compute and storage,
> not Fabric capacity. Sync is a snapshot copy, not zero-copy querying or
> continuous replication. Keep the recorded sync time with your results.
> If approval or preview support is missing, record Module 5 as not run;
> it does not replace any incomplete core exercise.

For product background, see the
[public-preview announcement](https://clickhouse.com/blog/clickhouse-for-microsoft-fabric),
[workload documentation](https://clickhouse.com/docs/integrations/microsoft-fabric),
and [ClickHouse Assistant guide](https://clickhouse.com/docs/products/cloud/features/ai-ml/agents/assistant/using-ai-chat).

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
| Can managers investigate through one console? | The deployed Recall Console shows inventory, lots by supplier, table access, and authorized supplier-document links. Switching between your account and the service principal shows OneLake returning only SUP-014 lots to the service principal and blocking the tables outside its role, with no filtering in the app. A workspace app item without deployed content is not a running app. |

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
   rows or hidden costs. In the Recall Console, switch between **My account**
   and **Service principal** to show the same comparison.
1. Record any skipped exercise, missing resource, failed sign-in, or
   unverified integration. Do not mark the workshop complete if the app or
   effective-identity checks were replaced by engineer-only queries.

Do not substitute results from another dataset or endpoint for unfinished
Module 2 exercises.

## Optional extensions

If the instructor confirms that the optional resources are available, explore
one of these paths:

- Complete Module 5 with the approved ClickHouse workload and AI features.
- Follow the [optional telemetry and pipeline exercises](optional-telemetry.md)
  when the instructor supplies those resources. Their historical exercise
  numbers and technical asset names remain unchanged.
- Ask a question about the governed data using the supplied AI or productivity
  experience.

> [!Note] Optional extensions are not required to complete the workshop.
> Leave ClickHouse service idling enabled. At lab close, ask the instructor
> to confirm cleanup of the Fabric ClickHouse item and its backing service,
> organization/trial, and billing resources. Closing the browser does not
> delete resources; deleting the item deletes its service and copied data.
