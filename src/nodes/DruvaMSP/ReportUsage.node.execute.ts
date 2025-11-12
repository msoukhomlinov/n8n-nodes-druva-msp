import { druvaMspApiRequest, druvaMspApiRequestAllReportV2Items } from './GenericFunctions';
import { REPORT_FIELD_NAMES, REPORT_OPERATORS, type IReportFilter } from './helpers/Constants';
import {
  formatDate,
  getDefaultStartDate,
  getDefaultEndDate,
  getRelativeDateRange,
} from './helpers/DateHelpers';
import {
  createCustomerFilter,
  createDateRangeFilter,
  createProductFilter,
  createReportFilter,
  createReportFilters,
  createUsageDescriptionFilter,
} from './helpers/ReportHelpers';
import { logger } from './helpers/LoggerHelper';

import type { IExecuteFunctions } from 'n8n-workflow';
import type { IDataObject, INodeExecutionData, NodeApiError } from 'n8n-workflow';

/**
 * Executes the selected Report - Usage operation.
 * @param this The context object.
 * @param i The index of the current item.
 * @returns The result of the operation.
 */
export async function executeReportUsageOperation(
  this: IExecuteFunctions,
  i: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', i, '') as string;
  let responseData: INodeExecutionData[] = [];

  try {
    // Get date parameters based on selection method
    const dateSelectionMethod = this.getNodeParameter(
      'dateSelectionMethod',
      i,
      'relativeDates',
    ) as string;
    let startDate = '';
    let endDate = '';
    let useDefaultDates = false;

    // Skip date filter initialization if "All Dates" is selected
    if (dateSelectionMethod !== 'allDates') {
      if (dateSelectionMethod === 'specificDates') {
        // Use specific dates provided by user
        startDate = this.getNodeParameter('startDate', i, '') as string;
        endDate = this.getNodeParameter('endDate', i, '') as string;
      } else {
        // Use relative date range
        const relativeDateRange = this.getNodeParameter(
          'relativeDateRange',
          i,
          'currentMonth',
        ) as string;
        const dateRange = getRelativeDateRange(relativeDateRange);
        startDate = dateRange.startDate;
        endDate = dateRange.endDate;
      }
    } else {
      // For Global Summary, we still need to use default dates if "All Dates" is selected
      // This ensures the API still returns the full range of data
      useDefaultDates = operation === 'getGlobalSummary';
    }

    if (operation === 'getGlobalSummary') {
      // Get Global Usage Summary implementation
      // This endpoint returns a single object, not a paginated list
      const endpoint = '/msp/v2/reports/usage/summary';
      const qs: IDataObject = {};

      // Handle start date (defaults to 30 days ago if not provided or using all dates)
      if (startDate) {
        qs.startDate = formatDate(startDate);
      } else if (useDefaultDates) {
        qs.startDate = getDefaultStartDate();
      }

      // Handle end date (defaults to current date if not provided or using all dates)
      if (endDate) {
        qs.endDate = formatDate(endDate);
      } else if (useDefaultDates) {
        qs.endDate = getDefaultEndDate();
      }

      // Make the API request - this returns a single object, not a paginated list
      const response = await druvaMspApiRequest.call(this, 'GET', endpoint, undefined, qs);

      // Add synthetic fields for balance and commit differences
      const responseObj = response as IDataObject;

      // Calculate balance difference
      const startBalance = responseObj.startConsumptionUnitsBalance as number;
      const endBalance = responseObj.endConsumptionUnitsBalance as number;
      if (typeof startBalance === 'number' && typeof endBalance === 'number') {
        responseObj.balanceDifference = endBalance - startBalance;
      }

      // Calculate commit difference
      const startCommit = responseObj.startConsumptionUnitsCommit as number;
      const endCommit = responseObj.endConsumptionUnitsCommit as number;
      if (typeof startCommit === 'number' && typeof endCommit === 'number') {
        responseObj.commitDifference = endCommit - startCommit;
      }

      // Return the response with added synthetic fields
      responseData = this.helpers.returnJsonArray([responseObj]);
    } else if (operation === 'getItemizedConsumption' || operation === 'getItemizedQuota') {
      // Common logic for both itemized report types
      const returnAll = this.getNodeParameter('returnAll', i, false) as boolean;
      const limit = this.getNodeParameter('limit', i, 50) as number;

      // Set endpoint based on operation
      const endpoint =
        operation === 'getItemizedConsumption'
          ? '/msp/reporting/v2/reports/consumptionItemized'
          : '/msp/reporting/v2/reports/quotaItemized';

      // Create filters array for all filters
      const filterBy: IReportFilter[] = [];

      // Add date range filter if not using "All Dates"
      if (dateSelectionMethod !== 'allDates' && startDate && endDate) {
        filterBy.push(...createDateRangeFilter(startDate, endDate));
      }

      // Add customer filter if specified
      const filterByCustomers = this.getNodeParameter('filterByCustomers', i, false) as boolean;
      if (filterByCustomers) {
        const customerIds = this.getNodeParameter('customerIds', i, []) as string[];
        if (customerIds.length > 0) {
          filterBy.push(createCustomerFilter(customerIds));
        }
      }

      // Add product filter if specified
      const filterByProducts = this.getNodeParameter('filterByProducts', i, false) as boolean;
      if (filterByProducts) {
        const productIds = this.getNodeParameter('productIds', i, []) as string[];
        if (productIds.length > 0) {
          filterBy.push(createProductFilter(productIds));
        }
      }

      // Add product module filter if specified
      const filterByProductModules = this.getNodeParameter(
        'filterByProductModules',
        i,
        false,
      ) as boolean;
      if (filterByProductModules) {
        const productModuleIds = this.getNodeParameter('productModuleIds', i, []) as number[];
        if (productModuleIds.length > 0) {
          filterBy.push(
            createReportFilter(
              REPORT_FIELD_NAMES.PRODUCT_MODULE_ID,
              REPORT_OPERATORS.CONTAINS,
              productModuleIds,
            ),
          );
        }
      }

      // Add usage description filter if specified
      const filterByUsageDescriptions = this.getNodeParameter(
        'filterByUsageDescriptions',
        i,
        false,
      ) as boolean;
      if (filterByUsageDescriptions) {
        const usageDescriptions = this.getNodeParameter('usageDescriptions', i, []) as string[];
        if (usageDescriptions.length > 0) {
          filterBy.push(createUsageDescriptionFilter(usageDescriptions));
        }
      }

      // Add edition name filter if specified
      const filterByEditionNames = this.getNodeParameter(
        'filterByEditionNames',
        i,
        false,
      ) as boolean;
      if (filterByEditionNames) {
        const editionNames = this.getNodeParameter('editionNames', i, []) as string[];
        if (editionNames.length > 0) {
          filterBy.push(
            createReportFilter(
              REPORT_FIELD_NAMES.EDITION_NAME,
              REPORT_OPERATORS.CONTAINS,
              editionNames,
            ),
          );
        }
      }

      // Prepare request body with the correct structure using helper function
      const body: IDataObject = {
        filters: createReportFilters(returnAll ? 100 : limit, filterBy),
      };

      // Debug logging to show request details
      await logger.debug(`ReportUsage.${operation}: Making API request to ${endpoint}`, this);
      await logger.debug(
        `ReportUsage.${operation}: Request body: ${JSON.stringify(body, null, 2)}`,
        this,
      );

      if (returnAll) {
        // For POST requests with pagination in the body, use our centralized function
        const allItems = await druvaMspApiRequestAllReportV2Items.call(
          this,
          endpoint,
          body,
          'data',
        );

        await logger.debug(
          `[DEBUG-DRUVA-MSP] ReportUsage.${operation}: Retrieved ${Array.isArray(allItems) ? allItems.length : 0} total items across all pages`,
          this,
        );

        responseData = this.helpers.returnJsonArray(allItems);
      } else {
        const response = await druvaMspApiRequest.call(this, 'POST', endpoint, body);

        const itemCount = (response as IDataObject)?.data
          ? ((response as IDataObject).data as IDataObject[]).length
          : 0;

        await logger.debug(
          `[DEBUG-DRUVA-MSP] ReportUsage.${operation}: Retrieved ${itemCount} items from first page`,
          this,
        );

        if ((response as IDataObject).nextPageToken) {
          await logger.debug(
            `[DEBUG-DRUVA-MSP] ReportUsage.${operation}: More items available in subsequent pages`,
            this,
          );
        }

        const items = (response as IDataObject)?.data ?? [];
        responseData = this.helpers.returnJsonArray(items as IDataObject[]);
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
