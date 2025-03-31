"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DruvaMspApi = void 0;
class DruvaMspApi {
    constructor() {
        this.name = 'druvaMspApi';
        this.displayName = 'Druva MSP API';
        this.documentationUrl = 'https://developer.druva.com/reference/msp-authentication';
        this.properties = [
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
        ];
        this.test = {
            request: {
                baseURL: '={{$credentials.baseUrl}}',
                url: '/msp/auth/v1/token',
                method: 'POST',
                headers: {
                    accept: 'application/json',
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
}
exports.DruvaMspApi = DruvaMspApi;
//# sourceMappingURL=DruvaMspApi.credentials.js.map