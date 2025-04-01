import type { INodePropertyOptions } from 'n8n-workflow';
import type { IDataObject } from 'n8n-workflow';

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
export type TenantStatusLabel = typeof TENANT_STATUS[TenantStatusCode];

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
export type TenantTypeLabel = typeof TENANT_TYPE[TenantTypeCode];

/**
 * Constants for product ID values
 */
export const PRODUCT_ID = {
  1: 'Hybrid Workloads',
  2: 'SaaS Apps and Endpoints',
} as const;

// Define a type for product ID values
export type ProductIdCode = keyof typeof PRODUCT_ID;
export type ProductIdLabel = typeof PRODUCT_ID[ProductIdCode];

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
 * Convert a tenant status label to its code
 */
export function getTenantStatusCode(label: string): number | undefined {
  const entries = Object.entries(TENANT_STATUS);
  const found = entries.find(([_, value]) => value === label);
  return found ? parseInt(found[0], 10) : undefined;
}

/**
 * Convert a tenant type label to its code
 */
export function getTenantTypeCode(label: string): number | undefined {
  const entries = Object.entries(TENANT_TYPE);
  const found = entries.find(([_, value]) => value === label);
  return found ? parseInt(found[0], 10) : undefined;
}

/**
 * Convert a product ID label to its code
 */
export function getProductIdCode(label: string): number | undefined {
  const entries = Object.entries(PRODUCT_ID);
  const found = entries.find(([_, value]) => value === label);
  return found ? parseInt(found[0], 10) : undefined;
}

/**
 * Get tenant status options for n8n UI
 */
export function getTenantStatusOptions(): INodePropertyOptions[] {
  return Object.entries(TENANT_STATUS).map(([key, value]) => ({
    name: value,
    value: parseInt(key, 10),
  }));
}

/**
 * Get tenant type options for n8n UI
 */
export function getTenantTypeOptions(): INodePropertyOptions[] {
  return Object.entries(TENANT_TYPE).map(([key, value]) => ({
    name: value,
    value: parseInt(key, 10),
  }));
}

/**
 * Get product ID options for n8n UI
 */
export function getProductIdOptions(): INodePropertyOptions[] {
  return Object.entries(PRODUCT_ID).map(([key, value]) => ({
    name: value,
    value: parseInt(key, 10),
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
  return dataArray.map(item => enrichApiResponse(item, fieldMappings));
}
