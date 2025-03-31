import type {
  IExecuteFunctions,
  INodeExecutionData,
  IDataObject,
  NodeApiError,
} from 'n8n-workflow';

// These will be used when implementing the operations
import { druvaMspApiRequest, druvaMspApiRequestAllItems } from './GenericFunctions';

export async function executeServicePlanOperation(
  this: IExecuteFunctions,
  i: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', i, '') as string;
  let responseData: INodeExecutionData[] = [];

  try {
    if (operation === 'get') {
      // Implement Get logic
      const servicePlanId = this.getNodeParameter('servicePlanId', i) as string;
      const endpoint = `/msp/v2/servicePlans/${servicePlanId}`;
      const response = await druvaMspApiRequest.call(this, 'GET', endpoint);
      responseData = this.helpers.returnJsonArray([response as IDataObject]);
    } else if (operation === 'list') {
      // Match the Customer implementation exactly
      const returnAll = this.getNodeParameter('returnAll', i, false) as boolean;
      const limit = this.getNodeParameter('limit', i, 50) as number;
      const endpoint = '/msp/v2/servicePlans';

      if (returnAll) {
        const allServicePlans = await druvaMspApiRequestAllItems.call(
          this,
          'GET',
          endpoint,
          'servicePlans',
        );
        responseData = this.helpers.returnJsonArray(allServicePlans);
      } else {
        const response = await druvaMspApiRequest.call(this, 'GET', endpoint, undefined, {
          pageSize: limit,
        });
        const servicePlans = (response as IDataObject)?.servicePlans ?? [];
        responseData = this.helpers.returnJsonArray(servicePlans as IDataObject[]);
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
