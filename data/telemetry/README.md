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

Run [the supplied SQL batch](../../src/sql/module-3-temperature-status.sql)
against actual ingested output. It returns all 13 shipments carrying YG-2291,
not just the six with fixture observations. The seven without observations
have zero readings, no calculated hot duration, and `insufficient_data`.
The batch rejects invalid or conflicting observations instead of silently
filtering them out.
