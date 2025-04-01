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
        action: 'Create a tenant',
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
        name: 'Suspend',
        value: 'suspend',
        action: 'Suspend a tenant by ID',
      },
      {
        name: 'Unsuspend',
        value: 'unsuspend',
        action: 'Unsuspend a tenant by ID',
      },
      {
        name: 'Update',
        value: 'update',
        action: 'Update a tenant by ID',
      },
    ],
    default: 'getMany',
  },
];

// Define the fields for the Tenant resource operations
export const tenantFields: INodeProperties[] = [
  /* -------------------------------------------------------------------------- */
  /*                                tenant:create                               */
  /* -------------------------------------------------------------------------- */
  {
    displayName: 'Customer ID',
    name: 'customerId',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['tenant'],
        operation: ['create'],
      },
    },
    default: '',
    description: 'Unique identifier of the customer under which the tenant will be created.',
  },
  {
    displayName: 'Tenant Name',
    name: 'tenantName',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['tenant'],
        operation: ['create'],
      },
    },
    default: '',
    description: 'Name of the tenant to be created.',
  },
  {
    displayName: 'Service Plan ID',
    name: 'servicePlanId',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['tenant'],
        operation: ['create'],
      },
    },
    default: '',
    description: 'Unique identifier of the service plan to be assigned to the tenant.',
  },
  {
    displayName: 'Products',
    name: 'products',
    type: 'json',
    required: true,
    displayOptions: {
      show: {
        resource: ['tenant'],
        operation: ['create'],
      },
    },
    default:
      '[{\n  "productId": 1,\n  "attributes": [\n    {\n      "attributeId": 1,\n      "attributeValue": 1\n    }\n  ]\n}]',
    typeOptions: {
      alwaysOpenEditWindow: true,
    },
    description:
      'JSON array specifying the products and their attributes to be assigned to the tenant. ProductId: 1 = Hybrid Workloads, 2 = SaaS Apps and Endpoints',
  },
  {
    displayName: 'Storage Regions',
    name: 'storageRegions',
    type: 'json',
    required: true,
    displayOptions: {
      show: {
        resource: ['tenant'],
        operation: ['create'],
      },
    },
    default: '[{\n  "storageRegionId": "1",\n  "isPrimary": true\n}]',
    typeOptions: {
      alwaysOpenEditWindow: true,
    },
    description:
      'JSON array specifying the storage region details for the tenant. At least one primary region is required.',
  },
  {
    displayName: 'Account Information',
    name: 'accountInfo',
    type: 'fixedCollection',
    displayOptions: {
      show: {
        resource: ['tenant'],
        operation: ['create'],
      },
    },
    placeholder: 'Add Account Info',
    default: {},
    typeOptions: {
      multipleValues: false,
    },
    options: [
      {
        name: 'accountInfoFields',
        displayName: 'Account Information Fields',
        values: [
          {
            displayName: 'Admin First Name',
            name: 'firstName',
            type: 'string',
            required: true,
            default: '',
          },
          {
            displayName: 'Admin Last Name',
            name: 'lastName',
            type: 'string',
            required: true,
            default: '',
          },
          {
            displayName: 'Admin Email',
            name: 'email',
            type: 'string',
            required: true,
            default: '',
            description: 'Email address of the tenant administrator.',
          },
          {
            displayName: 'Contact Number',
            name: 'contactNumber',
            type: 'string',
            required: true,
            default: '',
          },
          {
            displayName: 'Additional Emails',
            name: 'additionalEmails',
            type: 'string',
            required: false,
            default: '',
            description: 'Comma-separated list of additional email addresses.',
          },
          {
            displayName: 'Designation',
            name: 'designation',
            type: 'string',
            required: false,
            default: '',
          },
        ],
      },
    ],
  },
  {
    displayName: 'Address Details',
    name: 'address',
    type: 'fixedCollection',
    displayOptions: {
      show: {
        resource: ['tenant'],
        operation: ['create'],
      },
    },
    placeholder: 'Add Address',
    default: {},
    typeOptions: {
      multipleValues: false,
    },
    options: [
      {
        name: 'addressFields',
        displayName: 'Address Fields',
        values: [
          {
            displayName: 'Street',
            name: 'street',
            type: 'string',
            required: true,
            default: '',
          },
          {
            displayName: 'City',
            name: 'city',
            type: 'string',
            required: true,
            default: '',
          },
          {
            displayName: 'State',
            name: 'state',
            type: 'string',
            required: true,
            default: '',
          },
          {
            displayName: 'Country',
            name: 'country',
            type: 'string',
            required: true,
            default: '',
          },
          {
            displayName: 'Postal Code',
            name: 'postalCode',
            type: 'string',
            required: true,
            default: '',
          },
        ],
      },
    ],
  },

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
    default: 1, // 'Ready' status
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
    default: 3, // 'Commercial' type
    description: 'Type of tenant to filter by',
  },

  /* -------------------------------------------------------------------------- */
  /*                                tenant:update                               */
  /* -------------------------------------------------------------------------- */
  // Note: Update uses the same Tenant ID field as Get/Suspend/Unsuspend
  {
    displayName: 'Tenant Name',
    name: 'tenantName',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['tenant'],
        operation: ['update'],
      },
    },
    default: '',
    description: 'New name for the tenant.',
  },
  {
    displayName: 'Address Details',
    name: 'address',
    type: 'fixedCollection',
    displayOptions: {
      show: {
        resource: ['tenant'],
        operation: ['update'],
      },
    },
    placeholder: 'Add Address',
    default: {},
    typeOptions: {
      multipleValues: false,
    },
    options: [
      {
        name: 'addressFields',
        displayName: 'Address Fields',
        values: [
          {
            displayName: 'Street',
            name: 'street',
            type: 'string',
            required: true,
            default: '',
          },
          {
            displayName: 'City',
            name: 'city',
            type: 'string',
            required: true,
            default: '',
          },
          {
            displayName: 'State',
            name: 'state',
            type: 'string',
            required: true,
            default: '',
          },
          {
            displayName: 'Country',
            name: 'country',
            type: 'string',
            required: true,
            default: '',
          },
          {
            displayName: 'Postal Code',
            name: 'postalCode',
            type: 'string',
            required: true,
            default: '',
          },
        ],
      },
    ],
  },

  /* -------------------------------------------------------------------------- */
  /*                             tenant:suspend                               */
  /* -------------------------------------------------------------------------- */
  // Suspend uses only the Tenant ID field, already defined for Get/Update

  /* -------------------------------------------------------------------------- */
  /*                            tenant:unsuspend                              */
  /* -------------------------------------------------------------------------- */
  // Unsuspend uses only the Tenant ID field, already defined for Get/Update
];
