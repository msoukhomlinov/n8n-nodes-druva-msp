/** Inject current UTC time so the LLM does not assume training cutoff = now */
export function dateTimeReferenceSnippet(referenceUtc: string): string {
  return `Reference: current UTC when these tools were loaded is ${referenceUtc}. Use this for "today" or "recent" queries — do not assume a different date. `;
}

// ---------------------------------------------------------------------------
// Customer
// ---------------------------------------------------------------------------

export function buildCustomerGetDescription(): string {
  return (
    "Fetch a single Druva MSP Customer record by its customer ID string. " +
    "ONLY call this when you already have a customer ID — never pass a name. " +
    "If you only have a name, call druva_msp_customer with operation 'getMany' with the customerName filter first, " +
    "extract the customerId from results, then call this."
  );
}

export function buildCustomerGetManyDescription(): string {
  return (
    "Search and list Druva MSP Customer records. " +
    "Use customerName for partial-text name lookup. " +
    "Results contain a customerId field on each record — capture this for subsequent get, update, or getToken calls. " +
    "Increase limit (max 200) if you expect many results."
  );
}

export function buildCustomerCreateDescription(): string {
  return (
    "Create a new Druva MSP Customer. " +
    "Required field: customerName. " +
    "Optional: accountName (display name shown to customer), phoneNumber, address. " +
    "On success returns the created customer record including its customerId."
  );
}

export function buildCustomerUpdateDescription(): string {
  return (
    "Update an existing Druva MSP Customer by customer ID. " +
    "PREREQUISITE: you need the customerId. If you only have a name, " +
    "call druva_msp_customer with operation 'getMany' with customerName filter first to get the customerId. " +
    "Required: customerId and customerName. Optional: phoneNumber, address."
  );
}

export function buildCustomerGetTokenDescription(): string {
  return (
    "Generate a customer-specific API access token for a Druva MSP Customer. " +
    "PREREQUISITE: you need the customerId. " +
    "If you only have a name, call druva_msp_customer with operation 'getMany' first to get the customerId. " +
    "Returns an access token that can be used to call Druva APIs on behalf of the customer."
  );
}

// ---------------------------------------------------------------------------
// Tenant
// ---------------------------------------------------------------------------

export function buildTenantGetDescription(): string {
  return (
    "Fetch a single Druva MSP Tenant record by its tenant ID string. " +
    "ONLY call this when you already have a tenant ID. " +
    "If you only have a name or customer, call druva_msp_tenant with operation 'getMany' with filters first, " +
    "extract the tenantId, then call this."
  );
}

export function buildTenantGetManyDescription(): string {
  return (
    "Search and list Druva MSP Tenant records across all customers. " +
    "Filter by customerId, statusFilter (1=Active, 2=Suspended, 3=Expired), " +
    "typeFilter (1=Trial, 2=Paid), or productFilter (numeric product ID). " +
    "Results contain tenantId on each record — capture for subsequent get, suspend, or unsuspend calls. " +
    "Increase limit (max 200) if you expect many results."
  );
}

export function buildTenantSuspendDescription(): string {
  return (
    "Suspend a Druva MSP Tenant by tenant ID, preventing user access. " +
    "PREREQUISITE: you need the tenantId. " +
    "If you only have a name or customer, call druva_msp_tenant with operation 'getMany' first to get the tenantId. " +
    "Returns a task object — use druva_msp_task with operation 'get' to monitor completion."
  );
}

