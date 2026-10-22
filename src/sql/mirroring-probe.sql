-- Run only against the supplied transactional SQL database, not its mirror.
-- Change the action for one step at a time; inspect is the safe default.
DECLARE @action varchar(8) = 'inspect';

IF @@TRANCOUNT > 0
    THROW 50210, 'Run the mirroring exercise outside a caller-owned transaction.', 1;

IF @action IS NULL OR @action NOT IN ('inspect', 'insert', 'update', 'delete')
    THROW 50211, 'Choose inspect, insert, update, or delete for the mirroring exercise.', 1;

BEGIN TRY
BEGIN TRANSACTION;

IF @action = 'insert'
BEGIN
    IF EXISTS (
        SELECT 1 FROM workshop.mirroring_probe
        WHERE probe_id = 'PREL41-mirroring'
    )
        THROW 50212, 'The probe already exists. Inspect and resume instead of inserting twice.', 1;
    INSERT INTO workshop.mirroring_probe (probe_id, probe_value, changed_at_utc)
    VALUES ('PREL41-mirroring', 1, SYSUTCDATETIME());
END;

IF @action = 'update'
BEGIN
    UPDATE workshop.mirroring_probe
    SET probe_value = 2, changed_at_utc = SYSUTCDATETIME()
    WHERE probe_id = 'PREL41-mirroring' AND probe_value = 1;
    IF @@ROWCOUNT <> 1
        THROW 50213, 'Update requires exactly one value-1 probe. Inspect the source before resuming.', 1;
END;

IF @action = 'delete'
BEGIN
    DELETE FROM workshop.mirroring_probe
    WHERE probe_id = 'PREL41-mirroring' AND probe_value = 2;
    IF @@ROWCOUNT <> 1
        THROW 50214, 'Delete requires exactly one value-2 probe. Inspect the source before resuming.', 1;
END;

SELECT @action AS action,
    COUNT_BIG(*) AS probe_rows,
    MAX(probe_value) AS probe_value,
    MAX(changed_at_utc) AS changed_at_utc
FROM workshop.mirroring_probe
WHERE probe_id = 'PREL41-mirroring';

COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
