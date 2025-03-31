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
        name: 'List',
        value: 'list',
        action: 'List customers',
        description: 'Retrieve a list of customers',
      },
      {
        name: 'Update',
        value: 'update',
        action: 'Update a customer',
        description: 'Update details of an existing customer',
      },
      {
        name: 'Get Token',
        value: 'getToken',
        action: 'Get a customer API token',
        description: 'Generate a customer-specific API token',
      },
      {
        name: 'List Admins',
        value: 'listAdmins',
        action: 'List customer administrators',
        description: 'Retrieve a list of administrators for a specific customer',
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
        operation: ['create', 'update'],
      },
    },
    description: 'Name of the customer organization',
  },
  {
    displayName: 'Account Name',
    name: 'accountName',
    type: 'string',
    required: true,
    default: '',
    displayOptions: {
      show: {
        resource: ['customer'],
        operation: ['create'],
      },
    },
    description: 'Account name for the customer (cannot be changed after creation)',
  },
  {
    displayName: 'Admin Email',
    name: 'adminEmail',
    type: 'string',
    required: false,
    default: '',
    displayOptions: {
      show: {
        resource: ['customer'],
        operation: ['create', 'update'],
      },
    },
    description: 'Email address for the primary administrator of the customer account (optional)',
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
        operation: ['create', 'update'],
      },
    },
    description: 'Contact phone number for the customer (e.g., +1-XXX-XXX-XXXX)',
  },
  {
    displayName: 'Address',
    name: 'address',
    type: 'fixedCollection',
    required: true,
    default: {},
    placeholder: 'Add Address',
    typeOptions: {
      multipleValues: false,
    },
    displayOptions: {
      show: {
        resource: ['customer'],
        operation: ['create', 'update'],
      },
    },
    description: "Customer's physical address",
    options: [
      {
        name: 'addressFields',
        displayName: 'Address Details',
        values: [
          {
            displayName: 'Street',
            name: 'street',
            type: 'string',
            required: true,
            default: '',
            description: 'Street address line',
          },
          {
            displayName: 'City',
            name: 'city',
            type: 'string',
            required: true,
            default: '',
            description: 'City name',
          },
          {
            displayName: 'State / Province',
            name: 'state',
            type: 'string',
            required: true,
            default: '',
            description: 'State or province',
          },
          {
            displayName: 'Country',
            name: 'country',
            type: 'string',
            required: true,
            default: '',
            description: 'Country name (e.g., USA, Canada)',
          },
          {
            displayName: 'Postal Code',
            name: 'postalCode',
            type: 'string',
            required: true,
            default: '',
            description: 'Postal or ZIP code',
          },
        ],
      },
    ],
  },
  /* -------------------------------------------------------------------------- */
  /*                                customer:get                                */
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
        operation: ['get', 'update', 'getToken', 'listAdmins'],
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
        operation: ['list'],
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
        operation: ['list'],
        returnAll: [false],
      },
    },
    typeOptions: {
      minValue: 1,
    },
    default: 50,
    description: 'Max number of results to return',
  },
  /* -------------------------------------------------------------------------- */
  /*                                customer:update                             */
  /* -------------------------------------------------------------------------- */
  // Fields for the 'Update' operation will go here...
  // Need Customer ID (defined above)
  // Need fields to update (e.g., name, address - similar to create, but optional)
  /* -------------------------------------------------------------------------- */
  /*                                customer:getToken                           */
  /* -------------------------------------------------------------------------- */
  // Fields for the 'Get Token' operation will go here...
  // Need Customer ID (defined above)
  // Need other parameters if required by the API
  /* -------------------------------------------------------------------------- */
  /*                                customer:listAdmins                         */
  /* -------------------------------------------------------------------------- */
  {
    displayName: 'Return All',
    name: 'returnAllAdmins',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['customer'],
        operation: ['listAdmins'],
      },
    },
    default: false,
    description: 'Whether to return all administrators or only up to a given limit',
  },
  {
    displayName: 'Limit',
    name: 'limitAdmins',
    type: 'number',
    displayOptions: {
      show: {
        resource: ['customer'],
        operation: ['listAdmins'],
        returnAllAdmins: [false],
      },
    },
    typeOptions: {
      minValue: 1,
    },
    default: 50,
    description: 'Max number of administrators to return',
  },
];
