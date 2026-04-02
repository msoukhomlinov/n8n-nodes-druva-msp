import type { IExecuteFunctions, IDataObject } from "n8n-workflow";

import {
  druvaMspApiRequest,
  getTenantCustomerId,
  getDruvaMspAccessToken,
} from "../GenericFunctions";
import {
  wrapSuccess,
  wrapError,
  ERROR_TYPES,
  formatApiError,
  formatMissingIdError,
  formatNotFoundError,
  formatNoResultsFound,
} from "./error-formatter";

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
  "operation", // n8n 2.14+ injects operation into item.json — must strip to prevent API body leaks
]);

// n8n Agent Tool Node v3 injects keys with these prefixes (e.g. Prompt__User_Message_)
// into item.json on the execute() path. Strip them to prevent INVALID_WRITE_FIELDS errors.
const N8N_METADATA_PREFIXES = ["Prompt__"];

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
// Response helpers
// ---------------------------------------------------------------------------

/** Build a standard getMany success envelope with truncation info */
function manySuccess(
  resource: string,
  operation: string,
  items: unknown[],
  params: Record<string, unknown>,
): string {
  const limit = typeof params.limit === "number" ? params.limit : 50;
  const out: Record<string, unknown> = { items, count: items.length };
  if (items.length >= limit) {
    out.truncated = true;
    out.note = `Results capped at ${limit}. Use filters to narrow or increase 'limit' (max 200).`;
  }
  return JSON.stringify(wrapSuccess(resource, operation, out));
}

/** Check if any client-side filters were applied */
function hasFilters(
  params: Record<string, unknown>,
  ...keys: string[]
): boolean {
  return keys.some((k) => params[k] !== undefined && params[k] !== "");
}

/**
 * Client-side date filtering for events — startDate/endDate are NOT valid
 * query params per the Druva API; timeStamp is epoch seconds.
 */
function filterEventsByDate(
  events: IDataObject[],
  params: Record<string, unknown>,
): IDataObject[] {
  let filtered = events;
  if (params.startDate && typeof params.startDate === "string") {
    const startSec = new Date(params.startDate).getTime() / 1000;
    filtered = filtered.filter((e) => Number(e.timeStamp) >= startSec);
  }
  if (params.endDate && typeof params.endDate === "string") {
    const endSec = new Date(params.endDate).getTime() / 1000;
    filtered = filtered.filter((e) => Number(e.timeStamp) <= endSec);
  }
  return filtered;
}

