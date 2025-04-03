import type {
  IExecuteFunctions,
  INodeExecutionData,
  IDataObject,
  NodeApiError,
} from 'n8n-workflow';

// Import the helper function for API requests
import { druvaMspApiRequest } from './GenericFunctions';
import { getTaskStatusLabel, getTaskOutputStatusLabel } from './helpers/ValueConverters';

/**
 * Task response interface
 */
interface ITaskResponse extends IDataObject {
  id?: string;
  name?: string;
  entity_type?: string;
  entity_id?: string;
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
  created_on?: number;
  updated_on?: number;
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

      // Add human-readable labels for status fields
      if (response) {
        response.status_label = getTaskStatusLabel(response.status);

        if (response.output && response.output.failed !== undefined) {
          response.output_status_label = getTaskOutputStatusLabel(response.output.failed);
        }
      }

      responseData = this.helpers.returnJsonArray([response]);
    }
  } catch (error) {
    if (this.continueOnFail()) {
      return [{ json: {}, error: error as NodeApiError }];
    }
    throw error;
  }

  return responseData;
}
