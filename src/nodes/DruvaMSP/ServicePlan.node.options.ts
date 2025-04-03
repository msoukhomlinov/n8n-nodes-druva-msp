import type { INodeProperties } from 'n8n-workflow';

// Define the operations for the Service Plan resource
export const servicePlanOperations: INodeProperties[] = [
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
        name: 'Get',
        value: 'get',
        action: 'Get a service plan by ID',
      },
      {
        name: 'Get Many',
        value: 'getMany',
        action: 'Get many service plans',
      },
    ],
    default: 'getMany',
  },
];

// Define the fields for the Service Plan resource operations
export const servicePlanFields: INodeProperties[] = [
  /* -------------------------------------------------------------------------- */
  /*                              servicePlan:get                               */
  /* -------------------------------------------------------------------------- */
  {
    displayName: 'Service Plan ID',
    name: 'servicePlanId',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['servicePlan'],
        operation: ['get'],
      },
    },
    default: '',
    description: 'Unique identifier of the service plan.',
  },

  /* -------------------------------------------------------------------------- */
  /*                           servicePlan:getMany                              */
  /* -------------------------------------------------------------------------- */
  // Get Many operation uses query parameters, not fields in the UI directly for filtering
  // It supports pagination via pageSize and pageToken in the query string handled by generic functions
  // Add options for pagination control if needed, similar to other get many operations
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['servicePlan'],
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
        resource: ['servicePlan'],
        operation: ['getMany'],
        returnAll: [false],
      },
    },
    default: 50,
    description: 'Max number of results to return.',
  },

  // Add post-API filtering options
  {
    displayName: 'Filter by Edition',
    name: 'filterByEdition',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['servicePlan'],
        operation: ['getMany'],
      },
    },
    default: false,
    description: 'Whether to filter service plans by edition (Business, Enterprise, Elite)',
  },
  {
    displayName: 'Editions',
    name: 'editions',
    type: 'multiOptions',
    typeOptions: {
      loadOptionsMethod: 'getServicePlanEditionOptions',
    },
    displayOptions: {
      show: {
        resource: ['servicePlan'],
        operation: ['getMany'],
        filterByEdition: [true],
      },
    },
    default: [],
    description: 'The editions to filter by',
  },

  {
    displayName: 'Filter by Feature',
    name: 'filterByFeature',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['servicePlan'],
        operation: ['getMany'],
      },
    },
    default: false,
    description: 'Whether to filter service plans by available features',
  },
  {
    displayName: 'Features',
    name: 'features',
    type: 'multiOptions',
    typeOptions: {
      loadOptionsMethod: 'getServicePlanFeatureOptions',
    },
    displayOptions: {
      show: {
        resource: ['servicePlan'],
        operation: ['getMany'],
        filterByFeature: [true],
      },
    },
    default: [],
    description: 'The features to filter by',
  },

  {
    displayName: 'Filter by Name',
    name: 'filterByName',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['servicePlan'],
        operation: ['getMany'],
      },
    },
    default: false,
    description: 'Whether to filter service plans by name',
  },
  {
    displayName: 'Name Contains',
    name: 'nameContains',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['servicePlan'],
        operation: ['getMany'],
        filterByName: [true],
      },
    },
    default: '',
    description: 'Filter service plans whose name contains this text (case-insensitive)',
  },

  {
    displayName: 'Filter by Status',
    name: 'filterByStatus',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['servicePlan'],
        operation: ['getMany'],
      },
    },
    default: false,
    description: 'Whether to filter service plans by status',
  },
  {
    displayName: 'Status',
    name: 'status',
    type: 'options',
    typeOptions: {
      loadOptionsMethod: 'getServicePlanStatusOptions',
    },
    displayOptions: {
      show: {
        resource: ['servicePlan'],
        operation: ['getMany'],
        filterByStatus: [true],
      },
    },
    default: 1,
    description: 'The status to filter by',
  },

  // No specific filter fields are listed in the docs for get many service plans, assuming only pagination is supported.
];
