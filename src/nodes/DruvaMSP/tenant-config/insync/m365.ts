import type { InsyncObjectEntry } from "./types";

export const m365AppStatus: InsyncObjectEntry = {
  name: "M365 App Status",
  value: "m365AppStatus",
  operations: ["get"],
  method: "GET",
  pathTemplate: "/insync/cappmaster/v1/apps/status",
  getPathTemplate: "/insync/cappmaster/v1/apps/status",
  pagination: "none",
  dataKey: "",
};

export const m365RestorePoints: InsyncObjectEntry = {
  name: "M365 Restore Points",
  value: "m365RestorePoints",
  operations: ["list"],
  method: "GET",
  pathTemplate: "/insync/cloudapp/v1/restorePoints",
  pagination: "pageToken",
  dataKey: "restorePoints",
};

export const sharePointSiteCollections: InsyncObjectEntry = {
  name: "SharePoint Site Collections",
  value: "sharePointSiteCollections",
  operations: ["list"],
  method: "GET",
  pathTemplate: "/insync/sharepointmaster/v3/sites",
  pagination: "pageToken",
  dataKey: "siteCollections",
};

export const sharePointSiteRestorePoints: InsyncObjectEntry = {
  name: "SharePoint Site Restore Points",
  value: "sharePointSiteRestorePoints",
  operations: ["list"],
  method: "GET",
  pathTemplate:
    "/insync/sharepointmaster/v2/siteCollections/{site_collection_id}/restorePoints",
  pagination: "pageToken",
  dataKey: "restorePoints",
  requiredListParams: ["site_collection_id"],
};
