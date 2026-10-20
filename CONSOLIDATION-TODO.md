# Workshop consolidation TODO

## Delivery agreement

- Consolidation branch: `workshop/consolidation`.
- Base: current `origin/main`, including merged PR #10.
- Preserve existing contributions; integrate the Contoso Fresh workshop from
  PRs #3, #4, and #9 rather than maintaining separate workshop scenarios.
- Do not open a pull request or merge this branch. The session owner will
  review the result before publication.
- Never commit credentials, access tokens, temporary access passes, or
  private environment exports.
- Record actual validation evidence. Unavailable services and unexecuted
  checks remain outstanding, not passed.

## Phase 0: Credentials and environment

- [x] Confirm GitHub authentication and repository push permission.
- [x] Validate Fabio CLI authentication against the requested local account.
  Use Fabio for subsequent Fabric operations, with explicit workspace IDs.
- [x] Create the consolidation branch from the latest main.
- [x] Publish the consolidation branch using the verified GitHub noreply
  identity. The original private-email commit is preserved on the local
  `workshop/consolidation-preflight` branch without amendment.
- [x] Check access to the supplied Fabric workspace without modifying it.
  The requested local account receives `InsufficientPrivileges`; use the
  authorized isolated workspace instead.
- [x] Authenticate Fabric as `alvidela.local@cadata2612.onmicrosoft.com`
  in tenant `5551f16b-831c-46a7-a226-4aae2ddca51a`.
- [x] Verify workspace creation and read access, and the Admin role,
  using that identity.
- [x] Confirm an accessible active F8 capacity in Sweden Central.
- [ ] Verify the relevant AI and OneLake settings and workload execution.
- [x] Establish an isolated workshop workspace and record its item inventory.
- [ ] Confirm access to the provisioned SharePoint source and Skillable
  authoring/learner environment.

Updated preflight on 2026-10-20: GitHub push access is working. Microsoft
Graph confirms Azure CLI is now authenticated as the requested local account,
with object ID `81bed261-9eca-4f0e-a128-1b8ebea8bd52`. The original workspace
is not accessible to this account. An isolated workspace was created using
the account, and its Admin role and capacity assignment were verified:

| Resource | Verified value |
|---|---|
| Workspace | PREL41-consolidation |
| Workspace ID | 41c12ed5-0cc1-4d1c-9d2d-b81bcde137e4 |
| Capacity | teamsharedsweden |
| Capacity ID | b78e4ea3-9635-4923-8c8c-f3b692b1713f |
| Capacity SKU and state | F8, Active |
| Region | Sweden Central |
| Initial item inventory | Empty, confirmed through the Fabric items API |
| Lakehouse | contoso_fresh, fe4cab6e-b5e6-4590-a0e4-6b33437d6c15 |
| Lakehouse schema and SQL endpoint | dbo; SQL endpoint provisioning succeeded |
| Notebook | module-2-shipment-history, ece07e95-467e-41c8-8077-05277ddd8292 |
| Existing Spark runtime | 2.0, inspected without changing it |
| Recall data agent | contoso_recall_agent, 40669c9f-e1ee-49ee-91b5-2af42bfe30e8 |
| Telemetry Eventstream | contoso_truck_telemetry, 27712fbe-9867-4894-8f6e-019c0bb53edb |
| Telemetry destination | dbo.truck_temperature_events, managed Delta |
| Recall Console item | contoso_recall_console, 451acf30-8346-491b-aba6-b7ab95ddc71c; AppBackend metadata only |
| Operational source | contoso_operations, aad9a5d8-7742-41b3-befa-84f34be2a46c |
| Operational SQL endpoint | 37b5c6b2-da51-4d64-9195-02d563ab09b6; separate from Module 2 |
| Spark-recovery data | contoso_recall_fallback, 36ab1f02-106b-4266-a68d-e49ed78a5e7e |
| Fallback SQL endpoint | 57210129-b6ad-4fb4-a409-832d5616d68a |

- [x] Create the schema-enabled lakehouse and verify SQL endpoint provisioning.
- [x] Import the existing Module 2 notebook without changing its cells.
- [x] Export the deployed notebook and verify all cell types and sources match
  the repository. Both normalized SHA-256 cell digests are
  `869eb233c33fbfb0c4bacfb5bf9ff8ac388f29ce5edf96133ab0025d2a6c14c2`.
