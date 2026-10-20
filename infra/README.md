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
Profile provisioning. The existing restricted roles intentionally do not
grant raw telemetry access; governed enrichment and identity tests remain
required before exposing it through the console.
