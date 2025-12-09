import type { IExecuteFunctions, IDataObject } from 'n8n-workflow';

import { druvaMspApiRequestAllItems } from './PaginationHelpers';
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
): Promise<string | undefined> {
  await logger.debug(`Tenant: Looking up customer ID for tenant: ${tenantId}`, this);

  try {
    const tenants = (await druvaMspApiRequestAllItems.call(
      this,
      'GET',
      '/msp/v3/tenants',
      'tenants',
      {},
      {
        pageSize: '100',
      },
    )) as IDataObject[];

    await logger.debug(
      `Tenant: Retrieved ${tenants.length} tenants, searching for tenant ID: ${tenantId}`,
      this,
    );

    const targetTenant = tenants.find((tenant) => tenant.id === tenantId);

    const customerId = targetTenant?.customerID as string | undefined;

    if (customerId) {
      await logger.debug(`Tenant: Found customer ID ${customerId} for tenant ${tenantId}`, this);
      return customerId;
    }

    logger.warn(`Tenant: Tenant ${tenantId} not found in v3 list`);
    return undefined;
  } catch (error) {
    logger.error(`Tenant: Failed to retrieve customer ID for tenant ${tenantId}`, error as Error);
    throw new Error(
      `Failed to retrieve customer ID for tenant ${tenantId}: ${(error as Error).message}`,
    );
  }
}
