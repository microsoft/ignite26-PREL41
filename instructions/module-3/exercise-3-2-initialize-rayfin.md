# Exercise 3.2: Initialize Rayfin and the Fabric App

In Exercise 3.1, the console ran on the lab VM, where only you can use it. To share it with colleagues, you host it as a Fabric App in your workspace. Fabric Apps are built on Rayfin.

In this exercise, you add the Rayfin CLI to the console, turn the console into a Rayfin project, and preview the deployment to your workspace. You deploy it in Exercise 3.3.

> [!Knowledge] The console needs only static hosting: Rayfin serves the built app as a Fabric App, and the app code doesn't change. Only users with permission on the app item can open it, after they sign in to Fabric. The browser still calls the Table API directly, and OneLake still sees the bearer token you paste, never your Fabric sign-in. The console doesn't use Rayfin auth, data, storage, or functions.

## Check your starting point

In Exercise 3.1, **Load data** loaded all 6 tables. You need the workspace ID you found there. If you don't have it, open the lakehouse again and copy it from the address, as in Exercise 3.1.

## Task 1: Add the Rayfin CLI

1. In the first Terminal tab, where the console is running, press **Ctrl+C** to stop it. If asked **Terminate batch job (Y/N)?**, enter `Y`.

    Stay in the **Downloads\console** folder for the rest of this module.

1. Install the Rayfin CLI as a development dependency, pinned to the release this workshop uses:

    ```powershell
    npm install --save-dev --save-exact @microsoft/rayfin-cli@1.37.0-alpha.2159
    ```

## Task 2: Initialize the project

`rayfin init` asks a series of questions in the terminal. Use the arrow keys to move between options, **Space** to select or clear a checkbox, and **Enter** to confirm each answer.

1. Run the Rayfin CLI's `init` command:

    ```powershell
    npx --no-install rayfin init
    ```

1. For **How would you like to start?**, select **Start from scratch (configure manually)**, then press **Enter**.

    The other options create a new app from a template. The console already exists, so you only add a Rayfin configuration to it. Rayfin shows its banner and **Initialize a new Rayfin project**, then asks the next question.

1. For **What is your project name?**, enter `contoso-recall-console`.

    Rayfin uses the name as the project ID in `rayfin.yml`.

1. For **Which services would you like to enable?**, **Auth** and **Data** are selected by default. Move to each of them and press **Space** to clear it, so that no service is selected. Then press **Enter**.

    The console doesn't use Rayfin auth, data, storage, or functions. It reads OneLake with the token you paste.

1. Rayfin shows **Frontend build script detected in package.json**. For **Enable static hosting? (builds and deploys ./dist on rayfin up)**, enter `Y`, then press **Enter**.

    Static hosting is the only Rayfin feature the console uses: Rayfin serves the built app from the **dist** folder.

1. For **.gitignore already exists. Do you want to overwrite it?**, enter `N`, then press **Enter**.

    This keeps the console's own `.gitignore`.

1. Wait while `init` installs the Rayfin packages. Check that the output shows **Rayfin project initialized successfully!**, with **Project ID: contoso-recall-console** and nothing after **Enabled services**.

    The output also says that `"dev"` now runs `"rayfin dev"`. Task 3 explains what that changes.

    > [!Note] If you gave a wrong answer, run `npx --no-install rayfin init` again and answer the questions again. When asked **rayfin.yml already exists. Do you want to overwrite it?**, enter `Y`. Enter `N` for any other existing file.

1. Open the Rayfin configuration file:

    ```powershell
    notepad rayfin\rayfin.yml
    ```

1. Check that auth and data are `enabled: false`, and that `staticHosting` is `enabled: true` and uses `folder: dist`, `buildCommand: npm run build`, and `assetAccess: protected`. Then close Notepad.

## Task 3: Build the app

`rayfin init` also added a few things for apps that use Rayfin services. The console doesn't use them yet, but they don't change how it builds or deploys, so you can keep them for later:

- The Rayfin client packages `@microsoft/rayfin-client`, `@microsoft/rayfin-core`, and `@microsoft/rayfin-data`, for apps that call Rayfin services from their code.
- Helper files for AI coding assistants, such as `AGENTS.md`, the **.agents** folder, and `.mcp.json`.
- `rayfin\tsconfig.json`, for Rayfin data entities and functions.
- A new `dev` script. `npm run dev` now runs `rayfin dev`, which signs in to Fabric and connects to a Rayfin backend before it starts the console. The original command is now `dev:frontend`.

1. Build the app:

    ```powershell
    npm run build
    ```

1. Check that the build finishes without errors and writes the **dist** folder. Vite may warn that some chunks are larger than 500 kB; you can ignore that warning.

> [!Note] To run the console on the lab VM the way you did in Exercise 3.1, use `npm run dev:frontend` instead of `npm run dev`.

## Task 4: Connect to your workspace

1. Sign in to Fabric with the Rayfin CLI:

    ```powershell
    npx --no-install rayfin login
    ```

    Sign in with the same lab account you used in Exercise 3.1. If sign-in fails with a keychain error, run the command again with `--encryption-fallback-enabled`.

1. Preview the deployment. Replace `<workspace-id>` with your workspace ID. Without `--workspace-id`, the CLI targets **My workspace** instead of your lab workspace.

    ```powershell
    npx --no-install rayfin up --dry-run --workspace-id <workspace-id> --item-name contoso_recall_console
    ```

    The dry run checks your project and finds the workspace without creating or changing anything.

1. Check that the output shows your workspace, the app name **contoso_recall_console**, and static hosting as the only service.

> [!Note] If you keep the console in source control, commit `rayfin\rayfin.yml`. Leave out files that the CLI generates for your environment under **rayfin**, such as `rayfin\.env`.

**Completion check:** The console has the pinned Rayfin CLI and a `rayfin\rayfin.yml` with static hosting only, it still builds, and the dry run targets your workspace. Nothing is deployed yet.
