// Import types used only as types
import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  ILoadOptionsFunctions,
  INodePropertyOptions,
} from 'n8n-workflow';

// Import values and types used as values
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';

// Import helper functions
// Import Customer resource
import { customerOperations, customerFields } from './Customer.node.options';
import { executeCustomerOperation } from './Customer.node.execute';
import { druvaMspApiRequestAllItemsForOptions } from './GenericFunctions';

// Import Tenant resource
import { tenantOperations, tenantFields } from './Tenant.node.options';
import { executeTenantOperation } from './Tenant.node.execute';

// Import Service Plan resource
import { servicePlanOperations, servicePlanFields } from './ServicePlan.node.options';
import { executeServicePlanOperation } from './ServicePlan.node.execute';

// Import Task resource
import { taskOperations, taskFields } from './Task.node.options';
import { executeTaskOperation } from './Task.node.execute';

// Import Event resource
import { eventOperations, eventFields } from './Event.node.options';
import { executeEventOperation } from './Event.node.execute';

// Import Admin resource
import { adminOperations, adminFields } from './Admin.node.options';
import { executeAdminOperation } from './Admin.node.execute';

// Import Report - Usage resource
import { reportUsageOperations, reportUsageFields } from './ReportUsage.node.options';
import { executeReportUsageOperation } from './ReportUsage.node.execute';

// Import Report - Cyber Resilience resource
import { reportCyberOperations, reportCyberFields } from './ReportCyber.node.options';
import { executeReportCyberOperation } from './ReportCyber.node.execute';

// Import Report - Endpoint resource
import { reportEndpointOperations, reportEndpointFields } from './ReportEndpoint.node.options';
import { executeReportEndpointOperation } from './ReportEndpoint.node.execute';

// Import report hybrid resource
import { reportHybridOperations, reportHybridFields } from './ReportHybrid.node.options';
import { executeReportHybridOperation } from './ReportHybrid.node.execute';

// Import the value converters at the top of the file
import {
  getTenantStatusOptions,
  getTenantTypeOptions,
  getProductIdOptions,
} from './ApiValueConverters';

// TODO: Import for other resources as they are created
// etc.

// Resource definitions array
// const RESOURCE_DEFINITIONS = [...];

/**
 * Druva MSP node implementation
 */
