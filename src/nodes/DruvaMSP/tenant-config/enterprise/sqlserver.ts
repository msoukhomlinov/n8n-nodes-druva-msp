import type { WorkloadEntry } from "./types";

export const sqlServer: WorkloadEntry = {
  name: "SQL Server",
  value: "sqlServer",
  objects: [
    {
      name: "Policies",
      value: "policies",
      method: "GET",
      pathTemplate: "/sqlserver/v1/orgs/{OrgID}/reports/policies",
      pagination: "pageToken",
      dataKey: "policies",
    },
    {
      name: "Backup Sets",
      value: "backupSets",
      method: "GET",
      pathTemplate: "/sqlserver/v1/orgs/{OrgID}/reports/backupsets",
      pagination: "pageToken",
      dataKey: "backupSets",
    },
    {
      name: "Jobs",
      value: "jobs",
      method: "GET",
      pathTemplate: "/sqlserver/v1/orgs/{OrgID}/reports/jobs",
      pagination: "pageToken",
      dataKey: "jobs",
    },
    {
      name: "Availability Groups",
      value: "availabilityGroups",
      method: "GET",
      pathTemplate: "/sqlserver/v1/orgs/{OrgID}/reports/availabilitygroup",
      pagination: "pageToken",
      dataKey: "availabilityGroups",
    },
    {
      name: "Instances",
      value: "instances",
      method: "GET",
      pathTemplate: "/sqlserver/v1/orgs/{OrgID}/reports/instances",
      pagination: "pageToken",
      dataKey: "instances",
    },
  ],
};
