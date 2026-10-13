# Workshop data

The files under [`sharepoint/`](sharepoint/) are synthetic Contoso Fresh
documents for the SharePoint-backed workshop exercises.

## Upload the Supplier Quality content

Upload the contents of `data/sharepoint/` to the SharePoint library or folder
named `supplierQuality`. Preserve this folder structure:

```text
supplierQuality/
  certificates/
  metadata/
  notices/
  procedures/
```

Exercise 1.2 creates a OneLake shortcut to this content. Exercise 1.3 uses the
CSV or JSON file in `metadata/` to create a queryable supplier certificate
table.

All company names, certification records, audit results, and recall details in
this dataset are fictional and intended only for the workshop.
