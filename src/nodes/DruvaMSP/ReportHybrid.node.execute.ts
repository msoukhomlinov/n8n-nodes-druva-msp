import type { IExecuteFunctions, IDataObject, INodeExecutionData } from 'n8n-workflow';

import { druvaMspApiRequest, druvaMspApiRequestAllPagedItems } from './GenericFunctions';
import { getRelativeDateRange } from './helpers/DateHelpers';

/**
 * Helper function to create a filter object for the report APIs
 */
function createFilter(
  fieldName: string,
  operator: string,
  value: string | number | string[] | number[],
): IDataObject {
  return {
    fieldName,
    operator,
    value,
  };
}

/**
 * Helper function to build the filters object for the report APIs
 */
function buildFiltersObject(pageSize: number, filters: IDataObject[] = []): IDataObject {
  return {
    pageSize,
    filterBy: filters,
  };
}

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
 * Determines date range based on the date selection method.
 */
function getDateRange(this: IExecuteFunctions): { startDate: string; endDate: string } | undefined {
  const dateSelectionMethod = this.getNodeParameter(
    'dateSelectionMethod',
    0,
    'relativeDates',
  ) as string;

  // If no date filtering is needed
  if (dateSelectionMethod === 'noDates') {
    return undefined;
  }

  let startDate = '';
  let endDate = '';

  // Handle specific dates selection
  if (dateSelectionMethod === 'specificDates') {
    startDate = this.getNodeParameter('startDate', 0, '') as string;
    endDate = this.getNodeParameter('endDate', 0, '') as string;

    // If either date is missing, return undefined
    if (!startDate || !endDate) {
      return undefined;
    }
  }
  // Handle relative date range selection
  else if (dateSelectionMethod === 'relativeDates') {
    const relativeDateRange = this.getNodeParameter(
      'relativeDateRange',
      0,
      'currentMonth',
    ) as string;
    const dateRange = getRelativeDateRange(relativeDateRange);
    startDate = dateRange.startDate;
    endDate = dateRange.endDate;
  }

  return { startDate, endDate };
}

/**
 * Adds date filters to the filters array using the appropriate field names for each operation
 */
