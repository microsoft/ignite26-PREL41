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
East. The separate operational source and SharePoint transformation are not
yet validated. The certificate table is explicitly excluded from Module 2's
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
- [ ] Module 2: historical-data generation, Iceberg writes and row changes,
  snapshots, REST catalog, DuckDB tracing, AI Functions, and data agent.
- [ ] Module 3: supplied/replayable telemetry, Eventstream path, the
  above-4-C-for-more-than-20-minutes rule, shipment joins, and expected results.
- [ ] Module 4: regional-manager and logistics-partner access, row/column
  restrictions, denied-access checks, and identity-specific expected results.
- [x] Implement and deploy unassigned OneLake policy definitions for North and
  CAR-02, and assert their saved content while preserving default permissions.
- [ ] Supply and exercise actual restricted reader identities against those
  policies, the SQL endpoint, documents, telemetry, and console.
- [ ] Module 5: Recall Console starter and complete flow, governed OneLake
  reads, inventory/history/temperature/document views, and access verification.
- [ ] Wrap-up: demonstrate answers to all scenario questions and document
  supported continuation paths.
- [ ] Provide documented recovery, resume, rerun, and fallback behavior
  wherever required by the lab contract.

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
- Skillable Studio/Lab Profile access and the provisioned operational source.
- The telemetry replay producer and Rayfin starter/preview access. Neither
  implementation is in the repository or its current open contribution
  branches. Fabio's Power Apps AppBackend is not established as Rayfin.
- A provisioned environment satisfying the existing package-based Module 2
  path; DuckDB and the Data Agent SDK remain uninstalled and unverified.

Modules 3 and 5 are not implemented, restricted-identity and Skillable runs
have not passed, and the final post-feature red-team has not started. Do not
open the final PR or report publication readiness on the strength of the
completed owner-account checks.

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
