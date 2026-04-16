// src/nodes/DruvaMSP/AlertSummary.node.execute.ts
import type {
  IExecuteFunctions,
  IDataObject,
  INodeExecutionData,
} from "n8n-workflow";
import { druvaMspApiRequestAllReportItems } from "./GenericFunctions";
import { getRelativeDateRange } from "./helpers/DateHelpers";
import { logger } from "./helpers/LoggerHelper";
import { API_MAX_PAGE_SIZE } from "./helpers/Constants";

/** Unified alert record output schema */
export interface IUnifiedAlert {
  workload: string;
  customerGlobalId: string;
  customerName: string;
  accountName: string;
  entity: string;
  alertDetails: string;
  severity: string;
  timestamp: string;
  isActive: boolean;
  raw: IDataObject;
}

// ---------------------------------------------------------------------------
// Normalizers — each converts a raw API record to the unified schema
// ---------------------------------------------------------------------------

/** Normalise AlertReportData (mspEPAlert) */
export function normalizeEPAlert(raw: IDataObject): IUnifiedAlert {
  return {
    workload: "Endpoints",
    customerGlobalId: String(raw.customerGlobalId ?? ""),
    customerName: String(raw.customerName ?? ""),
    accountName: String(raw.accountName ?? ""),
    entity: String(raw.entity ?? ""),
    alertDetails: String(raw.alertDetails ?? ""),
    severity: String(raw.severity ?? ""),
    timestamp: String(raw.lastOccurrence ?? raw.firstOccurrence ?? ""),
    isActive: String(raw.active).toLowerCase() === "true",
    raw,
  };
}

/** Normalise AlertHistoryReportData (mspEWAlertHistory) */
export function normalizeEWAlertHistory(raw: IDataObject): IUnifiedAlert {
  return {
    workload: "Enterprise Workloads",
    customerGlobalId: String(raw.customerGlobalId ?? ""),
    customerName: String(raw.customerName ?? ""),
    accountName: String(raw.accountName ?? ""),
    entity: String(raw.target ?? ""),
    alertDetails: String(raw.description ?? ""),
    severity: String(raw.severity ?? ""),
    timestamp: String(raw.lastUpdatedTime ?? raw.generated ?? ""),
    isActive: !raw.resolved,
    raw,
  };
}

/** Normalise M365AlertHistoryReportData (mspM365Alerts) */
export function normalizeM365Alert(raw: IDataObject): IUnifiedAlert {
  return {
    workload: "Microsoft 365",
    customerGlobalId: String(raw.customerGlobalId ?? ""),
    customerName: String(raw.customerName ?? ""),
    accountName: String(raw.accountName ?? ""),
    entity: String(raw.entity ?? ""),
    alertDetails: String(raw.alertDetails ?? ""),
    severity: String(raw.severity ?? ""),
    timestamp: String(raw.lastUpdatedTime ?? raw.latestOccurrence ?? ""),
    isActive: String(raw.isActive).toLowerCase() === "true",
    raw,
  };
}

/** Normalise GoogleAlertHistoryReportData (mspGoogleAlerts) */
export function normalizeGoogleAlert(raw: IDataObject): IUnifiedAlert {
  return {
    workload: "Google Workspace",
    customerGlobalId: String(raw.customerGlobalId ?? ""),
    customerName: String(raw.customerName ?? ""),
    accountName: String(raw.accountName ?? ""),
    entity: String(raw.entity ?? ""),
    alertDetails: String(raw.alertDetails ?? ""),
    severity: String(raw.severity ?? ""),
    timestamp: String(raw.lastUpdatedTime ?? raw.latestOccurrence ?? ""),
    isActive: String(raw.isActive).toLowerCase() === "true",
    raw,
  };
}

// ---------------------------------------------------------------------------
// Build request body for alert endpoints (v1 report POST pattern)
// ---------------------------------------------------------------------------

function buildAlertRequestBody(
  pageSize: number,
  customerIds: string[],
  dateField: string,
  startDate: string,
  endDate: string,
): IDataObject {
  const filterBy: IDataObject[] = [];

  if (customerIds.length > 0) {
    filterBy.push({
      fieldName: "customerGlobalId",
      operator: "CONTAINS",
      value: customerIds,
    });
  }
  if (startDate) {
    filterBy.push({ fieldName: dateField, operator: "GTE", value: startDate });
  }
  if (endDate) {
    filterBy.push({ fieldName: dateField, operator: "LTE", value: endDate });
  }

  return {
    filters: {
      pageSize,
      filterBy,
    },
  };
}

