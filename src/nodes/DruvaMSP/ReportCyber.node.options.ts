import type { INodeProperties } from 'n8n-workflow';

// Define the operations for the Report - Cyber Resilience resource
export const reportCyberOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['reportCyber'],
      },
    },
    options: [
      {
        name: 'Get Rollback Actions Report',
        value: 'getRollbackActions',
        action: 'Get rollback actions report',
        description:
          'Retrieve comprehensive details about deleted entities and rollback capabilities',
      },

      {
        name: 'Get Data Protection Risk Report',
        value: 'getDataProtectionRisk',
        action: 'Get data protection risk report',
        description:
          'Monitor enterprise workload agent connection status and data protection risks',
      },
    ],
    default: 'getRollbackActions',
  },
];

// Define the fields for the Report - Cyber Resilience resource operations
export const reportCyberFields: INodeProperties[] = [
  /* -------------------------------------------------------------------------- */
  /*                Common Fields (used across both operations)                 */
  /* -------------------------------------------------------------------------- */
  {
    displayName: 'Filter by Date Range',
    name: 'filterByDateRange',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['reportCyber'],
        operation: ['getRollbackActions', 'getDataProtectionRisk'],
      },
    },
    default: true,
    description: 'Whether to filter results by time period',
  },
  {
    displayName: 'Start Time',
    name: 'startTime',
    type: 'dateTime',
    displayOptions: {
      show: {
        resource: ['reportCyber'],
        operation: ['getRollbackActions', 'getDataProtectionRisk'],
        filterByDateRange: [true],
      },
    },
    default: '',
    description: 'Start time for the report period',
  },
  {
    displayName: 'End Time',
    name: 'endTime',
    type: 'dateTime',
    displayOptions: {
      show: {
        resource: ['reportCyber'],
        operation: ['getRollbackActions', 'getDataProtectionRisk'],
        filterByDateRange: [true],
      },
    },
    default: '',
    description: 'End time for the report period',
  },
  {
    displayName: 'Filter by Customers',
    name: 'filterByCustomers',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['reportCyber'],
        operation: ['getRollbackActions', 'getDataProtectionRisk'],
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
        resource: ['reportCyber'],
        operation: ['getRollbackActions', 'getDataProtectionRisk'],
        filterByCustomers: [true],
      },
    },
    default: [],
    required: true,
    description: 'List of customer IDs to include in the report',
  },

  /* -------------------------------------------------------------------------- */
  /*                    Fields specific to getRollbackActions                   */
  /* -------------------------------------------------------------------------- */
  {
    displayName: 'Filter by Entity Types',
    name: 'filterByEntityTypes',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['reportCyber'],
        operation: ['getRollbackActions'],
      },
    },
    default: false,
    description: 'Whether to filter results by entity types',
  },
  {
    displayName: 'Entity Types',
    name: 'entityTypes',
    type: 'multiOptions',
    displayOptions: {
      show: {
        resource: ['reportCyber'],
        operation: ['getRollbackActions'],
        filterByEntityTypes: [true],
      },
    },
    options: [
      {
        name: 'File',
        value: 'FILE',
      },
      {
        name: 'Folder',
        value: 'FOLDER',
      },
      {
        name: 'Device',
        value: 'DEVICE',
      },
      {
        name: 'User',
        value: 'USER',
      },
    ],
    default: [],
    description: 'Entity types to filter by',
  },
  {
    displayName: 'Filter by Action Types',
    name: 'filterByActionTypes',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['reportCyber'],
        operation: ['getRollbackActions'],
      },
    },
    default: false,
    description: 'Whether to filter results by action types',
  },
  {
    displayName: 'Action Types',
    name: 'actionTypes',
    type: 'multiOptions',
    displayOptions: {
      show: {
        resource: ['reportCyber'],
        operation: ['getRollbackActions'],
        filterByActionTypes: [true],
      },
    },
    options: [
      {
        name: 'Delete',
        value: 'DELETE',
      },
      {
        name: 'Restore',
        value: 'RESTORE',
      },
    ],
    default: [],
    description: 'Action types to filter by',
  },
  {
    displayName: 'Filter by Action Status',
    name: 'filterByActionStatus',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['reportCyber'],
        operation: ['getRollbackActions'],
      },
    },
    default: false,
    description: 'Whether to filter results by action status',
  },
  {
    displayName: 'Action Status',
    name: 'actionStatus',
    type: 'multiOptions',
    displayOptions: {
      show: {
        resource: ['reportCyber'],
        operation: ['getRollbackActions'],
        filterByActionStatus: [true],
      },
    },
    options: [
      {
        name: 'Pending',
        value: 'PENDING',
      },
      {
        name: 'Completed',
        value: 'COMPLETED',
      },
      {
        name: 'Failed',
        value: 'FAILED',
      },
    ],
    default: [],
    description: 'Action status values to filter by',
  },

  /* -------------------------------------------------------------------------- */
  /*                Fields specific to getDataProtectionRisk                   */
  /* -------------------------------------------------------------------------- */
  {
    displayName: 'Filter by Workload Types',
    name: 'filterByWorkloadTypes',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['reportCyber'],
        operation: ['getDataProtectionRisk'],
      },
    },
    default: false,
    description: 'Whether to filter results by workload types',
  },
  {
    displayName: 'Workload Types',
    name: 'workloadTypes',
    type: 'multiOptions',
    displayOptions: {
      show: {
        resource: ['reportCyber'],
        operation: ['getDataProtectionRisk'],
        filterByWorkloadTypes: [true],
      },
    },
    options: [
      {
        name: 'Server',
        value: 'SERVER',
      },
      {
        name: 'VM',
        value: 'VM',
      },
      {
        name: 'NAS',
        value: 'NAS',
      },
      {
        name: 'Database',
        value: 'DATABASE',
      },
    ],
    default: [],
    description: 'Workload types to filter by',
  },
  {
    displayName: 'Filter by Connection Status',
    name: 'filterByConnectionStatus',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['reportCyber'],
        operation: ['getDataProtectionRisk'],
      },
    },
    default: false,
    description: 'Whether to filter results by connection status',
  },
  {
    displayName: 'Connection Status',
    name: 'connectionStatus',
    type: 'multiOptions',
    displayOptions: {
      show: {
        resource: ['reportCyber'],
        operation: ['getDataProtectionRisk'],
        filterByConnectionStatus: [true],
      },
    },
    options: [
      {
        name: 'Connected',
        value: 'CONNECTED',
      },
      {
        name: 'Disconnected',
        value: 'DISCONNECTED',
      },
      {
        name: 'Intermittent',
        value: 'INTERMITTENT',
      },
    ],
    default: [],
    description: 'Connection status values to filter by',
  },
  {
    displayName: 'Filter by Risk Levels',
    name: 'filterByRiskLevels',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['reportCyber'],
        operation: ['getDataProtectionRisk'],
      },
    },
    default: false,
    description: 'Whether to filter results by risk levels',
  },
  {
    displayName: 'Risk Levels',
    name: 'riskLevels',
    type: 'multiOptions',
    displayOptions: {
      show: {
        resource: ['reportCyber'],
        operation: ['getDataProtectionRisk'],
        filterByRiskLevels: [true],
      },
    },
    options: [
      {
        name: 'High',
        value: 'HIGH',
      },
      {
        name: 'Medium',
        value: 'MEDIUM',
      },
      {
        name: 'Low',
        value: 'LOW',
      },
    ],
    default: [],
    description: 'Risk level values to filter by',
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
        resource: ['reportCyber'],
        operation: ['getRollbackActions', 'getDataProtectionRisk'],
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
        resource: ['reportCyber'],
        operation: ['getRollbackActions', 'getDataProtectionRisk'],
        returnAll: [false],
      },
    },
    default: 100,
    description: 'Max number of results to return',
  },
];
