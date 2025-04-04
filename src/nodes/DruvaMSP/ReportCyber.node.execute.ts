import type {
  IDataObject,
  INodeExecutionData,
  IExecuteFunctions,
  NodeApiError,
} from 'n8n-workflow';

import { druvaMspApiRequest, druvaMspApiRequestAllReportItems } from './GenericFunctions';
import { createReportFilter, createReportFilters } from './helpers/ReportHelpers';
import { REPORT_FIELD_NAMES, REPORT_OPERATORS } from './helpers/Constants';

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
      const startTime = this.getNodeParameter('startTime', i, '') as string;
      const endTime = this.getNodeParameter('endTime', i, '') as string;
      const filterByCustomers = this.getNodeParameter('filterByCustomers', i, false) as boolean;
      const filterByEntityTypes = this.getNodeParameter('filterByEntityTypes', i, false) as boolean;
      const filterByActionTypes = this.getNodeParameter('filterByActionTypes', i, false) as boolean;

      const endpoint = '/msp/reporting/v1/reports/mspDGRollbackActions';

      // Prepare request body
      const body: IDataObject = {
        startTime,
        endTime,
      };

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
        // For POST requests with pagination in the body, use our centralized function
        const allItems = await druvaMspApiRequestAllReportItems.call(this, endpoint, body);
        responseData = this.helpers.returnJsonArray(allItems);
      } else {
        // Use createReportFilters to create a properly structured request with filters
        const filterBy = [];
        const customerIds = body.customerIds as string[] | undefined;
        if (customerIds && customerIds.length > 0) {
          filterBy.push(createReportFilter(REPORT_FIELD_NAMES.CUSTOMER_GLOBAL_ID, REPORT_OPERATORS.CONTAINS, customerIds));
        }

        // Create a new body without customerIds to avoid duplication
        const requestBody: IDataObject = {
          startTime: body.startTime,
          endTime: body.endTime,
          // Copy any other fields except customerIds
          ...(body.entityTypes ? { entityTypes: body.entityTypes } : {}),
          ...(body.actionTypes ? { actionTypes: body.actionTypes } : {}),
          // Add filters object
          filters: createReportFilters(limit, filterBy)
        };

        const response = await druvaMspApiRequest.call(this, 'POST', endpoint, requestBody);
        const items = (response as IDataObject)?.items ?? [];
        responseData = this.helpers.returnJsonArray(items as IDataObject[]);
      }
    } else if (operation === 'getDataProtectionRisk') {
      // Implement Get Data Protection Risk Report logic
      const returnAll = this.getNodeParameter('returnAll', i, false) as boolean;
      const limit = this.getNodeParameter('limit', i, 50) as number;
      const startTime = this.getNodeParameter('startTime', i, '') as string;
      const endTime = this.getNodeParameter('endTime', i, '') as string;
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

      // Prepare request body
      const body: IDataObject = {
        startTime,
        endTime,
      };

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
        // For POST requests with pagination in the body, use our centralized function
        const allItems = await druvaMspApiRequestAllReportItems.call(this, endpoint, body);
        responseData = this.helpers.returnJsonArray(allItems);
      } else {
        // Use createReportFilters to create a properly structured request with filters
        const filterBy = [];
        const customerIds = body.customerIds as string[] | undefined;
        if (customerIds && customerIds.length > 0) {
          filterBy.push(createReportFilter(REPORT_FIELD_NAMES.CUSTOMER_GLOBAL_ID, REPORT_OPERATORS.CONTAINS, customerIds));
        }

        // Create a new body without customerIds to avoid duplication
        const requestBody: IDataObject = {
          startTime: body.startTime,
          endTime: body.endTime,
          // Copy any other fields except customerIds
          ...(body.workloadTypes ? { workloadTypes: body.workloadTypes } : {}),
          ...(body.connectionStatus ? { connectionStatus: body.connectionStatus } : {}),
          ...(body.riskLevels ? { riskLevels: body.riskLevels } : {}),
          // Add filters object
          filters: createReportFilters(limit, filterBy)
        };

        const response = await druvaMspApiRequest.call(this, 'POST', endpoint, requestBody);
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
