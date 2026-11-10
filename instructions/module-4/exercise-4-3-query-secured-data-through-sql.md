# Exercise 4.3: Query secured data through SQL

In [Exercise 4.2](exercise-4-2-add-row-and-column-security.md), you configured row and column rules as an engineer. Your engineer account has elevated access, so querying your own lakehouse wouldn't demonstrate a restricted reader's experience.

In this exercise, you open a separate lakehouse shared with you as a restricted reader. Its preconfigured OneLake security role allows only **SUP-014** rows in **dbo.lots** and hides **supplier_unit_cost_eur**. You query its SQL analytics endpoint to see those policies apply without putting the security filter in your query.

## Check your starting point

> [!Note] Author setup is still TBD. Don't mark this exercise complete until the instructor supplies the shared lakehouse and confirms the setup below. Creating the role in your own lakehouse doesn't create or configure this separate shared item.

The shared lakehouse must meet these requirements:

- It contains the Module 2 **dbo.lots** data, including **YG-2291** for **SUP-014** and rows for other suppliers. It also contains **dbo.store_inventory** for the table-access check.
- Your lab identity has item **Read** access but isn't an Admin, Member, or Contributor in the shared lakehouse's workspace.
- Your effective data access grants only **dbo.lots**, restricted to SUP-014, with **supplier_unit_cost_eur** hidden in that same role.
- DefaultReader, other roles, and group membership don't grant broader access.
- The tables are registered in the SQL analytics endpoint, and the endpoint uses **User's identity access mode**.

TODO: Add the shared lakehouse name, its supplied navigation link, the reader identity, and the author provisioning steps. Record the expected SUP-014 row count and verify the query results below against the provisioned data before delivery.

The instructor can inspect the endpoint's mode under **Security** > **View data access mode** > **Data access mode settings**. In **User's identity access mode**, the endpoint enforces the signed-in reader's OneLake rules. **Delegated identity access mode** uses the owner's identity for OneLake access and SQL permissions for the reader; it isn't a valid test of these OneLake policies.

> [!Help] Don't switch access modes during the exercise. Switching can cancel running and queued SQL analytics endpoint queries across the workspace and remove existing SQL roles and some SQL metadata objects. Have the instructor configure and verify the mode before the lab.

## Open the shared SQL analytics endpoint

1. Use the instructor-supplied link to open the shared lakehouse. Check its name and workspace; don't open the lakehouse where you authored the role.
1. Verify the signed-in account is the supplied reader identity. If the lab uses a separate reader account, open it in a separate browser profile so you don't reuse the engineer session.
1. Open the shared lakehouse's **SQL analytics endpoint** using the lakehouse/endpoint switcher.
1. Select **New SQL query**.

    <!-- Screenshot TODO: exercise-4-3-shared-endpoint.png; show the shared lakehouse's SQL analytics endpoint and New SQL query. -->

Run each statement below separately. Wait for its result before moving to the next statement, and keep the query text, result or error, endpoint name, and signed-in identity as evidence.

## Read the allowed columns

1. Run this query. It deliberately has no supplier filter:

    ```sql
    SELECT TOP (20)
        lot_id,
        product_id,
        supplier_id,
        production_line
    FROM dbo.lots
    ORDER BY lot_id;
    ```

1. Check that it returns rows and that every row has **supplier_id** equal to **SUP-014**.
1. Run this query to check all visible suppliers, not just the first 20 rows:

    ```sql
    SELECT supplier_id, COUNT(*) AS visible_lots
    FROM dbo.lots
    GROUP BY supplier_id
    ORDER BY supplier_id;
    ```

1. Check that exactly one supplier appears: **SUP-014**, with a positive count. Compare the count with the instructor's verified value.

    <!-- Screenshot TODO: exercise-4-3-visible-supplier.png; show SUP-014 as the only group, with the verified count. -->

The row rule filtered the table before the query returned its results. You didn't need to add `WHERE supplier_id = 'SUP-014'` to make the policy apply.

## Try to read rows outside the rule

1. Run this query:

    ```sql
    SELECT lot_id, supplier_id
    FROM dbo.lots
    WHERE supplier_id <> 'SUP-014';
    ```

1. Check that it succeeds with **zero rows**. Asking explicitly for another supplier doesn't override the role.
1. Check that an allowed recalled lot is still readable:

    ```sql
    SELECT lot_id, supplier_id, production_line
    FROM dbo.lots
    WHERE lot_id = 'YG-2291';
    ```

1. Check that the result includes **YG-2291**, **SUP-014**, and **AVD-L2**, as in Exercise 2.2.

The positive check matters: an empty or incorrectly provisioned table could also return zero rows for the denied-row query.

## Try to read the hidden column

1. Run this query separately:

    ```sql
    SELECT lot_id, supplier_unit_cost_eur
    FROM dbo.lots
    WHERE lot_id = 'YG-2291';
    ```

1. Check that the query fails with an access error for the hidden column and returns no cost values. The exact error wording can vary.
1. Run this query separately:

    ```sql
    SELECT *
    FROM dbo.lots
    WHERE lot_id = 'YG-2291';
    ```

1. Check that this query also fails. In the SQL analytics endpoint, `*` includes the hidden column; it doesn't mean "only the columns I'm allowed to see."
1. Rerun the explicit allowed-column query for **YG-2291** from the previous section. Check that it still succeeds.

    <!-- Screenshot TODO: exercise-4-3-hidden-cost.png; show the hidden-column access error without any cost values. -->

CLS isn't data masking. The reader can't retrieve the cost column at all, even for an allowed row. A column name might still appear in some experiences; the check is that its values can't be read.

## Try to read a table outside the role

1. Run this query:

    ```sql
    SELECT TOP (1) location_id, lot_id
    FROM dbo.store_inventory;
    ```

1. Check that access is blocked and no inventory data is returned. The instructor must have confirmed the table exists; a typo, missing table, or unrelated connection failure isn't evidence that table security worked.

## Review the results

| Query | Expected restricted-reader result |
|---|---|
| Allowed lot columns, no supplier filter | Only SUP-014 rows |
| Group by supplier | One group, SUP-014, with the verified positive count |
| Explicitly request other suppliers | Query succeeds with zero rows |
| Allowed columns for YG-2291 | Recalled lot is readable |
| Explicitly request supplier unit cost | Access error; no cost values |
| `SELECT *` from lots | Access error because it includes the hidden column |
| Read store inventory | Access blocked; no inventory data |

> [!Help] If you see another supplier or any cost value, stop and report it. Confirm the identity and shared endpoint, then have the instructor inspect access mode, role membership, DefaultReader, and other grants. If allowed-column queries fail, keep the error and have the instructor check item Read access, table registration, and security synchronization. Don't grant broader access or switch to the engineer account to make the checks pass.

**Completion check:** Using the restricted identity against the supplied shared lakehouse, you observed both successful allowed reads and blocked reads. RLS limited rows without a query-side supplier filter, CLS blocked cost access, and table security blocked inventory access. Record any unavailable setup or failed check as incomplete.

## Learn more

- [OneLake security for SQL analytics endpoints](https://learn.microsoft.com/fabric/onelake/security/sql-analytics-endpoint-onelake-security)
- [Table, column, and row-level security in OneLake](https://learn.microsoft.com/fabric/onelake/security/table-column-row-security)
