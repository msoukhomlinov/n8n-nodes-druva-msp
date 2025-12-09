import type { INodeProperties } from 'n8n-workflow';

// Define the operations for the Tenant resource
export const tenantOperations: INodeProperties[] = [
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
        name: 'Create',
        value: 'create',
        action: 'Create a new tenant',
      },
      {
        name: 'Get',
        value: 'get',
        action: 'Get a tenant by ID',
      },
      {
        name: 'Get Many',
        value: 'getMany',
        action: 'Get many tenants',
      },
      {
        name: 'Update',
        value: 'update',
        action: 'Update a tenant',
      },
      {
        name: 'Suspend',
        value: 'suspend',
        action: 'Suspend a tenant by ID',
      },
      {
        name: 'Unsuspend',
        value: 'unsuspend',
        action: 'Unsuspend a tenant by ID',
      },
    ],
    default: 'getMany',
  },
];

// Define the fields for the Tenant resource operations
export const tenantFields: INodeProperties[] = [
  /* -------------------------------------------------------------------------- */
  /*                                 tenant:get                                 */
  /* -------------------------------------------------------------------------- */
  {
    displayName: 'Tenant ID',
    name: 'tenantId',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['tenant'],
        operation: ['get', 'update', 'suspend', 'unsuspend'],
      },
    },
    default: '',
    description: 'Unique identifier of the tenant.',
  },

  /* -------------------------------------------------------------------------- */
  /*                                tenant:getMany                              */
  /* -------------------------------------------------------------------------- */
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['tenant'],
        operation: ['getMany'],
      },
    },
    default: false,
    description: 'Whether to return all results or only up to a given limit.',
  },
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    typeOptions: {
      minValue: 1,
    },
    displayOptions: {
      show: {
        resource: ['tenant'],
        operation: ['getMany'],
        returnAll: [false],
      },
    },
    default: 50,
    description: 'Max number of results to return.',
  },
  {
    displayName: 'Filter by Customer',
    name: 'filterByCustomer',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['tenant'],
        operation: ['getMany'],
      },
    },
    default: false,
    description: 'Whether to filter tenants by customer ID',
  },
  {
    displayName: 'Customer ID',
    name: 'customerId',
    type: 'options',
    typeOptions: {
      loadOptionsMethod: 'getCustomers',
    },
    displayOptions: {
      show: {
        resource: ['tenant'],
        operation: ['getMany'],
        filterByCustomer: [true],
      },
    },
    default: '',
    description: 'Filter tenants by customer ID',
  },
  {
    displayName: 'Filter by Tenant Status',
    name: 'filterByStatus',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['tenant'],
        operation: ['getMany'],
      },
    },
    default: false,
    description: 'Whether to filter results by tenant status',
  },
  {
    displayName: 'Tenant Status',
    name: 'statusFilter',
    type: 'options',
    typeOptions: {
      loadOptionsMethod: 'getTenantStatusOptions',
    },
    displayOptions: {
      show: {
        resource: ['tenant'],
        operation: ['getMany'],
        filterByStatus: [true],
      },
    },
    default: '',
    description: 'Status of the tenant to filter by',
  },
  {
    displayName: 'Filter by Tenant Type',
    name: 'filterByType',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['tenant'],
        operation: ['getMany'],
      },
    },
    default: false,
    description: 'Whether to filter results by tenant type',
  },
  {
    displayName: 'Tenant Type',
    name: 'typeFilter',
    type: 'options',
    typeOptions: {
      loadOptionsMethod: 'getTenantTypeOptions',
    },
    displayOptions: {
      show: {
        resource: ['tenant'],
        operation: ['getMany'],
        filterByType: [true],
      },
    },
    default: '',
    description: 'Type of tenant to filter by',
  },

  /* -------------------------------------------------------------------------- */
  /*                                tenant:create                              */
  /* -------------------------------------------------------------------------- */
  {
    displayName: 'Customer ID',
    name: 'customerId',
    type: 'options',
    typeOptions: {
      loadOptionsMethod: 'getCustomers',
    },
    required: true,
    displayOptions: {
      show: {
        resource: ['tenant'],
        operation: ['create'],
      },
    },
    default: '',
    description: 'The customer ID for whom to create the tenant',
  },
  {
    displayName: 'Product ID',
    name: 'productID',
    type: 'options',
    typeOptions: {
      loadOptionsMethod: 'getProductIds',
    },
    required: true,
    displayOptions: {
      show: {
        resource: ['tenant'],
        operation: ['create'],
      },
    },
    default: '',
    description:
      'The product ID: 1 for Hybrid Workloads (Enterprise Workloads), 2 for SaaS Apps and Endpoints',
  },
  {
    displayName: 'Service Plan ID',
    name: 'servicePlanID',
    type: 'options',
    typeOptions: {
      loadOptionsMethod: 'getServicePlans',
    },
    required: true,
    displayOptions: {
      show: {
        resource: ['tenant'],
        operation: ['create'],
      },
    },
    default: '',
    description: 'The service plan ID to associate with the tenant',
  },
  {
    displayName: 'Tenant Type',
    name: 'tenantType',
    type: 'options',
    typeOptions: {
      loadOptionsMethod: 'getTenantTypeOptions',
    },
    required: true,
    displayOptions: {
      show: {
        resource: ['tenant'],
        operation: ['create'],
      },
    },
    default: '',
    description: 'The type of tenant to create',
  },
  {
    displayName: 'License Expiry Date',
    name: 'licenseExpiryDate',
    type: 'dateTime',
    required: true,
    displayOptions: {
      show: {
        resource: ['tenant'],
        operation: ['create'],
      },
    },
    default: '',
    description: 'The date on which the tenant license will expire (format: YYYY-MM-DDTHH:MM:SSZ)',
  },
  {
    displayName: 'Storage Regions',
    name: 'storageRegions',
    type: 'fixedCollection',
    typeOptions: {
      multipleValues: true,
    },
    required: true,
    displayOptions: {
      show: {
        resource: ['tenant'],
        operation: ['create'],
      },
    },
    default: {},
    description:
      'List of storage regions where tenant data is stored. Each entry must include a region name and provider (1=AWS, 2=Azure).',
    options: [
      {
        displayName: 'Region',
        name: 'region',
        values: [
          {
            displayName: 'Name',
            name: 'name',
            type: 'string',
            default: '',
            placeholder: 'us-east-1',
            description: 'Storage region name.',
            required: true,
          },
          {
            displayName: 'Storage Provider',
            name: 'storageProvider',
            type: 'options',
            options: [
              { name: 'AWS', value: 1 },
              { name: 'Azure', value: 2 },
            ],
            default: 1,
            description: 'Storage provider: 1 for AWS, 2 for Azure.',
          },
        ],
      },
    ],
  },
  {
    displayName: 'Quota',
    name: 'quota',
    type: 'number',
    displayOptions: {
      show: {
        resource: ['tenant'],
        operation: ['create'],
      },
    },
    default: 0,
    description:
      'Druva Consumption Units to allocate to this tenant. If the tenant is close to breaching this limit, an alert is sent.',
  },
  {
    displayName: 'Quota Start Date',
    name: 'quotaStartDate',
    type: 'dateTime',
    displayOptions: {
      show: {
        resource: ['tenant'],
        operation: ['create'],
      },
    },
    default: '',
    description:
      'The start date from when the quota limit will be applicable (format: YYYY-MM-DDTHH:MM:SSZ)',
  },
  {
    displayName: 'Quota End Date',
    name: 'quotaEndDate',
    type: 'dateTime',
    displayOptions: {
      show: {
        resource: ['tenant'],
        operation: ['create'],
      },
    },
    default: '',
    description: 'The end date on which the quota limit will expire (format: YYYY-MM-DDTHH:MM:SSZ)',
  },
  {
    displayName: 'Features',
    name: 'features',
    type: 'fixedCollection',
    typeOptions: {
      multipleValues: true,
    },
    required: true,
    displayOptions: {
      show: {
        resource: ['tenant'],
        operation: ['create'],
      },
    },
    default: {},
    description:
      'List of features to enable. Attribute fields apply only to M365, Google Workspace, and Endpoints features.',
    options: [
      {
        displayName: 'Feature',
        name: 'feature',
        values: [
          {
            displayName: 'Feature Name',
            name: 'name',
            type: 'options',
            default: '',
            options: [
              { name: 'Enterprise Workloads', value: 'Enterprise Workloads' },
              {
                name: 'Enterprise Workloads Accelerated Ransomware Recovery',
                value: 'Enterprise Workloads Accelerated Ransomware Recovery',
              },
              { name: 'Long Term Retention', value: 'Long Term Retention' },
              { name: 'M365', value: 'M365' },
              { name: 'Google Workspace', value: 'Google Workspace' },
              { name: 'Endpoints', value: 'Endpoints' },
              {
                name: 'M365 Accelerated Ransomware Recovery',
                value: 'M365 Accelerated Ransomware Recovery',
              },
              {
                name: 'Endpoints Accelerated Ransomware Recovery',
                value: 'Endpoints Accelerated Ransomware Recovery',
              },
              {
                name: 'Google Workspace Accelerated Ransomware Recovery',
                value: 'Google Workspace Accelerated Ransomware Recovery',
              },
            ],
            description:
              'Feature to enable. ARR/LTR/Enterprise features are boolean. SaaS/Endpoints features accept numeric attributes.',
          },
          {
            displayName: 'Attributes',
            name: 'attrs',
            type: 'fixedCollection',
            typeOptions: {
              multipleValues: true,
            },
            default: {},
            description: 'Attributes for the feature (e.g., userCount, preservedUserCount)',
            options: [
              {
                displayName: 'Attribute',
                name: 'attr',
                values: [
                  {
                    displayName: 'Attribute Name',
                    name: 'name',
                    type: 'options',
                    options: [
                      { name: 'userCount', value: 'userCount' },
                      { name: 'preservedUserCount', value: 'preservedUserCount' },
                      { name: 'educationLicenseState', value: 'educationLicenseState' },
                    ],
                    default: 'userCount',
                    description:
                      'Applicable to M365/Google Workspace (all three) and Endpoints (userCount, preservedUserCount).',
                  },
                  {
                    displayName: 'Attribute Value',
                    name: 'value',
                    type: 'number',
                    default: 0,
                    description: 'Value of the attribute',
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  /* -------------------------------------------------------------------------- */
  /*                                tenant:update                              */
  /* -------------------------------------------------------------------------- */
  {
    displayName: 'Tenant ID',
    name: 'tenantId',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['tenant'],
        operation: ['update'],
      },
    },
    default: '',
    description: 'Unique identifier of the tenant to update',
  },
  {
    displayName: 'Service Plan ID',
    name: 'servicePlanID',
    type: 'options',
    typeOptions: {
      loadOptionsMethod: 'getServicePlans',
    },
    required: false,
    displayOptions: {
      show: {
        resource: ['tenant'],
        operation: ['update'],
      },
    },
    default: '',
    description: 'The service plan ID to associate with the tenant',
  },
  {
    displayName: 'Tenant Type',
    name: 'tenantType',
    type: 'options',
    typeOptions: {
      loadOptionsMethod: 'getTenantTypeOptions',
    },
    required: false,
    displayOptions: {
      show: {
        resource: ['tenant'],
        operation: ['update'],
      },
    },
    default: '',
    description: 'The type of tenant',
  },
  {
    displayName: 'License Expiry Date',
    name: 'licenseExpiryDate',
    type: 'dateTime',
    required: false,
    displayOptions: {
      show: {
        resource: ['tenant'],
        operation: ['update'],
      },
    },
    default: '',
    description:
      'The new date on which the tenant license will expire (format: YYYY-MM-DDTHH:MM:SSZ)',
  },
  {
    displayName: 'Storage Regions',
    name: 'storageRegions',
    type: 'fixedCollection',
    typeOptions: {
      multipleValues: true,
    },
    required: false,
    displayOptions: {
      show: {
        resource: ['tenant'],
        operation: ['update'],
      },
    },
    default: {},
    description:
      'List of storage regions where tenant data is stored. Each entry must include a region name and provider (1=AWS, 2=Azure).',
    options: [
      {
        displayName: 'Region',
        name: 'region',
        values: [
          {
            displayName: 'Name',
            name: 'name',
            type: 'string',
            default: '',
            placeholder: 'us-east-1',
            description: 'Storage region name.',
            required: true,
          },
          {
            displayName: 'Storage Provider',
            name: 'storageProvider',
            type: 'options',
            options: [
              { name: 'AWS', value: 1 },
              { name: 'Azure', value: 2 },
            ],
            default: 1,
            description: 'Storage provider: 1 for AWS, 2 for Azure.',
          },
        ],
      },
    ],
  },
  {
    displayName: 'Quota',
    name: 'quota',
    type: 'number',
    displayOptions: {
      show: {
        resource: ['tenant'],
        operation: ['update'],
      },
    },
    default: 0,
    description:
      'New value of Druva Consumption Units to allocate to this tenant. If the tenant is close to breaching this limit, an alert is sent.',
  },
  {
    displayName: 'Quota Start Date',
    name: 'quotaStartDate',
    type: 'dateTime',
    displayOptions: {
      show: {
        resource: ['tenant'],
        operation: ['update'],
      },
    },
    default: '',
    description:
      'The new start date from when the quota limit will be applicable (format: YYYY-MM-DDTHH:MM:SSZ)',
  },
  {
    displayName: 'Quota End Date',
    name: 'quotaEndDate',
    type: 'dateTime',
    displayOptions: {
      show: {
        resource: ['tenant'],
        operation: ['update'],
      },
    },
    default: '',
    description:
      'The new end date on which the quota limit will expire (format: YYYY-MM-DDTHH:MM:SSZ)',
  },
  {
    displayName: 'Features',
    name: 'features',
    type: 'fixedCollection',
    typeOptions: {
      multipleValues: true,
    },
    required: false,
    displayOptions: {
      show: {
        resource: ['tenant'],
        operation: ['update'],
      },
    },
    default: {},
    description: 'Updated list of features that need to be enabled or disabled for the tenant',
    options: [
      {
        displayName: 'Feature',
        name: 'feature',
        values: [
          {
            displayName: 'Feature Name',
            name: 'name',
            type: 'options',
            default: '',
            options: [
              { name: 'Enterprise Workloads', value: 'Enterprise Workloads' },
              {
                name: 'Enterprise Workloads Accelerated Ransomware Recovery',
                value: 'Enterprise Workloads Accelerated Ransomware Recovery',
              },
              { name: 'Long Term Retention', value: 'Long Term Retention' },
              { name: 'M365', value: 'M365' },
              { name: 'Google Workspace', value: 'Google Workspace' },
              { name: 'Endpoints', value: 'Endpoints' },
              {
                name: 'M365 Accelerated Ransomware Recovery',
                value: 'M365 Accelerated Ransomware Recovery',
              },
              {
                name: 'Endpoints Accelerated Ransomware Recovery',
                value: 'Endpoints Accelerated Ransomware Recovery',
              },
              {
                name: 'Google Workspace Accelerated Ransomware Recovery',
                value: 'Google Workspace Accelerated Ransomware Recovery',
              },
            ],
            description:
              'Feature to enable. ARR/LTR/Enterprise features are boolean. SaaS/Endpoints features accept numeric attributes.',
          },
          {
            displayName: 'Enabled',
            name: 'isEnabled',
            type: 'boolean',
            default: true,
            description: 'Whether this feature should be enabled (required by API).',
          },
          {
            displayName: 'Attributes',
            name: 'attrs',
            type: 'fixedCollection',
            typeOptions: {
              multipleValues: true,
            },
            default: {},
            description: 'Attributes for the feature (e.g., userCount, preservedUserCount)',
            options: [
              {
                displayName: 'Attribute',
                name: 'attr',
                values: [
                  {
                    displayName: 'Attribute Name',
                    name: 'name',
                    type: 'options',
                    options: [
                      { name: 'userCount', value: 'userCount' },
                      { name: 'preservedUserCount', value: 'preservedUserCount' },
                      { name: 'educationLicenseState', value: 'educationLicenseState' },
                    ],
                    default: 'userCount',
                    description:
                      'Applicable to M365/Google Workspace (all three) and Endpoints (userCount, preservedUserCount).',
                  },
                  {
                    displayName: 'Attribute Value',
                    name: 'value',
                    type: 'number',
                    default: 0,
                    description: 'Value of the attribute',
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  /* -------------------------------------------------------------------------- */
  /*                             tenant:suspend                               */
  /* -------------------------------------------------------------------------- */
  // Suspend uses only the Tenant ID field, already defined above

  /* -------------------------------------------------------------------------- */
  /*                            tenant:unsuspend                              */
  /* -------------------------------------------------------------------------- */
  // Unsuspend uses only the Tenant ID field, already defined above
];
