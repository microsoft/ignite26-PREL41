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
| Operational database | Contains orders, shipments, and store inventory | Exact name required |
| Target lakehouse | Accepts learner-created shortcuts and later module output | Exact name required |
| SharePoint connection | Preconfigured for the Supplier Quality content | Exact name required |
| SharePoint permissions | Learner can read the target library or folder | Needs Studio verification |
| Module 2 notebook | Imported from `src/notebooks/module-2-shipment-history.ipynb`; see Module 2 configuration | Needs Studio verification |
| Spark fallback table | Allows the workshop to continue after capacity or startup failure | Needs Studio verification |
| Eventstream | Replays supplied truck telemetry | Needs Studio verification |
| Security test identities | Demonstrate regional and partner access | Open environment decision |
| Rayfin starter | Runs in the supplied environment | Needs Studio verification |
| OneLake Read API | Available to the starter application | Needs Studio verification |

## Exercise 1.2 configuration

Exercise 1.2 relies on the cooking-show environment described in `plan.md`.
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

## Tokens and variables

The learner instructions currently contain no active `@lab.*` replacement
tokens, variables, conditional displays, or text fields.

Before introducing a token, record its exact Studio alias, producer, first
availability, consumers, resume behavior, and fallback path.

## Activities and scoring

The learner instructions currently contain no `@lab.Activity(...)` references.
No Questions, Automated Activities, Activity Groups, scores, or pass thresholds
are declared.

## Assets and external dependencies

No learner-facing images or external includes are currently referenced, except
the Module 2 screenshots under `instructions/module-2/media/`.
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
