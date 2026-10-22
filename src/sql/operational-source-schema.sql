-- Author bootstrap for a new, empty Fabric SQL operational source.
IF @@TRANCOUNT > 0
    THROW 50200, 'Run operational bootstrap outside a caller-owned transaction.', 1;

IF EXISTS (SELECT 1 FROM sys.tables WHERE is_ms_shipped = 0)
    THROW 50201, 'Operational bootstrap requires a new, empty SQL database.', 1;

BEGIN TRY
BEGIN TRANSACTION;

CREATE TABLE dbo.suppliers (
    supplier_id varchar(32) NOT NULL PRIMARY KEY,
    supplier_name nvarchar(200) NULL,
    category nvarchar(100) NULL,
    country nvarchar(100) NULL
);

CREATE TABLE dbo.products (
    product_id varchar(32) NOT NULL PRIMARY KEY,
    product_name nvarchar(200) NULL,
    supplier_id varchar(32) NULL,
    category nvarchar(100) NULL,
    pack_size nvarchar(100) NULL,
    shelf_life_days int NULL,
    max_storage_c decimal(5, 2) NULL
);

CREATE TABLE dbo.locations (
    location_id varchar(32) NOT NULL PRIMARY KEY,
    location_name nvarchar(200) NULL,
    location_type varchar(16) NULL,
    city nvarchar(100) NULL,
    region varchar(32) NULL,
    opened_on date NULL
);

CREATE TABLE dbo.carriers (
    carrier_id varchar(32) NOT NULL PRIMARY KEY,
    carrier_name nvarchar(200) NULL,
    is_logistics_partner bit NULL
);

CREATE TABLE dbo.trucks (
    truck_id varchar(32) NOT NULL PRIMARY KEY,
    carrier_id varchar(32) NULL,
    home_dc_id varchar(32) NULL,
    reefer_model nvarchar(100) NULL
);

CREATE TABLE dbo.lots (
    lot_id varchar(32) NOT NULL PRIMARY KEY,
    product_id varchar(32) NULL,
    supplier_id varchar(32) NULL,
    production_line varchar(32) NULL,
    production_start_utc datetime2(6) NULL,
    production_end_utc datetime2(6) NULL,
    expires_on date NULL,
    units_produced int NULL,
    supplier_unit_cost_eur decimal(10, 2) NULL
);

CREATE TABLE dbo.store_inventory (
    location_id varchar(32) NOT NULL,
    lot_id varchar(32) NOT NULL,
    units_on_hand int NULL,
    last_counted_utc datetime2(6) NULL,
    PRIMARY KEY (location_id, lot_id)
);

-- Keep replication exercises separate from the fixed recall records.
EXEC(N'CREATE SCHEMA workshop AUTHORIZATION dbo');
CREATE TABLE workshop.mirroring_probe (
    probe_id varchar(32) NOT NULL PRIMARY KEY,
    probe_value int NOT NULL,
    changed_at_utc datetime2(6) NOT NULL
);

COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
