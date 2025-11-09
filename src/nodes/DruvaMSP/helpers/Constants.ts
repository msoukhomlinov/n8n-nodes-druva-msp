/**
 * Constants and types for Druva MSP API values
 */

/**
 * Constants for tenant status values
 */
export const TENANT_STATUS = {
  0: 'Creation Pending',
  1: 'Ready',
  2: 'Suspended',
  3: 'Soft Deleted',
  4: 'Being Migrated',
  5: 'Updating',
} as const;

// Define a type for tenant status values
export type TenantStatusCode = keyof typeof TENANT_STATUS;
export type TenantStatusLabel = (typeof TENANT_STATUS)[TenantStatusCode];

/**
 * Constants for tenant type values
 */
export const TENANT_TYPE = {
  1: 'Sandbox',
  2: 'Evaluation (30-day trial)',
  3: 'Commercial',
} as const;

// Define a type for tenant type values
export type TenantTypeCode = keyof typeof TENANT_TYPE;
export type TenantTypeLabel = (typeof TENANT_TYPE)[TenantTypeCode];

/**
 * Constants for product ID values
 */
export const PRODUCT_ID = {
  1: 'Hybrid Workloads',
  2: 'SaaS Apps and Endpoints',
} as const;

// Define a type for product ID values
export type ProductIdCode = keyof typeof PRODUCT_ID;
export type ProductIdLabel = (typeof PRODUCT_ID)[ProductIdCode];

/**
 * Constants for product module ID values
 */
export const PRODUCT_MODULE_ID = {
  1: 'Hybrid Workloads',
  2: 'Microsoft 365',
  3: 'Endpoints',
  4: 'Google Workspace',
} as const;

// Define a type for product module ID values
export type ProductModuleIdCode = keyof typeof PRODUCT_MODULE_ID;
export type ProductModuleIdLabel = (typeof PRODUCT_MODULE_ID)[ProductModuleIdCode];

/**
 * Constants for admin role values
 */
export const ADMIN_ROLES = {
  2: 'MSP Admin',
  3: 'Tenant Admin',
  4: 'Read Only Admin',
} as const;

// Define a type for admin role values
export type AdminRoleCode = keyof typeof ADMIN_ROLES;
export type AdminRoleLabel = (typeof ADMIN_ROLES)[AdminRoleCode];

/**
 * Constants for admin status values
 */
export const ADMIN_STATUSES = {
  0: 'Updating',
  1: 'Ready',
} as const;

// Define a type for admin status values
export type AdminStatusCode = keyof typeof ADMIN_STATUSES;
export type AdminStatusLabel = (typeof ADMIN_STATUSES)[AdminStatusCode];

/**
 * Constants for event category values
 */
export const EVENT_CATEGORIES = {
  EVENT: 'Event',
  AUDIT: 'Audit',
  ALERT: 'Alert',
} as const;

// Define a type for event category values
export type EventCategoryCode = keyof typeof EVENT_CATEGORIES;
export type EventCategoryLabel = (typeof EVENT_CATEGORIES)[EventCategoryCode];

/**
 * Constants for syslog severity values
 */
export const SYSLOG_SEVERITIES = {
  0: 'Emergency (0)',
  1: 'Alert (1)',
  2: 'Critical (2)',
  3: 'Error (3)',
  4: 'Warning (4)',
  5: 'Notice (5)',
  6: 'Informational (6)',
  7: 'Debug (7)',
} as const;

// Define a type for syslog severity values
export type SyslogSeverityCode = keyof typeof SYSLOG_SEVERITIES;
export type SyslogSeverityLabel = (typeof SYSLOG_SEVERITIES)[SyslogSeverityCode];

/**
 * Constants for customer status values
 */
export const CUSTOMER_STATUS = {
  0: 'Creation Pending',
  1: 'Ready',
  2: 'Tenant Processing',
} as const;

// Define a type for customer status values
export type CustomerStatusCode = keyof typeof CUSTOMER_STATUS;
export type CustomerStatusLabel = (typeof CUSTOMER_STATUS)[CustomerStatusCode];

// Add service plan status constants
export const SERVICE_PLAN_STATUS = {
  0: 'Updating',
  1: 'Ready',
};

// Add service plan edition constants
export const SERVICE_PLAN_EDITIONS = {
  business: 'Business',
  enterprise: 'Enterprise',
  elite: 'Elite',
};

// Add service plan feature name constants
export const SERVICE_PLAN_FEATURES = {
  'Hybrid Workloads': 'Hybrid Workloads',
  M365: 'Microsoft 365',
  Endpoints: 'Endpoints',
  'Google Workspace': 'Google Workspace',
  storage: 'Storage',
  sensitiveDataGovernance: 'Sensitive Data Governance',
};

/**
 * Constants for task status values
 */
export const TASK_STATUS = {
  1: 'Queued',
  2: 'In Progress',
  3: 'Paused',
  4: 'Finished',
} as const;

// Define a type for task status values
export type TaskStatusCode = keyof typeof TASK_STATUS;
export type TaskStatusLabel = (typeof TASK_STATUS)[TaskStatusCode];

/**
 * Constants for task output status values
 */
export const TASK_OUTPUT_STATUS = {
  0: 'Success',
  1: 'Failed',
  [-1]: 'Internal Use',
} as const;

// Define a type for task output status values
export type TaskOutputStatusCode = keyof typeof TASK_OUTPUT_STATUS;
export type TaskOutputStatusLabel = (typeof TASK_OUTPUT_STATUS)[TaskOutputStatusCode];

/**
 * Report field names for filtering in Druva MSP Reports API
 * These are used in the filters.filterBy array
 */
export const REPORT_FIELD_NAMES = {
  DATE: 'date',
  CUSTOMER_GLOBAL_ID: 'customerGlobalId',
  ACCOUNT_NAME: 'accountName',
  TENANT_ID: 'tenantId',
  PRODUCT_ID: 'productId',
  PRODUCT_MODULE_ID: 'productModuleId',
  USAGE_DESCRIPTION: 'usageDescription',
  EDITION_NAME: 'editionName',
  SERVICE_PLAN_ID: 'servicePlanId',
  WORKLOAD_NAME: 'workloadName',
} as const;

// Define a type for report field names
export type ReportFieldName = (typeof REPORT_FIELD_NAMES)[keyof typeof REPORT_FIELD_NAMES];

/**
 * Report operators for filtering in Druva MSP Reports API
 * These are used in the filters.filterBy array
 *
 * Note: All string comparisons will be case sensitive.
 */
export const REPORT_OPERATORS = {
  // Return data with exact match for given field name
  EQUAL: 'EQUAL',

  // Return data not matching with given values
  NOTEQUAL: 'NOTEQUAL',

  // Value for this operator will be an array; returns data matching any value in the array
  CONTAINS: 'CONTAINS',

  // Less than comparison
  LT: 'LT',

  // Less than or equal to comparison
  LTE: 'LTE',

  // Greater than comparison
  GT: 'GT',

  // Greater than or equal to comparison
  GTE: 'GTE',
} as const;

// Define a type for report operators
export type ReportOperator = (typeof REPORT_OPERATORS)[keyof typeof REPORT_OPERATORS];

/**
 * Interface for a report filter object
 * Used in filters.filterBy arrays
 */
export interface IReportFilter {
  fieldName: ReportFieldName;
  operator: ReportOperator;
  value: string | number | boolean | string[] | number[];
}
