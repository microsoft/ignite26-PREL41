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

Verify the destination is **Paused**. The managed custom inlet can still report
**Running**; that alone does not mean the lakehouse sink is consuming events.
The learner replay control and complete-fleet coverage still require Lab
Profile provisioning. The existing restricted roles intentionally do not
grant raw telemetry access; governed enrichment and identity tests remain
required before exposing it through the console.