export function buildTenantUnsuspendDescription(): string {
  return (
    "Unsuspend (restore access to) a previously suspended Druva MSP Tenant by tenant ID. " +
    "PREREQUISITE: you need the tenantId. " +
    "If you only have a name or customer, call druva_msp_tenant with operation 'getMany' first to get the tenantId. " +
    "Returns a task object — use druva_msp_task with operation 'get' to monitor completion."
  );
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export function buildAdminGetManyDescription(): string {
  return (
    "List Druva MSP Admin users. " +
    "Filter by email (exact match) or role (1=MSP Super Admin, 2=MSP Admin, 3=MSP Read Only, 4=Customer Admin). " +
    "Results contain admin id, email, role, and status fields."
  );
}

// ---------------------------------------------------------------------------
// Event
// ---------------------------------------------------------------------------

export function buildEventGetManyMspEventsDescription(
  referenceUtc: string,
): string {
  return (
    dateTimeReferenceSnippet(referenceUtc) +
    "List Druva MSP-level audit and system events. " +
    "Filter by date range (ISO 8601 UTC), event category (EVENT, AUDIT, ALERT), or severity (0=Emergency to 7=Debug). " +
    "Results contain timeStamp (epoch seconds) and a derived dateTime (ISO 8601) field for readability."
  );
}

export function buildEventGetManyCustomerEventsDescription(
  referenceUtc: string,
): string {
  return (
    dateTimeReferenceSnippet(referenceUtc) +
    "List events for a specific Druva MSP Customer. " +
    "PREREQUISITE: you need the customerId. " +
    "Call druva_msp_customer with operation 'getMany' with customerName filter first if you only have a name. " +
    "Note: Druva recommends polling at most once per 30 minutes per customer to avoid rate limits."
  );
}

// ---------------------------------------------------------------------------
// Task
// ---------------------------------------------------------------------------

export function buildTaskGetDescription(): string {
  return (
    "Fetch the current status of a Druva MSP async task by task ID. " +
    "Task IDs are returned by tenant suspend/unsuspend and other async operations. " +
    "Status values: 1=In Progress, 2=Completed, 3=Failed. " +
    "Poll periodically until status is 2 (Completed) or 3 (Failed)."
  );
}

// ---------------------------------------------------------------------------
// Service Plan
// ---------------------------------------------------------------------------

export function buildServicePlanGetDescription(): string {
  return (
    "Fetch a single Druva MSP Service Plan by its numeric or string service plan ID. " +
    "ONLY call this when you already have a service plan ID. " +
    "If you only have a name, call druva_msp_servicePlan with operation 'getMany' first to find the plan."
  );
}

export function buildServicePlanGetManyDescription(): string {
  return (
    "List Druva MSP Service Plans with optional filters. " +
    "Filter by name (partial match via nameContains), status (1=Active, 2=Inactive), " +
    "edition name, or feature name. " +
    "Results contain the service plan ID needed for tenant provisioning."
  );
}

// ---------------------------------------------------------------------------
// Storage Region
// ---------------------------------------------------------------------------

export function buildStorageRegionGetManyDescription(): string {
  return (
    "List all available Druva MSP storage regions by product. " +
    "Returns a flat list of regions with productID, name, and storageProvider (1=AWS, 2=Azure). " +
    "Use the region name when creating tenants to specify storage location."
  );
}

// ---------------------------------------------------------------------------
// Report - Usage
// ---------------------------------------------------------------------------

export function buildReportUsageGetGlobalReportDescription(
  referenceUtc: string,
): string {
  return (
    dateTimeReferenceSnippet(referenceUtc) +
    "Retrieve the global MSP usage report showing consumption across all customers. " +
    "Filter by date range (ISO 8601 UTC strings). " +
    "Returns itemized consumption records with product, edition, and usage amount details."
  );
}

export function buildReportUsageGetItemizedConsumptionDescription(
  referenceUtc: string,
): string {
  return (
    dateTimeReferenceSnippet(referenceUtc) +
    "Retrieve itemized consumption report showing detailed usage per tenant. " +
    "Filter by date range and/or specific customer IDs (array of customer global ID strings). " +
    "Returns per-tenant, per-product consumption data."
  );
}

export function buildReportUsageGetItemizedQuotaDescription(
  referenceUtc: string,
): string {
  return (
    dateTimeReferenceSnippet(referenceUtc) +
    "Retrieve itemized quota report showing quota allocation vs usage per tenant. " +
    "Filter by date range and/or specific customer IDs (array of customer global ID strings). " +
    "Returns quota limits and current usage figures per tenant."
  );
}

// ---------------------------------------------------------------------------
// Report - Cyber Resilience
// ---------------------------------------------------------------------------

export function buildReportCyberGetRollbackActionsDescription(
  referenceUtc: string,
): string {
  return (
    dateTimeReferenceSnippet(referenceUtc) +
    "Retrieve cyber resilience rollback actions report. " +
    "Shows ransomware rollback/restore actions taken across all customers. " +
    "Filter by date range (ISO 8601 UTC) and/or customer IDs. " +
    "Returns action type, entity type, customer, and timestamp for each rollback event."
  );
}

export function buildReportCyberGetDataProtectionRiskDescription(
  referenceUtc: string,
): string {
  return (
    dateTimeReferenceSnippet(referenceUtc) +
    "Retrieve data protection risk report identifying at-risk workloads. " +
    "Shows workloads with missed backups, connectivity issues, or stale snapshots. " +
    "Filter by customer IDs and/or workload types. " +
    "Use to identify customers or tenants needing attention."
  );
}

// ---------------------------------------------------------------------------
// Report - Endpoint
// ---------------------------------------------------------------------------

export function buildReportEndpointGetUsersDescription(
  referenceUtc: string,
): string {
  return (
    dateTimeReferenceSnippet(referenceUtc) +
    "Retrieve endpoint user report showing all protected endpoint users across customers. " +
    "Filter by date range and/or customer IDs. " +
    "Returns user name, email, backup status, and device count per user."
  );
}

export function buildReportEndpointGetLastBackupStatusDescription(): string {
  return (
    "Retrieve last backup status report for all endpoint devices across customers. " +
    "Shows the most recent backup status for each device. " +
    "Filter by customer IDs (array of customer global ID strings). " +
    "Returns device name, user, last backup time, and backup status."
  );
}

export function buildReportEndpointGetAlertsDescription(
  referenceUtc: string,
): string {
  return (
    dateTimeReferenceSnippet(referenceUtc) +
    "Retrieve endpoint alerts report showing backup failure and warning alerts. " +
    "Filter by date range and/or customer IDs. " +
    "Returns alert type, severity, device, user, and timestamp for each alert."
  );
}

// ---------------------------------------------------------------------------
// Unified description builder — composes per-operation summaries into a
// single description for the unified tool.
// ---------------------------------------------------------------------------

const RESOURCE_INTROS: Record<string, string> = {
  admin: "Manage Druva MSP administrator accounts.",
  customer: "Manage Druva MSP customer organisations.",
  event: "Query Druva MSP audit events and alerts.",
  reportCyber: "Query Druva MSP cyber resilience reports.",
  reportEndpoint: "Query Druva MSP endpoint backup reports.",
  reportUsage: "Query Druva MSP usage and consumption reports.",
  servicePlan: "Manage Druva MSP service plans.",
  storageRegion: "Query available Druva MSP storage regions.",
  task: "Check status of Druva MSP async tasks.",
  tenant: "Manage Druva MSP tenant environments.",
};

// Resources that need UTC reference in their descriptions
const DATETIME_RESOURCES = new Set([
  "event",
  "reportCyber",
  "reportEndpoint",
  "reportUsage",
]);

/**
 * Builds per-operation description using existing per-op builders.
 * Returns the builder output truncated to first sentence for brevity.
 */
function getOperationSummary(
  resource: string,
  operation: string,
  referenceUtc: string,
): string {
  const full = buildToolDescriptionForOp(resource, operation, referenceUtc);
  // Strip the dateTimeReferenceSnippet prefix if present (it's added at unified level)
  const stripped = full.replace(
    /^Reference: current UTC.*?queries — do not assume a different date\. /,
    "",
  );
  // Take first sentence only
  const firstSentence = stripped.split(". ")[0];
  return firstSentence.endsWith(".") ? firstSentence : firstSentence + ".";
}

/** Dispatch to existing per-operation description builders */
function buildToolDescriptionForOp(
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

export function buildUnifiedDescription(
  resource: string,
  operations: string[],
  referenceUtc: string,
): string {
  const intro = RESOURCE_INTROS[resource] ?? `Manage Druva MSP ${resource}.`;
  const parts: string[] = [];

  // Add datetime reference for time-sensitive resources
  if (DATETIME_RESOURCES.has(resource)) {
    parts.push(dateTimeReferenceSnippet(referenceUtc));
  }

  parts.push(`${intro} Choose an operation:`);

  for (const op of operations) {
    const summary = getOperationSummary(resource, op, referenceUtc);
    parts.push(`- ${op}: ${summary}`);
  }

  return parts.join("\n");
}