- [x] Attach the lakehouse through the learner UI and verify the saved
  lakehouse name, ID, and workspace ID through Fabio's notebook export.
- [ ] Complete the full learner notebook, including package-based cells,
  in a standard session.
- [x] Complete a native standard-session run of existing cells 1-15 in an
  author validation copy, filling cell 13 with the documented learner answer.
- [x] Execute the existing SQL endpoint refresh and AI Functions cells in a
  bound native notebook with explicit output assertions.
- [x] Independently assert the corrected data results: 9 current stores,
  13 receiving stores, 13 related lots, 45 reached stores, 1,165,374 shipment
  lines, and no remaining duplicate shipment rows.
- [x] Query the SQL analytics endpoint independently and confirm the 9/13
  current-versus-history distinction.
- [x] Create, configure, select nine tables, publish, and query the recall
  data agent through Fabio. Both workshop questions returned the expected
  9 and 13 stores and their IDs.

Native validation job evidence:

| Check | Job ID | Result |
|---|---|---|
| Core cells with documented DELETE answer | 2168fa30-e44d-45aa-a14a-6a06d45bede5 | Completed |
| SQL refresh and AI output assertions | 80912c76-1fb7-4a18-b7e5-510fa05f1649 | Completed |
| Independent recall counts and package inspection | a6bc8822-e79e-40fb-a168-181c3b57a4ad | Completed; exit value records all expected counts |

The AI checks asserted 30 notes with 30 temperatures and 23 durations,
six nonempty QA summaries, and no extraction or summarization errors.
The runtime package probe reports that `duckdb` and
`fabric-data-agent-sdk` are not installed. Their learner notebook paths are
not verified; no packages were installed. Fabio provisioning verifies the
published data-agent service path, not the notebook SDK installation or
the learner's final UI publish step.

An initial unchanged core run stopped at the intentional `condition = None`
learner exercise. The validation copy uses the answer in Exercise 2.3;
the learner notebook remains unchanged. A separate native run without an
explicit complete lakehouse execution binding failed the starting check.
Subsequent validation runs supply lakehouse name, ID, and workspace ID.
The diagnostic Livy session was stopped and confirmed `killed`.

Fabio authentication was rechecked: `fabio auth status` reports
`authenticated` with credential source `azure_cli`. The backing Azure CLI
account is `alvidela.local@cadata2612.onmicrosoft.com` in the requested
tenant, and `fabio workspace show` successfully reads the isolated workspace.
Continue using Fabio for Fabric operations.

Fabio's saved notebook export confirms that the learner UI attachment
persisted with the correct lakehouse name, ID, and workspace ID. The Add data
items menu screenshot was captured and visually checked. The embedded
browser's constrained viewport produced clipped or blank captures for other
steps; those files were discarded. Ten absent image placeholders were removed
while preserving self-contained learner steps.

The integrated browser now opens the workspace and notebook; browser and CLI
sessions remain separate. Native core and AI execution are verified.
OneLake SAS settings, package-based paths, SharePoint access, and Skillable
access remain unverified. Fabio found no accessible SharePoint or Supplier
Quality connection matching the workshop source.
High-concurrency notebook execution is enabled in the workspace; the
existing Module 2 contract requires a standard session for its package cells.

The Module 1 instructions now include the CSV-only certificate transformation,
its managed-copy semantics, resume checks, and exact inventory SQL. That SQL
returned nine stores against the matching Module 2 data: eight North and one
East. The separate operational source is now provisioned and validated; the
SharePoint transformation is not. The certificate table is explicitly excluded from Module 2's
nine-table agent selection.

Module 4 now documents supported role names, reader-only identities, user
identity endpoint mode, separate table rules, cost-column exclusions, raw-file
restrictions, and negative tests. Owner queries confirmed eight North receiving
stores and eight CAR-02 lines reaching eight stores for YG-2291. These checks
establish expected results, not effective authorization; restricted-identity
testing is still required.

Both role definitions are committed under `infra/onelake/` and were created
through Fabio without assigning any identities. Read-back assertions verified
their complete permissions, row constraints, partner column allowlist, and
empty memberships against the files. An explicitly empty `columns` constraint
array initially caused BadRequest; omitting that unused field resolved the
error. The corrected source is the form accepted by Fabric.

