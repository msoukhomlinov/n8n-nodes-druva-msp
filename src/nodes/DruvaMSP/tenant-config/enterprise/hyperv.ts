import type { WorkloadEntry } from "./types";

export const hyperV: WorkloadEntry = {
  name: "HyperV",
  value: "hyperV",
  objects: [
    {
      name: "Policies",
      value: "policies",
      method: "GET",
      pathTemplate: "/hyperv/v1/orgs/{OrgID}/reports/policies",
      pagination: "pageToken",
      dataKey: "policies",
    },
    {
      name: "Backup Sets",
      value: "backupSets",
      method: "GET",
      pathTemplate: "/hyperv/v1/orgs/{OrgID}/reports/backupsets",
      pagination: "pageToken",
      dataKey: "backupSets",
    },
    {
      name: "Jobs",
      value: "jobs",
      method: "GET",
      pathTemplate: "/hyperv/v1/orgs/{OrgID}/reports/jobs",
      pagination: "pageToken",
      dataKey: "jobs",
    },
    {
      name: "Hosts",
      value: "hosts",
      method: "GET",
      pathTemplate: "/hyperv/v1/orgs/{OrgID}/reports/hosts",
      pagination: "pageToken",
      dataKey: "hosts",
    },
    {
      name: "FLR Proxies",
      value: "flrProxies",
      method: "GET",
      pathTemplate: "/hyperv/v1/orgs/{OrgID}/reports/flrproxies",
      pagination: "pageToken",
      dataKey: "flrProxies",
    },
  ],
};
