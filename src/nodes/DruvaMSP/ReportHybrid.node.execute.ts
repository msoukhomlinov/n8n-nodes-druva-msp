import type { IExecuteFunctions, IDataObject, INodeExecutionData } from 'n8n-workflow';

import { druvaMspApiRequest, druvaMspApiRequestAllPagedItems } from './GenericFunctions';

/**
 * Common function for fetching report items with pagination handling
 * @deprecated Use druvaMspApiRequestAllPagedItems from GenericFunctions.ts instead
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function fetchAllReportItems(
  this: IExecuteFunctions,
  endpoint: string,
  requestBody: IDataObject,
  itemsKey: string,
  returnAll: boolean,
  limit?: number,
) {
  const returnData: IDataObject[] = [];
  let responseData: IDataObject;
  let nextPageToken: string | undefined;

  do {
    // Add next token to request if it exists
    const paginatedRequestBody = { ...requestBody };
    if (nextPageToken) {
      paginatedRequestBody.pageToken = nextPageToken;
    }

    // Make the API request
    responseData = (await druvaMspApiRequest.call(
      this,
      'POST',
      endpoint,
      paginatedRequestBody,
    )) as IDataObject;

    // Add results to return data
    if (responseData.items && Array.isArray(responseData.items)) {
      returnData.push(...(responseData.items as IDataObject[]));
    }

    // Update nextPageToken for pagination
    nextPageToken = responseData.nextPageToken as string | undefined;

    // Break if we've reached the limit
    if (!returnAll && limit && returnData.length >= limit) {
      return returnData.slice(0, limit);
    }
  } while (returnAll && nextPageToken);

  return returnData;
}

/**
 * Determines if customers should be filtered and returns the customerIds array
 */
function getCustomerIds(this: IExecuteFunctions): string[] | undefined {
  const filterByCustomers = this.getNodeParameter('filterByCustomers', 0, false) as boolean;

  if (filterByCustomers) {
    const customerIds = this.getNodeParameter('customerIds', 0, []) as string[];
    return customerIds.length > 0 ? customerIds : undefined;
  }

  return undefined;
}

/**
 * Determines if dates should be filtered and returns the appropriate date range
 */
function getDateRange(
  this: IExecuteFunctions,
  operation: string,
): { [key: string]: string } | undefined {
  const filterByDateRange = this.getNodeParameter('filterByDateRange', 0, false) as boolean;

  if (!filterByDateRange) {
    return undefined;
  }

  // For operations that use startDate/endDate format
  if (['getBackupActivityReport', 'getConsumptionByBackupSetReport'].includes(operation)) {
    return {
      startDate: this.getNodeParameter('startDate', 0) as string,
      endDate: this.getNodeParameter('endDate', 0) as string,
    };
  }

  // For operations that use startTime/endTime format
  return {
    startTime: this.getNodeParameter('startTime', 0) as string,
    endTime: this.getNodeParameter('endTime', 0) as string,
  };
}

/**
 * Execute the Hybrid Workloads Report operations
 */
