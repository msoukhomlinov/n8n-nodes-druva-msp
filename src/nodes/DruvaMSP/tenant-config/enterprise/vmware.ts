import type { WorkloadEntry } from "./types";

export const vmware: WorkloadEntry = {
  name: "VMware",
  value: "vmware",
  objects: [
    {
      name: "Policies",
      value: "policies",
      method: "GET",
      pathTemplate: "/vmware/v1/orgs/{OrgID}/reports/policies",
      pagination: "pageToken",
      dataKey: "policies",
    },
    {
      name: "Backup Sets",
      value: "backupSets",
      method: "GET",
      pathTemplate: "/vmware/v1/orgs/{OrgID}/reports/backupsets",
      pagination: "pageToken",
      dataKey: "backupSets",
    },
    {
      name: "Jobs",
      value: "jobs",
      method: "GET",
      pathTemplate: "/vmware/v1/orgs/{OrgID}/reports/jobs",
      pagination: "pageToken",
      dataKey: "jobs",
    },
    {
      name: "Proxies",
      value: "proxies",
      method: "GET",
      pathTemplate: "/vmware/v1/orgs/{OrgID}/reports/proxies",
      pagination: "pageToken",
      dataKey: "proxies",
    },
  ],
};
