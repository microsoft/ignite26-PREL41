# Exercise 3.3: Deploy and verify the app

In Exercise 3.2, you turned the console into a Rayfin project and previewed the deployment to your workspace.

In this exercise, you deploy the console as the **contoso_recall_console** Fabric App, open it from its hosted address, and load the data again with your own token.

## Task 1: Set sign-in defaults (optional)

The hosted app has a different address from the console you ran on the lab VM, so it doesn't have the IDs you saved in Exercise 3.1. You can build your workspace and lakehouse IDs into the app so that its sign-in page fills them in.

1. In the first Terminal tab, copy the example settings file:

    ```powershell
    Copy-Item .env.example .env.local
    notepad .env.local
    ```

1. Set these values, then save the file and close Notepad:

    - `VITE_FABRIC_WORKSPACE_ID`: your workspace ID
    - `VITE_LAKEHOUSE_ID`: your lakehouse ID

    Keep `VITE_TABLE_API_ENDPOINT` as `https://onelake.table.fabric.microsoft.com`. Leave `VITE_DOCUMENT_BASE_URL` empty unless the instructor supplies a document library URL.

    > [!IMPORTANT]
    > Vite builds these values into the app, where anyone who opens it can read them. Never add a token or secret to `.env.local`.

## Task 2: Deploy

1. Deploy to the same workspace and app name as your dry run. Replace `<workspace-id>` with your workspace ID:

    ```powershell
    npx --no-install rayfin up --workspace-id <workspace-id> --item-name contoso_recall_console
    ```

    The CLI builds the app and uploads the **dist** folder. If **contoso_recall_console** already exists, the CLI asks whether to reuse it: answer yes, rather than creating a second app.

1. Check the deployment status:

    ```powershell
    npx --no-install rayfin up status --json
    ```

1. Copy the `hostingUrl` value. `rayfin up` also printed it.

> [!Help] If the CLI or its configuration is missing, ask the instructor. Don't install a different toolchain.

## Task 3: Verify the hosted app

1. Open the hosting URL in the browser. Because the app uses protected hosting, Fabric asks you to sign in first. Sign in with your lab account.

    This sign-in only controls who can open the app. It isn't the identity OneLake uses to read data.

1. The console opens on its **Sign in with an access token** page. If **Workspace ID** and **Lakehouse ID** are empty, paste them as in Exercise 3.1.

1. In the second Terminal tab, request a fresh token and copy it to the clipboard:

    ```powershell
    az account get-access-token --resource https://storage.azure.com --query accessToken -o tsv | Set-Clipboard
    ```

1. Paste the token into **My account access token**, then select **Sign in**.

1. Select **Load data**. Check that the toolbar shows **6/6 tables loaded** with your name, as in Exercise 3.1.

1. Select **DevTools** at the bottom of the window, or press **Ctrl+`**.

1. Select **Network**. Check that each table has one `POST /read` request followed by its `GET /readStream/{id}` requests, sent from the browser straight to the Table API.

1. Select **Identity**. Check that it shows type **User** and your user name.

    OneLake read the data with the token you pasted, not with your Fabric sign-in.

> [!Help] If a request fails with a network or CORS error, note the browser and its version, and tell the instructor.

**Completion check:** The hosted Fabric App asks for Fabric sign-in, opens on the console's sign-in page, and loads all 6 tables with your own token. DevTools shows your identity on requests sent straight to the Table API.
