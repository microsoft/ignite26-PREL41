# Exercise 4.2: Add row and column security

The role you created in [Exercise 4.1](exercise-4-1-create-a-onelake-security-role.md) grants access to the whole lots table. A supplier reader needs less: the lots from Alpine Valley Dairy Cooperative, **SUP-014**, without Contoso Fresh's supplier unit costs.

In this exercise, you add row-level security (RLS) and column-level security (CLS) to **dbo.lots** in the same role.

## Check your starting point

1. Open your lakehouse and select **Manage OneLake security**.
1. Open **RecallSupplierReader**. Check that it grants **Read**, includes only **dbo.lots**, and has your lab account as its member.

    If the role grants **ReadWrite**, stop and correct it to **Read** before continuing using **Edit** and then **Edit role permissions**. Row and column rules aren't available on ReadWrite roles.

1. Keep your workspace **Admin** access. As in Exercise 4.1, you'll configure the role, not test restricted reads with your own account.

## Understand row and column rules

| Control | What the reader experiences |
|---|---|
| **Row-level security** | Queries return only rows allowed by the role's SQL rule, even when the query doesn't include that filter. |
| **Column-level security** | Queries can read only allowed columns. Hidden values aren't replaced by masked text or nulls; access to those columns is removed. |

Apply both rules to **dbo.lots** within **RecallSupplierReader**. Don't create one RLS role and a separate CLS role for the same reader and table: that combination isn't supported and can cause query errors.

These are grants, not overrides. Another role granting unrestricted table access can defeat the intended restriction. A filter on **dbo.lots** also doesn't automatically filter **dbo.store_inventory** or **history.lot_history**; each table needs its own access rules.

## Limit rows to the supplier

OneLake row rules use a SQL statement that describes the allowed rows. This walkthrough uses a fixed supplier ID; it isn't a dynamic mapping from the signed-in user to a supplier.

1. On the role's **Data in role** tab, find **dbo.lots**.
1. Select more options (**...**) next to the table, then select **Row security**.

    <!-- Screenshot TODO: exercise-4-2-row-security.png; show Row security on dbo.lots in RecallSupplierReader. -->

1. Enter this statement in the code editor:

    ```sql
    SELECT * FROM dbo.lots WHERE supplier_id = 'SUP-014'
    ```

    The `SELECT *` here defines the row rule. You'll configure which columns the reader can query separately.

1. Select **Save** and wait for confirmation. If validation fails, keep the error and check the table name, column name, and quoted supplier ID. Don't replace the rule with unrestricted access.

    <!-- Screenshot TODO: exercise-4-2-supplier-rule.png; show the saved SUP-014 row rule. -->

The rule refers only to columns in this table. OneLake RLS doesn't support multitable queries or a join to a supplier lookup table.

## Hide supplier unit costs

1. Still on **Data in role**, select more options (**...**) next to **dbo.lots**, then select **Column security**.
1. Find **supplier_unit_cost_eur** and set its **Permission** to **Hide**.
1. Leave the other columns allowed, including **lot_id**, **product_id**, **supplier_id**, and **production_line**.
1. Select **Save** and wait for confirmation.

    <!-- Screenshot TODO: exercise-4-2-column-security.png; show supplier_unit_cost_eur set to Hide and the other columns allowed. -->

1. Check that **Data in role** shows both row and column restrictions on **dbo.lots**. Reopen each setting and confirm the saved rule and hidden column.
1. Check **Members in role** again. Keep your lab account as the member; no separate reader identity is needed to configure these rules.

> [!Note] For a reader whose access is limited to this role, `SELECT * FROM dbo.lots` in the SQL analytics endpoint will fail because it requests the hidden cost column. Selecting only allowed columns succeeds and returns only SUP-014 rows. Spark handles `SELECT *` differently: it returns only allowed columns. Your admin account remains unrestricted, so your own queries won't demonstrate these restrictions.

**Completion check:** The same **RecallSupplierReader** role has the SUP-014 row rule and hides **supplier_unit_cost_eur** on **dbo.lots**. Its data scope still includes only that table. You verified the saved configuration as an admin; effective restricted query behavior is checked separately in Exercise 4.3.

Continue to [Exercise 4.3: Query secured data through SQL](exercise-4-3-query-secured-data-through-sql.md).

## Learn more

- [Table, column, and row-level security in OneLake](https://learn.microsoft.com/fabric/onelake/security/table-column-row-security)
- [Create and manage OneLake security roles](https://learn.microsoft.com/fabric/onelake/security/create-manage-roles)
- [Row-level security syntax reference](https://learn.microsoft.com/fabric/onelake/security/row-level-security-syntax)
