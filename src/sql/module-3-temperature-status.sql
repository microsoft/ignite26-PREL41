DECLARE @affected_lot varchar(20) = 'YG-2291';

IF @@TRANCOUNT <> 0
    THROW 50008, 'Run this batch outside an existing transaction so validation and analysis use their own snapshot.', 1;

BEGIN TRY
BEGIN TRANSACTION;

IF NOT EXISTS (SELECT 1 FROM dbo.truck_temperature_events)
    THROW 50001, 'No telemetry has arrived. Check the Eventstream destination before continuing.', 1;

IF EXISTS (
    SELECT 1
    FROM dbo.truck_temperature_events
    WHERE NULLIF(TRIM(event_id), '') IS NULL
       OR NULLIF(TRIM(shipment_id), '') IS NULL
       OR NULLIF(TRIM(truck_id), '') IS NULL
       OR event_time_utc IS NULL
       OR LEN(event_time_utc) NOT BETWEEN 20 AND 27
       OR SUBSTRING(event_time_utc, 11, 1) <> 'T'
       OR RIGHT(event_time_utc, 1) <> 'Z'
       OR TRY_CONVERT(datetime2(6), event_time_utc, 127) IS NULL
       OR temperature_c IS NULL
)
    THROW 50002, 'Invalid telemetry: IDs, UTC timestamp (at most six fractional digits), and numeric temperature are required.', 1;

IF EXISTS (
    SELECT event_id
    FROM (
        SELECT DISTINCT event_id, shipment_id, truck_id,
            event_time_utc, temperature_c
        FROM dbo.truck_temperature_events
    ) AS payloads
    GROUP BY event_id
    HAVING COUNT(*) > 1
)
    THROW 50003, 'Conflicting payloads share an event ID. Resolve the source error; do not choose an arbitrary retry.', 1;

IF EXISTS (
    SELECT truck_id,
        CONVERT(datetime2(6), event_time_utc, 127)
    FROM dbo.truck_temperature_events
    GROUP BY truck_id,
        CONVERT(datetime2(6), event_time_utc, 127)
    HAVING MIN(temperature_c) <> MAX(temperature_c)
)
    THROW 50004, 'Conflicting temperatures share a truck timestamp. Resolve the readings before calculating duration.', 1;

IF EXISTS (
    SELECT 1
    FROM dbo.truck_temperature_events AS event
    WHERE NOT EXISTS (
        SELECT 1
        FROM history.shipment_history AS shipment
        WHERE shipment.shipment_id = event.shipment_id
          AND shipment.truck_id = event.truck_id
          AND shipment.shipped_at_utc < shipment.delivered_at_utc
          AND CONVERT(datetime2(6), event.event_time_utc, 127)
              BETWEEN shipment.shipped_at_utc AND shipment.delivered_at_utc
    )
)
    THROW 50005, 'Telemetry does not match an accessible shipment, truck, and delivery interval. Check source data and permissions.', 1;

IF EXISTS (
    SELECT shipment_id, truck_id
    FROM (
        SELECT DISTINCT shipment.shipment_id, shipment.truck_id,
            shipment.carrier_id, shipment.store_id,
            shipment.shipped_at_utc, shipment.delivered_at_utc
        FROM history.shipment_history AS shipment
        INNER JOIN (
            SELECT DISTINCT shipment_id, truck_id
            FROM dbo.truck_temperature_events
        ) AS observed
            ON observed.shipment_id = shipment.shipment_id
           AND observed.truck_id = shipment.truck_id
    ) AS contexts
    GROUP BY shipment_id, truck_id
    HAVING COUNT(*) > 1
)
    THROW 50006, 'Shipment lines disagree about their journey context. Correct history before joining telemetry.', 1;

IF NOT EXISTS (
    SELECT 1 FROM history.shipment_history WHERE lot_id = @affected_lot
)
    THROW 50007, 'The affected lot has no accessible shipment history. Complete Module 2 and check permissions.', 1;

