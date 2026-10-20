# Exercise 2.3: Write shipment history as Iceberg

Store inventory shows where YG-2291 is now. A store that received the lot and has sold all of it no longer shows in inventory, but its customers may still have the yogurt. To reach them, Contoso Fresh needs every store that received the lot, and that's in the shipment history.

In this exercise, you write five years of lot and shipment history as Iceberg tables. Then you apply a carrier's late correction file with row-level `INSERT`, `UPDATE` and `DELETE` statements. Each change makes a new Iceberg snapshot, so you can compare the history before and after the correction.

## Check your starting point

Cell 4 listed 7 `dbo` tables. If you haven't run it, finish Exercise 2.2 first.

## Cell 8: Write the history tables

Cell 8 creates the `history` schema in the lakehouse, then writes two tables:

- `lot_history` has one row per lot produced in the last five years, with its supplier, production line, start time and QA note.
- `shipment_history` has one row per shipment line. Each line ships one lot to one store.

`shipment_history` is partitioned with the Iceberg transform `months(shipped_at_utc)`. Iceberg groups the data files by month and records that in the table's metadata. A query that filters on `shipped_at_utc` reads only the months it needs, without naming a separate month column.

1. Run the next code cell.
1. Check that it prints `history.lot_history: 16,961 rows` and `history.shipment_history: 1,165,391 rows`. If you ran the cell before, each line says `already exists` instead.

## Cell 9: Count the stores that received YG-2291

Cell 9 counts the distinct stores in `shipment_history` that received YG-2291, reading through the OneLake REST catalog. It waits up to 3 minutes for OneLake to show both history tables.

1. Run the next code cell.
1. Check that it prints `12 stores received YG-2291`. If you already applied the corrections, it prints 13.

    Before the corrections, shipment history counts 12 stores, while current inventory lists 9. The carrier's correction file raises the history count to 13.

## Cell 10: Look at the correction file

A carrier sent a late correction file, **corrections_2026-10-13.csv**. It adds 3 shipment lines that were missing, moves 1 line to a different store, and removes 20 duplicate lines. Cell 10 loads the file as a temporary view named `corrections`. Its `action` column says what to do with each row: `insert`, `update` or `delete`.

1. Run the next code cell.
1. Check that the first table counts `delete` 20, `insert` 3 and `update` 1. The second table lists every row in the file.

## Cell 11: Insert the new lines

The history tables use Iceberg format version 2, which supports row-level changes. You can fix a few rows without rewriting the table. Cell 11 inserts the 3 `insert` rows. It skips any line whose `shipment_id` and `line_no` are already in the table, so a rerun inserts nothing.

1. Run the next code cell.
1. Check that it prints `3 rows inserted`, and that the table below it shows the 3 lines of `SHP-209481`.

    Line 1 of `SHP-209481` ships YG-2291 to `STR-013`. Before this insert, the history had no record of that line. If you run the cell again, it prints `0 rows inserted` and shows the same 3 lines.

## Cell 12: Update the moved line

The correction file says `SHP-207158` line 1 went to `STR-042`, not `STR-052`. Cell 12 updates the line's `store_id`.

1. Run the next code cell.
1. Check that it prints `SHP-207158 line 1: STR-052 -> STR-042`.

    If you run the cell again, it prints `STR-042 -> STR-042`, because the line already points to the right store.

## Cell 13: Delete the duplicate lines

The 20 `delete` rows are the lines of shipments `SHP-208999` and `SHP-209240`. They copy two real shipments that the carrier recorded a second time under new IDs. Cell 13 holds a `DELETE` statement without its condition, and you write the condition. A shipment line is identified by `shipment_id` and `line_no` together, so the condition must match on both.

1. In cell 13, find the line `condition = None`.
1. Replace `None` with a SQL condition, as a Python string, that matches the 20 `delete` rows in `corrections` on both `shipment_id` and `line_no`.

    ![Cell 13 with the condition line ready to edit](media/exercise-2-3-cell-13-condition.png)

1. Run the cell.
1. Check that it prints `20 rows deleted`.

    If you run the cell again, it prints `0 rows deleted`, because the rows are already gone.

> [+Hint] Show the answer
>
> Replace the whole `condition = None` line with this one:
>
> ++condition = "(shipment_id, line_no) IN (SELECT shipment_id, line_no FROM corrections WHERE action = 'delete')"++
>
> The editor closes brackets and quotes as you type. If you type the line instead of pasting it, delete the extra `)"` at the end.

## Cell 14: Compare snapshots

Every Iceberg write commits a snapshot, a version of the table. Earlier snapshots stay readable, so you can query the table as it was at any of them. This is called time travel. Cell 14 lists the snapshots of `shipment_history`, then counts the stores that received YG-2291 at the first snapshot and at the latest.

1. Run the next code cell.
1. Check that it lists at least 4 snapshots, then prints `First snapshot: 12 stores received YG-2291` and `Latest snapshot: 13 stores received YG-2291`.

    The first snapshot is the write from cell 8, and cells 11 to 13 each added one. The `operation` column shows Iceberg's commit type, such as `append` or `overwrite`, not the SQL statement. `added_records` and `deleted_records` count the rows in the data files a snapshot added and removed. Iceberg rewrites whole files to update or delete rows, so these counts include unchanged rows. The messages from cells 11 to 13 give the number of lines corrected.

    With time travel, Contoso Fresh can show what the history said before the carrier's correction and after it.

## Cell 15: Check the corrections through OneLake

Changes written through `writecat` reach the REST catalog after a short delay. Cell 15 waits up to 3 minutes for OneLake to show the latest snapshot. Then it checks that all 3 corrections are in: 3 inserted lines, 1 updated line and no duplicates left. If one is missing, the cell names the cells to finish.

1. Run the next code cell.
1. Check that it prints `13 stores received YG-2291, read through OneLake`.

    Spark now reads the corrected history through the OneLake REST catalog. In Exercise 2.4, DuckDB reads it through the same catalog.

**Completion check:** Cell 15 printed `13 stores received YG-2291, read through OneLake`.
