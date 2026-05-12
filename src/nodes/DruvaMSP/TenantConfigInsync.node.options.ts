import type { INodeProperties } from "n8n-workflow";
import { INSYNC_OBJECTS } from "./tenant-config/insync/registry";

const RESOURCE_VALUE = "tenantConfigInsync";

const objectDropdown: INodeProperties = {
  displayName: "Object",
  name: "object",
  type: "options",
  noDataExpression: true,
  displayOptions: { show: { resource: [RESOURCE_VALUE] } },
  options: INSYNC_OBJECTS.map((o) => ({ name: o.name, value: o.value })),
  default: INSYNC_OBJECTS[0]?.value ?? "",
};

const operationDropdowns: INodeProperties[] = INSYNC_OBJECTS.map((o) => ({
  displayName: "Operation",
  name: "operation",
  type: "options" as const,
  noDataExpression: true,
  displayOptions: {
    show: { resource: [RESOURCE_VALUE], object: [o.value] },
  },
  options: o.operations.map((op) => ({
    name: op === "list" ? "List" : "Get",
    value: op,
    action: `${op === "list" ? "List" : "Get"} ${o.name}`,
  })),
  default: o.operations[0],
}));

export const tenantConfigInsyncOperations: INodeProperties[] = [
  objectDropdown,
  ...operationDropdowns,
];

const idFields: INodeProperties[] = INSYNC_OBJECTS.filter(
  (o) => o.getIdParam,
).map((o) => ({
  displayName: `${o.name} ID`,
  name: o.getIdParam!,
  type: "string" as const,
  required: true,
  default: "",
  displayOptions: {
    show: {
      resource: [RESOURCE_VALUE],
      object: [o.value],
      operation: ["get"],
    },
  },
}));

const listIdFields: INodeProperties[] = INSYNC_OBJECTS.filter(
  (o) => o.requiredListParams && o.requiredListParams.length > 0,
).flatMap((o) =>
  o.requiredListParams!.map((param) => ({
    displayName: param,
    name: param,
    type: "string" as const,
    required: true,
    default: "",
    displayOptions: {
      show: {
        resource: [RESOURCE_VALUE],
        object: [o.value],
        operation: ["list"],
      },
    },
  })),
);

export const tenantConfigInsyncFields: INodeProperties[] = [
  {
    displayName: "Tenant",
    name: "tenantId",
    type: "options",
    typeOptions: { loadOptionsMethod: "getInsyncTenants" },
    required: true,
    default: "",
    displayOptions: { show: { resource: [RESOURCE_VALUE] } },
  },
  ...idFields,
  ...listIdFields,
  {
    displayName: "Return All",
    name: "returnAll",
    type: "boolean",
    default: false,
    displayOptions: {
      show: { resource: [RESOURCE_VALUE] },
    },
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
  },
];
