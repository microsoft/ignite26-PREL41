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

The integrated browser still prompts for sign-in; browser and CLI sessions
are separate. CLI-backed Fabric API access is working. AI/OneLake settings,
workload execution, SharePoint access, and Skillable access remain unverified.

## Phase 1: Consolidate the workshop contract

- [x] Integrate the scaffold, supplier exercise, and Module 2 contributions
  from PRs #3, #4, and #9 in dependency order.
- [ ] Reconcile merged PR #10 with the Contoso Fresh recall scenario;
  preserve reusable walkthrough material and replace automotive-specific
  data flows with recall-relevant flows.
- [ ] Define one pre-provisioned environment, lakehouse layout, naming
  convention, and resource ownership contract.
- [ ] Separate current-inventory questions in Module 1 from shipment-history
  questions in Module 2; resolve references to operational orders/shipments.
- [ ] Agree shared identifiers, schemas, expected results, scenario clock,
  security identities, and downstream data requirements.
- [ ] Map every workshop objective to an exercise and observable evidence.
- [ ] Confirm the four-hour core path and clearly label optional extensions.

## Phase 2: Complete all learner modules

- [ ] Welcome: environment checks, prerequisites, recall questions, and both
  guided and self-paced starting paths.
- [ ] Module 1: operational recall data, supplier-document shortcut,
  transformations, completion checks, and downstream handoff.
- [ ] Module 2: historical-data generation, Iceberg writes and row changes,
  snapshots, REST catalog, DuckDB tracing, AI Functions, and data agent.
- [ ] Module 3: supplied/replayable telemetry, Eventstream path, the
  above-4-C-for-more-than-20-minutes rule, shipment joins, and expected results.
- [ ] Module 4: regional-manager and logistics-partner access, row/column
  restrictions, denied-access checks, and identity-specific expected results.
- [ ] Module 5: Recall Console starter and complete flow, governed OneLake
  reads, inventory/history/temperature/document views, and access verification.
- [ ] Wrap-up: demonstrate answers to all scenario questions and document
  supported continuation paths.
- [ ] Provide documented recovery, resume, rerun, and fallback behavior
  wherever required by the lab contract.

## Phase 3: Instructions and delivery

- [ ] Provide one canonical attendee entry point and verify Skillable
  navigation for all exercises.
- [ ] Complete screenshots and remove broken image/link references.
- [ ] Correct known PR #10 code-example indentation and verify all examples.
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
- [ ] Complete previously unverified Module 2 AI Functions cell 23 and the
  final data-agent publish step.
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
