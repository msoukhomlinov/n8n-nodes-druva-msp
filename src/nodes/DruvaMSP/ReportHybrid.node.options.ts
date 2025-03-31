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
        name: 'Get Resource Status Report',
        value: 'getResourceStatusReport',
        description: 'Retrieve resource status information',
        action: 'Get resource status report',
      },
      {
        name: 'Get Alert History Report',
        value: 'getAlertHistoryReport',
        description: 'Retrieve alert history information',
        action: 'Get alert history report',
      },
    ],
    default: 'getBackupActivityReport',
  },
];

// Define the fields for the Report - Hybrid Workloads resource operations
export const reportHybridFields: INodeProperties[] = [
  /* Common Fields for All Report Operations */

  // Filter by Customer IDs
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

  // Date Range Filter (common to all operations)
  {
    displayName: 'Filter by Date Range',
    name: 'filterByDateRange',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['reportHybrid'],
      },
    },
    default: true,
    description: 'Whether to filter results by date range',
  },

  // Date Range for Backup Activity and Consumption Reports (uses startDate/endDate)
  {
    displayName: 'Start Date',
    name: 'startDate',
    type: 'dateTime',
    displayOptions: {
      show: {
        resource: ['reportHybrid'],
        operation: ['getBackupActivityReport', 'getConsumptionByBackupSetReport'],
        filterByDateRange: [true],
      },
    },
    default: '',
    description: 'Start date for the report (YYYY-MM-DD)',
  },
  {
    displayName: 'End Date',
    name: 'endDate',
    type: 'dateTime',
    displayOptions: {
      show: {
        resource: ['reportHybrid'],
        operation: ['getBackupActivityReport', 'getConsumptionByBackupSetReport'],
        filterByDateRange: [true],
      },
    },
    default: '',
    description: 'End date for the report (YYYY-MM-DD)',
  },

  // Date Range for other reports (uses startTime/endTime)
  {
    displayName: 'Start Time',
    name: 'startTime',
    type: 'dateTime',
    displayOptions: {
      show: {
        resource: ['reportHybrid'],
        operation: [
          'getDRFailbackActivityReport',
          'getDRFailoverActivityReport',
          'getDRReplicationActivityReport',
          'getResourceStatusReport',
          'getAlertHistoryReport',
        ],
        filterByDateRange: [true],
      },
    },
    default: '',
    description: 'Start time for the report (ISO format)',
  },
  {
    displayName: 'End Time',
    name: 'endTime',
    type: 'dateTime',
    displayOptions: {
      show: {
        resource: ['reportHybrid'],
        operation: [
          'getDRFailbackActivityReport',
          'getDRFailoverActivityReport',
          'getDRReplicationActivityReport',
          'getResourceStatusReport',
          'getAlertHistoryReport',
        ],
        filterByDateRange: [true],
      },
    },
    default: '',
    description: 'End time for the report (ISO format)',
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
        ],
        filterByWorkloadTypes: [true],
      },
    },
    default: [],
    description: 'Types of workloads to filter by',
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
        operation: [
          'getDRFailbackActivityReport',
          'getDRFailoverActivityReport',
          'getDRReplicationActivityReport',
        ],
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
        operation: [
          'getDRFailbackActivityReport',
          'getDRFailoverActivityReport',
          'getDRReplicationActivityReport',
        ],
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
    description: 'Alert severity levels to filter by',
  },
];
