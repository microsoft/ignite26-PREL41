# Lab test matrix

Use **Pass**, **Fail**, **Needs Studio verification**, or **Not applicable**.
Record evidence for every completed test.

| Test | Expected result | Status | Evidence |
|---|---|---|---|
| Markdown structure | Headings, lists, tables, code fences, callouts, and page breaks are structurally valid. | Pass | Source inspection of `instructions/README.md`. |
| Local links | Learner and supporting-content repository-relative file targets resolve. | Pass | Manually checked Markdown targets under the root README, instructions, authoring docs, data, source, and infrastructure against existing files and folders, including the root banner image. Skillable navigation remains a separate check. |
| Placeholder scan | Learner instructions contain no template placeholders or unresolved author notes. | Pass | Source inspection of `instructions/README.md`. |
| Token inventory | Every active `@lab.*` reference is listed and configured. | Not applicable | No active tokens are present. |
| Activity inventory | Every Activity alias resolves to a configured Studio Activity. | Not applicable | No Activity aliases are present. |
| Skillable learner preview | Every page renders correctly in the exact instruction set. | Needs Studio verification | Preview not available from repository source. |
| Narrow instruction pane | Tables, callouts, and lists remain readable at the target pane width. | Needs Studio verification | Requires Skillable preview. |
| Fresh launch | A learner can complete the full workshop using a new instance. | Needs Studio verification | Requires provisioned Lab Profile. |
| Resume | A learner can resume after each module without hidden state assumptions. | Needs Studio verification | Requires launched and resumed instances. |
| SharePoint shortcut - fresh state | Exercise 1.2 creates `SupplierQuality` under **Files** without copying the source files. | Needs Studio verification | Requires the supplied SharePoint connection and content. |
| SharePoint shortcut - resumed state | An existing readable `SupplierQuality` shortcut is reused without creating a duplicate. | Needs Studio verification | Requires a resumed or premodified instance. |
| SharePoint shortcut - missing connection | The learner is told to stop instead of creating or signing in to a personal connection. | Needs Studio verification | Remove or deny the supplied connection in a test profile. |
| SharePoint shortcut - source access | The shortcut exposes the supplier certificates and recall procedure. | Needs Studio verification | Confirm the provisioned SharePoint permissions and folder selection. |
| Certificate transformation | The CSV-only metadata folder produces four rows in `dbo.supplier_certificates`, with readable document paths. | Needs Studio verification | Full learner steps and source-folder requirements are documented. No applicable supplied SharePoint connection was visible to the requested account through Fabio. |
| Current inventory | The source query returns nine stores: eight North and one East. | Needs Studio verification | The exact query passed against the independently provisioned `contoso_operations` SQL endpoint. All seven source tables and 1,990 rows match the committed CSVs. Fresh Skillable provisioning remains unverified. |
| Module 2 - notebook import | **module-2-shipment-history** is in the workspace, cell 1 reads **Input is hidden**, and Exercise 2.1 attaches the lakehouse from the OneLake catalog. | Needs Studio verification | Passed in a development workspace on 2026-10-20. |
| Module 2 - bundled Iceberg | On the workspace default Runtime 2.0, with no Environment, cell 2 prints `Iceberg 1.11.0`. | Needs Studio verification | Passed in a development workspace on 2026-10-20. |
| Module 2 - Iceberg row-level changes | On bundled Iceberg 1.11.0, cells 11 to 13 insert 3 lines, update 1, and delete 20. Cell 14 counts 12 stores at the first snapshot and 13 at the latest. | Needs Studio verification | Passed in a development workspace on 2026-10-20. |
| Module 2 - REST catalog reads | Cell 15 sees the latest `writecat` snapshot through `readcat`, the OneLake REST catalog, and prints 13 stores. | Needs Studio verification | Passed in a development workspace on 2026-10-20. |
| Module 2 - history schema | Cell 9 finds both `history` tables through the OneLake REST catalog. After cell 25, the SQL analytics endpoint reads them. After the learner selects the tables, the data agent lists them. The lakehouse shows the `history` schema. | Needs Studio verification | All but the lakehouse view passed in a development workspace on 2026-10-20. |
| Module 2 - DuckDB vended credentials | With **Authenticate with OneLake user-delegated SAS tokens** on, cells 17 to 20 read the Iceberg tables through vended credentials and print 45 stores. | Needs Studio verification | Passed in a development workspace on 2026-10-20, where the SAS setting wasn't recorded. |
| Module 2 - AI Functions | With the AI tenant settings on, cell 22 prints `30 notes: 30 temperatures, 23 durations`, and cell 23 returns 6 summaries without errors. | Needs Studio verification | Both cells passed native Fabric validation on 2026-10-20 with exact counts, six nonempty summaries, and no errors asserted. Job `80912c76-1fb7-4a18-b7e5-510fa05f1649`. Skillable execution remains unverified. |
| Module 2 - SQL endpoint refresh | Cell 25 lists each table's `_delta_log` folder, which starts OneLake's Delta conversion, and the endpoint reads all 9 tables within 5 minutes. The learner has the Contributor role. | Needs Studio verification | Took about 40 seconds in a development workspace on 2026-10-20. |
| Module 2 - recall agent | Cell 26 publishes `contoso_recall_agent`. After the learner selects the 9 tables, the agent answers that 9 stores hold YG-2291 and 13 received it. The learner then publishes the agent from its page, so the published version has the 9 tables. | Needs Studio verification | Passed in a development workspace on 2026-10-20, except the learner's publish step. |
| Module 2 - exercise links | Each Module 2 link in `instructions/README.md` opens its exercise file in the Skillable pane. | Needs Studio verification | Skillable doesn't document links between instruction files. |
| Module 2 - screenshots | Every image link under `instructions/module-2/` resolves. | Pass | The retained Add data items menu image is present and visually checked. Ten missing image placeholders were removed; the surrounding steps remain self-contained. |
| Spark capacity and fallback | The notebook completes in time or the documented bounded fallback allows historical investigation while an instructor repairs the session. | Needs Studio verification | Independent fallback data and SQL recall checks passed. Fresh-launch delivery, recovery handoff, and concurrent launch testing remain required. The same-capacity fallback cannot handle a capacity-wide outage. |
| Eventstream replay | Telemetry arrives and supports the temperature-breach result. | Needs Studio verification | The shipped producer delivered the 35-message boundary fixture and 404-message coverage supplement through the native custom inlet. All 438 combined canonical payloads match actual output, with complete coverage of the 13 affected deliveries. Terminal/control delivery and fresh Skillable launch remain unverified. |
| Security identities | Manager and partner identities return the intended rows and columns. | Needs Studio verification | Reader-only identities, endpoint access mode, role scopes, cost exclusions, and negative checks are documented. Restricted identities are not yet supplied or exercised. |
| Recall Console | The application reads OneLake data and respects OneLake Security. | Needs Studio verification | Fabio created the native AppBackend item, but no application content or connector is deployed. The supplied starter/toolchain, governed data binding, and identity-specific app tests remain required. |
| Keyboard and zoom | Required actions remain usable with keyboard navigation and zoom. | Needs Studio verification | Requires learner UI and product UI testing. |
| Independent learner QA | A reviewer completes the workshop verbatim within 240 minutes. | Needs Studio verification | Independent run not yet performed. |

