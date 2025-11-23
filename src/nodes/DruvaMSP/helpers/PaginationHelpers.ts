import type {
  IExecuteFunctions,
  IDataObject,
  ILoadOptionsFunctions,
  IHookFunctions,
  IHttpRequestOptions,
  IHttpRequestMethods,
} from 'n8n-workflow';

import { druvaMspApiRequest } from './ApiRequestHelpers';
import { getDruvaMspAccessToken } from './AuthHelpers';
import { logger } from './LoggerHelper';

/**
 * Helper class for managing pagination through API requests.
 * Handles token tracking, loop detection, and safety limits.
 */
export class PaginationHelper {
  private seenTokens: Set<string>;
  private loopCounter: number;
  private readonly maxLoopCount: number;

  /**
   * Initialize a new pagination helper
   * @param maxLoopCount Maximum number of pagination requests to allow (default: 100)
   */
  constructor(maxLoopCount = 100) {
    this.seenTokens = new Set<string>();
    this.loopCounter = 0;
    this.maxLoopCount = maxLoopCount;
  }

  /**
   * Track a token and check for loops
   * @param token The token to track
   * @returns true if safe to continue, false if a loop was detected
   */
  trackToken(token: string | null | undefined): boolean {
    if (!token) {
      return false; // No token, don't continue pagination
    }

    // Increment request counter
    this.loopCounter++;

    // Safety check for maximum number of pagination requests
    if (this.loopCounter > this.maxLoopCount) {
      logger.warn(
        `Pagination: Reached maximum number of pagination requests (${this.maxLoopCount}). This might indicate an API issue.`,
      );
      return false;
    }

    // Check if we've seen this token before (loop detection)
    if (this.seenTokens.has(token)) {
      logger.warn(
        `Pagination: Detected pagination loop with token: ${token}. Stopping pagination.`,
      );
      return false;
    }

    // Add token to seen set
    this.seenTokens.add(token);
    return true;
  }

  /**
   * Check if we've hit the maximum number of requests
   * @returns true if we've hit the max, false otherwise
   */
  isMaxRequestsReached(): boolean {
    return this.loopCounter >= this.maxLoopCount;
  }

  /**
   * Get the current loop counter
   * @returns The current loop counter
   */
  getLoopCount(): number {
    return this.loopCounter;
  }

  /**
   * Increment the loop counter and check if we've hit the max
   * @returns true if safe to continue, false if we've hit the max
   */
  incrementCounter(): boolean {
    this.loopCounter++;
    return this.loopCounter <= this.maxLoopCount;
  }

  /**
   * Check if an array of items is valid and non-empty
   * @param items The array to check
   * @returns true if the array is valid and has items, false otherwise
   */
  hasItems(items: unknown[] | undefined): boolean {
    return Array.isArray(items) && items.length > 0;
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
  this: IHookFunctions | IExecuteFunctions | ILoadOptionsFunctions,
  method: IHttpRequestMethods,
  endpoint: string,
  responseKey: string,
  body: IDataObject = {},
  query: IDataObject = {},
): Promise<unknown[]> {
  const returnData: IDataObject[] = [];
  let responseData: IDataObject = {};

  // Loop detection variables
  const seenTokens = new Set<string>();
  let loopCounter = 0;
  const MAX_LOOP_COUNT = 100; // Reasonable upper limit for pagination requests

  // Store initial query parameters for first request
  const initialQuery = { ...query };
  let pageToken: string | undefined | null = undefined;

  do {
    // Prepare query parameters for this request
    // IMPORTANT: For Druva API, "You can query using the pageToken or filters; you cannot provide both simultaneously."
    let requestQuery: IDataObject;
    if (pageToken) {
      // For subsequent requests, ONLY include pageToken parameter with no other parameters
      requestQuery = { pageToken };
    } else {
      // First request, include all initial parameters
      requestQuery = { ...initialQuery };
    }

    responseData = (await druvaMspApiRequest.call(
      this,
      method,
      endpoint,
      body,
      requestQuery,
    )) as IDataObject;
    const items = responseData[responseKey] as IDataObject[];

    if (items === undefined) {
      throw new Error(
        `Response does not contain key "${responseKey}". Response was: ${JSON.stringify(
          responseData,
        )}`,
      );
    }

    returnData.push(...items);

    // Handle pagination if there's a nextPageToken
    // API returns "nextPageToken" but expects "pageToken" in subsequent requests
    pageToken = responseData.nextPageToken as string | undefined | null;

    // Loop detection
    if (pageToken) {
      // Check if we've seen this token before (loop detection)
      if (seenTokens.has(pageToken)) {
        logger.warn(
          `AllItems: Detected pagination loop with token: ${pageToken}. Stopping pagination.`,
        );
        break;
      }

      // Add token to seen set
      seenTokens.add(pageToken);

      // Increment request counter
      loopCounter++;

      // Safety check for maximum number of pagination requests
      if (loopCounter > MAX_LOOP_COUNT) {
        logger.warn(
          `AllItems: Reached maximum number of pagination requests (${MAX_LOOP_COUNT}). This might indicate an API issue.`,
        );
        break;
      }
    }
  } while (pageToken);

  return returnData;
}

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
  await logger.debug(`Options: Starting paginated request to ${endpoint}`, this);
  await logger.debug(`Options: Looking for items under key ${itemsKey}`, this);

