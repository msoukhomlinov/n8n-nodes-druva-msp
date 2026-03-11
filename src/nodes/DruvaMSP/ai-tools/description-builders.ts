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
    "If you only have a name, call druva_msp_customer_getMany with the customerName filter first, " +
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
    "call druva_msp_customer_getMany with customerName filter first to get the customerId. " +
    "Required: customerId and customerName. Optional: phoneNumber, address."
  );
}

export function buildCustomerGetTokenDescription(): string {
  return (
    "Generate a customer-specific API access token for a Druva MSP Customer. " +
    "PREREQUISITE: you need the customerId. " +
    "If you only have a name, call druva_msp_customer_getMany first to get the customerId. " +
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
    "If you only have a name or customer, call druva_msp_tenant_getMany with filters first, " +
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
    "If you only have a name or customer, call druva_msp_tenant_getMany first to get the tenantId. " +
    "Returns a task object — use druva_msp_task_getById to monitor completion."
  );
}

export function buildTenantUnsuspendDescription(): string {
  return (
    "Unsuspend (restore access to) a previously suspended Druva MSP Tenant by tenant ID. " +
    "PREREQUISITE: you need the tenantId. " +
    "If you only have a name or customer, call druva_msp_tenant_getMany first to get the tenantId. " +
    "Returns a task object — use druva_msp_task_getById to monitor completion."
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
    "Call druva_msp_customer_getMany with customerName filter first if you only have a name. " +
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
    "If you only have a name, call druva_msp_servicePlan_getMany first to find the plan."
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
