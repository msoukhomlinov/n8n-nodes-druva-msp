import type { WorkloadEntry } from "./types";

// NOTE: backupstores endpoint shape needs live verification. Swagger's
// PBSBackupstoreResponse is a flat single-object schema with no array wrapper.
// Plan assumes deployed API wraps in { backupStores: [...] } with nextPageToken.
// If live smoke shows a single object, switch to pagination: "none", dataKey: "".
export const phoenixBackupStore: WorkloadEntry = {
  name: "Phoenix Backup Store",
  value: "phoenixBackupStore",
  objects: [
    {
      name: "Backup Sets",
      value: "backupSets",
      method: "GET",
      pathTemplate: "/pbs/v1/orgs/{OrgID}/reports/backupsets",
      pagination: "pageToken",
      dataKey: "backupSets",
    },
    {
      name: "Jobs",
      value: "jobs",
      method: "GET",
      pathTemplate: "/pbs/v1/orgs/{OrgID}/reports/jobs",
      pagination: "pageToken",
      dataKey: "jobs",
    },
    {
      name: "Backup Stores",
      value: "backupStores",
      method: "GET",
      pathTemplate: "/pbs/v1/orgs/{OrgID}/reports/backupstores",
      pagination: "pageToken",
      dataKey: "backupStores",
    },
  ],
};
