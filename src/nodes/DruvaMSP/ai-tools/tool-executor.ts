import type { IExecuteFunctions, IDataObject } from "n8n-workflow";

import {
  druvaMspApiRequest,
  getTenantCustomerId,
  getDruvaMspAccessToken,
} from "../GenericFunctions";
import { formatApiError, formatMissingIdError } from "./error-formatter";

// ---------------------------------------------------------------------------
// n8n framework metadata fields injected into every DynamicStructuredTool call.
// Strip these before forwarding params to the API.
// ---------------------------------------------------------------------------
const N8N_METADATA_FIELDS = new Set([
  "sessionId",
  "action",
  "chatInput",
  "root", // n8n canvas root node UUID — may collide with API params
  "tool",
  "toolName",
  "toolCallId",
]);

// ---------------------------------------------------------------------------
// Report API helpers
// ---------------------------------------------------------------------------

function buildReportFilterBy(params: Record<string, unknown>): IDataObject[] {
  const filterBy: IDataObject[] = [];

  if (params.startDate && params.endDate) {
    filterBy.push({
      fieldName: "lastUpdatedTime",
      operator: "GTE",
      value: params.startDate,
    });
    filterBy.push({
      fieldName: "lastUpdatedTime",
      operator: "LTE",
      value: params.endDate,
    });
  }

  if (
    params.customerIds &&
    Array.isArray(params.customerIds) &&
    params.customerIds.length > 0
  ) {
    filterBy.push({
      fieldName: "customerGlobalId",
      operator: "CONTAINS",
      value: params.customerIds,
    });
  }

  return filterBy;
}

function buildReportBody(
  params: Record<string, unknown>,
  filterBy: IDataObject[],
): IDataObject {
  const pageSize = typeof params.limit === "number" ? params.limit : 50;
  return {
    filters: {
      pageSize,
      filterBy,
    },
  };
}

function buildReportV2FilterBy(params: Record<string, unknown>): IDataObject[] {
  const filterBy: IDataObject[] = [];

  if (params.startDate) {
    filterBy.push({
      fieldName: "startDate",
      operator: "GTE",
      value: params.startDate,
    });
  }
  if (params.endDate) {
    filterBy.push({
      fieldName: "endDate",
      operator: "LTE",
      value: params.endDate,
    });
  }

  if (
    params.customerIds &&
    Array.isArray(params.customerIds) &&
    params.customerIds.length > 0
  ) {
    filterBy.push({
      fieldName: "customerGlobalId",
      operator: "CONTAINS",
      value: params.customerIds,
    });
  }

  return filterBy;
}

// ---------------------------------------------------------------------------
// Response formatters
// ---------------------------------------------------------------------------

function fmtSingle(result: unknown): string {
  return JSON.stringify({ result });
}

function fmtMany(results: unknown[], params: Record<string, unknown>): string {
  const limit = typeof params.limit === "number" ? params.limit : 50;
  const out: Record<string, unknown> = { results, count: results.length };
  if (results.length >= limit) {
    out.truncated = true;
    out.note = `Results capped at ${limit}. Use filters to narrow or increase 'limit' (max 200).`;
  }
  return JSON.stringify(out);
}

function fmtWrite(operation: string, result: unknown, id?: unknown): string {
  return JSON.stringify({ success: true, operation, itemId: id, result });
}

// ---------------------------------------------------------------------------
// Main executor
// ---------------------------------------------------------------------------

export async function executeDruvaMspAiTool(
  context: IExecuteFunctions,
  resource: string,
  operation: string,
  rawParams: Record<string, unknown>,
): Promise<string> {
  // Strip n8n framework metadata
  const params: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(rawParams)) {
    if (!N8N_METADATA_FIELDS.has(key)) params[key] = value;
  }

  try {
    switch (resource) {
      case "customer":
        return await executeCustomer(context, operation, params);
      case "tenant":
        return await executeTenant(context, operation, params);
      case "admin":
        return await executeAdmin(context, operation, params);
      case "event":
        return await executeEvent(context, operation, params);
      case "task":
        return await executeTask(context, operation, params);
      case "servicePlan":
        return await executeServicePlan(context, operation, params);
      case "storageRegion":
        return await executeStorageRegion(context, operation, params);
      case "reportUsage":
        return await executeReportUsage(context, operation, params);
      case "reportCyber":
        return await executeReportCyber(context, operation, params);
      case "reportEndpoint":
        return await executeReportEndpoint(context, operation, params);
      default:
        return JSON.stringify({
          error: true,
          errorType: "UNSUPPORTED_RESOURCE",
          message: `Unsupported resource: ${resource}`,
        });
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return JSON.stringify(formatApiError(msg, resource, operation));
  }
}

