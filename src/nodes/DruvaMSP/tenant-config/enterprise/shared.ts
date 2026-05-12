import type { WorkloadEntry } from "./types";

export const crossWorkload: WorkloadEntry = {
  name: "Cross-Workload",
  value: "crossWorkload",
  objects: [
    {
      name: "CloudCache Config",
      value: "cloudCacheConfig",
      method: "GET",
      pathTemplate: "/cloudcache/v1/orgs/{OrgID}/reports/config",
      pagination: "pageToken",
      dataKey: "cacheConfig",
    },
    {
      name: "Storage Usage",
      value: "storageUsage",
      method: "GET",
      pathTemplate: "/storage/v1/orgs/{OrgID}/reports/usage",
      pagination: "pageToken",
      dataKey: "storageUsage",
    },
  ],
};
