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
import { logger } from './LoggerHelper';

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
      logger.debug(
        `API Request: ${method} ${options.uri}${
          method === 'POST' || method === 'PUT'
            ? ` with ${Object.keys(body).length} parameters`
            : Object.keys(qs).length > 0
              ? ` with ${Object.keys(qs).length} query params`
              : ''
        }`,
      );
    }

    // Make the actual API request
    const response = await this.helpers.request(options);

    // If API call is to a Reports endpoint, add summary debug logging for response
    if (endpoint.includes('/reports/') || endpoint.includes('/reporting/')) {
      if (typeof response === 'object') {
        logger.debug(
          `API Response: Success. ${
            Array.isArray(response.data)
              ? `Received ${response.data?.length || 0} records`
              : `Response keys: ${Object.keys(response).join(', ')}`
          }${response.nextPageToken ? ' (has more pages)' : ''}`,
        );
      } else {
        logger.debug(`API Response: Success. Response type: ${typeof response}`);
      }
    }

    return response;
  } catch (error) {
    if (endpoint.includes('/reports/') || endpoint.includes('/reporting/')) {
      logger.error(
        `API Error: ${error.statusCode || 500} - ${error.message || 'Unknown error'}${
          error.response?.body ? ' (details in API response)' : ''
        }`,
        error,
      );
    }

    // Handle API error response
    return handleApiError(error as JsonObject, endpoint);
  }
}
