# Changelog

All notable changes to the n8n-nodes-druva-msp package will be documented in this file.


## [Unreleased]

### Added

- **Tenant Config - Enterprise Workloads resource (read-only)**: policies, backup sets, jobs, content rules, proxies, hosts, servers, instances per workload (VMware, SQL Server, NAS, FileServer, HyperV, AHV, Oracle SBT, Phoenix Backup Store) plus CloudCache Config and Storage Usage (Cross-Workload). Calls Druva data-plane APIs using customer-scoped Bearer tokens.
- **Tenant Config - inSync resource (read-only)**: profiles, AD connectors, audit settings, legal holds v4 (policies + clients), M365/Gmail app status, OneDrive/Exchange restore points, SharePoint site collections + restore points, protected cloud app devices, inSync users.
- **Customer-scoped token exchange** via `POST /msp/v2/customers/{customerID}/token` with per-execution WeakMap caching and 401-triggered token invalidation + retry.
- **Org discovery** via `/organization/v1/orgs` to bridge MSP tenant UUIDs and data-plane integer OrgIDs. Auto/All/Specific org-scope modes on the Enterprise Workloads resource.


## [1.6.5] - 2026-05-06

### Added

- **Report - Usage — MSP Global ID and MSP Name filters**: `getGlobalReport`, `getItemizedConsumption`, and `getItemizedQuota` now support filtering by `mspGlobalId` (exact match) and `mspName` (exact match), exposed as boolean toggles in the UI and as optional params in AI tools. These are v3-only filter fields.
- **Report - Usage — Global Usage additional filters**: `getGlobalReport` now exposes all v3 swagger-supported filter fields: `accountName`, `customerName`, `editions` (multi-select: Business/Enterprise/Elite), `tenantType` (Commercial/Evaluation), `productModules` (Enterprise Workloads/Microsoft 365/Endpoints/Google Workspace), and `servicePlan` (exact name match). All exposed in UI (boolean toggles) and AI tools schema.

### Changed

- **Report - Usage — migrate 3 endpoints to v3**: `getGlobalReport`, `getItemizedConsumption`, and `getItemizedQuota` now call `/msp/reporting/v3/reports/` endpoints (`mspGlobalUsage`, `consumptionItemized`, `quotaItemized`). The v2 equivalents were deprecated August 28, 2026. Request body structure, filters, and pagination are identical — no workflow changes required.
- **Report - Usage — `getGlobalReport` date filter removed**: the v3 `mspGlobalUsage` swagger schema (`FilterAttributeForGlobalUsageV3`) does not include `date` as a valid filter field — the endpoint returns a billing snapshot with no date dimension. Date selection UI and filter logic removed from `getGlobalReport`; date filtering remains unchanged for `getItemizedConsumption` and `getItemizedQuota`.

### Fixed

- **AI tools — Report Usage date filter field name**: `buildReportV2FilterBy` was sending `fieldName: "startDate"` and `fieldName: "endDate"` — invalid field names rejected by the v3 API. Fixed to use `fieldName: "date"` (the only valid date field per the v3 swagger), matching the non-AI execute path.
- **AI tools — Report Usage mspGlobalId/mspName not applied**: `buildReportV2FilterBy` checked `hasFilters` for `mspGlobalId`/`mspName` but did not add them to the filter array. Both now correctly added for `getItemizedConsumption`/`getItemizedQuota`.
- **AI tools — `getGlobalReport` used wrong filter builder**: `buildReportV2FilterBy` (which adds `date` and `customerGlobalId` filters) was used for all three operations, including `getGlobalReport`. The global usage endpoint rejects both field names. `getGlobalReport` now uses a dedicated `buildGlobalUsageFilterBy` with only the fields valid per `FilterAttributeForGlobalUsageV3`.

## [1.6.4] - 2026-05-05

### Fixed

