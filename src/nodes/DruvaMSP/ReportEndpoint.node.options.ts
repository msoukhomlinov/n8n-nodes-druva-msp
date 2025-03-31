import type { INodeProperties } from 'n8n-workflow';

// Define the operations for the Report - Endpoint resource
export const reportEndpointOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['reportEndpoint'],
      },
    },
    options: [
      {
        name: 'Get User Report',
        value: 'getUsers',
        action: 'Get user report',
        description:
          'Retrieve comprehensive data on user management activities across MSP customers',
      },
      {
        name: 'Get User Rollout Report',
        value: 'getUserRollout',
        action: 'Get user rollout report',
        description: 'Track user deployment and onboarding progress across MSP customers',
      },
      {
        name: 'Get User Provisioning Report',
        value: 'getUserProvisioning',
        action: 'Get user provisioning report',
        description: 'Monitor user provisioning activities and statuses across MSP customers',
      },
      {
        name: 'Get License Usage Report',
        value: 'getLicenseUsage',
        action: 'Get license usage report',
        description: 'Track license allocation and consumption across MSP customers',
      },
      {
        name: 'Get Last Backup Status Report',
        value: 'getLastBackupStatus',
        action: 'Get last backup status report',
        description: 'Monitor recent backup operations and their status across MSP customers',
      },
      {
        name: 'Get Alerts Report',
        value: 'getAlerts',
        action: 'Get alerts report',
        description: 'Retrieve alerts and notifications across MSP customer environments',
      },
      {
        name: 'Get Storage Statistics Report',
        value: 'getStorageStatistics',
        action: 'Get storage statistics report',
        description: 'Track storage usage and trends across MSP customer environments',
      },
      {
        name: 'Get Storage Alert Report',
        value: 'getStorageAlert',
        action: 'Get storage alert report',
        description: 'Monitor storage-related alerts and warnings across MSP customers',
      },
      {
        name: 'Get Cloud Cache Statistics Report',
        value: 'getCloudCacheStatistics',
        action: 'Get cloud cache statistics report',
        description: 'Analyze cloud cache performance metrics across MSP customer environments',
      },
    ],
    default: 'getUsers',
  },
];

