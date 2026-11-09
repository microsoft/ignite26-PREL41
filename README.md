## Before you're done

This repo has been created for your Microsoft Ignite 2026 session. Here's how to get it ready.

**Easiest path — use the agent (recommended):**

- Open GitHub Copilot Chat and say `help me initialize repo`. The agent will walk you through getting the README populated.
- When you're ready to publish, say `help me finalize repo`. The agent will clean up unused folders, validate everything, and remove this "Before you're done" section and other extra stuff that attendees don't need to see.
- Curious how it works? Read the [agent workflow](.github/AGENT-WORKFLOW.md).

**Doing it manually?**

Fill in the sections below yourself, then:

- Delete any placeholder folders you don't need (`data/`, `infra/`, etc.)
- Delete this "Before you're done" section
- Delete `.github/agents/`, `.github/tests/`, `.github/copilot-instructions.md`, and `.github/AGENT-WORKFLOW.md` — these are template tooling, not part of your published repo

**Folder conventions:**

- Attendee step-by-step guidance goes in `instructions/`. If you use MkDocs or a docs site instead, put it in `docs/` and link to it from this README.
- Reference material and background reading go in `docs/`.
- You can add a `.devcontainer/` folder if needed.

---

<a name="start-building"></a>

<p align="center">
<img src="img/banner-ignite-26.png" alt="Microsoft Ignite 2026" width="100%"/>
</p>

# [Microsoft Ignite 2026](https://ignite.microsoft.com)

## 🔥PREL41: Unify operational and real-time data estates with Microsoft Fabric
### Session description

Learn how to connect, ingest, mirror, and virtualize data across your organization using shortcuts, mirroring, Eventstream, and Data Factory in Microsoft Fabric. In this four-hour hands-on lab, you'll work with multiple internal and external data sources to build a unified data estate in OneLake using ETL/ELT pipelines, zero-copy shortcuts, and mirroring. Discover how to eliminate data silos, reduce duplication, and create an AI-ready foundation for analytics at enterprise scale.

### 🚀 Getting started

#### For the current Fabric author review

