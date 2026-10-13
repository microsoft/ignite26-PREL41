# Build the Contoso Fresh recall console

At 6:00 AM, a supplier warns Contoso Fresh about a possible contamination in
yogurt lot **YG-2291**. As a data and analytics engineer, you must unify the
operational, historical, streaming, and document data needed to help regional
managers act before noon.

In this workshop, you will build a governed data estate in Microsoft Fabric and
use it to answer five recall questions:

1. Which stores have the affected lot?
1. Where else has the supplier's product traveled?
1. Were the trucks kept below the required temperature?
1. Which users are allowed to see each part of the data?
1. Can regional managers use one console to investigate the recall?

**Duration:** Approximately 4 hours, including a 10-minute break.

**Prerequisites:** The Skillable environment provides a Microsoft Fabric
workspace, workshop data, and access to the Contoso Fresh SharePoint content.
Use only the accounts and resources supplied in the lab.

**Success criteria:** At the end of the workshop, you can demonstrate a recall
console that combines the affected stores, shipment history, temperature
status, and supplier documents while respecting OneLake Security.

> [!Note] This workshop uses pre-provisioned resources. Do not create additional
> capacities, tenants, or external accounts.

===

# Prepare your environment

In this module, you will confirm that the supplied services and data are ready
before you begin the recall investigation.

## Exercise 0.1: Open the lab

Sign in with the account supplied by Skillable and open the pre-provisioned
Contoso Fresh workspace.

**Completion check:** The workspace opens and its supplied Fabric items are
visible.

## Exercise 0.2: Review the recall

Review the five recall questions on the workshop landing page and identify the
data source that contributes to each answer.

**Completion check:** You can explain why the investigation requires
operational data, historical data, telemetry, supplier documents, and governed
access.

===

# Unify operational data

In this module, you will bring operational and unstructured data into a single
OneLake view without building a copy pipeline.

## Exercise 1.1: Explore operations

Explore the supplied Contoso Fresh SQL database and identify the orders,
shipments, and store inventory data needed for the recall.

**Completion check:** You can locate the affected lot in the operational data
and explain how the database data is available in OneLake.

## Exercise 1.2: Link supplier documents

The supplier certificates and recall procedure remain in SharePoint. In this
exercise, you will make that content available in OneLake without copying it or
creating an ingestion pipeline.

### Check for an existing shortcut

1. In the lakehouse **Explorer** pane, expand **Files**.
1. Look for a shortcut named **SupplierQuality**.
1. If the shortcut exists, open it and verify that you can see the supplier
   certificate content and recall procedure, then continue to the completion
   check.

> [!Note] This state check makes the exercise safe to resume. Do not create a
> second shortcut with a different name.

### Start the shortcut

1. In the **Explorer** pane, select the ellipsis (**...**) next to **Files**.
1. Select **New shortcut**.
1. In the **New shortcut** window, under **External sources**, select
   **SharePoint Folder**.

> [!Knowledge] A shortcut is a pointer to the source location. The files remain
> in SharePoint, and deleting the shortcut does not delete the source content.

### Select the supplier content

1. On the connection page, select **Existing connection**.
1. Select the connection supplied for the Contoso Fresh Supplier Quality
   content.
1. Select **Next**.
1. Browse to the **Supplier Quality** library or folder.
1. Select the checkbox next to the folder that contains the supplier
   certificates and recall procedure.
1. Select **Next**.

> [!Alert] Use only the connection supplied in the lab. If the connection is
> missing or Fabric asks you to create or sign in to a connection, stop and
> notify the instructor.

### Create and inspect the shortcut

1. On the **Transform** page, select **Skip**. You will transform the
   certificate metadata in Exercise 1.3.
1. On the review page, select the pencil icon for the shortcut.
1. For the shortcut name, enter ++SupplierQuality++, and then save the name.
1. Verify that the selected source is the Supplier Quality content, and then
   select **Create**.
1. Wait for the lakehouse to refresh and display **SupplierQuality** under
   **Files**.
1. Open **SupplierQuality** and verify that you can browse the supplier
   certificates and recall procedure.

