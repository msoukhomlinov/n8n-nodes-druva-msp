import type { ICredentialTestRequest, ICredentialType, INodeProperties } from 'n8n-workflow';

export class DruvaMspApi implements ICredentialType {
  name = 'druvaMspApi';
  displayName = 'Druva MSP API';
  documentationUrl = 'https://developer.druva.com/reference/msp-authentication';
  properties: INodeProperties[] = [
    {
      displayName: 'Base URL',
      name: 'baseUrl',
      type: 'string',
      default: 'https://apis.druva.com',
      description: 'The base URL for the Druva MSP API.',
    },
    {
      displayName: 'Client ID',
      name: 'clientId',
      type: 'string',
      typeOptions: {
        password: false,
      },
      default: '',
      required: true,
    },
    {
      displayName: 'Secret Key',
      name: 'clientSecret',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      required: true,
    },
    {
      displayName: 'Enable Debug Logging',
      name: 'enableDebug',
      type: 'boolean',
      default: false,
      description:
        'Enable detailed debug logging to console. Useful for troubleshooting API requests and responses.',
    },
  ];

  test: ICredentialTestRequest = {
    request: {
      baseURL: '={{$credentials.baseUrl}}',
      url: '/msp/auth/v1/token',
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'content-type': 'application/x-www-form-urlencoded',
      },
      auth: {
        username: '={{$credentials.clientId.trim()}}',
        password: '={{$credentials.clientSecret.trim()}}',
      },
      body: 'grant_type=client_credentials',
    },
  };
}
