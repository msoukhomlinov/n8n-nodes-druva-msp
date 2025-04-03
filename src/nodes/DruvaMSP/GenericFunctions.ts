// Generic helper functions for Druva MSP API calls, authentication, pagination, etc.

// import type { HttpVerb } from 'n8n-core'; // Removed this incorrect attempt

import type {
  IExecuteFunctions,
  IHttpRequestOptions,
  // HttpVerb, // Removed problematic import
  JsonObject,
  IDataObject,
  ILoadOptionsFunctions,
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

  // Check if this is the customer token endpoint which requires form-urlencoded
  const isCustomerTokenEndpoint = endpoint.includes('/customers/') && endpoint.endsWith('/token');

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
  } else if (isCustomerTokenEndpoint && method.toUpperCase() === 'POST') {
    // Special handling for customer token endpoint - use form-urlencoded
    console.log('[DEBUG] Druva MSP API - Using form-urlencoded for customer token request');
    options = {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'n8n-druva-msp-node/1.0',
        Authorization: `Bearer ${accessToken}`,
      },
      method: 'POST',
      qs: qs,
      body: 'grant_type=client_credentials',
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
 * The Druva MSP API uses cursor-based pagination where each token contains the ID of the last event retrieved.
 * Note: First page may return many items, while subsequent pages may return only 1 item. This is normal behavior
 * for cursor-based pagination especially with real-time data.
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

  const allItems: IDataObject[] = [];
  let pageToken: string | undefined | null = undefined;
  const pageSize = (initialQs?.pageSize as number) || 500;
  let pageCount = 0;
  const previousTokens = new Set<string>();
  const MAX_TOTAL_PAGES = 500;
  let isFirstPage = true;
  let isSecondPage = false;

  do {
    pageCount++;
    console.log(`[DEBUG] Pagination - Fetching page ${pageCount}`);

    // Safety check - limit total pages to prevent excessive API calls
    if (pageCount > MAX_TOTAL_PAGES) {
      console.warn(
        `[WARN] Pagination - Reached maximum page limit of ${MAX_TOTAL_PAGES}, stopping pagination`,
      );
      break;
    }

    // IMPORTANT: For Druva API, "You can query using the pageToken or filters; you cannot provide both simultaneously."
    let qs: IDataObject;
    if (pageToken) {
      // For subsequent requests, ONLY include pageToken parameter with no other parameters
      qs = { pageToken };

      // Decode and log token contents for debugging
      try {
        const decodedToken = Buffer.from(pageToken, 'base64').toString();
        const parsedToken = JSON.parse(decodedToken);
        console.log('[DEBUG] Pagination - Decoded token:', parsedToken);
      } catch (error) {
        // Token might not be decodable, ignore error
      }

      // Check for repeat tokens to prevent infinite loops
      if (previousTokens.has(pageToken)) {
        console.warn(
          `[WARN] Pagination - Detected repeat token "${pageToken}" - stopping pagination to prevent infinite loop`,
        );
        break;
      }

      // Store token for loop detection
      previousTokens.add(pageToken);
    } else {
      // First request, include all initial parameters plus pageSize (if not already specified)
      qs = { ...initialQs };

      // Only add pageSize if it's not already specified in initialQs
      if (!qs.pageSize) {
        qs.pageSize = pageSize;
      }
    }

    try {
      // Pass only the parameters required for this specific request
      const response = (await druvaMspApiRequest.call(
        this,
        method,
        endpoint,
        body || undefined,
        qs,
      )) as IDataObject;

      const items = response[itemsKey] as IDataObject[] | undefined;
      // API returns nextPageToken but expects pageToken in requests
      pageToken = response.nextPageToken as string | undefined | null;

      if (items && Array.isArray(items)) {
        console.log(`[DEBUG] Pagination - Found ${items.length} items on page ${pageCount}`);

        // Add the items to our result set
        allItems.push(...items);

        // If this is the first page and we got fewer items than requested,
        // we know there are no more pages to fetch
        if (isFirstPage && items.length < pageSize) {
          console.log(
            '[DEBUG] Pagination - First page returned fewer items than requested, no more pages needed',
          );
          break;
        }

        // If this is the second page and we got fewer items than requested,
        // stop pagination as requested
        if (isSecondPage && items.length < pageSize) {
          console.log(
            '[DEBUG] Pagination - Second page returned fewer items than requested, stopping pagination',
          );
          break;
        }
      } else {
        console.warn(
          `[WARN] Pagination - Expected an array under key ${itemsKey} but received:`,
          typeof items,
        );
        pageToken = null;
      }

      // Track page transitions
      if (isFirstPage) {
        isFirstPage = false;
        isSecondPage = true;
      } else if (isSecondPage) {
        isSecondPage = false;
      }

      // Check if we should continue pagination
      if (!pageToken) {
        console.log('[DEBUG] Pagination - No next page token found, this is the last page');
        break;
      }

      if (items === undefined || items.length === 0) {
        console.log('[DEBUG] Pagination - No items found on this page, stopping pagination');
        break;
      }
    } catch (error) {
      console.error(`[ERROR] Pagination - Failed during page ${pageCount}:`, error);
      throw error;
    }
  } while (pageToken);

  console.log(
    `[DEBUG] Pagination - Complete. Retrieved ${allItems.length} items total across ${pageCount} pages`,
  );
  return allItems;
}

