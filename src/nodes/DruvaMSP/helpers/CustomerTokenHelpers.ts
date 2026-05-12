import type {
  IExecuteFunctions,
  IHookFunctions,
  ILoadOptionsFunctions,
  IHttpRequestOptions,
} from "n8n-workflow";

import { getDruvaMspAccessToken } from "./AuthHelpers";
import { logger } from "./LoggerHelper";

type ExecutionLike = IExecuteFunctions | IHookFunctions | ILoadOptionsFunctions;

interface CustomerTokenEntry {
  token: string;
  expiresAtMs: number;
}

const TTL_SAFETY_MARGIN_SECONDS = 60;

// Per-execution cache keyed on the n8n context object (this).
const cache: WeakMap<object, Map<string, CustomerTokenEntry>> = new WeakMap();

function cacheFor(ctx: object): Map<string, CustomerTokenEntry> {
  let m = cache.get(ctx);
  if (!m) {
    m = new Map();
    cache.set(ctx, m);
  }
  return m;
}

export function invalidateCustomerToken(
  ctx: ExecutionLike,
  customerID: string,
): void {
  cacheFor(ctx as object).delete(customerID);
}

export async function getCustomerAccessToken(
  this: ExecutionLike,
  customerID: string,
): Promise<string> {
  const credentials = await this.getCredentials("druvaMspApi");
  const baseUrl =
    (credentials.apiBaseUrl as string) ||
    (credentials.baseUrl as string) ||
    "https://apis.druva.com";

  const entries = cacheFor(this as object);
  const cached = entries.get(customerID);
  if (cached && cached.expiresAtMs > Date.now()) {
    await logger.debug(
      `CustomerToken: cache hit for customer ${customerID}`,
      this,
    );
    return cached.token;
  }

  // Token exchange requires MSP-scoped Bearer in the Authorization header.
  const mspToken = await getDruvaMspAccessToken.call(this);
  const url = `${baseUrl.replace(/\/$/, "")}/msp/v2/customers/${customerID}/token`;

  await logger.debug(
    `CustomerToken: exchanging token for customer ${customerID}`,
    this,
  );

  const options: IHttpRequestOptions = {
    method: "POST",
    url,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Bearer ${mspToken}`,
    },
    body: "grant_type=client_credentials",
    json: true,
  };

  const response = (await this.helpers.httpRequest(options)) as {
    access_token?: string;
    expires_in?: number;
  };

  const token = response?.access_token;
  const expiresIn = response?.expires_in ?? 1800;
  if (!token) {
    throw new Error(
      `Customer token exchange failed for ${customerID}: no access_token in response`,
    );
  }

  const expiresAtMs =
    Date.now() + (expiresIn - TTL_SAFETY_MARGIN_SECONDS) * 1000;
  entries.set(customerID, { token, expiresAtMs });

  return token;
}