export class DruvaMsp implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Druva MSP',
    name: 'druvaMsp',
    icon: 'file:druvaMsp.svg',
    group: ['transform'],
    usableAsTool: true,
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: 'Interact with the Druva MSP API',
    defaults: {
      name: 'Druva MSP',
    },
    inputs: [NodeConnectionType.Main],
    outputs: [NodeConnectionType.Main],
    credentials: [
      {
        name: 'druvaMspApi',
        required: true,
      },
    ],
    requestDefaults: {
      baseURL: 'https://apis.druva.com',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    },
    properties: [
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Admin',
            value: 'admin',
          },
          {
            name: 'Customer',
            value: 'customer',
          },
          {
            name: 'Event',
            value: 'event',
          },
          {
            name: 'Report - Cyber Resilience',
            value: 'reportCyber',
          },
          {
            name: 'Report - Endpoint',
            value: 'reportEndpoint',
          },
          {
            name: 'Report - Hybrid Workloads',
            value: 'reportHybrid',
          },
          {
            name: 'Report - Usage',
            value: 'reportUsage',
          },
          {
            name: 'Service Plan',
            value: 'servicePlan',
          },
          {
            name: 'Task',
            value: 'task',
          },
          {
            name: 'Tenant',
            value: 'tenant',
          },
          // TODO: Add other resources (Reports)
        ],
        default: 'customer',
      },

      // Operations for each resource
      ...adminOperations,
      ...customerOperations,
      ...tenantOperations,
      ...servicePlanOperations,
      ...taskOperations,
      ...eventOperations,
      ...reportUsageOperations,
      ...reportCyberOperations,
      ...reportEndpointOperations,
      ...reportHybridOperations,

      // Fields for each resource/operation
      ...adminFields,
      ...customerFields,
      ...tenantFields,
      ...servicePlanFields,
      ...taskFields,
      ...eventFields,
      ...reportUsageFields,
      ...reportCyberFields,
      ...reportEndpointFields,
      ...reportHybridFields,
    ],
  };

  methods = {
    loadOptions: {
      // Get a list of customers (id/name pairs)
      async getCustomers(this: ILoadOptionsFunctions) {
        const returnData: INodePropertyOptions[] = [];
        const endpoint = '/msp/v2/customers';
        const pageSize = 500; // Use larger page size for efficiency

        try {
          // Use the shared helper function for pagination with ILoadOptionsFunctions
          const customers = await druvaMspApiRequestAllItemsForOptions.call(
            this,
            'GET',
            endpoint,
            'customers',
            undefined,
            { pageSize },
          );

          // Format the options for the UI
          for (const customer of customers) {
            try {
              const customerId = (customer.id) as string;

              // Check if we have required data
              if (!customerId) {
                continue;
              }

              // Safely extract accountName and customerName
              const accountName = (customer.accountName as string) || 'Unknown Account';
              const customerName = (customer.customerName as string) || 'Unknown Customer';

              // Display accountName with customerName in brackets if they differ
              let displayName = accountName;
              if (customerName && accountName !== customerName) {
                displayName = `${accountName} (${customerName})`;
              }

              returnData.push({
                name: displayName,
                value: customerId,
              });
            } catch (error) {
              console.error('[ERROR] Error processing customer:', error);
            }
          }

          // Sort the options alphabetically by display name
          returnData.sort((a, b) => a.name.localeCompare(b.name));

          return returnData;
        } catch (error) {
          console.error('[ERROR] Error retrieving customers:', error);
          return [{ name: `Error fetching customers: ${(error as Error).message}`, value: '' }];
        }
      },

      // Get a list of tenants
      async getTenants(this: ILoadOptionsFunctions) {
        const returnData: INodePropertyOptions[] = [];
        const pageSize = 500; // Use larger page size for efficiency
        let customerId: unknown;

        try {
          customerId = this.getCurrentNodeParameter('customerId');
        } catch (error) {
          customerId = '';
        }

        const endpoint = customerId ? `/msp/v2/customers/${customerId}/tenants` : '/msp/v2/tenants';

        try {
          // Use the shared helper function for pagination with ILoadOptionsFunctions
          const tenants = await druvaMspApiRequestAllItemsForOptions.call(
            this,
            'GET',
            endpoint,
            'tenants',
            undefined,
            { pageSize },
          );

          // Format the options for the UI
          for (const tenant of tenants) {
            returnData.push({
              name: tenant.tenantName as string,
              value: tenant.tenantId as string,
            });
          }

          // Sort the tenants alphabetically by name
          returnData.sort((a, b) => a.name.localeCompare(b.name));

          return returnData;
        } catch (error) {
          console.error('[ERROR] Error retrieving tenants:', error);
          return [{ name: `Error fetching tenants: ${(error as Error).message}`, value: '' }];
        }
      },

      // Get a list of admins
      async getAdmins(this: ILoadOptionsFunctions) {
        const returnData: INodePropertyOptions[] = [];
        const endpoint = '/msp/v2/admins';
        const pageSize = 500; // Use larger page size for efficiency

        try {
          // Use the shared helper function for pagination with ILoadOptionsFunctions
          const admins = await druvaMspApiRequestAllItemsForOptions.call(
            this,
            'GET',
            endpoint,
            'admins',
            undefined,
            { pageSize },
          );

          // Format the options for the UI
          for (const admin of admins) {
            try {
              // Make sure we have valid admin data
              if (!admin.id && !admin.adminId) {
                continue;
              }

              // Ensure we have name components
              const firstName = admin.firstName || '';
              const lastName = admin.lastName || '';
              const email = admin.email || '';

              // Create a display name with both name parts and email
              const name = `${firstName} ${lastName} (${email})`;

              // Ensure ID is a string (n8n requires string values for options)
              const id = admin.id || admin.adminId;
              const value = typeof id === 'string' ? id : String(id);

              returnData.push({ name, value });
            } catch (error) {
              console.error('[ERROR] Error formatting admin:', error);
            }
          }

          // Sort the admins alphabetically by name
          returnData.sort((a, b) => a.name.localeCompare(b.name));

          return returnData;
        } catch (error) {
          console.error('[ERROR] Error retrieving admins:', error);
          return [{ name: `Error fetching admins: ${(error as Error).message}`, value: '' }];
        }
      },

      // Get service plans
      async getServicePlans(this: ILoadOptionsFunctions) {
        const returnData: INodePropertyOptions[] = [];
        const endpoint = '/msp/v2/servicePlans';
        const pageSize = 500; // Use larger page size for efficiency

        try {
          // Use the shared helper function for pagination with ILoadOptionsFunctions
          const servicePlans = await druvaMspApiRequestAllItemsForOptions.call(
            this,
            'GET',
            endpoint,
            'servicePlans',
            undefined,
            { pageSize },
          );

          // Format the options for the UI
          for (const plan of servicePlans) {
            returnData.push({
              name: plan.name as string,
              value: plan.id as string,
            });
          }

          // Sort the service plans alphabetically by name
          returnData.sort((a, b) => a.name.localeCompare(b.name));

          return returnData;
        } catch (error) {
          console.error('[ERROR] Error retrieving service plans:', error);
          return [{ name: `Error fetching service plans: ${(error as Error).message}`, value: '' }];
        }
      },

      // Get predefined admin roles (based on API documentation)
      async getAdminRoles(this: ILoadOptionsFunctions) {
        return [
          { name: 'MSP Admin', value: '2' },
          { name: 'Tenant Admin', value: '3' },
          { name: 'Read Only Admin', value: '4' },
        ];
      },

      // Get predefined admin statuses (based on API documentation)
      async getAdminStatuses(this: ILoadOptionsFunctions) {
        return [
          { name: 'Ready', value: '0' },
          { name: 'Updating', value: '1' },
        ];
      },

      // Get predefined workload types
      async getWorkloadTypes(this: ILoadOptionsFunctions) {
        return [
          { name: 'VM', value: 'VM' },
          { name: 'Physical Server', value: 'PHYSICAL_SERVER' },
          { name: 'AWS', value: 'AWS' },
          { name: 'Azure', value: 'AZURE' },
          { name: 'GCP', value: 'GCP' },
          { name: 'Database', value: 'DATABASE' },
          { name: 'NAS Share', value: 'NAS_SHARE' },
        ];
      },

      // Get predefined backup statuses
      async getBackupStatuses(this: ILoadOptionsFunctions) {
        return [
          { name: 'Success', value: 'SUCCESS' },
          { name: 'Failed', value: 'FAILED' },
          { name: 'Partial Success', value: 'PARTIAL_SUCCESS' },
          { name: 'Aborted', value: 'ABORTED' },
          { name: 'In Progress', value: 'IN_PROGRESS' },
        ];
      },

      // Get predefined connection statuses
      async getConnectionStatuses(this: ILoadOptionsFunctions) {
        return [
          { name: 'Connected', value: 'CONNECTED' },
          { name: 'Disconnected', value: 'DISCONNECTED' },
          { name: 'Intermittent', value: 'INTERMITTENT' },
        ];
      },

      // Get predefined risk levels
      async getRiskLevels(this: ILoadOptionsFunctions) {
        return [
          { name: 'Critical', value: 'CRITICAL' },
          { name: 'High', value: 'HIGH' },
          { name: 'Medium', value: 'MEDIUM' },
          { name: 'Low', value: 'LOW' },
        ];
      },

      // Get predefined protection statuses
      async getProtectionStatuses(this: ILoadOptionsFunctions) {
        return [
          { name: 'Protected', value: 'PROTECTED' },
          { name: 'Unprotected', value: 'UNPROTECTED' },
          { name: 'Partially Protected', value: 'PARTIALLY_PROTECTED' },
        ];
      },

      // Get predefined resource statuses
      async getResourceStatuses(this: ILoadOptionsFunctions) {
        return [
          { name: 'Active', value: 'ACTIVE' },
          { name: 'Inactive', value: 'INACTIVE' },
        ];
      },

      // Get predefined resource types
      async getResourceTypes(this: ILoadOptionsFunctions) {
        return [
          { name: 'VM', value: 'VM' },
          { name: 'Database', value: 'DATABASE' },
          { name: 'File System', value: 'FILESYSTEM' },
        ];
      },

      // Get predefined backup types
      async getBackupTypes(this: ILoadOptionsFunctions) {
        return [
          { name: 'Full', value: 'FULL' },
          { name: 'Incremental', value: 'INCREMENTAL' },
          { name: 'Differential', value: 'DIFFERENTIAL' },
        ];
      },

      // Get predefined agent health statuses
      async getAgentHealthStatuses(this: ILoadOptionsFunctions) {
        return [
          { name: 'Healthy', value: 'HEALTHY' },
          { name: 'Warning', value: 'WARNING' },
          { name: 'Critical', value: 'CRITICAL' },
        ];
      },

      // Get predefined product IDs
      async getProductIds(this: ILoadOptionsFunctions) {
        return [
          { name: 'Hybrid Workloads', value: '1' },
          { name: 'SaaS Apps and Endpoints', value: '2' },
        ];
      },

      // Get predefined event categories
      async getEventCategories(this: ILoadOptionsFunctions) {
        return [
          { name: 'Event', value: 'EVENT' },
          { name: 'Audit', value: 'AUDIT' },
          { name: 'Alert', value: 'ALERT' },
        ];
      },

      // Get predefined syslog severities
      async getSyslogSeverities(this: ILoadOptionsFunctions) {
        return [
          { name: 'Emergency (0)', value: '0' },
          { name: 'Alert (1)', value: '1' },
          { name: 'Critical (2)', value: '2' },
          { name: 'Error (3)', value: '3' },
          { name: 'Warning (4)', value: '4' },
          { name: 'Notice (5)', value: '5' },
          { name: 'Informational (6)', value: '6' },
          { name: 'Debug (7)', value: '7' },
        ];
      },

      // Get tenant status options
      async getTenantStatusOptions(this: ILoadOptionsFunctions) {
        return getTenantStatusOptions();
      },

      // Get tenant type options
      async getTenantTypeOptions(this: ILoadOptionsFunctions) {
        return getTenantTypeOptions();
      },

      // Get product ID options
      async getProductIdOptions(this: ILoadOptionsFunctions) {
        return getProductIdOptions();
      },
    },
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const resource = this.getNodeParameter('resource', 0, '') as string;

    for (let i = 0; i < items.length; i++) {
      try {
        let resultData: INodeExecutionData[] = [];
        if (resource === 'admin') {
          resultData = await executeAdminOperation.call(this, i);
        } else if (resource === 'customer') {
          resultData = await executeCustomerOperation.call(this, i);
        } else if (resource === 'tenant') {
          resultData = await executeTenantOperation.call(this, i);
        } else if (resource === 'servicePlan') {
          resultData = await executeServicePlanOperation.call(this, i);
        } else if (resource === 'task') {
          resultData = await executeTaskOperation.call(this, i);
        } else if (resource === 'event') {
          resultData = await executeEventOperation.call(this, i);
        } else if (resource === 'reportUsage') {
          resultData = await executeReportUsageOperation.call(this, i);
        } else if (resource === 'reportCyber') {
          resultData = await executeReportCyberOperation.call(this, i);
        } else if (resource === 'reportEndpoint') {
          resultData = await executeReportEndpointOperation.call(this, i);
        } else if (resource === 'reportHybrid') {
          const hybridResult = await executeReportHybridOperation.call(this);
          resultData = hybridResult[0];
        } else {
          throw new NodeOperationError(
            this.getNode(),
            `The resource '${resource}' is not supported!`,
            { itemIndex: i },
          );
        }
        // Push successful results
        const executionData = this.helpers.constructExecutionMetaData(
          this.helpers.returnJsonArray(resultData),
          { itemData: { item: i } },
        );
        returnData.push(...executionData);
      } catch (error) {
        if (this.continueOnFail()) {
          const executionErrorData = this.helpers.constructExecutionMetaData(
            this.helpers.returnJsonArray({ error: error.message }),
            { itemData: { item: i } },
          );
          returnData.push(...executionErrorData);
          continue;
        }
        throw error;
      }
    }

    return [returnData];
  }
}
