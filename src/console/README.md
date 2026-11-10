# Recall Console

Contoso Fresh recall dashboard built with Vite, React, TypeScript, Tailwind,
and DuckDB-Wasm. It reads OneLake tables through the
[OneLake table read API (preview)](https://learn.microsoft.com/fabric/onelake/table-apis/read-table-data-rest-api),
imports the returned Apache Arrow streams into an in-browser DuckDB database,
and shows the recall evidence for a lot.

This is the Module 3 starter. The completed Rayfin version is in
[`../console-final`](../console-final/README.md).

## Why bearer tokens

The app does not sign anyone in through Microsoft Entra. You paste an
**access token** from Azure CLI, and each token represents exactly one
identity. OneLake applies that identity's permissions, row-level security,
and column-level security to every read. That lets you compare identities in
the same app:

| Identity | Module | How you get the token |
|---|---|---|
| **My account** | 3 | Your lab user, from `az login` |
| **Service principal** | 4 | An app registration you create and add to the **RecallSupplierReader** role in Exercise 4.3 |

The header switch moves between identities. Each identity has its **own**
local database, tables, request log, and download budget, so data from one
identity is never shown to another. Switching does not discard loaded data,
which allows side-by-side comparisons.

## Run locally

Use Node.js 22.12+ (validated with 24.22.2) and npm.

```bash
cd src/console
npm ci
npm run dev
```

Open the loopback address printed by Vite, normally `http://127.0.0.1:5173`.

### Get a token for your account

```bash
az login
az account get-access-token --resource https://storage.azure.com \
  --query accessToken -o tsv
```

The token must use the Azure Storage audience (`https://storage.azure.com`).
Tokens usually last 60–90 minutes. When one expires, the identity shows
**expired**; generate a new token and choose **Identities** > **Replace
token**. Replacing a token for the same principal keeps its loaded data.

### Sign in

1. Enter the Table API endpoint, workspace ID, and lakehouse ID.
2. Paste the token in **My account access token**. The form decodes the
   token's display claims locally (name, type, audience, expiry). It warns
   about the wrong audience or an expired token. The signature is not
   validated in the browser; OneLake is the authority.
3. Optionally select **Add a service principal token**. You can also add it
   later from **Identities**.
4. Select **Sign in**, then **Load data**.

Workspace and lakehouse IDs are saved as you edit them in browser local
storage, overriding the optional environment defaults on subsequent visits.
They remain after signing out or closing the browser. Edit the fields to
change them, or clear the site's browser storage to remove them. This applies
only to the same browser profile and origin (scheme, host, and port).
If browser storage is unavailable, the form warns you and sign-in still works.

The browser calls the Table API directly. The service allows cross-origin
requests, so no proxy is needed in development or when hosted.

### Token handling

Tokens live only in this tab's memory. They are never written to browser
storage, URLs, the request log, DevTools, or error messages, and they are sent
only in the `Authorization` header of Table API requests. **Sign out**
discards every identity and its local data. Treat tokens like passwords: do
not paste them into source files, `.env` files, chats, or screenshots.

## Dashboard

The console reads five tables from the `dbo` schema: `lots`, `products`,
`locations`, `store_inventory`, and
`supplier_certificates`.

- **Lot**: product, supplier ID, production line and window, and expiry. The
  product name appears only when the identity can read `dbo.products`.
- **Current inventory**: stores with positive stock now.
- **Lots by supplier**: every `dbo.lots` row returned to the active identity,
  grouped by supplier. Row-level security shows up here as missing suppliers.
- **Table access**: each table's result for the active identity: readable
  with its row count, or blocked with the HTTP status OneLake returned.
- **Supplier certificates**: optional links under an HTTPS document library
  URL (gear icon). Paths with traversal, queries, or credentials are rejected.
- **Related lots**: select **Load history** to read `history.lot_history`
  and `history.shipment_history`, with only the columns the analysis needs.
  The card lists lots from the same supplier and production line that
  started between Sunday 22:00 and Monday 02:00 Paris time in the 90 days
  before the recall, then counts the stores that received them by region.
  This is the Exercise 2.4 analysis. Paris time uses the EU daylight saving
  rule because DuckDB's time zone extension isn't loaded. The history tables
  aren't part of **Load data** or the table count.

Each section loads independently. A table that is denied to the active
identity marks only the sections that need it as unavailable.

## DevTools

DevTools is a full-width panel docked at the bottom. It is collapsed by
default; select it or press `Ctrl` + `` ` `` to toggle it, then drag or use
arrow keys on its top edge to resize it. When collapsed, it shows the active
identity, request count, last status, and loaded tables.

| Tab | Purpose |
|---|---|
| **Tables** | Schema tree with load state, stream progress, bytes, batches, and rows; load or reload one table, add a table, and preview local rows. |
| **SQL** | Run one `SELECT`/`WITH` query over loaded tables (`Ctrl+Enter`). It is local only and makes no OneLake request. |
| **Network** | Every `/read` allocation and `/readStream` download with method, table, status, time, bytes, batches, and rows. |
| **Identity** | Decoded claims of the active token: type, UPN/app ID, object ID, tenant, audience, and expiry. The token itself is never shown. |

Stream IDs, tokens, response bodies, and row data are never recorded in the
Network log.

## Configuration

Optional build-time defaults prefill the sign-in form. Copy `.env.example`
to `.env.local`:

| Variable | Purpose |
|---|---|
| `VITE_TABLE_API_ENDPOINT` | Table API base URL; defaults to `https://onelake.table.fabric.microsoft.com` |
| `VITE_FABRIC_WORKSPACE_ID` | Workspace ID |
| `VITE_LAKEHOUSE_ID` | Lakehouse ID |
| `VITE_DOCUMENT_BASE_URL` | Optional HTTPS root for `Files/SupplierQuality/` documents |

These values are public and are embedded in the built JavaScript. **Never put
a token or secret in a `VITE_*` variable.**

## Data path

`src/transport.ts` defines the adapter boundary used by both this app and the
Rayfin version:

```ts
interface TableTransport {
  allocate(resource: Resource, options: ReadOptions, signal: AbortSignal):
    Promise<Allocation>;
  openStream(resource: Resource, streamId: string, signal: AbortSignal):
    Promise<ReadableStream<Uint8Array>>;
}
```

`DirectTransport` sends `POST {base}/v1.0/workspaces/{ws}/items/{item}/schemas/{schema}/tables/{table}/read`
with the active identity's bearer token. It then sends `GET .../readStream/{id}`
for **every** returned stream. Allocation parsing is strict: it accepts exactly
one list named `streams`, `streamIds`, `streamIDs`, or `value`; malformed or
duplicate IDs fail. Redirects, cookies, and referrers are disabled.

`src/importer.ts` decodes each Arrow IPC stream incrementally and appends
record batches to a staging table. A table is published atomically only when
every stream completes. Failed or cancelled reads leave no partial data. A
shared download budget of 128 MiB per identity applies; select **Clear local
data** to reset it. DuckDB-Wasm keeps imported data in memory, so this is a
modest-dataset app, not an unlimited data engine.

The local database disables external file/network access and extension
loading, then locks its configuration before accepting any query.

## Validate

```bash
npm run typecheck
npm test
npm run build
```

Unit tests cover token inspection (claims, audience, expiry, and slot
mismatch), allocation parsing, chunked multistream Arrow import, empty
results, schema mismatch, truncation, mid-body failures, cancellation,
retry, budgets, redaction, and document URL rules.

Browser tests use **synthetic** tokens and a mocked endpoint only:

```bash
PLAYWRIGHT_BROWSERS_PATH="$PWD/node_modules/.cache/ms-playwright" npx --no-install playwright install chromium
npm run test:browser
```

They cover sign-in as the first screen, token warnings, isolated user/SPN
data with different service responses (the synthetic service principal reads
only one supplier's lots and is denied every other table), the identity
switch and keyboard navigation, DevTools collapse/dock/resize/tabs, local SQL
safety, denied tables, 401 expiry, and mobile layout. Chromium needs the usual Linux shared
libraries; on a minimal container, extract them locally and set
`LD_LIBRARY_PATH` rather than installing packages system-wide.

## Build and hosting

```bash
npm run build
npm run preview
```

Serve `dist/` with its DuckDB worker and WASM assets from the same root. The
hosted app calls the Table API directly from the browser, exactly as in
development. [`../console-final`](../console-final/README.md) packages the same
app for Fabric App hosting.

## Validation boundaries

No Fabric resources were created, modified, or read during local validation.
Real tokens, OneLake permissions, service CORS, and document access are not
covered by these tests and must be checked in the lab environment.
