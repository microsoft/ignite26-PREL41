# Infrastructure

## OneLake roles

The workshop provides two role definitions:

- [RegionalManagerNorth](onelake/regional-manager-north.json) limits regional
  activity to the fixed North store list.
- [LogisticsPartner](onelake/logistics-partner.json) limits shipments, trucks,
  and carriers to CAR-02 and permits only named non-cost shipment columns.

These definitions contain no user memberships, credentials, or tenant-specific
IDs. They grant nobody access until the lab provisioning process adds the
supplied restricted identities. They do not change DefaultReader permissions
or memberships, item permissions, workspace permissions, or SQL endpoint
access mode.

The roles exclude raw reference/history files. The partner role also excludes
both lot tables, which contain supplier unit costs. Certificate metadata and
the SupplierQuality document shortcut are scoped separately.

### Apply in an author workspace

Use Fabio authenticated as the intended item creator. Set `WORKSPACE_ID` and
`LAKEHOUSE_ID` to the authorized lab resources, then run from the repository
root:

```bash
fabio onelake-security create \
  --workspace "$WORKSPACE_ID" --id "$LAKEHOUSE_ID" \
  --role @infra/onelake/regional-manager-north.json --conflict-policy Abort

fabio onelake-security create \
  --workspace "$WORKSPACE_ID" --id "$LAKEHOUSE_ID" \
  --role @infra/onelake/logistics-partner.json --conflict-policy Abort
```

`Abort` prevents silently overwriting an existing role. On resume, inspect its
saved constraints and memberships before deciding whether to reuse it.
Do not replace all roles with a bulk upsert, and do not add the engineer to
these roles as a substitute for a restricted test identity.

For a role with only row constraints, omit `columns` rather than sending an
empty array: the Fabric service rejected the empty-array form during live
validation. Compare saved policies by name, permissions, constraints, and
memberships, rather than assuming server-assigned role IDs remain unchanged.

### Validate before release

