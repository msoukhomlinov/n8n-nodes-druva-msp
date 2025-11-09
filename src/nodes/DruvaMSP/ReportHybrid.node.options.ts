import type { INodeProperties } from 'n8n-workflow';

// Define the operations for the Report - Hybrid Workloads resource
export const reportHybridOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['reportHybrid'],
      },
    },
    options: [
      {
        name: 'Get Alert History Report',
        value: 'getAlertHistoryReport',
        description: 'Retrieve alert history information',
        action: 'Get alert history report',
      },
      {
        name: 'Get Backup Activity Report',
        value: 'getBackupActivityReport',
        description: 'Retrieve backup activity for hybrid workloads',
        action: 'Get backup activity report',
      },
      {
        name: 'Get Consumption by Backup Set Report',
        value: 'getConsumptionByBackupSetReport',
        description: 'Retrieve consumption by backup set data',
        action: 'Get consumption by backup set report',
      },
      {
        name: 'Get DR Failback Activity Report',
        value: 'getDRFailbackActivityReport',
        description: 'Retrieve disaster recovery failback activity',
        action: 'Get DR failback activity report',
      },
      {
        name: 'Get DR Failover Activity Report',
        value: 'getDRFailoverActivityReport',
        description: 'Retrieve disaster recovery failover activity',
        action: 'Get DR failover activity report',
      },
      {
        name: 'Get DR Replication Activity Report',
        value: 'getDRReplicationActivityReport',
        description: 'Retrieve disaster recovery replication activity',
        action: 'Get DR replication activity report',
      },
      {
        name: 'Get M365 Storage Consumption Report',
        value: 'getM365StorageConsumptionReport',
        description: 'Retrieve Microsoft 365 storage consumption details',
        action: 'Get M365 storage consumption report',
      },
      {
        name: 'Get Resource Status Report',
        value: 'getResourceStatusReport',
        description: 'Retrieve resource status information',
        action: 'Get resource status report',
      },
      {
        name: 'Get Storage Consumption by BackupSets Report',
        value: 'getStorageConsumptionByBackupSetsReport',
        description:
          'Retrieve Backup Set wise storage consumption details for individual resources in the organization of MSP customers',
        action: 'Get storage consumption by backup sets report',
      },
    ],
    default: 'getAlertHistoryReport',
  },
];

