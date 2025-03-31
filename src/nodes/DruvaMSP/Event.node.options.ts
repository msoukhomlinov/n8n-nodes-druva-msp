import type { INodeProperties } from 'n8n-workflow';

// Define the operations for the Event resource
export const eventOperations: INodeProperties[] = [
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
        name: 'List MSP Events',
        value: 'listMsp',
        action: 'List MSP events',
        description: 'Retrieve all events at the MSP level',
      },
      {
        name: 'List Customer Events',
        value: 'listCustomer',
        action: 'List customer events',
        description: 'Retrieve all events for a specific customer',
      },
    ],
    default: 'listMsp',
  },
];

// Define the fields for the Event resource operations
export const eventFields: INodeProperties[] = [
  /* -------------------------------------------------------------------------- */
  /*                             event:listCustomer                             */
  /* -------------------------------------------------------------------------- */
  {
    displayName: 'Customer ID',
    name: 'customerId',
    type: 'string',
    required: true,
    displayOptions: {
      show: {
        resource: ['event'],
        operation: ['listCustomer'],
      },
    },
    default: '',
    description: 'The unique identifier of the customer whose events to retrieve',
  },

  /* -------------------------------------------------------------------------- */
  /*                        Pagination Controls (both operations)               */
  /* -------------------------------------------------------------------------- */
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['event'],
        operation: ['listMsp', 'listCustomer'],
      },
    },
    default: false,
    description: 'Whether to return all results or only up to a given limit',
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
        resource: ['event'],
        operation: ['listMsp', 'listCustomer'],
        returnAll: [false],
      },
    },
    default: 50,
    description: 'Max number of results to return',
  },
  // No additional filtering options mentioned in the API documentation
];