// ---------------------------------------------------------------------------
// Customer
// ---------------------------------------------------------------------------

async function executeCustomer(
  ctx: IExecuteFunctions,
  operation: string,
  params: Record<string, unknown>,
): Promise<string> {
  switch (operation) {
    case "get": {
      if (!params.customerId)
        return JSON.stringify(formatMissingIdError("customer", "get"));
      const qs: IDataObject = {};
      if (params.includeFeatures) qs.includeFeatures = true;
      const resp = await druvaMspApiRequest.call(
        ctx,
        "GET",
        `/msp/v3/customers/${params.customerId}`,
        undefined,
        qs,
      );
      return fmtSingle(resp);
    }

    case "getMany": {
      const limit = typeof params.limit === "number" ? params.limit : 50;
      const qs: IDataObject = { pageSize: String(limit) };
      const resp = await druvaMspApiRequest.call(
        ctx,
        "GET",
        "/msp/v3/customers",
        undefined,
        qs,
      );
      let customers = ((resp as IDataObject)?.customers as IDataObject[]) || [];

      // Client-side filtering
      if (params.customerName && typeof params.customerName === "string") {
        const search = params.customerName.toLowerCase();
        customers = customers.filter((c) =>
          String(c.customerName ?? "")
            .toLowerCase()
            .includes(search),
        );
      }
      if (params.accountName && typeof params.accountName === "string") {
        const search = params.accountName.toLowerCase();
        customers = customers.filter((c) =>
          String(c.accountName ?? "")
            .toLowerCase()
            .includes(search),
        );
      }
      return fmtMany(customers, params);
    }

    case "create": {
      if (!params.customerName) {
        return JSON.stringify(
          formatApiError("customerName is required", "customer", "create"),
        );
      }
      const body: IDataObject = {
        customerName: params.customerName,
        accountName: params.accountName ?? params.customerName,
        phone: params.phoneNumber ?? "",
        address: params.address ?? "",
      };
      const resp = await druvaMspApiRequest.call(
        ctx,
        "POST",
        "/msp/v3/customers",
        body,
      );
      return fmtWrite("create", resp, (resp as IDataObject)?.id);
    }

    case "update": {
      if (!params.customerId)
        return JSON.stringify(formatMissingIdError("customer", "update"));
      if (!params.customerName) {
        return JSON.stringify(
          formatApiError("customerName is required", "customer", "update"),
        );
      }
      const body: IDataObject = {
        customerName: params.customerName,
        phone: params.phoneNumber ?? "",
        address: params.address ?? "",
        attributes: [],
      };
      const resp = await druvaMspApiRequest.call(
        ctx,
        "PUT",
        `/msp/v3/customers/${params.customerId}`,
        body,
      );
      return fmtWrite("update", resp, params.customerId);
    }

    case "getToken": {
      if (!params.customerId)
        return JSON.stringify(formatMissingIdError("customer", "getToken"));
      const mspAccessToken = await getDruvaMspAccessToken.call(ctx);
      const credentials = await ctx.getCredentials("druvaMspApi");
      const baseUrl =
        (credentials.apiBaseUrl as string) || "https://apis.druva.com";
      const resp = await ctx.helpers.httpRequest({
        method: "POST",
        url: `${baseUrl}/msp/v2/customers/${params.customerId}/token`,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${mspAccessToken}`,
        },
        body: "grant_type=client_credentials",
        json: true,
      });
      return fmtSingle(resp);
    }

    default:
      return JSON.stringify({
        error: true,
        errorType: "UNSUPPORTED_OPERATION",
        message: `Unsupported operation for customer: ${operation}`,
      });
  }
}

// ---------------------------------------------------------------------------
// Tenant
// ---------------------------------------------------------------------------

async function executeTenant(
  ctx: IExecuteFunctions,
  operation: string,
  params: Record<string, unknown>,
): Promise<string> {
  switch (operation) {
    case "get": {
      if (!params.tenantId)
        return JSON.stringify(formatMissingIdError("tenant", "get"));
      const customerId = await getTenantCustomerId.call(
        ctx,
        params.tenantId as string,
      );
      if (!customerId) {
        return JSON.stringify(
          formatApiError(
            `Could not find customer for tenant ${params.tenantId}`,
            "tenant",
            "get",
          ),
        );
      }
      const resp = await druvaMspApiRequest.call(
        ctx,
        "GET",
        `/msp/v3/customers/${customerId}/tenants/${params.tenantId}`,
      );
      return fmtSingle(resp);
    }

    case "getMany": {
      const limit = typeof params.limit === "number" ? params.limit : 50;
      const qs: IDataObject = {
        pageSize: String(limit),
        includeFeatures: true,
      };
      if (params.customerId) qs.customerIds = params.customerId;
      const resp = await druvaMspApiRequest.call(
        ctx,
        "GET",
        "/msp/v3/tenants",
        undefined,
        qs,
      );
      let tenants = ((resp as IDataObject)?.tenants as IDataObject[]) || [];

      if (params.statusFilter !== undefined) {
        tenants = tenants.filter((t) => t.status === params.statusFilter);
      }
      if (params.typeFilter !== undefined) {
        tenants = tenants.filter((t) => t.tenantType === params.typeFilter);
      }
      if (params.productFilter !== undefined) {
        tenants = tenants.filter((t) => t.productID === params.productFilter);
      }
      return fmtMany(tenants, params);
    }

    case "suspend": {
      if (!params.tenantId)
        return JSON.stringify(formatMissingIdError("tenant", "suspend"));
      const customerId = await getTenantCustomerId.call(
        ctx,
        params.tenantId as string,
      );
      if (!customerId) {
        return JSON.stringify(
          formatApiError(
            `Could not find customer for tenant ${params.tenantId}`,
            "tenant",
            "suspend",
          ),
        );
      }
      const resp = await druvaMspApiRequest.call(
        ctx,
        "POST",
        `/msp/v2/customers/${customerId}/tenants/${params.tenantId}/suspend`,
      );
      return fmtWrite("suspend", resp);
    }

    case "unsuspend": {
      if (!params.tenantId)
        return JSON.stringify(formatMissingIdError("tenant", "unsuspend"));
      const customerId = await getTenantCustomerId.call(
        ctx,
        params.tenantId as string,
      );
      if (!customerId) {
        return JSON.stringify(
          formatApiError(
            `Could not find customer for tenant ${params.tenantId}`,
            "tenant",
            "unsuspend",
          ),
        );
      }
      const resp = await druvaMspApiRequest.call(
        ctx,
        "POST",
        `/msp/v2/customers/${customerId}/tenants/${params.tenantId}/unsuspend`,
      );
      return fmtWrite("unsuspend", resp);
    }

    default:
      return JSON.stringify({
        error: true,
        errorType: "UNSUPPORTED_OPERATION",
        message: `Unsupported operation for tenant: ${operation}`,
      });
  }
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

async function executeAdmin(
  ctx: IExecuteFunctions,
  operation: string,
  params: Record<string, unknown>,
): Promise<string> {
  if (operation !== "getMany") {
    return JSON.stringify({
      error: true,
      errorType: "UNSUPPORTED_OPERATION",
      message: `Unsupported operation for admin: ${operation}`,
    });
  }

  const limit = typeof params.limit === "number" ? params.limit : 50;
  const qs: IDataObject = { pageSize: limit };
  if (params.email) qs.email = params.email;
  if (params.role && Array.isArray(params.role) && params.role.length > 0) {
    qs.role = (params.role as string[]).join(",");
  }

  const resp = await druvaMspApiRequest.call(
    ctx,
    "GET",
    "/msp/v2/admins",
    undefined,
    qs,
  );
  const admins = ((resp as IDataObject)?.admins as IDataObject[]) || [];
  return fmtMany(admins, params);
}

// ---------------------------------------------------------------------------
// Event
// ---------------------------------------------------------------------------

async function executeEvent(
  ctx: IExecuteFunctions,
  operation: string,
  params: Record<string, unknown>,
): Promise<string> {
  const limit = typeof params.limit === "number" ? params.limit : 50;
  const qs: IDataObject = { pageSize: Math.min(limit, 500) };
  if (params.category) qs.category = params.category;
  if (params.severity !== undefined)
    qs.syslogSeverity = Number(params.severity);

  if (operation === "getManyMspEvents") {
    const resp = await druvaMspApiRequest.call(
      ctx,
      "GET",
      "/msp/v2/events",
      undefined,
      qs,
    );
    const events = ((resp as IDataObject)?.events as IDataObject[]) || [];
    return fmtMany(events, params);
  }

  if (operation === "getManyCustomerEvents") {
    if (!params.customerId) {
      return JSON.stringify(
        formatMissingIdError("event", "getManyCustomerEvents"),
      );
    }
    const resp = await druvaMspApiRequest.call(
      ctx,
      "GET",
      `/msp/v3/customers/${params.customerId}/events`,
      undefined,
      qs,
    );
    const events = ((resp as IDataObject)?.events as IDataObject[]) || [];
    return fmtMany(events, params);
  }

  return JSON.stringify({
    error: true,
    errorType: "UNSUPPORTED_OPERATION",
    message: `Unsupported operation for event: ${operation}`,
  });
}

// ---------------------------------------------------------------------------
// Task
// ---------------------------------------------------------------------------

async function executeTask(
  ctx: IExecuteFunctions,
  operation: string,
  params: Record<string, unknown>,
): Promise<string> {
  if (operation !== "get") {
    return JSON.stringify({
      error: true,
      errorType: "UNSUPPORTED_OPERATION",
      message: `Unsupported operation for task: ${operation}`,
    });
  }
  if (!params.taskId)
    return JSON.stringify(formatMissingIdError("task", "get"));
  const resp = await druvaMspApiRequest.call(
    ctx,
    "GET",
    `/msp/v2/tasks/${params.taskId}`,
  );
  return fmtSingle(resp);
}

// ---------------------------------------------------------------------------
// Service Plan
// ---------------------------------------------------------------------------

async function executeServicePlan(
  ctx: IExecuteFunctions,
  operation: string,
  params: Record<string, unknown>,
): Promise<string> {
  if (operation === "get") {
    if (!params.servicePlanId) {
      return JSON.stringify(formatMissingIdError("servicePlan", "get"));
    }
    const resp = await druvaMspApiRequest.call(
      ctx,
      "GET",
      `/msp/v3/servicePlans/${params.servicePlanId}`,
    );
    return fmtSingle(resp);
  }

  if (operation === "getMany") {
    const limit = typeof params.limit === "number" ? params.limit : 50;
    const qs: IDataObject = { pageSize: String(limit) };
    const resp = await druvaMspApiRequest.call(
      ctx,
      "GET",
      "/msp/v3/servicePlans",
      undefined,
      qs,
    );
    let plans = ((resp as IDataObject)?.servicePlans as IDataObject[]) || [];

    if (params.nameContains && typeof params.nameContains === "string") {
      const search = params.nameContains.toLowerCase();
      plans = plans.filter((p) =>
        String(p.name ?? "")
          .toLowerCase()
          .includes(search),
      );
    }
    if (params.status !== undefined) {
      plans = plans.filter((p) => p.status === params.status);
    }
    return fmtMany(plans, params);
  }

  return JSON.stringify({
    error: true,
    errorType: "UNSUPPORTED_OPERATION",
    message: `Unsupported operation for servicePlan: ${operation}`,
  });
}

// ---------------------------------------------------------------------------
// Storage Region
// ---------------------------------------------------------------------------

async function executeStorageRegion(
  ctx: IExecuteFunctions,
  operation: string,
  _params: Record<string, unknown>,
): Promise<string> {
  if (operation !== "getMany") {
    return JSON.stringify({
      error: true,
      errorType: "UNSUPPORTED_OPERATION",
      message: `Unsupported operation for storageRegion: ${operation}`,
    });
  }

  const resp = await druvaMspApiRequest.call(
    ctx,
    "GET",
    "/msp/v2/storage-regions",
  );
  const storageRegions =
    ((resp as IDataObject)?.storageRegions as IDataObject[]) ?? [];
  const flatItems: IDataObject[] = [];
  for (const product of storageRegions) {
    const productID = product.productID as number;
    const regions = (product.regions as IDataObject[]) ?? [];
    for (const region of regions) {
      flatItems.push({
        productID,
        name: region.name,
        storageProvider: region.storageProvider,
      });
    }
  }
  return JSON.stringify({ results: flatItems, count: flatItems.length });
}

// ---------------------------------------------------------------------------
// Report - Usage
// ---------------------------------------------------------------------------

async function executeReportUsage(
  ctx: IExecuteFunctions,
  operation: string,
  params: Record<string, unknown>,
): Promise<string> {
  const endpointMap: Record<string, string> = {
    getGlobalReport: "/msp/reporting/v2/reports/mspGlobalUsage",
    getItemizedConsumption: "/msp/reporting/v2/reports/consumptionItemized",
    getItemizedQuota: "/msp/reporting/v2/reports/quotaItemized",
  };
  const endpoint = endpointMap[operation];
  if (!endpoint) {
    return JSON.stringify({
      error: true,
      errorType: "UNSUPPORTED_OPERATION",
      message: `Unsupported operation for reportUsage: ${operation}`,
    });
  }

  const filterBy = buildReportV2FilterBy(params);
  const body = buildReportBody(params, filterBy);
  const resp = await druvaMspApiRequest.call(ctx, "POST", endpoint, body);
  const items = ((resp as IDataObject)?.data as IDataObject[]) ?? [];
  return fmtMany(items, params);
}

// ---------------------------------------------------------------------------
// Report - Cyber Resilience
// ---------------------------------------------------------------------------

async function executeReportCyber(
  ctx: IExecuteFunctions,
  operation: string,
  params: Record<string, unknown>,
): Promise<string> {
  const endpointMap: Record<string, string> = {
    getRollbackActions: "/msp/reporting/v1/reports/mspDGRollbackActions",
    getDataProtectionRisk: "/msp/reporting/v1/reports/mspDGDataProtectionRisk",
  };
  const endpoint = endpointMap[operation];
  if (!endpoint) {
    return JSON.stringify({
      error: true,
      errorType: "UNSUPPORTED_OPERATION",
      message: `Unsupported operation for reportCyber: ${operation}`,
    });
  }

  const filterBy = buildReportFilterBy(params);
  const body = buildReportBody(params, filterBy);
  const resp = await druvaMspApiRequest.call(ctx, "POST", endpoint, body);
  const items = ((resp as IDataObject)?.data as IDataObject[]) ?? [];
  return fmtMany(items, params);
}

// ---------------------------------------------------------------------------
// Report - Endpoint
// ---------------------------------------------------------------------------

async function executeReportEndpoint(
  ctx: IExecuteFunctions,
  operation: string,
  params: Record<string, unknown>,
): Promise<string> {
  const endpointMap: Record<string, string> = {
    getUsers: "/msp/reporting/v1/reports/mspEPUsers",
    getLastBackupStatus: "/msp/reporting/v1/reports/mspEPLastBackupStatus",
    getAlerts: "/msp/reporting/v1/reports/mspEPAlert",
  };
  const endpoint = endpointMap[operation];
  if (!endpoint) {
    return JSON.stringify({
      error: true,
      errorType: "UNSUPPORTED_OPERATION",
      message: `Unsupported operation for reportEndpoint: ${operation}`,
    });
  }

  const filterBy = buildReportFilterBy(params);
  const body = buildReportBody(params, filterBy);
  const resp = await druvaMspApiRequest.call(ctx, "POST", endpoint, body);
  const items = ((resp as IDataObject)?.data as IDataObject[]) ?? [];
  return fmtMany(items, params);
}
