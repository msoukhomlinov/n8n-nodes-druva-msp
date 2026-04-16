// src/nodes/DruvaMSP/BackupHealthSummary.node.execute.ts
import type {
  IExecuteFunctions,
  IDataObject,
  INodeExecutionData,
} from "n8n-workflow";
import { druvaMspApiRequestAllReportItems } from "./GenericFunctions";
import { getRelativeDateRange } from "./helpers/DateHelpers";
import { logger } from "./helpers/LoggerHelper";
import { API_MAX_PAGE_SIZE } from "./helpers/Constants";

// ---------------------------------------------------------------------------
// Aggregation logic — pure function, easy to unit test
// ---------------------------------------------------------------------------

export interface ICustomerHealthSummary {
  customerGlobalId: string;
  customerName: string;
  accountName: string;
  endpointDevicesTotal: number;
  endpointDevicesCompleted: number;
  endpointDevicesFailed: number;
  endpointDevicesNotStarted: number;
  endpointDevicesInProgress: number;
  endpointSuccessRate: number;
  endpointFailureRate: number;
  overallHealthStatus: "healthy" | "warning" | "critical";
}

/**
 * Aggregates raw LastBackupStatusReportData records into per-customer summaries.
 * @param records Raw records from mspEPLastBackupStatus API
 * @param criticalThresholdPercent Failure % above which customer is "critical"
 * @returns One summary record per customer
 */
export function aggregateBackupHealthByCustomer(
  records: IDataObject[],
  criticalThresholdPercent: number,
): ICustomerHealthSummary[] {
  // Group records by customerGlobalId
  const customerMap = new Map<string, IDataObject[]>();
  for (const record of records) {
    const id = String(record.customerGlobalId ?? record.customerID ?? "");
    if (!id) continue;
    if (!customerMap.has(id)) customerMap.set(id, []);
    customerMap.get(id)!.push(record);
  }

  const results: ICustomerHealthSummary[] = [];

  for (const [customerGlobalId, deviceRecords] of customerMap.entries()) {
    const first = deviceRecords[0];
    const customerName = String(first.customerName ?? "");
    const accountName = String(first.accountName ?? "");

    // Count by backup status (only consider ACTIVE devices)
    const activeDevices = deviceRecords.filter(
      (r) =>
        !r.deviceStatus || String(r.deviceStatus).toUpperCase() === "ACTIVE",
    );

    const total = activeDevices.length;
    const completed = activeDevices.filter(
      (r) => String(r.status).toUpperCase() === "COMPLETED",
    ).length;
    const failed = activeDevices.filter(
      (r) => String(r.status).toUpperCase() === "FAILED",
    ).length;
    const notStarted = activeDevices.filter(
      (r) => String(r.status).toUpperCase() === "NOT_STARTED",
    ).length;
    const inProgress = activeDevices.filter(
      (r) => String(r.status).toUpperCase() === "IN_PROGRESS",
    ).length;

    const successRate = total > 0 ? (completed / total) * 100 : 0;
    const failureRate = total > 0 ? (failed / total) * 100 : 0;

    // Determine health status
    let overallHealthStatus: "healthy" | "warning" | "critical";
    if (failureRate > criticalThresholdPercent) {
      overallHealthStatus = "critical";
    } else if (failed > 0 || notStarted === total) {
      overallHealthStatus = "warning";
    } else {
      overallHealthStatus = "healthy";
    }

    results.push({
      customerGlobalId,
      customerName,
      accountName,
      endpointDevicesTotal: total,
      endpointDevicesCompleted: completed,
      endpointDevicesFailed: failed,
      endpointDevicesNotStarted: notStarted,
      endpointDevicesInProgress: inProgress,
      endpointSuccessRate: Math.round(successRate * 100) / 100,
      endpointFailureRate: Math.round(failureRate * 100) / 100,
      overallHealthStatus,
    });
  }

  // Sort: critical first, then warning, then healthy; alphabetically within each tier
  const tierOrder: Record<string, number> = {
    critical: 0,
    warning: 1,
    healthy: 2,
  };
  results.sort((a, b) => {
    const tierDiff =
      tierOrder[a.overallHealthStatus] - tierOrder[b.overallHealthStatus];
    if (tierDiff !== 0) return tierDiff;
    return a.customerName.localeCompare(b.customerName);
  });

  return results;
}

// ---------------------------------------------------------------------------
// Main execute function
// ---------------------------------------------------------------------------

export async function executeBackupHealthSummaryOperation(
  this: IExecuteFunctions,
  i: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter("operation", i) as string;

  try {
    if (operation === "getBackupHealthByCustomer") {
      // Resolve dates
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

      // Customer filter
      const filterByCustomers = this.getNodeParameter(
        "filterByCustomers",
        i,
        false,
      ) as boolean;
      const customerIds = filterByCustomers
        ? (this.getNodeParameter("customerIds", i, []) as string[])
        : [];

      const criticalThresholdPercent = this.getNodeParameter(
        "criticalThresholdPercent",
        i,
        10,
      ) as number;

      const returnLevel = this.getNodeParameter(
        "returnLevel",
        i,
        "allCustomers",
      ) as string;

      // Build request body for mspEPLastBackupStatus
      const filterBy: IDataObject[] = [];
      if (customerIds.length > 0) {
        filterBy.push({
          fieldName: "customerGlobalId",
          operator: "CONTAINS",
          value: customerIds,
        });
      }
      if (startDate) {
        filterBy.push({
          fieldName: "lastUpdatedTime",
          operator: "GTE",
          value: startDate,
        });
      }
      if (endDate) {
        filterBy.push({
          fieldName: "lastUpdatedTime",
          operator: "LTE",
          value: endDate,
        });
      }

      const body: IDataObject = {
        filters: {
          pageSize: API_MAX_PAGE_SIZE,
          filterBy,
        },
      };

      logger.info("BackupHealthSummary: Fetching EP last backup status...");

      const rawRecords = (await druvaMspApiRequestAllReportItems.call(
        this,
        "/msp/reporting/v1/reports/mspEPLastBackupStatus",
        body,
        "data",
      )) as IDataObject[];

      logger.info(
        `BackupHealthSummary: Retrieved ${rawRecords.length} device records`,
      );

      if (!rawRecords.length) {
        return this.helpers.returnJsonArray({
          success: false,
          message:
            "No endpoint backup status data found for the selected filters",
        });
      }

      // Aggregate
      let summaries = aggregateBackupHealthByCustomer(
        rawRecords,
        criticalThresholdPercent,
      );

      // Apply return level filter
      if (returnLevel === "unhealthyOnly") {
        summaries = summaries.filter(
          (s) => s.overallHealthStatus !== "healthy",
        );
      } else if (returnLevel === "criticalOnly") {
        summaries = summaries.filter(
          (s) => s.overallHealthStatus === "critical",
        );
      }

      logger.info(
        `BackupHealthSummary: Returning ${summaries.length} customer health summaries`,
      );

      return this.helpers.returnJsonArray(
        summaries as unknown as IDataObject[],
      );
    }

    return [];
  } catch (error) {
    logger.error("BackupHealthSummary: Error during execution", error);
    if (this.continueOnFail()) {
      return this.helpers.returnJsonArray({ error: (error as Error).message });
    }
    throw error;
  }
}
