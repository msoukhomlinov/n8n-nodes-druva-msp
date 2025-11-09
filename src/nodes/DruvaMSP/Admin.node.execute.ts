// Contains the execution logic for Admin resource operations

import type { IExecuteFunctions, INodeExecutionData, IDataObject } from 'n8n-workflow';

import { druvaMspApiRequest } from './GenericFunctions';
import { getAdminRoleLabel, getAdminStatusLabel } from './helpers/ValueConverters';
import { logger } from './helpers/LoggerHelper';

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

    // Prepare initial query parameters (for first request only)
    const initialQueryParams: IDataObject = {};

    // Check for email filter
    const filterByEmail = this.getNodeParameter('filterByEmail', i, false) as boolean;
    if (filterByEmail) {
      const email = this.getNodeParameter('email', i, '') as string;
      if (email) {
        initialQueryParams.email = email;
      }
    }

    // Check for role filter
    const filterByRole = this.getNodeParameter('filterByRole', i, false) as boolean;
    if (filterByRole) {
      const role = this.getNodeParameter('role', i, []) as string[];
      if (role.length > 0) {
        initialQueryParams.role = role.join(',');
      }
    }

    // Add page size limit if not returning all results
    if (!returnAll) {
      initialQueryParams.pageSize = limit;
    } else {
      // For returnAll, use maximum page size for efficiency
      initialQueryParams.pageSize = 100;
    }

    let admins: IDataObject[] = [];
    let nextPageToken: string | undefined = undefined;
    const seenTokens = new Set<string>();
    let loopCounter = 0;
    const MAX_LOOP_COUNT = 100; // Safety limit for pagination requests

    if (returnAll) {
      // Get all admins with proper pagination handling
      // IMPORTANT: Druva API requires that pageToken and filters cannot be used simultaneously
      // For subsequent requests, we must use ONLY the pageToken parameter
      await logger.debug(
        `Admin: Fetching all admins from ${endpoint} (max page size: ${initialQueryParams.pageSize})`,
        this,
      );

      do {
        // If we have a nextPageToken, use only that parameter without any filters
        // This is a requirement of the Druva MSP API
        const requestParams = nextPageToken
          ? { pageToken: nextPageToken }
          : { ...initialQueryParams };

        // Make the API request
        const response = (await druvaMspApiRequest.call(
          this,
          'GET',
          endpoint,
          undefined,
          requestParams,
        )) as IDataObject;

        // Extract admins from the response
        const pageAdmins = (response.admins as IDataObject[]) || [];
        admins.push(...pageAdmins);

        // Get the next page token
        nextPageToken = response.nextPageToken as string | undefined;

        // Loop detection
        if (nextPageToken) {
          // Check if we've seen this token before (loop detection)
          if (seenTokens.has(nextPageToken)) {
            logger.warn(
              `Admin: Detected pagination loop with token: ${nextPageToken}. Stopping pagination.`,
            );
            break;
          }

          // Add token to seen set
          seenTokens.add(nextPageToken);

          // Increment request counter
          loopCounter++;

          // Safety check for maximum number of pagination requests
          if (loopCounter > MAX_LOOP_COUNT) {
            logger.warn(
              `Admin: Reached maximum number of pagination requests (${MAX_LOOP_COUNT}). This might indicate an API issue.`,
            );
            break;
          }
        }

        // Log progress for debugging
        await logger.debug(
          `Admin: Page progress: +${pageAdmins.length} admins (total: ${admins.length})${
            nextPageToken ? ', more pages available' : ''
          }`,
          this,
        );
      } while (nextPageToken);
    } else {
      // Get limited number of admins (single request, no pagination needed)
      const response = await druvaMspApiRequest.call(
        this,
        'GET',
        endpoint,
        undefined,
        initialQueryParams,
      );
      admins = ((response as IDataObject)?.admins as IDataObject[]) || [];
    }

    // Process each admin to add the derived fields
    admins = admins.map((admin) => processAdminData(admin));

    responseData = this.helpers.returnJsonArray(admins);
  }

  return responseData;
}
