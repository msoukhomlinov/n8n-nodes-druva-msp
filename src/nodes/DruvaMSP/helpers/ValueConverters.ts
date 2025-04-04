import type { INodePropertyOptions } from 'n8n-workflow';
import type { IDataObject } from 'n8n-workflow';
import type {
  TenantStatusCode,
  TenantTypeCode,
  ProductIdCode,
  ProductModuleIdCode,
  AdminRoleCode,
  AdminStatusCode,
  EventCategoryCode,
  SyslogSeverityCode,
  CustomerStatusCode,
} from './Constants';

import {
  TENANT_STATUS,
  TENANT_TYPE,
  PRODUCT_ID,
  PRODUCT_MODULE_ID,
  ADMIN_ROLES,
  ADMIN_STATUSES,
  EVENT_CATEGORIES,
  SYSLOG_SEVERITIES,
  CUSTOMER_STATUS,
  SERVICE_PLAN_STATUS,
  SERVICE_PLAN_EDITIONS,
  SERVICE_PLAN_FEATURES,
  TASK_STATUS,
  TASK_OUTPUT_STATUS,
} from './Constants';

/**
 * Convert a tenant status code to its human-readable label
 */
export function getTenantStatusLabel(statusCode: number): string {
  return TENANT_STATUS[statusCode as TenantStatusCode] || `Unknown Status (${statusCode})`;
}

/**
 * Convert a tenant type code to its human-readable label
 */
export function getTenantTypeLabel(typeCode: number): string {
  return TENANT_TYPE[typeCode as TenantTypeCode] || `Unknown Type (${typeCode})`;
}

/**
 * Convert a product ID to its human-readable label
 */
export function getProductIdLabel(productId: number): string {
  return PRODUCT_ID[productId as ProductIdCode] || `Unknown Product (${productId})`;
}

/**
 * Convert a product module ID to its human-readable label
 */
export function getProductModuleIdLabel(moduleId: number): string {
  return (
    PRODUCT_MODULE_ID[moduleId as ProductModuleIdCode] || `Unknown Product Module (${moduleId})`
  );
}

/**
 * Convert an admin role code to its human-readable label
 */
export function getAdminRoleLabel(roleCode: number): string {
  return ADMIN_ROLES[roleCode as AdminRoleCode] || `Unknown Role (${roleCode})`;
}

/**
 * Convert an admin status code to its human-readable label
 */
export function getAdminStatusLabel(statusCode: number): string {
  return ADMIN_STATUSES[statusCode as AdminStatusCode] || `Unknown Status (${statusCode})`;
}

/**
 * Convert an event category code to its human-readable label
 */
export function getEventCategoryLabel(categoryCode: string): string {
  return (
    EVENT_CATEGORIES[categoryCode as EventCategoryCode] || `Unknown Category (${categoryCode})`
  );
}

/**
 * Convert a syslog severity code to its human-readable label
 */
export function getSyslogSeverityLabel(severityCode: number): string {
  return (
    SYSLOG_SEVERITIES[severityCode as SyslogSeverityCode] || `Unknown Severity (${severityCode})`
  );
}

/**
 * Convert a customer status code to its human-readable label
 */
export function getCustomerStatusLabel(statusCode: number): string {
  return CUSTOMER_STATUS[statusCode as CustomerStatusCode] || `Unknown Status (${statusCode})`;
}

/**
 * Convert a service plan status code to its human-readable label
 */
export function getServicePlanStatusLabel(status: unknown): string {
  if (typeof status === 'number' && status in SERVICE_PLAN_STATUS) {
    return SERVICE_PLAN_STATUS[status as keyof typeof SERVICE_PLAN_STATUS];
  }
  return String(status || 'Unknown');
}

/**
 * Convert a tenant status label to its code
 */
export function getTenantStatusCode(label: string): number | undefined {
  const entries = Object.entries(TENANT_STATUS);
  const found = entries.find(([_, value]) => value === label);
  return found ? Number.parseInt(found[0], 10) : undefined;
}

/**
 * Convert a tenant type label to its code
 */
export function getTenantTypeCode(label: string): number | undefined {
  const entries = Object.entries(TENANT_TYPE);
  const found = entries.find(([_, value]) => value === label);
  return found ? Number.parseInt(found[0], 10) : undefined;
}

/**
 * Convert a product ID label to its code
 */
export function getProductIdCode(label: string): number | undefined {
  const entries = Object.entries(PRODUCT_ID);
  const found = entries.find(([_, value]) => value === label);
  return found ? Number.parseInt(found[0], 10) : undefined;
}

