import type {
  IExecuteFunctions,
  IDataObject,
  INodeExecutionData,
} from "n8n-workflow";

import { getTenantById } from "./helpers/LookupCache";
import { druvaTenantApiRequest } from "./helpers/TenantApiRequest";
import { druvaTenantApiRequestAllItems } from "./helpers/PaginationHelpers";
import { findInsyncObject } from "./tenant-config/insync/registry";
import { fillPath } from "./tenant-config/insync/types";
import { logger } from "./helpers/LoggerHelper";

export async function executeTenantConfigInsyncOperation(
  this: IExecuteFunctions,
  i: number,
): Promise<INodeExecutionData[]> {
  const tenantId = this.getNodeParameter("tenantId", i) as string;
  const objectValue = this.getNodeParameter("object", i) as string;
  const op = this.getNodeParameter("operation", i) as "list" | "get";
  const returnAll = this.getNodeParameter("returnAll", i, false) as boolean;
  const limit = this.getNodeParameter("limit", i, 100) as number;

  const obj = findInsyncObject(objectValue);
  if (!obj) throw new Error(`Unknown inSync object: ${objectValue}`);

  const tenant = await getTenantById.call(this, tenantId);
  const customerID = tenant.customerID;

  if (op === "get") {
    const idParam = obj.getIdParam;
    let path = obj.getPathTemplate ?? obj.pathTemplate;
    if (idParam) {
      const id = this.getNodeParameter(idParam, i) as string;
      path = fillPath(path, { [idParam]: id });
    }
    await logger.debug(
      `TenantConfigInsync: GET ${path} for customer ${customerID}`,
      this,
    );
    const response = (await druvaTenantApiRequest.call(
      this,
      customerID,
      obj.method,
      path,
      {},
      obj.listQs ?? {},
    )) as IDataObject;
    return [{ json: response }];
  }

  // list
  let path = obj.pathTemplate;
  if (obj.requiredListParams) {
    const ids: Record<string, string> = {};
    for (const p of obj.requiredListParams) {
      ids[p] = this.getNodeParameter(p, i) as string;
    }
    path = fillPath(path, ids);
  }

  let items: IDataObject[];
  if (obj.pagination === "pageToken") {
    items = await druvaTenantApiRequestAllItems.call(
      this,
      customerID,
      obj.method,
      path,
      obj.dataKey,
      obj.listQs ?? {},
    );
  } else {
    const response = (await druvaTenantApiRequest.call(
      this,
      customerID,
      obj.method,
      path,
      {},
      obj.listQs ?? {},
    )) as IDataObject;
    if (obj.dataKey && Array.isArray(response[obj.dataKey])) {
      items = response[obj.dataKey] as IDataObject[];
    } else {
      items = [response];
    }
  }

  if (!returnAll) items = items.slice(0, limit);
  return items.map((json) => ({ json }));
}