function addDateFilters(
  this: IExecuteFunctions,
  filters: IDataObject[],
  operation: string,
  dateRange?: { startDate: string; endDate: string },
): void {
  if (!dateRange) return;

  const { startDate, endDate } = dateRange;

  // Alert History report uses lastUpdatedTime field
  if (operation === 'getAlertHistoryReport') {
    if (startDate) {
      filters.push(createFilter('lastUpdatedTime', 'GTE', startDate));
    }
    if (endDate) {
      filters.push(createFilter('lastUpdatedTime', 'LTE', endDate));
    }
  }
  // Backup Activity report uses started/ended fields for date filtering
  else if (operation === 'getBackupActivityReport') {
    if (startDate) {
      filters.push(createFilter('started', 'GTE', startDate));
    }
    if (endDate) {
      filters.push(createFilter('ended', 'LTE', endDate));
    }
  }
  // M365 Storage Consumption report does not support date filters
  else if (operation === 'getM365StorageConsumptionReport') {
    // Skip date filters for M365 Storage Consumption report
    // It provides a snapshot of current storage consumption, not time-series data
    return;
  }
  // Default behavior for other reports - use lastUpdatedTime
  else {
    if (startDate) {
      filters.push(createFilter('lastUpdatedTime', 'GTE', startDate));
    }
    if (endDate) {
      filters.push(createFilter('lastUpdatedTime', 'LTE', endDate));
    }
  }
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
      const dateRange = getDateRange.call(this);
      const pageSize = limit || 100;

      // Create filters array for the structured request format
      const filters: IDataObject[] = [];

      // Add customer filter if specified
      if (customerIds && customerIds.length > 0) {
        filters.push(createFilter('customerGlobalId', 'CONTAINS', customerIds));
      }

      // Add date filters with appropriate field names
      addDateFilters.call(this, filters, operation, dateRange);

      // Base request body with structured filters
      const requestBody: IDataObject = {
        filters: buildFiltersObject(pageSize, filters),
      };

      // Ensure the filterBy property is properly typed as an array
      const filterBy = ((requestBody.filters as IDataObject).filterBy as IDataObject[]) || [];

      let endpoint = '';
      let responseData: IDataObject[] = [];

      // Branch based on operation type and add operation-specific filters
      if (operation === 'getAlertHistoryReport') {
        endpoint = '/msp/reporting/v1/reports/mspEWAlertHistory';

        // Add Alert Severity filter if specified
        const filterByAlertSeverity = this.getNodeParameter(
          'filterByAlertSeverity',
          0,
          false,
        ) as boolean;
        if (filterByAlertSeverity) {
          const alertSeverity = this.getNodeParameter('alertSeverity', 0, []) as string[];
          if (alertSeverity.length > 0) {
            // Map severity values to the format expected by the API (first letter capitalized)
            const mappedSeverity = alertSeverity.map((severity) => {
              if (severity === 'CRITICAL') return 'Critical';
              if (severity === 'WARNING') return 'Warning';
              if (severity === 'INFO') return 'Info';
              return severity;
            });
            filterBy.push(createFilter('severity', 'CONTAINS', mappedSeverity));
          }
        }

        // Add Workload Types filter if specified
        const filterByWorkloadTypes = this.getNodeParameter(
          'filterByWorkloadTypes',
          0,
          false,
        ) as boolean;
        if (filterByWorkloadTypes) {
          const workloadTypes = this.getNodeParameter('workloadTypes', 0, []) as string[];
          if (workloadTypes.length > 0) {
            filterBy.push(createFilter('alertType', 'CONTAINS', workloadTypes));
          }
        }
      } else if (operation === 'getBackupActivityReport') {
        endpoint = '/msp/reporting/v1/reports/mspEWBackupActivity';

        // Add additional filters specific to this operation using the structured format
        const filterByWorkloadTypes = this.getNodeParameter(
          'filterByWorkloadTypes',
          0,
          false,
        ) as boolean;
        if (filterByWorkloadTypes) {
          const workloadTypes = this.getNodeParameter('workloadTypes', 0, []) as string[];
          if (workloadTypes.length > 0) {
            filterBy.push(createFilter('workloads', 'CONTAINS', workloadTypes));
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
            filterBy.push(createFilter('status', 'CONTAINS', backupStatus));
          }
        }
      } else if (operation === 'getConsumptionByBackupSetReport') {
        endpoint = '/msp/reporting/v1/reports/mspEWConsumptionByBackupSet';

        // Add additional filters specific to this operation using the structured format
        const filterByWorkloadTypes = this.getNodeParameter(
          'filterByWorkloadTypes',
          0,
          false,
        ) as boolean;
        if (filterByWorkloadTypes) {
          const workloadTypes = this.getNodeParameter('workloadTypes', 0, []) as string[];
          if (workloadTypes.length > 0) {
            filterBy.push(createFilter('workloadTypes', 'CONTAINS', workloadTypes));
          }
        }
      } else if (operation === 'getStorageConsumptionByBackupSetsReport') {
        // API Reference: https://developer.druva.com/reference/getstorageconsumptionbybackupsetsreportdatarequest
        // Endpoint: POST /msp/reporting/v1/reports/mspEWStorageConsumptionbyBackupSets
        // Lists the Backup Set wise storage consumption details for individual resources in the organization of MSP customers
        endpoint = '/msp/reporting/v1/reports/mspEWStorageConsumptionbyBackupSets';

        // Add additional filters specific to this operation using the structured format
        // Note: This report uses 'backupContent' field for filtering workload types (not 'workloadTypes')
        // This is consistent with the Resource Status report and aligns with the API response structure
        const filterByWorkloadTypes = this.getNodeParameter(
          'filterByWorkloadTypes',
          0,
          false,
        ) as boolean;
        if (filterByWorkloadTypes) {
          const workloadTypes = this.getNodeParameter('workloadTypes', 0, []) as string[];
          if (workloadTypes.length > 0) {
            filterBy.push(createFilter('backupContent', 'CONTAINS', workloadTypes));
          }
        }
      } else if (operation === 'getDRFailbackActivityReport') {
        endpoint = '/msp/reporting/v1/reports/mspEWDisasterRecoveryFailbackActivity';

        // Add additional filters specific to this operation using the structured format
        const filterByDRPlanIds = this.getNodeParameter('filterByDRPlanIds', 0, false) as boolean;
        if (filterByDRPlanIds) {
          const drPlanIds = this.getNodeParameter('drPlanIds', 0, []) as string[];
          if (drPlanIds.length > 0) {
            filterBy.push(createFilter('drPlanName', 'CONTAINS', drPlanIds));
          }
        }
      } else if (operation === 'getDRFailoverActivityReport') {
        endpoint = '/msp/reporting/v1/reports/mspEWDisasterRecoveryFailoverActivity';

        // Remove DR plan filtering for Failover report since it's not supported in the API
        // According to the API spec, 'drPlanName' is not a valid field for this report
      } else if (operation === 'getDRReplicationActivityReport') {
        endpoint = '/msp/reporting/v1/reports/mspEWDisasterRecoveryReplicationActivity';

        // Add additional filters specific to this operation using the structured format
        const filterByDRPlanIds = this.getNodeParameter('filterByDRPlanIds', 0, false) as boolean;
        if (filterByDRPlanIds) {
          const drPlanIds = this.getNodeParameter('drPlanIds', 0, []) as string[];
          if (drPlanIds.length > 0) {
            filterBy.push(createFilter('drPlanName', 'CONTAINS', drPlanIds));
          }
        }

        const filterByReplicationStatus = this.getNodeParameter(
          'filterByReplicationStatus',
          0,
          false,
        ) as boolean;
        if (filterByReplicationStatus) {
          const replicationStatus = this.getNodeParameter('replicationStatus', 0, []) as string[];
          if (replicationStatus.length > 0) {
            filterBy.push(createFilter('status', 'CONTAINS', replicationStatus));
          }
        }
      } else if (operation === 'getResourceStatusReport') {
        endpoint = '/msp/reporting/v1/reports/mspEWResourceStatus';

        // Add additional filters specific to this operation using the structured format
        const filterByResourceStatus = this.getNodeParameter(
          'filterByResourceStatus',
          0,
          false,
        ) as boolean;
        if (filterByResourceStatus) {
          const resourceStatus = this.getNodeParameter('resourceStatus', 0, []) as string[];
          if (resourceStatus.length > 0) {
            // For boolean fields like backupEnabled, EQUAL is more appropriate than CONTAINS
            // Take first value in case multiple are selected (API likely expects a single boolean)
            filterBy.push(createFilter('backupEnabled', 'EQUAL', resourceStatus[0]));
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
            filterBy.push(createFilter('backupsetType', 'CONTAINS', resourceType));
          }
        }

        const filterByWorkloadTypes = this.getNodeParameter(
          'filterByWorkloadTypes',
          0,
          false,
        ) as boolean;
        if (filterByWorkloadTypes) {
          const workloadTypes = this.getNodeParameter('workloadTypes', 0, []) as string[];
          if (workloadTypes.length > 0) {
            filterBy.push(createFilter('backupContent', 'CONTAINS', workloadTypes));
          }
        }
      } else if (operation === 'getM365StorageConsumptionReport') {
        endpoint = '/msp/reporting/v1/reports/mspM365StorageConsumption';

        // Add workload name filter if specified
        const filterByWorkloadName = this.getNodeParameter(
          'filterByWorkloadName',
          0,
          false,
        ) as boolean;
        if (filterByWorkloadName) {
          const workloadNames = this.getNodeParameter('workloadName', 0, []) as string[];
          if (workloadNames.length > 0) {
            filterBy.push(createFilter('workloadName', 'CONTAINS', workloadNames));
          }
        }

        // Note: M365 Storage Consumption report does not support date filters
        // It provides a snapshot of current storage consumption, not time-series data
      }

      // Execute API request with pagination handling
      responseData = await druvaMspApiRequestAllPagedItems.call(
        this,
        'POST',
        endpoint,
        requestBody,
        'data',
      );

      if (!returnAll && limit) {
        responseData = responseData.slice(0, limit);
      }

      const executionData = this.helpers.constructExecutionMetaData(
        this.helpers.returnJsonArray(responseData),
        { itemData: { item: i } },
      );
      returnData.push(...executionData);
    } catch (error) {
      if (this.continueOnFail()) {
        const executionData = this.helpers.constructExecutionMetaData(
          this.helpers.returnJsonArray({ error: error.message }),
          { itemData: { item: i } },
        );
        returnData.push(...executionData);
        continue;
      }
      throw error;
    }
  }

  return [returnData];
}
