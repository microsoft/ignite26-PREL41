# Lab contract

## Scenario

Contoso Fresh is a cold-chain food distributor responding to a possible
contamination in yogurt lot **YG-2291**. The learner acts as a data and analytics
engineer who must give regional managers a governed recall console before noon.

## Audience

The audience level is not yet confirmed. The current instruction design assumes
learners can navigate Microsoft Fabric and understand basic tables, SQL results,
and data access concepts. Product-specific actions remain guided.

## Outcomes and acceptance criteria

| Outcome | Acceptance criteria |
|---|---|
| Unify operational and document data | Observe insert/update/delete from the native SQL source through its OneLake mirror, then read nine affected current stores. The document shortcut is zero-copy; certificate transformation materializes a managed Delta table. |
| Add interoperable historical data | The supplied Spark flow produces Apache Iceberg tables that are accessible through OneLake. |
| Interpret the supplied temperature snapshot | Read verified `dbo.recall_temperature_status` and its actual analysis time. The preserved replay and guarded refresh exercises are optional supporting material. |
| Govern data access | Regional manager and logistics partner identities receive the intended rows and columns. |
| Build a recall experience | Start in `src/console/`, add Rayfin using independent `src/console-final/` as reference, and retain stores, history, temperature, documents, and the DevTools bar. Each pasted bearer token is one OneLake identity; Module 4 compares **My account** with a service principal in `RegionalManagerNorth`. |

## Duration

The planning allowance is 240 minutes. This is a run of show, not a measured
completion-time claim:

| Elapsed time | Module | Allowance | Checkpoint |
|---|---|---:|---|
| 00:00-00:15 | Welcome and environment check | 15 minutes | Supplied items, source connection, test identities, terminal, and starter are available. |
| 00:15-01:05 | Unify operational and unstructured data | 50 minutes | Source insert/update/delete reach the mirror, documents open, four certificate records resolve, and the mirrored endpoint returns nine current stores. |
| 01:05-01:55 | Spark writes Iceberg | 50 minutes | Corrected history, DuckDB, AI Functions, and the published nine-table agent pass their own checks. |
| 01:55-02:05 | Break | 10 minutes | Preserve the notebook, workspace, and signed-in session. |
| 02:05-03:05 | Build the Rayfin data app | 60 minutes | Bearer sign-in and dashboard work with **My account**; Rayfin is initialized and the app is deployed as a Fabric App with direct Table API reads; local checks are reviewed. |
| 03:05-03:45 | Govern with OneLake Security and revisit app | 40 minutes | Actual North and CAR-02 readers pass positive and denied-access checks. In the app, **My account** shows nine current stores and the service principal in `RegionalManagerNorth` shows eight North stores. |
| 03:45-04:00 | Wrap-up | 15 minutes | Demonstrate the five answers, freshness, and restricted-identity evidence. |

Spark session startup and other variable service delays must be measured during
fresh-instance testing. Record actual start/end times and time waiting for
Spark, transformations, SQL refresh, telemetry persistence, security
synchronization, and application deployment. Optional telemetry/pipeline
work is outside this core allowance. Module 5 has only a handoff title; no
engine exercises or measured runtime are implied. The rebalanced allowances
remain unmeasured planning targets, not evidence that the new sequence fits.

