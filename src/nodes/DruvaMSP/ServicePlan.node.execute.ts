import type {
  IExecuteFunctions,
  INodeExecutionData,
  IDataObject,
  NodeApiError,
} from 'n8n-workflow';

// These will be used when implementing the operations
import { druvaMspApiRequest, druvaMspApiRequestAllItems } from './GenericFunctions';
import { getServicePlanStatusLabel } from './helpers/ValueConverters';
import { enrichApiResponse, enrichApiResponseArray } from './helpers/ValueConverters';
import { logger } from './helpers/LoggerHelper';

export async function executeServicePlanOperation(
  this: IExecuteFunctions,
  i: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', i, '') as string;
  let responseData: INodeExecutionData[] = [];

  try {
    if (operation === 'get') {
      // Implement Get logic
      const servicePlanId = this.getNodeParameter('servicePlanId', i) as string;
      const endpoint = `/msp/v3/servicePlans/${servicePlanId}`;
      const response = (await druvaMspApiRequest.call(this, 'GET', endpoint)) as IDataObject;

      // Enrich the response with human-readable labels
      const enrichedResponse = enrichApiResponse(response, {
        status: getServicePlanStatusLabel,
      });

      responseData = this.helpers.returnJsonArray([enrichedResponse]);
    } else if (operation === 'getMany') {
      // Implement Get Many logic
      const returnAll = this.getNodeParameter('returnAll', i, false) as boolean;
      const limit = this.getNodeParameter('limit', i, 50) as number;
      const endpoint = '/msp/v3/servicePlans';

      // Get filter settings
      const filterByEdition = this.getNodeParameter('filterByEdition', i, false) as boolean;
      const selectedEditions = filterByEdition
        ? (this.getNodeParameter('editions', i, []) as string[])
        : [];

      const filterByFeature = this.getNodeParameter('filterByFeature', i, false) as boolean;
      const selectedFeatures = filterByFeature
        ? (this.getNodeParameter('features', i, []) as string[])
        : [];

      const filterByStatus = this.getNodeParameter('filterByStatus', i, false) as boolean;
      const selectedStatus = filterByStatus
        ? (this.getNodeParameter('status', i, 1) as number)
        : undefined;

      const filterByName = this.getNodeParameter('filterByName', i, false) as boolean;
      const nameContains = filterByName
        ? (this.getNodeParameter('nameContains', i, '') as string).toLowerCase()
        : '';

      // Log active filters in a consolidated format
      const activeFilters = [];
      if (filterByEdition && selectedEditions.length > 0)
        activeFilters.push(`editions: ${selectedEditions.join(', ')}`);
      if (filterByFeature && selectedFeatures.length > 0)
        activeFilters.push(`features: ${selectedFeatures.join(', ')}`);
      if (filterByStatus && selectedStatus !== undefined)
        activeFilters.push(`status: ${selectedStatus}`);
      if (filterByName && nameContains) activeFilters.push(`name contains: ${nameContains}`);

      if (activeFilters.length > 0) {
        logger.debug(
          `[INFO-START] Druva MSP API - Post-processing filters applied: ${activeFilters.join('; ')}`,
        );
      }

      let servicePlans: IDataObject[] = [];

      if (returnAll) {
        const allServicePlans = await druvaMspApiRequestAllItems.call(
          this,
          'GET',
          endpoint,
          'servicePlans',
        );

        // Enrich the response array with human-readable labels
        servicePlans = enrichApiResponseArray(allServicePlans as IDataObject[], {
          status: getServicePlanStatusLabel,
        });
      } else {
        // v3 API expects pageSize as a string
        const response = await druvaMspApiRequest.call(this, 'GET', endpoint, undefined, {
          pageSize: limit.toString(),
        });
        const plansData = (response as IDataObject)?.servicePlans ?? [];

        // Enrich the response array with human-readable labels
        servicePlans = enrichApiResponseArray(plansData as IDataObject[], {
          status: getServicePlanStatusLabel,
        });
      }

      // Apply post-API filtering
      let filteredServicePlans = servicePlans;

      // Filter by edition if requested
      if (filterByEdition && selectedEditions.length > 0) {
        filteredServicePlans = filteredServicePlans.filter((plan) => {
          const products = (plan.products as IDataObject[]) || [];

          // Check if any product has one of the selected editions
          return products.some((product) => {
            const edition = product.edition as string;
            return selectedEditions.includes(edition);
          });
        });
      }

      // Filter by feature if requested
      if (filterByFeature && selectedFeatures.length > 0) {
        filteredServicePlans = filteredServicePlans.filter((plan) => {
          const products = (plan.products as IDataObject[]) || [];

          // Check if any product has any of the selected features
          return products.some((product) => {
            const features = (product.features as IDataObject[]) || [];
            return features.some((feature) => {
              const featureName = feature.name as string;
              return selectedFeatures.includes(featureName);
            });
          });
        });
      }

      // Filter by status if requested
      if (filterByStatus && selectedStatus !== undefined) {
        filteredServicePlans = filteredServicePlans.filter((plan) => {
          const status = plan.status as number;
          return status === selectedStatus;
        });
      }

      // Filter by name if requested
      if (filterByName && nameContains) {
        filteredServicePlans = filteredServicePlans.filter((plan) => {
          const name = plan.name as string;
          return name.toLowerCase().includes(nameContains);
        });
      }

      // Add a summary message about the number of service plans found after filtering
      logger.debug(
        `[INFO-END] Druva MSP API - Filter summary: ${filteredServicePlans.length}/${servicePlans.length} service plans match criteria`,
      );

      responseData = this.helpers.returnJsonArray(filteredServicePlans);
    }
  } catch (error) {
    if (this.continueOnFail()) {
      return [{ json: {}, error: error as NodeApiError }];
    }
    throw error;
  }

  return responseData;
}
