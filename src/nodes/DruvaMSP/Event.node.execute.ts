import type {
  IExecuteFunctions,
  INodeExecutionData,
  IDataObject,
  NodeApiError,
} from 'n8n-workflow';

// Import the helper functions for API requests and pagination
import { druvaMspApiRequest, druvaMspApiRequestAllItems } from './GenericFunctions';

/**
 * Executes the selected Event operation.
 * @param this The context object.
 * @param i The index of the current item.
 * @returns The result of the operation.
 */
export async function executeEventOperation(
  this: IExecuteFunctions,
  i: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', i, '') as string;
  let responseData: INodeExecutionData[] = [];

  try {
    if (operation === 'listMsp') {
      // Implement List MSP Events logic
      const returnAll = this.getNodeParameter('returnAll', i, false) as boolean;
      const limit = this.getNodeParameter('limit', i, 50) as number;
      const endpoint = '/msp/v2/events';

      if (returnAll) {
        const allEvents = await druvaMspApiRequestAllItems.call(this, 'GET', endpoint, 'events');
        responseData = this.helpers.returnJsonArray(allEvents);
      } else {
        const response = await druvaMspApiRequest.call(this, 'GET', endpoint, undefined, {
          pageSize: limit,
        });
        const events = (response as IDataObject)?.events ?? [];
        responseData = this.helpers.returnJsonArray(events as IDataObject[]);
      }
    } else if (operation === 'listCustomer') {
      // Implement List Customer Events logic
      const returnAll = this.getNodeParameter('returnAll', i, false) as boolean;
      const limit = this.getNodeParameter('limit', i, 50) as number;
      const customerId = this.getNodeParameter('customerId', i) as string;
      const endpoint = `/msp/v3/customers/${customerId}/events`;

      if (returnAll) {
        const allEvents = await druvaMspApiRequestAllItems.call(this, 'GET', endpoint, 'events');
        responseData = this.helpers.returnJsonArray(allEvents);
      } else {
        const response = await druvaMspApiRequest.call(this, 'GET', endpoint, undefined, {
          pageSize: limit,
        });
        const events = (response as IDataObject)?.events ?? [];
        responseData = this.helpers.returnJsonArray(events as IDataObject[]);
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
