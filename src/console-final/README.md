# Recall Console (completed Rayfin app)

The completed Module 3 app: the [Module 3 starter](../console/README.md)
packaged as a **Fabric App** with Rayfin static hosting. Start Module 3 from
the starter; use this folder as the reference solution.

The app code is the same as the starter. This folder adds only:

| File | Purpose |
|---|---|
| [`rayfin/rayfin.yml`](rayfin/rayfin.yml) | Static hosting of `dist/` as a Fabric App, with `assetAccess: protected` |
| `@microsoft/rayfin-cli` (dev dependency) | Pinned `1.37.0-alpha.2159` CLI used to initialize and deploy |

## How the app reads data

Every OneLake read goes **directly from the browser to the Table API** with a
**bearer token you paste into the sign-in page**. OneLake applies that token's
identity, OneLake security roles, and row-level and column-level security.
There is no proxy, no Rayfin function, and no app identity.

You can sign in with two identities and switch between them in the header:

| Identity | Module | Token from |
|---|---|---|
| **My account** | 3 | `az login` as your lab user |
| **Service principal** | 4 | An app registration in the **RecallSupplierReader** role from Exercise 4.3 |

Each identity has its own in-memory DuckDB database, tables, Network log, and
download budget. Switching never mixes data between identities.

```bash
az account get-access-token --resource https://storage.azure.com \
  --query accessToken -o tsv
```

Tokens stay in the tab's memory and are never stored, logged, or put in a
`VITE_*` variable. See the [starter README](../console/README.md#token-handling).

## What Rayfin hosting adds

`rayfin.yml` enables only static hosting. Auth, data, storage, and functions
are disabled. With `assetAccess: protected`, only users who can view the Fabric
App item can load the app, so visitors sign in to Fabric before the page
opens. That sign-in controls **who can open the app**; it is not used to read
OneLake. The data identity is always the pasted bearer token.

## Run locally

Requirements: Node.js 22.12+ and npm.

```bash
npm ci
cp .env.example .env.local   # optional sign-in defaults
npm run dev
```

`.env.local` holds optional public defaults for the sign-in form:
`VITE_TABLE_API_ENDPOINT`, `VITE_FABRIC_WORKSPACE_ID`, `VITE_LAKEHOUSE_ID`,
and `VITE_DOCUMENT_BASE_URL`. They are embedded in the browser bundle, so
never add tokens or secrets.

Workspace and lakehouse IDs are saved as you edit them in browser local
storage and take precedence over these defaults on later visits. They survive
sign-out and browser restarts in the same browser profile and origin. Edit
the fields or clear the site's browser storage to remove the saved IDs.
Tokens are never saved. If browser storage is unavailable, the form warns
you and sign-in still works.

## Build and checks

```bash
npm test
npm run build
npm run test:browser
```

The tests are the starter's: token inspection, Arrow import, sign-in,
identity isolation and switching, DevTools, denied tables, 401 expiry, and
mobile layout. They use synthetic tokens and a mocked endpoint, so they don't
prove Fabric hosting or real OneLake permissions. Install the browser runtime
into this folder if it is missing:

```bash
PLAYWRIGHT_BROWSERS_PATH="$PWD/node_modules/.cache/ms-playwright" npx --no-install playwright install chromium
```

The build output is about 76 MiB uncompressed, mostly the two DuckDB-Wasm
engines. It compresses well below Rayfin's 100 MB deployment limit.

## Initialize Rayfin in your own copy

This folder is already initialized. To turn the starter into this app, add the
pinned CLI and run `rayfin init` in the starter's folder:

```bash
npm install --save-dev --save-exact @microsoft/rayfin-cli@1.37.0-alpha.2159
npx --no-install rayfin init
```

When asked which services to enable, clear every option: the app only needs
static hosting. Check that the generated `rayfin/rayfin.yml` matches this
folder's file.

`rayfin init` also adds things this app doesn't use. To match this folder,
remove them:

```bash
npm uninstall @microsoft/rayfin-client @microsoft/rayfin-core @microsoft/rayfin-data
npm install --save-dev --save-exact @microsoft/rayfin-cli@1.37.0-alpha.2159
npm pkg set scripts.dev="vite --host 127.0.0.1"
npm pkg delete scripts.dev:frontend
rm -rf AGENTS.md .agents .mcp.json rayfin/.lockfile.json rayfin/tsconfig.json
```

- The Rayfin client packages are for apps that call Rayfin services.
- `init` installs the latest CLI release; reinstalling keeps it pinned.
- `init` points `npm run dev` at `rayfin dev`, which starts a Rayfin backend.
  This app only needs Vite.
- The agent files and `rayfin/tsconfig.json` support AI assistants, data
  entities, and functions, which this app doesn't use.

## Deploy to Fabric (lab steps)

These steps are performed by learners in the lab; the repository build did
not run them against Fabric. Use only your supplied workspace and app item.

Preview, deploy, and check status from this folder:

```bash
npx --no-install rayfin up --dry-run
npx --no-install rayfin up
npx --no-install rayfin up status --json
```

Review the dry-run target first. Open the hosted URL, sign in to Fabric when
asked, then sign in to the console with your bearer token and verify each
dashboard section, the Network log, and the Identity tab.

## Preview CLI caveat

The pinned prerelease Rayfin CLI brings transitive npm advisories. It is a
development tool only; none of it ships in the browser bundle. Review
`npm audit` and update when fixed releases are available.