## Consolidation workspace evidence

These checks ran as the session owner's requested local account in the
isolated `PREL41-consolidation` workspace on existing F8 capacity. They do
not replace Skillable validation or lower-privilege identity checks.

| Check | Result | Evidence |
|---|---|---|
| Native core execution | Pass | Job `2168fa30-e44d-45aa-a14a-6a06d45bede5` completed existing cells 1-15 in a validation copy using the documented DELETE answer. The learner notebook still contains its intentional exercise. |
| Exact corrected recall data | Pass | Job `a6bc8822-e79e-40fb-a168-181c3b57a4ad` asserted 9 current stores, 13 receiving stores, 13 related lots, 45 reached stores, 1,165,374 shipment lines, and zero duplicate shipment rows. |
| SQL analytics endpoint | Pass | Existing cell 25 completed in job `80912c76-1fb7-4a18-b7e5-510fa05f1649`. Independent Fabio SQL queries returned 9 current stores and 13 receiving stores. |
| Published data-agent service | Pass | Fabio created `contoso_recall_agent`, configured its instructions, selected nine tables, and published it. Published queries returned the expected 9 and 13 stores with store IDs. |
| Learner SDK and DuckDB paths | Needs Studio verification | The runtime probe found neither `duckdb` nor `fabric-data-agent-sdk` installed. No packages were installed. Native Fabio agent provisioning is not evidence that cells 16-20 or 24-26 have passed. |
| Default lakehouse binding | Pass | The learner UI attachment persisted: Fabio's saved notebook export contains the expected lakehouse ID, name, and workspace ID. Bound native validation runs also completed. |
| Module 1 inventory query | Pass | The exact learner SQL returned nine positive-inventory stores against the separate `contoso_operations` source: eight North and one East, with the documented store IDs. Source endpoint `37b5c6b2-da51-4d64-9195-02d563ab09b6` is distinct from Module 2's endpoint. |
| Complete operational-source fidelity | Pass | Fabio loaded all seven committed CSVs into typed managed Delta tables. Comparisons of every row and column matched: 4 carriers, 83 locations, 302 lots, 24 products, 1,533 inventory rows, 4 suppliers, and 40 trucks; total 1,990, with zero missing or unexpected canonical records. Native metadata refresh reported success for all seven. |
| Restricted-result expectations | Pass | Owner-run SQL confirmed eight North receiving stores and eight CAR-02 shipment lines reaching eight stores for YG-2291. These are dataset checks, not authorization tests. |
| OneLake policy provisioning | Pass | Fabio created the unassigned RegionalManagerNorth and LogisticsPartner policies. Read-back assertions matched the committed path grants, row rules, fourteen permitted partner shipment columns, and empty memberships. DefaultReader permissions and membership were unchanged. |
| Post-policy owner behavior | Pass | SQL still returned 13 receiving stores; the production data agent still listed the original nine current stores after role creation. This is not restricted-identity evidence. |
| Native telemetry persistence | Pass | Fabio provisioned Eventstream `27712fbe-9867-4894-8f6e-019c0bb53edb`. The custom inlet wrote actual Parquet files and Delta log commits under `Tables/dbo/truck_temperature_events`; SQL queries succeeded after metadata refresh. |
| Telemetry payload fidelity | Pass | Two controlled sends of the 35-message fixture produced a persisted canonical set of 34 distinct payloads, with zero missing and zero unexpected. Raw rows were 49 at one observation; replay acceptance is not a raw-row-count assertion. |
| Telemetry shipment matching | Pass | All 35 fixture rows matched the six intended shipment/truck contexts within their delivery intervals: zero unmatched journeys and zero out-of-interval readings. Shipment-line context was deduplicated before joining. |
| Telemetry duration boundaries | Pass | Native SQL returned longest continuous hot durations of 25, 20, 0, 15, 5, and 25 minutes in fixture order. It confirmed two breaches, preserved exactly-4-C and exactly-20-minute boundaries, did not sum separated hot intervals, and handled out-of-order arrival and identical retries. |
| Telemetry coverage uncertainty | Pass | The two confirmed breaches remain breaches; the other four partial journeys report insufficient data rather than whole-delivery compliance. The gap case also reports insufficient data over its observed window. |
| Shipped replay producer | Pass | `src/telemetry/replay.py` accepted 35 sends. SQL found 35 newly enqueued rows after the implementation run began, with latest enqueue time `2026-10-20T21:13:06.713Z`. Total raw rows reached 105 across three fixture sends; canonical IDs stayed 34. |
| Producer validation and failure behavior | Pass | Focused standard-library probes rejected malformed events, conflicting IDs/readings, non-UTC or excessive-precision timestamps, nonfinite/oversized/nonnumeric temperatures, and six invalid connection cases. A mocked send preserved all 35 original payloads and ordering; partial network failure surfaced its accepted count without credentials. Editor diagnostics report no errors. |
| Exact learner SQL and missing sensors | Pass | The committed-path batch ran natively before and after shipped-producer replay. It returned all 13 affected shipments: two breaches, four partial observed journeys with insufficient coverage, and seven zero-reading shipments with null duration and insufficient data. |
| SQL rejection guards | Pass | Inline, nonpersisted fixtures raised the intended SQL errors 50001-50007 for empty telemetry, invalid fields/timestamps, conflicting event IDs, conflicting journey readings, unmatched journeys, inconsistent history context, and inaccessible affected-lot history. Actual lakehouse data was not modified. |
| SQL precision and complete coverage | Pass | Inline native fixtures classified 20 minutes plus one microsecond as a breach, a fully covered exactly-20-minute hot interval as no breach, a fully covered cold journey as no breach, and a coverage gap as insufficient data. |
| SQL transaction ownership and failure cleanup | Pass | The final transactional batch still returned 13 shipments, two breaches, and seven zero-reading journeys. An invalid-input probe raised 50002 with transaction count zero after rollback. An already-open transaction raised 50008 and preserved the caller's count of one until the validation harness explicitly rolled it back. |
| Native Fabric Apps item creation | Pass | Official documentation identifies Fabric Apps as built on Rayfin. Fabio created and read back AppBackend `451acf30-8346-491b-aba6-b7ab95ddc71c` as `contoso_recall_console`. Its description explicitly records that application content is not deployed. This does not validate a running application. |
| Governed temperature snapshot | Pass | `dbo.recall_temperature_status` was materialized through native Fabio CSV/Delta loading. Every column of all 13 rows matched the validated analysis, including null missing-sensor fields, two breaches, lot ID, and analysis timestamp. Owner dataset checks found eight North and eight CAR-02 rows. This is a manual snapshot, not an automatic refresh pipeline. |
| Documented snapshot refresh | Pass | The exact documented CSV export/load procedure refreshed the author-owned table successfully. The persisted result returned 13 affected shipments, two breaches, seven missing-sensor shipments, and one analysis timestamp, `2026-10-20T21:47:33.341760Z`. The temporary local CSV was removed by the procedure's exit trap. |
| Derived-table policy read-back | Pass | Both previously unassigned roles were updated individually after checking that the role baseline and empty memberships had not changed. Saved definitions matched the committed new table grant and row rules after excluding service IDs, etags, and row type annotations. DefaultReader semantics were unchanged. Raw telemetry remained excluded. Effective reader identities remain untested. |
| Complete affected-delivery replay | Pass | The additive 404-event supplement persisted through Eventstream. All 438 distinct payloads from both files matched the actual table, zero missing/unexpected; raw rows were 509 after prior fixture retries. Native SQL matched all 13 expected reading counts and longest durations, with exact delivery-start/end coverage: two breaches and eleven no-breach journeys. |
| Shared-truck consistency | Pass | Combined input preserves matching observations across overlapping shipments on the same truck. Focused producer and inline native SQL probes both rejected conflicting readings across different shipment IDs at one truck timestamp; SQL raised 50004. |
| Complete-recall snapshot refresh | Pass | The documented refresh procedure materialized the complete results. All non-refresh-time columns matched the current guarded analysis; the single persisted timestamp is `2026-10-20T22:01:07.382069Z`. Owner dataset scopes contain eight North rows/two breaches and eight CAR-02 rows/one breach. These are not reader-access passes. |
| Independent corrected fallback | Pass | `contoso_recall_fallback`, item `36ab1f02-106b-4266-a68d-e49ed78a5e7e`, SQL endpoint `57210129-b6ad-4fb4-a409-832d5616d68a`, has nine independently loaded Delta tables. All reference and lot-history columns matched both native EXCEPT directions; shipment comparison matched all 1,165,374 corrected rows across all 15 logical columns. The final table schema excludes physical Iceberg partition metadata. |
| Fallback recall acceptance | Pass | The same supplied SQL batch ran against original and fallback endpoints and returned 9 current stores, 13 receiving stores, 13 related lots, 45 reached stores, five regions, 16,961 lot rows, 1,165,374 shipment rows, and zero duplicate keys/deleted duplicate lines. |
| Fallback failure discovery and correction | Pass | Raw Iceberg copy was rejected after inspecting metadata pointers to the original item. A whole-table TDS export timed out; bounded monthly exports checked every source partition count. One transient lot-upload request failed and succeeded on explicit retry. The resulting independent Delta data passed SQL checks; these are not skipped-exercise passes. |
| Telemetry cold start and learner timing | Needs Studio verification | Initial table materialization took several minutes despite a 30-second batching setting. The complete-recall supplement was also visible in partial batches before all 404 events persisted. Pre-warm and verify actual output before launch; learner replay-control delivery, concurrent throughput, and module timing remain unverified. |
| Diagnostic session cleanup | Pass | The separate diagnostic Livy session was stopped and confirmed `killed`. Livy lacks the notebook's mounted default lakehouse and is not a substitute for this learner path. |