DefaultReader's permissions and membership are unchanged. Its server-assigned
ID changed during provisioning, so verification compares policy content rather
than treating IDs as stable. The owner still reads 13 receiving stores through
SQL, and the production agent still answers with the original nine current
stores. No restricted-identity pass is claimed.

## Phase 1: Consolidate the workshop contract

- [x] Integrate the scaffold, supplier exercise, and Module 2 contributions
  from PRs #3, #4, and #9 in dependency order.
- [ ] Reconcile merged PR #10 with the Contoso Fresh recall scenario;
  preserve reusable walkthrough material and replace automotive-specific
  data flows with recall-relevant flows.
- [ ] Define one pre-provisioned environment, lakehouse layout, naming
  convention, and resource ownership contract.
- [x] Separate current-inventory questions in Module 1 from shipment-history
  questions in Module 2; resolve references to operational orders/shipments.
- [ ] Agree shared identifiers, schemas, expected results, scenario clock,
  security identities, and downstream data requirements.
- [ ] Map every workshop objective to an exercise and observable evidence.
- [ ] Confirm the four-hour core path and clearly label optional extensions.

## Phase 2: Complete all learner modules

- [x] Document welcome environment checks, prerequisites, recall questions, and both
  guided and self-paced starting paths.
- [ ] Module 1: operational recall data, supplier-document shortcut,
  transformations, completion checks, and downstream handoff.
- [x] Provision the separate seven-table operational source with native Fabio
  CSV loads, compare all 1,990 rows/columns, and run the exact learner inventory query.
- [ ] Module 2: historical-data generation, Iceberg writes and row changes,
  snapshots, REST catalog, DuckDB tracing, AI Functions, and data agent.
- [ ] Module 3: supplied/replayable telemetry, Eventstream path, the
  above-4-C-for-more-than-20-minutes rule, shipment joins, and expected results.
- [x] Deploy the native custom-endpoint-to-lakehouse Eventstream through
  Fabio and verify real persisted Delta output, not just accepted sends.
- [x] Supply 35 boundary-fixture events with 34 distinct IDs and verify all
  join real shipment/truck/time intervals without fan-out.
- [x] Compare persisted canonical payloads with the complete fixture and
  verify all six continuous-duration and whole-journey coverage outcomes.
- [x] Deliver the standard-library replay producer, validate rejection and
  partial-failure paths, and verify all 35 shipped-producer events persisted.
- [x] Deliver and natively execute the guarded SQL analysis, including all
  13 affected shipments and seven missing-sensor cases.
- [x] Supply and ingest additive coverage for all 13 affected deliveries,
  verify every canonical payload and exact native duration/coverage result,
  and refresh the governed snapshot to two breaches and eleven no-breach journeys.
- [ ] Verify learner terminal/replay-control delivery, snapshot refresh delivery,
  and console integration.
- [x] Materialize all 13 guarded analysis rows in a cost-free derived snapshot,
  verify every persisted column, and deploy scoped unassigned row rules
  without granting raw telemetry or changing DefaultReader semantics.
- [ ] Module 4: regional-manager and logistics-partner access, row/column
  restrictions, denied-access checks, and identity-specific expected results.
- [x] Implement and deploy unassigned OneLake policy definitions for North and
  CAR-02, and assert their saved content while preserving default permissions.
- [ ] Supply and exercise actual restricted reader identities against those
  policies, the SQL endpoint, documents, telemetry, and console.
- [ ] Module 5: Recall Console starter and complete flow, governed OneLake
  reads, inventory/history/temperature/document views, and access verification.
- [x] Confirm the current Fabric Apps/Rayfin product relationship from official
  documentation and create the native AppBackend item through Fabio.
- [ ] Deploy actual application content and its services; item creation alone
  is not a running console.
- [x] Provide the wrap-up's five-question evidence table, concrete expected
  results, handoff sequence, and supported optional continuation paths.
- [ ] Execute that complete wrap-up through the actual console, documents,
  and restricted identities; do not substitute owner SQL results.
- [ ] Provide documented recovery, resume, rerun, and fallback behavior
  wherever required by the lab contract.
- [x] Provision independent corrected fallback reference/history data and
  validate the read-only historical recovery checks without claiming the
  skipped Spark/Iceberg/DuckDB/AI exercises passed.
