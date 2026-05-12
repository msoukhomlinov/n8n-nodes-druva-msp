import type {
  IExecuteFunctions,
  IHookFunctions,
  ILoadOptionsFunctions,
  IDataObject,
} from "n8n-workflow";

import { druvaMspApiRequestAllItems } from "./PaginationHelpers";
import { logger } from "./LoggerHelper";
import { API_MAX_PAGE_SIZE } from "./Constants";

type ExecutionLike = IExecuteFunctions | IHookFunctions | ILoadOptionsFunctions;

export interface TenantRecord {
  // Note: the live API uses `tenantId`/`tenantName` in responses
  // (swagger documents `id`/`name` but the deployed API differs — confirmed
  // against the existing `getTenants` loadOptions in DruvaMsp.node.ts).
  tenantId: string;
  tenantName: string;
  customerID: string;
  productID: number;
  features?: IDataObject[];
  [key: string]: unknown;
}

const tenantCache: WeakMap<object, Map<string, TenantRecord>> = new WeakMap();

async function fetchAllTenants(
  ctx: ExecutionLike,
): Promise<Map<string, TenantRecord>> {
  await logger.debug("LookupCache: fetching /msp/v3/tenants", ctx);
  const tenants = (await druvaMspApiRequestAllItems.call(
    ctx,
    "GET",
    "/msp/v3/tenants",
    "tenants",
    {},
    { pageSize: String(API_MAX_PAGE_SIZE) },
  )) as TenantRecord[];

  const byId = new Map<string, TenantRecord>();
  for (const t of tenants) {
    if (t.tenantId) byId.set(t.tenantId, t);
  }
  return byId;
}

async function ensureCache(
  ctx: ExecutionLike,
): Promise<Map<string, TenantRecord>> {
  const existing = tenantCache.get(ctx as object);
  if (existing) return existing;
  const byId = await fetchAllTenants(ctx);
  tenantCache.set(ctx as object, byId);
  return byId;
}

export async function getTenantById(
  this: ExecutionLike,
  tenantID: string,
): Promise<TenantRecord> {
  const byId = await ensureCache(this);
  const t = byId.get(tenantID);
  if (!t) {
    throw new Error(`Tenant ${tenantID} not found in MSP customer scope`);
  }
  if (!t.customerID) {
    throw new Error(
      `Tenant ${tenantID} has no customerID — cannot exchange customer-scoped token`,
    );
  }
  return t;
}

export async function listTenantsByProduct(
  this: ExecutionLike,
  productID: number,
): Promise<TenantRecord[]> {
  const byId = await ensureCache(this);
  return Array.from(byId.values()).filter((t) => t.productID === productID);
}