/**
 * Convert a product module ID label to its code
 */
export function getProductModuleIdCode(label: string): number | undefined {
  const entries = Object.entries(PRODUCT_MODULE_ID);
  const found = entries.find(([_, value]) => value === label);
  return found ? Number.parseInt(found[0], 10) : undefined;
}

/**
 * Convert an admin role label to its code
 */
export function getAdminRoleCode(label: string): number | undefined {
  const entries = Object.entries(ADMIN_ROLES);
  const found = entries.find(([_, value]) => value === label);
  return found ? Number.parseInt(found[0], 10) : undefined;
}

/**
 * Convert an admin status label to its code
 */
export function getAdminStatusCode(label: string): number | undefined {
  const entries = Object.entries(ADMIN_STATUSES);
  const found = entries.find(([_, value]) => value === label);
  return found ? Number.parseInt(found[0], 10) : undefined;
}

/**
 * Convert an event category label to its code
 */
export function getEventCategoryCode(label: string): string | undefined {
  const entries = Object.entries(EVENT_CATEGORIES);
  const found = entries.find(([_, value]) => value === label);
  return found ? found[0] : undefined;
}

/**
 * Convert a syslog severity label to its code
 */
export function getSyslogSeverityCode(label: string): number | undefined {
  const entries = Object.entries(SYSLOG_SEVERITIES);
  const found = entries.find(([_, value]) => value === label);
  return found ? Number.parseInt(found[0], 10) : undefined;
}

/**
 * Get tenant status options for n8n UI
 */
export function getTenantStatusOptions(): INodePropertyOptions[] {
  return Object.entries(TENANT_STATUS).map(([key, value]) => ({
    name: value,
    value: Number.parseInt(key, 10),
  }));
}

/**
 * Get tenant type options for n8n UI
 */
export function getTenantTypeOptions(): INodePropertyOptions[] {
  return Object.entries(TENANT_TYPE).map(([key, value]) => ({
    name: value,
    value: Number.parseInt(key, 10),
  }));
}

/**
 * Get product ID options for n8n UI
 */
export function getProductIdOptions(): INodePropertyOptions[] {
  return Object.entries(PRODUCT_ID).map(([key, value]) => ({
    name: value,
    value: Number.parseInt(key, 10),
  }));
}

/**
 * Get product module ID options for n8n UI
 */
export function getProductModuleIdOptions(): INodePropertyOptions[] {
  return Object.entries(PRODUCT_MODULE_ID).map(([key, value]) => ({
    name: value,
    value: Number.parseInt(key, 10),
  }));
}

/**
 * Get admin role options for n8n UI
 */
export function getAdminRoleOptions(): INodePropertyOptions[] {
  return Object.entries(ADMIN_ROLES).map(([key, value]) => ({
    name: value,
    value: Number.parseInt(key, 10),
  }));
}

/**
 * Get admin status options for n8n UI
 */
export function getAdminStatusOptions(): INodePropertyOptions[] {
  return Object.entries(ADMIN_STATUSES).map(([key, value]) => ({
    name: value,
    value: Number.parseInt(key, 10),
  }));
}

/**
 * Get event category options for n8n UI
 */
export function getEventCategoryOptions(): INodePropertyOptions[] {
  return Object.entries(EVENT_CATEGORIES).map(([key, value]) => ({
    name: value,
    value: key,
  }));
}

/**
 * Get syslog severity options for n8n UI
 */
export function getSyslogSeverityOptions(): INodePropertyOptions[] {
  return Object.entries(SYSLOG_SEVERITIES).map(([key, value]) => ({
    name: value,
    value: Number.parseInt(key, 10),
  }));
}

/**
 * Get customer status options for n8n UI
 */
export function getCustomerStatusOptions(): INodePropertyOptions[] {
  return Object.entries(CUSTOMER_STATUS).map(([key, value]) => ({
    name: value,
    value: Number.parseInt(key, 10),
  }));
}

/**
 * Enriches API response objects with human-readable labels for numeric codes
 * @param data The data object to enrich
 * @param fieldMappings Mapping of field names to converter functions
 * @returns The enriched data object
 */
export function enrichApiResponse(
  data: IDataObject,
  fieldMappings: Record<string, (value: number) => string>,
): IDataObject {
  // Create a new object for the ordered properties
  const orderedResult: IDataObject = {};

  // Get all the keys from the original data
  const keys = Object.keys(data);

  // For each key in the original data
  for (const key of keys) {
    // Add the original property
    orderedResult[key] = data[key];

    // Check if this is a field that needs a label
    if (key in fieldMappings && typeof data[key] === 'number') {
      // If so, add the label property immediately after the original
      const labelField = `${key}_label`;
      orderedResult[labelField] = fieldMappings[key](data[key] as number);
    }
  }

  return orderedResult;
}

