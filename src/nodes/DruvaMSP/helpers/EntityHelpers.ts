import type { IExecuteFunctions, IDataObject } from 'n8n-workflow';

import { druvaMspApiRequest } from './ApiRequestHelpers';
import { logger } from './LoggerHelper';

/**
 * Retrieves the customer ID for a specific tenant.
 * Looks up a tenant by ID and extracts its associated customer ID.
 *
 * @param {IExecuteFunctions} this The context object.
 * @param {string} tenantId The tenant ID to look up.
 * @returns {Promise<string>} The customer ID associated with the specified tenant.
 */
export async function getTenantCustomerId(
  this: IExecuteFunctions,
  tenantId: string,
): Promise<string> {
  await logger.debug(`Tenant: Looking up customer ID for tenant: ${tenantId}`, this);

  // Get all tenants and find the matching one
  try {
    const endpoint = '/msp/v2/tenants';
    const qs = { pageSize: 100 };

    const response = (await druvaMspApiRequest.call(
      this,
      'GET',
      endpoint,
      undefined,
      qs,
    )) as IDataObject;

    if (response.tenants && Array.isArray(response.tenants)) {
      const tenants = response.tenants as IDataObject[];
      await logger.debug(
        `Tenant: Retrieved ${tenants.length} tenants, searching for tenant ID: ${tenantId}`,
        this,
      );

      const targetTenant = tenants.find((tenant) => tenant.id === tenantId);

      if (targetTenant?.customerID) {
        const customerId = targetTenant.customerID as string;
        await logger.debug(`Tenant: Found customer ID ${customerId} for tenant ${tenantId}`, this);
        return customerId;
      }
    }

    throw new Error(`Tenant with ID ${tenantId} not found or missing customer ID`);
  } catch (error) {
    logger.error(`Tenant: Failed to retrieve customer ID for tenant ${tenantId}`, error as Error);
    throw new Error(
      `Failed to retrieve customer ID for tenant ${tenantId}: ${(error as Error).message}`,
    );
  }
}
