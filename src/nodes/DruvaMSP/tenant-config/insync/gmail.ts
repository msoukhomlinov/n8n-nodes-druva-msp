import type { InsyncObjectEntry } from "./types";

export const gmailAppStatus: InsyncObjectEntry = {
  name: "Gmail App Status",
  value: "gmailAppStatus",
  operations: ["get"],
  method: "GET",
  pathTemplate: "/insync/cappmaster/v1/apps/status",
  getPathTemplate: "/insync/cappmaster/v1/apps/status",
  pagination: "none",
  dataKey: "",
  listQs: { app: "googleWorkspace" },
};