/** Null/empty guard for single-entity responses */
function isNullOrEmpty(resp: unknown): boolean {
  if (resp == null) return true;
  if (Array.isArray(resp) && resp.length === 0) return true;
  if (typeof resp === "object" && Object.keys(resp as object).length === 0)
    return true;
  return false;
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
  // Strip n8n framework metadata (exact keys + prefix-matched keys like Prompt__*)
  const params: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(rawParams)) {
    if (N8N_METADATA_FIELDS.has(key)) continue;
    if (N8N_METADATA_PREFIXES.some((p) => key.startsWith(p))) continue;
    params[key] = value;
  }

  try {
    switch (resource) {
      case "customer":
        return await executeCustomer(context, resource, operation, params);
      case "tenant":
        return await executeTenant(context, resource, operation, params);
      case "admin":
        return await executeAdmin(context, resource, operation, params);
      case "event":
        return await executeEvent(context, resource, operation, params);
      case "task":
        return await executeTask(context, resource, operation, params);
      case "servicePlan":
        return await executeServicePlan(context, resource, operation, params);
      case "storageRegion":
        return await executeStorageRegion(context, resource, operation, params);
      case "reportUsage":
        return await executeReportUsage(context, resource, operation, params);
      case "reportCyber":
        return await executeReportCyber(context, resource, operation, params);
      case "reportEndpoint":
        return await executeReportEndpoint(
          context,
          resource,
          operation,
          params,
        );
      default:
        return JSON.stringify(
          wrapError(
            resource,
            operation,
            ERROR_TYPES.INVALID_OPERATION,
            `Unsupported resource: ${resource}`,
            "Check the resource name and try again.",
          ),
        );
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
  resource: string,
  operation: string,
  params: Record<string, unknown>,
): Promise<string> {
  switch (operation) {
    case "get": {
      if (!params.customerId)
        return JSON.stringify(formatMissingIdError(resource, operation));
      const qs: IDataObject = {};
      if (params.includeFeatures) qs.includeFeatures = true;
      const resp = await druvaMspApiRequest.call(
        ctx,
        "GET",
        `/msp/v3/customers/${params.customerId}`,
        undefined,
        qs,
      );
      if (isNullOrEmpty(resp))
        return JSON.stringify(
          formatNotFoundError(resource, operation, params.customerId as string),
        );
      return JSON.stringify(wrapSuccess(resource, operation, resp));
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

      if (
        hasFilters(params, "customerName", "accountName") &&
        customers.length === 0
      ) {
        return JSON.stringify(
          formatNoResultsFound(resource, operation, {
            customerName: params.customerName,
            accountName: params.accountName,
          }),
        );
      }
      return manySuccess(resource, operation, customers, params);
    }

    case "create": {
      if (!params.customerName) {
        return JSON.stringify(
          formatApiError("customerName is required", resource, operation),
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
      return JSON.stringify(
        wrapSuccess(resource, operation, {
          id: (resp as IDataObject)?.id,
          ...(resp as IDataObject),
        }),
      );
    }

    case "update": {
      if (!params.customerId)
        return JSON.stringify(formatMissingIdError(resource, operation));
      if (!params.customerName) {
        return JSON.stringify(
          formatApiError("customerName is required", resource, operation),
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
      return JSON.stringify(
        wrapSuccess(resource, operation, {
          id: params.customerId,
          ...(resp as IDataObject),
        }),
      );
    }

    case "getToken": {
      if (!params.customerId)
        return JSON.stringify(formatMissingIdError(resource, operation));
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
      if (isNullOrEmpty(resp))
        return JSON.stringify(
          formatNotFoundError(resource, operation, params.customerId as string),
        );
      return JSON.stringify(wrapSuccess(resource, operation, resp));
    }

    default:
      return JSON.stringify(
        wrapError(
          resource,
          operation,
          ERROR_TYPES.INVALID_OPERATION,
          `Unsupported operation for customer: ${operation}`,
          "Check the operation name and try again.",
        ),
      );
  }
}

// ---------------------------------------------------------------------------
// Tenant
// ---------------------------------------------------------------------------

async function executeTenant(
  ctx: IExecuteFunctions,
  resource: string,
  operation: string,
  params: Record<string, unknown>,
): Promise<string> {
  switch (operation) {
    case "get": {
      if (!params.tenantId)
        return JSON.stringify(formatMissingIdError(resource, operation));
      const customerId = await getTenantCustomerId.call(
        ctx,
        params.tenantId as string,
      );
      if (!customerId) {
        return JSON.stringify(
          formatApiError(
            `Could not find customer for tenant ${params.tenantId}`,
            resource,
            operation,
          ),
        );
      }
      const resp = await druvaMspApiRequest.call(
        ctx,
        "GET",
        `/msp/v3/customers/${customerId}/tenants/${params.tenantId}`,
      );
      if (isNullOrEmpty(resp))
        return JSON.stringify(
          formatNotFoundError(resource, operation, params.tenantId as string),
        );
      return JSON.stringify(wrapSuccess(resource, operation, resp));
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

      if (
        hasFilters(
          params,
          "customerId",
          "statusFilter",
          "typeFilter",
          "productFilter",
        ) &&
        tenants.length === 0
      ) {
        return JSON.stringify(
          formatNoResultsFound(resource, operation, {
            customerId: params.customerId,
            statusFilter: params.statusFilter,
            typeFilter: params.typeFilter,
            productFilter: params.productFilter,
          }),
        );
      }
      return manySuccess(resource, operation, tenants, params);
    }

    case "suspend": {
      if (!params.tenantId)
        return JSON.stringify(formatMissingIdError(resource, operation));
      const customerId = await getTenantCustomerId.call(
        ctx,
        params.tenantId as string,
      );
      if (!customerId) {
        return JSON.stringify(
          formatApiError(
            `Could not find customer for tenant ${params.tenantId}`,
            resource,
            operation,
          ),
        );
      }
      const resp = await druvaMspApiRequest.call(
        ctx,
        "POST",
        `/msp/v2/customers/${customerId}/tenants/${params.tenantId}/suspend`,
      );
      return JSON.stringify(
        wrapSuccess(resource, operation, {
          id: params.tenantId,
          ...(resp as IDataObject),
        }),
      );
    }

    case "unsuspend": {
      if (!params.tenantId)
        return JSON.stringify(formatMissingIdError(resource, operation));
      const customerId = await getTenantCustomerId.call(
        ctx,
        params.tenantId as string,
      );
      if (!customerId) {
        return JSON.stringify(
          formatApiError(
            `Could not find customer for tenant ${params.tenantId}`,
            resource,
            operation,
          ),
        );
      }
      const resp = await druvaMspApiRequest.call(
        ctx,
        "POST",
        `/msp/v2/customers/${customerId}/tenants/${params.tenantId}/unsuspend`,
      );
      return JSON.stringify(
        wrapSuccess(resource, operation, {
          id: params.tenantId,
          ...(resp as IDataObject),
        }),
      );
    }

    default:
      return JSON.stringify(
        wrapError(
          resource,
          operation,
          ERROR_TYPES.INVALID_OPERATION,
          `Unsupported operation for tenant: ${operation}`,
          "Check the operation name and try again.",
        ),
      );
  }
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

async function executeAdmin(
  ctx: IExecuteFunctions,
  resource: string,
  operation: string,
  params: Record<string, unknown>,
): Promise<string> {
  if (operation !== "getMany") {
    return JSON.stringify(
      wrapError(
        resource,
        operation,
        ERROR_TYPES.INVALID_OPERATION,
        `Unsupported operation for admin: ${operation}`,
        "Check the operation name and try again.",
      ),
    );
  }

  const limit = typeof params.limit === "number" ? params.limit : 50;
  const qs: IDataObject = { pageSize: String(limit) };
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

  if (hasFilters(params, "email", "role") && admins.length === 0) {
    return JSON.stringify(
      formatNoResultsFound(resource, operation, {
        email: params.email,
        role: params.role,
      }),
    );
  }
  return manySuccess(resource, operation, admins, params);
}

// ---------------------------------------------------------------------------
// Event
// ---------------------------------------------------------------------------

async function executeEvent(
  ctx: IExecuteFunctions,
  resource: string,
  operation: string,
  params: Record<string, unknown>,
): Promise<string> {
  const limit = typeof params.limit === "number" ? params.limit : 50;
  const qs: IDataObject = { pageSize: Math.min(limit, 500) };
  if (params.category) qs.category = params.category;

  if (operation === "getManyMspEvents") {
    // severity is only supported as a query param on the MSP-level events endpoint
    if (params.severity !== undefined)
      qs.syslogSeverity = Number(params.severity);
    const resp = await druvaMspApiRequest.call(
      ctx,
      "GET",
      "/msp/v2/events",
      undefined,
      qs,
    );
    let events = ((resp as IDataObject)?.events as IDataObject[]) || [];

    // Client-side date filtering — startDate/endDate are NOT valid query params
    // per Druva API; timeStamp is epoch seconds
    events = filterEventsByDate(events, params);

    if (
      hasFilters(params, "category", "severity", "startDate", "endDate") &&
      events.length === 0
    ) {
      return JSON.stringify(
        formatNoResultsFound(resource, operation, {
          category: params.category,
          severity: params.severity,
          startDate: params.startDate,
          endDate: params.endDate,
        }),
      );
    }
    return manySuccess(resource, operation, events, params);
  }

  if (operation === "getManyCustomerEvents") {
    if (!params.customerId) {
      return JSON.stringify(formatMissingIdError(resource, operation));
    }
    const resp = await druvaMspApiRequest.call(
      ctx,
      "GET",
      `/msp/v3/customers/${params.customerId}/events`,
      undefined,
      qs,
    );
    let events = ((resp as IDataObject)?.events as IDataObject[]) || [];

    // Client-side date filtering — same as MSP events
    events = filterEventsByDate(events, params);

    if (
      hasFilters(params, "category", "startDate", "endDate") &&
      events.length === 0
    ) {
      return JSON.stringify(
        formatNoResultsFound(resource, operation, {
          customerId: params.customerId,
          category: params.category,
          startDate: params.startDate,
          endDate: params.endDate,
        }),
      );
    }
    return manySuccess(resource, operation, events, params);
  }

  return JSON.stringify(
    wrapError(
      resource,
      operation,
      ERROR_TYPES.INVALID_OPERATION,
      `Unsupported operation for event: ${operation}`,
      "Check the operation name and try again.",
    ),
  );
}

// ---------------------------------------------------------------------------
// Task
// ---------------------------------------------------------------------------

async function executeTask(
  ctx: IExecuteFunctions,
  resource: string,
  operation: string,
  params: Record<string, unknown>,
): Promise<string> {
  if (operation !== "get") {
    return JSON.stringify(
      wrapError(
        resource,
        operation,
        ERROR_TYPES.INVALID_OPERATION,
        `Unsupported operation for task: ${operation}`,
        "Check the operation name and try again.",
      ),
    );
  }
  if (!params.taskId)
    return JSON.stringify(formatMissingIdError(resource, operation));
  const resp = await druvaMspApiRequest.call(
    ctx,
    "GET",
    `/msp/v2/tasks/${params.taskId}`,
  );
  if (isNullOrEmpty(resp))
    return JSON.stringify(
      formatNotFoundError(resource, operation, params.taskId as string),
    );
  return JSON.stringify(wrapSuccess(resource, operation, resp));
}

// ---------------------------------------------------------------------------
// Service Plan
// ---------------------------------------------------------------------------

async function executeServicePlan(
  ctx: IExecuteFunctions,
  resource: string,
  operation: string,
  params: Record<string, unknown>,
): Promise<string> {
  if (operation === "get") {
    if (!params.servicePlanId) {
      return JSON.stringify(formatMissingIdError(resource, operation));
    }
    const resp = await druvaMspApiRequest.call(
      ctx,
      "GET",
      `/msp/v3/servicePlans/${params.servicePlanId}`,
    );
    if (isNullOrEmpty(resp))
      return JSON.stringify(
        formatNotFoundError(
          resource,
          operation,
          params.servicePlanId as string,
        ),
      );
    return JSON.stringify(wrapSuccess(resource, operation, resp));
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

    if (hasFilters(params, "nameContains", "status") && plans.length === 0) {
      return JSON.stringify(
        formatNoResultsFound(resource, operation, {
          nameContains: params.nameContains,
          status: params.status,
        }),
      );
    }
    return manySuccess(resource, operation, plans, params);
  }

  return JSON.stringify(
    wrapError(
      resource,
      operation,
      ERROR_TYPES.INVALID_OPERATION,
      `Unsupported operation for servicePlan: ${operation}`,
      "Check the operation name and try again.",
    ),
  );
}

// ---------------------------------------------------------------------------
// Storage Region
// ---------------------------------------------------------------------------

async function executeStorageRegion(
  ctx: IExecuteFunctions,
  resource: string,
  operation: string,
  _params: Record<string, unknown>,
): Promise<string> {
  if (operation !== "getMany") {
    return JSON.stringify(
      wrapError(
        resource,
        operation,
        ERROR_TYPES.INVALID_OPERATION,
        `Unsupported operation for storageRegion: ${operation}`,
        "Check the operation name and try again.",
      ),
    );
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
  return JSON.stringify(
    wrapSuccess(resource, operation, {
      items: flatItems,
      count: flatItems.length,
    }),
  );
}

// ---------------------------------------------------------------------------
// Report - Usage
// ---------------------------------------------------------------------------

async function executeReportUsage(
  ctx: IExecuteFunctions,
  resource: string,
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
    return JSON.stringify(
      wrapError(
        resource,
        operation,
        ERROR_TYPES.INVALID_OPERATION,
        `Unsupported operation for reportUsage: ${operation}`,
        "Check the operation name and try again.",
      ),
    );
  }

  const filterBy = buildReportV2FilterBy(params);
  const body = buildReportBody(params, filterBy);
  const resp = await druvaMspApiRequest.call(ctx, "POST", endpoint, body);
  const items = ((resp as IDataObject)?.data as IDataObject[]) ?? [];

  if (
    hasFilters(params, "startDate", "endDate", "customerIds") &&
    items.length === 0
  ) {
    return JSON.stringify(
      formatNoResultsFound(resource, operation, {
        startDate: params.startDate,
        endDate: params.endDate,
        customerIds: params.customerIds,
      }),
    );
  }
  return manySuccess(resource, operation, items, params);
}

// ---------------------------------------------------------------------------
// Report - Cyber Resilience
// ---------------------------------------------------------------------------

async function executeReportCyber(
  ctx: IExecuteFunctions,
  resource: string,
  operation: string,
  params: Record<string, unknown>,
): Promise<string> {
  const endpointMap: Record<string, string> = {
    getRollbackActions: "/msp/reporting/v1/reports/mspDGRollbackActions",
    getDataProtectionRisk: "/msp/reporting/v1/reports/mspDGDataProtectionRisk",
  };
  const endpoint = endpointMap[operation];
  if (!endpoint) {
    return JSON.stringify(
      wrapError(
        resource,
        operation,
        ERROR_TYPES.INVALID_OPERATION,
        `Unsupported operation for reportCyber: ${operation}`,
        "Check the operation name and try again.",
      ),
    );
  }

  const filterBy = buildReportFilterBy(params);
  const body = buildReportBody(params, filterBy);
  const resp = await druvaMspApiRequest.call(ctx, "POST", endpoint, body);
  const items = ((resp as IDataObject)?.data as IDataObject[]) ?? [];

  if (
    hasFilters(params, "startDate", "endDate", "customerIds") &&
    items.length === 0
  ) {
    return JSON.stringify(
      formatNoResultsFound(resource, operation, {
        startDate: params.startDate,
        endDate: params.endDate,
        customerIds: params.customerIds,
      }),
    );
  }
  return manySuccess(resource, operation, items, params);
}

// ---------------------------------------------------------------------------
// Report - Endpoint
// ---------------------------------------------------------------------------

async function executeReportEndpoint(
  ctx: IExecuteFunctions,
  resource: string,
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
    return JSON.stringify(
      wrapError(
        resource,
        operation,
        ERROR_TYPES.INVALID_OPERATION,
        `Unsupported operation for reportEndpoint: ${operation}`,
        "Check the operation name and try again.",
      ),
    );
  }

  const filterBy = buildReportFilterBy(params);
  const body = buildReportBody(params, filterBy);
  const resp = await druvaMspApiRequest.call(ctx, "POST", endpoint, body);
  const items = ((resp as IDataObject)?.data as IDataObject[]) ?? [];

  if (
    hasFilters(params, "startDate", "endDate", "customerIds") &&
    items.length === 0
  ) {
    return JSON.stringify(
      formatNoResultsFound(resource, operation, {
        startDate: params.startDate,
        endDate: params.endDate,
        customerIds: params.customerIds,
      }),
    );
  }
  return manySuccess(resource, operation, items, params);
}