export async function executeReportHybridOperation(
  this: IExecuteFunctions,
): Promise<INodeExecutionData[][]> {
  const items = this.getInputData();
  const returnData: INodeExecutionData[] = [];
  const operation = this.getNodeParameter('operation', 0) as string;
  const returnAll = this.getNodeParameter('returnAll', 0, false) as boolean;
  const limit = returnAll ? 0 : (this.getNodeParameter('limit', 0, 100) as number);

  for (let i = 0; i < items.length; i++) {
    try {
      // Common filters that might be used across operations
      const customerIds = getCustomerIds.call(this);
      const dateRange = getDateRange.call(this, operation);

      // Base request body with pagination
      const requestBody: IDataObject = {
        page: 1,
        pageSize: limit || 500,
      };

      // Add common filters to request body if they exist
      if (customerIds) {
        requestBody.customerIds = customerIds;
      }

      if (dateRange) {
        Object.assign(requestBody, dateRange);
      }

      let endpoint = '';
      let responseData: IDataObject[] = [];

      // Branch based on operation type
      if (operation === 'getBackupActivityReport') {
        endpoint = '/msp/reporting/v1/reports/mspEWBackupActivity';

        // Add additional filters specific to this operation
        const filterByWorkloadTypes = this.getNodeParameter(
          'filterByWorkloadTypes',
          0,
          false,
        ) as boolean;
        if (filterByWorkloadTypes) {
          const workloadTypes = this.getNodeParameter('workloadTypes', 0, []) as string[];
          if (workloadTypes.length > 0) {
            requestBody.workloadTypes = workloadTypes;
          }
        }

        const filterByBackupStatus = this.getNodeParameter(
          'filterByBackupStatus',
          0,
          false,
        ) as boolean;
        if (filterByBackupStatus) {
          const backupStatus = this.getNodeParameter('backupStatus', 0, []) as string[];
          if (backupStatus.length > 0) {
            requestBody.backupStatus = backupStatus;
          }
        }
      } else if (operation === 'getConsumptionByBackupSetReport') {
        endpoint = '/msp/reporting/v1/reports/mspEWConsumptionByBackupSet';

        // Add additional filters specific to this operation
        const filterByWorkloadTypes = this.getNodeParameter(
          'filterByWorkloadTypes',
          0,
          false,
        ) as boolean;
        if (filterByWorkloadTypes) {
          const workloadTypes = this.getNodeParameter('workloadTypes', 0, []) as string[];
          if (workloadTypes.length > 0) {
            requestBody.workloadTypes = workloadTypes;
          }
        }
      } else if (operation === 'getDRFailbackActivityReport') {
        endpoint = '/msp/reporting/v1/reports/mspEWDisasterRecoveryFailbackActivity';

        // Add additional filters specific to this operation
        const filterByDRPlanIds = this.getNodeParameter('filterByDRPlanIds', 0, false) as boolean;
        if (filterByDRPlanIds) {
          const drPlanIds = this.getNodeParameter('drPlanIds', 0, []) as string[];
          if (drPlanIds.length > 0) {
            requestBody.drPlanIds = drPlanIds;
          }
        }
      } else if (operation === 'getDRFailoverActivityReport') {
        endpoint = '/msp/reporting/v1/reports/mspEWDisasterRecoveryFailoverActivity';

        // Add additional filters specific to this operation
        const filterByDRPlanIds = this.getNodeParameter('filterByDRPlanIds', 0, false) as boolean;
        if (filterByDRPlanIds) {
          const drPlanIds = this.getNodeParameter('drPlanIds', 0, []) as string[];
          if (drPlanIds.length > 0) {
            requestBody.drPlanIds = drPlanIds;
          }
        }
      } else if (operation === 'getDRReplicationActivityReport') {
        endpoint = '/msp/reporting/v1/reports/mspEWDisasterRecoveryReplicationActivity';

        // Add additional filters specific to this operation
        const filterByDRPlanIds = this.getNodeParameter('filterByDRPlanIds', 0, false) as boolean;
        if (filterByDRPlanIds) {
          const drPlanIds = this.getNodeParameter('drPlanIds', 0, []) as string[];
          if (drPlanIds.length > 0) {
            requestBody.drPlanIds = drPlanIds;
          }
        }
      } else if (operation === 'getResourceStatusReport') {
        endpoint = '/msp/reporting/v1/reports/mspEWResourceStatus';

        // Add additional filters specific to this operation
        const filterByResourceStatus = this.getNodeParameter(
          'filterByResourceStatus',
          0,
          false,
        ) as boolean;
        if (filterByResourceStatus) {
          const resourceStatus = this.getNodeParameter('resourceStatus', 0, []) as string[];
          if (resourceStatus.length > 0) {
            requestBody.resourceStatus = resourceStatus;
          }
        }

        const filterByResourceTypes = this.getNodeParameter(
          'filterByResourceTypes',
          0,
          false,
        ) as boolean;
        if (filterByResourceTypes) {
          const resourceType = this.getNodeParameter('resourceType', 0, []) as string[];
          if (resourceType.length > 0) {
            requestBody.resourceType = resourceType;
          }
        }
      } else if (operation === 'getAlertHistoryReport') {
        endpoint = '/msp/reporting/v1/reports/mspEWAlertHistory';

        // Add additional filters specific to this operation
        const filterByAlertSeverity = this.getNodeParameter(
          'filterByAlertSeverity',
          0,
          false,
        ) as boolean;
        if (filterByAlertSeverity) {
          const alertSeverity = this.getNodeParameter('alertSeverity', 0, []) as string[];
          if (alertSeverity.length > 0) {
            requestBody.alertSeverity = alertSeverity;
          }
        }
      }

      // Fetch data with pagination handling
      if (returnAll) {
        responseData = await druvaMspApiRequestAllPagedItems.call(
          this,
          'POST',
          endpoint,
          requestBody,
          'items',
        );
      } else {
        // For limit requests, we can just use druvaMspApiRequest directly
        const response = (await druvaMspApiRequest.call(
          this,
          'POST',
          endpoint,
          requestBody,
        )) as IDataObject;
        responseData = (response.items as IDataObject[]) || [];
      }

      // Return the data
      returnData.push(...this.helpers.returnJsonArray(responseData));
    } catch (error) {
      if (this.continueOnFail()) {
        returnData.push({ json: { error: error.message } });
        continue;
      }
      throw error;
    }
  }

  return [returnData];
}
