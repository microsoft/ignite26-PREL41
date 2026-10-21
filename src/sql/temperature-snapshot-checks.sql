-- Author acceptance check after complete-recall replay and snapshot refresh.
-- Run as the engineer, not as a deliberately restricted reader.
IF @@TRANCOUNT > 0
    THROW 50100, 'Run snapshot acceptance outside a caller-owned transaction.', 1;

BEGIN TRY
BEGIN TRANSACTION;

IF (SELECT COUNT_BIG(*) FROM dbo.recall_temperature_status) <> 13
   OR (SELECT COUNT(DISTINCT shipment_id) FROM dbo.recall_temperature_status) <> 13
    THROW 50101, 'Expected thirteen distinct affected shipments in the snapshot.', 1;

IF EXISTS (
    SELECT 1
    FROM (VALUES
        ('SHP-209403', 38, 1500, 'breach'),
        ('SHP-209404', 57, 1200, 'no_breach'),
        ('SHP-209408', 26,    0, 'no_breach'),
        ('SHP-209410', 21,  900, 'no_breach'),
        ('SHP-209414', 42,  600, 'no_breach'),
        ('SHP-209415', 11, 1500, 'breach'),
        ('SHP-209416', 18, 1200, 'no_breach'),
        ('SHP-209420', 20,    0, 'no_breach'),
        ('SHP-209421', 32,    0, 'no_breach'),
        ('SHP-209426', 65,    0, 'no_breach'),
        ('SHP-209428', 51,    0, 'no_breach'),
        ('SHP-209432', 15,    0, 'no_breach'),
        ('SHP-209481', 42,    0, 'no_breach')
    ) AS expected(shipment_id, readings, hot_seconds, temperature_status)
    LEFT JOIN dbo.recall_temperature_status AS actual
        ON actual.shipment_id = expected.shipment_id
    WHERE actual.shipment_id IS NULL
       OR actual.distinct_readings IS NULL
       OR actual.distinct_readings <> expected.readings
       OR actual.longest_hot_seconds IS NULL
       OR actual.longest_hot_seconds <> expected.hot_seconds
       OR actual.shipment_temperature_status IS NULL
       OR actual.shipment_temperature_status <> expected.temperature_status
       OR actual.observed_window_status IS NULL
       OR actual.observed_window_status <>
            CASE WHEN expected.temperature_status = 'breach'
                THEN 'breach' ELSE 'no_observed_breach' END
)
    THROW 50102, 'Snapshot readings, continuous durations, or statuses differ from the complete fixture.', 1;

IF EXISTS (
    SELECT 1
    FROM dbo.recall_temperature_status
    WHERE lot_id IS NULL OR lot_id <> 'YG-2291'
       OR analysis_time_utc IS NULL OR analysis_time_utc > SYSUTCDATETIME()
       OR first_observation_utc IS NULL OR last_observation_utc IS NULL
       OR shipped_at_utc IS NULL OR delivered_at_utc IS NULL
       OR first_observation_utc <> CONVERT(datetime2(6), shipped_at_utc, 127)
       OR last_observation_utc <> CONVERT(datetime2(6), delivered_at_utc, 127)
)
   OR (SELECT COUNT(DISTINCT analysis_time_utc) FROM dbo.recall_temperature_status) <> 1
    THROW 50103, 'Snapshot clock or full-delivery coverage is invalid.', 1;

IF EXISTS (
    SELECT 1
    FROM dbo.recall_temperature_status AS snapshot
    WHERE NOT EXISTS (
        SELECT 1
        FROM history.shipment_history AS shipment
        WHERE shipment.lot_id = snapshot.lot_id
          AND shipment.shipment_id = snapshot.shipment_id
          AND shipment.truck_id = snapshot.truck_id
          AND shipment.carrier_id = snapshot.carrier_id
          AND shipment.store_id = snapshot.store_id
          AND shipment.shipped_at_utc = snapshot.shipped_at_utc
          AND shipment.delivered_at_utc = snapshot.delivered_at_utc
    )
)
    THROW 50104, 'Snapshot authorization context does not match shipment history.', 1;

IF (SELECT COUNT(*) FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.recall_temperature_status')) <> 14
    THROW 50105, 'Snapshot schema changed; review it before serving the application.', 1;

SELECT COUNT_BIG(*) AS shipments,
    SUM(CASE WHEN shipment_temperature_status = 'breach' THEN 1 ELSE 0 END) AS breaches,
    SUM(CASE WHEN shipment_temperature_status = 'no_breach' THEN 1 ELSE 0 END) AS no_breach,
    MIN(analysis_time_utc) AS analysis_time_utc
FROM dbo.recall_temperature_status;

COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