- **Consumption Billing Analyzer — `druvaApi` seat-based `usageAmount` 30× overstatement**: the formula `totalUsage × (30 / totalDays)` was equivalent to `average × 30`, producing ~30× inflated values (e.g. 6376 users instead of ~219). Fixed to `totalUsage / 30` (Druva's 30-day seat billing normalisation). For a 31-day month the corrected result is `average × 31/30` (~3.3% above calendar average), correctly reflecting what Druva charges. `calc_dayFactor` updated from `30/totalDays` to `totalDays/30` for consistency with the average method's diagnostic semantics.

## [1.6.3] - 2026-05-05

### Fixed

- **Consumption Billing Analyzer — `druvaApi` option label and description**: renamed option from "Druva API (÷30 Normalized)" to "Druva API (Billing Accurate)" and updated description to cover both seat (`×30/totalDays`) and storage (`×totalDays×12/365`) adjustments.

## [1.6.2] - 2026-05-05

### Added

- **Consumption Billing Analyzer — `druvaApi` calculation method**: new option "Druva API (÷30 Normalized)" that applies Druva's actual internal billing formulae to both seat and storage items, making `expectedCU = price_CUPerUnit × usageAmount ≈ cuConsumed`.
  - **Seat-based items** (`usageUnit` matches `user`/`seat`, case-insensitive): `adjustedUsage = rawSum × (30 / totalDays)` — normalises to Druva's 30-day seat denominator (+3.33% for 31-day months, −6.67% for February).
  - **Storage items** (`usageUnit` matches `tb`/`gb`, etc.): `adjustedUsage = averageDaily × totalDays × (12 / 365)` — matches Druva's `monthly_rate × 12/365` daily storage rate (+1.92% for 31-day months, −1.37% for 30-day months).
  - Every output row includes diagnostic fields: `calc_method`, `calc_totalDays`, `calc_dayFactor`. Storage items additionally include `calc_rawUsageAmount` (pre-adjustment average) and `calc_storageDenominator` (`365/12`).

## [1.6.1] - 2026-05-03

### Added

- **Consumption Billing Analyzer — tenant enrichment**: `analyzeConsumption` and `analyzeConsumptionWithQuota` now append four tenant-sourced fields to every output row, joined on `tenantId` from `GET /msp/v3/tenants`: `activeSince`, `licenseExpiryDate`, `tenantStatus` (raw), `tenantStatus_label`. Tenant and customer data are fetched in parallel after confirming consumption data exists. `keyFieldName` collision guard extended to cover all four enrichment field names.

## [1.6.0] - 2026-04-16

### Added

- **Consumption Billing Analyzer — `analyzeConsumptionWithQuota` operation**: new operation that fetches consumption and quota data in parallel, joins them by customer/product/feature, and appends overage fields (`quotaAllocated`, `quotaConsumed`, `quotaConsumedPercentage`, `isOverQuota`, `overageAmount`, `headroomPercent`) to each flattened consumption row. Supports all existing date, customer, and calculation options. Optional `showOnlyOverages` flag filters results to only customers exceeding their quota allocation.

- **Alert Summary resource** (`alertSummary`): new resource with `getUnifiedAlerts` operation that aggregates alerts from four workloads (Endpoints via `mspEPAlert`, Enterprise Workloads via `mspEWAlertHistory`, Microsoft 365 via `mspM365Alerts`, Google Workspace via `mspGoogleAlerts`) in parallel. All alerts are normalised into a unified schema (`workload`, `customerGlobalId`, `customerName`, `entity`, `alertDetails`, `severity`, `timestamp`, `isActive`, `raw`) and sorted by timestamp descending. Supports workload selection, date range filtering (all/specific/relative), customer filter, and return-all/limit controls.

- **Backup Health Summary resource** (`backupHealthSummary`): new resource with `getBackupHealthByCustomer` operation that fetches endpoint last-backup-status records (`mspEPLastBackupStatus`) and aggregates them into per-customer health summaries. Each summary includes device counts by status (completed/failed/not-started/in-progress), success rate, failure rate, and an `overallHealthStatus` (`healthy` / `warning` / `critical`) determined by a configurable `criticalThresholdPercent` threshold. Results are sorted critical → warning → healthy and support filtering by `returnLevel` (all / unhealthy only / critical only).

## [1.5.1] - 2026-04-02

### Fixed

- **DruvaMspAiTools — strip `Prompt__*` framework fields on execute() path**: n8n Agent Tool Node v3 injects keys like `Prompt__User_Message_` into `item.json` on the `execute()` path (unlike `supplyData()` where Zod strips unknown keys). These leaked into field validation causing `INVALID_WRITE_FIELDS` errors on write operations. Added `N8N_METADATA_PREFIXES` to strip all keys matching the `Prompt__` prefix alongside the existing exact-match set.

## [1.5.0] - 2026-04-02

### Changed

- **DruvaMspAiTools — unified single-tool architecture**: migrated from multi-tool (one `DynamicStructuredTool` per operation, 28 total) to unified single-tool per resource (one tool with an `operation` enum field, 10 total). **Breaking**: tool names changed from `druva_msp_{resource}_{operation}` to `druva_msp_{resource}` — cached MCP tool lists require refresh
- **DruvaMspAiTools — runtime class resolution** (`runtime.ts`): resolves `DynamicStructuredTool` and `Zod` from n8n's module tree via `createRequire()` + Proxy pattern so `instanceof` checks pass across module boundaries; deferred error pattern allows node registration even if resolution fails
- **DruvaMspAiTools — response envelope standard** (`error-formatter.ts`): replaced custom `StructuredToolError`/`fmtSingle`/`fmtMany`/`fmtWrite` with unified `wrapSuccess`/`wrapError` envelope (`schemaVersion: "1"`, consistent `items` key for getMany)
- **DruvaMspAiTools — schema unification** (`schema-generator.ts`, `schema-converter.ts`): added `buildUnifiedSchema()` that merges per-operation Zod schemas into a single `z.object` with required `operation` enum; `toRuntimeZodSchema()` handles Zod v3/v4 dual compatibility
- **DruvaMspAiTools — unified descriptions** (`description-builders.ts`): added `buildUnifiedDescription()` composing per-operation summaries into a single tool description; all `nextAction` strings updated to reference unified tool names
- **DruvaMspAiTools — null/empty guards**: `get` operations now return `ENTITY_NOT_FOUND` for null API responses instead of wrapping null in a success envelope; `getMany` with filters returning zero results now returns `NO_RESULTS_FOUND` with filter context
- **DruvaMspAiTools — event date filtering**: added client-side date filtering for `getManyMspEvents` and `getManyCustomerEvents` operations; `startDate`/`endDate` params were accepted by schema but never applied (Druva event API does not support server-side date filtering)
- **DruvaMspAiTools — event severity scoping**: `severity` filter now only applied to `getManyMspEvents` (not customer events endpoint which does not support it)
- **DruvaMspAiTools — execute() error clarity**: invalid operations now return specific error listing valid operations; pre-2.14 n8n versions receive clear version-requirement message instead of generic error
- **DruvaMspAiTools — admin pageSize**: changed from number to string for consistency with all other endpoints

## [1.4.1] - 2026-04-02

### Fixed

- **DruvaMspAiTools — n8n 2.14+ compatibility**: `execute()` now detects tool invocations via `item.json.operation` (n8n 2.14+) in addition to the legacy `item.json.tool` field; previously all 2.14+ tool calls were misclassified as "Test step" clicks and returned a stub response
- **DruvaMspAiTools — write safety (Layer 3)**: `execute()` now re-checks `allowWriteOperations` before dispatching write operations, closing a bypass where the `supplyData()` filter could be circumvented via direct execute dispatch
- **DruvaMspAiTools — metadata stripping**: added `operation` to `N8N_METADATA_FIELDS` to prevent it leaking into API request bodies via the execute() path

## [1.4.0] - 2026-03-11

### Added

- **`DruvaMspAiTools` node** — AI Agent toolkit exposing 10 Druva MSP resources as LangChain `DynamicStructuredTool` instances: Admin, Customer, Event, Report - Cyber Resilience, Report - Endpoint, Report - Usage, Service Plan, Storage Region, Task, and Tenant. Each resource exposes its key operations with LLM-optimised descriptions and Zod schemas. Write operations (create, update, getToken, suspend, unsuspend) are gated behind an `allowWriteOperations` toggle (default: disabled). Compatible with n8n AI Agent and MCP Trigger nodes across n8n 2.9+ and older versions via runtime StructuredToolkit probe.

## [1.3.0] - 2026-03-02

### Added

- **Constants**: centralised all Druva product and feature display names in two new exported constants — `DRUVA_PRODUCT_NAMES` and `DRUVA_TENANT_FEATURE_NAMES` — so future Druva renames require a single change in `Constants.ts`; includes D365 (Dynamics 365) and SFDC (Salesforce) entries from newer reporting schemas
- **Report - Enterprise Workloads**: four new M365 backup activity operations aligned with Druva swagger
  - Get M365 Groups Backup Activity Report (`/msp/reporting/v1/reports/mspGroupsBackupActivity`)
  - Get M365 Public Folder Backup Activity Report (`/msp/reporting/v1/reports/mspPublicFolderBackupActivity`)
  - Get M365 SharePoint Backup Activity Report (`/msp/reporting/v1/reports/mspSharePointBackupActivity`)
  - Get M365 Teams Backup Activity Report (`/msp/reporting/v1/reports/mspTeamsBackupActivity`)
- **Customer - Create**: optional `Set Attributes` toggle and `Attributes` collection (name/value pairs) to set custom attributes at creation time (e.g. `licenseManagementAllowed`, `dataAccessAllowed`); previously required a separate update call
- **Storage Region resource** (new) — retrieve available storage regions grouped by product via `GET /msp/v2/storage-regions`; response is flattened to per-region items with `productID`, `name`, and `storageProvider` fields
- **Report - Usage**: five new operations aligned with Druva reporting v2 API
  - Get MSP Commit and Balance Report (`/msp/reporting/v2/reports/mspCommitAndBalance`)
  - Get Customer and License Daily Report (`/msp/reporting/v2/reports/mspChargebackLicenseStateReport`)
  - Get Customer and License Monthly Report (`/msp/reporting/v2/reports/mspChargebackLicenseStateMonthlyReport`)
  - Get Chargeback Tenant Consumption Daily Report (`/msp/reporting/v2/reports/mspChargebackTenantConsumptionReport`)
  - Get Chargeback Tenant Consumption Monthly Report (`/msp/reporting/v2/reports/mspChargebackTenantConsumptionMonthlyReport`)
- **Report - Endpoint**: two new operations
  - Get Restore Activity Report (`/msp/reporting/v1/reports/mspEPRestoreActivity`)
  - Get Preserved Users Datasources Report (`/msp/reporting/v1/reports/mspEPPreservedUsersDataSources`)
- **Report - Hybrid Workloads**: 22 new M365 and Google Workspace operations
  - Microsoft 365: Alerts, Groups Discovery, License Usage, Preserved Users Datasources, SharePoint Site Discovery, Storage Consumption, Teams Discovery, User Count and Status, User Last Backup Status, User Provisioning, User Restore Activity, User Workload
  - Google Workspace: Alerts, License Usage, Preserved Users Datasources, Shared Drive Backup Activity, Shared Drive Restore Activity, Storage Consumption, User Count and Status, User Last Backup Status, User Provisioning, User Restore Activity, User Workload
- **Customer - Update**: optional `attributes` field (array of name/value pairs) to set custom attributes on the customer record; the v3 API requires the field to be present (sent as empty array by default)
- **Customer - Get**: `includeFeatures` toggle to include feature entitlement data in the response
- **Tenant - Get**: `includeFeatures` toggle to include feature entitlement data in the response
- **Tenant - Get Many**: `filterByProduct` toggle and product ID picker to filter tenants by product
- **Admin - Get Many**: `filterByIds` toggle and multi-value admin ID input to filter by specific admin IDs

### Changed

- **API page size**: centralised the Druva API maximum page size (`100`) into a single exported constant `API_MAX_PAGE_SIZE` in `helpers/Constants.ts`; all resources (Admin, ConsumptionBillingAnalyzer, Customer, Event, ReportCyber, ReportEndpoint, ReportEnterprise, Tenant, and the shared pagination and report helpers) now reference this constant instead of hard-coding `100`

### Fixed

- **Customer - Get Many**: `returnAll` path was not setting `pageSize` on the initial request, causing the API to use its default page size instead of the maximum (`100`); all customers are now fetched in the fewest possible requests

- **Consumption Billing Analyzer**: byte unit detection now uses exact matching (`"byte"`, `"bytes"`, `"b"`) instead of substring matching; previously any unit containing the letter `"b"` (e.g. `"GB"`, `"TB"`, `"KB"`) incorrectly triggered byte-to-GB/TB conversion on an already-converted value
- **Consumption Billing Analyzer**: redundant second `roundValue()` call removed for non-byte-conversion paths; rounding after byte conversion is preserved
- **Consumption Billing Analyzer**: removed phantom `"none"` value from `IProcessingParams.roundingDirection` type union — the UI never exposes this option and it was unreachable

- **Report - Endpoint - Get Users**: date filter field names corrected from `lastUpdatedTime` to `fromDate` (GTE) and `toDate` (LTE) per the `mspEPUsers` swagger filterBy enum; incorrect field caused API to ignore date filters silently
- **Report - Endpoint - Get License Usage**: same date filter field name correction (`lastUpdatedTime` → `fromDate`/`toDate`) for the `mspEPLicenseUsage` endpoint
- **Report - Cyber Resilience - Get Rollback Actions**: `entityTypes` filter moved from invalid top-level request body property into `filterBy` array with correct singular fieldName `entityType`; was silently ignored by the API when sent at top level. `actionTypes` removed from request (no matching filterBy fieldName in the API schema). Response key corrected from `items` to `data` (both single-page and returnAll paths) matching the `GetRollbackActionsReportDataResponse` schema
- **Report - Cyber Resilience - Get Data Protection Risk**: `workloadTypes` and `connectionStatus` filters moved from invalid top-level request body properties into `filterBy` with correct fieldNames `workloadName` and `connectionStatusToCloud` respectively per the `mspDGDataProtectionRisk` schema. `riskLevels` removed (no matching filterBy fieldName in API schema). Response key corrected from `items` to `data` (both paths)
- **Report - Cyber Resilience - Get Data Protection Risk**: removed non-functional `Filter by Risk Levels` / `Risk Levels` UI controls that silently did nothing (no `riskLevel` fieldName exists in the API schema)
- **Customer**: fixed default operation from invalid `"list"` to `"getMany"`; previously caused the node to render with no operation pre-selected
- **Report - Enterprise Workloads** (renamed): resource display label updated from "Report - Hybrid Workloads" to "Report - Enterprise Workloads" to match Druva's current product name; **breaking** — internal resource value changed from `reportHybrid` to `reportEnterprise`; existing workflows referencing `reportHybrid` must be updated to `reportEnterprise`; source files renamed from `ReportHybrid.*` to `ReportEnterprise.*` and all internal identifiers (`reportHybridOperations`, `reportHybridFields`, `executeReportHybridOperation`) updated accordingly
- **Service Plan - Filter by Feature**: "Hybrid Workloads" option renamed to "Enterprise Workloads" in the feature filter dropdown, matching the API value the endpoint actually expects; previously the stored value `"Hybrid Workloads"` would have been silently rejected or ignored by the API
- **Tenant - Create / Update**: "Hybrid Workloads" renamed to "Enterprise Workloads" in the feature name dropdown to match the API string accepted by `TenantFeaturesV3`; the underlying API value is unchanged
- **Tenant - Get**: `includeFeatures` default changed from `false` to `true` so that feature data is returned out of the box; this data is required to identify Druva Provisioned tenants and support contract-syncing workflows
- **Tenant - Get Many**: `includeFeatures` was hardcoded to `false`, suppressing feature data for all tenants in bulk operations; now always requests features from the API so that `features`, `edition`, and `productID_label` are available as alternatives to service plan lookups
- **Customer - Get / Get Many**: added computed `isDruvaProvisioned` boolean field derived from the `licenseManagementAllowed` customer attribute (`"0"` = Druva Provisioned, `"1"` = MSP Provisioned) as per the Druva MSP product and attribute values specification
- **Tenant - Get / Get Many**: added computed `isDruvaProvisioned` boolean field resolved from the parent customer's `licenseManagementAllowed` attribute — the authoritative definition of provisioning type; for `get`, one additional customer fetch is made using the already-resolved `customerId`; for `getMany`, a single customer list fetch builds an in-memory lookup map applied across all tenants; Druva Provisioned tenants have no MSP-managed service plan (`servicePlanID = -1`) and workflows should use the tenant's own `edition`, `productID_label`, and `features` fields for contract syncing instead

- **Report - Hybrid Workloads**: Enterprise Workloads operations now use token-based pagination (`druvaMspApiRequestAllReportItems`) instead of the page-number-based helper; all operations (M365, Google Workspace, Enterprise Workloads) now use `"data"` as the response key (was `"items"` for M365/Google), matching the actual Druva API response structure
- **Core**: replaced 12-branch `if/else if` resource dispatch in `DruvaMsp.node.ts execute()` with a data-driven registry object — no behaviour change
- **Report - Hybrid Workloads**: removed phantom `getConsumptionByBackupSetReport` operation that referenced non-existent endpoint `mspEWConsumptionByBackupSet`
- **Report - Cyber Resilience**: date filter field name corrected from `fromDate`/`toDate` to `lastUpdatedTime`; operator direction also corrected (start date uses `GTE`, end date uses `LTE`)
- **Event**: removed undocumented `startDate`/`endDate` server-side query parameters (not in Druva API spec); date filtering continues to work via existing client-side `applyRemainingFilters`
- **Event**: page size cap raised from 100 to 500 to match the Druva API documented maximum


## [1.2.0] - 2025-12-13
### Fixed
- Updated Consumption Billing Analyzer and getTenants load options to use v3 customer API endpoints (v2 endpoints returning 403 errors)

## [1.1.0] - 2025-12-09
### Fixed
- Consumption Billing Analyzer now reports `cuConsumed` as total credits over the period (no averaging/high-water), while keeping existing rounding.

## [1.0.0] - 2025-12-09
### Changed
- Tenant get now auto-discovers customer ID via v3 tenant list instead of requiring caller input, returning empty when not found.
- Tenant getMany/query aligns with v3 params (pageSize as string, includeFeatures default false, customerIds filter).
- Customer getMany now exposes includeFeatures toggle (first-page only per API), enforces v3 pageSize cap (1–100), and keeps n8n-standard returnAll/limit without user-facing page tokens.
- **Tenant Update**: Aligned with PATCH API - removed productID, made all fields optional, added isEnabled flag per feature, allows empty attrs arrays, builds conditional payload.

## [0.9.4] - 2025-12-08

### Removed
- **BREAKING**: Removed Task \"Wait for Completion\" operation due to n8n Cloud restrictions on timers in community nodes
- Removed `TimeHelpers` and `TaskHelpers` utilities (timer-based helpers no longer allowed)

### Migration Guide
- Use the existing **Task → Get** operation in a workflow loop with the Wait node:
  1. Call **Task → Get** with `taskId`
  2. Check `status` equals `4` (Finished)
  3. If not finished, add a Wait node (e.g. 5–10 seconds) then loop back to step 1
  4. Continue when `status` is 4

## [0.9.1] - 2025-12-08

### Changed

- Replaced direct `setTimeout` usage in task polling with shared `sleep` helper to satisfy `@n8n/community-nodes/no-restricted-globals` lint rule and keep wait logic centralised.

## [0.9.0] - 2025-12-08

### Changed

- Swapped deprecated `this.helpers.request` calls to `this.helpers.httpRequest` across customer token, shared API, auth, and pagination helpers for compliance with n8n workflow APIs.
- Replaced `setTimeout` polling with `this.helpers.wait` in task polling utilities to satisfy restricted globals rule.
- Moved custom logger to use n8n `LoggerProxy` (debug/info/warn/error) instead of `console` to meet linting requirements.

## [0.8.0] - 2025-12-08

### Changed

- Relative date ranges are now centralised in `helpers/Constants.ts` and reused across all nodes.
- Relative date ranges expanded: `currentMonth` retained; added granular `previousMonth1`-`previousMonth12` options (full calendar months), replacing the old single `previousMonth` entry. Node defaults now point to `previousMonth1`.
- Removed unused dependency `i18n-iso-countries` to reduce install footprint.

## [0.7.0] - 2025-11-23

### Fixed

- **Pagination**: Fixed critical bug in `druvaMspApiRequestAllItems` that affected all operations using pagination (Customer Get Many, Tenant Get Many, Service Plan Get Many, and Consumption Billing Analyzer). Now correctly uses `pageToken` parameter (instead of `nextPageToken`) and respects API requirement that `pageToken` and other query parameters are mutually exclusive. This prevents duplicate results and pagination failures.


## [0.6.0] - 2025-11-17

### Changed

- **Report Usage - Get Global Usage Report**
  - Migrated from deprecated GET endpoint `/msp/v2/reports/usage/summary` to new POST endpoint `/msp/reporting/v2/reports/mspGlobalUsage`
  - Operation now returns itemized consumption records instead of aggregated summary data
  - Added pagination support with `returnAll` and `limit` parameters
  - Date filtering now uses filter-based approach consistent with other v2 reporting endpoints
  - Removed synthetic fields (`balanceDifference`, `commitDifference`) as they are not applicable to itemized data

### Removed

- Druva are deprecating endpoint `/msp/v2/reports/usage/summary` Feb 2026, removing support for now it.

## [0.5.0] - 2025-11-12

### Added

- **Consumption Billing Analyzer**
  - Add Auto-Generated Key option to generate deterministic IDs for database storage. Uses SHA-256 hash based on: customerGlobalId, tenantId, startDate, endDate, productName, productModuleName, editionName, usageDescription
  - Key Field Name option to customise the auto-generated key field name (default: 'id')
  - Field name validation to prevent conflicts with existing record fields
  - All key generation fields are required and validated

## [0.4.0] - 2025-11-12

### Fixed

- Fixed ReportUsage itemized consumption endpoint from `/msp/v2/reports/consumption/itemized/v2` to `/msp/reporting/v2/reports/consumptionItemized`
- Fixed ReportUsage itemized quota endpoint from `/msp/v2/reports/quota/itemized/v2` to `/msp/reporting/v2/reports/quotaItemized`

## [0.3.0] - 2025-11-10

### Added

- **Output Options**
  - Wrap Output Items - New option to wrap all output items into a single item containing an array. When enabled, this prevents the multiplier effect when chaining nodes that perform getMany operations (e.g., get all tenants → get all service plans → get all customers). The wrapped output contains an `items` array with all results and a `count` field indicating the number of items. This ensures the next node in sequence only executes once, regardless of how many items were returned.
- **Credentials**
  - Enable Debug Logging - New toggle option in credentials to control debug logging. When enabled, detailed debug messages are logged to the console for troubleshooting API requests and responses.

### Changed

- Refactored debug logging to be controlled via credentials instead of hardcoded constant. Debug logging is now disabled by default and can be toggled on/off in the credentials section.

### Fixed

- Fixed exponential item multiplication issue when chaining multiple getMany operations in sequence. Previously, each node would execute once per item from the previous node, causing exponential growth (e.g., 5 tenants → 5 executions → 15 total items if each returned 3 items). The new Wrap Output Items option resolves this by ensuring a single output item is always produced when enabled.


## [0.2.0] - 2025-11-09

### Added

- **Tenant Resource**
  - Create - Create a new tenant for a customer (v3 API)
  - Update - Update an existing tenant using PATCH (v3 API)
- **Report Resources**
  - **Hybrid Workloads Reports**
    - M365 Storage Consumption - Retrieve Microsoft 365 storage consumption details with workload name filtering

### Changed

- **Tenant Resource**
  - Updated Get and Get Many operations to use v3 API endpoints (`/msp/v3/customers/{customerID}/tenants/{tenantID}` and `/msp/v3/tenants`)
  - Updated query parameter `pageSize` to be sent as string for v3 API compliance
- **Service Plan Resource**
  - Updated Get and Get Many operations to use v3 API endpoints (`/msp/v3/servicePlans/{servicePlanId}` and `/msp/v3/servicePlans`)
  - Updated query parameter `pageSize` to be sent as string for v3 API compliance
  - Note: v2 endpoints were decommissioned on September 27, 2025
- **Customer Resource**
  - Updated Create, Get, Get Many, and Update operations to use v3 API endpoints (`/msp/v3/customers`)

### Fixed

- Fixed authentication header capitalization (`accept` → `Accept`) and added missing `Accept` header to align with Druva MSP API documentation requirements
- **Customer Resource**
  - Fixed Get Token operation to send form-urlencoded body with `grant_type=client_credentials` per API spec
  - Fixed `pageSize` query parameter to be sent as string for Get Many operation
  - Added features support to Create operation (Security Posture and Observability)


## [0.1.0] - 2025-03-31

### Added

#### Completed and Production-Ready Resources

The following resources have been fully implemented, tested, and are ready for production use:

- **Admin Resource**
  - List Admins - Get a list of all administrators
  - Get Admin - Retrieve details for a specific administrator by ID
  - Create Admin - Create a new administrator
  - Update Admin - Update details for an existing administrator
  - Delete Admin - Remove an administrator

- **Customer Resource**
  - Create - Create a new MSP customer account
  - Get - Retrieve details for a specific customer
  - Get Many - Retrieve a list of customers
  - Get Token - Generate a customer-specific API token
  - Update - Update details of an existing customer

- **Event Resource**
  - Get Many MSP Events - Retrieve events at the MSP level
  - Get Many Customer Events - Retrieve events for a specific customer

- **Tenant Resource**
  - Get - Retrieve details for a specific tenant
  - Get Many - Retrieve a list of tenants
  - Suspend - Suspend a tenant
  - Unsuspend - Unsuspend a tenant

- **Service Plan Resource**
  - Get - Retrieve details for a specific service plan
  - Get Many - Retrieve a list of service plans with filtering by status, name, editions, and features

- **Task Resource**
  - Get - Retrieve details for a specific task

- **Report Resources**
  - **Usage Reports**
    - Global Usage Summary - Retrieve global usage data across all customers
    - Tenant Consumption - Retrieve tenant consumption data
    - Tenant Quota - Retrieve tenant quota information

  - **Cyber Resilience Reports**
    - Rollback Actions - Retrieve data on rollback actions
    - Data Protection Risk - Retrieve data protection risk information

  - **Endpoint Reports**
    - Users - Retrieve endpoint user information
    - User Rollout - Retrieve user rollout statistics
    - User Provisioning - Retrieve user provisioning information
    - License Usage - Retrieve license usage statistics
    - Last Backup Status - Retrieve information on last backup statuses
    - Alerts - Retrieve endpoint alert information
    - Storage Statistics - Retrieve storage statistics
    - Storage Alert - Retrieve storage alert information
    - Cloud Cache Statistics - Retrieve cloud cache statistics

#### In Development Resources

The following resources are implemented but require additional testing:

- **Report Resources**
  - **Hybrid Workloads Reports**
    - Backup Activity - Retrieve backup activity information
    - Consumption by Backup Set - Retrieve consumption data by backup set
    - DR Failback Activity - Retrieve disaster recovery failback information
    - DR Failover Activity - Retrieve disaster recovery failover information
    - DR Replication Activity - Retrieve disaster recovery replication information
    - Resource Status - Retrieve resource status information
    - Alert History - Retrieve alert history information

### Fixed

- Fixed issue with Customer Token generation API requiring form-urlencoded content type
- Sorted Customer operations alphabetically for better usability
- Fixed pagination issue with MSP Events List where the Druva API exhibits unusual behavior - first page returns many items (400+) but subsequent pages return only 1 item. Updated pagination logic to handle this scenario correctly by:
  - Implementing the API's requirement that when using `pageToken`, no other query parameters should be present
  - Adding safeguards against infinite loops by tracking previously seen page tokens
  - Adding detailed logging to monitor pagination behavior
  - Improving cursor-based pagination implementation to respect API design
- Updated Tenant filtering to use a single Customer ID as per API documentation, which only supports filtering by one customer at a time
- Fixed Tenant filtering query parameter name from 'customerId' to 'customerIds' to match the API's expected parameter name
- Fixed Tenant suspend and unsuspend operations to correctly use the customer ID in the API endpoint path, resolving authentication issues when performing these operations

### Changed

- Implemented proper pagination handling for all list endpoints
- Added consistent error handling and logging across all API calls
- Renamed Events operations from 'listMsp' and 'listCustomer' to 'getManyMspEvents' and 'getManyCustomerEvents' for consistency with n8n naming conventions
- Enhanced Customer picklist implementation with alphabetical sorting and improved display names
- Improved error handling and removed excessive debug logging across option loaders
- Next focus area: Complete implementation and testing of the Tenant resource
- Renamed Tenant operation from 'list' to 'getMany' for consistency with n8n naming conventions
- Updated Tenant filtering to use a single customer ID dropdown with dynamic loading of customer options
- Added ApiValueConverters utility with functions to convert numeric API values to human-readable labels:
  - Tenant status codes (0-5) are now displayed with descriptive names (e.g., "Ready", "Suspended")
  - Tenant type codes (1-3) are now displayed with descriptive names (e.g., "Sandbox", "Commercial")
  - Product ID codes (1-2) are now displayed with descriptive names (e.g., "Hybrid Workloads")
  - API responses are automatically enriched with human-readable labels while preserving original values
- Added post-processing filter options for Tenant status and Tenant type in the Get Many operation, allowing users to filter results by these fields using friendly picklists
- Removed complex Tenant operations (Create, Update) due to API complexity and undocumented requirements, focusing on stable read operations (Get, Get Many) and basic write operations (Suspend, Unsuspend) instead
- Next focus area: Implementation and testing of the various Reporting resources
- Renamed Service Plan operation from 'List' to 'Get Many' for consistency with n8n naming conventions
- Enhanced Service Plan responses with human-readable status labels, converting numeric status codes to descriptive text (e.g., 0 → "Updating", 1 → "Ready")
- Added post-API filtering options to Service Plan Get Many operation, allowing users to filter results by editions (Business, Enterprise, Elite) and features (Hybrid Workloads, Microsoft 365, etc.)
- Extended Service Plan filtering capabilities with Status filter (Ready, Updating) and Name contains filter (case-insensitive text search)
- Improved consistency by using shared constants for all status options throughout the codebase
- Applied alphabetical sorting to Service Plan filter options for better usability
- Completed full implementation and testing of the Service Plan resource, including advanced filtering options
- Next focus area: Implementation and testing of the Report Resources for usage tracking, cyber resilience, endpoints, and hybrid workloads

## Notes

This initial release focuses on establishing the core infrastructure for Druva MSP API integration. The Admin, Customer, and Event resources have been thoroughly tested and are considered production-ready. The remaining resources require additional testing before being used in production environments. 
