import type {
  IExecuteFunctions,
  IDataObject,
  INodeExecutionData,
  NodeApiError,
} from 'n8n-workflow';

import { druvaMspApiRequest } from './GenericFunctions';

/**
 * Custom function to fetch all items for report endpoints that use POST with nextToken in the body
 */
async function fetchAllReportItems(
  this: IExecuteFunctions,
  endpoint: string,
  initialBody: IDataObject,
): Promise<IDataObject[]> {
  const allItems: IDataObject[] = [];
  let nextToken: string | null | undefined = undefined;
  const body = { ...initialBody };

  do {
    // If we have a next token, add it to the body
    if (nextToken) {
      body.nextToken = nextToken;
    }

    // Make the request
    const response = (await druvaMspApiRequest.call(this, 'POST', endpoint, body)) as IDataObject;

    // Get items from the response
    const items = response.items as IDataObject[] | undefined;
    nextToken = response.nextToken as string | null | undefined;

    // Add items to our result array
    if (Array.isArray(items) && items.length > 0) {
      allItems.push(...items);
    } else {
      // No more items, exit the loop
      nextToken = null;
    }
  } while (nextToken);

  return allItems;
}

/**
 * Executes the selected Report - Endpoint operation.
 * @param this The context object.
 * @param i The index of the current item.
 * @returns The result of the operation.
 */
