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
        const endpoint = `/msp/v3/customers/${customerId}/tenants/${tenantId}`;
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

      const endpoint = '/msp/v3/tenants';

      const qs: IDataObject = {};

      // Add customerId to query params if specified, but use 'customerIds' as the param name
      // as that's what the API expects according to the documentation
      if (filterByCustomer && customerId) {
        qs.customerIds = customerId;
        logger.info(`Tenant: Filtering tenants by customer ID: ${customerId}`);
      }

      if (!returnAll) {
        // v3 API expects pageSize as a string
        qs.pageSize = limit.toString();
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
      await logger.debug(
        `Tenant: Final response data structure: ${JSON.stringify(Array.isArray(responseData) && (responseData as IDataObject[]).length > 0 ? (responseData as IDataObject[])[0] : 'No data')}`,
        this,
      );
      await logger.debug(
        `Tenant: First 3 items in response: ${JSON.stringify(Array.isArray(responseData) ? (responseData as IDataObject[]).slice(0, 3) : 'Not an array')}`,
        this,
      );

      // Make sure responseData is correctly assigned for the return statement
      if (Array.isArray(responseData)) {
        await logger.debug(
          `Tenant: responseData is properly an array of length ${(responseData as IDataObject[]).length}`,
          this,
        );
      } else {
        // Convert to array if not already
        await logger.debug('Tenant: responseData is NOT an array, converting to array', this);
        responseData = [responseData as IDataObject];
      }

      // Important debug statement right before moving to the next operation
      await logger.debug(
        `Tenant: End of getMany operation, responseData has ${Array.isArray(responseData) ? (responseData as IDataObject[]).length : 'unknown'} items`,
        this,
      );
    } else if (operation === 'create') {
      const customerId = this.getNodeParameter('customerId', i, '') as string;
      if (!customerId) {
        throw new Error('Customer ID is required for the create operation.');
      }

      const productID = this.getNodeParameter('productID', i, '') as string;
      const servicePlanID = this.getNodeParameter('servicePlanID', i, '') as string;
      const tenantType = this.getNodeParameter('tenantType', i, '') as string;
      const licenseExpiryDate = this.getNodeParameter('licenseExpiryDate', i, '') as string;
      const storageRegionsStr = this.getNodeParameter('storageRegions', i, '') as string;
      const quota = this.getNodeParameter('quota', i, undefined) as number | undefined;
      const quotaStartDate = this.getNodeParameter('quotaStartDate', i, undefined) as
        | string
        | undefined;
      const quotaEndDate = this.getNodeParameter('quotaEndDate', i, undefined) as
        | string
        | undefined;
      const featuresData = this.getNodeParameter('features', i, {}) as IDataObject;
      const waitForCompletion = this.getNodeParameter('waitForCompletion', i, false) as boolean;

      // Parse storage regions from comma-separated string to array
      const storageRegions = storageRegionsStr
        .split(',')
        .map((region) => region.trim())
        .filter((region) => region.length > 0);

      if (storageRegions.length === 0) {
        throw new Error('At least one storage region is required.');
      }

      // Build features array from fixedCollection format
      const features: IDataObject[] = [];
      if (featuresData && featuresData.feature && Array.isArray(featuresData.feature)) {
        for (const featureItem of featuresData.feature as IDataObject[]) {
          const feature: IDataObject = {
            name: featureItem.name as string,
          };

          // Build attrs array if present
          const attrsData = featureItem.attrs as IDataObject | undefined;
          if (attrsData && attrsData.attr && Array.isArray(attrsData.attr)) {
            const attrs: IDataObject[] = [];
            for (const attrItem of attrsData.attr as IDataObject[]) {
              attrs.push({
                name: attrItem.name as string,
                value: attrItem.value as number,
              });
            }
            feature.attrs = attrs;
          } else {
            feature.attrs = [];
          }

          features.push(feature);
        }
      }

      if (features.length === 0) {
        throw new Error('At least one feature is required.');
      }

      // Build request body
      const body: IDataObject = {
        productID: Number.parseInt(productID, 10),
        servicePlanID: Number.parseInt(servicePlanID, 10),
        tenantType: Number.parseInt(tenantType, 10),
        licenseExpiryDate,
        storageRegions,
        features,
      };

      // Add optional fields if provided
      if (quota !== undefined && quota > 0) {
        body.quota = quota;
      }
      if (quotaStartDate) {
        body.quotaStartDate = quotaStartDate;
      }
      if (quotaEndDate) {
        body.quotaEndDate = quotaEndDate;
      }

      try {
        const endpoint = `/msp/v3/customers/${customerId}/tenants`;
        await logger.debug(`Tenant: Creating tenant at endpoint: ${endpoint}`, this);

        const createResponse = (await druvaMspApiRequest.call(
          this,
          'POST',
          endpoint,
          body,
        )) as IDataObject;

        // If we should wait for task completion
        if (waitForCompletion && createResponse.task && (createResponse.task as IDataObject).id) {
          const taskId = (createResponse.task as IDataObject).id as string;
          await logger.debug(`Tenant: Waiting for task ${taskId} to complete`, this);

          const taskResponse = await waitForTaskCompletion.call(this, taskId);
          responseData = taskResponse;
        } else {
          responseData = createResponse;
        }
      } catch (error) {
        throw new Error(`Failed to create tenant: ${(error as Error).message}`);
      }
    } else if (operation === 'update') {
      const tenantId = this.getNodeParameter('tenantId', i, '') as string;
      if (!tenantId) {
        throw new Error('Tenant ID is required for the update operation.');
      }

      const productID = this.getNodeParameter('productID', i, '') as string;
      const servicePlanID = this.getNodeParameter('servicePlanID', i, '') as string;
      const tenantType = this.getNodeParameter('tenantType', i, '') as string;
      const licenseExpiryDate = this.getNodeParameter('licenseExpiryDate', i, '') as string;
      const storageRegionsStr = this.getNodeParameter('storageRegions', i, '') as string;
      const quota = this.getNodeParameter('quota', i, undefined) as number | undefined;
      const quotaStartDate = this.getNodeParameter('quotaStartDate', i, undefined) as
        | string
        | undefined;
      const quotaEndDate = this.getNodeParameter('quotaEndDate', i, undefined) as
        | string
        | undefined;
      const featuresData = this.getNodeParameter('features', i, {}) as IDataObject;
      const waitForCompletion = this.getNodeParameter('waitForCompletion', i, false) as boolean;

      // Get the customer ID for this tenant
      const customerId = await getTenantCustomerId.call(this, tenantId);
      if (!customerId) {
        throw new Error(`Could not find customer ID for tenant ${tenantId}`);
      }

      // Parse storage regions from comma-separated string to array
      const storageRegions = storageRegionsStr
        .split(',')
        .map((region) => region.trim())
        .filter((region) => region.length > 0);

      if (storageRegions.length === 0) {
        throw new Error('At least one storage region is required.');
      }

      // Build features array from fixedCollection format
      const features: IDataObject[] = [];
      if (featuresData && featuresData.feature && Array.isArray(featuresData.feature)) {
        for (const featureItem of featuresData.feature as IDataObject[]) {
          const feature: IDataObject = {
            name: featureItem.name as string,
          };

          // Build attrs array if present
          const attrsData = featureItem.attrs as IDataObject | undefined;
          if (attrsData && attrsData.attr && Array.isArray(attrsData.attr)) {
            const attrs: IDataObject[] = [];
            for (const attrItem of attrsData.attr as IDataObject[]) {
              attrs.push({
                name: attrItem.name as string,
                value: attrItem.value as number,
              });
            }
            feature.attrs = attrs;
          } else {
            feature.attrs = [];
          }

          features.push(feature);
        }
      }

      if (features.length === 0) {
        throw new Error('At least one feature is required.');
      }

      // Build request body
      const body: IDataObject = {
        productID: Number.parseInt(productID, 10),
        servicePlanID: Number.parseInt(servicePlanID, 10),
        tenantType: Number.parseInt(tenantType, 10),
        licenseExpiryDate,
        storageRegions,
        features,
      };

      // Add optional fields if provided
      if (quota !== undefined && quota > 0) {
        body.quota = quota;
      }
      if (quotaStartDate) {
        body.quotaStartDate = quotaStartDate;
      }
      if (quotaEndDate) {
        body.quotaEndDate = quotaEndDate;
      }

      try {
        const endpoint = `/msp/v3/customers/${customerId}/tenants/${tenantId}`;
        await logger.debug(`Tenant: Updating tenant at endpoint: ${endpoint}`, this);

        const updateResponse = (await druvaMspApiRequest.call(
          this,
          'PATCH',
          endpoint,
          body,
        )) as IDataObject;

        // If we should wait for task completion
        if (waitForCompletion && updateResponse.task && (updateResponse.task as IDataObject).id) {
          const taskId = (updateResponse.task as IDataObject).id as string;
          await logger.debug(`Tenant: Waiting for task ${taskId} to complete`, this);

          const taskResponse = await waitForTaskCompletion.call(this, taskId);
          responseData = taskResponse;
        } else {
          responseData = updateResponse;
        }
      } catch (error) {
        throw new Error(`Failed to update tenant: ${(error as Error).message}`);
      }
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
        await logger.debug(`Tenant: Suspending tenant at endpoint: ${endpoint}`, this);

        // POST request with no body
        const suspendResponse = (await druvaMspApiRequest.call(
          this,
          'POST',
          endpoint,
        )) as IDataObject;

        // If we should wait for task completion
        if (waitForCompletion && suspendResponse.task && (suspendResponse.task as IDataObject).id) {
          const taskId = (suspendResponse.task as IDataObject).id as string;
          await logger.debug(`Tenant: Waiting for task ${taskId} to complete`, this);

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
        await logger.debug(`Tenant: Unsuspending tenant at endpoint: ${endpoint}`, this);

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
          await logger.debug(`Tenant: Waiting for task ${taskId} to complete`, this);

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
  await logger.debug(
    `Tenant: Finalizing execution, responseData has ${Array.isArray(responseData) ? responseData.length : 'unknown'} items`,
    this,
  );
  await logger.debug(
    `Tenant: responseData type: ${typeof responseData}, isArray: ${Array.isArray(responseData)}`,
    this,
  );

  // Force the correct structure for responseData
  let returnItems: INodeExecutionData[] = [];

  if (Array.isArray(responseData)) {
    await logger.debug(`Tenant: Processing array response with ${responseData.length} items`, this);
    returnItems = responseData.map((item) => ({
      json: item,
    }));
  } else {
    await logger.debug('Tenant: Processing single item response', this);
    returnItems = [
      {
        json: responseData as IDataObject,
      },
    ];
  }

  await logger.debug(`Tenant: Final return contains ${returnItems.length} items`, this);
  return returnItems;
}
