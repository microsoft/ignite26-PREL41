# Workshop data

The files under [`sharepoint/`](sharepoint/) are synthetic Contoso Fresh
documents for the SharePoint-backed workshop exercises.

## Upload the Supplier Quality content

Upload the contents of `data/sharepoint/` to the SharePoint library or folder
named `supplierQuality`, with one exception: upload only
`metadata/supplier-certificates.csv` from the metadata folder. Keep the JSON
alternative in the repository, not alongside the CSV in the transformation's
source folder. Preserve this folder structure:

```text
supplierQuality/
  certificates/
  metadata/
  notices/
  procedures/
```

Exercise 1.2 creates a OneLake shortcut to this content. Exercise 1.3 transforms
the CSV in `metadata/` into `dbo.supplier_certificates`, a managed Delta table
with four rows. Its `document_path` values remain relative to the
`SupplierQuality` document shortcut. The transformation materializes and
synchronizes data; only the untransformed document shortcut is zero-copy.

All company names, certification records, audit results, and recall details in
this dataset are fictional and intended only for the workshop.

## Current-state reference data

The CSV files under [`reference/`](reference/) are the Contoso Fresh
current-state tables: suppliers, products, locations, carriers, trucks, lots,
and store inventory. All records are synthetic. The first code cell of the
[Module 2 notebook](../src/notebooks/module-2-shipment-history.ipynb) generates
them, and [the data model](../docs/authoring/contoso-fresh-data-model.md)
describes each table.

## Telemetry boundary fixtures

[The telemetry contract](telemetry/README.md) provides 35 replay events for six
real shipment/truck pairs in the synthetic history. Its 34 distinct event IDs
cover strict threshold boundaries, cooling between hot intervals, missing
observations, out-of-order arrival, and retries.

These are partial-journey validation windows, not a complete fleet history.
Do not declare an unobserved part of a delivery temperature-compliant.
