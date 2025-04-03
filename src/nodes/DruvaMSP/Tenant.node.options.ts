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
        operation: ['get', 'suspend', 'unsuspend'],
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
  /*                             tenant:suspend                               */
  /* -------------------------------------------------------------------------- */
  // Suspend uses only the Tenant ID field, already defined above

  /* -------------------------------------------------------------------------- */
  /*                            tenant:unsuspend                              */
  /* -------------------------------------------------------------------------- */
  // Unsuspend uses only the Tenant ID field, already defined above
];
