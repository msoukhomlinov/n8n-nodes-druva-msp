import type { WorkloadEntry } from "./types";

export const nas: WorkloadEntry = {
  name: "NAS",
  value: "nas",
  objects: [
    {
      name: "Policies",
      value: "policies",
      method: "GET",
      pathTemplate: "/nas/v1/orgs/{OrgID}/reports/policies",
      pagination: "pageToken",
      dataKey: "policies",
    },
    {
      name: "Backup Sets",
      value: "backupSets",
      method: "GET",
      pathTemplate: "/nas/v1/orgs/{OrgID}/reports/backupsets",
      pagination: "pageToken",
      dataKey: "backupSets",
    },
    {
      name: "Jobs",
      value: "jobs",
      method: "GET",
      pathTemplate: "/nas/v1/orgs/{OrgID}/reports/jobs",
      pagination: "pageToken",
      dataKey: "jobs",
    },
    {
      name: "Content Rules",
      value: "contentRules",
      method: "GET",
      pathTemplate: "/nas/v1/orgs/{OrgID}/reports/contentrules",
      pagination: "pageToken",
      dataKey: "contentRules",
    },
    {
      name: "Proxies",
      value: "proxies",
      method: "GET",
      pathTemplate: "/nas/v1/orgs/{OrgID}/reports/proxies",
      pagination: "pageToken",
      dataKey: "proxies",
    },
    {
      name: "Hosts",
      value: "hosts",
      method: "GET",
      pathTemplate: "/nas/v1/orgs/{OrgID}/reports/hosts",
      pagination: "pageToken",
      dataKey: "hosts",
    },
  ],
};
