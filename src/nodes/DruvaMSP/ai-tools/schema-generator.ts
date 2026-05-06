import { z } from "zod";

// ---------------------------------------------------------------------------
// Common base schemas
// ---------------------------------------------------------------------------

const limitSchema = z
  .number()
  .int()
  .min(1)
  .max(200)
  .optional()
  .default(50)
  .describe(
    "Maximum records to return (default 50, max 200). Increase if you expect many results.",
  );

const startDateSchema = z
  .string()
  .optional()
  .describe(
    "Start of date range in ISO 8601 UTC format (e.g. 2025-01-01T00:00:00Z). Omit for no lower bound.",
  );

const endDateSchema = z
  .string()
  .optional()
  .describe(
    "End of date range in ISO 8601 UTC format (e.g. 2025-12-31T23:59:59Z). Omit for no upper bound.",
  );

const customerIdsSchema = z
  .array(z.string())
  .optional()
  .describe(
    "Filter by specific customer global IDs (strings). If unknown, call druva_msp_customer with operation 'getMany' first to find customer IDs.",
  );

// ---------------------------------------------------------------------------
// Customer schemas
// ---------------------------------------------------------------------------

export function getCustomerGetSchema() {
  return z.object({
    customerId: z
      .string()
      .describe(
        "Customer ID string (from a prior druva_msp_customer with operation 'getMany' result). Must not be empty.",
      ),
    includeFeatures: z
      .boolean()
      .optional()
      .describe("Include enabled feature details in response."),
  });
}

export function getCustomerGetManySchema() {
  return z.object({
    customerName: z
      .string()
      .optional()
      .describe(
        "Partial text match on customerName (case-insensitive, contains match). ALWAYS use this first for any name lookup.",
      ),
    accountName: z
      .string()
      .optional()
      .describe(
        "Partial text match on accountName (the name shown to the customer).",
      ),
    limit: limitSchema,
  });
}

export function getCustomerCreateSchema() {
  return z.object({
    customerName: z
      .string()
      .min(1)
      .describe("Full name of the new customer. Required."),
    accountName: z
      .string()
      .optional()
      .describe(
        "Display name shown to the customer (defaults to customerName if omitted). Use when you want to hide the internal customer name.",
      ),
    phoneNumber: z.string().optional().describe("Customer phone number."),
    address: z.string().optional().describe("Customer postal address."),
  });
}

export function getCustomerUpdateSchema() {
  return z.object({
    customerId: z
      .string()
      .describe(
        "Customer ID to update (from a prior druva_msp_customer with operation 'getMany' result). Required.",
      ),
    customerName: z
      .string()
      .min(1)
      .describe("Updated full name of the customer. Required."),
    phoneNumber: z
      .string()
      .optional()
      .describe("Updated customer phone number."),
    address: z.string().optional().describe("Updated customer postal address."),
  });
}

export function getCustomerGetTokenSchema() {
  return z.object({
    customerId: z
      .string()
      .describe(
        "Customer ID for which to generate an API token (from a prior druva_msp_customer with operation 'getMany' result). Required.",
      ),
  });
}

// ---------------------------------------------------------------------------
// Tenant schemas
// ---------------------------------------------------------------------------

export function getTenantGetSchema() {
  return z.object({
    tenantId: z
      .string()
      .describe(
        "Tenant ID string (from a prior druva_msp_tenant with operation 'getMany' result). Required.",
      ),
  });
}

export function getTenantGetManySchema() {
  return z.object({
    customerId: z
      .string()
      .optional()
      .describe(
        "Filter by customer ID. If unknown, call druva_msp_customer with operation 'getMany' first to find the customer ID.",
      ),
    statusFilter: z
      .number()
      .int()
      .optional()
      .describe(
        "Filter by tenant status. Values: 1 (Active), 2 (Suspended), 3 (Expired).",
      ),
    typeFilter: z
      .number()
      .int()
      .optional()
      .describe("Filter by tenant type. Values: 1 (Trial), 2 (Paid)."),
    productFilter: z
      .number()
      .int()
      .optional()
      .describe("Filter by numeric product ID."),
    limit: limitSchema,
  });
}

