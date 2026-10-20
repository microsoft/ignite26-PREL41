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

The target learner time is 240 minutes:

| Module | Duration |
|---|---:|
| Welcome and environment check | 20 minutes |
| Unify operational and unstructured data | 50 minutes |
| Spark writes Iceberg | 50 minutes |
| Break | 10 minutes |
| Real-time signal | 15 minutes |
| Govern with OneLake Security | 35 minutes |
| Build the Recall Console | 45 minutes |
| Wrap-up and optional paths | 15 minutes |

Spark session startup and other variable service delays must be measured during
fresh-instance testing. A precomputed fallback table is required for the Spark
module.

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
| Unify operational and document data | 1.1-1.4 | Supplier documents and affected-store results are visible in OneLake. |
| Add interoperable history | 2.1-2.6 | Iceberg history is accessible and related lots are identified. |
| Interpret the real-time signal | 3.1-3.2 | Temperature breach status is joined to affected shipments. |
| Govern access | 4.1-4.3 | Test identities return different permitted rows and columns. |
| Build the recall experience | 5.1-5.3 | The Recall Console displays governed recall data. |

The learner wrap-up provides an explicit five-question evidence table and
handoff sequence. Correct owner-account dataset results are necessary but
not sufficient: the deployed console, document path, actual restricted
identities, negative reads, and data freshness must be demonstrated. A
fallback or skipped runtime path must remain visible in the completion record.
