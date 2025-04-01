import type { INodeProperties } from 'n8n-workflow';

// Define the operations for the Customer resource
export const customerOperations: INodeProperties[] = [
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
        name: 'Create',
        value: 'create',
        action: 'Create a new customer',
        description: 'Create a new MSP customer account',
      },
      {
        name: 'Get',
        value: 'get',
        action: 'Get a customer by ID',
        description: 'Retrieve details for a specific customer',
      },
      {
        name: 'Get Many',
        value: 'getMany',
        action: 'Get many customers',
        description: 'Retrieve a list of customers',
      },
      {
        name: 'Get Token',
        value: 'getToken',
        action: 'Get a customer API token',
        description: 'Generate a customer-specific API token',
      },
      {
        name: 'Update',
        value: 'update',
        action: 'Update a customer',
        description: 'Update details of an existing customer',
      },
    ],
    default: 'list', // Default to a common read operation
  },
];

// Define the fields for each Customer operation
// We will use displayOptions to show fields based on the selected operation
export const customerFields: INodeProperties[] = [
  /* -------------------------------------------------------------------------- */
  /*                                customer:create                             */
  /* -------------------------------------------------------------------------- */
  {
    displayName: 'Customer Name',
    name: 'customerName',
    type: 'string',
    required: true,
    default: '',
    displayOptions: {
      show: {
        resource: ['customer'],
        operation: ['create'],
      },
    },
    description: 'Name of the customer organisation',
  },
  /* -------------------------------------------------------------------------- */
  /*                                customer:update                             */
  /* -------------------------------------------------------------------------- */
  {
    displayName: 'Customer ID',
    name: 'customerId',
    type: 'string',
    required: true,
    default: '',
    displayOptions: {
      show: {
        resource: ['customer'],
        operation: ['update'],
      },
    },
    description: 'The unique ID of the customer to update',
  },
  {
    displayName: 'Customer Name',
    name: 'customerName',
    type: 'string',
    required: true,
    default: '',
    displayOptions: {
      show: {
        resource: ['customer'],
        operation: ['update'],
      },
    },
    description: 'Name of the customer organization',
  },
  {
    displayName: 'Phone Number',
    name: 'phoneNumber',
    type: 'string',
    required: true,
    default: '',
    displayOptions: {
      show: {
        resource: ['customer'],
        operation: ['update'],
      },
    },
    description: 'Contact phone number for the customer (e.g., +1-XXX-XXX-XXXX)',
  },
  {
    displayName: 'Address',
    name: 'address',
    type: 'string',
    required: true,
    default: '',
    placeholder: 'e.g. 123 Main St, San Francisco, CA, USA 94105',
    displayOptions: {
      show: {
        resource: ['customer'],
        operation: ['update'],
      },
    },
    description:
      "Customer's physical address as a single string (e.g., street, city, state, country, postal code)",
  },
  {
    displayName: 'Tenant Admins',
    name: 'tenantAdmins',
    type: 'multiOptions',
    typeOptions: {
      loadOptionsMethod: 'getAdmins',
      loadOptionsDependsOn: [],
    },
    default: [],
    noDataExpression: true,
    description:
      "Specify the unique IDs of tenant administrators who should manage the tenant for the customer. Get the list of tenant administrators IDs using the 'List all administrators' API. If you want to remove a tenant administrator from this customer, simply do not select that administrator. If no tenant admins are selected, all tenant admins will be removed from this customer.",
    displayOptions: {
      show: {
        resource: ['customer'],
        operation: ['update'],
      },
    },
  },
  {
    displayName: 'Update Features',
    name: 'updateFeatures',
    type: 'boolean',
    default: false,
    displayOptions: {
      show: {
        resource: ['customer'],
        operation: ['update'],
      },
    },
    description: 'Whether to update the customer features',
  },
  {
    displayName: 'Security Posture and Observability',
    name: 'securityPostureAndObservability',
    type: 'boolean',
    default: false,
    displayOptions: {
      show: {
        resource: ['customer'],
        operation: ['update'],
        updateFeatures: [true],
      },
    },
    description:
      'Whether to enable the Security Posture and Observability feature for this customer',
  },
  {
    displayName: 'Hide Customer Name from Druva',
    name: 'hideDruvaCustomerName',
    type: 'boolean',
    default: false,
    displayOptions: {
      show: {
        resource: ['customer'],
        operation: ['create'],
      },
    },
    description:
      "Whether to keep the real customer name private from Druva's internal systems by using a different internal name",
  },
  {
    displayName: 'Alternative Name for Druva Systems',
    name: 'accountName',
    type: 'string',
    required: true,
    default: '',
    displayOptions: {
      show: {
        resource: ['customer'],
        operation: ['create'],
        hideDruvaCustomerName: [true],
      },
    },
    description:
      "The alternative name that will be shown in Druva's internal systems instead of the real customer name",
    hint: "This is the name that will appear in Druva's internal systems. Once entered, it cannot be changed after creation",
  },
  {
    displayName: 'Phone Number',
    name: 'phoneNumber',
    type: 'string',
    required: true,
    default: '',
    displayOptions: {
      show: {
        resource: ['customer'],
        operation: ['create'],
      },
    },
    description: 'Contact phone number for the customer (e.g., +1-XXX-XXX-XXXX)',
  },
  {
    displayName: 'Address',
    name: 'address',
    type: 'string',
    required: true,
    default: '',
    placeholder: 'e.g. 123 Main St, San Francisco, CA, USA 94105',
    displayOptions: {
      show: {
        resource: ['customer'],
        operation: ['create'],
      },
    },
    description:
      "Customer's physical address as a single string (e.g., street, city, state, country, postal code)",
  },
  {
    displayName: 'Tenant Admins',
    name: 'tenantAdmins',
    type: 'multiOptions',
    typeOptions: {
      loadOptionsMethod: 'getAdmins',
      loadOptionsDependsOn: [],
    },
    default: [],
    noDataExpression: true,
    description: 'IDs of tenant administrators who should manage the tenant for the customer',
    displayOptions: {
      show: {
        resource: ['customer'],
        operation: ['create'],
      },
    },
  },
  /* -------------------------------------------------------------------------- */
  /*                                customer:get                                */
  /* -------------------------------------------------------------------------- */
  {
    displayName: 'Customer ID',
    name: 'customerId',
    type: 'options',
    typeOptions: {
      loadOptionsMethod: 'getCustomers',
    },
    required: true,
    default: '',
    displayOptions: {
      show: {
        resource: ['customer'],
        operation: ['get', 'getToken'],
      },
    },
    description: 'The unique ID of the customer to perform the operation on',
  },
  /* -------------------------------------------------------------------------- */
  /*                                customer:list                               */
  /* -------------------------------------------------------------------------- */
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['customer'],
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
        resource: ['customer'],
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
    displayName: 'Filter Results',
    name: 'filterResults',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['customer'],
        operation: ['getMany'],
      },
    },
    default: false,
    description: 'Whether to filter the results after retrieval',
  },
  {
    displayName: 'Filters',
    name: 'filters',
    type: 'fixedCollection',
    displayOptions: {
      show: {
        resource: ['customer'],
        operation: ['getMany'],
        filterResults: [true],
      },
    },
    typeOptions: {
      multipleValues: true,
      sortable: true,
    },
    placeholder: 'Add Filter',
    default: {},
    options: [
      {
        name: 'filter',
        displayName: 'Filter',
        values: [
          {
            displayName: 'Field',
            name: 'field',
            type: 'options',
            default: 'customerName',
            options: [
              {
                name: 'Customer Name',
                value: 'customerName',
              },
              {
                name: 'Account Name',
                value: 'accountName',
              },
            ],
            description: 'Field to filter by',
          },
          {
            displayName: 'Operator',
            name: 'operator',
            type: 'options',
            default: 'contains',
            options: [
              {
                name: 'Contains',
                value: 'contains',
              },
              {
                name: 'Not Contains',
                value: 'notContains',
              },
              {
                name: 'Equals',
                value: 'equals',
              },
              {
                name: 'Not Equals',
                value: 'notEquals',
              },
              {
                name: 'Starts With',
                value: 'startsWith',
              },
              {
                name: 'Ends With',
                value: 'endsWith',
              },
            ],
            description: 'Filter operator to use',
          },
          {
            displayName: 'Value',
            name: 'value',
            type: 'string',
            default: '',
            description: 'Value to compare against',
          },
        ],
      },
    ],
    description: 'Define filters to apply to results',
  },
  /* -------------------------------------------------------------------------- */
  /*                                customer:getToken                           */
  /* -------------------------------------------------------------------------- */
  // Fields for the 'Get Token' operation will go here...
  // Need Customer ID (defined above)
  // Need other parameters if required by the API
];
