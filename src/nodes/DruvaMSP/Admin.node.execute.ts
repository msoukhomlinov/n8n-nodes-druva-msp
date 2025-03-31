// Contains the execution logic for Admin resource operations

import type { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';

import { druvaMspApiRequest, druvaMspApiRequestAllItems } from './GenericFunctions';

/**
 * Helper function to convert numeric role codes to human-readable labels
 * based on the official Druva MSP API documentation
 *
 * Role codes from the official Druva MSP API documentation:
 * - 2: MSP Admin
 * - 3: Tenant Admin
 * - 4: Read Only Admin
 *
 * @param role The role code from the API
 * @returns A human-readable role label
 */
function getRoleLabel(role: string | number): string {
  // Convert to string to handle both string and number inputs
  const roleStr = String(role);

  // Handle numeric codes
  switch (roleStr) {
    case '2':
      return 'MSP Admin';
    case '3':
      return 'Tenant Admin';
    case '4':
      return 'Read Only Admin';
    default:
      return `Unknown Role (${role})`;
  }
}

/**
 * Helper function to convert numeric status codes to human-readable labels
 * based on the official Druva MSP API documentation
 *
 * Status codes from the official Druva MSP API documentation:
 * - 0: Ready
 * - 1: Updating
 *
 * @param status The numeric status code from the API
 * @returns A human-readable status label
 */
function getStatusLabel(status: string | number): string {
  // Convert to string to handle both string and number inputs
  const statusStr = String(status);

  switch (statusStr) {
    case '0':
      return 'Ready';
    case '1':
      return 'Updating';
    default:
      return `Unknown Status (${status})`;
  }
}

/**
 * Processes the admin data to add derived fields
 * @param admin The admin data from the API
 * @returns The admin data with additional derived fields
 */
function processAdminData(admin: IDataObject): IDataObject {
  // Create a new object to hold the processed admin data
  const processedAdmin: IDataObject = {};

  // Copy all existing properties
  for (const key in admin) {
    processedAdmin[key] = admin[key];

    // Add role_label after role field
    if (key === 'role' && admin.role !== undefined) {
      processedAdmin.role_label = getRoleLabel(admin.role as string | number);
    }

    // Add status_label after status field
    if (key === 'status' && admin.status !== undefined) {
      processedAdmin.status_label = getStatusLabel(admin.status as string | number);
    }
  }

  return processedAdmin;
}

/**
 * Executes the selected Admin operation.
 * @param this The context object.
 * @param i The index of the current item.
 * @returns The result of the operation.
 */
export async function executeAdminOperation(
  this: IExecuteFunctions,
  i: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', i, '') as string;
  let responseData: INodeExecutionData[] = [];

  if (operation === 'getMany') {
    const returnAll = this.getNodeParameter('returnAll', i, false) as boolean;
    const limit = this.getNodeParameter('limit', i, 50) as number;
    const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
    const endpoint = '/msp/v2/admins';

    // Prepare query parameters
    const qs: IDataObject = {};

    // Add email filter if specified
    if (filters.email) {
      qs.email = filters.email;
    }

    // Add role filter if specified
    if (filters.role && Array.isArray(filters.role) && filters.role.length > 0) {
      qs.role = filters.role.join(',');
    }

    // Add page size limit if not returning all results
    if (!returnAll) {
      qs.pageSize = limit;
    }

    let admins: IDataObject[] = [];

    if (returnAll) {
      // Get all admins with pagination
      admins = await druvaMspApiRequestAllItems.call(
        this,
        'GET',
        endpoint,
        'admins',
        undefined,
        qs,
      );
    } else {
      // Get limited number of admins
      const response = await druvaMspApiRequest.call(this, 'GET', endpoint, undefined, qs);
      admins = (response as IDataObject)?.admins as IDataObject[] || [];
    }

    // Process each admin to add the derived fields
    admins = admins.map(admin => processAdminData(admin));

    responseData = this.helpers.returnJsonArray(admins);
  }

  return responseData;
}
