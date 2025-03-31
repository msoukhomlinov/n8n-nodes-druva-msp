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
        name: 'List',
        value: 'list',
        action: 'List tenants',
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
    default: 'list',
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
      'JSON array specifying the products and their attributes to be assigned to the tenant. Refer to documentation for product and attribute IDs.',
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
  /*                                 tenant:list                                */
  /* -------------------------------------------------------------------------- */
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['tenant'],
        operation: ['list'],
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
        operation: ['list'],
        returnAll: [false],
      },
    },
    default: 50,
    description: 'Max number of results to return.',
  },
  {
    displayName: 'Filters',
    name: 'filters',
    type: 'fixedCollection',
    displayOptions: {
      show: {
        resource: ['tenant'],
        operation: ['list'],
      },
    },
    placeholder: 'Add Filter',
    default: {},
    typeOptions: {
      multipleValues: false,
    },
    options: [
      {
        name: 'filterFields',
        displayName: 'Filter Fields',
        values: [
          {
            displayName: 'Customer ID',
            name: 'customerId',
            type: 'string',
            default: '',
            description: 'Filter tenants by customer ID.',
          },
          {
            displayName: 'Tenant Status',
            name: 'tenantStatus',
            type: 'options',
            default: 'Active',
            options: [
              { name: 'Active', value: 'Active' },
              { name: 'Suspended', value: 'Suspended' },
              { name: 'Pending', value: 'Pending' },
              { name: 'Failed', value: 'Failed' },
              { name: 'Deleted', value: 'Deleted' },
            ],
            description: 'Filter tenants by status.',
          },
        ],
      },
    ],
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
    placeholder: 'Update Address',
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