export function getTenantSuspendSchema() {
  return z.object({
    tenantId: z
      .string()
      .describe(
        "Tenant ID to suspend (from a prior druva_msp_tenant with operation 'getMany' result). Required.",
      ),
  });
}

export function getTenantUnsuspendSchema() {
  return z.object({
    tenantId: z
      .string()
      .describe(
        "Tenant ID to unsuspend/restore (from a prior druva_msp_tenant with operation 'getMany' result). Required.",
      ),
  });
}

// ---------------------------------------------------------------------------
// Admin schemas
// ---------------------------------------------------------------------------

export function getAdminGetManySchema() {
  return z.object({
    email: z
      .string()
      .optional()
      .describe("Filter by exact email address of the admin user."),
    role: z
      .array(z.string())
      .optional()
      .describe(
        'Filter by admin role codes. Values: "1" (MSP Super Admin), "2" (MSP Admin), "3" (MSP Read Only), "4" (Customer Admin).',
      ),
    limit: limitSchema,
  });
}

// ---------------------------------------------------------------------------
// Event schemas
// ---------------------------------------------------------------------------

export function getEventGetManyMspEventsSchema() {
  return z.object({
    startDate: startDateSchema,
    endDate: endDateSchema,
    category: z
      .string()
      .optional()
      .describe("Filter by event category. Values: EVENT, AUDIT, ALERT."),
    severity: z
      .string()
      .optional()
      .describe(
        'Filter by syslog severity code. Values: "0" (Emergency), "1" (Alert), "2" (Critical), "3" (Error), "4" (Warning), "5" (Notice), "6" (Info), "7" (Debug).',
      ),
    limit: limitSchema,
  });
}

export function getEventGetManyCustomerEventsSchema() {
  return z.object({
    customerId: z
      .string()
      .describe(
        "Customer ID for which to retrieve events (from a prior druva_msp_customer with operation 'getMany' result). Required.",
      ),
    startDate: startDateSchema,
    endDate: endDateSchema,
    category: z
      .string()
      .optional()
      .describe("Filter by event category. Values: EVENT, AUDIT, ALERT."),
    limit: limitSchema,
  });
}

// ---------------------------------------------------------------------------
// Task schemas
// ---------------------------------------------------------------------------

export function getTaskGetSchema() {
  return z.object({
    taskId: z
      .string()
      .describe(
        "Task ID string returned by async operations like tenant suspend/unsuspend. Required.",
      ),
  });
}

// ---------------------------------------------------------------------------
// Service Plan schemas
// ---------------------------------------------------------------------------

export function getServicePlanGetSchema() {
  return z.object({
    servicePlanId: z
      .string()
      .describe(
        "Service plan ID (from a prior druva_msp_servicePlan with operation 'getMany' result). Required.",
      ),
  });
}

export function getServicePlanGetManySchema() {
  return z.object({
    nameContains: z
      .string()
      .optional()
      .describe(
        "Filter by partial name match (case-insensitive). Use for name lookups.",
      ),
    status: z
      .number()
      .int()
      .optional()
      .describe("Filter by status. Values: 1 (Active), 2 (Inactive)."),
    limit: limitSchema,
  });
}

// ---------------------------------------------------------------------------
// Storage Region schemas
// ---------------------------------------------------------------------------

export function getStorageRegionGetManySchema() {
  return z.object({});
}

// ---------------------------------------------------------------------------
// Report - Usage schemas
// ---------------------------------------------------------------------------

const mspGlobalIdSchema = z
  .string()
  .optional()
  .describe("Filter by MSP global ID (exact match). Omit to include all MSPs.");

const mspNameSchema = z
  .string()
  .optional()
  .describe("Filter by MSP name (exact match). Omit to include all MSPs.");