  // Get credentials for API access
  const credentials = await this.getCredentials('druvaMspApi');
  const baseUrl = credentials.baseUrl || 'https://apis.druva.com';

  // Get access token using the extracted function
  const accessToken = await getDruvaMspAccessToken.call(this);

  const allItems: IDataObject[] = [];
  let pageToken: string | undefined | null = undefined;
  const pageSize = 100; // Use a large page size for loading options
  let pageCount = 0;
  const previousTokens = new Set<string>(); // Prevent infinite loops

  // Add maximum pages limit
  const MAX_TOTAL_PAGES = 100;
  // Track consecutive single-item pages
  let consecutiveSingleItemPages = 0;
  const MAX_CONSECUTIVE_SINGLE_ITEM_PAGES = 5;

  do {
    pageCount++;
    await logger.debug(`Options: Fetching page ${pageCount}`, this);

    // Safety check - limit total pages to prevent excessive API calls
    if (pageCount > MAX_TOTAL_PAGES) {
      logger.warn(`Options: Reached maximum page limit of ${MAX_TOTAL_PAGES}, stopping pagination`);
      break;
    }

    // IMPORTANT: For Druva API, "You can query using the pageToken or filters; you cannot provide both simultaneously."
    let qs: IDataObject;
    if (pageToken) {
      // For subsequent requests, ONLY include pageToken parameter with no other parameters
      qs = { pageToken };
      await logger.debug(`Options: Using pageToken: ${pageToken}`, this);
      await logger.debug(
        'Options: IMPORTANT: Using only pageToken with no other parameters as per API requirements',
        this,
      );

      // Check for repeat tokens to prevent infinite loops
      if (previousTokens.has(pageToken)) {
        logger.warn(
          `Options: Detected repeat token "${pageToken}" - stopping pagination to prevent infinite loop`,
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

      await logger.debug(
        `Options: First request includes initial parameters: ${JSON.stringify(qs)}`,
        this,
      );
    }

    try {
      // Make the API request
      const url = `${baseUrl}${endpoint}`;
      await logger.debug(`Options: Making request to: ${url}`, this);

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

      await logger.debug(`Options: Response received for page ${pageCount}`, this);
      await logger.debug(`Options: Response keys: ${Object.keys(response).join(', ')}`, this);

      const items = response[itemsKey] as IDataObject[] | undefined;
      // API returns nextPageToken but expects pageToken in requests
      pageToken = response.nextPageToken as string | undefined | null;

      // Process the retrieved items
      if (Array.isArray(items)) {
        await logger.debug(`Options: Found ${items.length} items on this page`, this);

        // Check if we're getting inefficient pagination (single items per page)
        if (items.length === 1) {
          consecutiveSingleItemPages++;

          // If we've had too many consecutive single-item pages, warn and consider stopping
          if (consecutiveSingleItemPages >= MAX_CONSECUTIVE_SINGLE_ITEM_PAGES) {
            logger.warn(
              `Options: Received ${consecutiveSingleItemPages} consecutive pages with only 1 item. This appears to be the Druva API's normal behavior for Events, but is inefficient.`,
            );
          }
        } else {
          // Reset the counter if we get a page with more than 1 item
          consecutiveSingleItemPages = 0;
        }

        allItems.push(...items);
      } else {
        logger.warn(
          `Options: Expected an array under key ${itemsKey} but received: ${JSON.stringify(items)}`,
        );
        await logger.debug(`Options: Response structure: ${JSON.stringify(response)}`, this);
        pageToken = null;
      }

      if (pageToken) {
        await logger.debug(`Options: Next page token found: ${pageToken}`, this);
      } else {
        await logger.debug('Options: No next page token found, this is the last page', this);
      }

      if (items === undefined || items.length === 0) {
        await logger.debug('Options: No items found on this page, stopping pagination', this);
        pageToken = null;
      }
    } catch (error) {
      logger.error(`Options: Failed during page ${pageCount}:`, error as Error);
      throw error;
    }
  } while (pageToken);

  await logger.debug(
    `Options: Complete. Retrieved ${allItems.length} items total across ${pageCount} pages`,
    this,
  );
  return allItems;
}

/**
 * Make paginated API requests to the Druva MSP API report endpoints using POST
 * with nextPageToken in the request body and return all results
 */
export async function druvaMspApiRequestAllReportItems(
  this: IExecuteFunctions,
  endpoint: string,
  initialBody: IDataObject,
  responseKey = 'items',
): Promise<IDataObject[]> {
  const allItems: IDataObject[] = [];
  let nextPageToken: string | null | undefined = undefined;

  // Store the initial body separately - we'll need it only for the first request
  const firstRequestBody = { ...initialBody };

  // Ensure we use maximum page size for efficiency when not explicitly set
  if (firstRequestBody.filters && typeof firstRequestBody.filters === 'object') {
    // If filters exists and has a pageSize property, make sure it's maximized
    const filters = firstRequestBody.filters as IDataObject;
    if (!filters.pageSize) {
      filters.pageSize = 100;
    }
  } else if (firstRequestBody.pageSize === undefined) {
    // For backward compatibility with older code that sets pageSize directly on body
    firstRequestBody.pageSize = 100;
  }

  // Use the new PaginationHelper class for token tracking and loop detection
  const paginationHelper = new PaginationHelper(100);

  do {
    // Prepare the body for this request
    let requestBody: IDataObject;

    if (nextPageToken) {
      // For Druva API: "You can query using the pageToken/nextPageToken or filters; you cannot provide both simultaneously."
      // For report endpoints, API returns "nextPageToken" but expects "pageToken" in requests
      requestBody = { pageToken: nextPageToken };
      await logger.debug(`Report: Using only pageToken for pagination: ${nextPageToken}`, this);

      // Check for token loop - if detected, stop pagination
      if (!paginationHelper.trackToken(nextPageToken)) {
        break;
      }
    } else {
      // For the first request, use the initial body with all filters
      requestBody = firstRequestBody;
      await logger.debug('Report: Using initial request body with filters for first page', this);

      // Even without a token, increment the loop counter for safety limits
      if (!paginationHelper.incrementCounter()) {
        break;
      }
    }

    // Debug logging to show request structure
    await logger.debug(
      `Report: Request body for ${endpoint}: ${JSON.stringify(requestBody, null, 2)}`,
      this,
    );

    // Make the request
    const response = (await druvaMspApiRequest.call(
      this,
      'POST',
      endpoint,
      requestBody,
    )) as IDataObject;

    // Get items from the response
    const items = response[responseKey] as IDataObject[] | undefined;
    nextPageToken = response.nextPageToken as string | null | undefined;

    // Debug logging for response
    await logger.debug(
      `Report: Response from ${endpoint} has nextPageToken: ${nextPageToken}`,
      this,
    );
    await logger.debug(`Report: Response contains ${items ? items.length : 0} items`, this);

    // Add items to our result array if we have any
    if (paginationHelper.hasItems(items)) {
      allItems.push(...(items as IDataObject[]));
    } else {
      // No more items, exit the loop
      nextPageToken = null;
    }
  } while (nextPageToken);

  return allItems;
}

/**
 * Make paginated API requests to the Druva MSP API V2 report endpoints using POST
 * with nextPageToken in the request body and return all results
 */
export async function druvaMspApiRequestAllReportV2Items(
  this: IExecuteFunctions,
  endpoint: string,
  initialBody: IDataObject,
  responseKey = 'data',
): Promise<IDataObject[]> {
  const allItems: IDataObject[] = [];
  let nextPageToken: string | null | undefined = undefined;

  // Store the initial body separately - we'll need it only for the first request
  const firstRequestBody = { ...initialBody };

  // Ensure we use maximum page size for efficiency when not explicitly set
  if (firstRequestBody.filters && typeof firstRequestBody.filters === 'object') {
    // If filters exists and has a pageSize property, make sure it's maximized
    const filters = firstRequestBody.filters as IDataObject;
    if (!filters.pageSize) {
      filters.pageSize = 100;
    }
  } else if (firstRequestBody.pageSize === undefined) {
    // For backward compatibility with older code that sets pageSize directly on body
    firstRequestBody.pageSize = 100;
  }

  // Loop detection variables
  const seenTokens = new Set<string>();
  let loopCounter = 0;
  const MAX_LOOP_COUNT = 100; // Reasonable upper limit for pagination requests

  do {
    // Prepare the body for this request
    let requestBody: IDataObject;

    if (nextPageToken) {
      // For Druva API: "You can query using the pageToken or filters; you cannot provide both simultaneously."
      // Also important: API returns "nextPageToken" but expects "pageToken" in subsequent requests
      requestBody = { pageToken: nextPageToken };

      // Debug logging
      await logger.debug(`ReportV2: Using only pageToken for pagination: ${nextPageToken}`, this);

      // Loop detection - check if we've seen this token before
      if (seenTokens.has(nextPageToken)) {
        logger.warn(
          `ReportV2: Detected pagination loop with token: ${nextPageToken}. Stopping pagination.`,
        );
        break;
      }

      // Add token to seen set
      seenTokens.add(nextPageToken);
    } else {
      // For the first request, use the initial body with all filters
      requestBody = firstRequestBody;
      await logger.debug('ReportV2: Using initial request body with filters for first page', this);
    }

    // Debug logging to show request structure
    await logger.debug(
      `ReportV2: Request body for ${endpoint}: ${JSON.stringify(requestBody, null, 2)}`,
      this,
    );

    // Increment request counter
    loopCounter++;

    // Safety check for maximum number of pagination requests
    if (loopCounter > MAX_LOOP_COUNT) {
      logger.warn(
        `ReportV2: Reached maximum number of pagination requests (${MAX_LOOP_COUNT}). This might indicate an API issue.`,
      );
      break;
    }

    // Make the request
    const response = (await druvaMspApiRequest.call(
      this,
      'POST',
      endpoint,
      requestBody,
    )) as IDataObject;

    // Get items from the response (data array instead of items)
    const items = response[responseKey] as IDataObject[] | undefined;
    nextPageToken = response.nextPageToken as string | null | undefined;

    // Debug logging for response
    await logger.debug(
      `ReportV2: Response from ${endpoint} has nextPageToken: ${nextPageToken}`,
      this,
    );
    await logger.debug(`ReportV2: Response contains ${items ? items.length : 0} items`, this);

    // Add items to our result array
    if (Array.isArray(items) && items.length > 0) {
      allItems.push(...items);
    } else {
      // No more items, exit the loop
      nextPageToken = null;
    }
  } while (nextPageToken);

  return allItems;
}

/**
 * Make paginated API requests to the Druva MSP API endpoints using page-based pagination
 * This is for endpoints that use page and pageSize parameters instead of tokens
 */
export async function druvaMspApiRequestAllPagedItems(
  this: IExecuteFunctions,
  method: IHttpRequestMethods,
  endpoint: string,
  initialBody: IDataObject,
  responseKey = 'items',
): Promise<IDataObject[]> {
  const allItems: IDataObject[] = [];
  const body = { ...initialBody };

  // Default page size if not provided
  const pageSize = (body.pageSize as number) || 100;
  let page = (body.page as number) || 1;

  // Loop detection variables
  let loopCounter = 0;
  const MAX_LOOP_COUNT = 100; // Reasonable upper limit for pagination requests
  let previousItemCount = -1; // Track previous response size to detect pagination issues

  do {
    // Update page number in request body
    body.page = page;
    body.pageSize = pageSize;

    // Increment request counter
    loopCounter++;

    // Safety check for maximum number of pagination requests
    if (loopCounter > MAX_LOOP_COUNT) {
      logger.warn(
        `PagedItems: Reached maximum number of pagination requests (${MAX_LOOP_COUNT}). This might indicate an API issue.`,
      );
      break;
    }

    // Make the request
    const response = (await druvaMspApiRequest.call(this, method, endpoint, body)) as IDataObject;

    // Get items from the response
    const items = response[responseKey] as IDataObject[] | undefined;

    // Add items to our result array if we have any
    if (Array.isArray(items) && items.length > 0) {
      allItems.push(...items);

      // If we got fewer items than the page size, this is the last page
      if (items.length < pageSize) {
        break;
      }

      // Loop detection - if we got the same number of items as before and it's not a full page,
      // we might be in a loop
      if (items.length === previousItemCount && items.length < pageSize) {
        logger.warn(
          `PagedItems: Detected potential pagination loop at page ${page}. Stopping pagination.`,
        );
        break;
      }

      // Store the current item count for next iteration's loop detection
      previousItemCount = items.length;

      // Increment page number for next request
      page++;
    } else {
      // No more items, exit the loop
      break;
    }
  } while (loopCounter < MAX_LOOP_COUNT && previousItemCount !== 0);

  return allItems;
}
