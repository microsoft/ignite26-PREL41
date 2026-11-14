# Exercise 5.3: Query the accelerated recall data

Run ClickHouse SQL against the copies from Exercise 5.2. Unlike DuckDB's
direct OneLake reads in Exercise 2.4, these queries use ClickHouse storage and
compute. 

> To query data directly from OneLake, without first syncing it to ClickHouse, you need to **Add data lake catalog** from **Data Sources** and configure it to use [OneLake Table APIs for Apache Iceberg](https://learn.microsoft.com/en-us/fabric/onelake/table-apis/iceberg-table-apis-overview)

## Check your starting point

All four syncs must be complete. Use the embedded SQL console in the Fabric
ClickHouse item and the **Default** database. Run each statement separately if
the editor executes only one statement at a time.

## Task 1: Validate the corrected snapshot

1. Run:

    ```sql
    SELECT count() AS lot_rows
    FROM default.lot_history;
    ```
    ```sql
    SELECT
        count() AS shipment_lines,
        uniqExact(tuple(shipment_id, line_no)) AS distinct_line_keys,
        uniqExactIf(store_id, lot_id = 'YG-2291') AS receiving_stores
    FROM default.shipment_history;
    ```

2. `uniqExact` counts exactly, rather than using an approximate distinct count.

3. Check the carrier's update and deletes:

    ```sql
    SELECT shipment_id, line_no, store_id
    FROM default.shipment_history
    WHERE shipment_id = 'SHP-207158' AND line_no = 1;
    ```
    ```sql
    SELECT count() AS removed_lines_still_present
    FROM default.shipment_history
    WHERE shipment_id IN ('SHP-208999', 'SHP-209240');
    ```

4. Expect **STR-042** in the first result and **0** in the second.

    > [!Help] Twelve receiving stores, old correction values, or duplicate keys
    > indicate an incomplete source or stale/duplicated copy, not a successful
    > acceleration. Compare with Exercise 2.3 and inspect sync status. Do not
    > edit ClickHouse rows to make these checks pass.

## Task 2: Separate current stock from historical reach

1. List the stores that currently hold the affected lot:

    ```sql
    SELECT
        i.location_id AS store_id,
        l.region,
        i.units_on_hand
    FROM default.store_inventory AS i
    INNER JOIN default.locations AS l
        ON i.location_id = l.location_id
    WHERE i.lot_id = 'YG-2291'
      AND i.units_on_hand > 0
      AND l.location_type = 'store'
    ORDER BY store_id;
    ```

2. Expect **9** rows: **8 North** and **1 East**, matching the unrestricted
   current-inventory result from earlier modules.

3. List every store that received the lot:

    ```sql
    SELECT DISTINCT store_id
    FROM default.shipment_history
    WHERE lot_id = 'YG-2291'
    ORDER BY store_id;
    ```

4. Expect **13** distinct IDs, including **STR-013**, which the late carrier
   correction added. A historical delivery does not prove stock is still held.
5. Summarize historical reach by region:

    ```sql
    SELECT
        l.region,
        uniqExact(s.store_id) AS receiving_stores,
        uniqExact(s.shipment_id) AS shipments,
        sum(s.cases) AS cases_shipped
    FROM default.shipment_history AS s
    INNER JOIN default.locations AS l
        ON s.store_id = l.location_id
    WHERE s.lot_id = 'YG-2291'
      AND l.location_type = 'store'
    GROUP BY l.region
    ORDER BY l.region;
    ```

6. Confirm that the regional receiving-store counts sum to **13**. Cases are
   historical shipment quantities, not today's units on hand.

## Task 3: Save and inspect execution

1. Save the regional query as `YG-2291 delivery reach by region`.
   In public preview, saved queries are personal, not shared workspace assets.
1. Run it twice and record the displayed elapsed time and any available
   rows-read statistics. The first run may include service wake-up time.
1. Compare the answers with the earlier OneLake results. This small lab
   validates equivalent recall answers, not a sub-second performance guarantee
   or a controlled benchmark against Spark or DuckDB.

**Completion check:** ClickHouse contains the corrected, duplicate-free
shipment snapshot and returns 9 current holders and 13 historical receiving
stores. You saved the regional query and recorded its observed execution time.
