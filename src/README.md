# Source

- [Module 2 notebook](notebooks/module-2-shipment-history.ipynb) generates
  reference and historical data and guides Iceberg, SQL, AI, and data-agent
  exercises.
- [Module 3 temperature analysis](sql/module-3-temperature-status.sql) is a
  read-only SQL analytics endpoint batch. It validates telemetry, deduplicates
  retries, calculates continuous hot intervals, and reports every affected
  shipment, including those without observations.
- [Telemetry replay](telemetry/replay.py) validates the complete input before
  sending any event. It uses the existing Python standard library and a Fabio
  source connection piped on stdin, without storing or printing credentials.
  See the [author replay procedure](../infra/README.md#replay-with-the-supplied-producer).

Run these assets through their corresponding [learner exercises](../instructions/README.md).
The temperature batch does not create tables, change roles, or grant access.
