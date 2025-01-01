import { IDataObject, IExecuteFunctions, IHttpRequestOptions } from 'n8n-workflow';
import { IPaginationResponse } from '../types/common/IPagination';

export interface IPaginationOptions {
  resource: string;
  method?: string;
  retrieveAll?: boolean;
  maxRecords?: number;
  filters?: IDataObject;
}

export async function handlePagination<T>(
  this: IExecuteFunctions,
  options: IPaginationOptions,
): Promise<T[]> {
  const {
    resource,
    method = 'GET',
    retrieveAll = false,
    maxRecords = 100,
    filters = {},
  } = options;

  const returnData: T[] = [];
  let responseData: IPaginationResponse<T>;
  let nextPageToken: string | undefined;

  // Always use max page size of 500 for efficiency
  const pageSize = 500;

  do {
    const requestOptions: IHttpRequestOptions = {
      method,
      url: resource,
      qs: {
        ...filters,
        pageSize: pageSize.toString(),
        ...(nextPageToken ? { pageToken: nextPageToken } : {}),
      },
    };

    responseData = await this.helpers.httpRequest(requestOptions);
    returnData.push(...responseData.items);
    nextPageToken = responseData.nextPageToken;

    // If not retrieving all, stop when we reach maxRecords
    if (!retrieveAll && returnData.length >= maxRecords) {
      return returnData.slice(0, maxRecords);
    }

    // If retrieving all, continue until no more pages
  } while (nextPageToken);

  return returnData;
} 