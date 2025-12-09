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
} from './GenericFunctions';
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

  const FEATURE_SCHEMAS: Record<
    string,
    {
      type: 'boolean' | 'intAttrs';
      attrs?: string[];
    }
  > = {
    'Enterprise Workloads': { type: 'boolean' },
    'Enterprise Workloads Accelerated Ransomware Recovery': { type: 'boolean' },
    'Long Term Retention': { type: 'boolean' },
    M365: { type: 'intAttrs', attrs: ['userCount', 'preservedUserCount', 'educationLicenseState'] },
    'Google Workspace': {
      type: 'intAttrs',
      attrs: ['userCount', 'preservedUserCount', 'educationLicenseState'],
    },
    Endpoints: { type: 'intAttrs', attrs: ['userCount', 'preservedUserCount'] },
    'M365 Accelerated Ransomware Recovery': { type: 'boolean' },
    'Endpoints Accelerated Ransomware Recovery': { type: 'boolean' },
    'Google Workspace Accelerated Ransomware Recovery': { type: 'boolean' },
  };

  const parseStorageRegions = (raw: IDataObject): IDataObject[] => {
    const regions = (raw as IDataObject).region as IDataObject[] | undefined;
    if (!regions || regions.length === 0) {
      throw new Error('At least one storage region is required.');
    }

    return regions.map((entry, index) => {
      const name = (entry.name as string | undefined)?.trim();
      const provider = Number(entry.storageProvider);

      if (!name) {
        throw new Error(`Storage region #${index + 1} is missing a name.`);
      }

      if (![1, 2].includes(provider)) {
        throw new Error(
          `Storage region ${name} has invalid storageProvider ${entry.storageProvider}. Use 1 for AWS or 2 for Azure.`,
        );
      }

      return { name, storageProvider: provider };
    });
  };

  const parseFeatures = (raw: IDataObject): IDataObject[] => {
    const featureItems = (raw as IDataObject).feature as IDataObject[] | undefined;
    if (!featureItems || featureItems.length === 0) {
      throw new Error('At least one feature is required.');
    }

    const parsed: IDataObject[] = [];

    for (const featureItem of featureItems) {
      const featureName = featureItem.name as string | undefined;
      if (!featureName) {
        throw new Error('Feature name is required.');
      }

      const schema = FEATURE_SCHEMAS[featureName];
      if (!schema) {
        throw new Error(`Unsupported feature "${featureName}".`);
      }

      if (schema.type === 'boolean') {
        // Boolean features must not carry attrs
        const attrsData = featureItem.attrs as IDataObject | undefined;
        const attrArray = attrsData ? ((attrsData as IDataObject).attr as IDataObject[]) ?? [] : [];
        if (attrArray.length > 0) {
          throw new Error(`Feature "${featureName}" does not accept attributes.`);
        }

        parsed.push({ name: featureName, attrs: [] });
        continue;
      }

      const attrsData = featureItem.attrs as IDataObject | undefined;
      const attrArray = attrsData ? ((attrsData as IDataObject).attr as IDataObject[]) ?? [] : [];

      if (!attrArray.length) {
        throw new Error(`Feature "${featureName}" requires at least one attribute.`);
      }

      const allowedAttrs = schema.attrs ?? [];
      const attrs: IDataObject[] = [];

      for (const attr of attrArray) {
        const attrName = attr.name as string | undefined;
        if (!attrName) {
          throw new Error(`Feature "${featureName}" has an attribute without a name.`);
        }

        if (!allowedAttrs.includes(attrName)) {
          throw new Error(
            `Feature "${featureName}" does not support attribute "${attrName}". Allowed: ${allowedAttrs.join(', ')}`,
          );
        }

        const value = Number(attr.value);
        if (!Number.isFinite(value)) {
          throw new Error(`Attribute "${attrName}" for feature "${featureName}" must be a number.`);
        }

        attrs.push({
          name: attrName,
          value,
        });
      }

      parsed.push({ name: featureName, attrs });
    }

    return parsed;
  };

  const parseFeaturesForPatch = (raw: IDataObject): IDataObject[] | undefined => {
    const featureItems = (raw as IDataObject).feature as IDataObject[] | undefined;
    if (!featureItems || featureItems.length === 0) {
      return undefined;
    }

    const parsed: IDataObject[] = [];

    for (const featureItem of featureItems) {
      const featureName = featureItem.name as string | undefined;
      if (!featureName) {
        throw new Error('Feature name is required.');
      }

      const schema = FEATURE_SCHEMAS[featureName];
      if (!schema) {
        throw new Error(`Unsupported feature "${featureName}".`);
      }

      const isEnabled = featureItem.isEnabled as boolean | undefined;
      if (isEnabled === undefined) {
        throw new Error(`Feature "${featureName}" requires the isEnabled flag.`);
      }

      const attrsData = featureItem.attrs as IDataObject | undefined;
      const attrArray = attrsData ? ((attrsData as IDataObject).attr as IDataObject[]) ?? [] : [];

      if (schema.type === 'boolean') {
        if (attrArray.length > 0) {
          throw new Error(`Feature "${featureName}" does not accept attributes.`);
        }

        parsed.push({ name: featureName, isEnabled, attrs: [] });
        continue;
      }

      // For intAttrs features in PATCH, attrs can be empty per API spec
      const allowedAttrs = schema.attrs ?? [];
      const attrs: IDataObject[] = [];

      for (const attr of attrArray) {
        const attrName = attr.name as string | undefined;
        if (!attrName) {
          throw new Error(`Feature "${featureName}" has an attribute without a name.`);
        }

        if (!allowedAttrs.includes(attrName)) {
          throw new Error(
            `Feature "${featureName}" does not support attribute "${attrName}". Allowed: ${allowedAttrs.join(', ')}`,
          );
        }

        const value = Number(attr.value);
        if (!Number.isFinite(value)) {
          throw new Error(`Attribute "${attrName}" for feature "${featureName}" must be a number.`);
        }

        attrs.push({
          name: attrName,
          value,
        });
      }

      parsed.push({ name: featureName, isEnabled, attrs });
    }

    return parsed;
  };

  try {
    if (operation === 'get') {
      const tenantId = this.getNodeParameter('tenantId', i, '') as string;
      if (!tenantId) {
        throw new Error('Tenant ID is required for the get operation.');
      }

      // Automatically retrieve the customer ID for the tenant using v3 list lookup
      const customerId = await getTenantCustomerId.call(this, tenantId);

      if (!customerId) {
        logger.warn(`Tenant: No customer ID found for tenant ${tenantId}; returning empty result`);
        responseData = {};
      } else {
        const endpoint = `/msp/v3/customers/${customerId}/tenants/${tenantId}`;
        let response = (await druvaMspApiRequest.call(this, 'GET', endpoint)) as IDataObject;

        // Enrich the response with human-readable labels
        response = enrichApiResponse(response, {
          status: getTenantStatusLabel,
          tenantType: getTenantTypeLabel,
          productID: getProductIdLabel,
        });

        responseData = response;
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

      const qs: IDataObject = { includeFeatures: false };

      // Add customerId to query params if specified, but use 'customerIds' as the param name
      // as that's what the API expects according to the documentation
      if (filterByCustomer && customerId) {
        qs.customerIds = customerId;
        logger.info(`Tenant: Filtering tenants by customer ID: ${customerId}`);
      }

      // v3 API expects pageSize as a string
      qs.pageSize = returnAll ? '100' : limit.toString();

      // Use the global responseData variable, don't redeclare it locally
      if (returnAll) {
        const tenants = (await druvaMspApiRequestAllItems.call(
          this,
          'GET',
          endpoint,
          'tenants',
          {},
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
      const storageRegionsData = this.getNodeParameter('storageRegions', i, {}) as IDataObject;
      const quota = this.getNodeParameter('quota', i, undefined) as number | undefined;
      const quotaStartDate = this.getNodeParameter('quotaStartDate', i, undefined) as
        | string
        | undefined;
      const quotaEndDate = this.getNodeParameter('quotaEndDate', i, undefined) as
        | string
        | undefined;
      const featuresData = this.getNodeParameter('features', i, {}) as IDataObject;

      const storageRegions = parseStorageRegions(storageRegionsData);
      const features = parseFeatures(featuresData);

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

        // Return the create response with task information
        // Note: To wait for task completion, use the Task resource "Get Task" operation
        // in a workflow loop with a Wait node
        responseData = createResponse;
      } catch (error) {
        throw new Error(`Failed to create tenant: ${(error as Error).message}`);
      }
    } else if (operation === 'update') {
      const tenantId = this.getNodeParameter('tenantId', i, '') as string;
      if (!tenantId) {
        throw new Error('Tenant ID is required for the update operation.');
      }

      const servicePlanID = this.getNodeParameter('servicePlanID', i, '') as string;
      const tenantType = this.getNodeParameter('tenantType', i, '') as string;
      const licenseExpiryDate = this.getNodeParameter('licenseExpiryDate', i, '') as string;
      const storageRegionsData = this.getNodeParameter('storageRegions', i, {}) as IDataObject;
      const quota = this.getNodeParameter('quota', i, undefined) as number | undefined;
      const quotaStartDate = this.getNodeParameter('quotaStartDate', i, undefined) as
        | string
        | undefined;
      const quotaEndDate = this.getNodeParameter('quotaEndDate', i, undefined) as
        | string
        | undefined;
      const featuresData = this.getNodeParameter('features', i, {}) as IDataObject;

      // Get the customer ID for this tenant
      const customerId = await getTenantCustomerId.call(this, tenantId);
      if (!customerId) {
        throw new Error(`Could not find customer ID for tenant ${tenantId}`);
      }

      const hasStorageRegions =
        storageRegionsData &&
        typeof storageRegionsData === 'object' &&
        Array.isArray((storageRegionsData as IDataObject).region) &&
        ((storageRegionsData as IDataObject).region as IDataObject[]).length > 0;

      const storageRegions = hasStorageRegions ? parseStorageRegions(storageRegionsData) : undefined;
      const features = parseFeaturesForPatch(featuresData);

      // Build request body with provided fields only
      const body: IDataObject = {};

      if (servicePlanID) {
        body.servicePlanID = Number.parseInt(servicePlanID, 10);
      }
      if (tenantType) {
        body.tenantType = Number.parseInt(tenantType, 10);
      }
      if (licenseExpiryDate) {
        body.licenseExpiryDate = licenseExpiryDate;
      }
      if (storageRegions) {
        body.storageRegions = storageRegions;
      }
      if (features) {
        body.features = features;
      }
      if (quota !== undefined && quota > 0) {
        body.quota = quota;
      }
      if (quotaStartDate) {
        body.quotaStartDate = quotaStartDate;
      }
      if (quotaEndDate) {
        body.quotaEndDate = quotaEndDate;
      }

      if (Object.keys(body).length === 0) {
        throw new Error('Provide at least one field to update.');
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

        // Return the update response with task information
        // Note: To wait for task completion, use the Task resource "Get Task" operation
        // in a workflow loop with a Wait node
        responseData = updateResponse;
      } catch (error) {
        throw new Error(`Failed to update tenant: ${(error as Error).message}`);
      }
    } else if (operation === 'suspend') {
      // Parameter
      const tenantId = this.getNodeParameter('tenantId', i, '') as string;
      if (!tenantId) {
        throw new Error('Tenant ID is required for the suspend operation.');
      }

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

        // Return the suspend response with task information
        // Note: To wait for task completion, use the Task resource "Get Task" operation
        // in a workflow loop with a Wait node
        responseData = suspendResponse;
      } catch (error) {
        throw new Error(`Failed to suspend tenant: ${(error as Error).message}`);
      }
    } else if (operation === 'unsuspend') {
      // Parameter
      const tenantId = this.getNodeParameter('tenantId', i, '') as string;
      if (!tenantId) {
        throw new Error('Tenant ID is required for the unsuspend operation.');
      }

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
        // Return the unsuspend response with task information
        // Note: To wait for task completion, use the Task resource "Get Task" operation
        // in a workflow loop with a Wait node
        responseData = unsuspendResponse;
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
