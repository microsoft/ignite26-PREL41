# Exercise 4.4: Revisit the console as a service principal

In Exercise 4.3, you watched OneLake security restrict a reader's SQL queries. Apps and automated jobs usually don't read data as a person. They use a service principal: an identity for an application in Microsoft Entra ID.

In Exercise 3.1, you saw that the token you paste in the console tells OneLake who is reading. The console sends the same requests for every identity and does no filtering of its own. Any difference in the data comes from OneLake security.

In this exercise, you create a service principal and add it directly to the **RecallSupplierReader** role in OneLake security. You then sign in to the console as the service principal, next to your own account, and compare what OneLake returns to each identity. You don't write any SQL: the console shows the result of each check.

## Check your starting point

In Exercise 4.2, you configured the **RecallSupplierReader** role to limit **dbo.lots** to supplier **SUP-014** and hide **supplier_unit_cost_eur**. Check that the role still includes only **dbo.lots** with those restrictions, and keep your lab account as a member. You add the service principal as another member in Task 2.

You also need the console you deployed in Exercise 3.3, with **My account** signed in and **5/5 tables loaded** in the toolbar.

> [!Help]
> If **My account** shows **expired** in the console's header, request a new token in the second Terminal tab and copy it to the clipboard:
>
> ```powershell
> az account get-access-token --resource https://storage.azure.com --query accessToken -o tsv | Set-Clipboard
> ```
>
> If Azure CLI asks you to sign in again, run `az login --allow-no-subscriptions`, sign in with your lab account, and run the command again.
>
> In the console, select **Identities**. In the **My account** section, paste the token into **My account access token**, then select **Replace token**.

## Task 1: Create the service principal

You create an app registration, its service principal, and a client secret with Azure CLI. The service principal uses the secret to sign in in Task 3.

1. In Terminal, select the second tab, where you signed in to Azure CLI with your lab account in Exercise 3.1.

    If you closed it, select **+** in the tab bar to open a new tab, run `az login --allow-no-subscriptions`, and sign in with your lab account again.

    Keep this tab open until the end of the exercise. The variables you create in this task exist only in this tab.

1. Create an app registration and its service principal. The name includes your lab instance ID, so it's unique:

    ```powershell
    $appId = az ad app create --display-name "recall-supplier-reader-@lab.LabInstance.Id" --query appId -o tsv
    $spId = az ad sp create --id $appId --query id -o tsv
    $tenantId = az account show --query tenantId -o tsv
    ```

1. Check that each variable holds an ID:

    ```powershell
    $appId; $spId; $tenantId
    ```

    The command prints three IDs, each 36 characters long. `$appId` is the application (client) ID that identifies the app. `$spId` is the service principal's object ID: the identity you add to the OneLake security role.

1. Create a client secret that expires in two hours:

    ```powershell
    $expires = (Get-Date).ToUniversalTime().AddHours(2).ToString('yyyy-MM-ddTHH:mm:ssZ')
    $secret = az ad app credential reset --id $appId --display-name recall-lab --end-date $expires --query password -o tsv
    ```

    The secret stays in the `$secret` variable and isn't printed. Azure CLI prints a warning that reminds you to protect the credential.

    > [!IMPORTANT]
    > The secret works like a password for the service principal. Don't print it, paste it, or save it in a file.

## Task 2: Add the service principal directly to OneLake security

Add the service principal directly to **RecallSupplierReader** in the lakehouse's OneLake security pane. It receives the role's table, row, and column permissions without joining a security group.

1. In Terminal, copy the service principal's object ID to the clipboard:

    ```powershell
    $spId | Set-Clipboard
    ```

1. In Fabric, open the **SupplierQuality** lakehouse in your **ContosoFresh_@lab.LabInstance.Id** workspace, then select **Manage OneLake security** from the lakehouse's item menu.

1. Open **RecallSupplierReader**, select **Members in role**, then select **Add members**.

1. In **Add members to your role**, paste the service principal's object ID. Select the matching **recall-supplier-reader-@lab.LabInstance.Id** identity from the suggestions, then select the check icon to confirm.

1. Wait for the success notification, then check that **Members in role** lists the service principal alongside your lab account.

    Don't add it to **DefaultReader**, grant it **ReadAll**, or give it a workspace role. Those grants could let it read data outside **RecallSupplierReader**.

> [!Help] If the new service principal doesn't appear in the suggestions, wait a minute and try again. If adding it fails, keep the error and ask the instructor. Don't work around the error by granting broader access.

## Task 3: Get the service principal's token

To keep your own Azure CLI sign-in in this tab, you sign in as the service principal in a separate Azure CLI configuration folder, then switch back.

