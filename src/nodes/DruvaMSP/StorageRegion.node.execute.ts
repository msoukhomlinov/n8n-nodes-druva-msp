import type {
  IExecuteFunctions,
  IDataObject,
  INodeExecutionData,
  NodeApiError,
} from "n8n-workflow";

import { druvaMspApiRequest } from "./GenericFunctions";

/**
 * Executes the selected Storage Region operation.
 * @param this The context object.
 * @param i The index of the current item.
 * @returns The result of the operation.
 */
export async function executeStorageRegionOperation(
  this: IExecuteFunctions,
  i: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter("operation", i, "") as string;
  let responseData: INodeExecutionData[] = [];

  try {
    if (operation === "getMany") {
      const endpoint = "/msp/v2/storage-regions";
      const response = (await druvaMspApiRequest.call(
        this,
        "GET",
        endpoint,
      )) as IDataObject;

      // Flatten the nested structure: storageRegions[].regions[] → flat array with productID on each entry
      const storageRegions = (response.storageRegions as IDataObject[]) ?? [];
      const flatItems: IDataObject[] = [];

      for (const product of storageRegions) {
        const productID = product.productID as number;
        const regions = (product.regions as IDataObject[]) ?? [];
        for (const region of regions) {
          flatItems.push({
            productID,
            name: region.name,
            storageProvider: region.storageProvider,
          });
        }
      }

      responseData = this.helpers.returnJsonArray(flatItems);
    }
  } catch (error) {
    if (this.continueOnFail()) {
      return [{ json: {}, error: error as NodeApiError }];
    }
    throw error;
  }

  return responseData;
}