Follow [Exercise 4.3](../instructions/README.md#exercise-43-compare-identities)
with the actual supplied reader accounts. Confirm user identity mode on the
SQL analytics endpoint and remove conflicting broad grants for those test
accounts only. Owner queries and successful role creation do not prove
authorization.

The certificate transformation, document shortcut, telemetry, and console
still require their own provisioning and effective-identity checks. Adding a
new table does not automatically grant it through these selected-path roles.

## SharePoint source

Publish only [the supplied synthetic source](../data/sharepoint/) under a
new workshop-specific folder in an authorized SharePoint document library.
Preserve existing content, site settings, and sharing. Keep this structure:

```text
PREL41/supplierQuality/
  metadata/supplier-certificates.csv
  certificates/SUP-008_GLOBALGAP_Certificate.txt
  certificates/SUP-014_SQF_Certificate.txt
  certificates/SUP-021_BRCGS_Certificate.txt
  certificates/SUP-027_FSSC22000_Certificate.txt
  procedures/Contoso_Fresh_Product_Recall_SOP.txt
  notices/YG-2291_Supplier_Recall_Notice.txt
```

Do not publish the alternative JSON in `metadata/`. Download the seven
published files and compare their SHA-256 hashes with the repository sources
before connecting Fabric. On resume, reuse identical files; do not overwrite
different content at an existing path.

For organizational-account authentication, create the cloud connection through
Fabric's supported SharePoint Folder connection flow, signing in as the
authorized source reader. Name the workshop connection
**PREL41-SupplierQuality**. Browser sign-in and CLI sign-in are separate:
verify the account in each. Do not export browser session credentials, use
anonymous access, or skip a failing connection test.

Fabio 0.79.0 advertises `OAuth2` as a connection credential type, but a
credential-free OAuth2 creation request returned `InvalidInput` during
consolidation validation. That request did not create a connection. Use the
supported interactive sign-in rather than inventing credential fields.
[Workspace identity and certificate-based service principal authentication](https://learn.microsoft.com/fabric/onelake/shortcuts/create-onedrive-sharepoint-shortcut#authentication)
are alternatives only when their SharePoint permissions are explicitly
provisioned; a working owner browser session does not grant those identities
access.

Once the tested connection exists, retrieve its ID through Fabio:

```bash
fabio connection list \
  --query "[?displayName=='PREL41-SupplierQuality'].{id:id,name:displayName,type:connectionDetails.type}"
```

Require exactly one matching connection. Set `SHAREPOINT_CONNECTION_ID` to its
ID, `SHAREPOINT_SITE_URL` to the site root, and `SHAREPOINT_SOURCE_PATH` to the
server-relative document folder, for example
`/Shared Documents/PREL41/supplierQuality`. These are source paths, not the
library's `Forms/AllItems.aspx` browser URL. Inspect existing shortcuts before
creating anything:

```bash
fabio lakehouse list-shortcuts \
  --workspace "$WORKSPACE_ID" --id "$LAKEHOUSE_ID"
```

The following author-provisioning commands describe the intended deployment;
they still require live execution and validation with the tested connection:

```bash
fabio lakehouse create-shortcut \
  --workspace "$WORKSPACE_ID" --id "$LAKEHOUSE_ID" \
  --name SupplierQuality --path Files --target-type OneDriveSharePoint \
  --connection-id "$SHAREPOINT_CONNECTION_ID" \
  --location "$SHAREPOINT_SITE_URL" --subpath "$SHAREPOINT_SOURCE_PATH" \
  --conflict-policy Abort

fabio lakehouse create-shortcut \
  --workspace "$WORKSPACE_ID" --id "$LAKEHOUSE_ID" \
  --name supplier_certificates --path Tables/dbo \
  --target-type OneDriveSharePoint \
  --connection-id "$SHAREPOINT_CONNECTION_ID" \
  --location "$SHAREPOINT_SITE_URL" \
  --subpath "$SHAREPOINT_SOURCE_PATH/metadata" \
  --transform csvToDelta --csv-delimiter , --csv-keep-error-files \
  --conflict-policy Abort
```

On resume, compare source, path, connection, and transformation before reusing
an existing shortcut. Never create a uniquely named duplicate to hide a
conflict. Confirm all six text documents are readable through
`Files/SupplierQuality` and that `dbo.supplier_certificates` contains exactly
the four source records, including their status, dates, and document paths.
The SUP-014 row must be current and link to its supplied certificate. Resolve
each document path relative to `Files/SupplierQuality`, not the metadata
folder. Transformation materializes Delta data and requires Spark; do not
claim zero-copy semantics for the certificate table or treat shortcut metadata
creation as proof of completed transformation.

Provision source access and shortcut access for the intended learner
identities separately. Do not grant the restricted manager or partner broader
document, staging-file, or operational-source access merely to make a check
pass. See [Exercises 1.2 and 1.3](../instructions/README.md) for the learner
flow, which uses an already provisioned connection rather than author setup.

## Operational source

Module 1 uses **contoso_operations**, a separate schema-enabled lakehouse
containing seven managed Delta tables loaded from
[the committed reference CSVs](../data/reference/). Module 2 writes its
Iceberg tables to **contoso_fresh** instead. Do not use the destination
lakehouse ID for this provisioning step.

In a new authorized workspace, create the operational source:

```bash
fabio lakehouse create \
  --workspace "$WORKSPACE_ID" --name contoso_operations --enable-schemas
```

Set `SOURCE_LAKEHOUSE_ID` to the returned ID. Before loading, inspect that
item and confirm it is the newly created operational source, not the
destination or an existing lakehouse with authored tables:

```bash
fabio lakehouse show \
  --workspace "$WORKSPACE_ID" --id "$SOURCE_LAKEHOUSE_ID" \
  --query '{id:id,name:displayName,sql:properties.sqlEndpointProperties.id}'
```

Only for that new, empty source, run from the repository root:

```bash
(
for table in suppliers products locations carriers trucks lots store_inventory; do
  fabio lakehouse upload-table \
    --workspace "$WORKSPACE_ID" --id "$SOURCE_LAKEHOUSE_ID" \
    --source-path "data/reference/$table.csv" \
    --table "$table" --schema dbo --format Csv --mode Overwrite \
    --lro-timeout 600 || exit 1
done
)
```

Check every result; do not proceed after an upload or load error. This is
author provisioning, not a learner-built copy pipeline. On resume, compare
the existing table schemas and data and reuse matching tables. Do not rerun
overwrite mode on existing or unrelated tables without explicit approval.
Use ordinary SQL endpoint metadata refresh if a successfully loaded table
is not registered; do not recreate the endpoint.

The consolidation source passed complete, type-normalized row comparisons
against all seven CSVs:

| Table | Rows |
|---|---:|
| suppliers | 4 |
| products | 24 |
| locations | 83 |
| carriers | 4 |
| trucks | 40 |
| lots | 302 |
| store_inventory | 1,533 |
| **Total** | **1,990** |

The exact Exercise 1.4 query ran against this source's own SQL endpoint and
returned nine stores: eight North and one East. Restricted manager/partner
identities must not receive access to this unfiltered source or its staging
CSV files. Their governed reads use the destination lakehouse and require
separate identity tests.

## Independent Spark-recovery data

**contoso_recall_fallback** is a schema-enabled lakehouse containing the seven
reference tables plus `history.lot_history` and `history.shipment_history`,
independently loaded as managed Delta. Its purpose is read-only historical
investigation while an instructor repairs a Spark session, not a claim that
the notebook's technology exercises have completed.

### Provision before learner launch

1. Complete and validate the corrections in an author source. Do not export
   the uncorrected 12-store snapshot.
1. Create the separate fallback lakehouse through Fabio, with schemas enabled.
1. Load the seven committed reference CSVs into its `dbo` schema using the
   operational-source recipe, substituting the fallback item ID.
1. Export the SQL-visible corrected history and load it through Fabio's native
   `upload-table` operation into the fallback's `history` schema. Use CSV
   headers and the logical columns in the shared data model.
1. Refresh SQL endpoint metadata and run
   [the supplied acceptance query](../src/sql/fallback-recall-checks.sql).
1. Compare every logical column in both directions against the corrected
   source, as well as row counts and duplicate keys. Do not treat matching
   recall totals alone as full-data fidelity.

A whole-history TDS export timed out during validation. Export bounded
calendar-month partitions instead, verify each partition's row count against
the source, and combine them with one CSV header. Use half-open timestamp
ranges, for example:

```sql
SELECT shipment_id, line_no, shipped_at_utc, delivered_at_utc,
       origin_dc_id, store_id, carrier_id, truck_id, lot_id,
       product_id, supplier_id, cases, supplier_cost_eur, status, driver_note
FROM history.shipment_history
WHERE shipped_at_utc >= '2026-10-01T00:00:00'
  AND shipped_at_utc < '2026-11-01T00:00:00';
```

Explicitly select these fifteen business columns. The SQL endpoint can expose
an engine-generated `partition_col_MONTH_shipped_at_utc` column for Iceberg;
it is not part of the portable logical schema and CSV inference changes its
representation. Do not materialize that physical partition metadata as a
business column.

Do not use raw Iceberg directory copying as an independent fallback. In a
bounded test, Fabio copied the files but the metadata's table location and
manifest pointers still referenced the original lakehouse. That copy was
rejected; its five unused files were removed only after verifying that the
replacement Delta table referenced its own data file.

### Verified contents and limitations

All nine fallback tables were checked against the corrected source. Both
native `EXCEPT` directions returned no missing or unexpected logical rows.
The shipment fallback contains all 1,165,374 corrected lines and the lot
fallback all 16,961 lots. The acceptance query returns 9 current stores,
13 receiving stores, 13 related lots, 45 reached stores in five regions,
and zero duplicate shipment keys or deleted duplicate-shipment lines.

The fallback is a fixed scenario snapshot, not a live replica. Its decimal
amounts must be compared at the model's two-decimal precision after CSV
loading. No fallback snapshot or package result should be presented as
proof of Iceberg, DuckDB, AI Functions, or the SDK path.

Keep this item and any staging exports unavailable to restricted manager and
partner identities until equivalent policy and identity validation are
explicitly provisioned. The item uses the same F8 capacity and cannot recover
from a capacity-wide outage. Later modules require an explicit validated
handoff: the fallback does not automatically move the SharePoint shortcut,
Eventstream destination, data agent, security roles, or console connectors.

## Truck telemetry Eventstream

The author workspace now has a native Eventstream named
**contoso_truck_telemetry**, with this topology:

```text
truck_replay (CustomEndpoint)
  -> truck_replay-stream (DefaultStream)
  -> truck_telemetry_lakehouse (Lakehouse)
  -> dbo.truck_temperature_events
```

### Provision the topology

First inspect the workspace for an existing matching Eventstream. On resume,
reuse it after checking its inlet, destination lakehouse, and table; do not
create a duplicate or replace an unrelated item.

For a new authorized lab workspace, create the item through Fabio and use its
returned ID as `EVENTSTREAM_ID`:

```bash
fabio eventstream create \
  --workspace "$WORKSPACE_ID" --name contoso_truck_telemetry

fabio eventstream add-source \
  --workspace "$WORKSPACE_ID" --id "$EVENTSTREAM_ID" \
  --name truck_replay --source-type CustomEndpoint

fabio eventstream add-destination \
  --workspace "$WORKSPACE_ID" --id "$EVENTSTREAM_ID" \
  --name truck_telemetry_lakehouse --destination-type Lakehouse \
  --input-node truck_replay-stream \
  --properties "{\"workspaceId\":\"$WORKSPACE_ID\",\"itemId\":\"$LAKEHOUSE_ID\",\"schema\":\"dbo\",\"deltaTable\":\"truck_temperature_events\",\"minimumRows\":1000,\"maximumDurationInSeconds\":30,\"inputSerialization\":{\"type\":\"Json\",\"properties\":{\"encoding\":\"UTF8\"}}}"
```

The lakehouse must have schemas enabled. This destination creates a separate
Delta table; it must not overwrite Module 2's Iceberg tables. The explicit
nine-table data-agent selection excludes this additional table.

### Validate actual ingestion

Use the [telemetry fixtures](../data/telemetry/README.md) with an authorized
producer. Source connection responses contain secrets: never print them,
commit them, pass them in process arguments, or expose them in browser code.
Fabio manages the Fabric topology and credential retrieval; event payloads use
the managed Event Hubs-compatible data-plane endpoint.

In the consolidation workspace, two controlled sends of the 35-event fixture
were accepted. The actual Delta table was then compared against every distinct
fixture payload: **34 canonical events, zero missing, zero unexpected**.
Raw row counts increase on replay and are not the completion criterion.

Cold-start materialization took several minutes even with a 30-second batching
setting. That setting is not an initial table-creation SLA. Pre-warm the source
and destination and verify a real persisted event before learner launch.
Inspect OneLake's table files separately from SQL endpoint registration; use
Fabio's metadata refresh only after the Delta table exists. Do not hide a failed
stream by uploading or loading the fixture directly into the table.

After bounded author validation, pause the Eventstream:

```bash
fabio eventstream pause \
  --workspace "$WORKSPACE_ID" --id "$EVENTSTREAM_ID"
```

### Replay with the supplied producer

Use the existing Python 3.9 or newer interpreter in the authorized author environment;
this utility requires no package installation. Validate all events before
retrieving credentials:

```bash
python3 src/telemetry/replay.py \
  --input data/telemetry/replay-contract.jsonl --validate-only
```

Resume the Eventstream, verify the destination is Running, and set `SOURCE_ID`
to the custom inlet ID returned by Fabio's topology command. Then pipe only
the needed connection fields directly into the producer:

```bash
set -o pipefail
fabio eventstream get-source-connection \
  --workspace "$WORKSPACE_ID" --id "$EVENTSTREAM_ID" --source-id "$SOURCE_ID" \
  --query '{fullyQualifiedNamespace:fullyQualifiedNamespace,eventHubName:eventHubName,accessKeys:{primaryConnectionString:accessKeys.primaryConnectionString}}' \
  | python3 src/telemetry/replay.py \
      --input data/telemetry/replay-contract.jsonl
```

Do not enable shell tracing, verbose HTTP logging, or pipe the connection
response through `tee`. The producer rejects non-managed hosts, mismatched
connection endpoints, redirects, malformed events, nonfinite temperatures,
conflicting IDs, and conflicting journey timestamps. It preserves input
order, timestamps, and retry IDs.

An accepted-message count is transport evidence only: the output explicitly
reports `destination_verified: false`. Verify actual distinct payloads in the
lakehouse and run the complete
[temperature analysis](../src/sql/module-3-temperature-status.sql).
On a partial failure, resolve the reported error and replay the same file;
do not generate new IDs for retries.

### Idle-state verification

Verify the destination is **Paused**. The managed custom inlet can still report
**Running**; that alone does not mean the lakehouse sink is consuming events.
The learner replay control and complete-fleet coverage still require Lab
Profile provisioning. The existing restricted roles intentionally do not grant raw telemetry access.
They now grant only the derived snapshot described below, with separate row
rules. Identity tests remain required before exposing it through the console.

## Governed temperature snapshot

`dbo.recall_temperature_status` contains the validated analysis output for
all 13 YG-2291 shipments. It is a managed Delta snapshot, not a live view or a
streaming update pipeline. `lot_id` identifies the investigation and
`analysis_time_utc` identifies when analysis ran. The console must display
that timestamp and must not describe the snapshot as live telemetry.

The snapshot contains shipment/truck/carrier/store IDs, journey times, reading
counts, observed coverage, longest confirmed hot duration, and both status
fields. It contains no raw event payloads, supplier costs, or endpoint
credentials. Empty observation timestamps and durations remain null for the
seven shipments without readings.

### Create or refresh an author-owned snapshot

Use the destination lakehouse and its SQL endpoint, not **contoso_operations**.
Before first creation, confirm that no authored table exists at
`dbo.recall_temperature_status`. On refresh, confirm it is this workshop's
snapshot and inspect its current schema. Never overwrite an unrelated table.
Run after the intended replay has persisted and before the console validation:

```bash
(
  SNAPSHOT_FILE=$(mktemp) || exit 1
  trap 'rm -f "$SNAPSHOT_FILE"' EXIT
  fabio sql-endpoint query \
    --workspace "$WORKSPACE_ID" --id "$SQL_ENDPOINT_ID" \
    --sql @src/sql/module-3-temperature-status.sql \
    --output csv > "$SNAPSHOT_FILE" || exit 1
  fabio lakehouse upload-table \
    --workspace "$WORKSPACE_ID" --id "$LAKEHOUSE_ID" \
    --source-path "$SNAPSHOT_FILE" \
    --table recall_temperature_status --schema dbo --format Csv \
    --mode Overwrite --lro-timeout 600 || exit 1
)
```

The SQL batch fails explicitly on invalid or inconsistent input before
exporting any result. It uses one read transaction for validation and
calculation. Do not remove the guards, convert an error response to data,
append successive snapshots, or upload raw fixture events as a shortcut.

Refresh ordinary SQL metadata if needed, then verify the actual table:

```sql
SELECT
    COUNT(*) AS affected_shipments,
    SUM(CASE WHEN shipment_temperature_status = 'breach' THEN 1 ELSE 0 END)
        AS breached_shipments,
    SUM(CASE WHEN distinct_readings = 0 THEN 1 ELSE 0 END)
        AS missing_sensor_shipments,
    MIN(analysis_time_utc) AS oldest_analysis_utc,
    MAX(analysis_time_utc) AS newest_analysis_utc
FROM dbo.recall_temperature_status
WHERE lot_id = 'YG-2291';
```

For the boundary fixture alone, expect **13**, **2**, and **7** respectively.
After the [complete-recall supplement](../data/telemetry/README.md#complete-the-affected-deliveries)
has actually persisted, expect **13**, **2**, and **0**, with eleven
`no_breach` journeys instead of eleven insufficient-data journeys. This
change must follow new observations, not a manual status override.
Compare every persisted row and column with the analysis output, not only
these counts. A replay does not refresh this table automatically. If analysis,
export, load, or verification fails, report the failure and do not present an
older snapshot as the new result.

### Row scopes and verification

The unassigned `RegionalManagerNorth` role permits only the eight North
shipment results; `LogisticsPartner` permits only the eight CAR-02 results.
Both saved policies were compared with the committed definitions, including
the new derived-table row rule. DefaultReader permission and membership
semantics were preserved. Raw telemetry and staging CSV paths remain outside
both roles.

These are saved-policy and owner-data checks, not effective-identity passes.
Keep the two roles unassigned until the approved reader identities are
available. When refreshing an existing role, preserve its actual memberships;
do not overwrite an assigned role using the empty-membership templates.
