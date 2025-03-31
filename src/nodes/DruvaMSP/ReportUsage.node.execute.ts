import type {
  IExecuteFunctions,
  INodeExecutionData,
  IDataObject,
  NodeApiError,
} from 'n8n-workflow';

// Import the helper functions for API requests and pagination
import { druvaMspApiRequest, druvaMspApiRequestAllItems } from './GenericFunctions';

/**
 * Formats a date for the API in the correct format.
 * For usage query parameters: ISO format (YYYY-MM-DDTHH:mm:ssZ)
 * For itemized reports body: YYYY-MM-DD format
 *
 * @param dateTime Date string from n8n
 * @param isForBody Whether the date is for a request body (true) or query param (false)
 * @returns Formatted date string
 */
function formatDate(dateTime: string, isForBody = false): string {
  const date = new Date(dateTime);

  if (isForBody) {
    // Format as YYYY-MM-DD for request body
    return date.toISOString().split('T')[0];
  }

  // Format as ISO for query parameters
  return date.toISOString();
}

/**
 * Custom function to fetch all items for report endpoints that use POST with nextToken in the body
 */
async function fetchAllReportItems(
  this: IExecuteFunctions,
  endpoint: string,
  initialBody: IDataObject,
): Promise<IDataObject[]> {
  const allItems: IDataObject[] = [];
  let nextToken: string | null | undefined = undefined;
  const body = { ...initialBody };

  do {
    // If we have a next token, add it to the body
    if (nextToken) {
      body.nextToken = nextToken;
    }

    // Make the request
    const response = (await druvaMspApiRequest.call(this, 'POST', endpoint, body)) as IDataObject;

    // Get items from the response
    const items = response.items as IDataObject[] | undefined;
    nextToken = response.nextToken as string | null | undefined;

    // Add items to our result array
    if (Array.isArray(items) && items.length > 0) {
      allItems.push(...items);
    } else {
      // No more items, exit the loop
      nextToken = null;
    }
  } while (nextToken);

  return allItems;
}

/**
 * Executes the selected Report - Usage operation.
 * @param this The context object.
 * @param i The index of the current item.
 * @returns The result of the operation.
 */
export async function executeReportUsageOperation(
  this: IExecuteFunctions,
  i: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', i, '') as string;
  let responseData: INodeExecutionData[] = [];

  try {
    if (operation === 'getGlobalSummary') {
      // Implement Get Global Usage Summary logic
      const returnAll = this.getNodeParameter('returnAll', i, false) as boolean;
      const limit = this.getNodeParameter('limit', i, 50) as number;
      const startDate = this.getNodeParameter('startDate', i, '') as string;
      const endDate = this.getNodeParameter('endDate', i, '') as string;
      const filterByCustomers = this.getNodeParameter('filterByCustomers', i, false) as boolean;

      const endpoint = '/msp/v2/reports/usage/summary';
      const qs: IDataObject = {};

      if (startDate) {
        qs.startDate = formatDate(startDate);
      }
      if (endDate) {
        qs.endDate = formatDate(endDate);
      }
      if (filterByCustomers) {
        const customerIds = this.getNodeParameter('customerIds', i, []) as string[];
        if (customerIds.length > 0) {
          qs.customerIds = customerIds.join(',');
        }
      }

      if (returnAll) {
        // For GET requests, we can use the existing helper with nextToken parameter
        // Note: the API might use nextToken instead of nextPageToken according to docs
        const allItems = await druvaMspApiRequestAllItems.call(
          this,
          'GET',
          endpoint,
          'items',
          undefined,
          qs,
        );
        responseData = this.helpers.returnJsonArray(allItems);
      } else {
        qs.pageSize = limit;
        const response = await druvaMspApiRequest.call(this, 'GET', endpoint, undefined, qs);
        const items = (response as IDataObject)?.items ?? [];
        responseData = this.helpers.returnJsonArray(items as IDataObject[]);
      }
    } else if (operation === 'getItemizedConsumption') {
      // Implement Get Itemized Tenant Consumption logic
      const returnAll = this.getNodeParameter('returnAll', i, false) as boolean;
      const limit = this.getNodeParameter('limit', i, 50) as number;
      const startDate = this.getNodeParameter('startDate', i, '') as string;
      const endDate = this.getNodeParameter('endDate', i, '') as string;
      const filterByCustomers = this.getNodeParameter('filterByCustomers', i, false) as boolean;

      const endpoint = '/msp/reporting/v1/reports/consumptionItemized';

      // Prepare request body
      const body: IDataObject = {
        startDate: formatDate(startDate, true),
        endDate: formatDate(endDate, true),
      };

      if (filterByCustomers) {
        const customerIds = this.getNodeParameter('customerIds', i, []) as string[];
        if (customerIds.length > 0) {
          body.customerIds = customerIds;
        }
      }

      if (returnAll) {
        // For POST requests with pagination in the body, use our custom function
        const allItems = await fetchAllReportItems.call(this, endpoint, body);
        responseData = this.helpers.returnJsonArray(allItems);
      } else {
        body.pageSize = limit;
        const response = await druvaMspApiRequest.call(this, 'POST', endpoint, body);
        const items = (response as IDataObject)?.items ?? [];
        responseData = this.helpers.returnJsonArray(items as IDataObject[]);
      }
    } else if (operation === 'getItemizedQuota') {
      // Implement Get Itemized Tenant Quota logic
      const returnAll = this.getNodeParameter('returnAll', i, false) as boolean;
      const limit = this.getNodeParameter('limit', i, 50) as number;
      const startDate = this.getNodeParameter('startDate', i, '') as string;
      const endDate = this.getNodeParameter('endDate', i, '') as string;
      const filterByCustomers = this.getNodeParameter('filterByCustomers', i, false) as boolean;

      const endpoint = '/msp/reporting/v1/reports/quotaItemized';

      // Prepare request body
      const body: IDataObject = {
        startDate: formatDate(startDate, true),
        endDate: formatDate(endDate, true),
      };

      if (filterByCustomers) {
        const customerIds = this.getNodeParameter('customerIds', i, []) as string[];
        if (customerIds.length > 0) {
          body.customerIds = customerIds;
        }
      }

      if (returnAll) {
        // For POST requests with pagination in the body, use our custom function
        const allItems = await fetchAllReportItems.call(this, endpoint, body);
        responseData = this.helpers.returnJsonArray(allItems);
      } else {
        body.pageSize = limit;
        const response = await druvaMspApiRequest.call(this, 'POST', endpoint, body);
        const items = (response as IDataObject)?.items ?? [];
        responseData = this.helpers.returnJsonArray(items as IDataObject[]);
      }
    }
  } catch (error) {
    if (this.continueOnFail()) {
      return [{ json: {}, error: error as NodeApiError }];
    }
    throw error;
  }

  return responseData;
}
