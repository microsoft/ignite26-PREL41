# Optional telemetry and pipeline exercises

This supporting path retains the original telemetry exercises and their
exercise numbers; the SQL assets and pipeline names have not been renamed.
It is outside the five-module core path. The core app requires a **supplied,
verified `dbo.recall_temperature_status`** before Module 3; learners do not
create a snapshot during the app exercises. Use this optional path only when
the instructor supplies its replay, terminal, and deployment resources.

[Return to the workshop](README.md).

---

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
1. Continue with Exercise 3.3 to deploy the guarded refresh pipeline and
   verify the governed snapshot before continuing to the console.

These are additional synthetic observations, not a fallback that assumes
missing temperatures were safe. Without the supplement's actual persisted
records, preserve the original insufficient-data results.

**Completion check:** Your investigation distinguishes a confirmed breach,
no breach over a fully observed journey, and insufficient data. It does not
silently label missing telemetry as compliant.

## Exercise 3.3: Deploy the guarded refresh pipeline

Use Data Factory to transform the persisted raw observations with the
validated SQL and load a curated Delta snapshot. This is a real SQL-to-Delta
Copy pipeline, not a live streaming view or a local CSV upload.

Use the supplied engineer account and authorized terminal, with the existing
Python 3.9+ and Fabio. The Lab Profile supplies `WORKSPACE_ID`, `LAKEHOUSE_ID`,
`SQL_ENDPOINT_ID`, and `SQL_ENDPOINT_HOST`. These must identify
**contoso_fresh and its SQL endpoint**, not the operational SQL database or
its mirror. Do not install tools, choose a replacement runtime, or sign in
with a personal account.

1. Inspect the workspace for **contoso_temperature_refresh**. If it exists,
   verify that it is this workshop's pipeline, with the guarded temperature
   query and destination lakehouse. Reuse it only when those settings match.
   Check that no earlier run is active before rebinding it.
1. If it is absent, create it in the supplied workspace:

   ```bash
   fabio data-pipeline create \
     --workspace "$WORKSPACE_ID" --name contoso_temperature_refresh \
     --description "PREL41 guarded temperature snapshot refresh; no schedule"
   ```

1. Set `PIPELINE_ID` to that item's ID. Start with the isolated candidate:
   `export OUTPUT_TABLE=recall_temperature_pipeline_candidate`.
1. From the repository root, bind, deploy, run, and check the provided
   definition:

   ```bash
   (
     set -eu
     definition_dir=$(mktemp -d)
     trap 'rm -f "$definition_dir/pipeline-content.json" "$definition_dir/snapshot-checks.sql"; rmdir "$definition_dir"' EXIT
     python3 infra/pipelines/temperature-refresh/bind.py \
       --workspace "$WORKSPACE_ID" --lakehouse "$LAKEHOUSE_ID" \
       --sql-endpoint "$SQL_ENDPOINT_ID" --sql-host "$SQL_ENDPOINT_HOST" \
       --output-table "$OUTPUT_TABLE" \
       --output "$definition_dir/pipeline-content.json"
     fabio item validate-definition --type DataPipeline --dir "$definition_dir"
     fabio data-pipeline update-definition \
       --workspace "$WORKSPACE_ID" --id "$PIPELINE_ID" \
       --file "$definition_dir/pipeline-content.json"
     fabio data-pipeline run \
       --workspace "$WORKSPACE_ID" --id "$PIPELINE_ID" \
       --wait --timeout 600 --cancel-on-timeout
     fabio sql-endpoint refresh-metadata \
       --workspace "$WORKSPACE_ID" --id "$SQL_ENDPOINT_ID"
     sed "s/dbo[.]recall_temperature_status/dbo.$OUTPUT_TABLE/g" \
       src/sql/temperature-snapshot-checks.sql > "$definition_dir/snapshot-checks.sql"
     fabio sql-endpoint query \
       --workspace "$WORKSPACE_ID" --id "$SQL_ENDPOINT_ID" \
       --sql @"$definition_dir/snapshot-checks.sql"
   )
   ```

1. Inspect the pipeline's Copy activity: SQL source, guarded transformation
   query, Delta sink, and overwrite behavior. Its source SQL and item IDs are
   fixed at deployment, not editable run-time parameters.
1. Confirm a **Completed** job and accepted candidate output: **13 shipments,
   two breaches, eleven no-breach**, with an analysis timestamp inside that
   job's recorded UTC start/end interval. The acceptance checks also validate
   each shipment's readings, duration, coverage, history context, and schema.
1. If the production table already exists, inspect its fourteen columns and
   confirm that it is this workshop's derived snapshot, not an unrelated
   authored table. Set `OUTPUT_TABLE=recall_temperature_status`, repeat the
   same block, and verify the production result again.
1. Keep the candidate as engineer-only validation evidence. Do not add it,
   raw telemetry, or local deployment files to the manager or partner roles.
   The Lab Profile reset owns cleanup of learner-created validation tables.

SQL registration can lag a completed write. If the table is not registered,
repeat metadata refresh and acceptance after registration; do not repeatedly
start new writes. A failed or timed-out run can still have written rows:
neither a job result alone nor correct-looking rows alone establish success.
Inspect the actual job state before an explicit retry, keep its error, and
require both a completed run and fresh accepted output.

**Completion check:** You deployed the guarded Data Factory pipeline,
validated a candidate, and promoted a verified production snapshot without
copying a local CSV, bypassing source guards, or expanding reader permissions.
