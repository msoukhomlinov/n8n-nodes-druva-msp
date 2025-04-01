import type {
  IExecuteFunctions,
  INodeExecutionData,
  IDataObject,
  NodeApiError,
} from 'n8n-workflow';

import { druvaMspApiRequest, druvaMspApiRequestAllItems, getTenantCustomerId } from './GenericFunctions'; // Assuming helper functions are in GenericFunctions.ts
import {
  enrichApiResponse,
  enrichApiResponseArray,
  getTenantStatusLabel,
  getTenantTypeLabel,
  getProductIdLabel,
} from './ApiValueConverters';

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

      try {
        // Automatically retrieve the customer ID for the tenant
        const customerId = await getTenantCustomerId.call(this, tenantId);

        // Use the correct API endpoint that includes both customer ID and tenant ID
        const endpoint = `/msp/v2/customers/${customerId}/tenants/${tenantId}`;
        let response = (await druvaMspApiRequest.call(this, 'GET', endpoint)) as IDataObject;

        // Enrich the response with human-readable labels
        response = enrichApiResponse(response, {
          'status': getTenantStatusLabel,
          'tenantType': getTenantTypeLabel,
          'productID': getProductIdLabel,
        });

        responseData = response;
      } catch (error) {
        throw new Error(`Failed to retrieve tenant: ${(error as Error).message}`);
      }
    } else if (operation === 'getMany') {
      const returnAll = this.getNodeParameter('returnAll', i, false) as boolean;
      const limit = this.getNodeParameter('limit', i, 50) as number;

      // Get individual filter settings
      const filterByCustomer = this.getNodeParameter('filterByCustomer', i, false) as boolean;
      const customerId = filterByCustomer ? this.getNodeParameter('customerId', i, '') as string : undefined;

      const filterByStatus = this.getNodeParameter('filterByStatus', i, false) as boolean;
      const statusFilter = filterByStatus ? this.getNodeParameter('statusFilter', i, undefined) as number : undefined;

      const filterByType = this.getNodeParameter('filterByType', i, false) as boolean;
      const typeFilter = filterByType ? this.getNodeParameter('typeFilter', i, undefined) as number : undefined;

      const filterByProduct = this.getNodeParameter('filterByProduct', i, false) as boolean;
      const productFilter = filterByProduct ? this.getNodeParameter('productFilter', i, undefined) as number : undefined;

      const endpoint = '/msp/v2/tenants';

      const qs: IDataObject = {};

      // Add customerId to query params if specified, but use 'customerIds' as the param name
      // as that's what the API expects according to the documentation
      if (filterByCustomer && customerId) {
        qs.customerIds = customerId;
        console.log(`[INFO] Druva MSP API - Filtering tenants by customer ID: ${customerId}`);
      }

      if (!returnAll) {
        qs.pageSize = limit;
      }

      // Use the global responseData variable, don't redeclare it locally
      if (returnAll) {
        const tenants = await druvaMspApiRequestAllItems.call(
          this,
          'GET',
          endpoint,
          'tenants',
          qs,
        ) as IDataObject[];

        // Enrich the response array with human-readable labels
        responseData = enrichApiResponseArray(tenants, {
          'status': getTenantStatusLabel,
          'tenantType': getTenantTypeLabel,
          'productID': getProductIdLabel,
        });
      } else {
        const response = await druvaMspApiRequest.call(this, 'GET', endpoint, undefined, qs);
        if (
          typeof response === 'object' &&
          response !== null &&
          'tenants' in response &&
          Array.isArray(response.tenants)
        ) {
          // Enrich the response array with human-readable labels
          responseData = enrichApiResponseArray(response.tenants as IDataObject[], {
            'status': getTenantStatusLabel,
            'tenantType': getTenantTypeLabel,
            'productId': getProductIdLabel,
          });
        } else {
          console.warn(`[WARN] Druva MSP API - Unexpected response format for Tenant Get Many: ${JSON.stringify(response)}`);
          responseData = [];
        }
      }

      // Filter by status if requested
      if (filterByStatus && statusFilter !== undefined) {
        console.log(`[INFO] Druva MSP API - Post-processing filter: Filtering tenants by status ${statusFilter}`);
        responseData = (responseData as IDataObject[]).filter(tenant => tenant.status === statusFilter);
      }

      // Filter by tenant type if requested
      if (filterByType && typeFilter !== undefined) {
        console.log(`[INFO] Druva MSP API - Post-processing filter: Filtering tenants by type ${typeFilter}`);
        responseData = (responseData as IDataObject[]).filter(tenant => tenant.tenantType === typeFilter);
      }

      // Add a message about the number of tenants found after filtering
      console.log(`[INFO] Druva MSP API - Found ${Array.isArray(responseData) ? (responseData as IDataObject[]).length : 0} tenants after filtering`);

      // Add detailed debugging of the final data being returned
      console.log(`[DEBUG] Druva MSP API - Final response data structure: ${JSON.stringify(Array.isArray(responseData) && (responseData as IDataObject[]).length > 0 ? (responseData as IDataObject[])[0] : 'No data')}`);
      console.log(`[DEBUG] Druva MSP API - First 3 items in response: ${JSON.stringify(Array.isArray(responseData) ? (responseData as IDataObject[]).slice(0, 3) : 'Not an array')}`);

      // Make sure responseData is correctly assigned for the return statement
      if (Array.isArray(responseData)) {
        console.log(`[DEBUG] Druva MSP API - responseData is properly an array of length ${(responseData as IDataObject[]).length}`);
      } else {
        // Convert to array if not already
        console.log(`[DEBUG] Druva MSP API - responseData is NOT an array, converting to array`);
        responseData = [responseData as IDataObject];
      }

      // Important debug statement right before moving to the next operation
      console.log(`[DEBUG] Druva MSP API - End of getMany operation, responseData has ${Array.isArray(responseData) ? (responseData as IDataObject[]).length : 'unknown'} items`);
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
  console.log(`[DEBUG] Druva MSP API - Finalizing execution, responseData has ${Array.isArray(responseData) ? responseData.length : 'unknown'} items`);
  console.log(`[DEBUG] Druva MSP API - responseData type: ${typeof responseData}, isArray: ${Array.isArray(responseData)}`);

  // Force the correct structure for responseData
  let returnItems: INodeExecutionData[] = [];

  if (Array.isArray(responseData)) {
    console.log(`[DEBUG] Druva MSP API - Processing array response with ${responseData.length} items`);
    returnItems = responseData.map(item => ({
      json: item,
    }));
  } else {
    console.log(`[DEBUG] Druva MSP API - Processing single item response`);
    returnItems = [{
      json: responseData as IDataObject,
    }];
  }

  console.log(`[DEBUG] Druva MSP API - Final return contains ${returnItems.length} items`);
  return returnItems;
}
