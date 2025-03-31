import type { INodeProperties } from 'n8n-workflow';

// Define the operations for the Report - Usage resource
export const reportUsageOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['reportUsage'],
      },
    },
    options: [
      {
        name: 'Get Global Usage Summary',
        value: 'getGlobalSummary',
        action: 'Get global usage summary across all customers',
        description: 'Retrieve consumption unit usage data for all or specified customers',
      },
      {
        name: 'Get Itemized Tenant Consumption',
        value: 'getItemizedConsumption',
        action: 'Get itemized tenant consumption',
        description: 'Retrieve detailed daily consumption unit usage by tenant',
      },
      {
        name: 'Get Itemized Tenant Quota',
        value: 'getItemizedQuota',
        action: 'Get itemized tenant quota',
        description: 'Retrieve detailed daily quota allocation and usage by tenant',
      },
    ],
    default: 'getGlobalSummary',
  },
];

// Define the fields for the Report - Usage resource operations
export const reportUsageFields: INodeProperties[] = [
  /* -------------------------------------------------------------------------- */
  /*                Common Fields (used across multiple operations)             */
  /* -------------------------------------------------------------------------- */
  {
    displayName: 'Start Date',
    name: 'startDate',
    type: 'dateTime',
    required: true,
    displayOptions: {
      show: {
        resource: ['reportUsage'],
        operation: ['getGlobalSummary', 'getItemizedConsumption', 'getItemizedQuota'],
      },
    },
    default: '',
    description: 'Start date for the usage report period',
  },
  {
    displayName: 'End Date',
    name: 'endDate',
    type: 'dateTime',
    required: true,
    displayOptions: {
      show: {
        resource: ['reportUsage'],
        operation: ['getGlobalSummary', 'getItemizedConsumption', 'getItemizedQuota'],
      },
    },
    default: '',
    description: 'End date for the usage report period',
  },
  {
    displayName: 'Filter by Customers',
    name: 'filterByCustomers',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['reportUsage'],
        operation: ['getGlobalSummary', 'getItemizedConsumption', 'getItemizedQuota'],
      },
    },
    default: false,
    description: 'Whether to filter results by specific customer IDs',
  },
  {
    displayName: 'Customer IDs',
    name: 'customerIds',
    type: 'string',
    typeOptions: {
      multipleValues: true,
      multipleValueButtonText: 'Add Customer ID',
    },
    displayOptions: {
      show: {
        resource: ['reportUsage'],
        operation: ['getGlobalSummary', 'getItemizedConsumption', 'getItemizedQuota'],
        filterByCustomers: [true],
      },
    },
    default: [],
    required: true,
    description: 'List of customer IDs to include in the report',
  },

  /* -------------------------------------------------------------------------- */
  /*                        Pagination Controls (all operations)                */
  /* -------------------------------------------------------------------------- */
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['reportUsage'],
        operation: ['getGlobalSummary', 'getItemizedConsumption', 'getItemizedQuota'],
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
        resource: ['reportUsage'],
        operation: ['getGlobalSummary', 'getItemizedConsumption', 'getItemizedQuota'],
        returnAll: [false],
      },
    },
    default: 50,
    description: 'Max number of results to return',
  },
];
