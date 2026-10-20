# Lab test matrix

Use **Pass**, **Fail**, **Needs Studio verification**, or **Not applicable**.
Record evidence for every completed test.

| Test | Expected result | Status | Evidence |
|---|---|---|---|
| Markdown structure | Headings, lists, tables, code fences, callouts, and page breaks are structurally valid. | Pass | Source inspection of `instructions/README.md`. |
| Local links | All repository-relative links resolve. | Fail | Module 2 still references missing screenshots; see the screenshots check. |
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
| Module 2 - screenshots | Every image link under `instructions/module-2/` resolves. | Fail | The Add data items menu screenshot is captured and visually checked. The other 10 image targets are still missing; clipped or blank captures were discarded. |
| Spark capacity and fallback | The notebook completes in time or the documented fallback allows progress. | Needs Studio verification | Requires concurrent launch testing. |
| Eventstream replay | Telemetry arrives and supports the temperature-breach result. | Needs Studio verification | Requires live Fabric items. |
| Security identities | Manager and partner identities return the intended rows and columns. | Needs Studio verification | Environment design is still open. |
| Recall Console | The application reads OneLake data and respects OneLake Security. | Needs Studio verification | Requires Rayfin and OneLake Read API access. |
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
| Default lakehouse binding | Pass | Omitting the complete native execution binding triggered the notebook's explicit starting check. Bound native runs completed. The learner's Explorer attachment step still needs UI verification. |
| Diagnostic session cleanup | Pass | The separate diagnostic Livy session was stopped and confirmed `killed`. Livy lacks the notebook's mounted default lakehouse and is not a substitute for this learner path. |

The first unchanged core run stopped at cell 13's intentional
`condition = None`. This is a learner-edit checkpoint, not a failed Iceberg
operation. Automated author validation must apply the answer documented in
Exercise 2.3 without removing the exercise from the learner notebook.

## Release gate

Repository source can be reviewed independently, but the workshop must not be
declared ready until the Skillable preview, fresh-launch, resume, assessment,
accessibility, and independent learner checks are complete.