// Define the fields for the Report - Endpoint resource operations
export const reportEndpointFields: INodeProperties[] = [
  /* -------------------------------------------------------------------------- */
  /*                         Common Fields (used across operations)              */
  /* -------------------------------------------------------------------------- */
  {
    displayName: 'Filter by Date Range',
    name: 'filterByDateRange',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['reportEndpoint'],
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
        resource: ['reportEndpoint'],
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
        resource: ['reportEndpoint'],
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
        resource: ['reportEndpoint'],
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
        resource: ['reportEndpoint'],
        filterByCustomers: [true],
      },
    },
    default: [],
    required: true,
    description: 'List of customer IDs to include in the report',
  },

  /* -------------------------------------------------------------------------- */
  /*                        Fields specific to getUsers                          */
  /* -------------------------------------------------------------------------- */
  {
    displayName: 'Filter by User Status',
    name: 'filterByUserStatus',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['reportEndpoint'],
        operation: ['getUsers'],
      },
    },
    default: false,
    description: 'Whether to filter results by user status',
  },
  {
    displayName: 'User Status',
    name: 'userStatus',
    type: 'multiOptions',
    displayOptions: {
      show: {
        resource: ['reportEndpoint'],
        operation: ['getUsers'],
        filterByUserStatus: [true],
      },
    },
    options: [
      {
        name: 'Active',
        value: 'ACTIVE',
      },
      {
        name: 'Deactivated',
        value: 'DEACTIVATED',
      },
      {
        name: 'Preserved',
        value: 'PRESERVED',
      },
    ],
    default: [],
    description: 'User status values to filter by',
  },

  /* -------------------------------------------------------------------------- */
  /*                     Fields specific to getUserRollout                       */
  /* -------------------------------------------------------------------------- */
  {
    displayName: 'Filter by Rollout Status',
    name: 'filterByRolloutStatus',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['reportEndpoint'],
        operation: ['getUserRollout'],
      },
    },
    default: false,
    description: 'Whether to filter results by rollout status',
  },
  {
    displayName: 'Rollout Status',
    name: 'rolloutStatus',
    type: 'multiOptions',
    displayOptions: {
      show: {
        resource: ['reportEndpoint'],
        operation: ['getUserRollout'],
        filterByRolloutStatus: [true],
      },
    },
    options: [
      {
        name: 'Completed',
        value: 'COMPLETED',
      },
      {
        name: 'In Progress',
        value: 'IN_PROGRESS',
      },
      {
        name: 'Not Started',
        value: 'NOT_STARTED',
      },
      {
        name: 'Failed',
        value: 'FAILED',
      },
    ],
    default: [],
    description: 'Rollout status values to filter by',
  },

  /* -------------------------------------------------------------------------- */
  /*                   Fields specific to getUserProvisioning                    */
  /* -------------------------------------------------------------------------- */
  {
    displayName: 'Filter by Provisioning Status',
    name: 'filterByProvisioningStatus',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['reportEndpoint'],
        operation: ['getUserProvisioning'],
      },
    },
    default: false,
    description: 'Whether to filter results by provisioning status',
  },
  {
    displayName: 'Provisioning Status',
    name: 'provisioningStatus',
    type: 'multiOptions',
    displayOptions: {
      show: {
        resource: ['reportEndpoint'],
        operation: ['getUserProvisioning'],
        filterByProvisioningStatus: [true],
      },
    },
    options: [
      {
        name: 'Successful',
        value: 'SUCCESSFUL',
      },
      {
        name: 'Failed',
        value: 'FAILED',
      },
      {
        name: 'In Progress',
        value: 'IN_PROGRESS',
      },
      {
        name: 'Pending',
        value: 'PENDING',
      },
    ],
    default: [],
    description: 'Provisioning status values to filter by',
  },

  /* -------------------------------------------------------------------------- */
  /*                     Fields specific to getLicenseUsage                      */
  /* -------------------------------------------------------------------------- */
  {
    displayName: 'Report Period',
    name: 'period',
    type: 'options',
    displayOptions: {
      show: {
        resource: ['reportEndpoint'],
        operation: ['getLicenseUsage'],
      },
    },
    options: [
      {
        name: 'Weekly',
        value: 'WEEKLY',
      },
      {
        name: 'Monthly',
        value: 'MONTHLY',
      },
    ],
    default: 'WEEKLY',
    description: 'Time period for the license usage report',
  },

  /* -------------------------------------------------------------------------- */
  /*                   Fields specific to getLastBackupStatus                    */
  /* -------------------------------------------------------------------------- */
  {
    displayName: 'Filter by Backup Status',
    name: 'filterByBackupStatus',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['reportEndpoint'],
        operation: ['getLastBackupStatus'],
      },
    },
    default: false,
    description: 'Whether to filter results by backup status',
  },
  {
    displayName: 'Backup Status',
    name: 'backupStatus',
    type: 'multiOptions',
    displayOptions: {
      show: {
        resource: ['reportEndpoint'],
        operation: ['getLastBackupStatus'],
        filterByBackupStatus: [true],
      },
    },
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
      {
        name: 'Pending',
        value: 'PENDING',
      },
    ],
    default: [],
    description: 'Backup status values to filter by',
  },
  {
    displayName: 'Filter by Device Types',
    name: 'filterByDeviceTypes',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['reportEndpoint'],
        operation: ['getLastBackupStatus'],
      },
    },
    default: false,
    description: 'Whether to filter results by device types',
  },
  {
    displayName: 'Device Types',
    name: 'deviceTypes',
    type: 'multiOptions',
    displayOptions: {
      show: {
        resource: ['reportEndpoint'],
        operation: ['getLastBackupStatus'],
        filterByDeviceTypes: [true],
      },
    },
    options: [
      {
        name: 'Laptop',
        value: 'LAPTOP',
      },
      {
        name: 'Desktop',
        value: 'DESKTOP',
      },
      {
        name: 'Mobile',
        value: 'MOBILE',
      },
    ],
    default: [],
    description: 'Device types to filter by',
  },
  {
    displayName: 'Filter by Data Source Types',
    name: 'filterByDataSourceTypes',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['reportEndpoint'],
        operation: ['getLastBackupStatus'],
      },
    },
    default: false,
    description: 'Whether to filter results by data source types',
  },
  {
    displayName: 'Data Source Types',
    name: 'dataSourceTypes',
    type: 'multiOptions',
    displayOptions: {
      show: {
        resource: ['reportEndpoint'],
        operation: ['getLastBackupStatus'],
        filterByDataSourceTypes: [true],
      },
    },
    options: [
      {
        name: 'File System',
        value: 'FILE_SYSTEM',
      },
      {
        name: 'Mail',
        value: 'MAIL',
      },
      {
        name: 'Contacts',
        value: 'CONTACTS',
      },
      {
        name: 'Calendar',
        value: 'CALENDAR',
      },
    ],
    default: [],
    description: 'Data source types to filter by',
  },

  /* -------------------------------------------------------------------------- */
  /*                        Fields specific to getAlerts                         */
  /* -------------------------------------------------------------------------- */
  {
    displayName: 'Filter by Alert Types',
    name: 'filterByAlertTypes',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['reportEndpoint'],
        operation: ['getAlerts'],
      },
    },
    default: false,
    description: 'Whether to filter results by alert types',
  },
  {
    displayName: 'Alert Types',
    name: 'alertTypes',
    type: 'multiOptions',
    displayOptions: {
      show: {
        resource: ['reportEndpoint'],
        operation: ['getAlerts'],
        filterByAlertTypes: [true],
      },
    },
    options: [
      {
        name: 'Backup Failure',
        value: 'BACKUP_FAILURE',
      },
      {
        name: 'Connection Issue',
        value: 'CONNECTION_ISSUE',
      },
      {
        name: 'Storage Warning',
        value: 'STORAGE_WARNING',
      },
      {
        name: 'Security Alert',
        value: 'SECURITY_ALERT',
      },
      {
        name: 'System Error',
        value: 'SYSTEM_ERROR',
      },
    ],
    default: [],
    description: 'Alert types to filter by',
  },
  {
    displayName: 'Filter by Alert Severity',
    name: 'filterByAlertSeverity',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['reportEndpoint'],
        operation: ['getAlerts'],
      },
    },
    default: false,
    description: 'Whether to filter results by alert severity',
  },
  {
    displayName: 'Alert Severity',
    name: 'alertSeverity',
    type: 'multiOptions',
    displayOptions: {
      show: {
        resource: ['reportEndpoint'],
        operation: ['getAlerts'],
        filterByAlertSeverity: [true],
      },
    },
    options: [
      {
        name: 'Critical',
        value: 'CRITICAL',
      },
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
    description: 'Alert severity levels to filter by',
  },

  /* -------------------------------------------------------------------------- */
  /*                    Fields specific to getStorageStatistics                  */
  /* -------------------------------------------------------------------------- */
  {
    displayName: 'Report Period',
    name: 'storagePeriod',
    type: 'options',
    displayOptions: {
      show: {
        resource: ['reportEndpoint'],
        operation: ['getStorageStatistics'],
      },
    },
    options: [
      {
        name: 'Daily',
        value: 'DAILY',
      },
      {
        name: 'Weekly',
        value: 'WEEKLY',
      },
      {
        name: 'Monthly',
        value: 'MONTHLY',
      },
    ],
    default: 'DAILY',
    description: 'Time period for the storage statistics report',
  },

  /* -------------------------------------------------------------------------- */
  /*                      Fields specific to getStorageAlert                     */
  /* -------------------------------------------------------------------------- */
  {
    displayName: 'Filter by Storage Alert Types',
    name: 'filterByStorageAlertTypes',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['reportEndpoint'],
        operation: ['getStorageAlert'],
      },
    },
    default: false,
    description: 'Whether to filter results by storage alert types',
  },
  {
    displayName: 'Storage Alert Types',
    name: 'storageAlertTypes',
    type: 'multiOptions',
    displayOptions: {
      show: {
        resource: ['reportEndpoint'],
        operation: ['getStorageAlert'],
        filterByStorageAlertTypes: [true],
      },
    },
    options: [
      {
        name: 'Capacity Warning',
        value: 'CAPACITY_WARNING',
      },
      {
        name: 'Quota Exceeded',
        value: 'QUOTA_EXCEEDED',
      },
      {
        name: 'Abnormal Growth',
        value: 'ABNORMAL_GROWTH',
      },
      {
        name: 'Storage Failure',
        value: 'STORAGE_FAILURE',
      },
    ],
    default: [],
    description: 'Storage alert types to filter by',
  },

  /* -------------------------------------------------------------------------- */
  /*                  Fields specific to getCloudCacheStatistics                 */
  /* -------------------------------------------------------------------------- */
  {
    displayName: 'Report Period',
    name: 'cloudCachePeriod',
    type: 'options',
    displayOptions: {
      show: {
        resource: ['reportEndpoint'],
        operation: ['getCloudCacheStatistics'],
      },
    },
    options: [
      {
        name: 'Daily',
        value: 'DAILY',
      },
      {
        name: 'Weekly',
        value: 'WEEKLY',
      },
      {
        name: 'Monthly',
        value: 'MONTHLY',
      },
    ],
    default: 'DAILY',
    description: 'Time period for the cloud cache statistics report',
  },
  {
    displayName: 'Filter by Cache Status',
    name: 'filterByCacheStatus',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['reportEndpoint'],
        operation: ['getCloudCacheStatistics'],
      },
    },
    default: false,
    description: 'Whether to filter results by cache status',
  },
  {
    displayName: 'Cache Status',
    name: 'cacheStatus',
    type: 'multiOptions',
    displayOptions: {
      show: {
        resource: ['reportEndpoint'],
        operation: ['getCloudCacheStatistics'],
        filterByCacheStatus: [true],
      },
    },
    options: [
      {
        name: 'Active',
        value: 'ACTIVE',
      },
      {
        name: 'Inactive',
        value: 'INACTIVE',
      },
      {
        name: 'Warning',
        value: 'WARNING',
      },
      {
        name: 'Error',
        value: 'ERROR',
      },
    ],
    default: [],
    description: 'Cache status values to filter by',
  },

  /* -------------------------------------------------------------------------- */
  /*                     Pagination Controls (all operations)                    */
  /* -------------------------------------------------------------------------- */
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['reportEndpoint'],
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
        resource: ['reportEndpoint'],
        returnAll: [false],
      },
    },
    default: 100,
    description: 'Max number of results to return',
  },
];