// ---------------------------------------------------------------------------
// Main execute function
// ---------------------------------------------------------------------------

export async function executeAlertSummaryOperation(
  this: IExecuteFunctions,
  i: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter("operation", i) as string;

  try {
    if (operation === "getUnifiedAlerts") {
      const includeWorkloads = this.getNodeParameter("includeWorkloads", i, [
        "endpoint",
        "enterpriseWorkloads",
        "m365",
        "google",
      ]) as string[];

      // Resolve date range
      const dateSelectionMethod = this.getNodeParameter(
        "dateSelectionMethod",
        i,
        "relativeDates",
      ) as string;
      let startDate = "";
      let endDate = "";

      if (dateSelectionMethod === "specificDates") {
        startDate = this.getNodeParameter("startDate", i, "") as string;
        endDate = this.getNodeParameter("endDate", i, "") as string;
      } else if (dateSelectionMethod === "relativeDates") {
        const relativeDateRange = this.getNodeParameter(
          "relativeDateRange",
          i,
          "last30Days",
        ) as string;
        const range = getRelativeDateRange(relativeDateRange);
        startDate = range.startDate;
        endDate = range.endDate;
      }
      // if "allDates", startDate/endDate remain ""

      // Customer filter
      const filterByCustomers = this.getNodeParameter(
        "filterByCustomers",
        i,
        false,
      ) as boolean;
      const customerIds = filterByCustomers
        ? (this.getNodeParameter("customerIds", i, []) as string[])
        : [];

      const returnAll = this.getNodeParameter("returnAll", i, true) as boolean;
      const limit = returnAll
        ? 0
        : (this.getNodeParameter("limit", i, 100) as number);

      const pageSize = API_MAX_PAGE_SIZE;

      // Build per-workload request configs
      type WorkloadConfig = {
        endpoint: string;
        dateField: string;
        normalizer: (r: IDataObject) => IUnifiedAlert;
      };

      const workloadMap: Record<string, WorkloadConfig> = {
        endpoint: {
          endpoint: "/msp/reporting/v1/reports/mspEPAlert",
          dateField: "lastOccurrence",
          normalizer: normalizeEPAlert,
        },
        enterpriseWorkloads: {
          endpoint: "/msp/reporting/v1/reports/mspEWAlertHistory",
          dateField: "lastUpdatedTime",
          normalizer: normalizeEWAlertHistory,
        },
        m365: {
          endpoint: "/msp/reporting/v1/reports/mspM365Alerts",
          dateField: "lastUpdatedTime",
          normalizer: normalizeM365Alert,
        },
        google: {
          endpoint: "/msp/reporting/v1/reports/mspGoogleAlerts",
          dateField: "lastUpdatedTime",
          normalizer: normalizeGoogleAlert,
        },
      };

      // Dispatch all selected workloads in parallel
      const fetchTasks = includeWorkloads
        .filter((w) => workloadMap[w])
        .map(async (workload) => {
          const config = workloadMap[workload];
          const body = buildAlertRequestBody(
            pageSize,
            customerIds,
            config.dateField,
            startDate,
            endDate,
          );
          logger.info(
            `AlertSummary: Fetching ${workload} alerts from ${config.endpoint}`,
          );
          const raw = (await druvaMspApiRequestAllReportItems.call(
            this,
            config.endpoint,
            body,
            "data",
          )) as IDataObject[];
          return raw.map(config.normalizer);
        });

      const resultSets = await Promise.all(fetchTasks);

      // Flatten + sort by timestamp descending
      const allAlerts: IUnifiedAlert[] = resultSets.flat();
      allAlerts.sort((a, b) => {
        const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return tb - ta;
      });

      const output = limit > 0 ? allAlerts.slice(0, limit) : allAlerts;

      logger.info(`AlertSummary: Returning ${output.length} unified alerts`);

      return this.helpers.returnJsonArray(output as unknown as IDataObject[]);
    }

    return [];
  } catch (error) {
    logger.error("AlertSummary: Error during execution", error);
    if (this.continueOnFail()) {
      return this.helpers.returnJsonArray({ error: (error as Error).message });
    }
    throw error;
  }
}
