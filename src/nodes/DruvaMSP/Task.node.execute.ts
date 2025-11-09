import type {
  IExecuteFunctions,
  INodeExecutionData,
  IDataObject,
  NodeApiError,
} from 'n8n-workflow';

// Import the helper function for API requests
import { druvaMspApiRequest } from './GenericFunctions';
import {
  getTaskStatusLabel,
  getTaskOutputStatusLabel,
  enrichApiResponse,
  enrichApiResponseWithDates,
} from './helpers/ValueConverters';

// First, import the logger at the top of the file
import { logger } from './helpers/LoggerHelper';

/**
 * Task response interface
 */
interface ITaskResponse extends IDataObject {
  id?: string;
  name?: string;
  entityType?: string;
  entityId?: string;
  status?: number;
  status_label?: string;
  output?: {
    failed?: number;
    successResp?: {
      entityId?: string;
    };
    errorResp?: {
      code?: number;
      message?: string;
    };
  };
  output_status_label?: string;
  // Support both snake_case and camelCase field variants
  created_on?: number;
  updated_on?: number;
  createdOn?: number;
  updatedOn?: number;
  // Enriched date fields
  created_onAt?: Date;
  updated_onAt?: Date;
  createdOnAt?: Date;
  updatedOnAt?: Date;
}

/**
 * Executes the selected Task operation.
 * @param this The context object.
 * @param i The index of the current item.
 * @returns The result of the operation.
 */
export async function executeTaskOperation(
  this: IExecuteFunctions,
  i: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', i, '') as string;
  let responseData: INodeExecutionData[] = [];

  try {
    if (operation === 'get') {
      // Implement Get Task logic
      const taskId = this.getNodeParameter('taskId', i) as string;
      const endpoint = `/msp/v2/tasks/${taskId}`;
      const response = (await druvaMspApiRequest.call(this, 'GET', endpoint)) as ITaskResponse;

      // Log the field names for debugging
      await logger.debug(`Task: API Response Fields: ${Object.keys(response).join(', ')}`, this);

      // 1. First enrich the response with human-readable labels
      const enrichedWithLabels = enrichApiResponse(response, {
        status: getTaskStatusLabel,
      });

      // 2. Then enrich with date fields for timestamp fields - check both snake_case and camelCase
      // Determine which field name pattern is used in the API response
      const dateFields: string[] = [];

      // Add fields that exist in the response
      if ('created_on' in response) dateFields.push('created_on');
      if ('updated_on' in response) dateFields.push('updated_on');
      if ('createdOn' in response) dateFields.push('createdOn');
      if ('updatedOn' in response) dateFields.push('updatedOn');

      await logger.debug(`Task: Date fields to enrich: ${dateFields.join(', ')}`, this);

      const enrichedWithDates = enrichApiResponseWithDates(enrichedWithLabels, dateFields);

      // 3. Handle output_status_label separately to place it right after output
      let finalResponse: IDataObject;
      if (response.output && (response.output as IDataObject).failed !== undefined) {
        // Create a new object with fields in the desired order
        const orderedFields: IDataObject = {};
        const outputStatusLabel = getTaskOutputStatusLabel((response.output as IDataObject).failed);

        // Copy fields in order, inserting output_status_label right after output
        for (const key of Object.keys(enrichedWithDates)) {
          orderedFields[key] = enrichedWithDates[key];
          // Add output_status_label immediately after output
          if (key === 'output') {
            orderedFields.output_status_label = outputStatusLabel;
          }
        }

        finalResponse = orderedFields;
      } else {
        finalResponse = enrichedWithDates;
      }

      responseData = this.helpers.returnJsonArray([finalResponse]);
    } else if (operation === 'waitForCompletion') {
      // Implement Wait for Completion logic
      const taskId = this.getNodeParameter('taskId', i) as string;
      const maxWaitTime = this.getNodeParameter('maxWaitTime', i, 300) as number; // Default 5 minutes
      const pollInterval = this.getNodeParameter('pollInterval', i, 5) as number; // Default 5 seconds

      // Implementation for polling until task completes
      const endpoint = `/msp/v2/tasks/${taskId}`;
      let taskComplete = false;
      let attempts = 0;
      const maxAttempts = Math.ceil(maxWaitTime / pollInterval);
      let finalResponse: IDataObject | null = null;

      while (!taskComplete && attempts < maxAttempts) {
        attempts++;
        const response = (await druvaMspApiRequest.call(this, 'GET', endpoint)) as ITaskResponse;

        // Log the field names for debugging on first attempt
        if (attempts === 1) {
          await logger.debug(
            `Task: API Response Fields: ${Object.keys(response).join(', ')}`,
            this,
          );
        }

        // 1. First enrich the response with human-readable labels
        const enrichedWithLabels = enrichApiResponse(response, {
          status: getTaskStatusLabel,
        });

        // 2. Then enrich with date fields for timestamp fields - check both snake_case and camelCase
        // Determine which field name pattern is used in the API response
        const dateFields: string[] = [];

        // Add fields that exist in the response
        if ('created_on' in response) dateFields.push('created_on');
        if ('updated_on' in response) dateFields.push('updated_on');
        if ('createdOn' in response) dateFields.push('createdOn');
        if ('updatedOn' in response) dateFields.push('updatedOn');

        if (attempts === 1) {
          await logger.debug(`Task: Date fields to enrich: ${dateFields.join(', ')}`, this);
        }

        const enrichedWithDates = enrichApiResponseWithDates(enrichedWithLabels, dateFields);

        // 3. Handle output_status_label separately to place it right after output
        let processedResponse: IDataObject;
        if (response.output && (response.output as IDataObject).failed !== undefined) {
          // Create a new object with fields in the desired order
          const orderedFields: IDataObject = {};
          const outputStatusLabel = getTaskOutputStatusLabel(
            (response.output as IDataObject).failed,
          );

          // Copy fields in order, inserting output_status_label right after output
          for (const key of Object.keys(enrichedWithDates)) {
            orderedFields[key] = enrichedWithDates[key];
            // Add output_status_label immediately after output
            if (key === 'output') {
              orderedFields.output_status_label = outputStatusLabel;
            }
          }

          processedResponse = orderedFields;
        } else {
          processedResponse = enrichedWithDates;
        }

        // Check if task is complete (status 4 = Finished)
        if (response.status === 4) {
          taskComplete = true;
          finalResponse = processedResponse;
          break;
        }

        // Wait for next poll
        if (!taskComplete && attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, pollInterval * 1000));
        }
      }

      // Return the final response or timeout error
      if (finalResponse) {
        responseData = this.helpers.returnJsonArray([finalResponse]);
      } else {
        throw new Error(
          `Task ${taskId} did not complete within the specified wait time (${maxWaitTime} seconds)`,
        );
      }
    }
  } catch (error) {
    if (this.continueOnFail()) {
      return [{ json: {}, error: error as NodeApiError }];
    }
    throw error;
  }

  return responseData;
}
