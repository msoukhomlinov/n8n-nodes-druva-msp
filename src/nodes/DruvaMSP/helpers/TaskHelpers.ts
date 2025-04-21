import type { IExecuteFunctions, IDataObject } from 'n8n-workflow';

import { druvaMspApiRequest } from './ApiRequestHelpers';
import { logger } from './LoggerHelper';

/**
 * Polls a task until it completes or reaches the timeout.
 *
 * @param {IExecuteFunctions} this The context object.
 * @param {string} taskId The ID of the task to wait for.
 * @param {number} maxWaitTime Maximum time to wait in seconds (default: 300 seconds / 5 minutes).
 * @param {number} pollInterval Interval between polling attempts in seconds (default: 5 seconds).
 * @returns {Promise<IDataObject>} The final task response.
 */
export async function waitForTaskCompletion(
  this: IExecuteFunctions,
  taskId: string,
  maxWaitTime = 300,
  pollInterval = 5,
): Promise<IDataObject> {
  const endpoint = `/msp/v2/tasks/${taskId}`;
  let taskComplete = false;
  let attempts = 0;
  const maxAttempts = Math.ceil(maxWaitTime / pollInterval);
  let finalResponse: IDataObject | null = null;

  // Import the value converters and helpers inside the function to avoid circular dependencies
  const {
    getTaskStatusLabel,
    getTaskOutputStatusLabel,
    enrichApiResponse,
    enrichApiResponseWithDates,
  } = await import('./ValueConverters');

  logger.debug(
    `Task: Starting to poll task ${taskId} (max ${maxWaitTime}s, interval ${pollInterval}s)`,
  );

  while (!taskComplete && attempts < maxAttempts) {
    attempts++;
    logger.debug(`Task: Polling task ${taskId}, attempt ${attempts}/${maxAttempts}`);

    const response = (await druvaMspApiRequest.call(this, 'GET', endpoint)) as IDataObject;

    // Log the field names for debugging on first attempt
    if (attempts === 1) {
      logger.debug(`Task: API Response Fields: ${Object.keys(response).join(', ')}`);
    }

    // Check if task is complete (status 4 = Finished)
    if (response?.status === 4) {
      logger.debug(`Task: Task ${taskId} completed successfully`);
      taskComplete = true;

      // 1. First enrich the response with human-readable labels for status
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

      logger.debug(`Task: Date fields to enrich: ${dateFields.join(', ')}`);

      const enrichedWithDates = enrichApiResponseWithDates(enrichedWithLabels, dateFields);

      // 3. Handle output_status_label separately to place it right after output
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
      break;
    }

    // Wait for next poll
    if (!taskComplete && attempts < maxAttempts) {
      logger.debug(
        `Task: Task ${taskId} not complete yet (status: ${response?.status}), waiting ${pollInterval}s before next poll`,
      );
      await new Promise((resolve) => setTimeout(resolve, pollInterval * 1000));
    }
  }

  // Return the final response or throw an error
  if (finalResponse) {
    return finalResponse;
  }

  throw new Error(
    `Task ${taskId} did not complete within the specified wait time (${maxWaitTime} seconds)`,
  );
}
