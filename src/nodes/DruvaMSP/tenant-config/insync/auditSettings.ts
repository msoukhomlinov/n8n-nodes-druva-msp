import type { InsyncObjectEntry } from "./types";

export const auditSettings: InsyncObjectEntry = {
  name: "Audit Trail Settings",
  value: "auditSettings",
  operations: ["get"],
  method: "GET",
  pathTemplate: "/audittrailmanagement/v1/auditTrailSettings",
  getPathTemplate: "/audittrailmanagement/v1/auditTrailSettings",
  pagination: "none",
  dataKey: "",
};
