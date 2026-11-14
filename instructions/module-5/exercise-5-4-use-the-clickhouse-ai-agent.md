# Exercise 5.4: Engineer and report with the ClickHouse AI agent

Use ClickHouse Assistant in **Agent** mode to inspect the synced data, prepare
a reusable reporting view, and explain recall delivery reach. This is the
ClickHouse agent, not the Fabric data agent from Exercise 2.6.

## Check your starting point

Exercise 5.3 must pass. Use only the synthetic lab data in **default**. The
instructor must approve AI data processing and enable AI features for the
ClickHouse organization.

## Task 1: Open the agent

1. In the Fabric ClickHouse item, select **Open in ClickHouse Cloud** and
   confirm that you are in the same service.
1. Open **Assistant** using its sparkle icon in the left sidebar.
1. Review the first-use consent describing data handling and LLM
   sub-processors. Accept only if authorized for this lab. Do not paste
   credentials, tokens, personal information, or non-lab data into chat.
1. Choose **Agent** in the mode selector, not **Docs AI (Ask)**. The service
   must be awake for schema exploration.

    > [!Help] If Assistant is unavailable or consent is not approved, retain
    > the limitation and ask the instructor. Manual SQL does not count as
    > completing the AI exercise. The workload's optional read-only MCP
    > endpoint is a different integration and is not required here.

## Task 2: Check quality and prepare a reporting view

1. Start a new chat and send this prompt:

    ```text
    Use only the synthetic lab tables in the default database. OneLake is the
    source of truth; these are point-in-time copies. The fixed recall clock
    is 2026-10-13 04:00 UTC, not today. Inspect the actual schemas first.
    Generate read-only ClickHouse SQL to check duplicate shipment keys
    (shipment_id, line_no), duplicate location_id and lot_id dimension keys,
    and shipment rows with no matching location or lot. Use explicit
    LEFT ANTI JOINs for missing references, not nullable-join assumptions.
    Show each check and its result. Do not modify data or permissions.
    ```

1. Inspect the SQL and results. Use **Open in editor** to review and run any
   generated SQL that has not been executed. Expect zero duplicate keys and
   zero unmatched references. Keep any discrepancy visible and resolve it
   with the instructor before proceeding.
1. Send the next prompt:

    ```text
    Propose, but do not execute, CREATE VIEW default.recall_delivery_summary.
    Use a normal view, not a materialized view. Join default.shipment_history
    to default.locations on store_id = location_id. Filter lot_id = 'YG-2291'
    and location_type = 'store'. Return one row per store_id and region,
    with uniqExact(shipment_id) AS shipments and sum(cases) AS cases_shipped.
    Do not include supplier costs or driver notes. Do not replace an
    existing view, modify source tables, or write back to OneLake.
    Explain why this view reports historical delivery, not current stock.
    ```

1. Review the proposed definition, then use **Open in editor** and execute
   only the approved `CREATE VIEW`. If the view already exists, inspect it
   with `SHOW CREATE TABLE default.recall_delivery_summary` and reuse it only
   if it matches; do not replace it blindly.
1. Verify the view yourself:

    ```sql
    SELECT
        count() AS store_rows,
        uniqExact(store_id) AS distinct_stores
    FROM default.recall_delivery_summary;
    ```

1. Expect **13** for both values. This ordinary view stores a query definition,
   not another copy of the data. Its inputs are already accelerated tables.

## Task 3: Produce a regional report

1. Send:

    ```text
    Using only default.recall_delivery_summary, report receiving stores,
    shipments, and cases_shipped by region, ordered by region. Show the SQL,
    a result table, and a bar chart of receiving stores by region. Reconcile
    the total with 13 distinct historical receiving stores. Explain that
    earlier current inventory showed 9 holders, which is a different metric.
    Label this report as a OneLake snapshot copy and ask me for the recorded
    sync completion time if it is not in context; do not invent freshness.
    Do not change any data or settings.
    ```

1. Supply the completion time you recorded in Exercise 5.2 when requested.
   Run and save the generated regional SQL as
   ++YG-2291 agent regional report++.
1. Compare its rows with Exercise 5.3. Confirm that regional store counts sum
   to **13**, quantities match the SQL results, and any chart agrees with
   the result table. If the agent cannot render a chart, retain that limitation;
   do not describe an unrendered visualization as completed.
1. Keep the report in your lab account. A view that omits costs is not an
   access-control boundary while a reader can still query its base tables.
   Do not share the service or report with Module 4's restricted identities.

**Completion check:** The agent inspected real table schemas, produced quality
checks, helped you create and verify a 13-store reporting view, and generated
a reconciled regional report. You reviewed the SQL and labeled the snapshot's
freshness, including any unavailable visualization.
