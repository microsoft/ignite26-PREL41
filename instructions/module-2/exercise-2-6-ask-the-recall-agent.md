# Exercise 2.6: Ask the recall agent

Regional managers need answers before noon, without writing SQL. A Fabric data agent answers questions in plain language. It turns each question into SQL, runs the query against the tables you give it, and answers from the result.

In this exercise, you create a data agent over the lakehouse tables, choose its tables, ask it the recall questions, and publish it.

## Check your starting point

Cell 15 printed `13 stores received YG-2291, read through OneLake`. If it didn't, finish Exercise 2.3 first.

Run cells 24 to 26 even if **contoso_recall_agent** is already in the workspace. They're safe to rerun, and they finish any setup that was cut short.

## Cell 24: Install the Data Agent SDK

The Fabric Data Agent SDK creates and configures data agents from Python. It isn't part of the runtime, so cell 24 installs a pinned version with `%pip`.

1. Run the next code cell.
1. Check that it ends with `PySpark kernel has been restarted to use updated packages.`

## Cell 25: Refresh the SQL analytics endpoint

The data agent reads lakehouse tables through the SQL analytics endpoint, and the endpoint reads Delta tables. OneLake can present an Iceberg table as Delta by building a Delta log from the Iceberg metadata, without copying data. It builds that log when a reader lists the table's `_delta_log` folder.

Cell 25 lists the folder for each of the 9 tables, then asks the endpoint to refresh its metadata. It repeats until the endpoint reads every table, for up to 5 minutes.

1. Run the next code cell.
1. Check that it prints `The SQL analytics endpoint reads all 9 tables.`

    The same files are now readable as Iceberg, by Spark and DuckDB, and as Delta, by the SQL analytics endpoint.

## Cell 26: Create and publish the recall agent

Cell 26 creates **contoso_recall_agent**, or opens it if it already exists. It gives the agent two sets of instructions:

- The agent instructions say it answers recall questions for Contoso Fresh, that today is 2026-10-13, and that it lists the store IDs when an answer is a set of stores.
- The data source instructions say what each table holds, that timestamps are in UTC, and how to find a related lot on the Paris clock.

Then the cell adds the lakehouse as the agent's data source and publishes the agent.

1. Run the next code cell.
1. Check that it prints `contoso_recall_agent published`.

## Select the tables

Cell 26 adds the lakehouse to the agent, but none of its tables. You choose which tables the agent can query.

1. In the left navigation, select the workspace, then open **contoso_recall_agent**. Its type is **Data agent**.

    ![contoso_recall_agent in the workspace item list, with type Data agent](media/exercise-2-6-open-agent.png)

1. In the **Explorer** pane, make sure all 9 tables in `dbo` and `history` are ticked. If the lakehouse shows **No tables selected yet**, tick the lakehouse to select all 9.

    ![The agent Explorer pane with the lakehouse ticked and its 9 tables selected](media/exercise-2-6-select-tables.png)

1. If **Standard runtime supports up to 25 tables** opens, select **Continue with Standard**.

    ![The Standard runtime supports up to 25 tables window with Continue with Standard](media/exercise-2-6-standard-runtime.png)

## Ask the recall questions

The two questions need different tables: store inventory for where the lot is now, and shipment history for every store that received it.

1. In the chat box, enter ++Which stores currently hold lot YG-2291?++
1. Check that the answer lists 9 stores, the same stores as cell 7.
1. Enter ++How many stores received lot YG-2291?++
1. Check that the answer is 13 stores, the same count as cell 15.

1. Select **Expand response** > **Steps completed**, then expand the step.

    ![Steps completed expanded to show the SQL the agent ran](media/exercise-2-6-steps-completed.png)

    The step shows the SQL the agent wrote and the tables it queried.

> [!Help] If an answer gives a different count, check that all 9 tables are ticked, then ask again.

## Publish the agent

A data agent has two versions. The draft is what you edit and what the chat box tests. The published version is what colleagues query. Cell 26 publishes before you select the tables, so publish again to copy your table selection from the draft.

1. Select **Publish**.
1. In the window that asks for a description, keep the description cell 26 set, or enter ++Answers recall questions about Contoso Fresh lots, stores, and shipments.++ if it's empty. Then select **Publish**.

    ![The Publish window for contoso_recall_agent with its description](media/exercise-2-6-publish.png)

    The published version now queries the same 9 tables you tested. You can keep changing the draft without changing what regional managers see.

**Completion check:** The agent answers from the lakehouse tables: 9 stores hold YG-2291, and 13 received it. You published it with all 9 tables selected.