// TODO: Add function for handling pagination?
// async function druvaMspHandlePagination(...) {...}

/**
 * Handles pagination for list endpoints specifically for options loading.
 * Designed to work with ILoadOptionsFunctions context.
 * Similar to druvaMspApiRequestAllItems but adapted for option loading.
 *
 * @param {ILoadOptionsFunctions} this The load options context object.
 * @param {string} method The HTTP method (should be GET or POST for list endpoints).
 * @param {string} endpoint The API endpoint path.
 * @param {string} itemsKey The key in the response object that holds the array of items.
 * @param {IDataObject} [body] The request body (if method is POST).
 * @param {IDataObject} [initialQs] Initial query string parameters (excluding pagination).
 * @returns {Promise<IDataObject[]>} An array of all fetched items.
 */
export async function druvaMspApiRequestAllItemsForOptions(
  this: ILoadOptionsFunctions,
  method: string,
  endpoint: string,
  itemsKey: string,
  body?: IDataObject,
  initialQs?: IDataObject,
): Promise<IDataObject[]> {
  console.log(`[DEBUG] Options Pagination - Starting paginated request to ${endpoint}`);
  console.log(`[DEBUG] Options Pagination - Looking for items under key ${itemsKey}`);

  // Get credentials for API access
  const credentials = await this.getCredentials('druvaMspApi');
  const baseUrl = credentials.baseUrl || 'https://apis.druva.com';

  // Get access token
  const clientId = credentials.clientId as string;
  const clientSecret = credentials.clientSecret as string;
  const authUrl = `${baseUrl}/msp/auth/v1/token`;

  // Encode credentials for Basic Auth
  const encodedCredentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const tokenResponse = await this.helpers.request({
    headers: {
      accept: 'application/json',
      'content-type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${encodedCredentials}`,
    },
    method: 'POST',
    url: authUrl,
    body: 'grant_type=client_credentials',
    json: true,
  });

  const accessToken = tokenResponse.access_token as string;
  if (!accessToken) {
    throw new Error('Failed to obtain access token');
  }

  const allItems: IDataObject[] = [];
  let pageToken: string | undefined | null = undefined;
  const pageSize = 500; // Use a large page size for loading options
  let pageCount = 0;
  const previousTokens = new Set<string>(); // Prevent infinite loops

  // Add maximum pages limit
  const MAX_TOTAL_PAGES = 100;
  // Track consecutive single-item pages
  let consecutiveSingleItemPages = 0;
  const MAX_CONSECUTIVE_SINGLE_ITEM_PAGES = 5;

  do {
    pageCount++;
    console.log(`[DEBUG] Options Pagination - Fetching page ${pageCount}`);

    // Safety check - limit total pages to prevent excessive API calls
    if (pageCount > MAX_TOTAL_PAGES) {
      console.warn(
        `[WARN] Options Pagination - Reached maximum page limit of ${MAX_TOTAL_PAGES}, stopping pagination`,
      );
      break;
    }

    // IMPORTANT: For Druva API, "You can query using the pageToken or filters; you cannot provide both simultaneously."
    let qs: IDataObject;
    if (pageToken) {
      // For subsequent requests, ONLY include pageToken parameter with no other parameters
      qs = { pageToken };
      console.log(`[DEBUG] Options Pagination - Using pageToken: ${pageToken}`);
      console.log(
        '[DEBUG] Options Pagination - IMPORTANT: Using only pageToken with no other parameters as per API requirements',
      );

      // Check for repeat tokens to prevent infinite loops
      if (previousTokens.has(pageToken)) {
        console.warn(
          `[WARN] Options Pagination - Detected repeat token "${pageToken}" - stopping pagination to prevent infinite loop`,
        );
        pageToken = null;
        break;
      }

      // Store token for loop detection
      previousTokens.add(pageToken);
    } else {
      // First request, include all initial parameters plus pageSize (if not already specified)
      qs = { ...initialQs };

      // Only add pageSize if it's not already specified in initialQs
      if (!qs.pageSize) {
        qs.pageSize = pageSize;
      }

      console.log('[DEBUG] Options Pagination - First request includes initial parameters:', qs);
    }

    try {
      // Make the API request
      const url = `${baseUrl}${endpoint}`;
      console.log(`[DEBUG] Options Pagination - Making request to: ${url}`);

      const response = (await this.helpers.request({
        method: method as IHttpRequestOptions['method'],
        url,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        qs,
        body: method !== 'GET' ? body : undefined,
        json: true,
      })) as IDataObject;

      console.log(`[DEBUG] Options Pagination - Response received for page ${pageCount}`);
      console.log('[DEBUG] Options Pagination - Response keys:', Object.keys(response));

      const items = response[itemsKey] as IDataObject[] | undefined;
      // API returns nextPageToken but expects pageToken in requests
      pageToken = response.nextPageToken as string | undefined | null;

      // Process the retrieved items
      if (Array.isArray(items)) {
        console.log(`[DEBUG] Options Pagination - Found ${items.length} items on this page`);

        // Check if we're getting inefficient pagination (single items per page)
        if (items.length === 1) {
          consecutiveSingleItemPages++;

          // If we've had too many consecutive single-item pages, warn and consider stopping
          if (consecutiveSingleItemPages >= MAX_CONSECUTIVE_SINGLE_ITEM_PAGES) {
            console.warn(
              `[WARN] Options Pagination - Received ${consecutiveSingleItemPages} consecutive pages with only 1 item. This appears to be the Druva API's normal behavior for Events, but is inefficient.`,
            );
          }
        } else {
          // Reset the counter if we get a page with more than 1 item
          consecutiveSingleItemPages = 0;
        }

        allItems.push(...items);
      } else {
        console.warn(
          `[WARN] Options Pagination - Expected an array under key ${itemsKey} but received:`,
          items,
        );
        console.log('[DEBUG] Options Pagination - Response structure:', response);
        pageToken = null;
      }

      if (pageToken) {
        console.log(`[DEBUG] Options Pagination - Next page token found: ${pageToken}`);
      } else {
        console.log('[DEBUG] Options Pagination - No next page token found, this is the last page');
      }

      if (items === undefined || items.length === 0) {
        console.log(
          '[DEBUG] Options Pagination - No items found on this page, stopping pagination',
        );
        pageToken = null;
      }
    } catch (error) {
      console.error(`[ERROR] Options Pagination - Failed during page ${pageCount}:`, error);
      throw error;
    }
  } while (pageToken);

  console.log(
    `[DEBUG] Options Pagination - Complete. Retrieved ${allItems.length} items total across ${pageCount} pages`,
  );
  return allItems;
}

