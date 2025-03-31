import type { INodeProperties } from 'n8n-workflow';

// Define the operations for the Admin resource
export const adminOperations: INodeProperties[] = [
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
        name: 'Get Many',
        value: 'getMany',
        action: 'Get many administrators',
        description: 'Retrieve a list of all administrators',
      },
    ],
    default: 'getMany',
  },
];

// Define the fields for the Admin operations
export const adminFields: INodeProperties[] = [
  /* -------------------------------------------------------------------------- */
  /*                                admin:getMany                               */
  /* -------------------------------------------------------------------------- */
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['admin'],
        operation: ['getMany'],
      },
    },
    default: false,
    description: 'Whether to return all results or only up to a given limit',
  },
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
    displayOptions: {
      show: {
        resource: ['admin'],
        operation: ['getMany'],
        returnAll: [false],
      },
    },
    typeOptions: {
      minValue: 1,
    },
    default: 50,
    description: 'Max number of results to return',
  },
  {
    displayName: 'Filter By',
    name: 'filters',
    type: 'collection',
    placeholder: 'Add Filter',
    default: {},
    displayOptions: {
      show: {
        resource: ['admin'],
        operation: ['getMany'],
      },
    },
    options: [
      {
        displayName: 'Email',
        name: 'email',
        type: 'string',
        default: '',
        description: 'Filter administrators by email address',
      },
      {
        displayName: 'Role',
        name: 'role',
        type: 'multiOptions',
        typeOptions: {
          loadOptionsMethod: 'getAdminRoles',
        },
        default: [],
        description: 'Filter administrators by their role',
      },
    ],
  },
];
