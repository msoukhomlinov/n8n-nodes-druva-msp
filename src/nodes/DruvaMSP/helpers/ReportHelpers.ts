import type { IDataObject } from 'n8n-workflow';
import {
  REPORT_FIELD_NAMES,
  REPORT_OPERATORS,
  type IReportFilter,
  type ReportFieldName,
  type ReportOperator,
} from './Constants';
import { formatReportDate } from './DateHelpers';
import { logger } from './LoggerHelper';

/**
 * Format a date for use in report filters (RFC3339 format)
 * @param dateTime Date string from n8n
 * @returns Formatted date string in RFC3339 format (e.g., "2023-01-01T00:00:00Z")
 */
// Function is now imported from DateHelpers.ts
// export function formatReportDate(dateTime: string): string {
//   const date = new Date(dateTime);
//   return date.toISOString(); // Return full ISO string which is RFC3339 format
// }

/**
 * Create a single filter object for Druva MSP report APIs
 * @param fieldName Field name from REPORT_FIELD_NAMES
 * @param operator Operator from REPORT_OPERATORS
 * @param value Value for the filter (type depends on field and operator)
 * @returns Filter object that can be used in filterBy arrays
 */
export function createReportFilter(
  fieldName: ReportFieldName,
  operator: ReportOperator,
  value: string | number | boolean | string[] | number[],
): IReportFilter {
  return {
    fieldName,
    operator,
    value,
  };
}

/**
 * Create a date range filter (start and end dates) for Druva MSP report APIs
 * @param startDate Start date string from n8n
 * @param endDate End date string from n8n
 * @returns Array of filter objects for the date range
 */
export function createDateRangeFilter(startDate: string, endDate: string): IReportFilter[] {
  return [
    createReportFilter(REPORT_FIELD_NAMES.DATE, REPORT_OPERATORS.GTE, formatReportDate(startDate)),
    createReportFilter(REPORT_FIELD_NAMES.DATE, REPORT_OPERATORS.LTE, formatReportDate(endDate)),
  ];
}

/**
 * Create a customer filter for Druva MSP report APIs
 * @param customerIds Array of customer IDs to filter by
 * @returns Filter object for customers
 */
export function createCustomerFilter(customerIds: string[]): IReportFilter {
  return createReportFilter(
    REPORT_FIELD_NAMES.CUSTOMER_GLOBAL_ID,
    REPORT_OPERATORS.CONTAINS,
    customerIds,
  );
}

/**
 * Create a tenant filter for Druva MSP report APIs
 * @param tenantIds Array of tenant IDs to filter by
 * @returns Filter object for tenants
 */
export function createTenantFilter(tenantIds: string[]): IReportFilter {
  return createReportFilter(REPORT_FIELD_NAMES.TENANT_ID, REPORT_OPERATORS.CONTAINS, tenantIds);
}

/**
 * Create a product filter for Druva MSP report APIs
 * @param productIds Array of product IDs to filter by
 * @returns Filter object for products
 */
export function createProductFilter(productIds: string[]): IReportFilter {
  return createReportFilter(REPORT_FIELD_NAMES.PRODUCT_ID, REPORT_OPERATORS.CONTAINS, productIds);
}

/**
 * Create a usage description filter for Druva MSP report APIs
 * @param usageDescriptions Array of usage descriptions to filter by
 * @returns Filter object for usage descriptions
 */
export function createUsageDescriptionFilter(usageDescriptions: string[]): IReportFilter {
  return createReportFilter(
    REPORT_FIELD_NAMES.USAGE_DESCRIPTION,
    REPORT_OPERATORS.CONTAINS,
    usageDescriptions,
  );
}

/**
 * Create a service plan filter for Druva MSP report APIs
 * @param servicePlanIds Array of service plan IDs to filter by
 * @returns Filter object for service plans
 */
export function createServicePlanFilter(servicePlanIds: string[]): IReportFilter {
  // Convert first ID to a number as the API expects a single numeric value
  // Druva API expects servicePlanId to be a single integer, not an array
  if (servicePlanIds.length === 0) {
    throw new Error('At least one service plan ID must be provided');
  }

  // Use the first ID in the array and convert it to a number
  const numericId = Number.parseInt(servicePlanIds[0], 10);
  if (Number.isNaN(numericId)) {
    throw new Error('Invalid service plan ID: cannot be converted to a number');
  }

  logger.debug(
    `Report: Creating service plan filter: ID ${servicePlanIds[0]} → ${numericId} (numeric)`,
  );

  return createReportFilter(
    REPORT_FIELD_NAMES.SERVICE_PLAN_ID,
    REPORT_OPERATORS.EQUAL,
    numericId, // Pass single numeric value
  );
}

/**
 * Create a complete filter object for Druva MSP report APIs
 * Use this to build the filters object for the API request
 * @param pageSize Maximum number of records to return (1-100)
 * @param filterBy Array of filter objects
 * @returns Complete filters object for report API requests
 */
export function createReportFilters(pageSize: number, filterBy: IReportFilter[]): IDataObject {
  return {
    pageSize: Math.min(Math.max(1, pageSize), 100), // Ensure pageSize is between 1-100
    filterBy,
  };
}

/**
 * Create option items for report field names (for n8n UI)
 * @returns Array of option items for field names
 */
export async function getReportFieldNameOptions() {
  return [
    { name: 'Date', value: REPORT_FIELD_NAMES.DATE },
    { name: 'Customer ID', value: REPORT_FIELD_NAMES.CUSTOMER_GLOBAL_ID },
    { name: 'Account Name', value: REPORT_FIELD_NAMES.ACCOUNT_NAME },
    { name: 'Tenant ID', value: REPORT_FIELD_NAMES.TENANT_ID },
    { name: 'Product ID', value: REPORT_FIELD_NAMES.PRODUCT_ID },
    { name: 'Product Module ID', value: REPORT_FIELD_NAMES.PRODUCT_MODULE_ID },
    { name: 'Usage Description', value: REPORT_FIELD_NAMES.USAGE_DESCRIPTION },
    { name: 'Edition Name', value: REPORT_FIELD_NAMES.EDITION_NAME },
    { name: 'Service Plan ID', value: REPORT_FIELD_NAMES.SERVICE_PLAN_ID },
    { name: 'Workload Name', value: REPORT_FIELD_NAMES.WORKLOAD_NAME },
  ];
}

/**
 * Create option items for report operators (for n8n UI)
 * @returns Array of option items for operators
 */
export async function getReportOperatorOptions() {
  return [
    { name: 'Equal', value: REPORT_OPERATORS.EQUAL },
    { name: 'Not Equal', value: REPORT_OPERATORS.NOTEQUAL },
    { name: 'Contains (Any Value in Array)', value: REPORT_OPERATORS.CONTAINS },
    { name: 'Less Than', value: REPORT_OPERATORS.LT },
    { name: 'Less Than or Equal', value: REPORT_OPERATORS.LTE },
    { name: 'Greater Than', value: REPORT_OPERATORS.GT },
    { name: 'Greater Than or Equal', value: REPORT_OPERATORS.GTE },
  ];
}

/**
 * Safely cast an array of IDataObject to IReportFilter[]
 * @param filters Array of filter objects
 * @returns Array cast as IReportFilter[]
 */
export function castFiltersArray(filters: IDataObject[]): IReportFilter[] {
  return filters as unknown as IReportFilter[];
}