1. Sign in as the service principal, request its token, and copy the token to the clipboard:

    ```powershell
    $env:AZURE_CONFIG_DIR = Join-Path $env:TEMP 'recall-spn-azure'
    az login --service-principal --username $appId "--password=$secret" --tenant $tenantId --allow-no-subscriptions --output none
    az account get-access-token --resource https://storage.azure.com --query accessToken -o tsv | Set-Clipboard
    Remove-Item Env:AZURE_CONFIG_DIR
    ```

    The last command returns this tab to your own Azure CLI sign-in. The service principal's token is now on the clipboard.

> [!Help] If `az login` reports that the application wasn't found or that the secret is invalid, the new app registration isn't available yet. Wait a minute, then run the four commands again.

## Task 4: Sign in as the service principal

The console holds two identities at once, **My account** and **Service principal**, and keeps the loaded data of each one separately.

1. In the console's header, select **+ Service principal**. The **Identities** dialog opens.

1. In the **Service principal** section, paste the token into **Service principal access token**.

1. Check that the line under the field shows **Application**, **App** followed by your app ID, and the time left. A warning that says **This is a user token, not a service principal token** means you pasted your own token: repeat Task 3 and paste again.

1. In the **Service principal** section, select **Sign in**, then close the dialog.

    The header now shows **My account** and **Service principal**, with **Service principal** selected.

1. Select **Load data**.

1. Check that the message under the toolbar says **Load finished. 4 tables not readable by this identity.**

    <!-- Screenshot TODO: exercise-4-4-service-principal-loaded.png; show the Service principal dashboard with 1/5 tables readable. -->

    The console sent the same requests as for your account, this time with the service principal's token.

> [!Help] If **dbo.lots** is also blocked, return to **Manage OneLake security** and check that the service principal is listed directly in **RecallSupplierReader** and that the role includes **dbo.lots**. Correct any missing membership as in Task 2, then select **Reload data**. If it is still blocked, keep the error and ask the instructor. If the identity shows **expired**, repeat Task 3, then select **Identities** > **Replace token** in the **Service principal** section.

## Task 5: Compare what each identity can read

Switch between **My account** and **Service principal** in the header. Switching keeps each identity's loaded data, so you can compare them side by side.

1. Find the **Lots by supplier** card for each identity:

    - **My account** shows **302 lots** from 4 suppliers: **SUP-008**, **SUP-014**, **SUP-021**, and **SUP-027**.
    - **Service principal** shows **55 lots** from 1 supplier, **SUP-014**.

    The console asked for the whole **dbo.lots** table, with no supplier filter, for both identities. The row rule filtered the table before any row reached the browser.

1. With **Service principal** selected, check that the lot card for **YG-2291** shows supplier **SUP-014** and production line **AVD-L2**.

    The product shows as its ID, **PRD-007**, rather than its name. The role doesn't include **dbo.products**, so the console can't look the name up.

1. Still as **Service principal**, enter ++CS-2876++ in **Lot**. This lot comes from supplier **SUP-021**, outside the row rule.

    Check that the lot card shows **No matching lot in the data returned to this identity.**

1. Switch to **My account** and enter ++CS-2876++ in **Lot**. Check that the lot card shows supplier **SUP-021**.

    The lot exists, but OneLake didn't return it to the service principal.

1. Enter ++YG-2291++ in **Lot** again for both identities.

1. Find the **Table access** card for each identity:

    - **My account** shows **5/5 tables readable** and **None blocked**.
    - **Service principal** shows **1/5 tables readable** and **4 blocked by OneLake**. **dbo.lots** is **Readable**, and the other four tables are **Blocked**, each with the HTTP status OneLake returned.

    <!-- Screenshot TODO: exercise-4-4-compare-identities.png; show Lots by supplier and Table access for the Service principal, with SUP-014 only and four blocked tables. -->

    A blocked table is evidence of OneLake security only because your own account reads the same table. A missing table or a typo would also fail.

1. Check the other cards for each identity. For **My account**, **Current inventory** shows 9 stores. For **Service principal**, **Current inventory** and **Supplier certificates** show the access error of the table each one needs.

1. With **Service principal** selected, select **DevTools** at the bottom of the window, or press **Ctrl+`**.

1. Select **Identity**. Check that the type is **Application (service principal)** and that **App ID** matches `$appId`.

1. Select **Network**. Check that the console sent the same `POST /read` request for each table as it did for your account. OneLake answered **200** for **dbo.lots** and refused the other tables.

> [!Help] If the service principal shows a supplier other than SUP-014, stop and tell the instructor: another role, **DefaultReader**, or a workspace role might grant it broader access.

**Completion check:** In the same console, with the same requests, your account reads 302 lots from 4 suppliers and all 5 tables, while the service principal reads only SUP-014's 55 lots and OneLake blocks the other 4 tables. You can explain why: each bearer token is a separate identity, and OneLake applies that identity's roles before any data reaches the browser.
