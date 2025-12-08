import type { INodeProperties } from 'n8n-workflow';
import { RELATIVE_DATE_RANGE_OPTIONS } from './helpers/Constants';

// Define event categories centrally for reuse
export const EVENT_CATEGORIES = [
  { name: 'Event', value: 'EVENT' },
  { name: 'Audit', value: 'AUDIT' },
  { name: 'Alert', value: 'ALERT' },
];

// Define event types from Druva MSP API documentation
// https://developer.druva.com/docs/supported-msp-events
export const EVENT_TYPES = [
  // Admin events
  {
    name: 'Admin Login Success',
    value: 'AdminLoginSuccess',
    feature: 'Admin',
    category: 'EVENT',
    syslogSeverity: '6',
  },
  {
    name: 'Admin Login Failed',
    value: 'AdminLoginFailed',
    feature: 'Admin',
    category: 'EVENT',
    syslogSeverity: '5',
  },
  {
    name: 'Admin Created',
    value: 'AdminCreated',
    feature: 'Admin',
    category: 'AUDIT',
    syslogSeverity: '6',
  },
  {
    name: 'Admin Updated',
    value: 'AdminUpdated',
    feature: 'Admin',
    category: 'AUDIT',
    syslogSeverity: '5',
  },
  {
    name: 'Admin Deleted',
    value: 'AdminDeleted',
    feature: 'Admin',
    category: 'AUDIT',
    syslogSeverity: '5',
  },
  {
    name: 'Password Changed',
    value: 'PasswordChanged',
    feature: 'Admin',
    category: 'EVENT',
    syslogSeverity: '5',
  },

  // Client events
  {
    name: 'Client Login Success',
    value: 'ClientLoginSuccess',
    feature: 'Client',
    category: 'EVENT',
    syslogSeverity: '6',
  },
  {
    name: 'Client Login Failed',
    value: 'ClientLoginFailed',
    feature: 'Client',
    category: 'EVENT',
    syslogSeverity: '5',
  },
  {
    name: 'Client Created',
    value: 'ClientCreated',
    feature: 'Client',
    category: 'AUDIT',
    syslogSeverity: '6',
  },
  {
    name: 'Client Updated',
    value: 'ClientUpdated',
    feature: 'Client',
    category: 'AUDIT',
    syslogSeverity: '5',
  },
  {
    name: 'Client Deleted',
    value: 'ClientDeleted',
    feature: 'Client',
    category: 'AUDIT',
    syslogSeverity: '5',
  },
  {
    name: 'Client Secret Key Updated',
    value: 'ClientSecretKeyUpdated',
    feature: 'Client',
    category: 'EVENT',
    syslogSeverity: '5',
  },

  // Customer events
  {
    name: 'Customer Created',
    value: 'CustomerCreated',
    feature: 'Customer',
    category: 'AUDIT',
    syslogSeverity: '6',
  },
  {
    name: 'Customer Updated',
    value: 'CustomerUpdated',
    feature: 'Customer',
    category: 'AUDIT',
    syslogSeverity: '5',
  },
  {
    name: 'Customer Deleted (Audit)',
    value: 'CustomerDeleted',
    feature: 'Customer',
    category: 'AUDIT',
    syslogSeverity: '5',
  },
  {
    name: 'Customer Deleted (Alert)',
    value: 'CustomerDeleted',
    feature: 'Customer',
    category: 'ALERT',
    syslogSeverity: '1',
  },

  // Customer Contact events
  {
    name: 'Customer Contact Created',
    value: 'CustomerContactCreated',
    feature: 'CustomerContact',
    category: 'AUDIT',
    syslogSeverity: '6',
  },
  {
    name: 'Customer Contact Updated',
    value: 'CustomerContactUpdated',
    feature: 'CustomerContact',
    category: 'AUDIT',
    syslogSeverity: '5',
  },
  {
    name: 'Customer Contact Deleted',
    value: 'CustomerContactDeleted',
    feature: 'CustomerContact',
    category: 'AUDIT',
    syslogSeverity: '5',
  },

  // Service Plan events
  {
    name: 'Service Plan Created',
    value: 'ServicePlanCreated',
    feature: 'ServicePlan',
    category: 'AUDIT',
    syslogSeverity: '6',
  },
  {
    name: 'Service Plan Updated',
    value: 'ServicePlanUpdated',
    feature: 'ServicePlan',
    category: 'AUDIT',
    syslogSeverity: '5',
  },
  {
    name: 'Service Plan Deleted',
    value: 'ServicePlanDeleted',
    feature: 'ServicePlan',
    category: 'AUDIT',
    syslogSeverity: '5',
  },

  // Tenant events
  {
    name: 'Tenant Created',
    value: 'TenantCreated',
    feature: 'Tenant',
    category: 'AUDIT',
    syslogSeverity: '6',
  },
  {
    name: 'Tenant Updated',
    value: 'TenantUpdated',
    feature: 'Tenant',
    category: 'AUDIT',
    syslogSeverity: '5',
  },
  {
    name: 'Tenant Deleted (Audit)',
    value: 'TenantDeleted',
    feature: 'Tenant',
    category: 'AUDIT',
    syslogSeverity: '5',
  },
  {
    name: 'Tenant Deleted (Alert)',
    value: 'TenantDeleted',
    feature: 'Tenant',
    category: 'ALERT',
    syslogSeverity: '1',
  },
  {
    name: 'Tenant Suspended',
    value: 'TenantSuspended',
    feature: 'Tenant',
    category: 'EVENT',
    syslogSeverity: '4',
  },
  {
    name: 'Tenant Resumed',
    value: 'TenantResumed',
    feature: 'Tenant',
    category: 'EVENT',
    syslogSeverity: '5',
  },
  {
    name: 'Tenant Deletion Initiated',
    value: 'TenantDeletionInitiated',
    feature: 'Tenant',
    category: 'EVENT',
    syslogSeverity: '4',
  },
  {
    name: 'Tenant Deletion Initiated (Alert)',
    value: 'TenantDeletionInitiated',
    feature: 'Tenant',
    category: 'ALERT',
    syslogSeverity: '2',
  },
  {
    name: 'Tenant Deletion Cancelled',
    value: 'TenantDeletionCancelled',
    feature: 'Tenant',
    category: 'EVENT',
    syslogSeverity: '6',
  },
  {
    name: 'Tenant Deletion Cancelled (Alert)',
    value: 'TenantDeletionCancelled',
    feature: 'Tenant',
    category: 'ALERT',
    syslogSeverity: '6',
  },
  {
    name: 'Tenant Immediate Deletion Initiated',
    value: 'TenantImmediateDeletionInitiated',
    feature: 'Tenant',
    category: 'ALERT',
    syslogSeverity: '1',
  },

  // Settings events
  {
    name: 'SSO Configuration Updated',
    value: 'SSOConfigurationUpdated',
    feature: 'Settings',
    category: 'AUDIT',
    syslogSeverity: '5',
  },

  // Compliance events
  {
    name: 'Non Compliant Workload',
    value: 'NonCompliantWorkload',
    feature: 'Customer',
    category: 'ALERT',
    syslogSeverity: '4',
  },
  {
    name: 'Non Compliant Min Backup Frequency Limit',
    value: 'NonCompliantMinBackupFrequencyLimit',
    feature: 'Customer',
    category: 'ALERT',
    syslogSeverity: '4',
  },
  {
    name: 'Non Compliant Max Backup Frequency Limit',
    value: 'NonCompliantMaxBackupFrequencyLimit',
    feature: 'Customer',
    category: 'ALERT',
    syslogSeverity: '4',
  },
  {
    name: 'Non Compliant Min Retention Limit',
    value: 'NonCompliantMinRetentionLimit',
    feature: 'Customer',
    category: 'ALERT',
    syslogSeverity: '4',
  },
  {
    name: 'Non Compliant Max Retention Limit',
    value: 'NonCompliantMaxRetentionLimit',
    feature: 'Customer',
    category: 'ALERT',
    syslogSeverity: '4',
  },

  // MSP License events
  {
    name: 'Commercial License About To Expire MSP',
    value: 'CommercialLicenseAboutToExpireMSP',
    feature: 'MSP',
    category: 'ALERT',
    syslogSeverity: '2',
  },
  {
    name: 'Commercial License Expired MSP',
    value: 'CommercialLicenseExpiredMSP',
    feature: 'MSP',
    category: 'ALERT',
    syslogSeverity: '1',
  },
  {
    name: 'Commercial License Expiry Reminder MSP',
    value: 'CommercialLicenseExpiryReminderMSP',
    feature: 'MSP',
    category: 'ALERT',
    syslogSeverity: '4',
  },
  {
    name: 'Commercial License Renewed MSP',
    value: 'CommercialLicenseRenewedMSP',
    feature: 'MSP',
    category: 'ALERT',
    syslogSeverity: '6',
  },
  {
    name: 'Credit Utilization Warning MSP',
    value: 'CreditUtilizationWarningMSP',
    feature: 'MSP',
    category: 'ALERT',
    syslogSeverity: '4',
  },
  {
    name: 'Credit Utilization Critical MSP',
    value: 'CreditUtilizationCriticalMSP',
    feature: 'MSP',
    category: 'ALERT',
    syslogSeverity: '2',
  },

  // Tenant License events
  {
    name: 'Commercial License Expiry Reminder Tenant',
    value: 'CommercialLicenseExpiryReminderTenant',
    feature: 'Tenant',
    category: 'ALERT',
    syslogSeverity: '4',
  },
  {
    name: 'Commercial License About To Expire Tenant',
    value: 'CommercialLicenseAboutToExpireTenant',
    feature: 'Tenant',
    category: 'ALERT',
    syslogSeverity: '2',
  },
  {
    name: 'Commercial License Expired Tenant',
    value: 'CommercialLicenseExpiredTenant',
    feature: 'Tenant',
    category: 'ALERT',
    syslogSeverity: '1',
  },
  {
    name: 'Commercial License Renewed Tenant',
    value: 'CommercialLicenseRenewedTenant',
    feature: 'Tenant',
    category: 'ALERT',
    syslogSeverity: '6',
  },
  {
    name: 'POC License Expiry Reminder',
    value: 'POCLicenseExpiryReminder',
    feature: 'Tenant',
    category: 'ALERT',
    syslogSeverity: '4',
  },
  {
    name: 'POC License About To Expire Tenant',
    value: 'POCLicenseAboutToExpireTenant',
    feature: 'Tenant',
    category: 'ALERT',
    syslogSeverity: '2',
  },
  {
    name: 'POC License Expired Tenant',
    value: 'POCLicenseExpiredTenant',
    feature: 'Tenant',
    category: 'ALERT',
    syslogSeverity: '1',
  },
  {
    name: 'POC License Renewed Tenant',
    value: 'POCLicenseRenewedTenant',
    feature: 'Tenant',
    category: 'ALERT',
    syslogSeverity: '6',
  },
  {
    name: 'Credit Utilization Warning Tenant',
    value: 'CreditUtilizationWarningTenant',
    feature: 'Tenant',
    category: 'ALERT',
    syslogSeverity: '4',
  },
  {
    name: 'Credit Utilization Critical Tenant',
    value: 'CreditUtilizationCriticalTenant',
    feature: 'Tenant',
    category: 'ALERT',
    syslogSeverity: '2',
  },
  {
    name: 'Credit Expiry Date Extension',
    value: 'CreditExpiryDateExtension',
    feature: 'Tenant',
    category: 'ALERT',
    syslogSeverity: '6',
  },
];

