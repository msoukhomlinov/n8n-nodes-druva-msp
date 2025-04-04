import type {
  IExecuteFunctions,
  IDataObject,
  INodeExecutionData,
  NodeApiError,
} from 'n8n-workflow';

import { druvaMspApiRequest, druvaMspApiRequestAllReportItems } from './GenericFunctions';
import { createReportFilter, createReportFilters } from './helpers/ReportHelpers';
import { REPORT_FIELD_NAMES, REPORT_OPERATORS } from './helpers/Constants';

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
        const allItems = await druvaMspApiRequestAllReportItems.call(this, endpoint, body);
        responseData = this.helpers.returnJsonArray(allItems);
      } else {
        // Create proper filter structure for non-returnAll requests
        const filterBy = [];
        if (body.customerIds) {
          filterBy.push(
            createReportFilter(
              REPORT_FIELD_NAMES.CUSTOMER_GLOBAL_ID,
              REPORT_OPERATORS.CONTAINS,
              body.customerIds as string[],
            ),
          );
        }
        // Add other specialized filters
        body.filters = createReportFilters(limit, filterBy);

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
        const allItems = await druvaMspApiRequestAllReportItems.call(this, endpoint, body);
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
        const allItems = await druvaMspApiRequestAllReportItems.call(this, endpoint, body);
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
        const allItems = await druvaMspApiRequestAllReportItems.call(this, endpoint, body);
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
        const allItems = await druvaMspApiRequestAllReportItems.call(this, endpoint, body);
        responseData = this.helpers.returnJsonArray(allItems);
      } else {
        const response = await druvaMspApiRequest.call(this, 'POST', endpoint, body);
        const items = (response as IDataObject)?.items ?? [];
        responseData = this.helpers.returnJsonArray(items as IDataObject[]);
      }
    } else if (operation === 'getAlerts') {
      // Get Alerts Report
      const endpoint = '/msp/reporting/v1/reports/mspEPAlerts';

      const filterByAlertCategories = this.getNodeParameter(
        'filterByAlertCategories',
        i,
        false,
      ) as boolean;
      if (filterByAlertCategories) {
        const alertCategories = this.getNodeParameter('alertCategories', i, []) as string[];
        if (alertCategories.length > 0) {
          body.alertCategories = alertCategories;
        }
      }

      const filterByAlertSeverities = this.getNodeParameter(
        'filterByAlertSeverities',
        i,
        false,
      ) as boolean;
      if (filterByAlertSeverities) {
        const alertSeverities = this.getNodeParameter('alertSeverities', i, []) as string[];
        if (alertSeverities.length > 0) {
          body.alertSeverities = alertSeverities;
        }
      }

      const filterByAlertStatuses = this.getNodeParameter(
        'filterByAlertStatuses',
        i,
        false,
      ) as boolean;
      if (filterByAlertStatuses) {
        const alertStatuses = this.getNodeParameter('alertStatuses', i, []) as string[];
        if (alertStatuses.length > 0) {
          body.alertStatuses = alertStatuses;
        }
      }

      if (returnAll) {
        const allItems = await druvaMspApiRequestAllReportItems.call(this, endpoint, body);
        responseData = this.helpers.returnJsonArray(allItems);
      } else {
        const response = await druvaMspApiRequest.call(this, 'POST', endpoint, body);
        const items = (response as IDataObject)?.items ?? [];
        responseData = this.helpers.returnJsonArray(items as IDataObject[]);
      }
    } else if (operation === 'getStorageStatistics') {
      // Get Storage Statistics Report
      const endpoint = '/msp/reporting/v1/reports/mspEPStorageStatistics';

      const filterByAgentStatus = this.getNodeParameter('filterByAgentStatus', i, false) as boolean;
      if (filterByAgentStatus) {
        const agentStatus = this.getNodeParameter('agentStatus', i, []) as string[];
        if (agentStatus.length > 0) {
          body.agentStatus = agentStatus;
        }
      }

      if (returnAll) {
        const allItems = await druvaMspApiRequestAllReportItems.call(this, endpoint, body);
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