If a checkpoint is missed, repair the supplied environment and record the
unfinished exercise; do not silently skip a technology or identity check to
claim a four-hour completion. Module 2 must use its supplied notebook,
lakehouse, and exercise sequence, not a precomputed alternate dataset.
[Optional extensions](../../instructions/README.md#optional-extensions) are
outside this core allowance and do not replace a required exercise.

## Environment and permissions

The lab uses Microsoft Fabric and SharePoint. The optional external analytics
service is outside the required learner path.

The current author review runs directly in the owner's selected Fabric
workspace, using the [recorded resource inventory](../../CONSOLIDATION-TODO.md#current-fabric-destination)
and [native setup and recovery procedures](../../infra/README.md). Skillable
provisioning and fresh-launch/resume/reset checks follow approval of the
working Fabric lab. The delivery requirements below are not prerequisites
for continuing that author review.

The Skillable environment must provide:

- A Contoso Fresh Fabric workspace.
- Write access to the target lakehouse.
- Read access to the Supplier Quality SharePoint content.
- A preconfigured SharePoint cloud connection for the shortcut exercise.
- Supplied operational, historical, and telemetry data.
- Any identities required to validate OneLake Security.
- The plain console starter and completed Rayfin reference for Module 3,
  with pinned tooling, Azure CLI, and supplied Table API settings.
- A supplied, verified `dbo.recall_temperature_status` before Module 3:
  thirteen shipments, two breaches, eleven fully observed no-breach journeys,
  and the actual `analysis_time_utc`. The core app does not create a snapshot.
- For the Module 4 service principal: permission to create app
  registrations, and the Fabric tenant setting **Service principals can call
  Fabric public APIs** enabled for that principal or its security group.
  Learners give it workspace **Viewer** only, because Admin, Member, and
  Contributor bypass OneLake security roles, and add it to the existing
  `RegionalManagerNorth` role. Confirm DefaultReader or another ReadAll grant
  does not give it broader access. Learners delete the service principal and
  its app registration at the end of the lab.

Exact learner workspace, item, connection, identity, and SharePoint names must
be reconciled with the Lab Profile before release. The author-only
consolidation workspace does not establish the learner provisioning contract.

Module 1 uses the seven current-state tables in the
[shared data model](contoso-fresh-data-model.md) to identify current inventory.
These tables contain neither orders nor shipments. Module 2 owns shipment
history and answers which stores received affected products in the past.

The supplied **contoso_operations_sql** SQL database must automatically mirror
its seven reference tables into OneLake and expose them through its separate
SQL analytics endpoint under `dbo`. Its additional `workshop.mirroring_probe`
is an empty, isolated training table, not a recall record. This is a separate endpoint from the
destination lakehouse; provisioning must not place unowned current-state
tables in that lakehouse's `dbo` schema, where Module 2 creates its Iceberg
tables. Both representations use the same committed reference data.

Exercise 1.3 creates `dbo.supplier_certificates` in the destination lakehouse.
This additional Delta table is not owned or rewritten by Module 2 and is not
one of the nine operational/history tables selected for its recall agent.

## Resource ownership

Provided resources include the Fabric workspace, operational database,
lakehouse, historical source data, Eventstream, SharePoint content, fallback
table, test identities, and application starter.

Learners create or change the SharePoint shortcut, transformed certificate
table, Iceberg history, security roles, and Recall Console. Reset behavior for
these changes must be confirmed in a fresh Skillable instance.

### Fresh, resumed, and reset state

Use these canonical names in the Lab Profile. Instance-specific IDs and supplied
identities must be bound by provisioning; do not copy the author workspace IDs
or credentials into the learner path.

| Resource | Fresh-instance state and owner | Resume and reset boundary |
|---|---|---|
| Workspace and `contoso_fresh` | Author supplies an isolated, schema-enabled destination and engineer write access. Restricted readers are not workspace Contributors, Members, or Admins. | Verify the supplied IDs. Reset only the lab instance's resources, never a shared source or the author validation workspace. |
| `contoso_operations_sql` | Author supplies a native SQL database with seven typed reference tables, an empty `workshop.mirroring_probe`, and its automatically mirrored SQL endpoint. | Preserve all recall records. Learner writes only the probe, observes each change, and leaves source/mirror empty. Restricted readers receive no alternate source or mirror access. |
| SharePoint source and connection | Author publishes the seven synthetic files under `supplierQuality`, keeps `metadata` CSV-only, and supplies a tested connection. | Reuse matching source content and connection. Do not reset SharePoint by deleting source files or changing site sharing. |
| `SupplierQuality` and `dbo.supplier_certificates` | Absent before Exercises 1.2 and 1.3 so the learner creates them. | Reuse only matching readable shortcuts and a successful four-record transformation. Reset only learner-created destination objects, not the source. |
| Module 2 notebook and tables | Author imports the supplied notebook. Learner attaches the destination and creates seven `dbo` Iceberg tables and two `history` tables. | Reuse only notebook-owned tables with `contoso.owner = prel41-module-2`; retain the certificate table. Never replace unrelated tables or switch to alternate data to bypass an exercise. |
| `contoso_recall_agent` | Created by the learner with the explicit nine-table selection. | Recheck selection and final publication. Certificate, telemetry, and snapshot additions do not enlarge the agent's scope. |
| `contoso_truck_telemetry` | Author supplies the inlet, destination, replay utility/control, and authorized terminal. Raw output may be absent before the first replay. | Verify the actual destination state, then replay stable IDs. Preserve retries and use canonical payloads rather than a fixed raw-row total. |
| `contoso_temperature_refresh` and candidate | Optional telemetry Exercise 3.3 retains the original learner-deployment and resume flow. Not required learner creation in the core app path. | Reuse only matching workshop settings and wait for active runs. Reset owns the optional learner-created item/candidate; never grant readers candidate access. |
| `dbo.recall_temperature_status` | Author supplies verified complete output before core Module 3. It is not an automatically updated stream and the app does not create it. | Instructor refreshes after changed observations, verifies all thirteen rows and job interval, and retains the analysis timestamp. Do not overwrite unrelated tables or expose deployment files. |
| `RegionalManagerNorth` and `LogisticsPartner` | Learner creates selected-path roles and assigns the supplied restricted identities. | Inspect existing memberships and grants before reuse. Empty author templates must not overwrite assigned roles or DefaultReader. |
| `contoso_recall_console` | Author supplies the target AppBackend, runnable starter, configured connector, and existing tools; learner completes the application flow. | Reuse the configured item. An empty item is not deployed content. Reset must clear instance-specific sessions and cached data without deleting shared services. |

The [Studio inventory](studio-inventory.md) records the settings and outstanding
fresh-launch checks. This table defines required behavior; it does not claim
that Studio provisioning or reset automation has been implemented.

## Exercise sequence and dependencies

Exercises are ordered so each module contributes data or policy used later:

1. Confirm the environment and recall questions.
1. Unify operational and supplier data.
1. Add shipment history through Iceberg.
1. Build the Rayfin data app with **My account**, using the supplied verified temperature snapshot.
1. Apply OneLake Security, then revisit the app with a service principal in `RegionalManagerNorth`.
1. Hand off to Module 5: Query Fabric with DuckDB and ClickHouse (title only).

The original [telemetry and pipeline exercises](../../instructions/optional-telemetry.md)
remain optional with unchanged exercise numbers and technical assets.

If a learner resumes the lab, each exercise must begin with an observable state
check. Destructive cleanup is not part of the learner path unless the Lab
Profile reset process requires it.

## Assessment

No Skillable Questions, Automated Activities, or Activity Groups are declared
yet. The current learner instructions use observable completion checks only.
Any graded assessment requires a separate author-only specification and Studio
configuration before adding `@lab.Activity(...)` references.

## Delivery

The intended delivery is a GitHub-backed Skillable instruction set using
`instructions/README.md` as the single configured Markdown file. The contents
of `docs/authoring/` are author resources and are not learner instructions.

## Safety and cost

Learners use only pre-provisioned accounts and resources. Instructions must not
expose reusable credentials, require external account creation, or create
unapproved cloud resources. The lab should reset learner-created Fabric items
between launches.

## Completion

The learner completes the implemented path when the Recall Console answers
the five scenario questions and, in Module 4, shows different
OneLake-governed results for **My account** and the **Service principal** in
`RegionalManagerNorth`. OneLake evaluates the pasted bearer token on every
read. No client-side policy filtering is acceptable.

## Objective coverage

| Objective | Exercises | Observable evidence |
|---|---|---|
| Unify operational and document data | [1.1-1.4](../../instructions/README.md#unify-operational-data) | Source probe insert/update/delete and matching timestamps arrive through the separate mirror; probe ends empty. The mirrored endpoint returns nine current stores; document shortcuts expose six text files and four transformed certificates with working paths. |
| Add interoperable history | [2.1-2.3](../../instructions/module-2/exercise-2-3-write-shipment-history-as-iceberg.md), [2.4](../../instructions/module-2/exercise-2-4-trace-related-lots-with-duckdb.md), [2.5](../../instructions/module-2/exercise-2-5-read-shipment-notes-with-ai-functions.md), [2.6](../../instructions/module-2/exercise-2-6-ask-the-recall-agent.md) | Corrected history has 1,165,374 lines and thirteen YG-2291 receiving stores. DuckDB finds thirteen related lots reaching forty-five stores in five regions; AI produces thirty temperatures, twenty-three durations, and six summaries; the published nine-table agent distinguishes nine current from thirteen historical stores. Each engine must run; one engine's result does not prove another's execution. |
| Interpret the real-time signal (optional) | [Original 3.1-3.3](../../instructions/optional-telemetry.md#check-temperature-telemetry) | Persist all 438 canonical payloads; distinguish thresholds, gaps, retries, and ordering. Deploy the guarded Copy pipeline, accept the isolated candidate, then promote and accept the two-breach/eleven-no-breach snapshot with a timestamp inside its completed job. |
| Govern access | [4.1-4.3](../../instructions/README.md#govern-recall-access) | The North identity sees eight current stores and eight derived rows. CAR-02 sees eight affected derived rows, no other carrier, no supplier costs, and no raw-file alternative. Both identities perform positive and denied-access reads against existing resources. |
| Build the recall experience | [3.1-3.3](../../instructions/README.md#module-3-build-a-data-app-with-rayfin), [4.3](../../instructions/module-4/exercise-4-3-query-secured-data-through-sql.md), and [wrap-up](../../instructions/README.md#review-the-investigation) | Retain the dashboard and DevTools bar. Compare **My account** (nine current stores) with the service principal in `RegionalManagerNorth` (eight North stores, eight North temperature rows with two breaches) in DevTools **Network** and **Identity**, without client filtering. Show snapshot time, authorized documents, direct Table API requests, and separate per-identity data. Record local checks separately from pending live runs. |

### Mirroring and pipeline scope

The canonical path includes automatic mirroring for **SQL database in
Fabric**, with learner-observed insert/update/delete. Deployment of the
Data Factory SQL-to-Delta temperature pipeline is preserved in the optional
supporting path. Initial CSV seeding alone is
not mirroring evidence; the change-propagation checks are required. Pipeline
item creation alone is likewise insufficient: both destination checks must pass.

This does not teach configuring an external Azure SQL, PostgreSQL, SAP, or
other third-party mirror. That broader connector setup is outside the core
path. CSV shortcut transformation remains a separate feature, not a substitute
for either native mirroring or the guarded pipeline.

The learner wrap-up provides an explicit five-question evidence table and
handoff sequence. Correct owner-account dataset results are necessary but
not sufficient: the deployed console, document path, actual restricted
identities, negative reads, and data freshness must be demonstrated. A
skipped runtime path must remain visible in the completion record.
