import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class DruvaMspApi implements ICredentialType {
	name = 'druvaMspApi';
	displayName = 'Druva MSP API';
	documentationUrl = 'https://help.druva.com/en/articles/8805729-integration-with-druva-msp-apis';
	properties: INodeProperties[] = [
		{
			displayName: 'Client ID',
			name: 'clientId',
			type: 'string',
			required: true,
		},
		{
			displayName: 'Client Secret',
			name: 'clientSecret',
			type: 'string',
			typeOptions: {
				password: true,
			},
			required: true,
		},
		{
			displayName: 'Environment',
			name: 'environment',
			type: 'options',
			default: 'production',
			options: [
				{
					name: 'Production',
					value: 'production',
				},
				{
					name: 'Custom',
					value: 'custom',
				},
			],
		},
		{
			displayName: 'Custom API URL',
			name: 'customUrl',
			type: 'string',
			default: '',
			displayOptions: {
				show: {
					environment: ['custom'],
				},
			},
			placeholder: 'https://api.example.com',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.accessToken}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.environment === "production" ? "https://apis.druva.com/msp" : $credentials.customUrl}}',
			url: '/v1/customers',
			method: 'GET',
		},
	};
}
