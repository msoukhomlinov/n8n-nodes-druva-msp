// Contains the execution logic for Customer resource operations

import type { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';

import { druvaMspApiRequest, druvaMspApiRequestAllItems } from './GenericFunctions';
import { getCustomerStatusLabel } from './helpers/ValueConverters';
import { logger } from './helpers/LoggerHelper';
import { getDruvaMspAccessToken } from './helpers/AuthHelpers';

/**
 * Processes the customer data to add derived fields
 * @param customer The customer data from the API
 * @returns The customer data with additional derived fields
 */
function processCustomerData(customer: IDataObject): IDataObject {
  // Create a new object to ensure status_label appears right after status
  const processedCustomer: IDataObject = {};

  // Add all properties from the original customer object to the new object
  // When we encounter the status field, add status_label immediately after it
  for (const key in customer) {
    processedCustomer[key] = customer[key];

    // If this is the status field, add the status_label immediately after
    if (key === 'status' && customer.status !== undefined) {
      // Convert to number if it's a string
      const statusCode =
        typeof customer.status === 'string' ? Number(customer.status) : (customer.status as number);
      processedCustomer.status_label = getCustomerStatusLabel(statusCode);
    }
  }

  return processedCustomer;
}

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
    const hideDruvaCustomerName = this.getNodeParameter(
      'hideDruvaCustomerName',
      i,
      false,
    ) as boolean;

    // Get accountName if custom name is enabled, otherwise use customerName
    let accountName: string;
    if (hideDruvaCustomerName) {
      accountName = this.getNodeParameter('accountName', i, '') as string;
    } else {
      accountName = customerName;
      await logger.debug(`Customer: Using customer name as account name: ${accountName}`, this);
    }

    const tenantAdmins = this.getNodeParameter('tenantAdmins', i, []) as string[];
    const phoneNumber = this.getNodeParameter('phoneNumber', i, '') as string;
    const address = this.getNodeParameter('address', i, '') as string;

    // Include only the required fields according to the API spec
    const body: IDataObject = {
      customerName,
      accountName,
      phone: phoneNumber,
      address,
    };

    // Only add tenantAdmins if any admins are specified
    if (tenantAdmins && Array.isArray(tenantAdmins) && tenantAdmins.length > 0) {
      await logger.debug(
        `Customer: Processing ${tenantAdmins.length} tenant admins for customer creation`,
        this,
      );

      // Convert string IDs to numbers if they are numeric strings
      const tenantAdminIds = tenantAdmins.map((id) => {
        // Handle both string and number IDs
        if (typeof id === 'string') {
          const numId = Number.parseInt(id, 10);
          if (!Number.isNaN(numId)) {
            return numId;
          }
          return id;
        }
        return id;
      });

      await logger.debug(
        `Customer: Tenant admins processing complete: ${tenantAdminIds.length} IDs processed`,
        this,
      );
      body.tenantAdmins = tenantAdminIds;
    } else {
      await logger.debug('Customer: No tenant admins specified for customer creation', this);
    }

    // Handle features if enabled
    const updateFeatures = this.getNodeParameter('updateFeatures', i, false) as boolean;
    if (updateFeatures) {
      const securityPostureAndObservability = this.getNodeParameter(
        'securityPostureAndObservability',
        i,
        false,
      ) as boolean;

      // Create the features array based on selected options
      const features: IDataObject[] = [];

      if (securityPostureAndObservability) {
        features.push({
          name: 'Security Posture and Observability',
        });
      }

      // Add features array to body (empty array is valid per API spec)
      body.features = features;

      await logger.debug(
        `Customer: Adding features for customer creation: ${JSON.stringify(features)}`,
        this,
      );
    }

    const endpoint = '/msp/v3/customers';
    const response = await druvaMspApiRequest.call(this, 'POST', endpoint, body);
    responseData = this.helpers.returnJsonArray([response as IDataObject]);
  } else if (operation === 'get') {
    const customerId = this.getNodeParameter('customerId', i, '') as string;
    const endpoint = `/msp/v3/customers/${customerId}`;
    const response = await druvaMspApiRequest.call(this, 'GET', endpoint);

    // Process the customer data to add derived fields
    const processedCustomer = processCustomerData(response as IDataObject);

    responseData = this.helpers.returnJsonArray([processedCustomer]);
  } else if (operation === 'getMany') {
    const returnAll = this.getNodeParameter('returnAll', i, false) as boolean;
    const limit = this.getNodeParameter('limit', i, 50) as number;
    const endpoint = '/msp/v3/customers';

    let customers: IDataObject[] = [];

    // Retrieve customers from API
    if (returnAll) {
      customers = (await druvaMspApiRequestAllItems.call(
        this,
        'GET',
        endpoint,
        'customers',
      )) as IDataObject[];
    } else {
      // API spec requires pageSize as string
      const response = await druvaMspApiRequest.call(this, 'GET', endpoint, undefined, {
        pageSize: limit.toString(),
      });
      customers = ((response as IDataObject)?.customers as IDataObject[]) || [];
    }

    // Process each customer to add derived fields
    customers = customers.map((customer) => processCustomerData(customer));

    // Check if any filters are enabled
    const filterByCustomerName = this.getNodeParameter('filterByCustomerName', i, false) as boolean;
    const filterByAccountName = this.getNodeParameter('filterByAccountName', i, false) as boolean;

    // Apply client-side filtering if any filters are enabled
    if (filterByCustomerName || filterByAccountName) {
      // Apply each enabled filter
      customers = customers.filter((customer: IDataObject) => {
        let matchesCustomerName = true;
        let matchesAccountName = true;

        // Filter by customer name if enabled
        if (filterByCustomerName) {
          const operator = this.getNodeParameter('customerNameOperator', i, 'contains') as string;
          const value = this.getNodeParameter('customerNameValue', i, '') as string;
          const customerValue = customer.customerName as string;

          // Case-insensitive comparison
          const customerStringValue = String(customerValue || '').toLowerCase();
          const compareValue = String(value).toLowerCase();

          // Apply the correct operator
          switch (operator) {
            case 'contains':
              matchesCustomerName = customerStringValue.includes(compareValue);
              break;
            case 'notContains':
              matchesCustomerName = !customerStringValue.includes(compareValue);
              break;
            case 'equals':
              matchesCustomerName = customerStringValue === compareValue;
              break;
            case 'notEquals':
              matchesCustomerName = customerStringValue !== compareValue;
              break;
            case 'startsWith':
              matchesCustomerName = customerStringValue.startsWith(compareValue);
              break;
            case 'endsWith':
              matchesCustomerName = customerStringValue.endsWith(compareValue);
              break;
            default:
              matchesCustomerName = true;
          }
        }

        // Filter by account name if enabled
        if (filterByAccountName) {
          const operator = this.getNodeParameter('accountNameOperator', i, 'contains') as string;
          const value = this.getNodeParameter('accountNameValue', i, '') as string;
          const customerValue = customer.accountName as string;

          // Case-insensitive comparison
          const customerStringValue = String(customerValue || '').toLowerCase();
          const compareValue = String(value).toLowerCase();

          // Apply the correct operator
          switch (operator) {
            case 'contains':
              matchesAccountName = customerStringValue.includes(compareValue);
              break;
            case 'notContains':
              matchesAccountName = !customerStringValue.includes(compareValue);
              break;
            case 'equals':
              matchesAccountName = customerStringValue === compareValue;
              break;
            case 'notEquals':
              matchesAccountName = customerStringValue !== compareValue;
              break;
            case 'startsWith':
              matchesAccountName = customerStringValue.startsWith(compareValue);
              break;
            case 'endsWith':
              matchesAccountName = customerStringValue.endsWith(compareValue);
              break;
            default:
              matchesAccountName = true;
          }
        }

        // Customer must match all enabled filters (AND logic)
        return matchesCustomerName && matchesAccountName;
      });

      // Apply limit after filtering if not returning all results
      if (!returnAll && customers.length > limit) {
        customers = customers.slice(0, limit);
      }
    }

    responseData = this.helpers.returnJsonArray(customers);
  } else if (operation === 'update') {
    const customerId = this.getNodeParameter('customerId', i, '') as string;
    const customerName = this.getNodeParameter('customerName', i, '') as string;
    const tenantAdmins = this.getNodeParameter('tenantAdmins', i, []) as string[];
    const phoneNumber = this.getNodeParameter('phoneNumber', i, '') as string;
    const address = this.getNodeParameter('address', i, '') as string;

    // Include required fields with proper naming
    const body: IDataObject = {
      customerName,
      phone: phoneNumber,
      address,
    };

    // Only add tenantAdmins if any admins are specified
    if (tenantAdmins && Array.isArray(tenantAdmins) && tenantAdmins.length > 0) {
      await logger.debug(
        `Customer: Processing ${tenantAdmins.length} tenant admins for customer update`,
        this,
      );

      // Convert string IDs to numbers if they are numeric strings
      const tenantAdminIds = tenantAdmins.map((id) => {
        // Handle both string and number IDs
        if (typeof id === 'string') {
          const numId = Number.parseInt(id, 10);
          if (!Number.isNaN(numId)) {
            return numId;
          }
          return id;
        }
        return id;
      });

      await logger.debug(
        `Customer: Tenant admins processing complete: ${tenantAdminIds.length} IDs processed`,
        this,
      );
      body.tenantAdmins = tenantAdminIds;
    } else {
      await logger.debug('Customer: No tenant admins specified for customer update', this);
    }

    // Handle features update if enabled
    // Note: Features is optional in UpdateCustomerRequest schema, so we only include it when explicitly enabled
    // Per API spec: "You MUST provide information for all the fields" - this refers to required fields (customerName, phone, address)
    const updateFeatures = this.getNodeParameter('updateFeatures', i, false) as boolean;
    if (updateFeatures) {
      const securityPostureAndObservability = this.getNodeParameter(
        'securityPostureAndObservability',
        i,
        false,
      ) as boolean;

      // Create the features array based on selected options
      const features: IDataObject[] = [];

      if (securityPostureAndObservability) {
        features.push({
          name: 'Security Posture and Observability',
        });
      }

      // Only add the features property if we have features to enable
      // An empty array will disable all features
      body.features = features;

      await logger.debug(
        `Customer: Updating features for customer: ${JSON.stringify(features)}`,
        this,
      );
    }

    const endpoint = `/msp/v3/customers/${customerId}`;
    const response = await druvaMspApiRequest.call(this, 'PUT', endpoint, body);
    responseData = this.helpers.returnJsonArray([response as IDataObject]);
  } else if (operation === 'getToken') {
    const customerId = this.getNodeParameter('customerId', i, '') as string;
    const endpoint = `/msp/v2/customers/${customerId}/token`;

    // API requires form-urlencoded body with grant_type=client_credentials
    // Get MSP access token first
    const mspAccessToken = await getDruvaMspAccessToken.call(this);
    const credentials = await this.getCredentials('druvaMspApi');
    const baseUrl = (credentials.apiBaseUrl as string) || 'https://apis.druva.com';

    // Make request with form-urlencoded body
    const response = await this.helpers.request({
      method: 'POST',
      url: `${baseUrl}${endpoint}`,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Bearer ${mspAccessToken}`,
      },
      body: 'grant_type=client_credentials',
      json: true,
    });

    responseData = this.helpers.returnJsonArray([response as IDataObject]);
  }

  return responseData;
}