// Define the operations for the Event resource
export const eventOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['event'],
      },
    },
    options: [
      {
        name: 'Get Many MSP Events',
        value: 'getManyMspEvents',
        action: 'Get many MSP events',
        description: 'Retrieve all events at the MSP level',
      },
      {
        name: 'Get Many Customer Events',
        value: 'getManyCustomerEvents',
        action: 'Get many customer events',
        description: 'Retrieve all events for a specific customer',
      },
    ],
    default: 'getManyMspEvents',
  },
];

// Define the fields for the Event resource operations
export const eventFields: INodeProperties[] = [
  /* -------------------------------------------------------------------------- */
  /*                             event:getManyCustomerEvents                    */
  /* -------------------------------------------------------------------------- */
  {
    displayName: 'Customer ID',
    name: 'customerId',
    type: 'options',
    typeOptions: {
      loadOptionsMethod: 'getCustomers',
    },
    required: true,
    displayOptions: {
      show: {
        resource: ['event'],
        operation: ['getManyCustomerEvents'],
      },
    },
    default: '',
    description: 'The unique identifier of the customer whose events to retrieve',
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
        resource: ['event'],
        operation: ['getManyMspEvents', 'getManyCustomerEvents'],
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
        resource: ['event'],
        operation: ['getManyMspEvents', 'getManyCustomerEvents'],
        returnAll: [false],
      },
    },
    default: 50,
    description: 'Max number of results to return',
  },

  /* -------------------------------------------------------------------------- */
  /*                     Date Selection (at top of filtering options)           */
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
    displayOptions: {
      show: {
        resource: ['event'],
        operation: ['getManyMspEvents', 'getManyCustomerEvents'],
      },
    },
    description:
      'Choose whether to use specific dates, relative date ranges, or include all dates (no date filter)',
  },
  {
    displayName: 'Start Date',
    name: 'startDate',
    type: 'dateTime',
    displayOptions: {
      show: {
        resource: ['event'],
        operation: ['getManyMspEvents', 'getManyCustomerEvents'],
        dateSelectionMethod: ['specificDates'],
      },
    },
    default: '',
    description: 'Start date for filtering events (inclusive)',
  },
  {
    displayName: 'End Date',
    name: 'endDate',
    type: 'dateTime',
    displayOptions: {
      show: {
        resource: ['event'],
        operation: ['getManyMspEvents', 'getManyCustomerEvents'],
        dateSelectionMethod: ['specificDates'],
      },
    },
    default: '',
    description: 'End date for filtering events (inclusive)',
  },
  {
    displayName: 'Date Range',
    name: 'relativeDateRange',
    type: 'options',
    displayOptions: {
      show: {
        resource: ['event'],
        operation: ['getManyMspEvents', 'getManyCustomerEvents'],
        dateSelectionMethod: ['relativeDates'],
      },
    },
    options: [...RELATIVE_DATE_RANGE_OPTIONS],
    default: 'previousMonth1',
    description: 'Select a predefined date range for filtering events',
  },

  /* -------------------------------------------------------------------------- */
  /*                     Filtering Options (both operations)                    */
  /* -------------------------------------------------------------------------- */
  {
    displayName: 'Filter by Category',
    name: 'filterByCategory',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['event'],
        operation: ['getManyMspEvents', 'getManyCustomerEvents'],
      },
    },
    default: false,
    description: 'Whether to filter events by category',
  },
  {
    displayName: 'Category',
    name: 'category',
    type: 'multiOptions',
    displayOptions: {
      show: {
        resource: ['event'],
        operation: ['getManyMspEvents', 'getManyCustomerEvents'],
        filterByCategory: [true],
      },
    },
    default: [],
    description: 'The categories of events to return',
    options: EVENT_CATEGORIES,
  },
  {
    displayName: 'Filter by Event Type',
    name: 'filterByEventType',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['event'],
        operation: ['getManyMspEvents', 'getManyCustomerEvents'],
      },
    },
    default: false,
    description: 'Whether to filter events by event type',
  },
  {
    displayName: 'Event Type',
    name: 'eventType',
    type: 'multiOptions',
    displayOptions: {
      show: {
        resource: ['event'],
        operation: ['getManyMspEvents', 'getManyCustomerEvents'],
        filterByEventType: [true],
      },
    },
    default: [],
    description: 'The specific types of events to return',
    options: EVENT_TYPES,
  },
  {
    displayName: 'Filter by Feature',
    name: 'filterByFeature',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['event'],
        operation: ['getManyMspEvents', 'getManyCustomerEvents'],
      },
    },
    default: false,
    description: 'Whether to filter events by feature',
  },
  {
    displayName: 'Feature',
    name: 'feature',
    type: 'multiOptions',
    displayOptions: {
      show: {
        resource: ['event'],
        operation: ['getManyMspEvents', 'getManyCustomerEvents'],
        filterByFeature: [true],
      },
    },
    default: [],
    description: 'The features or components the events are related to',
    options: [
      { name: 'Admin', value: 'Admin' },
      { name: 'Client', value: 'Client' },
      { name: 'Customer', value: 'Customer' },
      { name: 'Customer Contact', value: 'CustomerContact' },
      { name: 'Service Plan', value: 'ServicePlan' },
      { name: 'Settings', value: 'Settings' },
      { name: 'Tenant', value: 'Tenant' },
      { name: 'MSP', value: 'MSP' },
    ],
  },
  {
    displayName: 'Filter by Severity',
    name: 'filterBySeverity',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['event'],
        operation: ['getManyMspEvents', 'getManyCustomerEvents'],
      },
    },
    default: false,
    description: 'Whether to filter events by severity level',
  },
  {
    displayName: 'Severity',
    name: 'severity',
    type: 'multiOptions',
    displayOptions: {
      show: {
        resource: ['event'],
        operation: ['getManyMspEvents', 'getManyCustomerEvents'],
        filterBySeverity: [true],
      },
    },
    default: [],
    description: 'The severity levels of events to return',
    options: [
      { name: 'Emergency (0)', value: '0' },
      { name: 'Alert (1)', value: '1' },
      { name: 'Critical (2)', value: '2' },
      { name: 'Error (3)', value: '3' },
      { name: 'Warning (4)', value: '4' },
      { name: 'Notice (5)', value: '5' },
      { name: 'Informational (6)', value: '6' },
      { name: 'Debug (7)', value: '7' },
    ],
  },
  {
    displayName: 'Filter by Initiator',
    name: 'filterByInitiator',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['event'],
        operation: ['getManyMspEvents', 'getManyCustomerEvents'],
      },
    },
    default: false,
    description: 'Whether to filter events by who initiated them',
  },
  {
    displayName: 'Initiated By',
    name: 'initiatedBy',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['event'],
        operation: ['getManyMspEvents', 'getManyCustomerEvents'],
        filterByInitiator: [true],
      },
    },
    default: '',
    description:
      'Filter events by who initiated them - applies to AUDIT category events. Searches in the initiatorName and initiatorId fields in event details.',
  },

  /* -------------------------------------------------------------------------- */
  /*                       Output Options (both operations)                     */
  /* -------------------------------------------------------------------------- */
  {
    displayName: 'Options',
    name: 'options',
    type: 'collection',
    placeholder: 'Add Option',
    default: {},
    displayOptions: {
      show: {
        resource: ['event'],
        operation: ['getManyMspEvents', 'getManyCustomerEvents'],
      },
    },
    options: [
      {
        displayName: 'Include Details',
        name: 'includeDetails',
        type: 'boolean',
        default: true,
        description: 'Whether to include the full details of each event',
      },
      {
        displayName: 'Format Timestamps',
        name: 'formatTimestamps',
        type: 'boolean',
        default: true,
        description: 'Whether to convert timestamps to a readable format',
      },
    ],
  },
];