export async function executeReportEndpointOperation(
  this: IExecuteFunctions,
  i: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', i, '') as string;
  let responseData: INodeExecutionData[] = [];

  try {
    // Common parameters
    const returnAll = this.getNodeParameter('returnAll', i, false) as boolean;
    const limit = returnAll ? 0 : (this.getNodeParameter('limit', i, 100) as number);
    const filterByDateRange = this.getNodeParameter('filterByDateRange', i, true) as boolean;
    const filterByCustomers = this.getNodeParameter('filterByCustomers', i, false) as boolean;

    // Base request body
    const body: IDataObject = {};

    // Add date range parameters if filtering by date
    if (filterByDateRange) {
      body.startTime = this.getNodeParameter('startTime', i, '') as string;
      body.endTime = this.getNodeParameter('endTime', i, '') as string;
    }

    // Add customer IDs if filtering by customers
    if (filterByCustomers) {
      const customerIds = this.getNodeParameter('customerIds', i, []) as string[];
      if (customerIds.length > 0) {
        body.customerIds = customerIds;
      }
    }

    // Set pagination parameters if not returning all
    if (!returnAll) {
      body.pageSize = limit;
    }

    // Execute the specific operation
    if (operation === 'getUsers') {
      // Get Users Report
      const endpoint = '/msp/reporting/v1/reports/mspEPUsers';

      const filterByUserStatus = this.getNodeParameter('filterByUserStatus', i, false) as boolean;
      if (filterByUserStatus) {
        const userStatus = this.getNodeParameter('userStatus', i, []) as string[];
        if (userStatus.length > 0) {
          body.userStatus = userStatus;
        }
      }

      if (returnAll) {
        const allItems = await fetchAllReportItems.call(this, endpoint, body);
        responseData = this.helpers.returnJsonArray(allItems);
      } else {
        const response = await druvaMspApiRequest.call(this, 'POST', endpoint, body);
        const items = (response as IDataObject)?.items ?? [];
        responseData = this.helpers.returnJsonArray(items as IDataObject[]);
      }
    } else if (operation === 'getUserRollout') {
      // Get User Rollout Report
      const endpoint = '/msp/reporting/v1/reports/mspEPUserRollout';

      const filterByRolloutStatus = this.getNodeParameter(
        'filterByRolloutStatus',
        i,
        false,
      ) as boolean;
      if (filterByRolloutStatus) {
        const rolloutStatus = this.getNodeParameter('rolloutStatus', i, []) as string[];
        if (rolloutStatus.length > 0) {
          body.rolloutStatus = rolloutStatus;
        }
      }

      if (returnAll) {
        const allItems = await fetchAllReportItems.call(this, endpoint, body);
        responseData = this.helpers.returnJsonArray(allItems);
      } else {
        const response = await druvaMspApiRequest.call(this, 'POST', endpoint, body);
        const items = (response as IDataObject)?.items ?? [];
        responseData = this.helpers.returnJsonArray(items as IDataObject[]);
      }
    } else if (operation === 'getUserProvisioning') {
      // Get User Provisioning Report
      const endpoint = '/msp/reporting/v1/reports/mspEPUserProvisioning';

      const filterByProvisioningStatus = this.getNodeParameter(
        'filterByProvisioningStatus',
        i,
        false,
      ) as boolean;
      if (filterByProvisioningStatus) {
        const provisioningStatus = this.getNodeParameter('provisioningStatus', i, []) as string[];
        if (provisioningStatus.length > 0) {
          body.provisioningStatus = provisioningStatus;
        }
      }

      if (returnAll) {
        const allItems = await fetchAllReportItems.call(this, endpoint, body);
        responseData = this.helpers.returnJsonArray(allItems);
      } else {
        const response = await druvaMspApiRequest.call(this, 'POST', endpoint, body);
        const items = (response as IDataObject)?.items ?? [];
        responseData = this.helpers.returnJsonArray(items as IDataObject[]);
      }
    } else if (operation === 'getLicenseUsage') {
      // Get License Usage Report
      const endpoint = '/msp/reporting/v1/reports/mspEPLicenseUsage';

      // Add period parameter
      body.period = this.getNodeParameter('period', i, 'WEEKLY') as string;

      if (returnAll) {
        const allItems = await fetchAllReportItems.call(this, endpoint, body);
        responseData = this.helpers.returnJsonArray(allItems);
      } else {
        const response = await druvaMspApiRequest.call(this, 'POST', endpoint, body);
        const items = (response as IDataObject)?.items ?? [];
        responseData = this.helpers.returnJsonArray(items as IDataObject[]);
      }
    } else if (operation === 'getLastBackupStatus') {
      // Get Last Backup Status Report
      const endpoint = '/msp/reporting/v1/reports/mspEPLastBackupStatus';

      const filterByBackupStatus = this.getNodeParameter(
        'filterByBackupStatus',
        i,
        false,
      ) as boolean;
      if (filterByBackupStatus) {
        const backupStatus = this.getNodeParameter('backupStatus', i, []) as string[];
        if (backupStatus.length > 0) {
          body.backupStatus = backupStatus;
        }
      }

      const filterByDeviceTypes = this.getNodeParameter('filterByDeviceTypes', i, false) as boolean;
      if (filterByDeviceTypes) {
        const deviceTypes = this.getNodeParameter('deviceTypes', i, []) as string[];
        if (deviceTypes.length > 0) {
          body.deviceTypes = deviceTypes;
        }
      }

      const filterByDataSourceTypes = this.getNodeParameter(
        'filterByDataSourceTypes',
        i,
        false,
      ) as boolean;
      if (filterByDataSourceTypes) {
        const dataSourceTypes = this.getNodeParameter('dataSourceTypes', i, []) as string[];
        if (dataSourceTypes.length > 0) {
          body.dataSourceTypes = dataSourceTypes;
        }
      }

      if (returnAll) {
        const allItems = await fetchAllReportItems.call(this, endpoint, body);
        responseData = this.helpers.returnJsonArray(allItems);
      } else {
        const response = await druvaMspApiRequest.call(this, 'POST', endpoint, body);
        const items = (response as IDataObject)?.items ?? [];
        responseData = this.helpers.returnJsonArray(items as IDataObject[]);
      }
    } else if (operation === 'getAlerts') {
      // Get Alerts Report
      const endpoint = '/msp/reporting/v1/reports/mspEPAlerts';

      const filterByAlertTypes = this.getNodeParameter('filterByAlertTypes', i, false) as boolean;
      if (filterByAlertTypes) {
        const alertTypes = this.getNodeParameter('alertTypes', i, []) as string[];
        if (alertTypes.length > 0) {
          body.alertTypes = alertTypes;
        }
      }

      const filterByAlertSeverity = this.getNodeParameter(
        'filterByAlertSeverity',
        i,
        false,
      ) as boolean;
      if (filterByAlertSeverity) {
        const alertSeverity = this.getNodeParameter('alertSeverity', i, []) as string[];
        if (alertSeverity.length > 0) {
          body.alertSeverity = alertSeverity;
        }
      }

      if (returnAll) {
        const allItems = await fetchAllReportItems.call(this, endpoint, body);
        responseData = this.helpers.returnJsonArray(allItems);
      } else {
        const response = await druvaMspApiRequest.call(this, 'POST', endpoint, body);
        const items = (response as IDataObject)?.items ?? [];
        responseData = this.helpers.returnJsonArray(items as IDataObject[]);
      }
    } else if (operation === 'getStorageStatistics') {
      // Get Storage Statistics Report
      const endpoint = '/msp/reporting/v1/reports/mspEPStorageStatistics';

      // Add period parameter
      body.period = this.getNodeParameter('storagePeriod', i, 'DAILY') as string;

      if (returnAll) {
        const allItems = await fetchAllReportItems.call(this, endpoint, body);
        responseData = this.helpers.returnJsonArray(allItems);
      } else {
        const response = await druvaMspApiRequest.call(this, 'POST', endpoint, body);
        const items = (response as IDataObject)?.items ?? [];
        responseData = this.helpers.returnJsonArray(items as IDataObject[]);
      }
    } else if (operation === 'getStorageAlert') {
      // Get Storage Alert Report
      const endpoint = '/msp/reporting/v1/reports/mspEPStorageAlert';

      const filterByStorageAlertTypes = this.getNodeParameter(
        'filterByStorageAlertTypes',
        i,
        false,
      ) as boolean;
      if (filterByStorageAlertTypes) {
        const storageAlertTypes = this.getNodeParameter('storageAlertTypes', i, []) as string[];
        if (storageAlertTypes.length > 0) {
          body.storageAlertTypes = storageAlertTypes;
        }
      }

      if (returnAll) {
        const allItems = await fetchAllReportItems.call(this, endpoint, body);
        responseData = this.helpers.returnJsonArray(allItems);
      } else {
        const response = await druvaMspApiRequest.call(this, 'POST', endpoint, body);
        const items = (response as IDataObject)?.items ?? [];
        responseData = this.helpers.returnJsonArray(items as IDataObject[]);
      }
    } else if (operation === 'getCloudCacheStatistics') {
      // Get Cloud Cache Statistics Report
      const endpoint = '/msp/reporting/v1/reports/mspEPCloudCacheStatistics';

      // Add period parameter
      body.period = this.getNodeParameter('cloudCachePeriod', i, 'DAILY') as string;

      const filterByCacheStatus = this.getNodeParameter('filterByCacheStatus', i, false) as boolean;
      if (filterByCacheStatus) {
        const cacheStatus = this.getNodeParameter('cacheStatus', i, []) as string[];
        if (cacheStatus.length > 0) {
          body.cacheStatus = cacheStatus;
        }
      }

      if (returnAll) {
        const allItems = await fetchAllReportItems.call(this, endpoint, body);
        responseData = this.helpers.returnJsonArray(allItems);
      } else {
        const response = await druvaMspApiRequest.call(this, 'POST', endpoint, body);
        const items = (response as IDataObject)?.items ?? [];
        responseData = this.helpers.returnJsonArray(items as IDataObject[]);
      }
    }
  } catch (error) {
    if (this.continueOnFail()) {
      return [{ json: {}, error: error as NodeApiError }];
    }
    throw error;
  }

  return responseData;
}
