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
import { DynamicStructuredTool } from "@langchain/core/tools";

import { executeDruvaMspAiTool } from "./ai-tools/tool-executor";
import { getSchema } from "./ai-tools/schema-generator";
import {
  buildCustomerGetDescription,
  buildCustomerGetManyDescription,
  buildCustomerCreateDescription,
  buildCustomerUpdateDescription,
  buildCustomerGetTokenDescription,
  buildTenantGetDescription,
  buildTenantGetManyDescription,
  buildTenantSuspendDescription,
  buildTenantUnsuspendDescription,
  buildAdminGetManyDescription,
  buildEventGetManyMspEventsDescription,
  buildEventGetManyCustomerEventsDescription,
  buildTaskGetDescription,
  buildServicePlanGetDescription,
  buildServicePlanGetManyDescription,
  buildStorageRegionGetManyDescription,
  buildReportUsageGetGlobalReportDescription,
  buildReportUsageGetItemizedConsumptionDescription,
  buildReportUsageGetItemizedQuotaDescription,
  buildReportCyberGetRollbackActionsDescription,
  buildReportCyberGetDataProtectionRiskDescription,
  buildReportEndpointGetUsersDescription,
  buildReportEndpointGetLastBackupStatusDescription,
  buildReportEndpointGetAlertsDescription,
} from "./ai-tools/description-builders";