export function getReportUsageGetGlobalReportSchema() {
  return z.object({
    accountName: z
      .string()
      .optional()
      .describe("Filter by account name (exact match). Omit to include all."),
    customerName: z
      .string()
      .optional()
      .describe("Filter by customer name (exact match). Omit to include all."),
    editions: z
      .array(z.enum(["Business", "Enterprise", "Elite"]))
      .optional()
      .describe(
        "Filter by one or more editions (Business, Enterprise, Elite). Omit to include all.",
      ),
    tenantType: z
      .enum(["Commercial", "Evaluation"])
      .optional()
      .describe(
        "Filter by tenant type: 'Commercial' or 'Evaluation'. Omit to include all.",
      ),
    productModules: z
      .array(z.string())
      .optional()
      .describe(
        "Filter by product module names (e.g. 'Enterprise Workloads', 'Microsoft 365', 'Endpoints', 'Google Workspace'). Omit to include all.",
      ),
    servicePlan: z
      .string()
      .optional()
      .describe(
        "Filter by service plan name (exact match). Omit to include all.",
      ),
    mspGlobalId: mspGlobalIdSchema,
    mspName: mspNameSchema,
    limit: limitSchema,
  });
}

export function getReportUsageGetItemizedConsumptionSchema() {
  return z.object({
    startDate: startDateSchema,
    endDate: endDateSchema,
    customerIds: customerIdsSchema,
    mspGlobalId: mspGlobalIdSchema,
    mspName: mspNameSchema,
    limit: limitSchema,
  });
}

export function getReportUsageGetItemizedQuotaSchema() {
  return z.object({
    startDate: startDateSchema,
    endDate: endDateSchema,
    customerIds: customerIdsSchema,
    mspGlobalId: mspGlobalIdSchema,
    mspName: mspNameSchema,
    limit: limitSchema,
  });
}

// ---------------------------------------------------------------------------
// Report - Cyber Resilience schemas
// ---------------------------------------------------------------------------

export function getReportCyberGetRollbackActionsSchema() {
  return z.object({
    startDate: startDateSchema,
    endDate: endDateSchema,
    customerIds: customerIdsSchema,
    limit: limitSchema,
  });
}

export function getReportCyberGetDataProtectionRiskSchema() {
  return z.object({
    customerIds: customerIdsSchema,
    limit: limitSchema,
  });
}

// ---------------------------------------------------------------------------
// Report - Endpoint schemas
// ---------------------------------------------------------------------------

export function getReportEndpointGetUsersSchema() {
  return z.object({
    startDate: startDateSchema,
    endDate: endDateSchema,
    customerIds: customerIdsSchema,
    limit: limitSchema,
  });
}

export function getReportEndpointGetLastBackupStatusSchema() {
  return z.object({
    customerIds: customerIdsSchema,
    limit: limitSchema,
  });
}

export function getReportEndpointGetAlertsSchema() {
  return z.object({
    startDate: startDateSchema,
    endDate: endDateSchema,
    customerIds: customerIdsSchema,
    limit: limitSchema,
  });
}

