import type { INodeProperties } from 'n8n-workflow';
import { RELATIVE_DATE_RANGE_OPTIONS } from './helpers/Constants';

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
        resource: ['reportEndpoint'],
      },
      hide: {
        operation: ['getStorageStatistics'],
      },
    },
  },
  {
    displayName: 'Start Date',
    name: 'startDate',
    type: 'dateTime',
    displayOptions: {
      show: {
        resource: ['reportEndpoint'],
        dateSelectionMethod: ['specificDates'],
      },
      hide: {
        operation: ['getStorageStatistics'],
      },
    },
    default: '',
    required: true,
    description: 'Start date for the report period',
  },
  {
    displayName: 'End Date',
    name: 'endDate',
    type: 'dateTime',
    displayOptions: {
      show: {
        resource: ['reportEndpoint'],
        dateSelectionMethod: ['specificDates'],
      },
      hide: {
        operation: ['getStorageStatistics'],
      },
    },
    default: '',
    required: true,
    description: 'End date for the report period',
  },
  {
    displayName: 'Date Range',
    name: 'relativeDateRange',
    type: 'options',
    displayOptions: {
      show: {
        resource: ['reportEndpoint'],
        dateSelectionMethod: ['relativeDates'],
      },
      hide: {
        operation: ['getStorageStatistics'],
      },
    },
    options: [...RELATIVE_DATE_RANGE_OPTIONS],
    default: 'previousMonth1',
    required: true,
    description: 'Select a predefined date range for the report',
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
    type: 'multiOptions',
    typeOptions: {
      loadOptionsMethod: 'getCustomers',
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
        value: 'Critical',
      },
      {
        name: 'High',
        value: 'High',
      },
      {
        name: 'Medium',
        value: 'Medium',
      },
      {
        name: 'Low',
        value: 'Low',
      },
    ],
    default: [],
    description: 'Alert severity levels to filter by',
  },
  {
    displayName: 'Filter by Active Status',
    name: 'filterByActiveStatus',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['reportEndpoint'],
        operation: ['getAlerts'],
      },
    },
    default: false,
    description: 'Whether to filter results by active status',
  },
  {
    displayName: 'Active Status',
    name: 'activeStatus',
    type: 'options',
    displayOptions: {
      show: {
        resource: ['reportEndpoint'],
        operation: ['getAlerts'],
        filterByActiveStatus: [true],
      },
    },
    options: [
      {
        name: 'Active Alerts Only',
        value: 'Yes',
        description: 'Retrieve data for active alerts that require attention',
      },
      {
        name: 'Resolved Alerts Only',
        value: 'No',
        description: 'Retrieve data for resolved or deleted alerts',
      },
    ],
    default: 'Yes',
    description: 'Filter by whether alerts are active or resolved',
  },

  /* -------------------------------------------------------------------------- */
  /*                    Fields specific to getStorageStatistics                  */
  /* -------------------------------------------------------------------------- */
  // Note: Removed unsupported parameters that don't align with the API

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
  // Note: Removed unsupported parameters that don't align with the API
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
