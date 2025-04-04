import type {
  IExecuteFunctions,
  IHttpRequestOptions,
  JsonObject,
  ILoadOptionsFunctions,
  IHookFunctions,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

/**
 * Retrieves an access token using Basic Auth with Client ID and Secret Key.
 * @deprecated Use getDruvaMspAccessToken instead
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
 * Get an access token for the Druva MSP API
 * Uses client credentials flow with Basic Auth to acquire a token
 *
 * @param {IHookFunctions | IExecuteFunctions | ILoadOptionsFunctions} this The context object.
 * @returns {Promise<string>} The access token.
 */
export async function getDruvaMspAccessToken(
  this: IHookFunctions | IExecuteFunctions | ILoadOptionsFunctions,
): Promise<string> {
  // Get credentials for API access
  const credentials = await this.getCredentials('druvaMspApi');
  const baseUrl = (credentials.baseUrl as string) || 'https://apis.druva.com';
  const clientId = credentials.clientId as string;
  const clientSecret = credentials.clientSecret as string;
  const authUrl = `${baseUrl}/msp/auth/v1/token`;

  // Encode credentials for Basic Auth
  const encodedCredentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  try {
    // Get access token
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
      throw new Error('Failed to obtain access token from Druva MSP API');
    }

    return accessToken;
  } catch (error) {
    throw new Error(`Authentication error: ${(error as Error).message}`);
  }
}
