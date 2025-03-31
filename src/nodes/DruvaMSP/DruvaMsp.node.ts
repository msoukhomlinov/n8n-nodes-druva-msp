// Import types used only as types
import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  IDataObject,
  ILoadOptionsFunctions,
  INodePropertyOptions,
} from 'n8n-workflow';

// Import values and types used as values
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';

// Import helper functions
// Import Customer resource
import { customerOperations, customerFields } from './Customer.node.options';
import { executeCustomerOperation } from './Customer.node.execute';

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

// Import countries data
import { countries } from './countries';

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
            name: 'Customer',
            value: 'customer',
          },
          {
            name: 'Tenant',
            value: 'tenant',
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
            name: 'Event',
            value: 'event',
          },
          {
            name: 'Report - Usage',
            value: 'reportUsage',
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
          // TODO: Add other resources (Reports)
        ],
        default: 'customer',
      },

      // Operations for each resource
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

        try {
          // Create a custom wrapper to handle type compatibility
          const makeRequest = async () => {
            const response = await this.helpers.request({
              url: `${this.getNodeParameter('baseUrl', ['https://apis.druva.com'])}${endpoint}`,
              method: 'GET',
              headers: {
                Authorization: `Bearer ${await this.getCredentials('druvaMspApi')}`,
              },
              json: true,
            });
            return response;
          };

          const response = await makeRequest();

          if (response?.customers?.length && Array.isArray(response.customers)) {
            for (const customer of response.customers) {
              returnData.push({
                name: customer.customerName as string,
                value: customer.customerId as string,
              });
            }
          }

          return returnData;
        } catch (error) {
          return [{ name: 'Error fetching customers', value: '' }];
        }
      },

      // Get a list of tenants
      async getTenants(this: ILoadOptionsFunctions) {
        const returnData: INodePropertyOptions[] = [];
        let customerId: unknown;

        try {
          customerId = this.getCurrentNodeParameter('customerId');
        } catch (error) {
          customerId = '';
        }

        const endpoint = customerId ? `/msp/v2/customers/${customerId}/tenants` : '/msp/v2/tenants';

        try {
          // Create a custom wrapper to handle type compatibility
          const makeRequest = async () => {
            const response = await this.helpers.request({
              url: `${this.getNodeParameter('baseUrl', ['https://apis.druva.com'])}${endpoint}`,
              method: 'GET',
              headers: {
                Authorization: `Bearer ${await this.getCredentials('druvaMspApi')}`,
              },
              json: true,
            });
            return response;
          };

          const response = await makeRequest();

          if (response?.tenants?.length && Array.isArray(response.tenants)) {
            for (const tenant of response.tenants) {
              returnData.push({
                name: tenant.tenantName as string,
                value: tenant.tenantId as string,
              });
            }
          }

          return returnData;
        } catch (error) {
          return [{ name: 'Error fetching tenants', value: '' }];
        }
      },

      // Get list of admins for a specific customer
      async getAdmins(this: ILoadOptionsFunctions) {
        const returnData: INodePropertyOptions[] = [];
        let customerId: unknown;

        try {
          customerId = this.getCurrentNodeParameter('customerId');
        } catch (error) {
          return [{ name: 'Please select a customer first', value: '' }];
        }

        if (!customerId) {
          return [{ name: 'Please select a customer first', value: '' }];
        }

        const endpoint = `/msp/v2/customers/${customerId}/admins`;

        try {
          // Create a custom wrapper to handle type compatibility
          const makeRequest = async () => {
            const response = await this.helpers.request({
              url: `${this.getNodeParameter('baseUrl', ['https://apis.druva.com'])}${endpoint}`,
              method: 'GET',
              headers: {
                Authorization: `Bearer ${await this.getCredentials('druvaMspApi')}`,
              },
              json: true,
            });
            return response;
          };

          const response = await makeRequest();

          if (response?.admins?.length && Array.isArray(response.admins)) {
            for (const admin of response.admins) {
              returnData.push({
                name: `${admin.firstName} ${admin.lastName} (${admin.email})`,
                value: admin.email as string,
              });
            }
          }

          return returnData;
        } catch (error) {
          return [{ name: 'Error fetching admins', value: '' }];
        }
      },

      // Get service plans
      async getServicePlans(this: ILoadOptionsFunctions) {
        const returnData: INodePropertyOptions[] = [];
        const endpoint = '/msp/v2/servicePlans';

        try {
          // Create a custom wrapper to handle type compatibility
          const makeRequest = async () => {
            const response = await this.helpers.request({
              url: `${this.getNodeParameter('baseUrl', ['https://apis.druva.com'])}${endpoint}`,
              method: 'GET',
              headers: {
                Authorization: `Bearer ${await this.getCredentials('druvaMspApi')}`,
              },
              json: true,
            });
            return response;
          };

          const response = await makeRequest();

          if (response?.servicePlans?.length && Array.isArray(response.servicePlans)) {
            for (const plan of response.servicePlans) {
              returnData.push({
                name: plan.name as string,
                value: plan.id as string,
              });
            }
          }

          return returnData;
        } catch (error) {
          return [{ name: 'Error fetching service plans', value: '' }];
        }
      },

      // Get predefined admin roles
      async getAdminRoles(this: ILoadOptionsFunctions) {
        return [
          { name: 'Administrator', value: 'ADMINISTRATOR' },
          { name: 'Operator', value: 'OPERATOR' },
          { name: 'Billing Admin', value: 'BILLING_ADMIN' },
          { name: 'Read Only', value: 'READ_ONLY' },
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

      // Get list of countries using our local data based on countries-list package
      async getCountries(this: ILoadOptionsFunctions) {
        const returnData: INodePropertyOptions[] = [];

        // Convert the countries object to array for sorting
        const countriesArray = Object.entries(countries).map(([code, data]) => ({
          code,
          name: data.name,
        }));

        // Sort countries alphabetically by name
        countriesArray.sort((a, b) => a.name.localeCompare(b.name));

        // Add to return data
        for (const country of countriesArray) {
          returnData.push({
            name: country.name,
            value: country.code,
          });
        }

        return returnData;
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
        if (resource === 'customer') {
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
          // Push error data
          const errorData = this.helpers.constructExecutionMetaData(
            this.helpers.returnJsonArray([{ error: (error as Error).message } as IDataObject]),
            { itemData: { item: i } },
          );
          returnData.push(...errorData);
        } else {
          // Throw error if not continuing on fail
          throw error;
        }
      }
    }

    return [returnData];
  }
}
