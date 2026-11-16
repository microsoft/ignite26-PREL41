# Exercise 3.2: Initialize Rayfin and the Fabric App

In Exercise 3.1, the console ran on the lab VM, where only you can use it. To share it with colleagues, you host it as a Fabric App in your workspace. Fabric Apps are built on Rayfin.

The console folder is also a Rayfin template. In this exercise, you create a Rayfin project from it with the Rayfin CLI, build it, and preview the deployment to your workspace. You deploy it in Exercise 3.3.

> [!Knowledge] Rayfin serves the built console as a Fabric App, and the app code doesn't change. The project enables Fabric sign-in and protected static hosting, so only users with permission on the app item can open it, after they sign in to Fabric. The browser still calls the Table API directly, and OneLake still sees the bearer token you paste, never your Fabric sign-in. The console's code doesn't call Rayfin auth, data, storage, or functions.

## Check your starting point

In Exercise 3.1, **Load data** loaded all 5 tables. You need the workspace ID you found there. If you don't have it, open the lakehouse again and copy it from the address, as in Exercise 3.1.

## Task 1: Create the project from the template

The console folder has two Rayfin files: `rayfin-template.yml` describes the folder as a template, and `rayfin\rayfin.yml` holds the Fabric App configuration. The `npm ci` command you ran in Exercise 3.1 also installed the Rayfin CLI, pinned to the release this workshop uses.

1. In the first Terminal tab, where the console is running, press **Ctrl+C** to stop it. If asked **Terminate batch job (Y/N)?**, enter `Y`.

1. From the **Downloads\console** folder, create the project:

    ```powershell
    npx --no-install rayfin init ..\contoso-recall-console --template .
    ```

    `--template .` uses the current folder as the template. The CLI copies the console into a new **Downloads\contoso-recall-console** folder, names the project `contoso-recall-console`, installs its packages, and adds the Rayfin files. It doesn't ask any questions.

1. Check that the output ends with **Project created successfully!**.

    The output suggests `npx rayfin dev` as the next step. Don't run it: it signs in to Fabric and connects to a Rayfin backend, which the console doesn't use.

1. Go to the new project folder:

    ```powershell
    cd ..\contoso-recall-console
    ```

    Stay in the **Downloads\contoso-recall-console** folder for the rest of this module.

1. Open the Rayfin configuration file:

    ```powershell
    notepad rayfin\rayfin.yml
    ```

1. Check that the project `id` is `contoso-recall-console`, that auth is `enabled: true` with `fabric` `enabled: true`, and that data is `enabled: false`. Check that `staticHosting` is `enabled: true` and uses `folder: dist`, `buildCommand: npm run build`, and `assetAccess: protected`. Then close Notepad.

## Task 2: Build the app

Apart from `rayfin\rayfin.yml`, the project has the same files as the console, plus helper files for AI coding assistants: `AGENTS.md`, the **.agents** folder, and `.mcp.json`. The CLI also added Rayfin's generated files to `.gitignore`. The app code and npm scripts are unchanged.

1. Build the app:

    ```powershell
    npm run build
    ```

1. Check that the build finishes without errors and writes the **dist** folder. Vite may warn that some chunks are larger than 500 kB; you can ignore that warning.

> [!Note] To run the console on the lab VM the way you did in Exercise 3.1, run `npm run dev` from this folder. It opens at the same address, so the sign-in page still has your workspace and lakehouse IDs.

## Task 3: Connect to your workspace

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

1. Check that the output shows your workspace, the app name **contoso_recall_console**, and static hosting.

> [!Note] If you keep the project in source control, commit `rayfin\rayfin.yml`. Leave out files that the CLI generates for your environment under **rayfin**, such as `rayfin\.env`. The project's `.gitignore` already excludes them.

**Completion check:** The **contoso-recall-console** project, created from the console template, has the pinned Rayfin CLI and a `rayfin\rayfin.yml` with Fabric sign-in and protected static hosting. It builds, and the dry run targets your workspace. Nothing is deployed yet.
