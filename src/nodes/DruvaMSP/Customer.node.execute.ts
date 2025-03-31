// Contains the execution logic for Customer resource operations

import type { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';

import { druvaMspApiRequest, druvaMspApiRequestAllItems } from './GenericFunctions';

/**
 * Executes the selected Customer operation.
 * @param this The context object.
 * @param i The index of the current item.
 * @returns The result of the operation.
 */
export async function executeCustomerOperation(
  this: IExecuteFunctions,
  i: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', i, '') as string;
  let responseData: INodeExecutionData[] = [];

  if (operation === 'create') {
    const customerName = this.getNodeParameter('customerName', i, '') as string;
    const accountName = this.getNodeParameter('accountName', i, '') as string;
    const adminEmail = this.getNodeParameter('adminEmail', i, '') as string;
    const phoneNumber = this.getNodeParameter('phoneNumber', i, '') as string;
    const addressDetails = this.getNodeParameter('address.addressFields', i) as IDataObject;

    // Format address as a single string instead of an object
    const formattedAddress = `${addressDetails.street}, ${addressDetails.city}, ${addressDetails.state}, ${addressDetails.country} ${addressDetails.postalCode}`;

    // Include only the required fields according to the API spec
    const body: IDataObject = {
      customerName,
      accountName,
      phone: phoneNumber,
      address: formattedAddress,
    };

    // Only add email if it's provided and not empty
    if (adminEmail && adminEmail.trim() !== '') {
      body.email = adminEmail;
    }

    const endpoint = '/msp/v2/customers';
    const response = await druvaMspApiRequest.call(this, 'POST', endpoint, body);
    responseData = this.helpers.returnJsonArray([response as IDataObject]);
  } else if (operation === 'get') {
    const customerId = this.getNodeParameter('customerId', i, '') as string;
    const endpoint = `/msp/v2/customers/${customerId}`;
    const response = await druvaMspApiRequest.call(this, 'GET', endpoint);
    responseData = this.helpers.returnJsonArray([response as IDataObject]);
  } else if (operation === 'list') {
    const returnAll = this.getNodeParameter('returnAll', i, false) as boolean;
    const limit = this.getNodeParameter('limit', i, 50) as number;
    const endpoint = '/msp/v2/customers';
    if (returnAll) {
      const allCustomers = await druvaMspApiRequestAllItems.call(
        this,
        'GET',
        endpoint,
        'customers',
      );
      responseData = this.helpers.returnJsonArray(allCustomers);
    } else {
      const response = await druvaMspApiRequest.call(this, 'GET', endpoint, undefined, {
        pageSize: limit,
      });
      const customers = (response as IDataObject)?.customers ?? [];
      responseData = this.helpers.returnJsonArray(customers as IDataObject[]);
    }
  } else if (operation === 'update') {
    const customerId = this.getNodeParameter('customerId', i, '') as string;
    const customerName = this.getNodeParameter('customerName', i, '') as string;
    const adminEmail = this.getNodeParameter('adminEmail', i, '') as string;
    const phoneNumber = this.getNodeParameter('phoneNumber', i, '') as string;
    const addressDetails = this.getNodeParameter('address.addressFields', i) as IDataObject;

    // Format address as a single string instead of an object
    const formattedAddress = `${addressDetails.street}, ${addressDetails.city}, ${addressDetails.state}, ${addressDetails.country} ${addressDetails.postalCode}`;

    // Include required fields with proper naming
    const body: IDataObject = {
      customerName,
      phone: phoneNumber,
      address: formattedAddress,
    };

    // Only add email if it's provided and not empty
    if (adminEmail && adminEmail.trim() !== '') {
      body.email = adminEmail;
    }

    const endpoint = `/msp/v2/customers/${customerId}`;
    const response = await druvaMspApiRequest.call(this, 'PUT', endpoint, body);
    responseData = this.helpers.returnJsonArray([response as IDataObject]);
  } else if (operation === 'getToken') {
    const customerId = this.getNodeParameter('customerId', i, '') as string;
    const endpoint = `/msp/v2/customers/${customerId}/token`;
    const response = await druvaMspApiRequest.call(this, 'POST', endpoint);
    responseData = this.helpers.returnJsonArray([response as IDataObject]);
  } else if (operation === 'listAdmins') {
    const customerId = this.getNodeParameter('customerId', i, '') as string;
    const returnAll = this.getNodeParameter('returnAllAdmins', i, false) as boolean;
    const limit = this.getNodeParameter('limitAdmins', i, 50) as number;
    const endpoint = `/msp/v2/customers/${customerId}/admins`;
    if (returnAll) {
      const allAdmins = await druvaMspApiRequestAllItems.call(this, 'GET', endpoint, 'admins');
      responseData = this.helpers.returnJsonArray(allAdmins);
    } else {
      const response = await druvaMspApiRequest.call(this, 'GET', endpoint, undefined, {
        pageSize: limit,
      });
      const admins = (response as IDataObject)?.admins ?? [];
      responseData = this.helpers.returnJsonArray(admins as IDataObject[]);
    }
  }

  return responseData;
}