- [ ] Verify fallback delivery in a fresh learner environment and any
  deliberate handoff to later-module connections, roles, and app bindings.

## Phase 3: Instructions and delivery

- [ ] Provide one canonical attendee entry point and verify Skillable
  navigation for all exercises.
- [x] Retain the visually checked menu screenshot and replace missing
  Module 2 image placeholders with self-contained instructions.
- [ ] Verify remaining repository-relative links and Skillable navigation.
- [x] Correct the known PR #10 loop-body indentation and remove its two
  missing screenshot references without replacing them with invented images.
- [ ] Verify all examples.
- [x] Clearly label the retained automotive walkthrough as authoring material,
  not part of the canonical Contoso Fresh learner path.
- [x] Reconcile the Studio inventory's token and image claims with the
  canonical instructions and the retained automotive contribution.
- [ ] Reconcile all Skillable aliases and credentials placeholders with the
  actual Lab Profile; do not substitute real secrets into repository files.
- [ ] Complete provisioning inventory, data model, authoring guidance, and
  expected-results documentation.
- [ ] Populate README learning outcomes, technologies, owners, and delivery
  links from confirmed content; do not invent metadata.
- [ ] Confirm the outcome of issue #6 with the Skillable team.
- [ ] Review template cleanup and unused folders with the session owner
  before removing authored content or finalizing publication.

## Phase 4: End-to-end evidence

- [ ] Verify all repository-relative links, images, notebook references,
  examples, and learner entry points.
- [ ] Run the core path in a clean Fabric workspace as the required account.
- [ ] Verify all expected table schemas, counts, recall results, and
  cross-module joins.
- [x] Complete previously unverified Module 2 AI Functions cell 23 in a native
  notebook session, with six successful nonempty summaries asserted.
- [x] Verify data-agent publication and expected answers through Fabio.
- [ ] Verify the learner's final data-agent UI publish step and SDK path.
- [ ] Validate governed reads using the actual manager and partner identities,
  not only the workspace owner.
- [ ] Run fresh-launch and resume checks in Skillable, including narrow-pane
  rendering, credentials substitution, navigation, and reset behavior.
- [ ] Measure module durations, Spark startup, SQL endpoint refresh, AI
  latency, telemetry freshness, and console responsiveness.
- [ ] Verify fallback paths, partial execution, reruns, interrupted sessions,
  missing permissions, unavailable capacity, and service errors.

## Phase 5: Red-team after feature completion

- [x] Run a bounded interim security review of implemented replay, SQL, role
  definitions, and directly related guidance. No actionable high-confidence
  vulnerabilities were reported; unavailable integrations and effective
  restricted-identity access remain outside this check.
- [ ] Perform an independent correctness and cross-module integration review.
- [ ] Perform a security review covering credentials, authentication,
  authorization, OneLake data access, row/column leakage, AI/data-agent
  exposure, telemetry inputs, and console inputs.
- [ ] Exercise negative and adversarial cases against authorized lab
  resources only; do not test unrelated tenant resources.
- [ ] Review query plans and measured performance for clear bottlenecks,
  unnecessary full scans, excessive polling, and costly reruns.
- [ ] Fix confirmed defects and repeat the affected checks.
- [ ] Record remaining risks, external dependencies, and unverified behavior.
- [ ] Prepare a final review summary, evidence, and proposed PR description
  without opening a pull request.

## Current state

### External resources still required

The session owner was unavailable when these locations and identities were
requested. Do not treat that as approval to invent resources, credentials,
or successful test results:

- An accessible Supplier Quality SharePoint connection and source library.
  Fabio returned no matching accessible connection.
- Distinct restricted North manager and CAR-02 partner identities, with an
  approved sign-in method. The deployed roles intentionally have no members.
- Skillable Studio/Lab Profile access and fresh-instance provisioning of the
  now-available operational source.
- The actual Rayfin starter and a preconfigured deployment toolchain, plus
  learner terminal/replay-control provisioning. Fabric Apps is publicly
  documented as built on Rayfin, and native AppBackend creation now succeeds.
  The telemetry producer and SQL analysis are supplied; the application
  starter and deployed application content remain absent.
- A provisioned environment satisfying the existing package-based Module 2
  path; DuckDB and the Data Agent SDK remain uninstalled and unverified.

