import type {
  IDataObject,
  INodeExecutionData,
  IExecuteFunctions,
  NodeApiError,
} from 'n8n-workflow';

import { druvaMspApiRequest, druvaMspApiRequestAllReportItems } from './GenericFunctions';
import { REPORT_FIELD_NAMES, REPORT_OPERATORS } from './helpers/Constants';
import { getRelativeDateRange } from './helpers/DateHelpers';
import { logger } from './helpers/LoggerHelper';

/**
 * Executes the selected Report - Cyber Resilience operation.
 * @param this The context object.
 * @param i The index of the current item.
 * @returns The result of the operation.
 */
export async function executeReportCyberOperation(
  this: IExecuteFunctions,
  i: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', i, '') as string;
  let responseData: INodeExecutionData[] = [];

  try {
    if (operation === 'getRollbackActions') {
      // Implement Get Rollback Actions Report logic
      const returnAll = this.getNodeParameter('returnAll', i, false) as boolean;
      const limit = this.getNodeParameter('limit', i, 50) as number;

      // Get date parameters based on selection method
      const dateSelectionMethod = this.getNodeParameter(
        'dateSelectionMethod',
        i,
        'relativeDates',
      ) as string;

      let startTime = '';
      let endTime = '';

      // Skip date filter initialization if "All Dates" is selected
      if (dateSelectionMethod !== 'allDates') {
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
      }

      const filterByCustomers = this.getNodeParameter('filterByCustomers', i, false) as boolean;
      const filterByEntityTypes = this.getNodeParameter('filterByEntityTypes', i, false) as boolean;
      const filterByActionTypes = this.getNodeParameter('filterByActionTypes', i, false) as boolean;

      const endpoint = '/msp/reporting/v1/reports/mspDGRollbackActions';

      // Prepare request body
      const body: IDataObject = {};

      if (dateSelectionMethod !== 'allDates') {
        body.startTime = startTime;
        body.endTime = endTime;
      }

      if (filterByCustomers) {
        const customerIds = this.getNodeParameter('customerIds', i, []) as string[];
        if (customerIds.length > 0) {
          body.customerIds = customerIds;
        }
      }

      if (filterByEntityTypes) {
        const entityTypes = this.getNodeParameter('entityTypes', i, []) as string[];
        if (entityTypes.length > 0) {
          body.entityTypes = entityTypes;
        }
      }

      if (filterByActionTypes) {
        const actionTypes = this.getNodeParameter('actionTypes', i, []) as string[];
        if (actionTypes.length > 0) {
          body.actionTypes = actionTypes;
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

        // Add date filters if specified
        if (body.startTime) {
          filterBy.push({
            fieldName: 'fromDate',
            operator: REPORT_OPERATORS.LTE,
            value: body.startTime,
          });
        }

        if (body.endTime) {
          filterBy.push({
            fieldName: 'toDate',
            operator: REPORT_OPERATORS.GTE,
            value: body.endTime,
          });
        }

        // Create a properly structured request body with filters for the API
        const requestBody: IDataObject = {
          // Copy any other fields except dates and customerIds (we handle those in filters)
          ...(body.entityTypes ? { entityTypes: body.entityTypes } : {}),
          ...(body.actionTypes ? { actionTypes: body.actionTypes } : {}),
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

        const allItems = await druvaMspApiRequestAllReportItems.call(this, endpoint, requestBody);

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

        // Add date filters if specified
        if (body.startTime) {
          filterBy.push({
            fieldName: 'fromDate',
            operator: REPORT_OPERATORS.LTE,
            value: body.startTime,
          });
        }

        if (body.endTime) {
          filterBy.push({
            fieldName: 'toDate',
            operator: REPORT_OPERATORS.GTE,
            value: body.endTime,
          });
        }

        // Create a properly structured request body with filters for the API
        const requestBody: IDataObject = {
          // Copy any other fields except dates and customerIds (we handle those in filters)
          ...(body.entityTypes ? { entityTypes: body.entityTypes } : {}),
          ...(body.actionTypes ? { actionTypes: body.actionTypes } : {}),
          // Add filters object
          filters: {
            pageSize: limit,
            filterBy,
          },
        };

        // Always ensure we have a properly structured filters object in the request body
        if (!requestBody.filters) {
          // If no filters object exists yet, create one with at least pageSize
          requestBody.filters = {
            pageSize: limit,
            filterBy: [], // Include empty filterBy array even if no filters
          };
        }

        logger.debug(
          `[DEBUG-START] Report API request: ${endpoint} (single page, limit: ${limit}, filters: ${filterBy.length})`,
        );

        const response = await druvaMspApiRequest.call(this, 'POST', endpoint, requestBody);
        const items = (response as IDataObject)?.items ?? [];

        logger.debug(
          `[DEBUG-END] Report API response: Retrieved ${Array.isArray(items) ? items.length : 0} items`,
        );

        responseData = this.helpers.returnJsonArray(items as IDataObject[]);
      }
    } else if (operation === 'getDataProtectionRisk') {
      // Implement Get Data Protection Risk Report logic
      const returnAll = this.getNodeParameter('returnAll', i, false) as boolean;
      const limit = this.getNodeParameter('limit', i, 50) as number;

      // Get date parameters based on selection method
      const dateSelectionMethod = this.getNodeParameter(
        'dateSelectionMethod',
        i,
        'relativeDates',
      ) as string;

      let startTime = '';
      let endTime = '';

      // Skip date filter initialization if "All Dates" is selected
      if (dateSelectionMethod !== 'allDates') {
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
      }

      const filterByCustomers = this.getNodeParameter('filterByCustomers', i, false) as boolean;
      const filterByWorkloadTypes = this.getNodeParameter(
        'filterByWorkloadTypes',
        i,
        false,
      ) as boolean;
      const filterByConnectionStatus = this.getNodeParameter(
        'filterByConnectionStatus',
        i,
        false,
      ) as boolean;
      const filterByRiskLevels = this.getNodeParameter('filterByRiskLevels', i, false) as boolean;

      const endpoint = '/msp/reporting/v1/reports/mspDGDataProtectionRisk';

      // Prepare request body - only include dates if we're not using 'allDates'
      const body: IDataObject = {};

      if (dateSelectionMethod !== 'allDates') {
        body.startTime = startTime;
        body.endTime = endTime;
      }

      if (filterByCustomers) {
        const customerIds = this.getNodeParameter('customerIds', i, []) as string[];
        if (customerIds.length > 0) {
          body.customerIds = customerIds;
        }
      }

      if (filterByWorkloadTypes) {
        const workloadTypes = this.getNodeParameter('workloadTypes', i, []) as string[];
        if (workloadTypes.length > 0) {
          body.workloadTypes = workloadTypes;
        }
      }

      if (filterByConnectionStatus) {
        const connectionStatus = this.getNodeParameter('connectionStatus', i, []) as string[];
        if (connectionStatus.length > 0) {
          body.connectionStatus = connectionStatus;
        }
      }

      if (filterByRiskLevels) {
        const riskLevels = this.getNodeParameter('riskLevels', i, []) as string[];
        if (riskLevels.length > 0) {
          body.riskLevels = riskLevels;
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

        // Add date filters if specified
        if (body.startTime) {
          filterBy.push({
            fieldName: 'fromDate',
            operator: REPORT_OPERATORS.LTE,
            value: body.startTime,
          });
        }

        if (body.endTime) {
          filterBy.push({
            fieldName: 'toDate',
            operator: REPORT_OPERATORS.GTE,
            value: body.endTime,
          });
        }

        // Create a properly structured request body with filters for the API
        const requestBody: IDataObject = {
          // Copy any other fields except dates and customerIds (we handle those in filters)
          ...(body.workloadTypes ? { workloadTypes: body.workloadTypes } : {}),
          ...(body.connectionStatus ? { connectionStatus: body.connectionStatus } : {}),
          ...(body.riskLevels ? { riskLevels: body.riskLevels } : {}),
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

        const allItems = await druvaMspApiRequestAllReportItems.call(this, endpoint, requestBody);

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

        // Add date filters if specified
        if (body.startTime) {
          filterBy.push({
            fieldName: 'fromDate',
            operator: REPORT_OPERATORS.LTE,
            value: body.startTime,
          });
        }

        if (body.endTime) {
          filterBy.push({
            fieldName: 'toDate',
            operator: REPORT_OPERATORS.GTE,
            value: body.endTime,
          });
        }

        // Create a properly structured request body with filters for the API
        const requestBody: IDataObject = {
          // Copy any other fields except dates and customerIds (we handle those in filters)
          ...(body.workloadTypes ? { workloadTypes: body.workloadTypes } : {}),
          ...(body.connectionStatus ? { connectionStatus: body.connectionStatus } : {}),
          ...(body.riskLevels ? { riskLevels: body.riskLevels } : {}),
          // Add filters object
          filters: {
            pageSize: limit,
            filterBy,
          },
        };

        // Always ensure we have a properly structured filters object in the request body
        if (!requestBody.filters) {
          // If no filters object exists yet, create one with at least pageSize
          requestBody.filters = {
            pageSize: limit,
            filterBy: [], // Include empty filterBy array even if no filters
          };
        }

        logger.debug(
          `[DEBUG-START] Report API request: ${endpoint} (single page, limit: ${limit}, filters: ${filterBy.length})`,
        );

        const response = await druvaMspApiRequest.call(this, 'POST', endpoint, requestBody);
        const items = (response as IDataObject)?.items ?? [];

        logger.debug(
          `[DEBUG-END] Report API response: Retrieved ${Array.isArray(items) ? items.length : 0} items`,
        );

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
