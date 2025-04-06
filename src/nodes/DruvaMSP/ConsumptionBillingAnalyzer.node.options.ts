import type { INodeProperties } from 'n8n-workflow';

// Define the operations for the Consumption Billing Analyzer resource
export const consumptionBillingAnalyzerOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['consumptionBillingAnalyzer'],
      },
    },
    options: [
      {
        name: 'Analyze Consumption for Billing',
        value: 'analyzeConsumption',
        action: 'Analyze consumption for billing',
        description:
          'Process consumption data with custom calculation methods for billing purposes',
      },
    ],
    default: 'analyzeConsumption',
  },
];

// Define the fields for the Consumption Billing Analyzer resource operations
export const consumptionBillingAnalyzerFields: INodeProperties[] = [
  /* -------------------------------------------------------------------------- */
  /*                             Date Selection Fields                          */
  /* -------------------------------------------------------------------------- */
  {
    displayName: 'Date Selection Method',
    name: 'dateSelectionMethod',
    type: 'options',
    options: [
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
    description: 'Choose whether to use specific dates or relative date ranges',
    displayOptions: {
      show: {
        resource: ['consumptionBillingAnalyzer'],
        operation: ['analyzeConsumption'],
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
        resource: ['consumptionBillingAnalyzer'],
        operation: ['analyzeConsumption'],
        dateSelectionMethod: ['specificDates'],
      },
    },
    default: '',
    description: 'Start date for the billing period',
  },
  {
    displayName: 'End Date',
    name: 'endDate',
    type: 'dateTime',
    required: true,
    displayOptions: {
      show: {
        resource: ['consumptionBillingAnalyzer'],
        operation: ['analyzeConsumption'],
        dateSelectionMethod: ['specificDates'],
      },
    },
    default: '',
    description: 'End date for the billing period',
  },
  {
    displayName: 'Date Range',
    name: 'relativeDateRange',
    type: 'options',
    displayOptions: {
      show: {
        resource: ['consumptionBillingAnalyzer'],
        operation: ['analyzeConsumption'],
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
    default: 'previousMonth',
    required: true,
    description: 'Select a predefined date range for billing period analysis',
  },

  /* -------------------------------------------------------------------------- */
  /*                        Customer Selection Fields                           */
  /* -------------------------------------------------------------------------- */
  {
    displayName: 'Filter by Customers',
    name: 'filterByCustomers',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['consumptionBillingAnalyzer'],
        operation: ['analyzeConsumption'],
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
        resource: ['consumptionBillingAnalyzer'],
        operation: ['analyzeConsumption'],
        filterByCustomers: [true],
      },
    },
    default: [],
    required: true,
    description: 'List of customer IDs to include in the analysis',
  },

  /* -------------------------------------------------------------------------- */
  /*                        Calculation Method Fields                           */
  /* -------------------------------------------------------------------------- */
  {
    displayName: 'Calculation Method',
    name: 'calculationMethod',
    type: 'options',
    options: [
      {
        name: 'Average (Total Usage ÷ Period Length)',
        value: 'average',
        description: 'Calculate average usage across the entire period',
      },
      {
        name: 'High Water Mark (Highest Daily Value)',
        value: 'highWaterMark',
        description: 'Use the highest daily usage value in the period',
      },
    ],
    default: 'average',
    description: 'Method to calculate billable values from daily consumption data',
    displayOptions: {
      show: {
        resource: ['consumptionBillingAnalyzer'],
        operation: ['analyzeConsumption'],
      },
    },
  },

  /* -------------------------------------------------------------------------- */
  /*                            Rounding Option Fields                          */
  /* -------------------------------------------------------------------------- */
  {
    displayName: 'Apply Rounding',
    name: 'applyRounding',
    type: 'boolean',
    default: true,
    description: 'Whether to apply rounding to the calculated values',
    displayOptions: {
      show: {
        resource: ['consumptionBillingAnalyzer'],
        operation: ['analyzeConsumption'],
      },
    },
  },
  {
    displayName: 'Rounding Direction',
    name: 'roundingDirection',
    type: 'options',
    options: [
      {
        name: 'Round Up',
        value: 'up',
        description: 'Round up to the specified decimal places',
      },
      {
        name: 'Round Down',
        value: 'down',
        description: 'Round down to the specified decimal places',
      },
    ],
    default: 'up',
    description: 'Direction for rounding calculated values',
    displayOptions: {
      show: {
        resource: ['consumptionBillingAnalyzer'],
        operation: ['analyzeConsumption'],
        applyRounding: [true],
      },
    },
  },
  {
    displayName: 'Decimal Places',
    name: 'decimalPlaces',
    type: 'options',
    options: [
      { name: '0 (Whole Numbers)', value: 0 },
      { name: '1 (Tenths)', value: 1 },
      { name: '2 (Hundredths)', value: 2 },
      { name: '3 (Thousandths)', value: 3 },
    ],
    default: 1,
    description: 'Number of decimal places to round to',
    displayOptions: {
      show: {
        resource: ['consumptionBillingAnalyzer'],
        operation: ['analyzeConsumption'],
        applyRounding: [true],
      },
    },
  },

  /* -------------------------------------------------------------------------- */
  /*                            Zero Usage Field                                */
  /* -------------------------------------------------------------------------- */
  {
    displayName: 'Filter Out Zero Usage',
    name: 'filterOutZeroUsage',
    type: 'boolean',
    default: true,
    description: 'Whether to filter out items where both usage amount and CU consumed are zero',
    displayOptions: {
      show: {
        resource: ['consumptionBillingAnalyzer'],
        operation: ['analyzeConsumption'],
      },
    },
  },

  /* -------------------------------------------------------------------------- */
  /*                        Byte Conversion Fields                              */
  /* -------------------------------------------------------------------------- */
  {
    displayName: 'Convert Byte Values',
    name: 'convertByteValues',
    type: 'boolean',
    default: true,
    description: 'Whether to convert raw byte values to a larger unit (GB or TB)',
    displayOptions: {
      show: {
        resource: ['consumptionBillingAnalyzer'],
        operation: ['analyzeConsumption'],
      },
    },
  },
  {
    displayName: 'Target Unit',
    name: 'byteConversionUnit',
    type: 'options',
    options: [
      {
        name: 'Gigabytes (GB)',
        value: 'GB',
        description: 'Convert byte values to gigabytes',
      },
      {
        name: 'Terabytes (TB)',
        value: 'TB',
        description: 'Convert byte values to terabytes',
      },
    ],
    default: 'TB',
    description: 'Unit to convert byte values to',
    displayOptions: {
      show: {
        resource: ['consumptionBillingAnalyzer'],
        operation: ['analyzeConsumption'],
        convertByteValues: [true],
      },
    },
  },
];
