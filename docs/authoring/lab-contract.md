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
| Unify operational and document data | Operational records and Supplier Quality files are visible through OneLake without a learner-built copy pipeline. The document shortcut is zero-copy; certificate transformation materializes a managed Delta table. |
| Add interoperable historical data | The supplied Spark flow produces Apache Iceberg tables that are accessible through OneLake. |
| Add and interpret a real-time signal | Truck telemetry identifies shipments above 4 C for more than 20 minutes. |
| Govern data access | Regional manager and logistics partner identities receive the intended rows and columns. |
| Build a recall experience | The Recall Console displays stores, shipment history, temperature status, and supplier document links through governed access. |

## Duration

The planning allowance is 240 minutes. This is a run of show, not a measured
completion-time claim:

| Elapsed time | Module | Allowance | Checkpoint |
|---|---|---:|---|
| 00:00-00:20 | Welcome and environment check | 20 minutes | Supplied items, source connection, test identities, terminal, and starter are available. |
| 00:20-01:10 | Unify operational and unstructured data | 50 minutes | Documents open, four certificate records resolve, and the separate operational endpoint returns nine current stores. |
| 01:10-02:00 | Spark writes Iceberg | 50 minutes | Corrected history, DuckDB, AI Functions, and the published nine-table agent pass their own checks. |
| 02:00-02:10 | Break | 10 minutes | Preserve the notebook, workspace, and signed-in session. |
| 02:10-02:25 | Real-time signal | 15 minutes | Actual sink output covers all thirteen affected deliveries; the refreshed snapshot reports two breaches and eleven no-breach journeys. |
| 02:25-03:00 | Govern with OneLake Security | 35 minutes | Actual North and CAR-02 readers pass positive and denied-access checks. |
| 03:00-03:45 | Build the Recall Console | 45 minutes | Deployed content uses the verified user-identity data path and authorized document links. |
| 03:45-04:00 | Wrap-up | 15 minutes | Demonstrate the five answers, freshness, and restricted-identity evidence. |

Spark session startup and other variable service delays must be measured during
fresh-instance testing. Record actual start/end times and time waiting for
Spark, transformations, SQL refresh, telemetry persistence, security
synchronization, and application deployment. In particular, the fifteen-minute
telemetry allowance must include cold-start persistence and snapshot refresh,
not just accepted sends.