Module 3 has a live ingestion path and validated boundary fixtures, but its
complete learner flow is not finished. Module 5 is not implemented.
Restricted-identity and Skillable runs have not passed, and the final
post-feature red-team has not started. Do not
open the final PR or report publication readiness on the strength of the
completed owner-account checks.

### Live telemetry evidence

Fabio created `contoso_truck_telemetry` with custom inlet `truck_replay`,
default stream `truck_replay-stream`, and lakehouse destination
`truck_telemetry_lakehouse`. The destination writes
`dbo.truck_temperature_events` in the existing schema-enabled lakehouse.
The [provisioning recipe](infra/README.md#truck-telemetry-eventstream) and
[fixture contract](data/telemetry/README.md) describe the topology and semantics.

Two controlled sends each accepted 35 messages. Actual OneLake Parquet files
and Delta log versions were observed, SQL metadata was refreshed, and the
persisted canonical payload set matched **34 events, zero missing, zero
unexpected**. At one read there were 49 raw rows; accepted-send totals are
not a guarantee of raw sink row counts during startup or replay.

The supplied native SQL analysis returned longest hot intervals of **25, 20, 0, 15,
5, and 25 minutes** for SHP-209403, SHP-209404, SHP-209408, SHP-209410,
SHP-209414, and SHP-209415 respectively. Only the first and last are
confirmed breaches. The other four have insufficient whole-journey coverage.
Fixture-to-history validation found zero unmatched journeys and zero
out-of-journey observations across all 35 fixture rows.

The shipped `src/telemetry/replay.py` then published a third 35-message replay.
SQL observed all 35 new rows, with latest enqueue time
`2026-10-20T21:13:06.713Z`; total raw rows reached 105 and distinct IDs remained
34. Re-running the exact supplied SQL preserved the results and returned all
13 affected shipments, including seven without observations. Focused native
derived-table checks passed all seven rejection guards, complete-cold coverage,
the strict twenty-minute boundary, a one-microsecond excess, and missing-data
behavior. Producer probes passed malformed/conflicting input, invalid managed
connections, numeric extremes, payload/order preservation, and partial-send
failure checks. The analysis uses one read transaction for validation and
calculation; native probes verified failure rollback and rejection of a
caller's existing transaction without rolling it back. This is implementation
validation, not the final red-team.

### Native Fabric Apps evidence

Current official [Fabric Apps documentation](https://learn.microsoft.com/fabric/apps/overview)
identifies Rayfin as its SDK and CLI. Fabio exposes `rayfin-app` as an alias
for `app-backend`; its Power Apps wording is not a basis for treating Rayfin
as unavailable. The requested account created and read back
`contoso_recall_console`, AppBackend
`451acf30-8346-491b-aba6-b7ab95ddc71c`, in the consolidation workspace.

This verifies native item creation only. The generic item-definition operation
returned `OperationNotSupportedForItem`, and no Rayfin executable or supplied
application project is present. No packages were installed and no replacement
application scaffold was generated. The item description explicitly says
application content is not yet deployed. Hosting, connectors, identity
propagation, and the actual recall experience are not validated.

### Governed temperature snapshot

The guarded query now includes `lot_id` and `analysis_time_utc`. Its validated
13-row output was materialized through Fabio as managed Delta
`dbo.recall_temperature_status`. Every persisted row and column matched,
including the null fields for seven missing-sensor journeys. Two shipments
remain breached and eleven have insufficient whole-journey data.

The previously unassigned North and partner policies were updated individually
with access only to this derived table, constrained by North store IDs and
CAR-02 respectively. Their complete saved definitions matched source after
excluding service-managed IDs, etags, and row-type annotations. DefaultReader
permission/membership semantics were unchanged; raw telemetry and staging
files remain excluded. Owner dataset expectations are eight North and eight
CAR-02 rows, not proof of effective authorization.

This is an explicitly timestamped author-refreshed snapshot, not an automatic
streaming result. The [refresh procedure](infra/README.md#governed-temperature-snapshot)
requires output validation and prevents silent continuation after failure.
Console binding, freshness presentation, actual restricted identities, and
Lab Profile refresh delivery remain outstanding.

### Complete affected-delivery coverage

The additive [coverage supplement](data/telemetry/recall-coverage-supplement.jsonl)
adds 404 observations without modifying the original boundary events. It
uses the actual 13 affected delivery intervals and preserves consistent
shared-truck observations across overlapping shipment contexts. Combined
input is 439 messages with 438 stable event IDs. This covers the complete
affected recall deliveries, not unrelated five-year fleet history.

The shipped producer accepted all 404 supplemental sends. Actual SQL output
eventually contained all 438 canonical payloads, with zero missing and zero
unexpected records. Intermediate reads showed only part of the supplement;
no full-coverage claim or snapshot refresh was made until persistence passed.
At the completed read the raw count was 509 across previous retries.

The exact SQL batch verified every expected reading count, duration, and
delivery endpoint: **two breaches and eleven no-breach journeys**, with no
missing-sensor deliveries remaining. Explicit new observations fill the
previously unknown windows; the data was not defaulted to compliant.
Both producer and SQL also reject contradictory readings for the same truck
timestamp across different shipments.

The derived snapshot was refreshed using the documented procedure and
compared again with the complete analysis. Its timestamp is
`2026-10-20T22:01:07.382069Z`. Owner dataset checks found eight North rows
with two breaches and eight CAR-02 rows with one breach. Actual restricted
identity tests remain outstanding. The Eventstream destination was confirmed
**Paused** after this completed validation; resume it before further replay.

### Separate operational-source evidence

Fabio created the schema-enabled **contoso_operations** lakehouse and loaded
the seven committed reference CSVs through native `upload-table` operations.
Its SQL analytics endpoint provisioned successfully, and metadata refresh
reported success for all seven tables. Type-normalized comparisons of every
column and row matched the source CSVs: **1,990 records, zero missing, zero
unexpected**. SQL timestamps carry additional zero padding; the comparison
asserted that any discarded submicrosecond digits were zero.

The exact Exercise 1.4 query then ran against this separate source endpoint
and returned nine current stores, eight North and one East, with the documented
IDs and positive quantities. No Module 2 table was loaded or overwritten by
these source-provisioning operations. The
[native recipe](infra/README.md#operational-source) documents new-source
creation, resume safeguards, and restricted-identity exclusions. SharePoint
content, certificate transformation, and a fresh Skillable launch remain
separate outstanding checks.

### Independent historical fallback

The separate schema-enabled **contoso_recall_fallback** now contains all seven
reference tables plus the corrected lot and shipment history as independently
loaded Delta data. A raw directory-copy experiment was rejected after its
Iceberg metadata still pointed to the source item. Only five unused files
from that experiment were cleaned up, after checking the replacement Delta
table's independent data-file reference.

A full shipment TDS export timed out. Bounded monthly exports then verified
all source partition counts and produced all 1,165,374 corrected rows.
Native two-direction EXCEPT comparisons matched all reference tables, all
16,961 lot rows, and all fifteen logical shipment-history columns. The
engine-generated Iceberg month-partition field was excluded from the final
portable table schema.

The [same acceptance query](src/sql/fallback-recall-checks.sql) passed against
both original and fallback endpoints with the expected 9/13/13/45 recall
counts, five reached regions, both history row counts, zero duplicate keys,
and zero deleted duplicate-shipment lines. Learner instructions now provide
a bounded read-only investigation path while Spark is repaired. The fallback
does not complete the skipped technology exercises, solve a capacity-wide
outage, or automatically rebind later-module resources. Fresh-launch and
handoff testing remain outstanding.

Cold-start materialization took several minutes despite a 30-second batch
setting. Fresh-launch timing and producer recovery still require testing.
The Eventstream was paused after validation; check sink status before
resuming. The custom inlet/default stream can remain Running even when the
destination is Paused. Raw telemetry remains outside the restricted roles.

The consolidation branch is published. PRs #3, #4, and #9 were merged into it
in dependency order with no textual merge conflicts; merged PR #10 is retained
from main. These are integration results, not evidence of functional readiness.
The original private-email commit remains on the local preflight branch;
published consolidation commits use the verified GitHub noreply identity.

The requested Fabric local-account identity, workspace creation, Admin access,
and F8 capacity assignment are now verified. Scenario reconciliation,
remaining feature implementation, and live lab validation are outstanding.
The workspace was created on existing capacity; no new capacity was purchased.
A zero-defect or security-free claim is not an acceptance substitute for
recorded evidence and disclosed limitations.
