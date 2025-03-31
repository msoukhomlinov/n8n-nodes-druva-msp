// Generic helper functions for Druva MSP API calls, authentication, pagination, etc.

// import type { HttpVerb } from 'n8n-core'; // Removed this incorrect attempt

import type {
  IExecuteFunctions,
  IHttpRequestOptions,
  // HttpVerb, // Removed problematic import
  JsonObject,
  IDataObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

/**
 * Retrieves an access token using Basic Auth with Client ID and Secret Key.
 */
async function getAccessToken(this: IExecuteFunctions): Promise<string> {
  const credentials = await this.getCredentials('druvaMspApi');
  const clientId = credentials.clientId as string;
  const clientSecret = credentials.clientSecret as string;
  const baseUrl = credentials.baseUrl || 'https://apis.druva.com';
  const authUrl = `${baseUrl}/msp/auth/v1/token`;

  // Encode credentials for Basic Auth
  const encodedCredentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const options: IHttpRequestOptions = {
    headers: {
      accept: 'application/json',
      'content-type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${encodedCredentials}`,
    },
    method: 'POST',
    url: authUrl,
    body: 'grant_type=client_credentials',
    json: true,
  };

  try {
    const response = await this.helpers.request(options);
    if (
      typeof response === 'object' &&
      response !== null &&
      typeof response.access_token === 'string'
    ) {
      return response.access_token;
    }
    throw new NodeApiError(this.getNode(), {
      message: 'Invalid response format received from token endpoint',
    } as JsonObject);
  } catch (error) {
    throw new NodeApiError(this.getNode(), error as JsonObject, {
      message: `Token generation failed: ${(error as Error).message}`,
    });
  }
}

/**
 * Makes an API request to the Druva MSP endpoint.
 *
 * @param {IExecuteFunctions} this The context object.
 * @param {string} method The HTTP method (e.g., 'GET', 'POST').
 * @param {string} endpoint The API endpoint path (e.g., '/customers').
 * @param {IDataObject} [body] The request body for POST/PUT requests.
 * @param {IDataObject} [qs] The query string parameters.
 * @returns {Promise<unknown>} The response body.
 */
export async function druvaMspApiRequest(
  this: IExecuteFunctions,
  method: string,
  endpoint: string,
  body?: IDataObject,
  qs?: IDataObject,
): Promise<unknown> {
  const credentials = await this.getCredentials('druvaMspApi');
  const baseUrl = credentials.baseUrl || 'https://apis.druva.com';

  // Get the access token
  const accessToken = await getAccessToken.call(this);

  console.log(`[DEBUG] Druva MSP API - Preparing request to: ${method} ${baseUrl}${endpoint}`);
  console.log('[DEBUG] Druva MSP API - Query params:', qs);
  if (body && Object.keys(body).length > 0) {
    console.log('[DEBUG] Druva MSP API - Request body:', body);
  }

  // For GET requests, ensure body is undefined (not an empty object)
  let options: IHttpRequestOptions;
  if (method.toUpperCase() === 'GET' && (!body || Object.keys(body).length === 0)) {
    // Create a new undefined value rather than reassigning parameter
    const bodyValue = undefined;
    options = {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'n8n-druva-msp-node/1.0',
        Authorization: `Bearer ${accessToken}`,
      },
      method: method as IHttpRequestOptions['method'],
      qs: qs,
      body: bodyValue,
      url: `${baseUrl}${endpoint}`,
      json: true,
    };
  } else {
    options = {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'n8n-druva-msp-node/1.0',
        Authorization: `Bearer ${accessToken}`,
      },
      method: method as IHttpRequestOptions['method'],
      qs: qs,
      body: body,
      url: `${baseUrl}${endpoint}`,
      json: true,
    };
  }

  console.log('[DEBUG] Druva MSP API - Request headers:', {
    ...options.headers,
    Authorization: 'Bearer [REDACTED]', // Don't log the full token for security
  });

  try {
    console.log('[DEBUG] Druva MSP API - Sending request...');
    const response = await this.helpers.request(options);
    console.log('[DEBUG] Druva MSP API - Response received successfully');
    return response;
  } catch (error) {
    // More detailed error logging
    console.error('[ERROR] Druva MSP API - Request failed:', {
      endpoint,
      method,
      errorMessage: (error as Error).message,
      statusCode: (error as { statusCode?: number | string }).statusCode || 'N/A',
      errorResponse: (error as { error?: unknown }).error || 'No error details available',
    });

    // Handle potential token expiration or other API errors
    throw new NodeApiError(this.getNode(), error as JsonObject, {
      message: `API request failed: ${(error as Error).message}`,
    });
  }
}

