import { IExecuteFunctions } from 'n8n-core';
import {
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { handlePagination, IPaginationOptions } from './utils/pagination';
import {
	IDruvaMspCustomer,
	IDruvaMspTenant,
	IDruvaMspServicePlan,
	IDruvaMspAdmin,
	IDruvaMspTask,
	IDruvaMspEvent,
	IDruvaMspReport,
	IEndpointsReport,
	ICyberResilienceReport,
	IReportFilters,
} from './types';

export class DruvaMsp implements INodeType {
	description: INodeTypeDescription = {
			displayName: 'Druva MSP',
			name: 'druvaMsp',
			icon: 'file:druva.svg',
			group: ['transform'],
			version: 1,
			subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
			description: 'Interact with Druva MSP API',
			defaults: {
				name: 'Druva MSP',
			},
			inputs: ['main'],
			outputs: ['main'],
			credentials: [
				{
					name: 'druvaMspApi',
					required: true,
				},
			],
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
							name: 'Admin',
							value: 'admin',
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
							name: 'Report',
							value: 'report',
						},
						{
							name: 'Hybrid Workloads Report',
							value: 'hybridWorkloadsReport',
						},
						{
							name: 'Endpoints Report',
							value: 'endpointsReport',
						},
						{
							name: 'Cyber Resilience Report',
							value: 'cyberResilienceReport',
						},
					],
					default: 'customer',
				},
				{
					displayName: 'Operation',
					name: 'operation',
					type: 'options',
					noDataExpression: true,
					displayOptions: {
						show: {
							resource: ['customer'],
						},
					},
					options: [
						{
							name: 'List All Customers',
							value: 'list',
							description: 'Get a list of all customers',
							action: 'List all customers',
						},
						{
							name: 'Create New Customer',
							value: 'create',
							description: 'Create a new customer',
							action: 'Create a new customer',
						},
						{
							name: 'Get Customer Details',
							value: 'get',
							description: 'Get details of a specific customer',
							action: 'Get customer details',
						},
						{
							name: 'Update Customer Details',
							value: 'update',
							description: 'Update details of a specific customer',
							action: 'Update customer details',
						},
						{
							name: 'Generate API Token',
							value: 'generateToken',
							description: 'Generate API access token for a customer',
							action: 'Generate API access token',
						},
					],
					default: 'list',
				},
				{
					displayName: 'Operation',
					name: 'operation',
					type: 'options',
					noDataExpression: true,
					displayOptions: {
						show: {
							resource: ['tenant'],
						},
					},
					options: [
						{
							name: 'Create New Tenant',
							value: 'create',
							description: 'Create a new tenant',
							action: 'Create a new tenant',
						},
						{
							name: 'Get Tenants List',
							value: 'list',
							description: 'Get a list of all tenants',
							action: 'Get tenants list',
						},
						{
							name: 'Get Tenant Details',
							value: 'get',
							description: 'Get details of a specific tenant',
							action: 'Get tenant details',
						},
						{
							name: 'Update Tenant',
							value: 'update',
							description: 'Update an existing tenant',
							action: 'Update an existing tenant',
						},
						{
							name: 'Suspend Tenant',
							value: 'suspend',
							description: 'Suspend a customer tenant',
							action: 'Suspend a customer tenant',
						},
						{
							name: 'Unsuspend Tenant',
							value: 'unsuspend',
							description: 'Unsuspend a customer tenant',
							action: 'Unsuspend a customer tenant',
						},
					],
					default: 'list',
				},
				{
					displayName: 'Operation',
					name: 'operation',
					type: 'options',
					noDataExpression: true,
					displayOptions: {
						show: {
							resource: ['servicePlan'],
						},
					},
					options: [
						{
							name: 'List All Service Plans',
							value: 'list',
							description: 'Get a list of all service plans',
							action: 'List all service plans',
						},
						{
							name: 'Get Service Plan',
							value: 'get',
							description: 'Get details of a specific service plan',
							action: 'Get service plan',
						},
					],
					default: 'list',
				},
				{
					displayName: 'Operation',
					name: 'operation',
					type: 'options',
					noDataExpression: true,
					displayOptions: {
						show: {
							resource: ['admin'],
						},
					},
					options: [
						{
							name: 'List All Administrators',
							value: 'list',
							description: 'Get a list of all administrators',
							action: 'List all administrators',
						},
					],
					default: 'list',
				},
				{
					displayName: 'Operation',
					name: 'operation',
					type: 'options',
					noDataExpression: true,
					displayOptions: {
						show: {
							resource: ['task'],
						},
					},
					options: [
						{
							name: 'Get Task Details',
							value: 'get',
							description: 'Get details of a specific task',
							action: 'Get task details',
						},
					],
					default: 'get',
				},
				{
					displayName: 'Operation',
					name: 'operation',
					type: 'options',
					noDataExpression: true,
					displayOptions: {
						show: {
							resource: ['event'],
						},
					},
					options: [
						{
							name: 'List Customer Level Events',
							value: 'listCustomer',
							description: 'List all customer level events',
							action: 'List all customer level events',
						},
						{
							name: 'List MSP Level Events',
							value: 'listMsp',
							description: 'List all MSP level events',
							action: 'List all MSP level events',
						},
					],
					default: 'listCustomer',
				},
				{
					displayName: 'Operation',
					name: 'operation',
					type: 'options',
					noDataExpression: true,
					displayOptions: {
						show: {
							resource: ['report'],
						},
					},
					options: [
						{
							name: 'Get Global Usage Summary',
							value: 'getGlobalUsage',
							description: 'Get global usage report summary',
							action: 'Get global usage report summary',
						},
						{
							name: 'Get Itemized Tenant Consumption',
							value: 'getTenantConsumption',
							description: 'Get Itemized Tenant Consumption Report v2.0',
							action: 'Get Itemized Tenant Consumption Report',
						},
						{
							name: 'Get Itemized Tenant Quota',
							value: 'getTenantQuota',
							description: 'Get Itemized Tenant Quota Report v2.0',
							action: 'Get Itemized Tenant Quota Report',
						},
					],
					default: 'getGlobalUsage',
				},
				{
					displayName: 'Report Type',
					name: 'reportType',
					type: 'options',
					displayOptions: {
						show: {
							resource: ['hybridWorkloadsReport'],
						},
					},
					options: [
						{
							name: 'Alert History',
							value: 'alertHistory',
							description: 'View Alert History Report',
						},
						{
							name: 'Backup Activity',
							value: 'backupActivity',
							description: 'View Backup Activity Report',
						},
						{
							name: 'Resource Status',
							value: 'resourceStatus',
							description: 'View Resource Status Report',
						},
						{
							name: 'Storage Consumption by BackupSets',
							value: 'storageConsumption',
							description: 'View Storage Consumption by BackupSets Report',
						},
						{
							name: 'DR Replication Activity',
							value: 'drReplication',
							description: 'View Disaster Recovery Replication Activity Report',
						},
						{
							name: 'DR Failback Activity',
							value: 'drFailback',
							description: 'View Disaster Recovery Failback Activity Report',
						},
						{
							name: 'DR Failover Activity',
							value: 'drFailover',
							description: 'View Disaster Recovery Failover Activity Report',
						},
					],
					default: 'alertHistory',
				},
				{
					displayName: 'Report Type',
					name: 'reportType',
					type: 'options',
					displayOptions: {
						show: {
							resource: ['endpointsReport'],
						},
					},
					options: [
						{
							name: 'Alert Report',
							value: 'alert',
							description: 'View Alert Report',
						},
						{
							name: 'Users Report',
							value: 'users',
							description: 'View Users Report',
						},
						{
							name: 'License Usage Report',
							value: 'licenseUsage',
							description: 'View License Usage Report',
						},
						{
							name: 'User Provisioning Report',
							value: 'userProvisioning',
							description: 'View User Provisioning Report',
						},
						{
							name: 'User Rollout Report',
							value: 'userRollout',
							description: 'View User Rollout Report',
						},
						{
							name: 'Last Backup Status Report',
							value: 'lastBackupStatus',
							description: 'View Last Backup Status Report data',
						},
						{
							name: 'Storage Statistics',
							value: 'storageStats',
							description: 'View storage statistics of MSP customers',
						},
						{
							name: 'Storage Alerts',
							value: 'storageAlerts',
							description: 'View storage alerts of MSP customers',
						},
						{
							name: 'Cloud Cache Statistics',
							value: 'cloudCacheStats',
							description: 'View cloud cache statistics of MSP customers',
						},
					],
					default: 'alert',
				},
				{
					displayName: 'Report Type',
					name: 'reportType',
					type: 'options',
					displayOptions: {
						show: {
							resource: ['cyberResilienceReport'],
						},
					},
					options: [
						{
							name: 'Rollback Actions Report',
							value: 'rollbackActions',
							description: 'View Rollback Actions Report',
						},
						{
							name: 'Data Protection Risk Report',
							value: 'dataProtectionRisk',
							description: 'View Data Protection Risk Report',
						},
					],
					default: 'rollbackActions',
				},
				{
					displayName: 'ID',
					name: 'id',
					type: 'string',
					required: true,
					displayOptions: {
						show: {
							operation: ['get', 'update', 'delete'],
							resource: ['customer', 'tenant', 'servicePlan', 'admin', 'task', 'event'],
						},
					},
					default: '',
					description: 'ID of the record',
				},
				{
					displayName: 'Additional Fields',
					name: 'additionalFields',
					type: 'collection',
					placeholder: 'Add Field',
					default: {},
					displayOptions: {
						show: {
							operation: ['create', 'update'],
							resource: ['customer', 'tenant', 'servicePlan', 'admin'],
						},
					},
					options: [
						{
							displayName: 'Name',
							name: 'name',
							type: 'string',
							default: '',
						},
						{
							displayName: 'Email',
							name: 'email',
							type: 'string',
							default: '',
						},
						{
							displayName: 'Phone',
							name: 'phone',
							type: 'string',
							default: '',
						},
						{
							displayName: 'Status',
							name: 'status',
							type: 'string',
							default: '',
						},
					],
				},
				{
					displayName: 'Filters',
					name: 'filters',
					type: 'collection',
					placeholder: 'Add Filter',
					default: {},
					displayOptions: {
						show: {
							operation: ['getAll'],
							resource: ['customer', 'tenant', 'servicePlan', 'admin', 'task', 'event'],
						},
					},
					options: [
						{
							displayName: 'Retrieve All',
							name: 'retrieveAll',
							type: 'boolean',
							default: false,
							description: 'Whether to retrieve all records',
						},
						{
							displayName: 'Maximum Records',
							name: 'maxRecords',
							type: 'number',
							typeOptions: {
								minValue: 1,
							},
							default: 100,
							description: 'Maximum number of records to return (will automatically paginate if more than 500)',
							displayOptions: {
								show: {
									retrieveAll: [false],
								},
							},
						},
					],
				},
				{
					displayName: 'Report Filters',
					name: 'reportFilters',
					type: 'collection',
					placeholder: 'Add Filter',
					default: {},
					displayOptions: {
						show: {
							resource: ['endpointsReport', 'cyberResilienceReport'],
						},
					},
					options: [
						{
							displayName: 'Start Date',
							name: 'startDate',
							type: 'dateTime',
							default: '',
						},
						{
							displayName: 'End Date',
							name: 'endDate',
							type: 'dateTime',
							default: '',
						},
						{
							displayName: 'Customer IDs',
							name: 'customerIds',
							type: 'string',
							default: '',
							description: 'Comma-separated list of customer IDs',
						},
						{
							displayName: 'Product ID',
							name: 'productId',
							type: 'number',
							default: 0,
						},
						{
							displayName: 'Page Size',
							name: 'pageSize',
							type: 'number',
							default: 100,
							description: 'Number of results to return',
						},
					],
				},
				{
					displayName: 'ID',
					name: 'id',
					type: 'string',
					required: true,
					displayOptions: {
						show: {
							operation: ['get', 'update', 'suspend', 'unsuspend'],
							resource: ['tenant'],
						},
					},
					default: '',
					description: 'ID of the tenant',
				},
				{
					displayName: 'Tenant Details',
					name: 'additionalFields',
					type: 'collection',
					placeholder: 'Add Field',
					default: {},
					displayOptions: {
						show: {
							operation: ['create', 'update'],
							resource: ['tenant'],
						},
					},
					options: [
						{
							displayName: 'Name',
							name: 'name',
							type: 'string',
							default: '',
							description: 'Name of the tenant',
							required: true,
						},
						{
							displayName: 'Customer ID',
							name: 'customerId',
							type: 'string',
							default: '',
							description: 'ID of the customer this tenant belongs to',
							required: true,
						},
						{
							displayName: 'Service Plan ID',
							name: 'servicePlanId',
							type: 'string',
							default: '',
							description: 'ID of the service plan for this tenant',
							required: true,
						},
						{
							displayName: 'Region',
							name: 'region',
							type: 'string',
							default: '',
							description: 'Region for the tenant',
						},
						{
							displayName: 'Product ID',
							name: 'productId',
							type: 'number',
							default: 0,
							description: 'ID of the product',
						},
					],
				},
				{
					displayName: 'Filters',
					name: 'filters',
					type: 'collection',
					placeholder: 'Add Filter',
					default: {},
					displayOptions: {
						show: {
							operation: ['list'],
							resource: ['tenant'],
						},
					},
					options: [
						{
							displayName: 'Page Size',
							name: 'pageSize',
							type: 'number',
							typeOptions: {
								minValue: 1,
								maxValue: 500,
							},
							default: 100,
							description: 'Number of results to return',
						},
						{
							displayName: 'Max Items',
							name: 'maxItems',
							type: 'number',
							typeOptions: {
								minValue: 1,
							},
							default: 0,
							description: 'Max number of results to return (0 = unlimited)',
						},
						{
							displayName: 'Customer ID',
							name: 'customerId',
							type: 'string',
							default: '',
							description: 'Filter tenants by customer ID',
						},
					],
				},
			],
		};

		async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
			const items = this.getInputData();
			const returnData: IDataObject[] = [];
			const resource = this.getNodeParameter('resource', 0) as string;
			const operation = this.getNodeParameter('operation', 0) as string;

			let responseData: IDataObject | IDataObject[] = [];

			for (let i = 0; i < items.length; i++) {
				try {
					if (resource === 'customer') {
						switch (operation) {
							case 'list':
								const filters = this.getNodeParameter('filters', i) as IPaginationOptions;
								const retrieveAll = this.getNodeParameter('retrieveAll', i) as boolean;
								const maxRecords = retrieveAll ? undefined : this.getNodeParameter('maxRecords', i) as number;

								const paginationOptions: IPaginationOptions = {
									resource: '/v1/customers',
									method: 'GET',
									retrieveAll,
									maxRecords,
									filters,
								};
								responseData = await handlePagination.call(this, paginationOptions);
								break;

							case 'create':
								const createFields = this.getNodeParameter('additionalFields', i) as IDataObject;
								responseData = await this.helpers.httpRequest({
									method: 'POST',
									url: '/v1/customers',
									body: createFields,
								});
								break;

							case 'get':
								const customerId = this.getNodeParameter('id', i) as string;
								responseData = await this.helpers.httpRequest({
									method: 'GET',
									url: `/v1/customers/${customerId}`,
								});
								break;

							case 'update':
								const updateId = this.getNodeParameter('id', i) as string;
								const updateFields = this.getNodeParameter('additionalFields', i) as IDataObject;
								responseData = await this.helpers.httpRequest({
									method: 'PUT',
									url: `/v1/customers/${updateId}`,
									body: updateFields,
								});
								break;

							case 'generateToken':
								const tokenCustomerId = this.getNodeParameter('id', i) as string;
								responseData = await this.helpers.httpRequest({
									method: 'POST',
									url: `/v1/customers/${tokenCustomerId}/token`,
									body: {},
								});
								break;

							default:
								throw new Error(`The operation "${operation}" is not supported for resource "${resource}"!`);
						}
					} else if (resource === 'endpointsReport' || resource === 'cyberResilienceReport') {
						const reportType = this.getNodeParameter('reportType', i) as string;
						const filters = this.getNodeParameter('reportFilters', i) as IReportFilters;

						const endpoint = resource === 'endpointsReport'
							? `/msp/reporting/v1/reports/mspEP${reportType}`
							: `/msp/reporting/v1/reports/mspDG${reportType}`;

						responseData = await this.helpers.httpRequest({
							method: 'POST',
							url: endpoint,
							body: { filters },
						});
					} else if (operation === 'getAll') {
						const filters = this.getNodeParameter('filters', i) as IPaginationOptions;
						const paginationOptions: IPaginationOptions = {
							resource: `/v1/${resource}s`,
							method: 'GET',
							pageSize: filters.pageSize || 100,
							maxItems: filters.maxItems || 0,
							filters,
						};

						responseData = await handlePagination.call(this, paginationOptions);
					} else if (resource === 'tenant') {
						switch (operation) {
							case 'create': {
								const createFields = this.getNodeParameter('additionalFields', i) as IDataObject;
								responseData = await this.helpers.httpRequest({
									method: 'POST',
									url: '/v1/tenants',
									body: createFields,
								});
								break;
							}
							case 'list': {
								const filters = this.getNodeParameter('filters', i) as IPaginationOptions;
								const retrieveAll = this.getNodeParameter('retrieveAll', i) as boolean;
								const maxRecords = retrieveAll ? undefined : this.getNodeParameter('maxRecords', i) as number;

								const paginationOptions: IPaginationOptions = {
									resource: '/v1/tenants',
									method: 'GET',
									retrieveAll,
									maxRecords,
									filters,
								};
								responseData = await handlePagination.call(this, paginationOptions);
								break;
							}
							case 'get': {
								const tenantId = this.getNodeParameter('id', i) as string;
								responseData = await this.helpers.httpRequest({
									method: 'GET',
									url: `/v1/tenants/${tenantId}`,
								});
								break;
							}
							case 'update': {
								const updateId = this.getNodeParameter('id', i) as string;
								const updateFields = this.getNodeParameter('additionalFields', i) as IDataObject;
								responseData = await this.helpers.httpRequest({
									method: 'PUT',
									url: `/v1/tenants/${updateId}`,
									body: updateFields,
								});
								break;
							}
							case 'suspend': {
								const tenantId = this.getNodeParameter('id', i) as string;
								responseData = await this.helpers.httpRequest({
									method: 'POST',
									url: `/v1/tenants/${tenantId}/suspend`,
								});
								break;
							}
							case 'unsuspend': {
								const tenantId = this.getNodeParameter('id', i) as string;
								responseData = await this.helpers.httpRequest({
									method: 'POST',
									url: `/v1/tenants/${tenantId}/unsuspend`,
								});
								break;
							}
							default:
								throw new Error(`The operation "${operation}" is not supported for resource "${resource}"!`);
						}
					} else {
						const endpoint = `/v1/${resource}s`;
						const method = operation === 'create' ? 'POST'
							: operation === 'update' ? 'PUT'
							: operation === 'delete' ? 'DELETE'
							: 'GET';

						const body = {} as IDataObject;
						if (['create', 'update'].includes(operation)) {
							const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;
							Object.assign(body, additionalFields);
						}

						if (['get', 'update', 'delete'].includes(operation)) {
							const id = this.getNodeParameter('id', i) as string;
							responseData = await this.helpers.httpRequest({
								method,
								url: `${endpoint}/${id}`,
								body,
							});
						} else {
							responseData = await this.helpers.httpRequest({
								method,
								url: endpoint,
								body,
							});
						}
					}

					if (Array.isArray(responseData)) {
						returnData.push(...responseData);
					} else {
						returnData.push(responseData);
					}
				} catch (error) {
					if (this.continueOnFail()) {
						returnData.push({ error: error.message });
						continue;
					}
					throw error;
				}
			}

			return [this.helpers.returnJsonArray(returnData)];
		}
	}
