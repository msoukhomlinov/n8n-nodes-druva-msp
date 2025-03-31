import type {
  IExecuteFunctions,
  INodeExecutionData,
  IDataObject,
  NodeApiError,
} from 'n8n-workflow';

import { druvaMspApiRequest, druvaMspApiRequestAllItems } from './GenericFunctions'; // Assuming helper functions are in GenericFunctions.ts

// Temporary interfaces for Create operation - consider moving to interfaces.ts later
interface ProductAttribute {
  attributeId: number;
  attributeValue: number | string; // Value might be string or number depending on attribute
}

interface ProductEntry {
  productId: number;
  attributes: ProductAttribute[];
}

interface StorageRegionEntry {
  storageRegionId: string; // Usually a number string like "1"
  isPrimary: boolean;
}

export async function executeTenantOperation(
  this: IExecuteFunctions,
  i: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', i, '') as string;
  // Reverting back to let as it will be reassigned
  let responseData: IDataObject | IDataObject[] = [];

  try {
    if (operation === 'create') {
      // Parameters
      const customerId = this.getNodeParameter('customerId', i, '') as string;
      const tenantName = this.getNodeParameter('tenantName', i, '') as string;
      const servicePlanId = this.getNodeParameter('servicePlanId', i, '') as string;
      const productsJson = this.getNodeParameter('products', i, '[]') as string;
      const storageRegionsJson = this.getNodeParameter('storageRegions', i, '[]') as string;
      const accountInfo = this.getNodeParameter(
        'accountInfo.accountInfoFields',
        i,
        {},
      ) as IDataObject;
      const address = this.getNodeParameter('address.addressFields', i, {}) as IDataObject;

      // Basic validation
      if (!customerId || !tenantName || !servicePlanId) {
        throw new Error('Missing required fields for Tenant Create operation.');
      }

      // Parse JSON fields with specific types
      let products: ProductEntry[];
      let storageRegions: StorageRegionEntry[];
      try {
        products = JSON.parse(productsJson);
        storageRegions = JSON.parse(storageRegionsJson);
        // Basic validation of parsed structure (can be enhanced)
        if (!Array.isArray(products) || !Array.isArray(storageRegions)) {
          throw new Error('Products and Storage Regions must be valid JSON arrays.');
        }
      } catch (jsonError) {
        throw new Error(`Invalid JSON provided for Products or Storage Regions: ${jsonError}`);
      }

      // Build body
      const body: IDataObject = {
        customerId,
        tenantName,
        servicePlanId,
        products,
        storageRegions,
        accountInfo: {
          firstName: accountInfo.firstName,
          lastName: accountInfo.lastName,
          email: accountInfo.email,
          contactNumber: accountInfo.contactNumber,
          // Add parentheses and fix arrow functions
          additionalEmails: ((accountInfo.additionalEmails as string) || '')
            .split(',')
            .map((email) => email.trim())
            .filter((email) => email),
          designation: accountInfo.designation,
        },
        address: {
          street: address.street,
          city: address.city,
          state: address.state,
          country: address.country,
          postalCode: address.postalCode,
        },
      };

      const endpoint = '/msp/v2/tenants';
      responseData = (await druvaMspApiRequest.call(this, 'POST', endpoint, body)) as IDataObject;
    } else if (operation === 'get') {
      const tenantId = this.getNodeParameter('tenantId', i, '') as string;
      if (!tenantId) {
        throw new Error('Tenant ID is required for the get operation.');
      }
      const endpoint = `/msp/v2/tenants/${tenantId}`;
      responseData = (await druvaMspApiRequest.call(this, 'GET', endpoint)) as IDataObject;
    } else if (operation === 'list') {
      const returnAll = this.getNodeParameter('returnAll', i, false) as boolean;
      const limit = this.getNodeParameter('limit', i, 50) as number;
      const filters = this.getNodeParameter('filters.filterFields', i, {}) as {
        customerId?: string;
        tenantStatus?: string;
      };
      const endpoint = '/msp/v2/tenants';

      const qs: IDataObject = {};
      if (filters.customerId) {
        qs.customerId = filters.customerId;
      }
      if (filters.tenantStatus) {
        qs.tenantStatus = filters.tenantStatus;
      }

      if (returnAll) {
        responseData = await druvaMspApiRequestAllItems.call(this, 'GET', endpoint, 'tenants', qs);
      } else {
        qs.pageSize = limit;
        const response = await druvaMspApiRequest.call(this, 'GET', endpoint, undefined, qs);
        if (
          typeof response === 'object' &&
          response !== null &&
          'tenants' in response &&
          Array.isArray(response.tenants)
        ) {
          responseData = response.tenants;
        } else {
          console.warn(`Unexpected response format for Tenant List: ${JSON.stringify(response)}`);
          responseData = [];
        }
      }
    } else if (operation === 'update') {
      // Parameters
      const tenantId = this.getNodeParameter('tenantId', i, '') as string;
      const tenantName = this.getNodeParameter('tenantName', i, '') as string;
      const address = this.getNodeParameter('address.addressFields', i, {}) as IDataObject;

      if (!tenantId) {
        throw new Error('Tenant ID is required for the update operation.');
      }

      // Build body
      const body: IDataObject = {
        tenantName,
        address: {
          street: address.street,
          city: address.city,
          state: address.state,
          country: address.country,
          postalCode: address.postalCode,
        },
      };

      const endpoint = `/msp/v2/tenants/${tenantId}`;
      responseData = (await druvaMspApiRequest.call(this, 'PUT', endpoint, body)) as IDataObject;
    } else if (operation === 'suspend') {
      // Parameter
      const tenantId = this.getNodeParameter('tenantId', i, '') as string;
      if (!tenantId) {
        throw new Error('Tenant ID is required for the suspend operation.');
      }

      const endpoint = `/msp/v2/tenants/${tenantId}/suspend`;
      // POST request with no body
      responseData = (await druvaMspApiRequest.call(this, 'POST', endpoint)) as IDataObject;
    } else if (operation === 'unsuspend') {
      // Parameter
      const tenantId = this.getNodeParameter('tenantId', i, '') as string;
      if (!tenantId) {
        throw new Error('Tenant ID is required for the unsuspend operation.');
      }

      const endpoint = `/msp/v2/tenants/${tenantId}/unsuspend`;
      // POST request with no body
      responseData = (await druvaMspApiRequest.call(this, 'POST', endpoint)) as IDataObject;
    }

    // No longer return here, rely on responseData assigned within operations
    // return this.helpers.returnJsonArray(
    //   Array.isArray(responseData) ? responseData : [responseData],
    // );
  } catch (error) {
    // Log or re-throw the error for the main execute function to handle
    if (this.continueOnFail()) {
      // Return the error structure
      return [{ json: {}, error: error as NodeApiError }];
    }
    // Re-throw the error to halt execution if continueOnFail is false
    throw error;
  }

  // Return the final data
  return this.helpers.returnJsonArray(Array.isArray(responseData) ? responseData : [responseData]);
}
