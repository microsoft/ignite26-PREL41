# Telemetry contract fixtures

[replay-contract.jsonl](replay-contract.jsonl) contains 35 synthetic JSON events,
34 distinct event IDs, and six affected shipments from the verified Module 2
history. The repeated event is intentional, and the final shipment arrives out
of timestamp order. These are boundary fixtures, not a complete fleet replay.

## Event schema

| Field | Meaning |
|---|---|
| `event_id` | Stable deduplication key; a retry preserves the same ID and payload |
| `shipment_id` | Shipment whose journey contains the reading |
| `truck_id` | Must match the truck recorded for that shipment |
| `event_time_utc` | ISO 8601 UTC observation time, not ingestion time |
| `temperature_c` | Numeric temperature in degrees Celsius |

Join shipment context on both shipment and truck, and check that the observation
falls within its shipped-to-delivered interval. Do not join only on truck ID:
the same truck has multiple journeys. History has several lines per shipment;
deduplicate its journey context before joining, so every event remains one row.
Derive carrier, destination, region, and supplier context from governed history,
not from untrusted attributes sent by a telemetry producer.

## Interval convention

The fixture cadence is five minutes. A reading applies until the next reading
only when that next observation is at most five minutes later. A larger gap
breaks continuity; never bridge it with an assumed temperature. A final reading
without a successor has no demonstrated duration.

Deduplicate identical events, reject conflicting payloads for the same event
ID, then order by observation time within each journey. Conflicting readings
for the same journey and timestamp must also be resolved explicitly rather
than chosen arbitrarily.

A breach requires one continuous interval **strictly above 4 C** lasting
**strictly more than 20 minutes**. A reading at 4 C closes a hot interval.
Separate hot intervals are not added together.

## Expected boundary results

| Shipment | Case | Longest confirmed hot interval | Observed-window result |
|---|---|---:|---|
| SHP-209403 | Above threshold until a closing 4 C reading | 25 minutes | Breach |
| SHP-209404 | Exactly twenty minutes | 20 minutes | No observed breach |
| SHP-209408 | Exactly 4 C throughout | 0 minutes | No observed breach |
| SHP-209410 | Ten hot minutes, cooling, then fifteen hot minutes | 15 minutes | No observed breach; do not sum to 25 |
| SHP-209414 | Missing observations between 06:35 and 06:50 | 5 minutes | Insufficient data across the gap |
| SHP-209415 | Out-of-order arrival and an identical retry | 25 minutes | Breach, unchanged by arrival order or deduplication |

These windows do not cover the entire delivery intervals. A confirmed breach
is enough to classify its shipment as breached. An observed window without a
breach is **not** enough to declare the whole shipment compliant. Complete
journey coverage is required; otherwise report **Insufficient data**.

## Replay and publication requirements

The [supplied producer](../../src/telemetry/replay.py) sends each JSON line as
an event through the Eventstream custom endpoint.
[The replay procedure](../../infra/README.md#replay-with-the-supplied-producer)
validates the complete file before retrieving credentials. Retrieve endpoint
credentials only through the
approved author environment; never commit them, print them in instructions,
or place them in browser code.

Preserve the fixed October 12 observation times when replaying later. Raw
ingestion must not replace them with the current clock. Event-time windowing
requires its own explicit timestamp and late-arrival configuration.

Before declaring replay successful, verify the actual destination table,
distinct event counts, shipment/truck/time matches, duplicate behavior, and all
six boundary outcomes. Merely uploading this file to OneLake, creating an
Eventstream, or seeing a running inlet is not a replay pass.

## Complete the affected deliveries

[recall-coverage-supplement.jsonl](recall-coverage-supplement.jsonl) adds
**404 observations** covering the complete shipped-to-delivered intervals of
all **13 YG-2291 shipments**. Replay it after the boundary fixture; do not
replace or delete the original events.

The combined dataset has **439 input messages and 438 distinct event IDs**.
The original retry is retained. Existing observations are unchanged, and
shared-truck observations agree across overlapping shipment contexts. Added
readings fill the previously unknown portions of these synthetic journeys;
they are new scenario evidence, not a claim that missing real-world readings
can be inferred as cold.

Every interval is at most five minutes, and each delivery has readings at its
exact start and end. The two confirmed breaches remain unchanged. The other
eleven shipments now have complete coverage and report `no_breach`.
SHP-209414's formerly missing window is filled with explicit new observations;
its longest confirmed hot interval becomes ten minutes. SHP-209416 shares
TRK-012's exactly-twenty-minute hot period and is not breached.

| Shipment | Distinct readings after both files | Longest hot interval | Whole-delivery result |
|---|---:|---:|---|
| SHP-209403 | 38 | 25 minutes | Breach |
| SHP-209404 | 57 | 20 minutes | No breach |
| SHP-209408 | 26 | 0 minutes | No breach |
| SHP-209410 | 21 | 15 minutes | No breach |
| SHP-209414 | 42 | 10 minutes | No breach |
| SHP-209415 | 11 | 25 minutes | Breach |
| SHP-209416 | 18 | 20 minutes | No breach |
| SHP-209420 | 20 | 0 minutes | No breach |
| SHP-209421 | 32 | 0 minutes | No breach |
| SHP-209426 | 65 | 0 minutes | No breach |
| SHP-209428 | 51 | 0 minutes | No breach |
| SHP-209432 | 15 | 0 minutes | No breach |
| SHP-209481 | 42 | 0 minutes | No breach |

Use the same producer with the supplemental input:

```bash
python3 src/telemetry/replay.py \
  --input data/telemetry/recall-coverage-supplement.jsonl --validate-only
```

Repeat the authorized Fabio connection pipe from the replay procedure,
changing `--input` to the supplemental file. Expect 404 accepted messages,
then verify actual persistence, 438 canonical IDs, all 13 journey matches,
and the complete SQL result before refreshing the derived snapshot.

This covers the complete **affected recall deliveries**, not the entire
five-year shipment history or unrelated fleet movements.

Run [the supplied SQL batch](../../src/sql/module-3-temperature-status.sql)
against actual ingested output. It returns all 13 shipments carrying YG-2291,
not just the six with fixture observations. The seven without observations
have zero readings, no calculated hot duration, and `insufficient_data` until
the supplemental observations arrive.
The batch rejects invalid or conflicting observations instead of silently
filtering them out.
