import { NodeOperationError } from "n8n-workflow";
import type {
  NodeConnectionType,
  IDataObject,
  IExecuteFunctions,
  INodeType,
  INodeTypeDescription,
  INodeExecutionData,
  ISupplyDataFunctions,
  SupplyData,
} from "n8n-workflow";
import type { DynamicStructuredTool } from "@langchain/core/tools";

import { RuntimeDynamicStructuredTool, runtimeZod } from "./ai-tools/runtime";
import { getRuntimeSchemaBuilders } from "./ai-tools/schema-converter";
import { executeDruvaMspAiTool } from "./ai-tools/tool-executor";
import { buildUnifiedDescription } from "./ai-tools/description-builders";
import { wrapError, ERROR_TYPES } from "./ai-tools/error-formatter";

// ---------------------------------------------------------------------------
// Resource → operations map
// ---------------------------------------------------------------------------

const RESOURCE_OPERATIONS: Record<string, string[]> = {
  admin: ["getMany"],
  customer: ["get", "getMany", "create", "update", "getToken"],
  event: ["getManyMspEvents", "getManyCustomerEvents"],
  reportCyber: ["getRollbackActions", "getDataProtectionRisk"],
  reportEndpoint: ["getUsers", "getLastBackupStatus", "getAlerts"],
  reportUsage: [
    "getGlobalReport",
    "getItemizedConsumption",
    "getItemizedQuota",
  ],
  servicePlan: ["get", "getMany"],
  storageRegion: ["getMany"],
  task: ["get"],
  tenant: ["get", "getMany", "suspend", "unsuspend"],
};

const WRITE_OPERATIONS = new Set([
  "create",
  "update",
  "getToken",
  "suspend",
  "unsuspend",
]);

const RESOURCE_LABELS: Record<string, string> = {
  admin: "Admin",
  customer: "Customer",
  event: "Event",
  reportCyber: "Report - Cyber Resilience",
  reportEndpoint: "Report - Endpoint",
  reportUsage: "Report - Usage",
  servicePlan: "Service Plan",
  storageRegion: "Storage Region",
  task: "Task",
  tenant: "Tenant",
};

// ---------------------------------------------------------------------------
// Runtime schema builders — resolved once at module level
// ---------------------------------------------------------------------------

const runtimeSchemas = getRuntimeSchemaBuilders(runtimeZod);

// ---------------------------------------------------------------------------
// Tool name helper — unified: one tool per resource, no operation suffix
// ---------------------------------------------------------------------------

function toolName(resource: string): string {
  // Complies with MCP regex: ^[a-zA-Z0-9_-]{1,128}$
  return `druva_msp_${resource}`;
}

// ---------------------------------------------------------------------------
// Node class
// ---------------------------------------------------------------------------

