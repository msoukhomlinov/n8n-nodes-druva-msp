import type {
  IExecuteFunctions,
  IDataObject,
  ILoadOptionsFunctions,
  IHookFunctions,
  IRequestOptions,
  IHttpRequestMethods,
  JsonObject,
} from 'n8n-workflow';

import { getDruvaMspAccessToken } from './AuthHelpers';

/**
 * Build the API URL for a given endpoint
 */
function buildApiUrl(endpoint: string, baseUrl: string): string {
  const baseUrlWithoutTrailing = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

  const endpointWithLeading = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  return `${baseUrlWithoutTrailing}${endpointWithLeading}`;
}

/**
 * Handle API errors in a consistent way
 */
function handleApiError(error: JsonObject, endpoint: string): never {
  throw new Error(
    `Druva MSP API request error [${error.statusCode || 500}]: ${error.message || 'Unknown error'} - ${endpoint}`,
  );
}

/**
 * Make a request to the Druva MSP API
 */
export async function druvaMspApiRequest(
  this: IHookFunctions | IExecuteFunctions | ILoadOptionsFunctions,
  method: IHttpRequestMethods,
  endpoint: string,
  body: IDataObject | IDataObject[] = {},
  qs: IDataObject = {},
  uri?: string,
  option: IDataObject = {},
): Promise<unknown> {
  // Get credentials for API access
  const credentials = await this.getCredentials('druvaMspApi');
  const baseUrl = (credentials.apiBaseUrl as string) || 'https://apis.druva.com';

  try {
    // Get access token using the extracted function
    const accessToken = await getDruvaMspAccessToken.call(this);

    // Now make the actual API request with the token
    let options: IRequestOptions = {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      qs,
      body,
      uri: uri || buildApiUrl(endpoint, baseUrl),
      json: true,
    };

    // Remove body for GET requests
    if (method === 'GET' && !Object.keys(body).length) {
      // Create a new options object without the body property
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { body: unusedBody, ...optionsWithoutBody } = options;
      options = optionsWithoutBody;
    }

    options = Object.assign({}, options, option);

    // If API call is to a Reports endpoint, add detailed debug logging
    if (endpoint.includes('/reports/') || endpoint.includes('/reporting/')) {
      console.log('[DEBUG] Druva MSP API Request Details:');
      console.log(`[DEBUG] Method: ${method}`);
      console.log(`[DEBUG] URL: ${options.uri}`);
      console.log(
        '[DEBUG] Request Headers:',
        JSON.stringify(
          {
            'Content-Type': 'application/json',
            Authorization: 'Bearer <TOKEN_MASKED>',
          },
          null,
          2,
        ),
      );

      if (method === 'POST' || method === 'PUT') {
        console.log('[DEBUG] Request Body:', JSON.stringify(body, null, 2));
      }

      if (Object.keys(qs).length > 0) {
        console.log('[DEBUG] Query Params:', JSON.stringify(qs, null, 2));
      }
    }

    // Make the actual API request
    const response = await this.helpers.request(options);

    // If API call is to a Reports endpoint, add detailed debug logging for response
    if (endpoint.includes('/reports/') || endpoint.includes('/reporting/')) {
      console.log('[DEBUG] Druva MSP API Response:');
      console.log('[DEBUG] Status: Success');
      console.log('[DEBUG] Response Type:', typeof response);
      if (typeof response === 'object') {
        const keys = Object.keys(response);
        console.log('[DEBUG] Response Keys:', keys.join(', '));

        // Add more detailed debugging for the data
        if (response.data !== undefined) {
          console.log(
            '[DEBUG] Data Type:',
            Array.isArray(response.data) ? 'Array' : typeof response.data,
          );
          console.log(
            '[DEBUG] Data Length:',
            Array.isArray(response.data) ? response.data.length : 'Not an array',
          );

          // If data is an empty array, explicitly log that
          if (Array.isArray(response.data) && response.data.length === 0) {
            console.log('[DEBUG] DATA IS EMPTY ARRAY - No records match the filter criteria');
          }
          // If data is an array with elements, show the first item
          else if (Array.isArray(response.data) && response.data.length > 0) {
            console.log(
              '[DEBUG] First Data Item Sample:',
              JSON.stringify(response.data[0], null, 2),
            );
          }
        }

        // Also debug information about filters, pagination, etc.
        if (response.filters) {
          console.log('[DEBUG] Response Filters:', JSON.stringify(response.filters, null, 2));
        }

        if (response.nextPageToken) {
          console.log('[DEBUG] Next Page Token:', response.nextPageToken);
        }
      }
    }

    return response;
  } catch (error) {
    if (endpoint.includes('/reports/') || endpoint.includes('/reporting/')) {
      console.log('[DEBUG] Druva MSP API Error Response:');
      console.log('[DEBUG] Status: Failed');
      console.log('[DEBUG] Error:', error.message);
      if (error.response?.body) {
        console.log('[DEBUG] API Error Details:', JSON.stringify(error.response.body, null, 2));
      }
    }

    // Handle API error response
    return handleApiError(error as JsonObject, endpoint);
  }
}
