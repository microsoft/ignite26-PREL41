# Exercise 5.1: Add the ClickHouse workload

In Module 2, DuckDB read Iceberg tables directly from OneLake without copying
them. In this module, you use the ClickHouse workload to copy selected OneLake
tables into a dedicated ClickHouse Cloud service for accelerated analytics.
OneLake remains the source of truth.

## Check your starting point

Finish Exercise 2.3 before starting. Its last cell must show
`13 stores received YG-2291, read through OneLake`. Use the same lab workspace
and **SupplierQuality** lakehouse, not the separate operational SQL database.

The instructor must approve this extension and provide:

- A Fabric administrator with billing rights to install the workload and
  accept its terms, if it is not already installed.
- Permission to create a ClickHouse item and read the selected OneLake tables
  with your lab account.
- An approved ClickHouse trial or funded organization, and AI features enabled
  for Exercise 5.4.

> [!Note] The public preview provisions dedicated ClickHouse Cloud resources
> on Azure, separate from Fabric capacity. A new trial includes credits valid
> for 30 days; free preview ingestion does not mean unlimited free compute or
> storage. Do not enter personal billing details, buy a subscription, or
> create a separate personal ClickHouse account.

## Task 1: Make the workload available

1. Sign in to [Microsoft Fabric](https://app.fabric.microsoft.com) with your
   supplied lab account and open **ContosoFresh_XXXXX** workspace.
2. Select the **Workloads** icon from the left nav and scroll down to find `ClickHouse Cloud (preview)`.
3. Open the **ClickHouse** workload card and click **Add Workload** to the current workspace
4. Follow the instructions to accept permissions and allow the workload access to the your Fabric workspace.
5. Back in Workspace view, select **+ New item**, search for `ClickHouse`, and select the
   **ClickHouse Cloud** item offered by the workload.
6. Name the item `contoso_clickhouse` and select **Create**. Wait for
   provisioning to finish; do not create a second item while it is running.

    > [!Help] This step will take a few minutes. If the workload is unavailable or fails to provision, delete it from the Workspace and try adding it again.

## Task 2: Open the item and confirm your sign-in

1. Open **contoso_clickhouse** from the workspace. Its embedded
   experience includes **Sync**, the SQL console, and **Connect**.
1. Select **Open in ClickHouse Cloud**. Confirm that Microsoft SSO opens the
   same service in the Cloud console. Keep this tab for Exercise 5.4, then
   return to the Fabric item.


**Completion check:** The lab workspace contains one
**contoso_clickhouse** item. You can open its embedded experience in
Fabric and its corresponding Cloud service with your approved lab identity.
