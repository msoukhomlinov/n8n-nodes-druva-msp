// src/nodes/DruvaMSP/AlertSummary.node.options.ts
import type { INodeProperties } from "n8n-workflow";
import { RELATIVE_DATE_RANGE_OPTIONS } from "./helpers/Constants";

export const alertSummaryOperations: INodeProperties[] = [
  {
    displayName: "Operation",
    name: "operation",
    type: "options",
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ["alertSummary"],
      },
    },
    options: [
      {
        name: "Get Unified Alerts",
        value: "getUnifiedAlerts",
        action: "Get unified alerts across workloads",
        description:
          "Aggregate alerts from Endpoint, Enterprise Workloads, Microsoft 365, and Google Workspace into a single normalized feed",
      },
    ],
    default: "getUnifiedAlerts",
  },
];

export const alertSummaryFields: INodeProperties[] = [
  /* -------------------------------------------------------------------------- */
  /*                          Workload Selection                                */
  /* -------------------------------------------------------------------------- */
  {
    displayName: "Include Workloads",
    name: "includeWorkloads",
    type: "multiOptions",
    displayOptions: {
      show: {
        resource: ["alertSummary"],
        operation: ["getUnifiedAlerts"],
      },
    },
    options: [
      {
        name: "Endpoints",
        value: "endpoint",
        description: "Include alerts from mspEPAlert (Endpoints)",
      },
      {
        name: "Enterprise Workloads",
        value: "enterpriseWorkloads",
        description:
          "Include alerts from mspEWAlertHistory (Enterprise Workloads)",
      },
      {
        name: "Microsoft 365",
        value: "m365",
        description: "Include alerts from mspM365Alerts (Microsoft 365)",
      },
      {
        name: "Google Workspace",
        value: "google",
        description: "Include alerts from mspGoogleAlerts (Google Workspace)",
      },
    ],
    default: ["endpoint", "enterpriseWorkloads", "m365", "google"],
    required: true,
    description: "Select which workloads to fetch alerts from",
  },

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
    description: "Choose whether to filter alerts by date",
    displayOptions: {
      show: {
        resource: ["alertSummary"],
        operation: ["getUnifiedAlerts"],
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
        resource: ["alertSummary"],
        operation: ["getUnifiedAlerts"],
        dateSelectionMethod: ["specificDates"],
      },
    },
    default: "",
    description: "Start of the date range for alert retrieval",
  },
  {
    displayName: "End Date",
    name: "endDate",
    type: "dateTime",
    required: true,
    displayOptions: {
      show: {
        resource: ["alertSummary"],
        operation: ["getUnifiedAlerts"],
        dateSelectionMethod: ["specificDates"],
      },
    },
    default: "",
    description: "End of the date range for alert retrieval",
  },
  {
    displayName: "Date Range",
    name: "relativeDateRange",
    type: "options",
    displayOptions: {
      show: {
        resource: ["alertSummary"],
        operation: ["getUnifiedAlerts"],
        dateSelectionMethod: ["relativeDates"],
      },
    },
    options: [...RELATIVE_DATE_RANGE_OPTIONS],
    default: "last30Days",
    required: true,
    description: "Predefined relative date range for alert retrieval",
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
        resource: ["alertSummary"],
        operation: ["getUnifiedAlerts"],
      },
    },
    default: false,
    description: "Whether to restrict alerts to specific customer IDs",
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
        resource: ["alertSummary"],
        operation: ["getUnifiedAlerts"],
        filterByCustomers: [true],
      },
    },
    default: [],
    required: true,
    description: "Customers to include in the alert feed",
  },

  /* -------------------------------------------------------------------------- */
  /*                          Output Options                                    */
  /* -------------------------------------------------------------------------- */
  {
    displayName: "Return All",
    name: "returnAll",
    type: "boolean",
    displayOptions: {
      show: {
        resource: ["alertSummary"],
        operation: ["getUnifiedAlerts"],
      },
    },
    default: true,
    description: "Whether to return all alerts or a limited number",
  },
  {
    displayName: "Limit",
    name: "limit",
    type: "number",
    displayOptions: {
      show: {
        resource: ["alertSummary"],
        operation: ["getUnifiedAlerts"],
        returnAll: [false],
      },
    },
    typeOptions: {
      minValue: 1,
    },
    default: 100,
    description: "Maximum number of alerts to return across all workloads",
  },
];