> [!Help] If the shortcut appears but its content is unavailable, refresh the
> lakehouse. If the problem continues, confirm that you selected the Supplier
> Quality folder and notify the instructor so the supplied SharePoint access can
> be checked.

**Completion check:** The supplier certificates and recall procedure are
visible under **Files** > **SupplierQuality**, and no source files were copied
into the lakehouse.

## Exercise 1.3: Prepare certificate data

Transform the supplied certificate metadata into a queryable table for the
recall investigation.

**Completion check:** Certificate records are available as a table and include
the supplier associated with lot **YG-2291**.

## Exercise 1.4: Find affected stores

Use the SQL analytics endpoint to join the operational data and identify stores
that currently hold lot **YG-2291**.

**Completion check:** Your result contains the affected stores and the region
for each store.

===

# Add shipment history

In this module, you will use Apache Spark and Apache Iceberg to add five years
of shipment history without duplicating the existing lake.

## Exercise 2.1: Write Iceberg tables

Run the supplied Spark notebook to write the historical shipment data as
Apache Iceberg tables.

**Completion check:** The notebook completes and reports the expected Iceberg
tables.

## Exercise 2.2: Expose history in OneLake

Expose the Iceberg tables in OneLake and inspect the same data through the
supported Fabric engines.

**Completion check:** The history is readable through OneLake without a copy
operation.

## Exercise 2.3: Trace related lots

Join the historical shipments with current operational data and find lots from
the same supplier batch window during the last 90 days.

**Completion check:** The result identifies the related lots and their shipment
destinations.

> [!Help] If the Spark session does not become ready, use the fallback table
> supplied in the workspace and notify the instructor.

===

# Check temperature telemetry

In this module, you will add the real-time signal needed to determine whether
affected products remained within the cold-chain threshold.

## Exercise 3.1: Replay truck telemetry

Start the supplied Eventstream and observe new truck telemetry arriving in the
lakehouse.

**Completion check:** New telemetry rows appear with truck, timestamp, and
temperature values.

## Exercise 3.2: Identify temperature breaches

Find shipments that remained above **4 C** for more than 20 minutes and join
them to the affected lots.

**Completion check:** Each affected shipment has a clear temperature status.

===

# Govern recall access

In this module, you will apply OneLake Security so regional managers and a
logistics partner see only the data required for their roles.

## Exercise 4.1: Limit a regional manager

Create the **RegionalManager_North** role and limit rows to the North region.

**Completion check:** The role can access North region records but not records
from other regions.

## Exercise 4.2: Limit a logistics partner

Create the **LogisticsPartner** role, limit it to the partner's shipments, and
hide supplier cost columns.

**Completion check:** The partner can access its shipment records without
seeing supplier cost data.

## Exercise 4.3: Compare identities

Run the same investigation as the supplied test identities and compare the
results.

**Completion check:** Each identity receives the expected rows and columns.

===

# Build the recall console

In this module, you will build the application that regional managers use to
investigate the recall.

## Exercise 5.1: Start the application

Create a Rayfin application from the supplied starter template.

**Completion check:** The starter application runs in the lab environment.

## Exercise 5.2: Read OneLake data

Connect the application through the OneLake Read API and display affected
stores, truck temperature status, and supplier certificate links.

**Completion check:** The console displays the current recall data from
OneLake.

## Exercise 5.3: Verify governed results

Use the supplied manager and partner identities to verify that the application
respects the security configured in the previous module.

**Completion check:** The console changes its rows and columns for each
identity without application-specific filtering.

===

# Complete the workshop

You unified operational, historical, streaming, and document data in OneLake,
governed access to that data, and used it in a recall console.

## Review the investigation

Confirm that the recall console answers all five questions from the opening
scenario.

## Optional extensions

If the instructor confirms that the optional resources are available, explore
one of these paths:

- Query the governed OneLake data from the supplied external analytics service.
- Ask a question about the governed data using the supplied AI or productivity
  experience.

> [!Note] Optional extensions are not required to complete the workshop.
