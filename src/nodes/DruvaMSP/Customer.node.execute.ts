// Contains the execution logic for Customer resource operations

import type { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';

import { druvaMspApiRequest, druvaMspApiRequestAllItems } from './GenericFunctions';

/**
 * Helper function to convert numeric status codes to human-readable labels
 * based on the official Druva MSP API documentation
 *
 * Status codes from the official Druva MSP API documentation:
 * - 0: Creation pending
 * - 1: Ready
 * - 2: Tenant processing
 *
 * @param status The numeric status code or string status from the API
 * @returns A human-readable status label
 */
function getStatusLabel(status: string | number): string {
  // Convert to string to handle both string and number inputs
  const statusStr = String(status).toLowerCase();

  // Handle cases where the API returns a numeric status
  switch (statusStr) {
    case '0':
      return 'Creation Pending';
    case '1':
      return 'Ready';
    case '2':
      return 'Tenant Processing';
    default:
      return `Unknown (${status})`;
  }
}

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
      processedCustomer.status_label = getStatusLabel(customer.status as string | number);
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
      console.log('[DEBUG] Using customer name as account name:', accountName);
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
      console.log(`[DEBUG] Processing tenantAdmins for create: ${JSON.stringify(tenantAdmins)}`);
      console.log(
        `[DEBUG] tenantAdmins type: ${typeof tenantAdmins}, isArray: ${Array.isArray(tenantAdmins)}, length: ${tenantAdmins.length}`,
      );

      // Convert string IDs to numbers if they are numeric strings
      const tenantAdminIds = tenantAdmins.map((id) => {
        console.log(`[DEBUG] Processing admin ID: ${id} (type: ${typeof id})`);
        // Handle both string and number IDs
        if (typeof id === 'string') {
          const numId = Number.parseInt(id, 10);
          if (!Number.isNaN(numId)) {
            console.log(`[DEBUG] Converted string ID "${id}" to number: ${numId}`);
            return numId;
          }
          console.log(`[DEBUG] Keeping ID as string: "${id}" (not a numeric string)`);
          return id;
        }
        console.log(`[DEBUG] Using ID as-is (already numeric): ${id}`);
        return id;
      });

      console.log(`[DEBUG] Formatted tenantAdminIds for create: ${JSON.stringify(tenantAdminIds)}`);
      body.tenantAdmins = tenantAdminIds;
    } else {
      console.log(
        `[DEBUG] No tenantAdmins specified for create or empty array: ${JSON.stringify(tenantAdmins)}`,
      );
      console.log(
        `[DEBUG] tenantAdmins type: ${typeof tenantAdmins}, isArray: ${Array.isArray(tenantAdmins)}, value: ${tenantAdmins}`,
      );
    }

    const endpoint = '/msp/v2/customers';
    const response = await druvaMspApiRequest.call(this, 'POST', endpoint, body);
    responseData = this.helpers.returnJsonArray([response as IDataObject]);
  } else if (operation === 'get') {
    const customerId = this.getNodeParameter('customerId', i, '') as string;
    const endpoint = `/msp/v2/customers/${customerId}`;
    const response = await druvaMspApiRequest.call(this, 'GET', endpoint);

    // Process the customer data to add derived fields
    const processedCustomer = processCustomerData(response as IDataObject);

    responseData = this.helpers.returnJsonArray([processedCustomer]);
  } else if (operation === 'getMany') {
    const returnAll = this.getNodeParameter('returnAll', i, false) as boolean;
    const limit = this.getNodeParameter('limit', i, 50) as number;
    const endpoint = '/msp/v2/customers';

    let customers: IDataObject[] = [];

    // Retrieve customers from API
    if (returnAll) {
      customers = await druvaMspApiRequestAllItems.call(this, 'GET', endpoint, 'customers');
    } else {
      const response = await druvaMspApiRequest.call(this, 'GET', endpoint, undefined, {
        pageSize: limit,
      });
      customers = ((response as IDataObject)?.customers as IDataObject[]) || [];
    }

    // Process each customer to add derived fields
    customers = customers.map((customer) => processCustomerData(customer));

    // Apply post-processing filters if enabled
    const filterResults = this.getNodeParameter('filterResults', i, false) as boolean;

    if (filterResults) {
      const filterDefinitions = this.getNodeParameter('filters.filter', i, []) as IDataObject[];

      if (filterDefinitions && filterDefinitions.length > 0) {
        // Apply all defined filters
        // Note: Since the Druva MSP API doesn't support filtering, we do it client-side
        customers = customers.filter((customer: IDataObject) => {
          // Check if customer matches all filter conditions (AND logic)
          return filterDefinitions.every((filterDef: IDataObject) => {
            const field = filterDef.field as string;
            const operator = filterDef.operator as string;
            const value = filterDef.value as string;
            const customerValue = customer[field] as string;

            // Case-insensitive comparison for string values
            // This ensures better user experience when filtering
            const customerStringValue = String(customerValue || '').toLowerCase();
            const compareValue = String(value).toLowerCase();

            // Apply the correct operator
            switch (operator) {
              case 'contains':
                return customerStringValue.includes(compareValue);
              case 'notContains':
                return !customerStringValue.includes(compareValue);
              case 'equals':
                return customerStringValue === compareValue;
              case 'notEquals':
                return customerStringValue !== compareValue;
              case 'startsWith':
                return customerStringValue.startsWith(compareValue);
              case 'endsWith':
                return customerStringValue.endsWith(compareValue);
              default:
                return true;
            }
          });
        });
      }

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
      console.log(`[DEBUG] Processing tenantAdmins for update: ${JSON.stringify(tenantAdmins)}`);
      console.log(
        `[DEBUG] tenantAdmins type: ${typeof tenantAdmins}, isArray: ${Array.isArray(tenantAdmins)}, length: ${tenantAdmins.length}`,
      );

      // Convert string IDs to numbers if they are numeric strings
      const tenantAdminIds = tenantAdmins.map((id) => {
        console.log(`[DEBUG] Processing admin ID: ${id} (type: ${typeof id})`);
        // Handle both string and number IDs
        if (typeof id === 'string') {
          const numId = Number.parseInt(id, 10);
          if (!Number.isNaN(numId)) {
            console.log(`[DEBUG] Converted string ID "${id}" to number: ${numId}`);
            return numId;
          }
          console.log(`[DEBUG] Keeping ID as string: "${id}" (not a numeric string)`);
          return id;
        }
        console.log(`[DEBUG] Using ID as-is (already numeric): ${id}`);
        return id;
      });

      console.log(`[DEBUG] Formatted tenantAdminIds for update: ${JSON.stringify(tenantAdminIds)}`);
      body.tenantAdmins = tenantAdminIds;
    } else {
      console.log(
        `[DEBUG] No tenantAdmins specified for update or empty array: ${JSON.stringify(tenantAdmins)}`,
      );
      console.log(
        `[DEBUG] tenantAdmins type: ${typeof tenantAdmins}, isArray: ${Array.isArray(tenantAdmins)}, value: ${tenantAdmins}`,
      );
    }

    // Handle features update if enabled
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

      console.log(`[DEBUG] Updating features for customer: ${JSON.stringify(features)}`);
    }

    const endpoint = `/msp/v2/customers/${customerId}`;
    const response = await druvaMspApiRequest.call(this, 'PUT', endpoint, body);
    responseData = this.helpers.returnJsonArray([response as IDataObject]);
  } else if (operation === 'getToken') {
    const customerId = this.getNodeParameter('customerId', i, '') as string;
    const endpoint = `/msp/v2/customers/${customerId}/token`;

    // The GenericFunctions.ts now handles form-urlencoded for this endpoint
    const response = await druvaMspApiRequest.call(this, 'POST', endpoint);
    responseData = this.helpers.returnJsonArray([response as IDataObject]);
  }

  return responseData;
}