The owner is reviewing the lab directly in the
[selected 2612 Fabric workspace](https://app.powerbi.com/groups/68713569-71b7-43bf-a61e-aa71b60381da/list?experience=power-bi).
Skillable provisioning follows approval of that Fabric lab.
Use the [current resource inventory and evidence](CONSOLIDATION-TODO.md#current-fabric-destination),
[author setup and recovery procedures](infra/README.md), and
[test matrix](docs/authoring/test-matrix.md). Inspect existing state before
resuming; do not bootstrap over the supplied source or regenerate authored
tables. The attendee paths below describe the intended later delivery, not a
claim that all integrations have passed.

#### In a guided session

If you're following along during a live session:

1. Open the supplied Skillable lab and sign in with its supplied account.
   Open the pre-provisioned Contoso Fresh Fabric workspace.
2. Open the [workshop instructions](instructions/README.md) and complete
   **Prepare your environment**. Locate the supplied Fabric SQL database
   operational source and its mirrored OneLake SQL endpoint, lakehouse,
   Module 2 notebook, and SharePoint connection; confirm that the telemetry
   snapshot `dbo.recall_temperature_status`, existing authorized terminal
   with Azure CLI, restricted test identities, permission to create the
   Module 4 service principal, and the
   [Recall Console starter](src/console/README.md) are available for later
   modules. Telemetry replay and pipeline deployment are optional supporting
   exercises.
3. Follow the instructor's checkpoints through the Contoso Fresh recall
   investigation for lot **YG-2291**. Use each exercise's completion check
   before moving to the next module.

#### On your own

If you're learning at your own pace:

1. Open your supplied Skillable lab and sign in with its supplied account.
   Self-paced delivery requires the same pre-provisioned environment as the
   guided session; cloning this repository does not provide a runnable lab.
2. Start at [the workshop instructions](instructions/README.md), complete
   **Prepare your environment**, and review the five recall questions for
   lot **YG-2291**. Locate the supplied mirrored operational source and use
   only the lab's existing authorized terminal for steps that require it.
3. Work through the modules in order and complete each observable check before
   continuing. When resuming an exercise, inspect its existing state as
   directed rather than creating duplicate resources.

### Workshop path and scope

Use the [canonical workshop instructions](instructions/README.md) for both
guided and self-paced delivery. Use only the accounts, connections, and
resources supplied in the Skillable lab. If a required item, identity, or
connection is missing, stop and notify the instructor or lab support; do not
create personal replacements, additional capacities, tenants, or external
accounts.

This path uses a pre-provisioned SQL database in Fabric with automatic
mirroring into OneLake, SharePoint document shortcuts and CSV transformation,
Iceberg shipment history, Eventstream telemetry, OneLake governance, and
Fabric Apps. The mirroring exercise investigates native SQL database-in-Fabric
replication; it does not configure an external SQL or third-party source.
The [five-module path](instructions/README.md#workshop-modules) now builds the
Rayfin data app in Module 3, then revisits it after OneLake Security in Module 4.
Module 5 is a title-only Fabric/DuckDB/ClickHouse handoff. The original
[telemetry and guarded Data Factory deployment exercises](instructions/optional-telemetry.md)
remain optional, unchanged supporting material. The core app requires a
supplied, verified `dbo.recall_temperature_status`; it does not create one.

Start with [src/console](src/console/README.md); use the independent
[src/console-final](src/console-final/README.md) as the completed Rayfin
reference. Both sign in with **bearer tokens** from Azure CLI
(`az account get-access-token --resource https://storage.azure.com`). Each
token is one identity, and OneLake applies that identity's permissions,
row-level security, and column-level security, so the same app can compare
identities against OneLake Security. Module 3 uses **My account**; Module 4
adds a **Service principal** through the security group from Exercise 4.2.
Each identity keeps its own in-memory DuckDB data, and the app does no
client-side filtering.
The browser calls the Table API directly and streams Arrow results
incrementally; there is no proxy. Rayfin only hosts the app as a Fabric App.
Public build-time `VITE_*` settings contain no bearer tokens or secrets.

Native validation matched every column of all **1,990 canonical current-state
records** in both the source database and mirrored OneLake SQL endpoint to
the committed CSVs. A separate probe demonstrated automatic insert, update,
and delete replication with matching source timestamps, then returned to an
empty state without changing canonical recall rows. The guarded temperature
Copy pipeline has also been verified natively; these checks do not establish
end-to-end workshop readiness.

The target duration is **240 minutes**, including a 10-minute break; this is a
planning target, not a measured completion time. End-to-end readiness remains
under validation. Full-workshop runtime behavior and completion time,
restricted-identity access, and the deployed Recall Console's governed data
path have not been confirmed as passed. Follow the completion checks and record
any skipped exercise rather than treating it as completed. Module 2 stays on
the supplied notebook and dataset; it has no alternate-data completion path.

The author workspace now also has a working SharePoint connection and document
shortcut: all seven source files match the repository, and the native CSV
transformation produced all four certificate records with matching source
fields and no corrupt rows. This does not establish fresh learner access.

The current author review is a Fabric deployment in the owner's selected
workspace. Skillable provisioning, preview, resume, and reset checks are a
separate phase after the owner approves the working Fabric lab; they are not
prerequisites for continuing the Fabric deployment.

The Module 2 contributor reports successful DuckDB and data-agent SDK runs,
including the session-local `%pip` setup in cells 16 and 24. The independent
selected-workspace validation has not replayed those paths; package absence
before the install cells is expected, not evidence of a broken exercise.
The new apps' local validation is recorded separately from these historical
checks in the [test matrix](docs/authoring/test-matrix.md#new-app-integration-evidence).
Fabric deployment, real-token and service principal reads, effective
OneLake permissions, hosted-app CORS behavior, document access, and the
final integrated adversarial review remain unverified until run; local
synthetic tests do not establish live passes.
The [consolidation ledger](CONSOLIDATION-TODO.md#current-fabric-destination)
records the current destination and its actual native results separately
from earlier isolated-workspace evidence.

### 🎯 Learning outcomes

By the end of this session, you will be able to:

- Unify operational and reference data in OneLake using automatic SQL
  database-in-Fabric mirroring, SharePoint document shortcuts, and CSV
  certificate-metadata transformation to support the Contoso Fresh recall
  investigation.
- Investigate five-year Iceberg shipment history with Spark, DuckDB, AI
  Functions, and a data agent, and combine it with streaming cold-chain
  signals to identify temperature breaches and deploy and run the supplied
  guarded Data Factory temperature Copy pipeline.
- Apply OneLake row and column security, then use the governed Recall Console
  to investigate inventory, shipments, temperature status, and supplier
  documents with the supplied restricted identities.

### 💻 Technologies used

- **Data estate:** SQL database in Microsoft Fabric with automatic OneLake
  mirroring, OneLake, lakehouse, and SQL analytics endpoint.
- **Historical analysis:** Apache Spark, Apache Iceberg, and DuckDB.
- **Supplier documents:** SharePoint document shortcuts and CSV transformation.
- **Streaming telemetry:** Microsoft Fabric Eventstream.
- **Temperature pipeline:** Data Factory in Microsoft Fabric, using the
  supplied guarded Copy pipeline deployment template.
- **Governance:** OneLake Security for row and column access.
- **Recall application:** Fabric Apps (preview), built on Rayfin, and the OneLake Read API.
- **AI-assisted investigation:** Microsoft Fabric AI Functions and data agent.

### 📚 Continue your learning

Pick your next step based on your learning style:

| Resource | What you'll get |
|----------|-----------------|
| **[Ignite 2026 Next Steps](https://aka.ms/ignite26-next-steps)** | Additional session repos and materials from Microsoft Ignite 2026 |
| **[Microsoft AI Skills Navigator](https://aka.ms/ignite26-asn)** | Discover AI skills, learning paths, and resources for your next step |
| **[Microsoft Learn](https://aka.ms/ignite26-learn)** | Official documentation and guided learning paths on these topics |
| **[Microsoft Foundry Community](https://aka.ms/MicrosoftFoundryDiscord-Ignite26)** | Connect with other learners and experts in our Discord community |

### 🌟 Microsoft Learn MCP Server

<!-- Remove this section if the Microsoft Learn MCP Server is not relevant to the session. -->

The Microsoft Learn MCP Server gives your AI agent direct access to Microsoft's official documentation — grounded, up-to-date answers about the topics in this session.

**GitHub Copilot CLI** — Install with:

```shell
copilot plugin install microsoftdocs/mcp
```

**VS Code** — One-click install:  
[![Install in VS Code](https://img.shields.io/badge/VS_Code-Install_Microsoft_Learn_MCP-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://vscode.dev/redirect/mcp/install?name=microsoft-learn&config=%7B%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A%2F%2Flearn.microsoft.com%2Fapi%2Fmcp%22%7D)

For more information, visit the [Learn MCP Server repo](https://aka.ms/learnmcp).

### 👥 Content owners

<!-- TODO: Add yourself as a content owner
1. Change the src in the image tag to {your github url}.png
2. Change INSERT NAME HERE to your name
3. Change the github url in the final href to your url. -->

<table>
<tr>
    <td align="center"><a href="http://github.com/yourGitHubHandle">
        <img src="https://github.com/yourGitHubHandle.png" width="100px;" alt="INSERT NAME HERE"/><br />
        <sub><b>INSERT NAME HERE</b></sub></a><br />
            <a href="https://github.com/yourGitHubHandle" title="talk">📢</a>
    </td>
</tr></table>

### ⚖️ Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft trademarks or logos is subject to and must follow [Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/legal/intellectualproperty/trademarks/usage/general). Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship.

Any use of third-party trademarks or logos are subject to those third-party's policies.
