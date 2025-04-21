import type {
  IExecuteFunctions,
  INodeExecutionData,
  IDataObject,
  NodeApiError,
} from 'n8n-workflow';

import {
  druvaMspApiRequest,
  druvaMspApiRequestAllItems,
  getTenantCustomerId,
  waitForTaskCompletion,
} from './GenericFunctions'; // Added import for waitForTaskCompletion
import {
  enrichApiResponse,
  enrichApiResponseArray,
  getTenantStatusLabel,
  getTenantTypeLabel,
  getProductIdLabel,
} from './helpers/ValueConverters';
import { logger } from './helpers/LoggerHelper';

export async function executeTenantOperation(
  this: IExecuteFunctions,
  i: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', i, '') as string;
  // Reverting back to let as it will be reassigned
  let responseData: IDataObject | IDataObject[] = [];

  try {
    if (operation === 'get') {
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
          status: getTenantStatusLabel,
          tenantType: getTenantTypeLabel,
          productID: getProductIdLabel,
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
      const customerId = filterByCustomer
        ? (this.getNodeParameter('customerId', i, '') as string)
        : undefined;

      const filterByStatus = this.getNodeParameter('filterByStatus', i, false) as boolean;
      const statusFilter = filterByStatus
        ? (this.getNodeParameter('statusFilter', i, undefined) as number)
        : undefined;

      const filterByType = this.getNodeParameter('filterByType', i, false) as boolean;
      const typeFilter = filterByType
        ? (this.getNodeParameter('typeFilter', i, undefined) as number)
        : undefined;

      const filterByProduct = this.getNodeParameter('filterByProduct', i, false) as boolean;
      const productFilter = filterByProduct
        ? (this.getNodeParameter('productFilter', i, undefined) as number)
        : undefined;

      const endpoint = '/msp/v2/tenants';

      const qs: IDataObject = {};

      // Add customerId to query params if specified, but use 'customerIds' as the param name
      // as that's what the API expects according to the documentation
      if (filterByCustomer && customerId) {
        qs.customerIds = customerId;
        logger.info(`Tenant: Filtering tenants by customer ID: ${customerId}`);
      }

      if (!returnAll) {
        qs.pageSize = limit;
      }

      // Use the global responseData variable, don't redeclare it locally
      if (returnAll) {
        const tenants = (await druvaMspApiRequestAllItems.call(
          this,
          'GET',
          endpoint,
          'tenants',
          qs,
        )) as IDataObject[];

        // Enrich the response array with human-readable labels
        responseData = enrichApiResponseArray(tenants, {
          status: getTenantStatusLabel,
          tenantType: getTenantTypeLabel,
          productID: getProductIdLabel,
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
            status: getTenantStatusLabel,
            tenantType: getTenantTypeLabel,
            productID: getProductIdLabel,
          });
        } else {
          logger.warn(
            `Tenant: Unexpected response format for Tenant Get Many: ${JSON.stringify(response)}`,
          );
          responseData = [];
        }
      }

      // Filter by status if requested
      if (filterByStatus && statusFilter !== undefined) {
        logger.info(`Tenant: Post-processing filter: Filtering tenants by status ${statusFilter}`);
        responseData = (responseData as IDataObject[]).filter(
          (tenant) => tenant.status === statusFilter,
        );
      }

      // Filter by tenant type if requested
      if (filterByType && typeFilter !== undefined) {
        logger.info(`Tenant: Post-processing filter: Filtering tenants by type ${typeFilter}`);
        responseData = (responseData as IDataObject[]).filter(
          (tenant) => tenant.tenantType === typeFilter,
        );
      }

      // Filter by product if requested
      if (filterByProduct && productFilter !== undefined) {
        logger.info(
          `Tenant: Post-processing filter: Filtering tenants by product ${productFilter}`,
        );
        responseData = (responseData as IDataObject[]).filter(
          (tenant) => tenant.productID === productFilter,
        );
      }

      // Add a message about the number of tenants found after filtering
      logger.info(
        `Tenant: Found ${Array.isArray(responseData) ? (responseData as IDataObject[]).length : 0} tenants after filtering`,
      );

      // Add detailed debugging of the final data being returned
      logger.debug(
        `Tenant: Final response data structure: ${JSON.stringify(Array.isArray(responseData) && (responseData as IDataObject[]).length > 0 ? (responseData as IDataObject[])[0] : 'No data')}`,
      );
      logger.debug(
        `Tenant: First 3 items in response: ${JSON.stringify(Array.isArray(responseData) ? (responseData as IDataObject[]).slice(0, 3) : 'Not an array')}`,
      );

      // Make sure responseData is correctly assigned for the return statement
      if (Array.isArray(responseData)) {
        logger.debug(
          `Tenant: responseData is properly an array of length ${(responseData as IDataObject[]).length}`,
        );
      } else {
        // Convert to array if not already
        logger.debug('Tenant: responseData is NOT an array, converting to array');
        responseData = [responseData as IDataObject];
      }

      // Important debug statement right before moving to the next operation
      logger.debug(
        `Tenant: End of getMany operation, responseData has ${Array.isArray(responseData) ? (responseData as IDataObject[]).length : 'unknown'} items`,
      );
    } else if (operation === 'suspend') {
      // Parameter
      const tenantId = this.getNodeParameter('tenantId', i, '') as string;
      if (!tenantId) {
        throw new Error('Tenant ID is required for the suspend operation.');
      }

      // Check if we should wait for task completion
      const waitForCompletion = this.getNodeParameter('waitForCompletion', i, false) as boolean;

      // Get the customer ID for this tenant
      try {
        const customerId = await getTenantCustomerId.call(this, tenantId);
        if (!customerId) {
          throw new Error(`Could not find customer ID for tenant ${tenantId}`);
        }

        // Use the correct API endpoint that includes both customer ID and tenant ID
        const endpoint = `/msp/v2/customers/${customerId}/tenants/${tenantId}/suspend`;
        logger.debug(`Tenant: Suspending tenant at endpoint: ${endpoint}`);

        // POST request with no body
        const suspendResponse = (await druvaMspApiRequest.call(
          this,
          'POST',
          endpoint,
        )) as IDataObject;

        // If we should wait for task completion
        if (waitForCompletion && suspendResponse.task && (suspendResponse.task as IDataObject).id) {
          const taskId = (suspendResponse.task as IDataObject).id as string;
          logger.debug(`Tenant: Waiting for task ${taskId} to complete`);

          // Wait for the task to complete
          const taskResponse = await waitForTaskCompletion.call(this, taskId);
          responseData = taskResponse;
        } else {
          // Just return the initial response
          responseData = suspendResponse;
        }
      } catch (error) {
        throw new Error(`Failed to suspend tenant: ${(error as Error).message}`);
      }
    } else if (operation === 'unsuspend') {
      // Parameter
      const tenantId = this.getNodeParameter('tenantId', i, '') as string;
      if (!tenantId) {
        throw new Error('Tenant ID is required for the unsuspend operation.');
      }

      // Check if we should wait for task completion
      const waitForCompletion = this.getNodeParameter('waitForCompletion', i, false) as boolean;

      // Get the customer ID for this tenant
      try {
        const customerId = await getTenantCustomerId.call(this, tenantId);
        if (!customerId) {
          throw new Error(`Could not find customer ID for tenant ${tenantId}`);
        }

        // Use the correct API endpoint that includes both customer ID and tenant ID
        const endpoint = `/msp/v2/customers/${customerId}/tenants/${tenantId}/unsuspend`;
        logger.debug(`Tenant: Unsuspending tenant at endpoint: ${endpoint}`);

        // POST request with no body
        const unsuspendResponse = (await druvaMspApiRequest.call(
          this,
          'POST',
          endpoint,
        )) as IDataObject;

        // If we should wait for task completion
        if (
          waitForCompletion &&
          unsuspendResponse.task &&
          (unsuspendResponse.task as IDataObject).id
        ) {
          const taskId = (unsuspendResponse.task as IDataObject).id as string;
          logger.debug(`Tenant: Waiting for task ${taskId} to complete`);

          // Wait for the task to complete
          const taskResponse = await waitForTaskCompletion.call(this, taskId);
          responseData = taskResponse;
        } else {
          // Just return the initial response
          responseData = unsuspendResponse;
        }
      } catch (error) {
        throw new Error(`Failed to unsuspend tenant: ${(error as Error).message}`);
      }
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
  logger.debug(
    `Tenant: Finalizing execution, responseData has ${Array.isArray(responseData) ? responseData.length : 'unknown'} items`,
  );
  logger.debug(
    `Tenant: responseData type: ${typeof responseData}, isArray: ${Array.isArray(responseData)}`,
  );

  // Force the correct structure for responseData
  let returnItems: INodeExecutionData[] = [];

  if (Array.isArray(responseData)) {
    logger.debug(`Tenant: Processing array response with ${responseData.length} items`);
    returnItems = responseData.map((item) => ({
      json: item,
    }));
  } else {
    logger.debug('Tenant: Processing single item response');
    returnItems = [
      {
        json: responseData as IDataObject,
      },
    ];
  }

  logger.debug(`Tenant: Final return contains ${returnItems.length} items`);
  return returnItems;
}