// ---------------------------------------------------------------------------
// Schema resolver
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSchema(
  resource: string,
  operation: string,
): z.ZodObject<any> {
  switch (resource) {
    case "customer":
      switch (operation) {
        case "get":
          return getCustomerGetSchema();
        case "getMany":
          return getCustomerGetManySchema();
        case "create":
          return getCustomerCreateSchema();
        case "update":
          return getCustomerUpdateSchema();
        case "getToken":
          return getCustomerGetTokenSchema();
      }
      break;
    case "tenant":
      switch (operation) {
        case "get":
          return getTenantGetSchema();
        case "getMany":
          return getTenantGetManySchema();
        case "suspend":
          return getTenantSuspendSchema();
        case "unsuspend":
          return getTenantUnsuspendSchema();
      }
      break;
    case "admin":
      switch (operation) {
        case "getMany":
          return getAdminGetManySchema();
      }
      break;
    case "event":
      switch (operation) {
        case "getManyMspEvents":
          return getEventGetManyMspEventsSchema();
        case "getManyCustomerEvents":
          return getEventGetManyCustomerEventsSchema();
      }
      break;
    case "task":
      switch (operation) {
        case "get":
          return getTaskGetSchema();
      }
      break;
    case "servicePlan":
      switch (operation) {
        case "get":
          return getServicePlanGetSchema();
        case "getMany":
          return getServicePlanGetManySchema();
      }
      break;
    case "storageRegion":
      switch (operation) {
        case "getMany":
          return getStorageRegionGetManySchema();
      }
      break;
    case "reportUsage":
      switch (operation) {
        case "getGlobalReport":
          return getReportUsageGetGlobalReportSchema();
        case "getItemizedConsumption":
          return getReportUsageGetItemizedConsumptionSchema();
        case "getItemizedQuota":
          return getReportUsageGetItemizedQuotaSchema();
      }
      break;
    case "reportCyber":
      switch (operation) {
        case "getRollbackActions":
          return getReportCyberGetRollbackActionsSchema();
        case "getDataProtectionRisk":
          return getReportCyberGetDataProtectionRiskSchema();
      }
      break;
    case "reportEndpoint":
      switch (operation) {
        case "getUsers":
          return getReportEndpointGetUsersSchema();
        case "getLastBackupStatus":
          return getReportEndpointGetLastBackupStatusSchema();
        case "getAlerts":
          return getReportEndpointGetAlertsSchema();
      }
      break;
  }
  return z.object({});
}

// ---------------------------------------------------------------------------
// Unified schema builder — merges per-operation schemas into a single z.object
// with a required 'operation' enum field.
// ---------------------------------------------------------------------------

const OPERATION_LABELS: Record<string, string> = {
  get: "Get by ID",
  getMany: "List/Search",
  create: "Create",
  update: "Update",
  getToken: "Get Token",
  suspend: "Suspend",
  unsuspend: "Unsuspend",
  getManyMspEvents: "List MSP Events",
  getManyCustomerEvents: "List Customer Events",
  getRollbackActions: "Get Rollback Actions",
  getDataProtectionRisk: "Get Data Protection Risk",
  getUsers: "Get Users",
  getLastBackupStatus: "Get Last Backup Status",
  getAlerts: "Get Alerts",
  getGlobalReport: "Get Global Report",
  getItemizedConsumption: "Get Itemized Consumption",
  getItemizedQuota: "Get Itemized Quota",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildUnifiedSchema(
  resource: string,
  operations: string[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): z.ZodObject<any> {
  if (operations.length === 0) {
    return z.object({
      operation: z.string().describe("Operation to perform"),
    });
  }

  const operationEnum = z
    .enum(operations as [string, ...string[]])
    .describe(
      `Operation to perform. Allowed: ${operations.map((op) => `'${op}' (${OPERATION_LABELS[op] ?? op})`).join(", ")}.`,
    );

  // Collect field schemas and track which operations use each field
  const fieldSources = new Map<string, z.ZodTypeAny>();
  const fieldOps = new Map<string, Set<string>>();

  for (const operation of operations) {
    const schema = getSchema(resource, operation);
    const shape = schema.shape as Record<string, z.ZodTypeAny>;
    for (const [field, fieldSchema] of Object.entries(shape)) {
      if (!fieldSources.has(field)) fieldSources.set(field, fieldSchema);
      if (!fieldOps.has(field)) fieldOps.set(field, new Set<string>());
      fieldOps.get(field)?.add(operation);
    }
  }

  // Build merged shape: operation enum (required) + all fields (optional)
  const mergedShape: Record<string, z.ZodTypeAny> = {
    operation: operationEnum,
  };

  for (const [field, fieldSchema] of fieldSources.entries()) {
    const opsForField = Array.from(fieldOps.get(field) ?? []);
    const baseDescription = fieldSchema.description ?? "";
    const opsDescription = `Used by: ${opsForField.map((op) => OPERATION_LABELS[op] ?? op).join(", ")}.`;
    const description = baseDescription
      ? `${baseDescription} ${opsDescription}`
      : opsDescription;
    mergedShape[field] = fieldSchema.optional().describe(description);
  }

  return z.object(mergedShape);
}
