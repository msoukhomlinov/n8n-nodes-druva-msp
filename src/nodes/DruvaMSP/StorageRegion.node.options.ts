import type { INodeProperties } from "n8n-workflow";

// Define the operations for the Storage Region resource
export const storageRegionOperations: INodeProperties[] = [
  {
    displayName: "Operation",
    name: "operation",
    type: "options",
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ["storageRegion"],
      },
    },
    options: [
      {
        name: "Get Many",
        value: "getMany",
        action: "Get many storage regions",
        description:
          "Retrieve all available storage regions grouped by product",
      },
    ],
    default: "getMany",
  },
];

// No additional fields required — the endpoint takes no parameters
export const storageRegionFields: INodeProperties[] = [];
