# Skillable Studio inventory

This inventory separates repository content from Lab Profile configuration.
Repository Markdown does not create Studio resources, variables, or
Activities.

## Instruction source

| Setting | Required value | Status |
|---|---|---|
| Delivery mode | GitHub-backed instruction set | Needs Studio verification |
| Primary instruction file | `instructions/README.md` | Needs Studio verification |
| Default language | English | Needs Studio verification |
| Learner paths | Guided and self-paced | Required |

## Lab Profile dependencies

| Dependency | Required behavior | Status |
|---|---|---|
| Fabric workspace | Contains the Contoso Fresh workshop items | Exact name required |
| Operational data source | `contoso_operations`, separate from the destination, exposes the seven committed current-state tables under `dbo` through its own SQL endpoint | Native source and all 1,990 rows verified; fresh Lab Profile provisioning still needs verification |
| Target lakehouse | Accepts learner-created shortcuts and later module output | Exact name required |
| SharePoint connection | Preconfigured for the Supplier Quality content | Exact name required |
| SharePoint permissions | Learner can read the target library or folder | Needs Studio verification |
| Module 2 notebook | Imported from `src/notebooks/module-2-shipment-history.ipynb`; see Module 2 configuration | Needs Studio verification |
| Spark fallback table | Allows the workshop to continue after capacity or startup failure | Needs Studio verification |
| Eventstream | Replays supplied truck telemetry | Needs Studio verification |
| Security test identities | Separate reader-only North manager and CAR-02 partner accounts, without broader grants or access to the separate operational source | Identities and effective permissions require verification |
| Rayfin starter | Runs in the supplied environment | Starter and deployment toolchain absent; native AppBackend item creation succeeded |
| OneLake Read API | Available to the starter application | Needs Studio verification |

## Exercise 1.2 configuration

Exercise 1.2 relies on the pre-provisioned environment in the
[lab contract](lab-contract.md).
Studio and Fabric provisioning must satisfy these requirements:

| Contract | Required configuration |
|---|---|
| Destination | A writable lakehouse with a visible **Files** area. |
| Source type | **SharePoint Folder** in the OneLake shortcut flow. |
| Connection | A preconfigured existing connection available to the learner without an additional sign-in. |
| Source content | A **supplierQuality** library or folder containing supplier certificates and the recall procedure. |
| Shortcut name | `SupplierQuality` |
| Transformation | Skipped in Exercise 1.2; transformation is reserved for Exercise 1.3. |
| Resume state | If `SupplierQuality` already exists and is readable, the learner does not create a duplicate. |

The learner path intentionally does not create a new cloud connection or collect
a SharePoint site URL. If the provisioned connection is unavailable, the
exercise must stop with instructor intervention rather than silently use a
personal connection.