export class DruvaMspAiTools implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Druva MSP AI Tools",
    name: "druvaMspAiTools",
    icon: "file:druvaMsp.svg",
    group: ["output"],
    version: 1,
    description:
      "Expose Druva MSP operations as AI tools for use with the AI Agent node",
    defaults: { name: "Druva MSP AI Tools" },
    inputs: [],
    outputs: [{ type: "ai_tool" as NodeConnectionType, displayName: "Tools" }],
    credentials: [{ name: "druvaMspApi", required: true }],
    properties: [
      {
        displayName: "Resource",
        name: "resource",
        type: "options",
        required: true,
        noDataExpression: true,
        options: [
          { name: "Admin", value: "admin" },
          { name: "Customer", value: "customer" },
          { name: "Event", value: "event" },
          { name: "Report - Cyber Resilience", value: "reportCyber" },
          { name: "Report - Endpoint", value: "reportEndpoint" },
          { name: "Report - Usage", value: "reportUsage" },
          { name: "Service Plan", value: "servicePlan" },
          { name: "Storage Region", value: "storageRegion" },
          { name: "Task", value: "task" },
          { name: "Tenant", value: "tenant" },
        ],
        default: "customer",
        description: "The Druva MSP resource to expose as an AI tool",
      },
      {
        displayName: "Allow Write Operations",
        name: "allowWriteOperations",
        type: "boolean",
        default: false,
        description:
          "Whether to enable mutating operations (create, update, getToken, suspend, unsuspend). When disabled, only read-only operations are exposed.",
        noDataExpression: true,
      },
    ],
  };

  async supplyData(
    this: ISupplyDataFunctions,
    itemIndex: number,
  ): Promise<SupplyData> {
    const resource = this.getNodeParameter("resource", itemIndex) as string;
    const allowWriteOperations = this.getNodeParameter(
      "allowWriteOperations",
      itemIndex,
      false,
    ) as boolean;

    if (!resource)
      throw new NodeOperationError(this.getNode(), "Resource is required");

    const operations = RESOURCE_OPERATIONS[resource];
    if (!operations) {
      throw new NodeOperationError(
        this.getNode(),
        `Unknown resource: ${resource}`,
      );
    }

    // Layer 1: filter write operations based on toggle
    const enabledOps = operations.filter(
      (op) => allowWriteOperations || !WRITE_OPERATIONS.has(op),
    );

    if (enabledOps.length === 0) {
      throw new NodeOperationError(
        this.getNode(),
        `No operations to expose for resource "${RESOURCE_LABELS[resource] ?? resource}". ` +
          'Enable "Allow Write Operations" to include mutating operations.',
      );
    }

    const referenceUtc = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const supplyDataContext = this;

    const name = toolName(resource);
    const description = buildUnifiedDescription(
      resource,
      enabledOps,
      referenceUtc,
    );
    const schema = runtimeSchemas.buildUnifiedSchema(resource, enabledOps);

    const unifiedTool = new RuntimeDynamicStructuredTool({
      name,
      description,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      schema: schema as any,
      func: async (params: Record<string, unknown>) => {
        const operation = params.operation as string;

        // Layer 2: validate operation + write-safety re-check in func()
        if (!enabledOps.includes(operation)) {
          if (WRITE_OPERATIONS.has(operation) && !allowWriteOperations) {
            return JSON.stringify(
              wrapError(
                resource,
                operation,
                ERROR_TYPES.WRITE_OPERATION_BLOCKED,
                `Write operation "${operation}" is disabled.`,
                'Enable "Allow Write Operations" on this node to use mutating operations.',
              ),
            );
          }
          return JSON.stringify(
            wrapError(
              resource,
              operation,
              ERROR_TYPES.INVALID_OPERATION,
              `Invalid operation "${operation}" for resource "${resource}".`,
              `Valid operations: ${enabledOps.join(", ")}.`,
            ),
          );
        }

        // Strip operation from params before passing to executor
        // (executor's N8N_METADATA_FIELDS also strips it as defense-in-depth)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { operation: _op, ...apiParams } = params;
        return executeDruvaMspAiTool(
          supplyDataContext as unknown as IExecuteFunctions,
          resource,
          operation,
          apiParams,
        );
      },
    });

    return { response: unifiedTool as unknown as DynamicStructuredTool };
  }

  /**
   * execute() is called by n8n for BOTH "Test step" clicks AND real AI Agent tool invocations.
   *
   * n8n 2.14+ CHANGE: tool invocations arrive with params in item.json (including 'operation')
   * but WITHOUT a 'tool' field. Detect tool calls by checking for 'operation' (2.14+) OR
   * 'tool' (pre-2.14). If neither is present, it's a "Test step" click.
   */
  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const firstItem = items[0]?.json ?? {};
    const firstItemTool = firstItem["tool"] as string | undefined;
    const firstItemOperation = firstItem["operation"] as string | undefined;

    // Neither 'tool' nor 'operation' → "Test step" click
    if (!firstItemTool && !firstItemOperation) {
      const resource = this.getNodeParameter("resource", 0, "") as string;
      const allowWriteOperations = this.getNodeParameter(
        "allowWriteOperations",
        0,
        false,
      ) as boolean;
      const ops = (RESOURCE_OPERATIONS[resource] ?? []).filter(
        (op) => allowWriteOperations || !WRITE_OPERATIONS.has(op),
      );
      return [
        [
          {
            json: {
              message:
                "This is an AI Tool node. Connect it to an AI Agent node to use it.",
              configured: {
                resource,
                tool: toolName(resource),
                operations: ops,
              },
            } as IDataObject,
            pairedItem: { item: 0 },
          },
        ],
      ];
    }

    // Resolve resource + operation
    const resource = this.getNodeParameter("resource", 0, "") as string;
    let operation = "";

    if (firstItemOperation) {
      // n8n 2.14+ path (or unified tool func path): operation directly in item.json
      const ops = RESOURCE_OPERATIONS[resource];
      if (ops?.includes(firstItemOperation)) {
        operation = firstItemOperation;
      } else {
        // Operation provided but not recognized — return clear error
        return [
          [
            {
              json: {
                error: `Invalid operation "${firstItemOperation}" for resource "${resource}". Valid operations: ${(ops ?? []).join(", ")}`,
              } as IDataObject,
              pairedItem: { item: 0 },
            },
          ],
        ];
      }
    } else if (firstItemTool) {
      // Pre-2.14: unified architecture requires 'operation' in item.json.
      // Pre-2.14 n8n does not inject it, so this path cannot recover.
      return [
        [
          {
            json: {
              error:
                `Tool "${firstItemTool}" invoked without an "operation" field. ` +
                "This node requires n8n 2.14+ which includes the operation in tool call params.",
            } as IDataObject,
            pairedItem: { item: 0 },
          },
        ],
      ];
    }

    if (!resource || !operation) {
      return [
        [
          {
            json: {
              error: `Could not resolve resource or operation: resource=${resource || "none"}, operation=${firstItemOperation ?? "none"}`,
            } as IDataObject,
            pairedItem: { item: 0 },
          },
        ],
      ];
    }

    // Layer 3: write safety re-check in execute() path
    const allowWriteOperations = this.getNodeParameter(
      "allowWriteOperations",
      0,
      false,
    ) as boolean;

    const returnData: INodeExecutionData[] = [];
    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      // Write-block guard
      if (WRITE_OPERATIONS.has(operation) && !allowWriteOperations) {
        returnData.push({
          json: JSON.parse(
            JSON.stringify(
              wrapError(
                resource,
                operation,
                ERROR_TYPES.WRITE_OPERATION_BLOCKED,
                `Write operation "${operation}" is disabled.`,
                'Enable "Allow Write Operations" on this node.',
              ),
            ),
          ) as IDataObject,
          pairedItem: { item: itemIndex },
        });
        continue;
      }

      // Strip operation from params before passing to executor
      const rawParams = { ...items[itemIndex].json } as Record<string, unknown>;
      delete rawParams.operation;

      try {
        const resultStr = await executeDruvaMspAiTool(
          this,
          resource,
          operation,
          rawParams,
        );
        returnData.push({
          json: JSON.parse(resultStr) as IDataObject,
          pairedItem: { item: itemIndex },
        });
      } catch (error) {
        if (this.continueOnFail()) {
          const msg = error instanceof Error ? error.message : String(error);
          returnData.push({
            json: { error: msg } as IDataObject,
            pairedItem: { item: itemIndex },
          });
        } else {
          throw error;
        }
      }
    }
    return [returnData];
  }
}