// ---------------------------------------------------------------------------
// Toolkit compatibility — n8n 2.9+ vs older n8n
//
// n8n >= 2.9  exports StructuredToolkit from n8n-core.
// Older n8n   uses Toolkit from @langchain/classic/agents.
//
// The AI Agent checks `toolOrToolkit instanceof <ToolkitBase>` to flatten tools.
// We MUST extend the EXACT same constructor n8n loaded, so instanceof passes.
// Probe n8n-core first; fall back to classic if StructuredToolkit is absent.
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let LangChainToolkitBase: new (...args: any[]) => {
  tools?: DynamicStructuredTool[];
  getTools?(): DynamicStructuredTool[];
};
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
  const nCore = require("n8n-core") as Record<string, unknown>;
  const StructuredToolkit = nCore["StructuredToolkit"];
  if (typeof StructuredToolkit !== "function") throw new Error("not found");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  LangChainToolkitBase = StructuredToolkit as any;
} catch {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
  ({ Toolkit: LangChainToolkitBase } = require("@langchain/classic/agents") as {
    Toolkit: typeof LangChainToolkitBase;
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
class DruvaMspToolkit extends (LangChainToolkitBase as any) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  declare tools: any[];
  constructor(toolList: DynamicStructuredTool[]) {
    super();
    this.tools = toolList;
  }
  getTools(): DynamicStructuredTool[] {
    return this.tools as DynamicStructuredTool[];
  }
}

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
// Description resolver
// ---------------------------------------------------------------------------

function buildToolDescription(
  resource: string,
  operation: string,
  referenceUtc: string,
): string {
  switch (resource) {
    case "customer":
      switch (operation) {
        case "get":
          return buildCustomerGetDescription();
        case "getMany":
          return buildCustomerGetManyDescription();
        case "create":
          return buildCustomerCreateDescription();
        case "update":
          return buildCustomerUpdateDescription();
        case "getToken":
          return buildCustomerGetTokenDescription();
      }
      break;
    case "tenant":
      switch (operation) {
        case "get":
          return buildTenantGetDescription();
        case "getMany":
          return buildTenantGetManyDescription();
        case "suspend":
          return buildTenantSuspendDescription();
        case "unsuspend":
          return buildTenantUnsuspendDescription();
      }
      break;
    case "admin":
      if (operation === "getMany") return buildAdminGetManyDescription();
      break;
    case "event":
      switch (operation) {
        case "getManyMspEvents":
          return buildEventGetManyMspEventsDescription(referenceUtc);
        case "getManyCustomerEvents":
          return buildEventGetManyCustomerEventsDescription(referenceUtc);
      }
      break;
    case "task":
      if (operation === "get") return buildTaskGetDescription();
      break;
    case "servicePlan":
      switch (operation) {
        case "get":
          return buildServicePlanGetDescription();
        case "getMany":
          return buildServicePlanGetManyDescription();
      }
      break;
    case "storageRegion":
      if (operation === "getMany")
        return buildStorageRegionGetManyDescription();
      break;
    case "reportUsage":
      switch (operation) {
        case "getGlobalReport":
          return buildReportUsageGetGlobalReportDescription(referenceUtc);
        case "getItemizedConsumption":
          return buildReportUsageGetItemizedConsumptionDescription(
            referenceUtc,
          );
        case "getItemizedQuota":
          return buildReportUsageGetItemizedQuotaDescription(referenceUtc);
      }
      break;
    case "reportCyber":
      switch (operation) {
        case "getRollbackActions":
          return buildReportCyberGetRollbackActionsDescription(referenceUtc);
        case "getDataProtectionRisk":
          return buildReportCyberGetDataProtectionRiskDescription(referenceUtc);
      }
      break;
    case "reportEndpoint":
      switch (operation) {
        case "getUsers":
          return buildReportEndpointGetUsersDescription(referenceUtc);
        case "getLastBackupStatus":
          return buildReportEndpointGetLastBackupStatusDescription();
        case "getAlerts":
          return buildReportEndpointGetAlertsDescription(referenceUtc);
      }
      break;
  }
  return `Perform ${operation} on ${resource}.`;
}

// ---------------------------------------------------------------------------
// Tool name helper
// ---------------------------------------------------------------------------

function toolName(resource: string, operation: string): string {
  // Use getById suffix for bare 'get' — signals to LLM that an ID is required
  const suffix = operation === "get" ? "getById" : operation;
  return `druva_msp_${resource}_${suffix}`;
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
      "Expose Druva MSP operations as individual AI tools for use with the AI Agent node",
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
        description: "The Druva MSP resource to expose as AI tools",
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

    const referenceUtc = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const supplyDataContext = this;
    const tools: DynamicStructuredTool[] = [];

    for (const operation of operations) {
      if (WRITE_OPERATIONS.has(operation) && !allowWriteOperations) continue;

      const name = toolName(resource, operation);
      const description = buildToolDescription(
        resource,
        operation,
        referenceUtc,
      );
      const schema = getSchema(resource, operation);

      tools.push(
        new DynamicStructuredTool({
          name,
          description,
          // Pass raw Zod — do NOT pre-convert. n8n/LangChain handles schema→JSON conversion
          // internally. func() is never called by n8n's AI Agent dispatch path.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          schema: schema as any,
          func: async (params: Record<string, unknown>) => {
            return executeDruvaMspAiTool(
              supplyDataContext as unknown as IExecuteFunctions,
              resource,
              operation,
              params,
            );
          },
        }),
      );
    }

    if (tools.length === 0) {
      throw new NodeOperationError(
        this.getNode(),
        `No tools to expose for resource "${RESOURCE_LABELS[resource] ?? resource}". ` +
          'Enable "Allow Write Operations" to include mutating operations.',
      );
    }

    const toolkit = new DruvaMspToolkit(tools);
    return { response: toolkit };
  }

  /**
   * execute() is called by n8n for BOTH "Test step" clicks AND real AI Agent tool invocations.
   *
   * CRITICAL: n8n's AI Agent routes tool calls through execute(), NOT DynamicStructuredTool.func().
   * supplyData() + getTools() only provide tool definitions (names, schemas, descriptions) to the LLM.
   * When the LLM calls a tool, n8n dispatches via execute() with LLM-provided params merged into
   * the input item JSON alongside n8n metadata fields (tool, toolCallId, sessionId, etc).
   *
   * Detect real calls by checking for the 'tool' field. Absent = "Test step", return stub.
   */
  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const firstItemTool = items[0]?.json?.["tool"] as string | undefined;

    // No 'tool' field → "Test step" click, not a real AI Agent tool invocation
    if (!firstItemTool) {
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
                exposedTools: ops.map((op) => toolName(resource, op)),
              },
            } as IDataObject,
            pairedItem: { item: 0 },
          },
        ],
      ];
    }

    // Real AI Agent tool call — resolve resource + operation from tool name
    let resource = "";
    let operation = "";
    outer: for (const [res, ops] of Object.entries(RESOURCE_OPERATIONS)) {
      for (const op of ops) {
        if (firstItemTool === toolName(res, op)) {
          resource = res;
          operation = op;
          break outer;
        }
      }
    }

    if (!resource || !operation) {
      return [
        [
          {
            json: {
              error: `Unknown tool: ${firstItemTool}`,
            } as IDataObject,
            pairedItem: { item: 0 },
          },
        ],
      ];
    }

    const returnData: INodeExecutionData[] = [];
    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      const rawParams = items[itemIndex].json as Record<string, unknown>;
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