/**
 * Enriches array of API response objects with human-readable labels
 */
export function enrichApiResponseArray(
  dataArray: IDataObject[],
  fieldMappings: Record<string, (value: number) => string>,
): IDataObject[] {
  return dataArray.map((item) => enrichApiResponse(item, fieldMappings));
}

/**
 * Get service plan edition options for n8n UI
 */
export function getServicePlanEditionOptions(): INodePropertyOptions[] {
  return Object.entries(SERVICE_PLAN_EDITIONS).map(([key, value]) => ({
    name: value,
    value: key,
  }));
}

/**
 * Get service plan feature name options for n8n UI
 */
export function getServicePlanFeatureOptions(): INodePropertyOptions[] {
  return Object.entries(SERVICE_PLAN_FEATURES).map(([key, value]) => ({
    name: value,
    value: key,
  }));
}

/**
 * Get service plan status options for n8n UI
 */
export function getServicePlanStatusOptions(): INodePropertyOptions[] {
  return Object.entries(SERVICE_PLAN_STATUS).map(([key, value]) => ({
    name: value,
    value: Number.parseInt(key, 10),
  }));
}

/**
 * Convert a task status code to its human-readable label
 */
export function getTaskStatusLabel(status: unknown): string {
  if (typeof status === 'number' && status in TASK_STATUS) {
    return TASK_STATUS[status as keyof typeof TASK_STATUS];
  }
  return String(status || 'Unknown');
}

/**
 * Convert a task output status code to its human-readable label
 */
export function getTaskOutputStatusLabel(status: unknown): string {
  if (typeof status === 'number' && status in TASK_OUTPUT_STATUS) {
    return TASK_OUTPUT_STATUS[status as keyof typeof TASK_OUTPUT_STATUS];
  }
  return String(status || 'Unknown');
}

/**
 * Get task status options for n8n UI
 */
export function getTaskStatusOptions(): INodePropertyOptions[] {
  return Object.entries(TASK_STATUS).map(([key, value]) => ({
    name: value,
    value: Number.parseInt(key, 10),
  }));
}

/**
 * Convert Unix epoch timestamp to JavaScript Date
 * Druva API returns Unix epoch timestamps in milliseconds
 *
 * @param timestamp Unix epoch timestamp (in milliseconds)
 * @returns JavaScript Date object
 */
export function convertUnixTimestampToDate(timestamp: number): Date {
  // Check if timestamp is already in milliseconds or needs conversion
  // Unix timestamps in seconds have ~10 digits, milliseconds have ~13 digits
  if (timestamp < 10000000000) {
    // Convert from seconds to milliseconds
    return new Date(timestamp * 1000);
  }
  // Already in milliseconds
  return new Date(timestamp);
}

/**
 * Enriches API response objects with JavaScript Date objects for timestamp fields
 * @param data The data object to enrich
 * @param timestampFields Array of field names containing Unix timestamps
 * @returns The enriched data object with additional Date fields
 */
export function enrichApiResponseWithDates(
  data: IDataObject,
  timestampFields: string[],
): IDataObject {
  // Create a new result object
  let result = { ...data };

  // Process each timestamp field
  for (const field of timestampFields) {
    const timestamp = data[field];

    // Only process if the field exists and is a number
    if (timestamp !== undefined && typeof timestamp === 'number') {
      // Create a Date object and add as a new field with the "At" suffix
      const dateObject = convertUnixTimestampToDate(timestamp);
      const dateField = `${field}At`;

      // Add the date object immediately after the timestamp field
      const keys = Object.keys(result);
      const fieldIndex = keys.indexOf(field);

      if (fieldIndex !== -1) {
        // Create a new object with the date field inserted at the right position
        const newResult: IDataObject = {};

        keys.forEach((key, index) => {
          newResult[key] = result[key];
          // Add the date field immediately after the timestamp field
          if (index === fieldIndex) {
            newResult[dateField] = dateObject;
          }
        });

        // If the field was the last one, add the date field at the end
        if (fieldIndex === keys.length - 1 && !newResult[dateField]) {
          newResult[dateField] = dateObject;
        }

        // Update the result for the next iteration
        result = newResult;
      } else {
        // Just add at the end if we can't find the field (should not happen)
        result[dateField] = dateObject;
      }
    }
  }

  return result;
}
