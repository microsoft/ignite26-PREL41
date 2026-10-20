# Exercise 2.2: Explore current state through OneLake

Apache Iceberg is an open table format. Any engine with an Iceberg library can read an Iceberg table, so Contoso Fresh can keep one copy of its data and let each team query it with the engine it already uses. 

OneLake publishes a lakehouse's Iceberg tables through an Iceberg REST catalog, the standard API those engines use to find tables and their files.

In this exercise, you write the current-state CSV files as Iceberg tables, then read them back through the OneLake REST catalog, the way an engine outside Fabric would. You finish by asking Module 1's question of the Iceberg tables: which stores hold YG-2291?

## Check your starting point

1. In the notebook's **Explorer** pane, right-click the lakehouse, then select **Refresh**.

1. Expand the lakehouse, then **Files**. If there's no **history** folder, finish Exercise 2.1 first.


## Cell 2: Start Spark

Fabric Runtime 2.0 includes Iceberg, so the notebook needs no extra libraries. Cell 2 registers two Iceberg catalogs over the same lakehouse:

- `writecat` writes Iceberg files straight into the lakehouse **Tables** folder. OneLake picks up Iceberg tables written there.
- `readcat` reads through the OneLake Iceberg REST catalog, as an engine outside Fabric would. Its cache is off, so each read asks OneLake for the table's current metadata. OneLake can take a short time to show a new write.

The notebook writes through one catalog and reads through the other, so you can see each change arrive through OneLake.

1. Run the next code cell.
1. Check that the first line ends with `Iceberg 1.11.0`, and that a `writecat warehouse` path and a `readcat warehouse` path follow it.

    The `writecat` path is the lakehouse **Tables** folder in OneLake. The `readcat` warehouse is the workspace ID and lakehouse ID, which is how the REST catalog names a lakehouse.

> [!Note] If the Spark session stops, for example after a timeout, you lose the catalogs, the installed libraries and the settings from earlier cells. Run cell 2 again, then rerun the current exercise from its first code cell. Every cell is safe to rerun.

## Cell 3: Build the current-state tables

Cell 3 reads the 7 CSV files in **Files/reference** and writes each one as an Iceberg table in the `dbo` schema. If a table already exists from an earlier run, the cell leaves it as it is.

1. Run the next code cell.
1. Check that 7 tables print with their row counts, from `dbo.suppliers: 4 rows` to `dbo.store_inventory: 1,533 rows`. If you ran the cell before, each line says `already exists` instead.

## Cell 4: List the tables through OneLake

OneLake takes from a few seconds to 2 minutes to show a new table through the REST catalog. Cell 4 asks the REST catalog for the tables in `dbo` every 10 seconds until all 7 appear, for up to 3 minutes.

1. Run the next code cell.
1. Check that the table lists `carriers`, `locations`, `lots`, `products`, `store_inventory`, `suppliers` and `trucks`.

    Spark wrote these tables as files, and the REST catalog now lists them. Any engine with the lakehouse's REST address and a token can find them the same way.

## Cell 5: Read lot YG-2291

Cell 5 reads the recalled lot from `readcat.dbo.lots`.

1. Run the next code cell.
1. Check that the row for **YG-2291** shows supplier `SUP-014` and production line `AVD-L2`.

    SUP-014 is Alpine Valley Dairy Cooperative. The lot's `production_start_utc` is `2026-10-11 20:00`, a Sunday evening in UTC. This start time matters in Exercise 2.4.

## Cell 6: Describe the lots table

`DESCRIBE TABLE EXTENDED` shows a table's format and where its files live.

1. Run the next code cell.
1. Scroll down to **# Detailed Table Information**. Check that **Provider** is `iceberg` and **Location** ends in `/Tables/dbo/lots`.

    The REST catalog points to the files `writecat` wrote in the lakehouse. Both catalogs share one copy of the data.

## Cell 7: Find the stores that hold YG-2291

Cell 7 asks Exercise 1.4's question of the Iceberg tables. It joins store inventory to locations through the REST catalog and keeps the stores that hold YG-2291.

1. Run the next code cell.
1. Check that it prints `9 stores hold YG-2291`, followed by one row per store with its city, region and units on hand.

    This is the current state: where the lot is now. In Exercise 2.3, you add where it has been.

**Completion check:** Cell 4 listed 7 `dbo` tables through the OneLake REST catalog, and cell 7 printed `9 stores hold YG-2291`.
