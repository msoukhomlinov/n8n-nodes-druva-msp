import type { INodeProperties } from "n8n-workflow";
import { RELATIVE_DATE_RANGE_OPTIONS } from "./helpers/Constants";

// Define the operations for the Report - Enterprise Workloads resource
export const reportEnterpriseOperations: INodeProperties[] = [
  {
    displayName: "Operation",
    name: "operation",
    type: "options",
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ["reportEnterprise"],
      },
    },
    options: [
      {
        name: "Get Alert History Report",
        value: "getAlertHistoryReport",
        description: "Retrieve alert history information",
        action: "Get alert history report",
      },
      {
        name: "Get Backup Activity Report",
        value: "getBackupActivityReport",
        description: "Retrieve backup activity for enterprise workloads",
        action: "Get backup activity report",
      },
      {
        name: "Get DR Failback Activity Report",
        value: "getDRFailbackActivityReport",
        description: "Retrieve disaster recovery failback activity",
        action: "Get DR failback activity report",
      },
      {
        name: "Get DR Failover Activity Report",
        value: "getDRFailoverActivityReport",
        description: "Retrieve disaster recovery failover activity",
        action: "Get DR failover activity report",
      },
      {
        name: "Get DR Replication Activity Report",
        value: "getDRReplicationActivityReport",
        description: "Retrieve disaster recovery replication activity",
        action: "Get DR replication activity report",
      },
      {
        name: "Get Resource Status Report",
        value: "getResourceStatusReport",
        description: "Retrieve resource status information",
        action: "Get resource status report",
      },
      {
        name: "Get Storage Consumption by BackupSets Report",
        value: "getStorageConsumptionByBackupSetsReport",
        description:
          "Retrieve Backup Set wise storage consumption details for individual resources in the organization of MSP customers",
        action: "Get storage consumption by backup sets report",
      },
      {
        name: "Get Google Alerts Report",
        value: "getGoogleAlerts",
        description:
          "Retrieve alert details including types, severities, and occurrence dates for Google Workspace",
        action: "Get Google alerts report",
      },
      {
        name: "Get Google License Usage Report",
        value: "getGoogleLicenseUsage",
        description:
          "Retrieve weekly and monthly counts of active and preserved licenses for Google Workspace",
        action: "Get Google license usage report",
      },
      {
        name: "Get Google Preserved Users Datasources Report",
        value: "getGooglePreservedUsersDatasources",
        description:
          "Retrieve details about preserved users including consumed workloads and preservation dates for Google Workspace",
        action: "Get Google preserved users datasources report",
      },
      {
        name: "Get Google Shared Drive Backup Activity Report",
        value: "getGoogleSharedDriveBackupActivity",
        description:
          "Retrieve daily trends and details of backup activities on Google Shared Drive",
        action: "Get Google shared drive backup activity report",
      },
      {
        name: "Get Google Shared Drive Restore Activity Report",
        value: "getGoogleSharedDriveRestoreActivity",
        description:
          "Retrieve daily trends and details of restore activities on Google Shared Drive",
        action: "Get Google shared drive restore activity report",
      },
      {
        name: "Get Google Storage Consumption Report",
        value: "getGoogleStorageConsumption",
        description:
          "Retrieve workload-specific storage consumption details for Google Workspace",
        action: "Get Google storage consumption report",
      },
      {
        name: "Get Google User Count and Status Report",
        value: "getGoogleUserCountAndStatus",
        description:
          "Retrieve weekly and monthly counts of users added, preserved, and deleted for Google Workspace",
        action: "Get Google user count and status report",
      },
      {
        name: "Get Google User Last Backup Status Report",
        value: "getGoogleUserLastBackupStatus",
        description:
          "Retrieve last backup status and details for user workloads in Google Workspace",
        action: "Get Google user last backup status report",
      },
      {
        name: "Get Google User Provisioning Report",
        value: "getGoogleUserProvisioning",
        description:
          "Retrieve information about users provisioned in Google Workspace",
        action: "Get Google user provisioning report",
      },
      {
        name: "Get Google User Restore Activity Report",
        value: "getGoogleUserRestoreActivity",
        description:
          "Retrieve status and details of all restore jobs for user workloads in Google Workspace",
        action: "Get Google user restore activity report",
      },
      {
        name: "Get Google User Workload Report",
        value: "getGoogleUserWorkload",
        description:
          "Retrieve backup status, activity logs, and summary for user workloads in Google Workspace",
        action: "Get Google user workload report",
      },
      {
        name: "Get M365 Alerts Report",
        value: "getM365Alerts",
        description:
          "Retrieve alert details including types, severities, and occurrence dates for Microsoft 365",
        action: "Get M365 alerts report",
      },
      {
        name: "Get M365 Groups Backup Activity Report",
        value: "getM365GroupsBackupActivity",
        description:
          "Retrieve daily trends and details of backup activities for Microsoft 365 Groups",
        action: "Get M365 groups backup activity report",
      },
      {
        name: "Get M365 Groups Discovery Report",
        value: "getM365GroupsDiscovery",
        description:
          "Retrieve backup and storage consumption details for active and disabled Microsoft 365 Groups",
        action: "Get M365 groups discovery report",
      },
      {
        name: "Get M365 License Usage Report",
        value: "getM365LicenseUsage",
        description:
          "Retrieve weekly and monthly counts of active and preserved licenses for Microsoft 365",
        action: "Get M365 license usage report",
      },
      {
        name: "Get M365 Preserved Users Datasources Report",
        value: "getM365PreservedUsersDatasources",
        description:
          "Retrieve details about preserved users including consumed workloads and preservation dates for Microsoft 365",
        action: "Get M365 preserved users datasources report",
      },
      {
        name: "Get M365 Public Folder Backup Activity Report",
        value: "getM365PublicFolderBackupActivity",
        description:
          "Retrieve daily trends and details of backup activities for Microsoft 365 Public Folders",
        action: "Get M365 public folder backup activity report",
      },
      {
        name: "Get M365 SharePoint Backup Activity Report",
        value: "getM365SharePointBackupActivity",
        description:
          "Retrieve daily trends and details of backup activities for Microsoft 365 SharePoint",
        action: "Get M365 SharePoint backup activity report",
      },
      {
        name: "Get M365 SharePoint Site Discovery Report",
        value: "getM365SharePointSiteDiscovery",
        description:
          "Retrieve backup and storage consumption details for SharePoint sites",
        action: "Get M365 SharePoint site discovery report",
      },
      {
        name: "Get M365 Storage Consumption Report",
        value: "getM365StorageConsumptionReport",
        description: "Retrieve Microsoft 365 storage consumption details",
        action: "Get M365 storage consumption report",
      },
      {
        name: "Get M365 Teams Backup Activity Report",
        value: "getM365TeamsBackupActivity",
        description:
          "Retrieve daily trends and details of backup activities for Microsoft 365 Teams",
        action: "Get M365 Teams backup activity report",
      },
      {
        name: "Get M365 Teams Discovery Report",
        value: "getM365TeamsDiscovery",
        description:
          "Retrieve backup and storage consumption details for active and disabled Microsoft Teams",
        action: "Get M365 Teams discovery report",
      },
      {
        name: "Get M365 User Count and Status Report",
        value: "getM365UserCountAndStatus",
        description:
          "Retrieve weekly and monthly counts of users added, preserved, and deleted for Microsoft 365",
        action: "Get M365 user count and status report",
      },
      {
        name: "Get M365 User Last Backup Status Report",
        value: "getM365UserLastBackupStatus",
        description:
          "Retrieve last backup status and details for user workloads in Microsoft 365",
        action: "Get M365 user last backup status report",
      },
      {
        name: "Get M365 User Provisioning Report",
        value: "getM365UserProvisioning",
        description:
          "Retrieve user details and licensed workload storage consumption for Microsoft 365",
        action: "Get M365 user provisioning report",
      },
      {
        name: "Get M365 User Restore Activity Report",
        value: "getM365UserRestoreActivity",
        description:
          "Retrieve status and details of all restore jobs for user workloads in Microsoft 365",
        action: "Get M365 user restore activity report",
      },
      {
        name: "Get M365 User Workload Report",
        value: "getM365UserWorkload",
        description:
          "Retrieve backup status, activity logs, and summary for user workloads in Microsoft 365",
        action: "Get M365 user workload report",
      },
    ],
    default: "getAlertHistoryReport",
  },
];

