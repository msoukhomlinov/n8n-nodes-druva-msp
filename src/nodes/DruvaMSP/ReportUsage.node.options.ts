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
        name: 'Get Global Usage Report',
        value: 'getGlobalReport',
        action: 'Get global usage report across all customers',
        description: 'Retrieve consumption unit usage data for all customers',
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
    default: 'getGlobalReport',
  },
];

// Define the fields for the Report - Usage resource operations
export const reportUsageFields: INodeProperties[] = [
  /* -------------------------------------------------------------------------- */
  /*                Common Fields (used across multiple operations)             */
  /* -------------------------------------------------------------------------- */
  {
    displayName: 'Date Selection Method',
    name: 'dateSelectionMethod',
    type: 'options',
    options: [
      {
        name: 'All Dates',
        value: 'allDates',
      },
      {
        name: 'Specific Dates',
        value: 'specificDates',
      },
      {
        name: 'Relative Date Range',
        value: 'relativeDates',
      },
    ],
    default: 'relativeDates',
    description:
      'Choose whether to use specific dates, relative date ranges, or include all dates (no date filter)',
    displayOptions: {
      show: {
        resource: ['reportUsage'],
        operation: ['getGlobalReport', 'getItemizedConsumption', 'getItemizedQuota'],
      },
    },
  },
  {
    displayName: 'Start Date',
    name: 'startDate',
    type: 'dateTime',
    required: true,
    displayOptions: {
      show: {
        resource: ['reportUsage'],
        operation: ['getGlobalReport'],
        dateSelectionMethod: ['specificDates'],
      },
    },
    default: '',
    description: 'Start date for the usage report period',
  },
  {
    displayName: 'Start Date',
    name: 'startDate',
    type: 'dateTime',
    required: true,
    displayOptions: {
      show: {
        resource: ['reportUsage'],
        operation: ['getItemizedConsumption', 'getItemizedQuota'],
        dateSelectionMethod: ['specificDates'],
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
        operation: ['getGlobalReport'],
        dateSelectionMethod: ['specificDates'],
      },
    },
    default: '',
    description: 'End date for the usage report period',
  },
  {
    displayName: 'End Date',
    name: 'endDate',
    type: 'dateTime',
    required: true,
    displayOptions: {
      show: {
        resource: ['reportUsage'],
        operation: ['getItemizedConsumption', 'getItemizedQuota'],
        dateSelectionMethod: ['specificDates'],
      },
    },
    default: '',
    description: 'End date for the usage report period',
  },
  {
    displayName: 'Date Range',
    name: 'relativeDateRange',
    type: 'options',
    displayOptions: {
      show: {
        resource: ['reportUsage'],
        operation: ['getGlobalReport', 'getItemizedConsumption', 'getItemizedQuota'],
        dateSelectionMethod: ['relativeDates'],
      },
    },
    options: [
      { name: 'Current Month', value: 'currentMonth' },
      { name: 'Previous Month', value: 'previousMonth' },
      { name: 'Current Quarter', value: 'currentQuarter' },
      { name: 'Previous Quarter', value: 'previousQuarter' },
      { name: 'Current Year', value: 'currentYear' },
      { name: 'Previous Year', value: 'previousYear' },
      { name: 'Last 30 Days', value: 'last30Days' },
      { name: 'Last 60 Days', value: 'last60Days' },
      { name: 'Last 90 Days', value: 'last90Days' },
      { name: 'Last 6 Months', value: 'last6Months' },
      { name: 'Last 12 Months', value: 'last12Months' },
      { name: 'Year To Date', value: 'yearToDate' },
    ],
    default: 'currentMonth',
    required: true,
    description: 'Select a predefined date range for billing period analysis',
  },

  /* -------------------------------------------------------------------------- */
  /*                        Filtering Options                                   */
  /* -------------------------------------------------------------------------- */

  // Customer Filtering (Keep at top)
  {
    displayName: 'Filter by Customers',
    name: 'filterByCustomers',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['reportUsage'],
        operation: ['getItemizedConsumption', 'getItemizedQuota'],
      },
    },
    default: false,
    description: 'Whether to filter results by specific customer IDs',
  },
  {
    displayName: 'Customer IDs',
    name: 'customerIds',
    type: 'multiOptions',
    typeOptions: {
      loadOptionsMethod: 'getCustomers',
    },
    displayOptions: {
      show: {
        resource: ['reportUsage'],
        operation: ['getItemizedConsumption', 'getItemizedQuota'],
        filterByCustomers: [true],
      },
    },
    default: [],
    required: true,
    description: 'List of customer IDs to include in the report',
  },

  // Edition Name Filtering
  {
    displayName: 'Filter by Edition Names',
    name: 'filterByEditionNames',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['reportUsage'],
        operation: ['getItemizedConsumption', 'getItemizedQuota'],
      },
    },
    default: false,
    description: 'Whether to filter results by specific edition names',
  },
  {
    displayName: 'Edition Names',
    name: 'editionNames',
    type: 'multiOptions',
    options: [
      { name: 'Business', value: 'Business' },
      { name: 'Enterprise', value: 'Enterprise' },
      { name: 'Elite', value: 'Elite' },
    ],
    displayOptions: {
      show: {
        resource: ['reportUsage'],
        operation: ['getItemizedConsumption', 'getItemizedQuota'],
        filterByEditionNames: [true],
      },
    },
    default: [],
    required: true,
    description: 'List of edition names to include in the report',
  },

  // Product Filtering
  {
    displayName: 'Filter by Products',
    name: 'filterByProducts',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['reportUsage'],
        operation: ['getItemizedConsumption', 'getItemizedQuota'],
      },
    },
    default: false,
    description: 'Whether to filter results by specific product IDs',
  },
  {
    displayName: 'Product IDs',
    name: 'productIds',
    type: 'multiOptions',
    typeOptions: {
      loadOptionsMethod: 'getProductIds',
    },
    displayOptions: {
      show: {
        resource: ['reportUsage'],
        operation: ['getItemizedConsumption', 'getItemizedQuota'],
        filterByProducts: [true],
      },
    },
    default: [],
    required: true,
    description: 'List of product IDs to include in the report',
  },

  // Product Module Filtering
  {
    displayName: 'Filter by Product Modules',
    name: 'filterByProductModules',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['reportUsage'],
        operation: ['getItemizedConsumption', 'getItemizedQuota'],
      },
    },
    default: false,
    description: 'Whether to filter results by specific product module IDs',
  },
  {
    displayName: 'Product Module IDs',
    name: 'productModuleIds',
    type: 'multiOptions',
    typeOptions: {
      loadOptionsMethod: 'getProductModuleIds',
    },
    displayOptions: {
      show: {
        resource: ['reportUsage'],
        operation: ['getItemizedConsumption', 'getItemizedQuota'],
        filterByProductModules: [true],
      },
    },
    default: [],
    required: true,
    description: 'List of product module IDs to include in the report',
  },

  // Usage Description Filtering
  {
    displayName: 'Filter by Usage Descriptions',
    name: 'filterByUsageDescriptions',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['reportUsage'],
        operation: ['getItemizedConsumption', 'getItemizedQuota'],
      },
    },
    default: false,
    description: 'Whether to filter results by specific usage descriptions',
  },
  {
    displayName: 'Usage Descriptions',
    name: 'usageDescriptions',
    type: 'multiOptions',
    options: [
      { name: 'Accelerated Ransomware Recovery', value: 'Accelerated Ransomware Recovery' },
      { name: 'Active Users', value: 'Active Users' },
      { name: 'Cloud Storage', value: 'Cloud Storage' },
      {
        name: 'Early Delete Long Term Retention Storage',
        value: 'Early Delete Long Term Retention Storage',
      },
      { name: 'Long Term Retention Storage', value: 'Long Term Retention Storage' },
      { name: 'Preserved Users', value: 'Preserved Users' },
      { name: 'Security Posture & Observability', value: 'Security Posture & Observability' },
      { name: 'Sensitive Data Governance', value: 'Sensitive Data Governance' },
      { name: 'Unlimited Storage', value: 'Unlimited Storage' },
    ],
    displayOptions: {
      show: {
        resource: ['reportUsage'],
        operation: ['getItemizedConsumption', 'getItemizedQuota'],
        filterByUsageDescriptions: [true],
      },
    },
    default: [],
    required: true,
    description: 'List of usage descriptions to include in the report',
  },

  /* -------------------------------------------------------------------------- */
  /*                        Pagination Controls (paginated operations)          */
  /* -------------------------------------------------------------------------- */
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['reportUsage'],
        operation: ['getGlobalReport', 'getItemizedConsumption', 'getItemizedQuota'],
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
        operation: ['getGlobalReport', 'getItemizedConsumption', 'getItemizedQuota'],
        returnAll: [false],
      },
    },
    default: 50,
    description: 'Max number of results to return',
  },
];