;WITH journeys AS (
    SELECT DISTINCT shipment_id, truck_id, carrier_id, store_id,
        shipped_at_utc, delivered_at_utc
    FROM history.shipment_history
    WHERE lot_id = @affected_lot
),
readings AS (
    SELECT DISTINCT event.shipment_id, event.truck_id,
        CONVERT(datetime2(6), event.event_time_utc, 127) AS observed_at,
        event.temperature_c
    FROM dbo.truck_temperature_events AS event
    INNER JOIN journeys AS journey
        ON journey.shipment_id = event.shipment_id
       AND journey.truck_id = event.truck_id
),
sequenced AS (
    SELECT *,
        LEAD(observed_at) OVER (
            PARTITION BY shipment_id, truck_id ORDER BY observed_at
        ) AS next_at
    FROM readings
),
intervals AS (
    SELECT *,
        CASE
            WHEN temperature_c > 4
             AND next_at > observed_at
             AND next_at <= DATEADD(minute, 5, observed_at)
            THEN DATEDIFF_BIG(microsecond, observed_at, next_at)
            ELSE CAST(0 AS bigint)
        END AS hot_microseconds,
        CASE WHEN next_at > DATEADD(minute, 5, observed_at)
             THEN 1 ELSE 0 END AS has_gap
    FROM sequenced
),
grouped AS (
    SELECT *,
        SUM(CASE WHEN hot_microseconds = 0 THEN 1 ELSE 0 END) OVER (
            PARTITION BY shipment_id, truck_id ORDER BY observed_at
            ROWS UNBOUNDED PRECEDING
        ) AS run_id
    FROM intervals
),
runs AS (
    SELECT shipment_id, truck_id, run_id,
        SUM(hot_microseconds) AS hot_microseconds
    FROM grouped
    GROUP BY shipment_id, truck_id, run_id
),
longest AS (
    SELECT shipment_id, truck_id,
        MAX(hot_microseconds) AS longest_hot_microseconds
    FROM runs
    GROUP BY shipment_id, truck_id
),
coverage AS (
    SELECT shipment_id, truck_id,
        COUNT(*) AS distinct_readings,
        MIN(observed_at) AS first_observation_utc,
        MAX(observed_at) AS last_observation_utc,
        MAX(has_gap) AS has_gap
    FROM intervals
    GROUP BY shipment_id, truck_id
)
SELECT @affected_lot AS lot_id,
    CAST(SYSUTCDATETIME() AS datetime2(6)) AS analysis_time_utc,
    journey.shipment_id, journey.truck_id,
    journey.carrier_id, journey.store_id,
    journey.shipped_at_utc, journey.delivered_at_utc,
    COALESCE(coverage.distinct_readings, 0) AS distinct_readings,
    coverage.first_observation_utc, coverage.last_observation_utc,
    CAST(longest.longest_hot_microseconds / 1000000.0 AS decimal(16, 6))
        AS longest_hot_seconds,
    CASE
        WHEN longest.longest_hot_microseconds > 1200000000 THEN 'breach'
        WHEN coverage.distinct_readings IS NULL
          OR coverage.distinct_readings < 2 OR coverage.has_gap = 1
            THEN 'insufficient_data'
        ELSE 'no_observed_breach'
    END AS observed_window_status,
    CASE
        WHEN longest.longest_hot_microseconds > 1200000000 THEN 'breach'
        WHEN coverage.distinct_readings >= 2
         AND coverage.has_gap = 0
         AND coverage.first_observation_utc <= journey.shipped_at_utc
         AND coverage.last_observation_utc >= journey.delivered_at_utc
            THEN 'no_breach'
        ELSE 'insufficient_data'
    END AS shipment_temperature_status
FROM journeys AS journey
LEFT JOIN coverage
    ON coverage.shipment_id = journey.shipment_id
   AND coverage.truck_id = journey.truck_id
LEFT JOIN longest
    ON longest.shipment_id = journey.shipment_id
   AND longest.truck_id = journey.truck_id
ORDER BY journey.shipment_id, journey.truck_id;

COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
