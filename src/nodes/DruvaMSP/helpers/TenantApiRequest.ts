import type {
  IExecuteFunctions,
  IHookFunctions,
  ILoadOptionsFunctions,
  IDataObject,
  IHttpRequestMethods,
  IHttpRequestOptions,
  JsonObject,
} from "n8n-workflow";

import {
  getCustomerAccessToken,
  invalidateCustomerToken,
} from "./CustomerTokenHelpers";
import { logger } from "./LoggerHelper";

type ExecutionLike = IExecuteFunctions | IHookFunctions | ILoadOptionsFunctions;

function buildUrl(baseUrl: string, endpoint: string): string {
  const b = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const e = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${b}${e}`;
}

async function makeRequest(
  ctx: ExecutionLike,
  token: string,
  method: IHttpRequestMethods,
  url: string,
  body: IDataObject | IDataObject[] | undefined,
  qs: IDataObject | undefined,
): Promise<unknown> {
  let options: IHttpRequestOptions = {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    qs: qs ?? {},
    body: body ?? {},
    url,
    json: true,
  };

  if (method === "GET") {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { body: _drop, ...withoutBody } = options;
    options = withoutBody;
  }

  return ctx.helpers.httpRequest(options);
}

export async function druvaTenantApiRequest(
  this: ExecutionLike,
  customerID: string,
  method: IHttpRequestMethods,
  endpoint: string,
  body: IDataObject | IDataObject[] = {},
  qs: IDataObject = {},
): Promise<unknown> {
  const credentials = await this.getCredentials("druvaMspApi");
  const baseUrl =
    (credentials.apiBaseUrl as string) ||
    (credentials.baseUrl as string) ||
    "https://apis.druva.com";
  const url = buildUrl(baseUrl, endpoint);

  let token = await getCustomerAccessToken.call(this, customerID);

  try {
    return await makeRequest(this, token, method, url, body, qs);
  } catch (err) {
    const e = err as JsonObject & { statusCode?: number };
    if (e?.statusCode === 401) {
      await logger.debug(
        `TenantApi: 401 for ${endpoint}; invalidating token and retrying once`,
        this,
      );
      invalidateCustomerToken(this, customerID);
      token = await getCustomerAccessToken.call(this, customerID);
      return makeRequest(this, token, method, url, body, qs);
    }
    throw new Error(
      `Druva Tenant API error [${e?.statusCode ?? 100}]: ${
        (e?.message as string) ?? "Unknown error"
      } - ${endpoint}`,
    );
  }
}
