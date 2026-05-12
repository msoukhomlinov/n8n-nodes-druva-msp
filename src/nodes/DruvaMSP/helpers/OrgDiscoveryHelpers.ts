import type {
  IExecuteFunctions,
  IHookFunctions,
  ILoadOptionsFunctions,
} from "n8n-workflow";

import { druvaTenantApiRequest } from "./TenantApiRequest";
import { logger } from "./LoggerHelper";

type ExecutionLike = IExecuteFunctions | IHookFunctions | ILoadOptionsFunctions;

export interface OrgRecord {
  id: number;
  organizationName: string;
}

const orgCache: WeakMap<object, Map<string, OrgRecord[]>> = new WeakMap();

function cacheFor(ctx: object): Map<string, OrgRecord[]> {
  let m = orgCache.get(ctx);
  if (!m) {
    m = new Map();
    orgCache.set(ctx, m);
  }
  return m;
}

export async function listOrgsForCustomer(
  this: ExecutionLike,
  customerID: string,
): Promise<OrgRecord[]> {
  const entries = cacheFor(this as object);
  const cached = entries.get(customerID);
  if (cached) return cached;

  await logger.debug(
    `OrgDiscovery: listing orgs for customer ${customerID}`,
    this,
  );

  const response = (await druvaTenantApiRequest.call(
    this,
    customerID,
    "GET",
    "/organization/v1/orgs",
  )) as { orgs?: OrgRecord[] };

  const orgs = response?.orgs ?? [];
  entries.set(customerID, orgs);
  return orgs;
}

export async function resolveOrgIdForTenant(
  this: ExecutionLike,
  customerID: string,
  tenantID: string,
): Promise<number> {
  const orgs = await listOrgsForCustomer.call(this, customerID);
  if (orgs.length === 0) {
    throw new Error(
      `No orgs visible to customer-scoped token for ${customerID} (tenant ${tenantID})`,
    );
  }
  if (orgs.length === 1) return orgs[0].id;
  throw new Error(
    `Tenant ${tenantID} maps to multiple orgs (${orgs.length}). Set orgScope to "Specific org" and pick one.`,
  );
}
