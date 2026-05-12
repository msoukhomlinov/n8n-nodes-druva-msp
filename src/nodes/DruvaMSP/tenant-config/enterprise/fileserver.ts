import type { WorkloadEntry } from "./types";

export const fileServer: WorkloadEntry = {
  name: "FileServer",
  value: "fileServer",
  objects: [
    {
      name: "Policies",
      value: "policies",
      method: "GET",
      pathTemplate: "/fileserver/v1/orgs/{OrgID}/reports/policies",
      pagination: "pageToken",
      dataKey: "policies",
    },
    {
      name: "Backup Sets",
      value: "backupSets",
      method: "GET",
      pathTemplate: "/fileserver/v1/orgs/{OrgID}/reports/backupsets",
      pagination: "pageToken",
      dataKey: "backupSets",
    },
    {
      name: "Jobs",
      value: "jobs",
      method: "GET",
      pathTemplate: "/fileserver/v1/orgs/{OrgID}/reports/jobs",
      pagination: "pageToken",
      dataKey: "jobs",
    },
    {
      name: "Content Rules",
      value: "contentRules",
      method: "GET",
      pathTemplate: "/fileserver/v1/orgs/{OrgID}/reports/contentrules",
      pagination: "pageToken",
      dataKey: "contentRules",
    },
    {
      name: "Servers",
      value: "servers",
      method: "GET",
      pathTemplate: "/fileserver/v1/orgs/{OrgID}/reports/servers",
      pagination: "pageToken",
      dataKey: "servers",
    },
  ],
};