The first unchanged core run stopped at cell 13's intentional
`condition = None`. This is a learner-edit checkpoint, not a failed Iceberg
operation. Automated author validation must apply the answer documented in
Exercise 2.3 without removing the exercise from the learner notebook.

Producer and SQL rejection paths were exercised separately from the valid
fixture pass. The SQL analytics endpoint does not support table-variable
fixtures, so validation used inline derived tables instead; no persistent
objects or telemetry records were changed. Event-time stream windowing and
late-arrival configuration remain separate from the SQL batch's observation-time
ordering and require Studio validation if added to the learner path.

The SQL batch uses an explicit read transaction so input validation and
calculation share a snapshot during live ingestion. It rejects an existing
transaction instead of taking ownership of it and rolls back its own
transaction on failure. Fabric's transaction-level snapshot behavior is
documented in [Transactions in Fabric Data Warehouse](https://learn.microsoft.com/fabric/data-warehouse/transactions#snapshot-isolation),
which also applies to SQL analytics endpoints. The endpoint rejected
`SET XACT_ABORT`; the supplied batch uses supported `TRY`/`CATCH` rollback
handling instead.

## Release gate

Repository source can be reviewed independently, but the workshop must not be
declared ready until the Skillable preview, fresh-launch, resume, assessment,
accessibility, and independent learner checks are complete.
