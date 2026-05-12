import type {
  IExecuteFunctions,
  IDataObject,
  INodeExecutionData,
} from "n8n-workflow";

import { getTenantById } from "./helpers/LookupCache";
import { resolveOrgIdForTenant } from "./helpers/OrgDiscoveryHelpers";
import { druvaTenantApiRequest } from "./helpers/TenantApiRequest";
import { druvaTenantApiRequestAllItems } from "./helpers/PaginationHelpers";
import { findObject, findWorkload } from "./tenant-config/enterprise/registry";
import { buildPath } from "./tenant-config/enterprise/types";
import { logger } from "./helpers/LoggerHelper";

export async function executeTenantConfigEnterpriseOperation(
  this: IExecuteFunctions,
  i: number,
): Promise<INodeExecutionData[]> {
  const tenantId = this.getNodeParameter("tenantId", i) as string;
  const orgScope = this.getNodeParameter("orgScope", i) as
    | "auto"
    | "all"
    | "specific";
  const workloadValue = this.getNodeParameter("workload", i) as string;
  const objectValue = this.getNodeParameter("object", i) as string;
  const returnAll = this.getNodeParameter("returnAll", i, false) as boolean;
  const limit = this.getNodeParameter("limit", i, 100) as number;

  const workload = findWorkload(workloadValue);
  if (!workload) {
    throw new Error(`Unknown workload: ${workloadValue}`);
  }
  const obj = findObject(workload, objectValue);
  if (!obj) {
    throw new Error(
      `Unknown object "${objectValue}" for workload "${workloadValue}"`,
    );
  }

  const tenant = await getTenantById.call(this, tenantId);
  const customerID = tenant.customerID;

  let orgId: number;
  if (orgScope === "all") {
    orgId = 0;
  } else if (orgScope === "specific") {
    orgId = parseInt(this.getNodeParameter("orgId", i) as string, 10);
    if (isNaN(orgId)) {
      throw new Error(
        `Org Scope is "specific" but Org dropdown returned a non-numeric value`,
      );
    }
  } else {
    orgId = await resolveOrgIdForTenant.call(this, customerID, tenantId);
  }

  const path = buildPath(obj.pathTemplate, { orgId });

  await logger.debug(
    `TenantConfigEnterprise: customer=${customerID} org=${orgId} workload=${workloadValue} object=${objectValue} path=${path}`,
    this,
  );

  let items: IDataObject[];
  if (obj.pagination === "pageToken") {
    items = await druvaTenantApiRequestAllItems.call(
      this,
      customerID,
      obj.method,
      path,
      obj.dataKey,
    );
  } else {
    const response = (await druvaTenantApiRequest.call(
      this,
      customerID,
      obj.method,
      path,
    )) as IDataObject;
    if (obj.dataKey && Array.isArray(response[obj.dataKey])) {
      items = response[obj.dataKey] as IDataObject[];
    } else {
      items = [response];
    }
  }

  if (obj.postprocess) {
    items = items.map(
      (it) => obj.postprocess!(it as Record<string, unknown>) as IDataObject,
    );
  }

  if (!returnAll) items = items.slice(0, limit);

  return items.map((json) => ({ json }));
}
