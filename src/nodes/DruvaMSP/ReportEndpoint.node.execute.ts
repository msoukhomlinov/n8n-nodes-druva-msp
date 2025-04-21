import type {
  IExecuteFunctions,
  IDataObject,
  INodeExecutionData,
  NodeApiError,
} from 'n8n-workflow';

import { druvaMspApiRequest, druvaMspApiRequestAllReportItems } from './GenericFunctions';
import { REPORT_FIELD_NAMES, REPORT_OPERATORS } from './helpers/Constants';
import { getRelativeDateRange } from './helpers/DateHelpers';
import { logger } from './helpers/LoggerHelper';

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
    const filterByCustomers = this.getNodeParameter('filterByCustomers', i, false) as boolean;

    // Base request body
    const body: IDataObject = {};

    // Add date parameters based on selection method (skip for Storage Statistics)
    if (operation !== 'getStorageStatistics') {
      const dateSelectionMethod = this.getNodeParameter(
        'dateSelectionMethod',
        i,
        'relativeDates',
      ) as string;

      if (dateSelectionMethod !== 'allDates') {
        let startTime = '';
        let endTime = '';

        if (dateSelectionMethod === 'specificDates') {
          // Use specific dates provided by user
          startTime = this.getNodeParameter('startDate', i, '') as string;
          endTime = this.getNodeParameter('endDate', i, '') as string;
        } else {
          // Use relative date range
          const relativeDateRange = this.getNodeParameter(
            'relativeDateRange',
            i,
            'currentMonth',
          ) as string;
          const dateRange = getRelativeDateRange(relativeDateRange);
          startTime = dateRange.startDate;
          endTime = dateRange.endDate;
        }

        // Add the dates to the request body
        body.startTime = startTime;
        body.endTime = endTime;
      }
    }

    // Add customer IDs if filtering by customers
    if (filterByCustomers) {
      const customerIds = this.getNodeParameter('customerIds', i, []) as string[];
      if (customerIds.length > 0) {
        body.customerIds = customerIds;
      }
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
        // Create filter array to collect all filters
        const filterBy: IDataObject[] = [];

        // Add customer filter if specified
        const customerIds = body.customerIds as string[] | undefined;
        if (customerIds && customerIds.length > 0) {
          filterBy.push({
            fieldName: REPORT_FIELD_NAMES.CUSTOMER_GLOBAL_ID,
            operator: REPORT_OPERATORS.CONTAINS,
            value: customerIds,
          });
        }

        // Add date filters if specified - using lastUpdatedTime instead of fromDate/toDate
        if (body.startTime) {
          filterBy.push({
            fieldName: 'lastUpdatedTime',
            operator: REPORT_OPERATORS.GTE,
            value: body.startTime,
          });
        }

        if (body.endTime) {
          filterBy.push({
            fieldName: 'lastUpdatedTime',
            operator: REPORT_OPERATORS.LTE,
            value: body.endTime,
          });
        }

        // Create a properly structured request body with filters for the API
        const requestBody: IDataObject = {
          // Copy any other fields except dates and customerIds (we handle those in filters)
          ...(body.userStatus ? { userStatus: body.userStatus } : {}),
          // Add filters object with proper structure
          filters: {
            pageSize: 500,
            filterBy,
          },
        };

        // Debug log to see the structure
        logger.debug(
          `[DEBUG-START] Report API request: ${endpoint} (pagination enabled, filters: ${filterBy.length})`,
        );

        // The Users report returns data in the 'data' key, not 'items'
        const allItems = await druvaMspApiRequestAllReportItems.call(
          this,
          endpoint,
          requestBody,
          'data',
        );

        logger.debug(
          `[DEBUG-END] Report API response: Retrieved ${Array.isArray(allItems) ? allItems.length : 0} items`,
        );

        responseData = this.helpers.returnJsonArray(allItems);
      } else {
        // Create filter array to collect all filters
        const filterBy: IDataObject[] = [];

        // Add customer filter if specified
        const customerIds = body.customerIds as string[] | undefined;
        if (customerIds && customerIds.length > 0) {
          filterBy.push({
            fieldName: REPORT_FIELD_NAMES.CUSTOMER_GLOBAL_ID,
            operator: REPORT_OPERATORS.CONTAINS,
            value: customerIds,
          });
        }

        // Add date filters if specified - using lastUpdatedTime instead of fromDate/toDate
        if (body.startTime) {
          filterBy.push({
            fieldName: 'lastUpdatedTime',
            operator: REPORT_OPERATORS.GTE,
            value: body.startTime,
          });
        }

        if (body.endTime) {
          filterBy.push({
            fieldName: 'lastUpdatedTime',
            operator: REPORT_OPERATORS.LTE,
            value: body.endTime,
          });
        }

        // Create a new body without customerIds and dates to avoid duplication
        const requestBody: IDataObject = {
          // Copy any other fields except dates and customerIds
          ...(body.userStatus ? { userStatus: body.userStatus } : {}),
          // Add filters object
          filters: {
            pageSize: limit,
            filterBy,
          },
        };

        logger.debug(
          `[DEBUG-START] Report API request: ${endpoint} (single page, limit: ${limit}, filters: ${filterBy.length})`,
        );

        const response = await druvaMspApiRequest.call(this, 'POST', endpoint, requestBody);

        // Extract data from the 'data' key instead of 'items'
        const items = (response as IDataObject)?.data ?? [];

        logger.debug(
          `[DEBUG-END] Report API response: Retrieved ${Array.isArray(items) ? items.length : 0} items`,
        );

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
        // Create filter array to collect all filters
        const filterBy: IDataObject[] = [];

        // Add customer filter if specified
        const customerIds = body.customerIds as string[] | undefined;
        if (customerIds && customerIds.length > 0) {
          filterBy.push({
            fieldName: REPORT_FIELD_NAMES.CUSTOMER_GLOBAL_ID,
            operator: REPORT_OPERATORS.CONTAINS,
            value: customerIds,
          });
        }

        // Add date filters if specified - using lastUpdatedTime instead of fromDate/toDate
        if (body.startTime) {
          filterBy.push({
            fieldName: 'lastUpdatedTime',
            operator: REPORT_OPERATORS.GTE,
            value: body.startTime,
          });
        }

        if (body.endTime) {
          filterBy.push({
            fieldName: 'lastUpdatedTime',
            operator: REPORT_OPERATORS.LTE,
            value: body.endTime,
          });
        }

        // Create a properly structured request body with filters for the API
        const requestBody: IDataObject = {
          // Copy any other fields except dates and customerIds (we handle those in filters)
          ...(body.rolloutStatus ? { rolloutStatus: body.rolloutStatus } : {}),
          // Add filters object with proper structure
          filters: {
            pageSize: 500,
            filterBy,
          },
        };

        // Debug log to see the structure
        logger.debug(
          `[DEBUG-START] Report API request: ${endpoint} (pagination enabled, filters: ${filterBy.length})`,
        );

        // The User Rollout report returns data in the 'data' key, not 'items'
        const allItems = await druvaMspApiRequestAllReportItems.call(
          this,
          endpoint,
          requestBody,
          'data',
        );

        logger.debug(
          `[DEBUG-END] Report API response: Retrieved ${Array.isArray(allItems) ? allItems.length : 0} items`,
        );

        responseData = this.helpers.returnJsonArray(allItems);
      } else {
        // Create filter array to collect all filters
        const filterBy: IDataObject[] = [];

        // Add customer filter if specified
        const customerIds = body.customerIds as string[] | undefined;
        if (customerIds && customerIds.length > 0) {
          filterBy.push({
            fieldName: REPORT_FIELD_NAMES.CUSTOMER_GLOBAL_ID,
            operator: REPORT_OPERATORS.CONTAINS,
            value: customerIds,
          });
        }

        // Add date filters if specified - using lastUpdatedTime instead of fromDate/toDate
        if (body.startTime) {
          filterBy.push({
            fieldName: 'lastUpdatedTime',
            operator: REPORT_OPERATORS.GTE,
            value: body.startTime,
          });
        }

        if (body.endTime) {
          filterBy.push({
            fieldName: 'lastUpdatedTime',
            operator: REPORT_OPERATORS.LTE,
            value: body.endTime,
          });
        }

        // Create a new body without customerIds and dates to avoid duplication
        const requestBody: IDataObject = {
          // Copy any other fields except dates and customerIds
          ...(body.rolloutStatus ? { rolloutStatus: body.rolloutStatus } : {}),
          // Add filters object
          filters: {
            pageSize: limit,
            filterBy,
          },
        };

        logger.debug(
          `[DEBUG-START] Report API request: ${endpoint} (single page, limit: ${limit}, filters: ${filterBy.length})`,
        );

        const response = await druvaMspApiRequest.call(this, 'POST', endpoint, requestBody);

        // Extract data from the 'data' key instead of 'items'
        const items = (response as IDataObject)?.data ?? [];

        logger.debug(
          `[DEBUG-END] Report API response: Retrieved ${Array.isArray(items) ? items.length : 0} items`,
        );

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
        // Create filter array to collect all filters
        const filterBy: IDataObject[] = [];

        // Add customer filter if specified
        const customerIds = body.customerIds as string[] | undefined;
        if (customerIds && customerIds.length > 0) {
          filterBy.push({
            fieldName: REPORT_FIELD_NAMES.CUSTOMER_GLOBAL_ID,
            operator: REPORT_OPERATORS.CONTAINS,
            value: customerIds,
          });
        }

        // Add date filters if specified - using lastUpdatedTime instead of fromDate/toDate
        if (body.startTime) {
          filterBy.push({
            fieldName: 'lastUpdatedTime',
            operator: REPORT_OPERATORS.GTE,
            value: body.startTime,
          });
        }

        if (body.endTime) {
          filterBy.push({
            fieldName: 'lastUpdatedTime',
            operator: REPORT_OPERATORS.LTE,
            value: body.endTime,
          });
        }

        // Create a properly structured request body with filters for the API
        const requestBody: IDataObject = {
          // Copy any other fields except dates and customerIds (we handle those in filters)
          ...(body.provisioningStatus ? { provisioningStatus: body.provisioningStatus } : {}),
          // Add filters object with proper structure
          filters: {
            pageSize: 500,
            filterBy,
          },
        };

        // The User Provisioning report returns data in the 'data' key, not 'items'
        const allItems = await druvaMspApiRequestAllReportItems.call(
          this,
          endpoint,
          requestBody,
          'data',
        );
        responseData = this.helpers.returnJsonArray(allItems);
      } else {
        // Create filter array to collect all filters
        const filterBy: IDataObject[] = [];

        // Add customer filter if specified
        const customerIds = body.customerIds as string[] | undefined;
        if (customerIds && customerIds.length > 0) {
          filterBy.push({
            fieldName: REPORT_FIELD_NAMES.CUSTOMER_GLOBAL_ID,
            operator: REPORT_OPERATORS.CONTAINS,
            value: customerIds,
          });
        }

        // Add date filters if specified - using lastUpdatedTime instead of fromDate/toDate
        if (body.startTime) {
          filterBy.push({
            fieldName: 'lastUpdatedTime',
            operator: REPORT_OPERATORS.GTE,
            value: body.startTime,
          });
        }

        if (body.endTime) {
          filterBy.push({
            fieldName: 'lastUpdatedTime',
            operator: REPORT_OPERATORS.LTE,
            value: body.endTime,
          });
        }

        // Create a new body without customerIds and dates to avoid duplication
        const requestBody: IDataObject = {
          // Copy any other fields except dates and customerIds
          ...(body.provisioningStatus ? { provisioningStatus: body.provisioningStatus } : {}),
          // Add filters object
          filters: {
            pageSize: limit,
            filterBy,
          },
        };

        const response = await druvaMspApiRequest.call(this, 'POST', endpoint, requestBody);

        // Extract data from the 'data' key instead of 'items'
        const items = (response as IDataObject)?.data ?? [];
        responseData = this.helpers.returnJsonArray(items as IDataObject[]);
      }
    } else if (operation === 'getLicenseUsage') {
      // Get License Usage Report
      const endpoint = '/msp/reporting/v1/reports/mspEPLicenseUsage';

      if (returnAll) {
        // Create filter array to collect all filters
        const filterBy: IDataObject[] = [];

        // Add customer filter if specified
        const customerIds = body.customerIds as string[] | undefined;
        if (customerIds && customerIds.length > 0) {
          filterBy.push({
            fieldName: REPORT_FIELD_NAMES.CUSTOMER_GLOBAL_ID,
            operator: REPORT_OPERATORS.CONTAINS,
            value: customerIds,
          });
        }

        // Add date filters if specified - using lastUpdatedTime instead of fromDate/toDate
        if (body.startTime) {
          filterBy.push({
            fieldName: 'lastUpdatedTime',
            operator: REPORT_OPERATORS.GTE,
            value: body.startTime,
          });
        }

        if (body.endTime) {
          filterBy.push({
            fieldName: 'lastUpdatedTime',
            operator: REPORT_OPERATORS.LTE,
            value: body.endTime,
          });
        }

        // Create a properly structured request body with filters for the API
        const requestBody: IDataObject = {
          // Add filters object with proper structure
          filters: {
            pageSize: 500,
            filterBy,
          },
        };

        // The License Usage report returns data in the 'data' key, not 'items'
        const allItems = await druvaMspApiRequestAllReportItems.call(
          this,
          endpoint,
          requestBody,
          'data',
        );
        responseData = this.helpers.returnJsonArray(allItems);
      } else {
        // Create filter array to collect all filters
        const filterBy: IDataObject[] = [];

        // Add customer filter if specified
        const customerIds = body.customerIds as string[] | undefined;
        if (customerIds && customerIds.length > 0) {
          filterBy.push({
            fieldName: REPORT_FIELD_NAMES.CUSTOMER_GLOBAL_ID,
            operator: REPORT_OPERATORS.CONTAINS,
            value: customerIds,
          });
        }

        // Add date filters if specified - using lastUpdatedTime instead of fromDate/toDate
        if (body.startTime) {
          filterBy.push({
            fieldName: 'lastUpdatedTime',
            operator: REPORT_OPERATORS.GTE,
            value: body.startTime,
          });
        }

        if (body.endTime) {
          filterBy.push({
            fieldName: 'lastUpdatedTime',
            operator: REPORT_OPERATORS.LTE,
            value: body.endTime,
          });
        }

        // Create a new body without customerIds and dates to avoid duplication
        const requestBody: IDataObject = {
          // Add filters object
          filters: {
            pageSize: limit,
            filterBy,
          },
        };

        const response = await druvaMspApiRequest.call(this, 'POST', endpoint, requestBody);

        // Extract data from the 'data' key instead of 'items'
        const items = (response as IDataObject)?.data ?? [];
        responseData = this.helpers.returnJsonArray(items as IDataObject[]);
      }
    } else if (operation === 'getLastBackupStatus') {
      // Get Last Backup Status Report
      const endpoint = '/msp/reporting/v1/reports/mspEPLastBackupStatus';

      // Create array to collect all filter objects with proper types
      const filterByArray: IDataObject[] = [];

      // Add customer filter if specified
      const customerIds = body.customerIds as string[] | undefined;
      if (customerIds && customerIds.length > 0) {
        filterByArray.push({
          fieldName: 'customerGlobalId',
          operator: REPORT_OPERATORS.CONTAINS,
          value: customerIds,
        });
      }

      // Handle date filters
      if (body.startTime) {
        filterByArray.push({
          fieldName: 'lastUpdatedTime',
          operator: REPORT_OPERATORS.GTE,
          value: body.startTime as string,
        });
      }

      if (body.endTime) {
        filterByArray.push({
          fieldName: 'lastUpdatedTime',
          operator: REPORT_OPERATORS.LTE,
          value: body.endTime as string,
        });
      }

      if (returnAll) {
        // Create a properly structured request body with filters for the API
        const requestBody: IDataObject = {
          filters: {
            pageSize: 500,
            filterBy: filterByArray,
          },
        };

        // The Last Backup Status report returns data in the 'data' key
        const allItems = await druvaMspApiRequestAllReportItems.call(
          this,
          endpoint,
          requestBody,
          'data',
        );
        responseData = this.helpers.returnJsonArray(allItems);
      } else {
        // Create a properly structured request body with filters and page size
        const requestBody: IDataObject = {
          filters: {
            pageSize: limit,
            filterBy: filterByArray,
          },
        };

        const response = await druvaMspApiRequest.call(this, 'POST', endpoint, requestBody);

        // Extract data from the 'data' key instead of 'items'
        const items = (response as IDataObject)?.data ?? [];
        responseData = this.helpers.returnJsonArray(items as IDataObject[]);
      }
    } else if (operation === 'getAlerts') {
      // Get Alerts Report
      const endpoint = '/msp/reporting/v1/reports/mspEPAlert';

      // Create filter array to collect all filters for both returnAll and regular path
      const filterBy: IDataObject[] = [];

      // Add customer filter if specified
      const filterByCustomers = this.getNodeParameter('filterByCustomers', i, false) as boolean;
      if (filterByCustomers) {
        const customerIds = this.getNodeParameter('customerIds', i, []) as string[];
        if (customerIds.length > 0) {
          filterBy.push({
            fieldName: REPORT_FIELD_NAMES.CUSTOMER_GLOBAL_ID,
            operator: REPORT_OPERATORS.CONTAINS,
            value: customerIds,
          });
        }
      }

      // Add date filters if specified - using firstOccurrence and lastOccurrence
      const dateSelectionMethod = this.getNodeParameter(
        'dateSelectionMethod',
        i,
        'relativeDates',
      ) as string;

      if (dateSelectionMethod !== 'allDates') {
        let startTime = '';
        let endTime = '';

        if (dateSelectionMethod === 'specificDates') {
          // Use specific dates provided by user
          startTime = this.getNodeParameter('startDate', i, '') as string;
          endTime = this.getNodeParameter('endDate', i, '') as string;
        } else {
          // Use relative date range
          const relativeDateRange = this.getNodeParameter(
            'relativeDateRange',
            i,
            'currentMonth',
          ) as string;
          const dateRange = getRelativeDateRange(relativeDateRange);
          startTime = dateRange.startDate;
          endTime = dateRange.endDate;
        }

        if (startTime) {
          filterBy.push({
            fieldName: 'firstOccurrence',
            operator: REPORT_OPERATORS.GTE,
            value: startTime,
          });
        }

        if (endTime) {
          filterBy.push({
            fieldName: 'lastOccurrence',
            operator: REPORT_OPERATORS.LTE,
            value: endTime,
          });
        }
      }

      // Add alert severity filter if specified - using severity field
      const filterByAlertSeverities = this.getNodeParameter(
        'filterByAlertSeverity',
        i,
        false,
      ) as boolean;
      if (filterByAlertSeverities) {
        const alertSeverities = this.getNodeParameter('alertSeverity', i, []) as string[];
        if (alertSeverities.length > 0) {
          filterBy.push({
            fieldName: 'severity',
            operator: REPORT_OPERATORS.CONTAINS,
            value: alertSeverities,
          });
        }
      }

      // Add alert types filter if specified - using alertDetails field
      const filterByAlertTypes = this.getNodeParameter('filterByAlertTypes', i, false) as boolean;
      if (filterByAlertTypes) {
        const alertTypes = this.getNodeParameter('alertTypes', i, []) as string[];
        if (alertTypes.length > 0) {
          filterBy.push({
            fieldName: 'alertDetails',
            operator: REPORT_OPERATORS.CONTAINS,
            value: alertTypes,
          });
        }
      }

      // Add active status filter if specified
      const filterByActiveStatus = this.getNodeParameter(
        'filterByActiveStatus',
        i,
        false,
      ) as boolean;
      if (filterByActiveStatus) {
        const activeStatus = this.getNodeParameter('activeStatus', i, '') as string;
        if (activeStatus) {
          filterBy.push({
            fieldName: 'active',
            operator: REPORT_OPERATORS.EQUAL,
            value: activeStatus,
          });
        }
      }

      // Create the request body
      const pageSize = returnAll ? 500 : (this.getNodeParameter('limit', i, 100) as number);
      const requestBody: IDataObject = {
        filters: {
          pageSize,
          filterBy,
        },
      };

      if (returnAll) {
        // The Alerts report returns data in the 'data' key, not 'items'
        const allItems = await druvaMspApiRequestAllReportItems.call(
          this,
          endpoint,
          requestBody,
          'data',
        );
        responseData = this.helpers.returnJsonArray(allItems);
      } else {
        const response = await druvaMspApiRequest.call(this, 'POST', endpoint, requestBody);

        // Extract data from the 'data' key instead of 'items'
        const items = (response as IDataObject)?.data ?? [];
        responseData = this.helpers.returnJsonArray(items as IDataObject[]);
      }
    } else if (operation === 'getStorageStatistics') {
      // Get Storage Statistics Report
      const endpoint = '/msp/reporting/v1/reports/mspEPStorageStatistics';

      if (returnAll) {
        // Create filter array to collect all filters
        const filterBy: IDataObject[] = [];

        // Add customer filter if specified
        const customerIds = body.customerIds as string[] | undefined;
        if (customerIds && customerIds.length > 0) {
          filterBy.push({
            fieldName: REPORT_FIELD_NAMES.CUSTOMER_GLOBAL_ID,
            operator: REPORT_OPERATORS.CONTAINS,
            value: customerIds,
          });
        }

        // Note: No date filters for Storage Statistics as they don't apply

        // Create a properly structured request body with filters for the API
        const requestBody: IDataObject = {
          // Add filters object with proper structure
          filters: {
            pageSize: 500,
            filterBy,
          },
        };

        // The Storage Statistics report returns data in the 'data' key, not 'items'
        const allItems = await druvaMspApiRequestAllReportItems.call(
          this,
          endpoint,
          requestBody,
          'data',
        );
        responseData = this.helpers.returnJsonArray(allItems);
      } else {
        // Create filter array to collect all filters
        const filterBy: IDataObject[] = [];

        // Add customer filter if specified
        const customerIds = body.customerIds as string[] | undefined;
        if (customerIds && customerIds.length > 0) {
          filterBy.push({
            fieldName: REPORT_FIELD_NAMES.CUSTOMER_GLOBAL_ID,
            operator: REPORT_OPERATORS.CONTAINS,
            value: customerIds,
          });
        }

        // Note: No date filters for Storage Statistics as they don't apply

        // Create a new body without customerIds and dates to avoid duplication
        const requestBody: IDataObject = {
          // Add filters object
          filters: {
            pageSize: limit,
            filterBy,
          },
        };

        const response = await druvaMspApiRequest.call(this, 'POST', endpoint, requestBody);

        // Extract data from the 'data' key instead of 'items'
        const items = (response as IDataObject)?.data ?? [];
        responseData = this.helpers.returnJsonArray(items as IDataObject[]);
      }
    } else if (operation === 'getStorageAlert') {
      // Get Storage Alert Report
      const endpoint = '/msp/reporting/v1/reports/mspEPStorageAlert';

      if (returnAll) {
        // Create filter array to collect all filters
        const filterBy: IDataObject[] = [];

        // Add customer filter if specified
        const customerIds = body.customerIds as string[] | undefined;
        if (customerIds && customerIds.length > 0) {
          filterBy.push({
            fieldName: REPORT_FIELD_NAMES.CUSTOMER_GLOBAL_ID,
            operator: REPORT_OPERATORS.CONTAINS,
            value: customerIds,
          });
        }

        // Add date filters if specified - using lastUpdatedTime instead of fromDate/toDate
        if (body.startTime) {
          filterBy.push({
            fieldName: 'lastUpdatedTime',
            operator: REPORT_OPERATORS.GTE,
            value: body.startTime,
          });
        }

        if (body.endTime) {
          filterBy.push({
            fieldName: 'lastUpdatedTime',
            operator: REPORT_OPERATORS.LTE,
            value: body.endTime,
          });
        }

        // Create a properly structured request body with filters for the API
        const requestBody: IDataObject = {
          // Add filters object with proper structure
          filters: {
            pageSize: 500,
            filterBy,
          },
        };

        // The Storage Alert report returns data in the 'data' key, not 'items'
        const allItems = await druvaMspApiRequestAllReportItems.call(
          this,
          endpoint,
          requestBody,
          'data',
        );
        responseData = this.helpers.returnJsonArray(allItems);
      } else {
        // Create filter array to collect all filters
        const filterBy: IDataObject[] = [];

        // Add customer filter if specified
        const customerIds = body.customerIds as string[] | undefined;
        if (customerIds && customerIds.length > 0) {
          filterBy.push({
            fieldName: REPORT_FIELD_NAMES.CUSTOMER_GLOBAL_ID,
            operator: REPORT_OPERATORS.CONTAINS,
            value: customerIds,
          });
        }

        // Add date filters if specified - using lastUpdatedTime instead of fromDate/toDate
        if (body.startTime) {
          filterBy.push({
            fieldName: 'lastUpdatedTime',
            operator: REPORT_OPERATORS.GTE,
            value: body.startTime,
          });
        }

        if (body.endTime) {
          filterBy.push({
            fieldName: 'lastUpdatedTime',
            operator: REPORT_OPERATORS.LTE,
            value: body.endTime,
          });
        }

        // Create a new body without customerIds and dates to avoid duplication
        const requestBody: IDataObject = {
          // Add filters object
          filters: {
            pageSize: limit,
            filterBy,
          },
        };

        const response = await druvaMspApiRequest.call(this, 'POST', endpoint, requestBody);

        // Extract data from the 'data' key instead of 'items'
        const items = (response as IDataObject)?.data ?? [];
        responseData = this.helpers.returnJsonArray(items as IDataObject[]);
      }
    } else if (operation === 'getCloudCacheStatistics') {
      // Get Cloud Cache Statistics Report
      const endpoint = '/msp/reporting/v1/reports/mspEPCloudCacheStatistics';

      if (returnAll) {
        // Create filter array to collect all filters
        const filterBy: IDataObject[] = [];

        // Add customer filter if specified
        const customerIds = body.customerIds as string[] | undefined;
        if (customerIds && customerIds.length > 0) {
          filterBy.push({
            fieldName: REPORT_FIELD_NAMES.CUSTOMER_GLOBAL_ID,
            operator: REPORT_OPERATORS.CONTAINS,
            value: customerIds,
          });
        }

        // Add date filters if specified - using lastUpdatedTime instead of fromDate/toDate
        if (body.startTime) {
          filterBy.push({
            fieldName: 'lastUpdatedTime',
            operator: REPORT_OPERATORS.GTE,
            value: body.startTime,
          });
        }

        if (body.endTime) {
          filterBy.push({
            fieldName: 'lastUpdatedTime',
            operator: REPORT_OPERATORS.LTE,
            value: body.endTime,
          });
        }

        // Create a properly structured request body with filters for the API
        const requestBody: IDataObject = {
          // Add filters object with proper structure
          filters: {
            pageSize: 500,
            filterBy,
          },
        };

        // The Cloud Cache Statistics report returns data in the 'data' key, not 'items'
        const allItems = await druvaMspApiRequestAllReportItems.call(
          this,
          endpoint,
          requestBody,
          'data',
        );
        responseData = this.helpers.returnJsonArray(allItems);
      } else {
        // Create filter array to collect all filters
        const filterBy: IDataObject[] = [];

        // Add customer filter if specified
        const customerIds = body.customerIds as string[] | undefined;
        if (customerIds && customerIds.length > 0) {
          filterBy.push({
            fieldName: REPORT_FIELD_NAMES.CUSTOMER_GLOBAL_ID,
            operator: REPORT_OPERATORS.CONTAINS,
            value: customerIds,
          });
        }

        // Add date filters if specified - using lastUpdatedTime instead of fromDate/toDate
        if (body.startTime) {
          filterBy.push({
            fieldName: 'lastUpdatedTime',
            operator: REPORT_OPERATORS.GTE,
            value: body.startTime,
          });
        }

        if (body.endTime) {
          filterBy.push({
            fieldName: 'lastUpdatedTime',
            operator: REPORT_OPERATORS.LTE,
            value: body.endTime,
          });
        }

        // Create a new body without customerIds and dates to avoid duplication
        const requestBody: IDataObject = {
          // Add filters object
          filters: {
            pageSize: limit,
            filterBy,
          },
        };

        const response = await druvaMspApiRequest.call(this, 'POST', endpoint, requestBody);

        // Extract data from the 'data' key instead of 'items'
        const items = (response as IDataObject)?.data ?? [];
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
