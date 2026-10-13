# Lab test matrix

Use **Pass**, **Fail**, **Needs Studio verification**, or **Not applicable**.
Record evidence for every completed test.

| Test | Expected result | Status | Evidence |
|---|---|---|---|
| Markdown structure | Headings, lists, tables, code fences, callouts, and page breaks are structurally valid. | Pass | Source inspection of `instructions/README.md`. |
| Local links | All repository-relative links resolve. | Pass | Source inspection of README and authoring links. |
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
| Spark capacity and fallback | The notebook completes in time or the documented fallback allows progress. | Needs Studio verification | Requires concurrent launch testing. |
| Eventstream replay | Telemetry arrives and supports the temperature-breach result. | Needs Studio verification | Requires live Fabric items. |
| Security identities | Manager and partner identities return the intended rows and columns. | Needs Studio verification | Environment design is still open. |
| Recall Console | The application reads OneLake data and respects OneLake Security. | Needs Studio verification | Requires Rayfin and OneLake Read API access. |
| Keyboard and zoom | Required actions remain usable with keyboard navigation and zoom. | Needs Studio verification | Requires learner UI and product UI testing. |
| Independent learner QA | A reviewer completes the workshop verbatim within 240 minutes. | Needs Studio verification | Independent run not yet performed. |

## Release gate

Repository source can be reviewed independently, but the workshop must not be
declared ready until the Skillable preview, fresh-launch, resume, assessment,
accessibility, and independent learner checks are complete.