The [operational-source provisioning recipe](../../infra/README.md#operational-source)
uses Fabio's native CSV upload/load operations. In the consolidation workspace,
all seven typed Delta tables matched the committed data, and the exact learner
inventory query returned nine stores against that separate endpoint. Keep
the source and its staging files inaccessible to the restricted test identities.

## Exercise 1.3 configuration

- Provision `supplierQuality/metadata/` with only
  `supplier-certificates.csv`; do not upload the repository's JSON alternative
  to the same folder.
- Allow the supplied connection to read that folder when creating a table
  shortcut, in addition to the document shortcut.
- The learner creates `dbo.supplier_certificates` with CSV transformation,
  comma separation, and a header row. Expect four records.
- Transformation uses Fabric Spark compute and materializes a managed Delta
  table. Its completion time and refresh behavior need live validation; the
  ordinary document shortcut's zero-copy behavior does not apply.
- Keep the table outside Module 2's nine-table agent selection.

The supported transformation flow is described in
[Transform structured files into Delta tables](https://learn.microsoft.com/fabric/onelake/shortcuts/transformations).

## Module 2 configuration

All of Module 2 runs in one notebook that writes Iceberg tables to the
lakehouse. Studio and Fabric provisioning must satisfy these requirements:

| Contract | Required configuration |
|---|---|
| Capacity | A paid F2 or larger capacity. AI Functions and data agents don't run on a trial capacity. |
| Tenant settings | **Users can use Copilot and other features powered by Azure OpenAI** and **Capacities can be designated as Fabric Copilot capacities** are on. If the capacity is outside the EU data boundary and the US, both cross-geo settings are on too: data sent to Azure OpenAI can be processed, and stored, outside the capacity's region. |
| Spark runtime | The workspace default is Runtime 2.0, which includes Iceberg. Module 2 uses no Environment. |
| Spark session | Learners run the notebook in a standard session. Cells 16 and 24 use `%pip`, which doesn't work in high-concurrency mode. |
| Workspace network | No outbound access protection, so `%pip` can install DuckDB and the Data Agent SDK. |
| OneLake SAS | The workspace setting **Authenticate with OneLake user-delegated SAS tokens** is on. DuckDB reads data files with vended SAS credentials. |
| Notebook | `src/notebooks/module-2-shipment-history.ipynb`, imported as **module-2-shipment-history**. Learners attach the lakehouse in Exercise 2.1, so the import needs no lakehouse binding. |
| Lakehouse | The lakehouse that holds `SupplierQuality`, with schemas on. Learners can write to it. |
| Learner role | Contributor or higher on the workspace, to create the data agent and refresh the SQL analytics endpoint metadata. |
| Items Module 2 creates | CSV files in `Files/reference/` and `Files/history/`, the `history` schema, 7 Iceberg tables in `dbo`, `lot_history` and `shipment_history` in `history`, and the data agent `contoso_recall_agent`. |
| Resume state | Every cell can be rerun. The notebook reuses the tables it created, which carry the property `contoso.owner = prel41-module-2`, and stops rather than overwrite any other table at the same path. |

[The Contoso Fresh data model](contoso-fresh-data-model.md) describes every
table and the results the data must produce.

## Module 3 configuration

- Provision **contoso_truck_telemetry** with custom inlet **truck_replay**,
  default stream **truck_replay-stream**, and lakehouse destination
  **truck_telemetry_lakehouse**. The [Fabio recipe](../../infra/README.md#truck-telemetry-eventstream)
  was exercised in the consolidation workspace.
- Write JSON observations to `dbo.truck_temperature_events` in the same
  schema-enabled lakehouse. This is managed Delta output, separate from the
  nine Module 2 Iceberg tables and their agent selection.
- The supplied `src/telemetry/replay.py` producer requires only the existing
  Python 3.9+ standard library and a Fabio connection piped on stdin. The exact
  shipped producer sent 35 messages and all 35 were observed in actual sink
  output. Supply an authorized terminal with those existing tools and the
  workspace/Eventstream/inlet IDs, or wire the utility into the Lab Profile's
  replay control. Studio delivery for both attendee paths remains unverified.
- The [boundary fixture](../../data/telemetry/README.md) has 35 messages,
  34 stable event IDs, and six real shipment contexts. It proves threshold,
  continuity, retry, and ordering behavior, not full-fleet coverage.
- After the boundary checks, the 404-event additive coverage supplement
  completes all 13 affected journeys. Preserve both files' stable IDs.
  The combined canonical count is 438, with consistent shared-truck readings.
  Capture the missing-data results before replaying the supplement, then
  validate complete coverage and refresh the governed snapshot afterward.
- Preserve observation timestamps and deduplicate retries. Join shipment and
  truck context before calculating delivery coverage; do not infer carrier
  or regional authorization from producer-supplied fields.
- Pre-warm and verify actual Delta output before learner launch. Cold-start
  table creation took several minutes; the 30-second destination batch setting
  does not bound provisioning time.
- The governed derived table `dbo.recall_temperature_status` is provisioned
  and verified against all 13 analysis rows. It contains `lot_id` and
  `analysis_time_utc` and is an author-refreshed snapshot, not an automatic
  streaming result. Its [refresh procedure](../../infra/README.md#governed-temperature-snapshot)
  must run after the intended replay, with actual output verification.
- Separate North-store and CAR-02 row rules for the snapshot are deployed in
  the unassigned roles. Raw telemetry and staging files remain excluded.
  Application identity propagation and restricted-reader checks are still
  required before console integration.
- The supplied read-only SQL batch validates IDs, timestamps, temperatures,
  retry consistency, journey matches, and history consistency before
  calculating statuses. It returns all 13 YG-2291 shipments, including seven
  without telemetry.
- Native replay and exact SQL results now pass for complete coverage of all
  13 affected deliveries, including matching every one of the 438 persisted
  canonical payloads. Verify fresh launch and learner replay/resume in the
  Lab Profile; native owner checks do not establish the Studio delivery path.

## Module 4 configuration

- The [infrastructure role definitions](../../infra/README.md) reproduce the
  table and column scopes without assigning any identities. Both were created
  and read back through Fabio in the consolidation workspace; effective
  reader access is still unverified.
- Use the alphanumeric role names `RegionalManagerNorth` and
  `LogisticsPartner`. The partner scope is Wide World Logistics, `CAR-02`.
- Provision distinct restricted identities, not additional aliases for the
  engineer. Do not grant those identities Admin, Member, Contributor,
  ReadWrite, or an overriding ReadAll permission.
- Configure the destination SQL analytics endpoint for **User's identity
  access mode** before the workshop. Do not silently change a populated
  author's endpoint: switching access modes can remove inline metadata
  objects. Confirm the effect during provisioning.
- Regional RLS applies separately to locations, inventory, and shipment
  history. North is `STR-001` through `STR-016` in this snapshot; OneLake RLS
  does not support joining the location dimension in a row rule.
- Partner RLS limits shipment, truck, and carrier tables to `CAR-02`.
  Shipment CLS hides `supplier_cost_eur`. Do not grant the partner lot tables
  containing `supplier_unit_cost_eur`, raw reference/history folders, or the
  separate operational source.
- Review DefaultReader and every other effective grant. The role model is
  additive, so narrower rules do not cancel wider access from another role.
- As the North manager, expect eight current stores and eight historical
  receiving stores for YG-2291. As the partner, expect eight shipment lines
  for that lot reaching eight stores. These are dataset expectations, not
  proof that the identities have passed access checks.
- Allow up to five minutes for SQL endpoint security synchronization, then
  rerun the positive and negative identity checks in Exercise 4.3.
- Telemetry and console authorization remain separate checks. Do not assume
  that table-role configuration proves application or data-agent identity
  propagation.

Product behavior is described in:

- [Create and manage OneLake security roles](https://learn.microsoft.com/fabric/onelake/security/create-manage-roles)
- [Row-level security syntax](https://learn.microsoft.com/fabric/onelake/security/row-level-security-syntax)
- [SQL analytics endpoint access modes](https://learn.microsoft.com/fabric/onelake/security/sql-analytics-endpoint-onelake-security)

## Module 5 configuration

- Fabric Apps (preview) is built on Rayfin. Use the
  [current product overview](https://learn.microsoft.com/fabric/apps/overview)
  and [CLI reference](https://learn.microsoft.com/fabric/apps/cli-reference),
  not assumptions based on an older CLI label.
- Fabio successfully created **contoso_recall_console** as an AppBackend in
  the consolidation workspace. This does not deploy frontend assets,
  application services, authentication configuration, or data connectors.
- Supply the actual application starter and its existing deployment tools
  before launch. A starter must include its project manifest and
  `rayfin/rayfin.yml`, target the authorized workspace/item, and document its
  exact start and deploy commands. Do not require learners to select a
  framework, install tools, or scaffold a replacement.
- The current environment has no Rayfin executable or supplied application
  project. Generic Fabio item-definition retrieval is unsupported for the
  created AppBackend; it is not a substitute deployment path.
- Keep Fabric SSO and end-user data authorization distinct. An app's
  **Run and interact** permission allows use of the app; it does not prove
  that downstream OneLake queries use that user's identity.
- Require the same positive and negative manager/partner checks through the
  actual deployed app. No owner-key backend, client-side row filtering,
  anonymous recall data, or raw-telemetry grant is an acceptable substitute.
- The console must preserve missing-sensor uncertainty and distinguish current
  inventory from shipment history. Do not label all 13 receiving stores as
  current holders or convert absent telemetry into a compliant status.

## Tokens and variables

The canonical learner path in `instructions/README.md` and `instructions/module-2/`
currently contains no active `@lab.*` replacement tokens, variables, conditional
displays, or text fields.

The retained automotive contribution,
`instructions/1-ingest-operational-data-from-sharepoint.md`, is not linked from
that path. It contains credential and lab-instance tokens that must be
reconciled with Studio before any of its instructions are incorporated.

Before introducing a token, record its exact Studio alias, producer, first
availability, consumers, resume behavior, and fallback path.

## Activities and scoring

The learner instructions currently contain no `@lab.Activity(...)` references.
No Questions, Automated Activities, Activity Groups, scores, or pass thresholds
are declared.

## Assets and external dependencies

The canonical learner path includes a visually checked Add data items menu
screenshot under `instructions/module-2/media/`. Missing image placeholders
were removed; the steps use explicit control names and observable results
without depending on unavailable captures.
The retained automotive contribution also references images under
`instructions/media/`. These must be checked and adapted before integration
into the Contoso Fresh path.
Product behavior for OneDrive and SharePoint shortcuts is based on:

- [Create a OneDrive or SharePoint shortcut](https://learn.microsoft.com/fabric/onelake/shortcuts/create-onedrive-sharepoint-shortcut)
- [Shortcuts in a lakehouse](https://learn.microsoft.com/fabric/data-engineering/lakehouse-shortcuts)

## Studio setup checklist

1. Configure `instructions/README.md` as the GitHub instruction source.
1. Reconcile every supplied resource name with the learner instructions.
1. Confirm the SharePoint connection is precreated and selectable by learners.
1. Confirm permissions and reset behavior in a fresh lab instance.
1. Preview every `===` page and verify narrow-pane rendering.
1. Configure and test any future Activities before adding their aliases to
   learner Markdown.
