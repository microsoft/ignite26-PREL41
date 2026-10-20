# Infrastructure

## OneLake roles

The workshop provides two role definitions:

- [RegionalManagerNorth](onelake/regional-manager-north.json) limits regional
  activity to the fixed North store list.
- [LogisticsPartner](onelake/logistics-partner.json) limits shipments, trucks,
  and carriers to CAR-02 and permits only named non-cost shipment columns.

These definitions contain no user memberships, credentials, or tenant-specific
IDs. They grant nobody access until the lab provisioning process adds the
supplied restricted identities. They do not change DefaultReader permissions
or memberships, item permissions, workspace permissions, or SQL endpoint
access mode.

The roles exclude raw reference/history files. The partner role also excludes
both lot tables, which contain supplier unit costs. Certificate metadata and
the SupplierQuality document shortcut are scoped separately.

### Apply in an author workspace

Use Fabio authenticated as the intended item creator. Set `WORKSPACE_ID` and
`LAKEHOUSE_ID` to the authorized lab resources, then run from the repository
root:

```bash
fabio onelake-security create \
  --workspace "$WORKSPACE_ID" --id "$LAKEHOUSE_ID" \
  --role @infra/onelake/regional-manager-north.json --conflict-policy Abort

fabio onelake-security create \
  --workspace "$WORKSPACE_ID" --id "$LAKEHOUSE_ID" \
  --role @infra/onelake/logistics-partner.json --conflict-policy Abort
```

`Abort` prevents silently overwriting an existing role. On resume, inspect its
saved constraints and memberships before deciding whether to reuse it.
Do not replace all roles with a bulk upsert, and do not add the engineer to
these roles as a substitute for a restricted test identity.

For a role with only row constraints, omit `columns` rather than sending an
empty array: the Fabric service rejected the empty-array form during live
validation. Compare saved policies by name, permissions, constraints, and
memberships, rather than assuming server-assigned role IDs remain unchanged.

### Validate before release

Follow [Exercise 4.3](../instructions/README.md#exercise-43-compare-identities)
with the actual supplied reader accounts. Confirm user identity mode on the
SQL analytics endpoint and remove conflicting broad grants for those test
accounts only. Owner queries and successful role creation do not prove
authorization.

The certificate transformation, document shortcut, telemetry, and console
still require their own provisioning and effective-identity checks. Adding a
new table does not automatically grant it through these selected-path roles.
