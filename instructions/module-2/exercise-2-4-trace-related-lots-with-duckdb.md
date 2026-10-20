# Exercise 2.4: Trace related lots with DuckDB

If the contamination came from the production line, other lots from the same line may be affected too. SUP-014 makes yogurt on production line AVD-L2 in a weekly run, every Sunday from 22:00 to 02:00, Paris time. Contoso Fresh treats every lot from that weekly run in the 90 days before the recall as a related lot, and needs to know which stores received them.

In this exercise, you find the related lots with DuckDB, an open-source SQL engine that runs in the notebook's Python process, outside Spark. DuckDB reads the same Iceberg tables through the OneLake REST catalog. Nothing is copied.

## Check your starting point

Cell 15 printed `13 stores received YG-2291, read through OneLake`. If it didn't, finish Exercise 2.3 first. Cell 20's store count depends on the corrections.

## Cell 16: Install DuckDB

DuckDB isn't part of the Fabric runtime, so cell 16 installs it for this session with `%pip`. The cell installs DuckDB 1.5.6 or a later 1.x release.

1. Run the next code cell.
1. Check that it ends with `PySpark kernel has been restarted to use updated packages.`

    `%pip` restarts Python so it can load the new package. The restart clears Python variables, but the Spark session and its catalogs stay.

## Cell 17: Attach OneLake to DuckDB

Cell 17 loads DuckDB's Iceberg extension and attaches the OneLake REST catalog as a database named `onelake`. It signs in with your Fabric token, taken from the notebook. For each table DuckDB reads, the REST catalog hands it short-lived storage credentials, called vended credentials, so DuckDB needs no storage keys.

1. Run the next code cell.
1. Check that it lists 9 tables: 7 in `dbo`, plus `lot_history` and `shipment_history` in `history`.

    These are the tables you wrote with Spark. In DuckDB, their names start with `onelake`, such as `onelake.history.lot_history`.

## Cell 18: Query the batch window on the UTC clock

`lot_history` stores production start times in UTC. Cell 18 looks for SUP-014 lots on AVD-L2 from the last 90 days that started between Sunday 22:00 and Monday 02:00, comparing the times as stored.

1. Run the next code cell.
1. Check that it prints `6 lots on the UTC clock. YG-2291 is missing.`

    YG-2291 is the lot under recall, so this list is wrong. The next cell shows why.

## Cell 19: Query the batch window on the Paris clock

The production schedule runs on Paris time. From late March to late October, Paris is 2 hours ahead of UTC, so the UTC query's window ran 2 hours late, from midnight to 04:00 Paris time. Cell 19 converts each start time to Paris time before it applies the window, and saves the result as a view named `related_lots`.

1. Run the next code cell.
1. Check that it prints `13 related lots on the Paris clock. YG-2291 is in the list.`

    YG-2291 started at 20:00 UTC on Sunday 11 October, which was 22:00 in Paris, the first hour of the run.

## Cell 20: Find the stores the related lots reached

Cell 20 joins the related lots to shipment history to find every store that received one, then to locations to group those stores by region.

1. Run the next code cell.
1. Check that it prints `The related lots reached 45 stores in 5 regions`.

    Each regional manager can now see how many stores in their region received a related lot. Without the carrier's corrections from Exercise 2.3, the total would be 44.

**Completion check:** DuckDB found 13 related lots that reached 45 stores, reading the same Iceberg tables as Spark.
