# Source

- [Operational SQL schema](sql/operational-source-schema.sql) bootstraps only a
  new, empty Fabric SQL source with seven typed canonical tables and an isolated
  mirroring training table. It does not seed or overwrite existing records.
- [Mirroring exercise](sql/mirroring-probe.sql) defaults to read-only inspection.
  Its explicit insert/update/delete actions affect only the training probe,
  reject out-of-order state changes, and preserve caller transaction ownership.
- [Module 2 notebook](notebooks/module-2-shipment-history.ipynb) generates
  reference and historical data and guides Iceberg, SQL, AI, and data-agent
  exercises.
- [Module 3 temperature analysis](sql/module-3-temperature-status.sql) is a
  read-only SQL analytics endpoint batch. It validates telemetry, deduplicates
  retries, calculates continuous hot intervals, and reports every affected
  shipment, including those without observations.
- [Complete-recall snapshot checks](sql/temperature-snapshot-checks.sql) verifies
  all thirteen derived shipment results, coverage, authorization context, and
  schema after an author refresh. It deliberately rejects boundary-only data.
  Use the [native pipeline refresh](../infra/README.md#native-pipeline-refresh)
  to materialize the guarded analysis without a local CSV export.
- [Telemetry replay](telemetry/replay.py) validates the complete input before
  sending any event. It uses the existing Python standard library and a Fabio
  source connection piped on stdin, without storing or printing credentials.
  See the [author replay procedure](../infra/README.md#replay-with-the-supplied-producer).
- [Author recall checks](sql/fallback-recall-checks.sql) verifies the corrected
  reference/history results through a SQL analytics endpoint without Spark.
  This diagnostic is not an alternate Module 2 completion path and does not
  validate Iceberg snapshots, DuckDB, AI, or notebook package paths.

Run learner assets through their corresponding [exercises](../instructions/README.md);
keep the author diagnostic checks outside the attendee sequence.
The temperature batch does not create tables, change roles, or grant access.
