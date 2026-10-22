DECLARE @as_of_utc datetime2(6) = '2026-10-13T04:00:00';

;WITH recent_production AS (
    SELECT lot_id,
        -- The fixed 90-day workshop window is entirely within Paris summer time.
        DATEADD(hour, 2, production_start_utc) AS paris_start
    FROM history.lot_history
    WHERE supplier_id = 'SUP-014'
      AND production_line = 'AVD-L2'
      AND production_start_utc >= DATEADD(day, -90, @as_of_utc)
      AND production_start_utc <= @as_of_utc
),
related_lots AS (
    SELECT lot_id
    FROM recent_production
    WHERE (
        DATEDIFF(day, CONVERT(date, '19000107'), CONVERT(date, paris_start)) % 7 = 0
        AND CONVERT(time, paris_start) >= CONVERT(time, '22:00:00')
    ) OR (
        DATEDIFF(day, CONVERT(date, '19000107'), CONVERT(date, paris_start)) % 7 = 1
        AND CONVERT(time, paris_start) < CONVERT(time, '02:00:00')
    )
),
reached_stores AS (
    SELECT DISTINCT shipment.store_id
    FROM history.shipment_history AS shipment
    INNER JOIN related_lots AS lot ON lot.lot_id = shipment.lot_id
),
duplicate_keys AS (
    SELECT shipment_id, line_no
    FROM history.shipment_history
    GROUP BY shipment_id, line_no
    HAVING COUNT(*) > 1
)
SELECT
    (SELECT COUNT(*) FROM dbo.store_inventory AS inventory
        INNER JOIN dbo.locations AS location
            ON location.location_id = inventory.location_id
        WHERE inventory.lot_id = 'YG-2291'
          AND inventory.units_on_hand > 0
          AND location.location_type = 'store') AS current_stores,
    (SELECT COUNT(DISTINCT store_id) FROM history.shipment_history
        WHERE lot_id = 'YG-2291') AS receiving_stores,
    (SELECT COUNT(*) FROM related_lots) AS related_lots,
    (SELECT COUNT(*) FROM reached_stores) AS reached_stores,
    (SELECT COUNT(DISTINCT location.region) FROM reached_stores AS reached
        INNER JOIN dbo.locations AS location
            ON location.location_id = reached.store_id) AS reached_regions,
    (SELECT COUNT(*) FROM history.lot_history) AS lot_history_rows,
    (SELECT COUNT(*) FROM history.shipment_history) AS shipment_history_rows,
    (SELECT COUNT(*) FROM duplicate_keys) AS duplicate_shipment_keys,
    (SELECT COUNT(*) FROM history.shipment_history
        WHERE shipment_id IN ('SHP-208999', 'SHP-209240')) AS removed_duplicate_lines;