// Define the fields for the Report - Hybrid Workloads resource operations
export const reportHybridFields: INodeProperties[] = [
  /* Common Fields for All Report Operations */

  // Return All / Limit fields
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['reportHybrid'],
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
        resource: ['reportHybrid'],
        returnAll: [false],
      },
    },
    typeOptions: {
      minValue: 1,
      maxValue: 100,
    },
    default: 50,
    description: 'Max number of results to return',
  },

  // Date Selection Method - aligned with Events resource
  {
    displayName: 'Date Selection Method',
    name: 'dateSelectionMethod',
    type: 'options',
    options: [
      {
        name: 'No Date Filter',
        value: 'noDates',
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
    displayOptions: {
      show: {
        resource: ['reportHybrid'],
      },
    },
    description:
      'Choose whether to use specific dates, relative date ranges, or include all dates (no date filter)',
  },

  // Specific Dates selection - aligned with Events resource
  {
    displayName: 'Start Date',
    name: 'startDate',
    type: 'dateTime',
    displayOptions: {
      show: {
        resource: ['reportHybrid'],
        dateSelectionMethod: ['specificDates'],
      },
    },
    default: '',
    description: 'Start date for filtering report data (inclusive)',
  },
  {
    displayName: 'End Date',
    name: 'endDate',
    type: 'dateTime',
    displayOptions: {
      show: {
        resource: ['reportHybrid'],
        dateSelectionMethod: ['specificDates'],
      },
    },
    default: '',
    description: 'End date for filtering report data (inclusive)',
  },

  // Relative Date Range selection - aligned with Events resource
  {
    displayName: 'Date Range',
    name: 'relativeDateRange',
    type: 'options',
    displayOptions: {
      show: {
        resource: ['reportHybrid'],
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
    description: 'Select a predefined date range for filtering report data',
  },

  // Customer Filter - aligned with Events resource
  {
    displayName: 'Filter by Customer(s)',
    name: 'filterByCustomers',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['reportHybrid'],
      },
    },
    default: false,
    description: 'Whether to filter results by specific customers',
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
        resource: ['reportHybrid'],
        filterByCustomers: [true],
      },
    },
    default: [],
    description: 'ID of the customer(s) to filter by',
  },

  /* Fields specific to Backup Activity Report */
  {
    displayName: 'Filter by Workload Types',
    name: 'filterByWorkloadTypes',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['reportHybrid'],
        operation: [
          'getBackupActivityReport',
          'getConsumptionByBackupSetReport',
          'getResourceStatusReport',
          'getAlertHistoryReport',
          'getStorageConsumptionByBackupSetsReport',
        ],
      },
    },
    default: false,
    description: 'Whether to filter by workload types',
  },
  {
    displayName: 'Workload Types',
    name: 'workloadTypes',
    type: 'multiOptions',
    typeOptions: {
      loadOptionsMethod: 'getWorkloadTypes',
    },
    displayOptions: {
      show: {
        resource: ['reportHybrid'],
        operation: [
          'getBackupActivityReport',
          'getConsumptionByBackupSetReport',
          'getResourceStatusReport',
          'getAlertHistoryReport',
          'getStorageConsumptionByBackupSetsReport',
        ],
        filterByWorkloadTypes: [true],
      },
    },
    default: [],
    description: 'Types of workloads to filter by. For Alert History, this filters by Alert Type.',
  },
  {
    displayName: 'Filter by Backup Status',
    name: 'filterByBackupStatus',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['reportHybrid'],
        operation: ['getBackupActivityReport'],
      },
    },
    default: false,
    description: 'Whether to filter by backup status',
  },
  {
    displayName: 'Backup Status',
    name: 'backupStatus',
    type: 'multiOptions',
    typeOptions: {
      loadOptionsMethod: 'getBackupStatuses',
    },
    displayOptions: {
      show: {
        resource: ['reportHybrid'],
        operation: ['getBackupActivityReport'],
        filterByBackupStatus: [true],
      },
    },
    default: [],
    description: 'Backup status values to filter by',
  },

  /* Fields specific to DR Reports */
  {
    displayName: 'Filter by DR Plan IDs',
    name: 'filterByDRPlanIds',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['reportHybrid'],
        operation: ['getDRFailbackActivityReport', 'getDRReplicationActivityReport'],
      },
    },
    default: false,
    description: 'Whether to filter by DR plan IDs',
  },
  {
    displayName: 'DR Plan IDs',
    name: 'drPlanIds',
    type: 'string',
    typeOptions: {
      multipleValues: true,
    },
    displayOptions: {
      show: {
        resource: ['reportHybrid'],
        operation: ['getDRFailbackActivityReport', 'getDRReplicationActivityReport'],
        filterByDRPlanIds: [true],
      },
    },
    default: [],
    description: 'IDs of DR plans to filter by',
  },

  /* Fields specific to DR Replication Activity Report */
  {
    displayName: 'Filter by Replication Status',
    name: 'filterByReplicationStatus',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['reportHybrid'],
        operation: ['getDRReplicationActivityReport'],
      },
    },
    default: false,
    description: 'Whether to filter by replication status',
  },
  {
    displayName: 'Replication Status',
    name: 'replicationStatus',
    type: 'multiOptions',
    options: [
      {
        name: 'Success',
        value: 'SUCCESS',
      },
      {
        name: 'Failed',
        value: 'FAILED',
      },
      {
        name: 'In Progress',
        value: 'IN_PROGRESS',
      },
    ],
    displayOptions: {
      show: {
        resource: ['reportHybrid'],
        operation: ['getDRReplicationActivityReport'],
        filterByReplicationStatus: [true],
      },
    },
    default: [],
    description: 'Replication status values to filter by',
  },

  /* Fields specific to Resource Status Report */
  {
    displayName: 'Filter by Resource Status',
    name: 'filterByResourceStatus',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['reportHybrid'],
        operation: ['getResourceStatusReport'],
      },
    },
    default: false,
    description: 'Whether to filter by resource status',
  },
  {
    displayName: 'Resource Status',
    name: 'resourceStatus',
    type: 'multiOptions',
    typeOptions: {
      loadOptionsMethod: 'getResourceStatuses',
    },
    displayOptions: {
      show: {
        resource: ['reportHybrid'],
        operation: ['getResourceStatusReport'],
        filterByResourceStatus: [true],
      },
    },
    default: [],
    description: 'Resource status values to filter by',
  },
  {
    displayName: 'Filter by Resource Types',
    name: 'filterByResourceTypes',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['reportHybrid'],
        operation: ['getResourceStatusReport'],
      },
    },
    default: false,
    description: 'Whether to filter by resource types',
  },
  {
    displayName: 'Resource Type',
    name: 'resourceType',
    type: 'multiOptions',
    typeOptions: {
      loadOptionsMethod: 'getResourceTypes',
    },
    displayOptions: {
      show: {
        resource: ['reportHybrid'],
        operation: ['getResourceStatusReport'],
        filterByResourceTypes: [true],
      },
    },
    default: [],
    description: 'Resource types to filter by',
  },

  /* Fields specific to Alert History Report */
  {
    displayName: 'Filter by Alert Severity',
    name: 'filterByAlertSeverity',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['reportHybrid'],
        operation: ['getAlertHistoryReport'],
      },
    },
    default: false,
    description: 'Whether to filter by alert severity',
  },
  {
    displayName: 'Alert Severity',
    name: 'alertSeverity',
    type: 'multiOptions',
    options: [
      {
        name: 'Critical',
        value: 'CRITICAL',
      },
      {
        name: 'Warning',
        value: 'WARNING',
      },
      {
        name: 'Info',
        value: 'INFO',
      },
    ],
    displayOptions: {
      show: {
        resource: ['reportHybrid'],
        operation: ['getAlertHistoryReport'],
        filterByAlertSeverity: [true],
      },
    },
    default: [],
    description:
      'Alert severity levels to filter by (will be converted to Critical/Warning/Info format expected by API)',
  },

  /* Fields specific to M365 Storage Consumption Report */
  {
    displayName: 'Filter by Workload Name',
    name: 'filterByWorkloadName',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['reportHybrid'],
        operation: ['getM365StorageConsumptionReport'],
      },
    },
    default: false,
    description: 'Whether to filter by Microsoft 365 workload name',
  },
  {
    displayName: 'Workload Name',
    name: 'workloadName',
    type: 'multiOptions',
    options: [
      {
        name: 'SharePoint',
        value: 'SharePoint',
      },
      {
        name: 'OneDrive',
        value: 'OneDrive',
      },
      {
        name: 'Exchange',
        value: 'Exchange',
      },
      {
        name: 'Teams',
        value: 'Teams',
      },
    ],
    displayOptions: {
      show: {
        resource: ['reportHybrid'],
        operation: ['getM365StorageConsumptionReport'],
        filterByWorkloadName: [true],
      },
    },
    default: [],
    description: 'Microsoft 365 workload names to filter by',
  },
];
