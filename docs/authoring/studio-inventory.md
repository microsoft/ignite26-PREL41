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
| Operational data source | `contoso_operations_sql` SQL database, separate from the destination, mirrors seven canonical `dbo` tables plus an isolated training probe into its own OneLake SQL endpoint | Both source/mirror copies of all 1,990 records and actual insert/update/delete propagation verified; fresh Lab Profile provisioning still needs verification |
| Target lakehouse | Accepts learner-created shortcuts and later module output | Exact name required |
| SharePoint connection | Preconfigured for the Supplier Quality content | Author connection `PREL41-SupplierQuality` works; fresh Lab Profile delivery still needs verification |
| SharePoint permissions | Learner can read the target library or folder | Author downloaded all seven matching source files through the actual OneLake shortcut; fresh learner access remains unverified |
| Module 2 notebook | Imported from `src/notebooks/module-2-shipment-history.ipynb`; see Module 2 configuration | Needs Studio verification |
| Eventstream | Replays supplied truck telemetry | Needs Studio verification |
| Authorized terminal | Existing Python 3.9+, Fabio with its working credential provider, repository checkout, supplied engineer identity, and instance-specific replay/pipeline bindings | Native replay and deployment paths verified; terminal delivery and identity isolation need Studio verification |
| Security test identities | Separate reader-only North manager and CAR-02 partner accounts, without broader grants or access to the separate operational source | Identities and effective permissions require verification |
| Rayfin starter | Runs in the supplied environment | Starter and deployment toolchain absent; native AppBackend item creation succeeded |
| OneLake Read API | Available to the starter application | Needs Studio verification |

## Exercise 1.1 configuration