/**
 * Retrieves the customer ID for a specific tenant.
 * Looks up a tenant by ID and extracts its associated customer ID.
 *
 * @param {IExecuteFunctions} this The context object.
 * @param {string} tenantId The tenant ID to look up.
 * @returns {Promise<string>} The customer ID associated with the specified tenant.
 */
export async function getTenantCustomerId(
  this: IExecuteFunctions,
  tenantId: string,
): Promise<string> {
  console.log(`[DEBUG] Looking up customer ID for tenant: ${tenantId}`);

  // Get all tenants and find the matching one
  try {
    const endpoint = '/msp/v2/tenants';
    const qs = { pageSize: 500 };

    const response = (await druvaMspApiRequest.call(
      this,
      'GET',
      endpoint,
      undefined,
      qs,
    )) as IDataObject;

    if (response.tenants && Array.isArray(response.tenants)) {
      const tenants = response.tenants as IDataObject[];
      console.log(
        `[DEBUG] Retrieved ${tenants.length} tenants, searching for tenant ID: ${tenantId}`,
      );

      const targetTenant = tenants.find((tenant) => tenant.id === tenantId);

      if (targetTenant && targetTenant.customerID) {
        const customerId = targetTenant.customerID as string;
        console.log(`[DEBUG] Found customer ID ${customerId} for tenant ${tenantId}`);
        return customerId;
      }
    }

    throw new Error(`Tenant with ID ${tenantId} not found or missing customer ID`);
  } catch (error) {
    throw new Error(
      `Failed to retrieve customer ID for tenant ${tenantId}: ${(error as Error).message}`,
    );
  }
}
