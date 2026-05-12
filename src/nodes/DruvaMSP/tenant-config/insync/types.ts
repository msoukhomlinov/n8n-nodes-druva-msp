import type { IHttpRequestMethods } from "n8n-workflow";

export type PaginationStyle = "pageToken" | "offsetLimit" | "none";

export interface InsyncObjectEntry {
  /** UI display name */
  name: string;
  /** Programmatic value */
  value: string;
  /** "list" or "get" operation per object */
  operations: Array<"list" | "get">;
  /** HTTP method (typically GET) */
  method: IHttpRequestMethods;
  /** Path template — placeholders like {profileID}, {policyId}, {siteCollectionId} */
  pathTemplate: string;
  /** Get-by-id path template (if `operations` includes "get") */
  getPathTemplate?: string;
  /** Pagination style for list */
  pagination: PaginationStyle;
  /** Response data key (array for list, object root for get) */
  dataKey: string;
  /** Required object-specific IDs for list operations */
  requiredListParams?: string[];
  /** Required ID name for get operations (e.g. "profileID") */
  getIdParam?: string;
  /** Optional fixed query-string parameters always sent on list (e.g. app=googleWorkspace) */
  listQs?: Record<string, string>;
}

export function fillPath(
  template: string,
  ids: Record<string, string>,
): string {
  let p = template;
  for (const [k, v] of Object.entries(ids)) {
    p = p.replace(new RegExp(`\\{${k}\\}`, "g"), encodeURIComponent(v));
  }
  return p;
}