Provision **contoso_operations_sql** through the
[native SQL source recipe](../../infra/README.md#provision-the-mirrored-sql-source).
Use the canonical display name at creation; SQL database items cannot be
renamed. Seed the seven typed tables from the committed CSVs and leave
`workshop.mirroring_probe` empty in both source and mirror at launch.

The learner must distinguish the transactional SQL database from its separate
read-only SQL analytics endpoint, even when they have the same display name.
Allow the engineer to perform the supplied probe DML, not the restricted test
identities. Source/mirror access must not bypass later destination policies.
Verify actual propagation of each action and timestamp; seeded rows and
mirror metadata alone are insufficient. Reset clears only the instance's
probe and confirms both sides empty; it does not rewrite recall facts.

Native verification compared every column of all 1,990 reference rows through
both surfaces, exercised insert/update/delete, and checked explicit wrong-state
and transaction errors. The earlier CSV-only operational lakehouse remains an
author query fallback, not a passing mirroring substitute.

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

The [author provisioning recipe](../../infra/README.md#sharepoint-source)
separates source publication, organizational-account sign-in, and native Fabio
shortcut creation. In the consolidation tenant, all seven published source
files match their repository SHA-256 hashes; the metadata folder contains only
the CSV. Fresh author validation also completed the organizational-account
connection, downloaded all seven files through `Files/SupplierQuality`, and
verified all thirteen source fields of the four transformed records. This
does not establish fresh learner or restricted-reader access.

The [operational-source provisioning recipe](../../infra/README.md#operational-source)
now creates and seeds native SQL for automatic OneLake mirroring. The exact
learner inventory query returns nine stores through that mirror. Keep source,
mirror, training schema, and any fallback/staging files inaccessible to the
restricted test identities.

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
- The native wizard's CSV transformation was verified in the fresh author
  workspace, including actual Delta output and SQL discovery after a scoped
  metadata refresh. Its generated `__corrupt__` values were all null.
- Use that wizard, not a successful-looking CLI shortcut creation response.
  The [author recipe](../../infra/README.md#sharepoint-source) records the two
  CLI transformation probes that did not persist a transform, their cleanup,
  and the working document-shortcut command.

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
| Workspace network | Approved access for the shipped package cells and DuckDB extension retrieval. Validate a compatible profile before launch; disabling tenant network protection is not a learner workaround. |
| OneLake SAS | The workspace setting **Authenticate with OneLake user-delegated SAS tokens** is on. DuckDB reads data files with vended SAS credentials. |
| Notebook | `src/notebooks/module-2-shipment-history.ipynb`, imported as **module-2-shipment-history**. Learners attach the lakehouse in Exercise 2.1, so the import needs no lakehouse binding. |
| Lakehouse | The lakehouse that holds `SupplierQuality`, with schemas on. Learners can write to it. |
| Learner role | Contributor or higher on the workspace, to create the data agent and refresh the SQL analytics endpoint metadata. |
| Items Module 2 creates | CSV files in `Files/reference/` and `Files/history/`, the `history` schema, 7 Iceberg tables in `dbo`, `lot_history` and `shipment_history` in `history`, and the data agent `contoso_recall_agent`. |
| Resume state | Every cell can be rerun. The notebook reuses the tables it created, which carry the property `contoso.owner = prel41-module-2`, and stops rather than overwrite any other table at the same path. |

[The Contoso Fresh data model](contoso-fresh-data-model.md) describes every
table and the results the data must produce.

Use the [destination/import procedure](../../infra/README.md#destination-and-learner-notebook)
for new instances. Before an author job, verify the saved default-lakehouse
metadata, not only a successful CLI import. The clean-room Fabio ipynb
import accepted `--lakehouse` without persisting the binding. Learners still
attach and pin the lakehouse through Exercise 2.1; provisioning must not
silently skip that exercise or write to a fallback destination.

### Verify package-dependent cells

Runtime 2.0 includes Iceberg, but DuckDB and the data-agent SDK are installed
by the notebook: DuckDB `>=1.5.6,<2` in cell 16 and
`fabric-data-agent-sdk==0.1.33a0` in cell 24. The Module 2 contributor
reported successful execution of these paths in a Runtime 2.0 development
workspace on 2026-10-20 in [PR #9](https://github.com/microsoft/ignite26-PREL41/pull/9),
and confirmed the package-cell behavior on 2026-10-21.

Independent clean-session checks, including jobs
`f2952905-5681-429f-93e0-ef85ad5cdae9` and
`124ac64a-2576-48e3-89bf-61c819fc76c1`, found both packages absent without
running the install cells. That is expected before `%pip`, not a failure of
the supplied notebook or missing implementation. The independent selected-
workspace run has not replayed these paths.

Before launch, independently replay the shipped install and exercise cells
in the delivery configuration, including DuckDB extension retrieval, actual
OneLake reads, SDK execution, and the session restart. Do not treat installed
package metadata alone as execution evidence for cells 17-20 or 26.
These installations are session-local. An author warmup does not prepare
another notebook session or fresh lab; attendees run the setup cells in
their own standard session, including after a session reset.
Keep the original no-Environment/bundled-Iceberg path and session-restart
behavior. Do not weaken tenant network protection, substitute another
engine, or count a failed setup cell as completed. If the lab's approved
network policy prevents setup, prepare a compatible Lab Profile before
attendees launch.

Both the fresh author workspace and the owner's selected destination were
independently inspected in **Workspace settings > Delegated Settings >
OneLake settings**. Each shows **Authenticate with OneLake
user-delegated SAS tokens** on, enabled for all users, with the inherited
**Default configuration**. This was read without changing the setting.
It establishes that prerequisite only, not successful credential vending,
DuckDB reads, or access for a restricted identity.

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
  and verified against all 13 analysis rows in the author workspace. It contains
  `lot_id` and `analysis_time_utc` and is a manually triggered snapshot, not an
  automatic streaming result. Exercise 3.3 now has the engineer deploy
  **contoso_temperature_refresh** using the
  [template](../../infra/pipelines/temperature-refresh/pipeline-content.json)
  and [binding utility](../../infra/pipelines/temperature-refresh/bind.py).
  Supply those assets and terminal bindings; pipeline, candidate, and production
  are absent in a fresh exercise and reused only through matching resume checks.
  Preflight the native path separately as author before launch. The
  [refresh procedure](../../infra/README.md#native-pipeline-refresh) also remains
  an explicit instructor recovery path, not permission to mark a skipped
  learner deployment complete. Do not give restricted readers pipeline write
  access, candidate access, or raw-event grants. No schedule is supplied.
  Native runs and the empty-input guard passed in the author workspace,
  not yet through a fresh Lab Profile.
- Separate North-store and CAR-02 row rules for the snapshot are deployed in
  the unassigned roles. Raw telemetry and staging files remain excluded.
  Application identity propagation and restricted-reader checks are still
  required before console integration.
- The supplied read-only SQL batch validates IDs, timestamps, temperatures,
  retry consistency, journey matches, and history consistency before
  calculating statuses. It returns all 13 YG-2291 shipments, including seven
  without telemetry when only the boundary fixture is present.
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
  objects and SQL permissions and cancel workspace SQL queries. Use the
  [guarded author procedure](../../infra/README.md#configure-sql-endpoint-identity).
  In the consolidation workspace, this mode was saved on 2026-10-21 and
  independently confirmed after a full page reload. Both restricted-role
  definitions still match, memberships remain empty, and DefaultReader is
  unchanged. The production refresh and strict 13/2/11 snapshot checks
  passed afterward. This is not a restricted-reader or fresh Studio pass.
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
- The first-party source and published CLI are available:
  [Rayfin CLI installation](https://github.com/microsoft/rayfin/blob/0979439a7a0806abd0ee48c2619b37f297ae1324/packages/guide/assets/docs/cli/installation.md)
  identifies `@microsoft/rayfin-cli`, which publishes the `rayfin` executable.
  Registry metadata confirmed version `1.36.2`, along with
  `@microsoft/create-rayfin` at that version. `@microsoft/rayfin` is not the
  CLI package: the official `npm create` spelling resolves the separately
  named initializer. Do not replace the prepared CLI with a guessed package.
  The [authentication sample](https://github.com/microsoft/rayfin/tree/0979439a7a0806abd0ee48c2619b37f297ae1324/samples/getting-started-auth)
  is reference material, not the authored Recall Console. Its source manifest
  uses monorepo `workspace:*` dependencies; copying it alone is not a
  self-contained, prepared lab project.
- Preflight the supplied project against the official
  [CLI creation workflow](https://learn.microsoft.com/fabric/apps/create-app-with-cli)
  and [deployment workflow](https://learn.microsoft.com/fabric/apps/deploy-app).
  Its existing dependencies must include the Rayfin CLI; learner commands use
  `npx --no-install`, not package installation or project scaffolding. Inspect
  the deployment preview before updating the existing app, then verify
  deployment status and the actual hosted URL. Do not force schema removals.
- Enable Fabric-brokered Entra SSO in the supplied configuration:
  `services.auth.enabled` and `services.auth.fabric.enabled` must both be true.
  Local email/password authentication does not work for deployed Fabric Apps.
  Keep generated environment/session material out of version control.
  Repository ignore rules cover `.env` and Rayfin's `.env.fabric-*` files,
  including nested starter directories, without excluding `rayfin/rayfin.yml`.
- Keep Fabric SSO and end-user data authorization distinct. An app's
  **Run and interact** permission allows use of the app; it does not prove
  that downstream OneLake queries use that user's identity.
- Inspect the exact downstream identity, not just the token audience.
  The first-party [function connection model](https://github.com/microsoft/rayfin/blob/0979439a7a0806abd0ee48c2619b37f297ae1324/packages/guide/assets/docs/functions/connections/index.md)
  uses application-identity resource tokens. A function's
  `ctx.Tokens.Storage` therefore does not establish caller-delegated
  OneLake access. The [connector catalog](https://github.com/microsoft/rayfin/blob/0979439a7a0806abd0ee48c2619b37f297ae1324/packages/tools/common/src/config/connectors.ts)
  supports explicit delegated authentication for SQL analytics, but defaults
  that connector to application authentication. That SQL connector is also
  not a direct OneLake Arrow table-read adapter. Neither sample is a drop-in
  implementation of Exercise 5.2's governed connector contract.
- Supply the actual connector's table-read base URL, supported request/response
  contract, and preauthorized user-delegated authentication. The
  [table API prerequisites](https://learn.microsoft.com/fabric/onelake/table-apis/table-apis-overview#prerequisites)
  require the Azure Storage token audience; the Fabric management API token or
  app publishable key cannot replace it. Do not invent a preview host or
  silently fall back to engineer credentials.
- The [table read API](https://learn.microsoft.com/fabric/onelake/table-apis/read-table-data-rest-api)
  allocates streams with `POST /read` and returns Arrow IPC through each
  `GET /readStream/{streamId}`. Retrieve every stream before the 60-minute
  session expiry and process batches without buffering full history in the
  browser. Streams share their read session's snapshot; separate allocations
  must not be assumed to share a cross-table snapshot.
- Verify multistream completeness, explicit failure reporting, and identity
  isolation of both results and stream IDs. Unauthorized tables/explicit
  forbidden columns return not found; zero permitted rows yield a successful
  empty Arrow response. Confirm resource existence as engineer before denial
  tests, and never count authentication/network errors as successful denial.
  Project only necessary columns, avoid allocating a new billed read for
  every keystroke, and do not share cached results across identities.
- Require the same positive and negative manager/partner checks through the
  actual deployed app. No owner-key backend, client-side row filtering,
  anonymous recall data, or raw-telemetry grant is an acceptable substitute.
- The console must preserve missing-sensor uncertainty and distinguish current
  inventory from shipment history. Do not label all 13 receiving stores as
  current holders or convert absent telemetry into a compliant status.

## Tokens and variables

The canonical learner path in `instructions/README.md` and `instructions/module-2/`
currently contains no active Skillable `@lab.*` replacement tokens, conditional
displays, or text fields. Its shell variables still require real terminal
bindings; the absence of tokens does not provision them:

| Shell binding | Producer and first availability | Consumers and resume rule |
|---|---|---|
| `WORKSPACE_ID`, `LAKEHOUSE_ID` | Lab provisioning, before Module 3 | Replay/deployment target the supplied instance's `contoso_fresh`, never the operational source or author validation workspace. |
| `SQL_ENDPOINT_ID`, `SQL_ENDPOINT_HOST` | Destination lakehouse provisioning, before Exercise 3.3 | Bind that lakehouse's SQL endpoint ID and bare managed hostname. Check IDs again on resume; the source SQL database/mirror is a different endpoint. |
| `EVENTSTREAM_ID`, `SOURCE_ID` | Eventstream provisioning, before replay | Resolve the supplied stream/inlet and confirm the destination is running. No credential-bearing connection response is stored. |
| `PIPELINE_ID` | Learner item creation or verified resume in Exercise 3.3 | Reuse the matching workshop item and check active runs before rebinding. |
| `OUTPUT_TABLE` | Learner, first candidate then production in Exercise 3.3 | Binding accepts only the two documented snapshot names. Do not add a general-purpose destination override. |

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