// Define the fields for the Report - Enterprise Workloads resource operations
export const reportEnterpriseFields: INodeProperties[] = [
  /* Common Fields for All Report Operations */

  // Return All / Limit fields
  {
    displayName: "Return All",
    name: "returnAll",
    type: "boolean",
    displayOptions: {
      show: {
        resource: ["reportEnterprise"],
      },
    },
    default: false,
    description: "Whether to return all results or only up to a given limit",
  },
  {
    displayName: "Limit",
    name: "limit",
    type: "number",
    displayOptions: {
      show: {
        resource: ["reportEnterprise"],
        returnAll: [false],
      },
    },
    typeOptions: {
      minValue: 1,
      maxValue: 100,
    },
    default: 50,
    description: "Max number of results to return",
  },

  // Date Selection Method - aligned with Events resource
  {
    displayName: "Date Selection Method",
    name: "dateSelectionMethod",
    type: "options",
    options: [
      {
        name: "No Date Filter",
        value: "noDates",
      },
      {
        name: "Specific Dates",
        value: "specificDates",
      },
      {
        name: "Relative Date Range",
        value: "relativeDates",
      },
    ],
    default: "relativeDates",
    displayOptions: {
      show: {
        resource: ["reportEnterprise"],
      },
    },
    description:
      "Choose whether to use specific dates, relative date ranges, or include all dates (no date filter)",
  },

  // Specific Dates selection - aligned with Events resource
  {
    displayName: "Start Date",
    name: "startDate",
    type: "dateTime",
    displayOptions: {
      show: {
        resource: ["reportEnterprise"],
        dateSelectionMethod: ["specificDates"],
      },
    },
    default: "",
    description: "Start date for filtering report data (inclusive)",
  },
  {
    displayName: "End Date",
    name: "endDate",
    type: "dateTime",
    displayOptions: {
      show: {
        resource: ["reportEnterprise"],
        dateSelectionMethod: ["specificDates"],
      },
    },
    default: "",
    description: "End date for filtering report data (inclusive)",
  },

  // Relative Date Range selection - aligned with Events resource
  {
    displayName: "Date Range",
    name: "relativeDateRange",
    type: "options",
    displayOptions: {
      show: {
        resource: ["reportEnterprise"],
        dateSelectionMethod: ["relativeDates"],
      },
    },
    options: [...RELATIVE_DATE_RANGE_OPTIONS],
    default: "previousMonth1",
    description: "Select a predefined date range for filtering report data",
  },

  // Customer Filter - aligned with Events resource
  {
    displayName: "Filter by Customer(s)",
    name: "filterByCustomers",
    type: "boolean",
    displayOptions: {
      show: {
        resource: ["reportEnterprise"],
      },
    },
    default: false,
    description: "Whether to filter results by specific customers",
  },
  {
    displayName: "Customer IDs",
    name: "customerIds",
    type: "multiOptions",
    typeOptions: {
      loadOptionsMethod: "getCustomers",
    },
    displayOptions: {
      show: {
        resource: ["reportEnterprise"],
        filterByCustomers: [true],
      },
    },
    default: [],
    description: "ID of the customer(s) to filter by",
  },

  /* Fields specific to Backup Activity Report */
  {
    displayName: "Filter by Workload Types",
    name: "filterByWorkloadTypes",
    type: "boolean",
    displayOptions: {
      show: {
        resource: ["reportEnterprise"],
        operation: [
          "getBackupActivityReport",
          "getResourceStatusReport",
          "getAlertHistoryReport",
          "getStorageConsumptionByBackupSetsReport",
        ],
      },
    },
    default: false,
    description: "Whether to filter by workload types",
  },
  {
    displayName: "Workload Types",
    name: "workloadTypes",
    type: "multiOptions",
    typeOptions: {
      loadOptionsMethod: "getWorkloadTypes",
    },
    displayOptions: {
      show: {
        resource: ["reportEnterprise"],
        operation: [
          "getBackupActivityReport",
          "getResourceStatusReport",
          "getAlertHistoryReport",
          "getStorageConsumptionByBackupSetsReport",
        ],
        filterByWorkloadTypes: [true],
      },
    },
    default: [],
    description:
      "Types of workloads to filter by. For Alert History, this filters by Alert Type.",
  },
  {
    displayName: "Filter by Backup Status",
    name: "filterByBackupStatus",
    type: "boolean",
    displayOptions: {
      show: {
        resource: ["reportEnterprise"],
        operation: ["getBackupActivityReport"],
      },
    },
    default: false,
    description: "Whether to filter by backup status",
  },
  {
    displayName: "Backup Status",
    name: "backupStatus",
    type: "multiOptions",
    typeOptions: {
      loadOptionsMethod: "getBackupStatuses",
    },
    displayOptions: {
      show: {
        resource: ["reportEnterprise"],
        operation: ["getBackupActivityReport"],
        filterByBackupStatus: [true],
      },
    },
    default: [],
    description: "Backup status values to filter by",
  },

  /* Fields specific to DR Reports */
  {
    displayName: "Filter by DR Plan IDs",
    name: "filterByDRPlanIds",
    type: "boolean",
    displayOptions: {
      show: {
        resource: ["reportEnterprise"],
        operation: [
          "getDRFailbackActivityReport",
          "getDRReplicationActivityReport",
        ],
      },
    },
    default: false,
    description: "Whether to filter by DR plan IDs",
  },
  {
    displayName: "DR Plan IDs",
    name: "drPlanIds",
    type: "string",
    typeOptions: {
      multipleValues: true,
    },
    displayOptions: {
      show: {
        resource: ["reportEnterprise"],
        operation: [
          "getDRFailbackActivityReport",
          "getDRReplicationActivityReport",
        ],
        filterByDRPlanIds: [true],
      },
    },
    default: [],
    description: "IDs of DR plans to filter by",
  },

  /* Fields specific to DR Replication Activity Report */
  {
    displayName: "Filter by Replication Status",
    name: "filterByReplicationStatus",
    type: "boolean",
    displayOptions: {
      show: {
        resource: ["reportEnterprise"],
        operation: ["getDRReplicationActivityReport"],
      },
    },
    default: false,
    description: "Whether to filter by replication status",
  },
  {
    displayName: "Replication Status",
    name: "replicationStatus",
    type: "multiOptions",
    options: [
      {
        name: "Success",
        value: "SUCCESS",
      },
      {
        name: "Failed",
        value: "FAILED",
      },
      {
        name: "In Progress",
        value: "IN_PROGRESS",
      },
    ],
    displayOptions: {
      show: {
        resource: ["reportEnterprise"],
        operation: ["getDRReplicationActivityReport"],
        filterByReplicationStatus: [true],
      },
    },
    default: [],
    description: "Replication status values to filter by",
  },

  /* Fields specific to Resource Status Report */
  {
    displayName: "Filter by Resource Status",
    name: "filterByResourceStatus",
    type: "boolean",
    displayOptions: {
      show: {
        resource: ["reportEnterprise"],
        operation: ["getResourceStatusReport"],
      },
    },
    default: false,
    description: "Whether to filter by resource status",
  },
  {
    displayName: "Resource Status",
    name: "resourceStatus",
    type: "multiOptions",
    typeOptions: {
      loadOptionsMethod: "getResourceStatuses",
    },
    displayOptions: {
      show: {
        resource: ["reportEnterprise"],
        operation: ["getResourceStatusReport"],
        filterByResourceStatus: [true],
      },
    },
    default: [],
    description: "Resource status values to filter by",
  },
  {
    displayName: "Filter by Resource Types",
    name: "filterByResourceTypes",
    type: "boolean",
    displayOptions: {
      show: {
        resource: ["reportEnterprise"],
        operation: ["getResourceStatusReport"],
      },
    },
    default: false,
    description: "Whether to filter by resource types",
  },
  {
    displayName: "Resource Type",
    name: "resourceType",
    type: "multiOptions",
    typeOptions: {
      loadOptionsMethod: "getResourceTypes",
    },
    displayOptions: {
      show: {
        resource: ["reportEnterprise"],
        operation: ["getResourceStatusReport"],
        filterByResourceTypes: [true],
      },
    },
    default: [],
    description: "Resource types to filter by",
  },

  /* Fields specific to Alert History Report */
  {
    displayName: "Filter by Alert Severity",
    name: "filterByAlertSeverity",
    type: "boolean",
    displayOptions: {
      show: {
        resource: ["reportEnterprise"],
        operation: ["getAlertHistoryReport"],
      },
    },
    default: false,
    description: "Whether to filter by alert severity",
  },
  {
    displayName: "Alert Severity",
    name: "alertSeverity",
    type: "multiOptions",
    options: [
      {
        name: "Critical",
        value: "CRITICAL",
      },
      {
        name: "Warning",
        value: "WARNING",
      },
      {
        name: "Info",
        value: "INFO",
      },
    ],
    displayOptions: {
      show: {
        resource: ["reportEnterprise"],
        operation: ["getAlertHistoryReport"],
        filterByAlertSeverity: [true],
      },
    },
    default: [],
    description:
      "Alert severity levels to filter by (will be converted to Critical/Warning/Info format expected by API)",
  },

  /* Fields specific to M365 Storage Consumption Report */
  {
    displayName: "Filter by Workload Name",
    name: "filterByWorkloadName",
    type: "boolean",
    displayOptions: {
      show: {
        resource: ["reportEnterprise"],
        operation: ["getM365StorageConsumptionReport"],
      },
    },
    default: false,
    description: "Whether to filter by Microsoft 365 workload name",
  },
  {
    displayName: "Workload Name",
    name: "workloadName",
    type: "multiOptions",
    options: [
      {
        name: "SharePoint",
        value: "SharePoint",
      },
      {
        name: "OneDrive",
        value: "OneDrive",
      },
      {
        name: "Exchange",
        value: "Exchange",
      },
      {
        name: "Teams",
        value: "Teams",
      },
    ],
    displayOptions: {
      show: {
        resource: ["reportEnterprise"],
        operation: ["getM365StorageConsumptionReport"],
        filterByWorkloadName: [true],
      },
    },
    default: [],
    description: "Microsoft 365 workload names to filter by",
  },
];
