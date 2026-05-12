import type { INodeProperties } from "n8n-workflow";

import { ENTERPRISE_WORKLOADS } from "./tenant-config/enterprise/registry";

const RESOURCE_VALUE = "tenantConfigEnterprise";

export const tenantConfigEnterpriseOperations: INodeProperties[] = [
  {
    displayName: "Operation",
    name: "operation",
    type: "options",
    noDataExpression: true,
    displayOptions: { show: { resource: [RESOURCE_VALUE] } },
    options: [
      {
        name: "List",
        value: "list",
        action: "List configured objects for a tenant workload",
      },
    ],
    default: "list",
  },
];

const workloadObjectOptions: INodeProperties[] = ENTERPRISE_WORKLOADS.map(
  (w) => ({
    displayName: "Object",
    name: "object",
    type: "options" as const,
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: [RESOURCE_VALUE],
        workload: [w.value],
      },
    },
    options: w.objects.map((o) => ({ name: o.name, value: o.value })),
    default: w.objects[0]?.value ?? "",
  }),
);

export const tenantConfigEnterpriseFields: INodeProperties[] = [
  {
    displayName: "Tenant",
    name: "tenantId",
    type: "options",
    typeOptions: { loadOptionsMethod: "getEnterpriseTenants" },
    required: true,
    default: "",
    displayOptions: { show: { resource: [RESOURCE_VALUE] } },
    description: "Tenant (Enterprise Workloads) to interrogate",
  },
  {
    displayName: "Org Scope",
    name: "orgScope",
    type: "options",
    default: "auto",
    displayOptions: { show: { resource: [RESOURCE_VALUE] } },
    options: [
      {
        name: "Auto (Single Org)",
        value: "auto",
        description: "Use the single org if the customer has only one",
      },
      {
        name: "All Orgs (OrgID=0)",
        value: "all",
        description: "Wildcard across all orgs for this customer-scoped token",
      },
      {
        name: "Specific Org",
        value: "specific",
        description: "Pick a specific OrgID from the dropdown",
      },
    ],
  },
  {
    displayName: "Org",
    name: "orgId",
    type: "options",
    typeOptions: { loadOptionsMethod: "getOrgsForEnterpriseTenant" },
    required: true,
    default: "",
    displayOptions: {
      show: { resource: [RESOURCE_VALUE], orgScope: ["specific"] },
    },
    description: "Pick the specific org to interrogate",
  },
  {
    displayName: "Workload",
    name: "workload",
    type: "options",
    default: ENTERPRISE_WORKLOADS[0]?.value ?? "",
    displayOptions: { show: { resource: [RESOURCE_VALUE] } },
    options: ENTERPRISE_WORKLOADS.map((w) => ({
      name: w.name,
      value: w.value,
    })),
  },
  ...workloadObjectOptions,
  {
    displayName: "Return All",
    name: "returnAll",
    type: "boolean",
    default: false,
    displayOptions: { show: { resource: [RESOURCE_VALUE] } },
    description: "Whether to return all results or only up to a given limit",
  },
  {
    displayName: "Limit",
    name: "limit",
    type: "number",
    typeOptions: { minValue: 1 },
    default: 100,
    displayOptions: {
      show: { resource: [RESOURCE_VALUE], returnAll: [false] },
    },
    description: "Max number of results to return",
  },
];
