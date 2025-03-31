import type {
  IExecuteFunctions,
  INodeExecutionData,
  IDataObject,
  NodeApiError,
} from 'n8n-workflow';

// Import the helper function for API requests
import { druvaMspApiRequest } from './GenericFunctions';

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
      const response = await druvaMspApiRequest.call(this, 'GET', endpoint);
      responseData = this.helpers.returnJsonArray([response as IDataObject]);
    }
  } catch (error) {
    if (this.continueOnFail()) {
      return [{ json: {}, error: error as NodeApiError }];
    }
    throw error;
  }

  return responseData;
}
