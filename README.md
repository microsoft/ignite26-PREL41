<a name="start-building"></a>

<p align="center">
<img src="img/banner-ignite-26.png" alt="Microsoft Ignite 2026" width="100%"/>
</p>

# [Microsoft Ignite 2026](https://ignite.microsoft.com)

## 🔥PREL41: Unify operational and real-time data estates with Microsoft Fabric
### Session description

Learn how to connect, ingest, mirror, and virtualize data across your organization using shortcuts, mirroring, Eventstream, and Data Factory in Microsoft Fabric. In this four-hour hands-on lab, you'll work with multiple internal and external data sources to build a unified data estate in OneLake using ETL/ELT pipelines, zero-copy shortcuts, and mirroring. Discover how to eliminate data silos, reduce duplication, and create an AI-ready foundation for analytics at enterprise scale.

### 🚀 Getting started

#### In a guided session

If you're following along during a live session:

1. Open the supplied Skillable lab and sign in with its supplied account.
   Open the pre-provisioned Contoso Fresh Fabric workspace.
2. Open the [workshop instructions](instructions/README.md) and complete
   **Prepare your environment**. Locate the supplied Fabric SQL database
   operational source and its mirrored OneLake SQL endpoint, lakehouse,
   Module 2 notebook, and SharePoint connection; confirm that an authorized
   terminal with Azure CLI, permission to create the Module 4 service
   principal, and the
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

- **Data estate:** Microsoft Fabric (OneLake, lakehouse, and SQL analytics endpoint).
- **Historical analysis:** Apache Spark, Apache Iceberg, and DuckDB.
- **Supplier documents:** SharePoint document shortcuts and CSV transformation.
- **Governance:** OneLake Security for row and column access.
- **Recall application:** Fabric Apps (preview), built on Rayfin, and the OneLake Read API.
- **AI-assisted investigation:** Microsoft Fabric AI Functions and data agent.

### 📚 Continue your learning

Pick your next step based on your learning style:

| Resource | What you'll get |
|----------|-----------------|
| **[Microsoft Fabric](https://learn.microsoft.com/fabric/fundamentals/microsoft-fabric-overview)** | Learn more about Microsoft Fabric, including OneLake, lakehouse, and SQL analytics endpoint |
| **[SharePoint document shortcuts](https://learn.microsoft.com/fabric/onelake/shortcuts/create-onedrive-sharepoint-shortcut)** | Learn more about using SharePoint document shortcuts and CSV transformation |
| **[OneLake Security](https://learn.microsoft.com/fabric/onelake/security/get-started-security)** | Learn more about OneLake Security for row and column access |
| **[Fabric Apps (preview)](https://learn.microsoft.com/fabric/apps/overview)** | Learn more about building applications with Fabric Apps (preview) |
| **[Microsoft Fabric AI Functions](https://learn.microsoft.com/fabric/data-science/ai-functions/overview?tabs=pandas)** | Learn more about using AI Functions in Microsoft Fabric |
| **[Data Agent](https://learn.microsoft.com/fabric/data-science/concept-data-agent)** | Learn more about using the Data Agent in Microsoft Fabric |
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

<table>
<tr>
    <td align="center"><a href="http://github.com/dikodev">
        <img src="https://github.com/dikodev.png" width="100px;" alt="Diko Lezediko"/><br />
        <sub><b>Someleze Diko</b></sub></a><br />
            <a href="https://github.com/dikodev" title="talk">📢</a>
    </td>
    <td align="center"><a href="http://github.com/cmaneu">
            <img src="https://github.com/cmaneu.png" width="100px;" alt="Carlos Maneu"/><br />
            <sub><b>Christopher Maneu</b></sub></a><br />
                <a href="https://github.com/cmaneu" title="talk">📢</a>
        </td>
    <td align="center"><a href="http://github.com/rhasson">
        <img src="https://github.com/rhasson.png" width="100px;" alt="Roy Hanson"/><br />
        <sub><b>Roy Hasson</b></sub></a><br />
            <a href="https://github.com/rhasson" title="talk">📢</a>
    </td>
    <td align="center"><a href="http://github.com/aamerril">
        <img src="https://github.com/aamerril.png" width="100px;" alt="Aamer Il"/><br />
        <sub><b>Aaron Merrill</b></sub></a><br />
            <a href="https://github.com/aamerril" title="talk">📢</a>
    </td>
</tr></table>

### ⚖️ Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft trademarks or logos is subject to and must follow [Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/legal/intellectualproperty/trademarks/usage/general). Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship.

Any use of third-party trademarks or logos are subject to those third-party's policies.
