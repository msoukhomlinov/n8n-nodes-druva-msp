import type { IHttpRequestMethods } from "n8n-workflow";

export type PaginationStyle = "pageToken" | "offsetLimit" | "none";

export interface UrlParams {
  orgId: number;
  ids?: Record<string, string | number>;
}

export interface ObjectEntry {
  /** UI display name */
  name: string;
  /** Programmatic value (camelCase) used in operation/object dropdown */
  value: string;
  /** HTTP method (almost always GET for read-only audit) */
  method: IHttpRequestMethods;
  /** URL template — placeholders {OrgID}, {backupsetID}, etc. */
  pathTemplate: string;
  /** Pagination style for this endpoint */
  pagination: PaginationStyle;
  /** JSON key in response holding the array (e.g. "policies", "backupSets") */
  dataKey: string;
  /** Required object-specific IDs (excluding OrgID) — names match {placeholder} */
  requiredParams?: string[];
  /** Optional per-item post-process (e.g. add _label fields) */
  postprocess?: (item: Record<string, unknown>) => Record<string, unknown>;
}

export interface WorkloadEntry {
  /** UI display name */
  name: string;
  /** Dropdown value (camelCase) */
  value: string;
  /** Objects available for this workload */
  objects: ObjectEntry[];
}

export function buildPath(template: string, params: UrlParams): string {
  let p = template.replace(/\{OrgID\}/g, String(params.orgId));
  p = p.replace(/\{orgID\}/g, String(params.orgId));
  if (params.ids) {
    for (const [k, v] of Object.entries(params.ids)) {
      p = p.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return p;
}
