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
| Historical data and notebook | Supports the Iceberg exercises | Needs Studio verification |
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

No learner-facing images or external includes are currently referenced.
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