/**
 * Handles pagination for list endpoints.
 * Assumes the API uses 'nextPageToken' for pagination and returns items under a specific key.
 *
 * @param {IExecuteFunctions} this The context object.
 * @param {string} method The HTTP method (should be GET or POST for list endpoints).
 * @param {string} endpoint The API endpoint path.
 * @param {string} itemsKey The key in the response object that holds the array of items.
 * @param {IDataObject} [body] The request body (if method is POST).
 * @param {IDataObject} [initialQs] Initial query string parameters (excluding pagination).
 * @returns {Promise<IDataObject[]>} An array of all fetched items.
 */
export async function druvaMspApiRequestAllItems(
  this: IExecuteFunctions,
  method: string,
  endpoint: string,
  itemsKey: string,
  body?: IDataObject,
  initialQs?: IDataObject,
): Promise<IDataObject[]> {
  console.log(`[DEBUG] Pagination - Starting paginated request to ${endpoint}`);
  console.log(`[DEBUG] Pagination - Looking for items under key ${itemsKey}`);

  const allItems: IDataObject[] = [];
  let nextPageToken: string | undefined | null = undefined;
  const pageSize = 1000;
  let pageCount = 0;

  do {
    pageCount++;
    console.log(`[DEBUG] Pagination - Fetching page ${pageCount}`);

    const qs: IDataObject = { ...(initialQs || {}), pageSize: pageSize };
    if (nextPageToken) {
      qs.nextPageToken = nextPageToken;
      console.log(`[DEBUG] Pagination - Using nextPageToken: ${nextPageToken}`);
    }

    try {
      const response = (await druvaMspApiRequest.call(
        this,
        method,
        endpoint,
        body || undefined,
        qs,
      )) as IDataObject;

      console.log(`[DEBUG] Pagination - Response received for page ${pageCount}`);
      console.log('[DEBUG] Pagination - Response keys:', Object.keys(response));

      const items = response[itemsKey] as IDataObject[] | undefined;
      nextPageToken = response.nextPageToken as string | undefined | null;

      if (nextPageToken) {
        console.log(`[DEBUG] Pagination - Next page token found: ${nextPageToken}`);
      } else {
        console.log('[DEBUG] Pagination - No next page token found, this is the last page');
      }

      if (Array.isArray(items)) {
        console.log(`[DEBUG] Pagination - Found ${items.length} items on this page`);
        allItems.push(...items);
      } else {
        console.warn(
          `[WARN] Pagination - Expected an array under key ${itemsKey} but received:`,
          items,
        );
        console.log('[DEBUG] Pagination - Response structure:', response);
        nextPageToken = null;
      }

      if (items === undefined || items.length === 0) {
        console.log('[DEBUG] Pagination - No items found on this page, stopping pagination');
        nextPageToken = null;
      }
    } catch (error) {
      console.error(`[ERROR] Pagination - Failed during page ${pageCount}:`, error);
      throw error;
    }
  } while (nextPageToken);

  console.log(
    `[DEBUG] Pagination - Complete. Retrieved ${allItems.length} items total across ${pageCount} pages`,
  );
  return allItems;
}

// TODO: Add function for handling pagination?
// async function druvaMspHandlePagination(...) {...}
