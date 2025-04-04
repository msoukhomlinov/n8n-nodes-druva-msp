// Contains the execution logic for Admin resource operations

import type { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';

import { druvaMspApiRequest, druvaMspApiRequestAllItems } from './GenericFunctions';
import { getAdminRoleLabel, getAdminStatusLabel } from './helpers/ValueConverters';

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
      // Convert to number if it's a string
      const roleCode = typeof admin.role === 'string' ? Number(admin.role) : (admin.role as number);
      processedAdmin.role_label = getAdminRoleLabel(roleCode);
    }

    // Add status_label after status field
    if (key === 'status' && admin.status !== undefined) {
      // Convert to number if it's a string
      const statusCode =
        typeof admin.status === 'string' ? Number(admin.status) : (admin.status as number);
      processedAdmin.status_label = getAdminStatusLabel(statusCode);
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
    const endpoint = '/msp/v2/admins';

    // Prepare query parameters
    const qs: IDataObject = {};

    // Check for email filter
    const filterByEmail = this.getNodeParameter('filterByEmail', i, false) as boolean;
    if (filterByEmail) {
      const email = this.getNodeParameter('email', i, '') as string;
      if (email) {
        qs.email = email;
      }
    }

    // Check for role filter
    const filterByRole = this.getNodeParameter('filterByRole', i, false) as boolean;
    if (filterByRole) {
      const role = this.getNodeParameter('role', i, []) as string[];
      if (role.length > 0) {
        qs.role = role.join(',');
      }
    }

    // Add page size limit if not returning all results
    if (!returnAll) {
      qs.pageSize = limit;
    }

    let admins: IDataObject[] = [];

    if (returnAll) {
      // Get all admins with pagination
      admins = (await druvaMspApiRequestAllItems.call(
        this,
        'GET',
        endpoint,
        'admins',
        undefined,
        qs,
      )) as IDataObject[];
    } else {
      // Get limited number of admins
      const response = await druvaMspApiRequest.call(this, 'GET', endpoint, undefined, qs);
      admins = ((response as IDataObject)?.admins as IDataObject[]) || [];
    }

    // Process each admin to add the derived fields
    admins = admins.map((admin) => processAdminData(admin));

    responseData = this.helpers.returnJsonArray(admins);
  }

  return responseData;
}
