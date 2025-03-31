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
        name: 'List',
        value: 'list',
        action: 'List service plans',
      },
    ],
    default: 'list',
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
  /*                             servicePlan:list                               */
  /* -------------------------------------------------------------------------- */
  // List operation uses query parameters, not fields in the UI directly for filtering
  // It supports pagination via pageSize and pageToken in the query string handled by generic functions
  // Add options for pagination control if needed, similar to other list operations
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['servicePlan'],
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
        resource: ['servicePlan'],
        operation: ['list'],
        returnAll: [false],
      },
    },
    default: 50,
    description: 'Max number of results to return.',
  },
  // No specific filter fields are listed in the docs for list service plans, assuming only pagination is supported.
];