If a checkpoint is missed, use the documented recovery path and record the
unfinished exercise; do not silently skip a technology or identity check to
claim a four-hour completion. A separate precomputed fallback lakehouse is
required for historical investigation during Spark repair.
[Optional extensions](../../instructions/README.md#optional-extensions) are
outside this core allowance and do not replace a required exercise.

## Environment and permissions

The lab uses Microsoft Fabric and SharePoint. The optional external analytics
service is outside the required learner path.

The Skillable environment must provide:

- A Contoso Fresh Fabric workspace.
- Write access to the target lakehouse.
- Read access to the Supplier Quality SharePoint content.
- A preconfigured SharePoint cloud connection for the shortcut exercise.
- Supplied operational, historical, and telemetry data.
- Any identities required to validate OneLake Security.
- The Rayfin starter and OneLake Read API access required by Module 5.

Exact learner workspace, item, connection, identity, and SharePoint names must
be reconciled with the Lab Profile before release. The author-only
consolidation workspace does not establish the learner provisioning contract.

Module 1 uses the seven current-state tables in the
[shared data model](contoso-fresh-data-model.md) to identify current inventory.
These tables contain neither orders nor shipments. Module 2 owns shipment
history and answers which stores received affected products in the past.

The supplied operational source must expose its seven reference tables through
a SQL analytics endpoint under `dbo`. This is a separate endpoint from the
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
| `contoso_operations` | Author supplies seven managed Delta reference tables in a separate source lakehouse and endpoint. | Preserve source data. Module 2 must not overwrite it; restricted readers receive no alternate access through it. |
| SharePoint source and connection | Author publishes the seven synthetic files under `supplierQuality`, keeps `metadata` CSV-only, and supplies a tested connection. | Reuse matching source content and connection. Do not reset SharePoint by deleting source files or changing site sharing. |
| `SupplierQuality` and `dbo.supplier_certificates` | Absent before Exercises 1.2 and 1.3 so the learner creates them. | Reuse only matching readable shortcuts and a successful four-record transformation. Reset only learner-created destination objects, not the source. |
| Module 2 notebook and tables | Author imports the supplied notebook. Learner attaches the destination and creates seven `dbo` Iceberg tables and two `history` tables. | Reuse only notebook-owned tables with `contoso.owner = prel41-module-2`; retain the certificate table. Never replace unrelated tables or bind the notebook to the fallback. |
| `contoso_recall_agent` | Created by the learner with the explicit nine-table selection. | Recheck selection and final publication. Certificate, telemetry, and snapshot additions do not enlarge the agent's scope. |
| `contoso_truck_telemetry` | Author supplies the inlet, destination, replay utility/control, and authorized terminal. Raw output may be absent before the first replay. | Verify the actual destination state, then replay stable IDs. Preserve retries and use canonical payloads rather than a fixed raw-row total. |
| `dbo.recall_temperature_status` | Author refreshes it from verified persisted telemetry before governed reads. It is not an automatically updated stream. | Refresh after the intended complete replay, verify all thirteen rows, and retain the actual analysis timestamp. Do not expose staging files to restricted readers. |
| `RegionalManagerNorth` and `LogisticsPartner` | Learner creates selected-path roles and assigns the supplied restricted identities. | Inspect existing memberships and grants before reuse. Empty author templates must not overwrite assigned roles or DefaultReader. |
| `contoso_recall_console` | Author supplies the target AppBackend, runnable starter, configured connector, and existing tools; learner completes the application flow. | Reuse the configured item. An empty item is not deployed content. Reset must clear instance-specific sessions and cached data without deleting shared services. |
| `contoso_recall_fallback` | Author supplies independent corrected Delta data for read-only recovery. | Keep it separate from notebook ownership. Recovery does not automatically rebind later modules, reader roles, or the console. |

The [Studio inventory](studio-inventory.md) records the settings and outstanding
fresh-launch checks. This table defines required behavior; it does not claim
that Studio provisioning or reset automation has been implemented.

## Exercise sequence and dependencies

Exercises are ordered so each module contributes data or policy used later:

1. Confirm the environment and recall questions.
1. Unify operational and supplier data.
1. Add shipment history through Iceberg.
1. Add the truck temperature signal.
1. Apply OneLake Security.
1. Build and validate the Recall Console.

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

The learner completes the workshop when the Recall Console answers the five
scenario questions and returns different governed results for the supplied
manager and partner identities.

## Objective coverage

| Objective | Exercises | Observable evidence |
|---|---|---|
| Unify operational and document data | [1.1-1.4](../../instructions/README.md#unify-operational-data) | The source endpoint returns nine current stores; the document shortcut exposes the six text files; the transformed table contains four certificates with working relative document paths. |
| Add interoperable history | [2.1-2.3](../../instructions/module-2/exercise-2-3-write-shipment-history-as-iceberg.md), [2.4](../../instructions/module-2/exercise-2-4-trace-related-lots-with-duckdb.md), [2.5](../../instructions/module-2/exercise-2-5-read-shipment-notes-with-ai-functions.md), [2.6](../../instructions/module-2/exercise-2-6-ask-the-recall-agent.md) | Corrected history has 1,165,374 lines and thirteen YG-2291 receiving stores. DuckDB finds thirteen related lots reaching forty-five stores in five regions; AI produces thirty temperatures, twenty-three durations, and six summaries; the published nine-table agent distinguishes nine current from thirteen historical stores. Each engine must run; one engine's result does not prove another's execution. |
| Interpret the real-time signal | [3.1-3.2](../../instructions/README.md#check-temperature-telemetry) | Persist all 438 canonical payloads; distinguish strict thresholds, gaps, retries, and ordering; complete all thirteen delivery intervals and refresh the two-breach/eleven-no-breach snapshot. |
| Govern access | [4.1-4.3](../../instructions/README.md#govern-recall-access) | The North identity sees eight current stores and eight derived rows. CAR-02 sees eight affected derived rows, no other carrier, no supplier costs, and no raw-file alternative. Both identities perform positive and denied-access reads against existing resources. |
| Build the recall experience | [5.1-5.3](../../instructions/README.md#build-the-recall-console) and [wrap-up](../../instructions/README.md#review-the-investigation) | Actual deployed app responses, not browser-side filtering, contain only permitted inventory/history/temperature data. Show signed-in identity, snapshot age, authorized document links, and no prior-user cache leakage. |

### Session-description coverage gap

The authored root session description also promises mirroring and ETL/ELT
pipeline work. The canonical five-module path above uses a pre-provisioned
operational source and does not contain a learner-built mirroring or
Data Factory pipeline exercise. The author-triggered
[temperature refresh pipeline](../../infra/README.md#native-pipeline-refresh)
now materializes guarded SQL into Delta, but it is not mirroring or a
learner-built pipeline exercise. CSV shortcut transformation is also not
evidence of those separate features. Preserve the authored
description until the session owner reconciles that scope; do not sign off
the broader description from this objective map.

The learner wrap-up provides an explicit five-question evidence table and
handoff sequence. Correct owner-account dataset results are necessary but
not sufficient: the deployed console, document path, actual restricted
identities, negative reads, and data freshness must be demonstrated. A
fallback or skipped runtime path must remain visible in the completion record.
