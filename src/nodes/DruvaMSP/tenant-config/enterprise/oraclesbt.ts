import type { WorkloadEntry } from "./types";

export const oracleSbt: WorkloadEntry = {
  name: "Oracle SBT",
  value: "oracleSbt",
  objects: [
    {
      name: "Policies",
      value: "policies",
      method: "GET",
      pathTemplate: "/oraclesbt/v1/orgs/{OrgID}/reports/policies",
      pagination: "pageToken",
      dataKey: "policies",
    },
    {
      name: "Backup Sets",
      value: "backupSets",
      method: "GET",
      pathTemplate: "/oraclesbt/v1/orgs/{OrgID}/reports/backupsets",
      pagination: "pageToken",
      dataKey: "backupSets",
    },
    {
      name: "Jobs",
      value: "jobs",
      method: "GET",
      pathTemplate: "/oraclesbt/v1/orgs/{OrgID}/reports/jobs",
      pagination: "pageToken",
      dataKey: "jobs",
    },
    {
      name: "Servers",
      value: "servers",
      method: "GET",
      pathTemplate: "/oraclesbt/v1/orgs/{OrgID}/reports/servers",
      pagination: "pageToken",
      dataKey: "servers",
    },
    {
      name: "Databases",
      value: "databases",
      method: "GET",
      pathTemplate: "/oraclesbt/v1/orgs/{OrgID}/reports/databases",
      pagination: "pageToken",
      dataKey: "databases",
    },
  ],
};
