// src/nodes/DruvaMSP/BackupHealthSummary.node.options.ts
import type { INodeProperties } from "n8n-workflow";
import { RELATIVE_DATE_RANGE_OPTIONS } from "./helpers/Constants";

export const backupHealthSummaryOperations: INodeProperties[] = [
  {
    displayName: "Operation",
    name: "operation",
    type: "options",
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ["backupHealthSummary"],
      },
    },
    options: [
      {
        name: "Get Backup Health by Customer",
        value: "getBackupHealthByCustomer",
        action: "Get backup health summary by customer",
        description:
          "Aggregate endpoint last backup status into a per-customer health summary with success rates and device counts",
      },
    ],
    default: "getBackupHealthByCustomer",
  },
];

export const backupHealthSummaryFields: INodeProperties[] = [
  /* -------------------------------------------------------------------------- */
  /*                          Date Range                                        */
  /* -------------------------------------------------------------------------- */
  {
    displayName: "Date Selection Method",
    name: "dateSelectionMethod",
    type: "options",
    options: [
      { name: "All Dates", value: "allDates" },
      { name: "Specific Dates", value: "specificDates" },
      { name: "Relative Date Range", value: "relativeDates" },
    ],
    default: "relativeDates",
    description:
      "Choose whether to filter backup status records by last backup date",
    displayOptions: {
      show: {
        resource: ["backupHealthSummary"],
        operation: ["getBackupHealthByCustomer"],
      },
    },
  },
  {
    displayName: "Start Date",
    name: "startDate",
    type: "dateTime",
    required: true,
    displayOptions: {
      show: {
        resource: ["backupHealthSummary"],
        operation: ["getBackupHealthByCustomer"],
        dateSelectionMethod: ["specificDates"],
      },
    },
    default: "",
    description: "Start of the date range",
  },
  {
    displayName: "End Date",
    name: "endDate",
    type: "dateTime",
    required: true,
    displayOptions: {
      show: {
        resource: ["backupHealthSummary"],
        operation: ["getBackupHealthByCustomer"],
        dateSelectionMethod: ["specificDates"],
      },
    },
    default: "",
    description: "End of the date range",
  },
  {
    displayName: "Date Range",
    name: "relativeDateRange",
    type: "options",
    displayOptions: {
      show: {
        resource: ["backupHealthSummary"],
        operation: ["getBackupHealthByCustomer"],
        dateSelectionMethod: ["relativeDates"],
      },
    },
    options: [...RELATIVE_DATE_RANGE_OPTIONS],
    default: "last30Days",
    required: true,
    description: "Predefined relative date range",
  },

  /* -------------------------------------------------------------------------- */
  /*                          Customer Filter                                   */
  /* -------------------------------------------------------------------------- */
  {
    displayName: "Filter by Customers",
    name: "filterByCustomers",
    type: "boolean",
    displayOptions: {
      show: {
        resource: ["backupHealthSummary"],
        operation: ["getBackupHealthByCustomer"],
      },
    },
    default: false,
    description: "Whether to restrict results to specific customer IDs",
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
        resource: ["backupHealthSummary"],
        operation: ["getBackupHealthByCustomer"],
        filterByCustomers: [true],
      },
    },
    default: [],
    required: true,
    description: "Customers to include in the health summary",
  },

  /* -------------------------------------------------------------------------- */
  /*                          Health Threshold                                  */
  /* -------------------------------------------------------------------------- */
  {
    displayName: "Critical Failure Threshold (%)",
    name: "criticalThresholdPercent",
    type: "number",
    displayOptions: {
      show: {
        resource: ["backupHealthSummary"],
        operation: ["getBackupHealthByCustomer"],
      },
    },
    typeOptions: {
      minValue: 0,
      maxValue: 100,
    },
    default: 10,
    description:
      "Percentage of failed endpoint devices above which the customer is marked as critical (0–100)",
  },

  /* -------------------------------------------------------------------------- */
  /*                          Output Filter                                     */
  /* -------------------------------------------------------------------------- */
  {
    displayName: "Return Level",
    name: "returnLevel",
    type: "options",
    displayOptions: {
      show: {
        resource: ["backupHealthSummary"],
        operation: ["getBackupHealthByCustomer"],
      },
    },
    options: [
      {
        name: "All Customers",
        value: "allCustomers",
        description: "Return health summary for every customer",
      },
      {
        name: "Unhealthy Only (Warning or Critical)",
        value: "unhealthyOnly",
        description:
          "Return only customers with warning or critical health status",
      },
      {
        name: "Critical Only",
        value: "criticalOnly",
        description: "Return only customers with critical health status",
      },
    ],
    default: "allCustomers",
    description: "Controls which customers are included in the output",
  },
];
