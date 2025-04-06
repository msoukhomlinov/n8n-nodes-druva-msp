import { druvaMspApiRequestAllItems, druvaMspApiRequestAllReportV2Items } from './GenericFunctions';
import type { IReportFilter } from './helpers/Constants';
import { getRelativeDateRange } from './helpers/DateHelpers';
import {
  createCustomerFilter,
  createDateRangeFilter,
  createReportFilters,
} from './helpers/ReportHelpers';

import type { IExecuteFunctions } from 'n8n-workflow';
import type { IDataObject, INodeExecutionData } from 'n8n-workflow';

// Define interfaces for the hierarchical data structure
interface IUsageItem {
  editionName: string;
  servicePlanId: number;
  servicePlanName: string;
  usageDescription: string;
  usageAmount: number;
  usageUnit: string;
  cuConsumed: number;
}

interface IProductModule {
  productModuleId: number;
  productModuleName: string;
  usageItems: IUsageItem[];
}

interface IProduct {
  productId: number;
  productName: string;
  tenantId: string;
  tenantType: string;
  modules: IProductModule[];
}

interface ICustomerConsumption {
  customerGlobalId: string;
  customerName: string;
  accountName: string;
  startDate: string;
  endDate: string;
  products: IProduct[];
}

/**
 * Rounds a value based on the configured rounding rules
 * @param value The value to round
 * @param roundingDirection Direction for rounding ("none", "up", "down")
 * @param decimalPlaces Number of decimal places for rounding
 * @returns The rounded value
 */
function roundValue(
  value: number,
  roundingDirection: string,
  decimalPlaces: number,
  applyRounding = false,
): number {
  // If rounding is disabled or direction is "none", return the value as is
  if (!applyRounding || roundingDirection === 'none') {
    return value;
  }

  const multiplier = 10 ** decimalPlaces;

  if (roundingDirection === 'up') {
    return Math.ceil(value * multiplier) / multiplier;
  }

  // roundingDirection === 'down'
  return Math.floor(value * multiplier) / multiplier;
}

/**
 * Helper function to apply the calculation method to usage data
 * @param usageData Array of daily usage records
 * @param calculationMethod Method to apply: 'average' or 'highWaterMark'
 * @param startDate Start date of the billing period
 * @param endDate End date of the billing period
 * @returns The calculated value
 */
export function calculateUsageValue(
  usageData: IDataObject[],
  calculationMethod: 'average' | 'highWaterMark',
  startDate: Date,
  endDate: Date,
): number {
  // If no usage data, return 0
  if (!usageData.length) {
    return 0;
  }

  if (calculationMethod === 'highWaterMark') {
    // Find the maximum usage value in the data
    let maxUsage = 0;
    for (const record of usageData) {
      const usageAmount = Number(record.usageAmount || 0);
      if (usageAmount > maxUsage) {
        maxUsage = usageAmount;
      }
    }
    return maxUsage;
  }

  // Average method
  // Calculate the total number of days in the period
  const totalDays =
    Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Sum all usage values
  let totalUsage = 0;
  for (const record of usageData) {
    totalUsage += Number(record.usageAmount || 0);
  }

  // Calculate the average (total usage divided by number of days)
  return totalUsage / totalDays;
}

/**
 * Creates a lookup object for customer details to quickly access customer names by ID
 * @param customers Array of customer objects
 * @returns A lookup object with customer IDs as keys and customer objects as values
 */
function createCustomerLookup(customers: IDataObject[]): { [key: string]: IDataObject } {
  const lookup: { [key: string]: IDataObject } = {};

  for (const customer of customers) {
    if (customer.id) {
      lookup[customer.id.toString()] = customer;
    }
  }

  return lookup;
}

/**
 * Groups consumption data by customerGlobalId
 * @param consumptionData Raw consumption data from API
 * @returns Map of customerGlobalId to array of consumption records
 */
function groupConsumptionDataByCustomer(
  consumptionData: IDataObject[],
): Map<string, IDataObject[]> {
  const customerMap = new Map<string, IDataObject[]>();

  for (const record of consumptionData) {
    const customerGlobalId = record.customerGlobalId as string;
    if (!customerGlobalId) continue;

    if (!customerMap.has(customerGlobalId)) {
      customerMap.set(customerGlobalId, []);
    }

    customerMap.get(customerGlobalId)?.push(record);
  }

  return customerMap;
}

/**
 * Creates a unique key for grouping usage items
 * @param record Consumption record
 * @returns A unique key based on productModuleId, editionName, usageDescription, and servicePlanId
 */
function createUsageItemKey(record: IDataObject): string {
  return [record.productModuleId, record.editionName, record.usageDescription, record.servicePlanId]
    .map(String)
    .join('::');
}

/**
 * Groups consumption data by tenantId and productId
 * @param customerData Array of consumption records for a single customer
 * @returns Map of tenantId-productId to array of consumption records
 */
function groupByTenantAndProduct(customerData: IDataObject[]): Map<string, IDataObject[]> {
  const productMap = new Map<string, IDataObject[]>();

  for (const record of customerData) {
    const tenantId = record.tenantId as string;
    const productId = record.productId as number;

    if (!tenantId || !productId) continue;

    const key = `${tenantId}::${productId}`;

    if (!productMap.has(key)) {
      productMap.set(key, []);
    }

    productMap.get(key)?.push(record);
  }

  return productMap;
}

/**
 * Groups consumption data by productModuleId
 * @param productData Array of consumption records for a single product
 * @returns Map of productModuleId to array of consumption records
 */
function groupByProductModule(productData: IDataObject[]): Map<number, IDataObject[]> {
  const moduleMap = new Map<number, IDataObject[]>();

  for (const record of productData) {
    const moduleId = record.productModuleId as number;

    if (!moduleId) continue;

    if (!moduleMap.has(moduleId)) {
      moduleMap.set(moduleId, []);
    }

    moduleMap.get(moduleId)?.push(record);
  }

  return moduleMap;
}

/**
 * Groups consumption records by usage item key (combination of module, edition, description, plan)
 * @param moduleData Array of consumption records for a single product module
 * @returns Map of usage item key to array of consumption records
 */
function groupByUsageItem(moduleData: IDataObject[]): Map<string, IDataObject[]> {
  const usageMap = new Map<string, IDataObject[]>();

  for (const record of moduleData) {
    const key = createUsageItemKey(record);

    if (!usageMap.has(key)) {
      usageMap.set(key, []);
    }

    usageMap.get(key)?.push(record);
  }

  return usageMap;
}

/**
 * Interface for the consumption data processing parameters
 */
interface IProcessingParams {
  calculationMethod: 'average' | 'highWaterMark';
  roundingDirection: 'none' | 'up' | 'down';
  decimalPlaces: number;
  filterOutZeroUsage: boolean;
  applyRounding: boolean;
  convertByteValues: boolean;
  byteConversionUnit: 'GB' | 'TB';
}

/**
 * Converts bytes to the specified unit (GB or TB) with full precision
 * @param bytes The number of bytes to convert
 * @param targetUnit The unit to convert to ('GB' or 'TB')
 * @returns The converted value
 */
function convertBytesToUnit(bytes: number, targetUnit: 'GB' | 'TB'): number {
  if (targetUnit === 'GB') {
    // Convert bytes to gigabytes (1 GB = 1,073,741,824 bytes)
    return bytes / 1073741824;
  }

  // Convert bytes to terabytes (1 TB = 1,099,511,627,776 bytes)
  return bytes / 1099511627776;
}

/**
 * Processes consumption data for a single customer into a hierarchical structure
 * @param customerData Array of consumption records for a single customer
 * @param customerLookup Lookup object for customer details
 * @param params Processing parameters (calculation method, rounding, etc.)
 * @param startDate Start date of the billing period
 * @param endDate End date of the billing period
 * @returns Processed customer consumption data in hierarchical structure
 */
function processCustomerConsumptionData(
  customerData: IDataObject[],
  customerLookup: { [key: string]: IDataObject },
  params: IProcessingParams,
  startDate: Date,
  endDate: Date,
): ICustomerConsumption {
  // Extract customer info from first record (they should all be the same for this customer)
  const firstRecord = customerData[0];
  const customerGlobalId = firstRecord.customerGlobalId as string;
  const accountName = firstRecord.accountName as string;

  // Get customer name from lookup if available, otherwise fall back to accountName
  let customerName = accountName;
  if (customerLookup[customerGlobalId]?.customerName) {
    customerName = customerLookup[customerGlobalId].customerName as string;
  } else {
    console.log(
      `[INFO] Customer details not found for ID: ${customerGlobalId}, using accountName instead`,
    );
  }

  // Group data by tenant and product
  const productMap = groupByTenantAndProduct(customerData);
  const products: IProduct[] = [];

  // Process each tenant-product group
  for (const [key, productData] of productMap.entries()) {
    const [tenantId, productIdStr] = key.split('::');
    const productId = Number(productIdStr);
    const firstProductRecord = productData[0];

    const productName = firstProductRecord.productName as string;
    const tenantType = firstProductRecord.tenantType as string;

    // Group product data by module
    const moduleMap = groupByProductModule(productData);
    const modules: IProductModule[] = [];

    // Process each module group
    for (const [moduleId, moduleData] of moduleMap.entries()) {
      const firstModuleRecord = moduleData[0];
      const productModuleName = firstModuleRecord.productModuleName as string;

      // Group module data by usage item
      const usageMap = groupByUsageItem(moduleData);
      const usageItems: IUsageItem[] = [];

      // Process each usage item group
      for (const usageData of usageMap.values()) {
        const firstUsageRecord = usageData[0];
        const servicePlanId = Number(firstUsageRecord.servicePlanId || 0);
        const editionName = firstUsageRecord.editionName as string;
        const usageDescription = firstUsageRecord.usageDescription as string;

        // Get the unit, ensuring it has a default value, now using usageUnit from API
        let usageUnit = 'Unknown';
        if (firstUsageRecord.usageUnit !== undefined && firstUsageRecord.usageUnit !== null) {
          usageUnit = String(firstUsageRecord.usageUnit);
        }

        // Use service plan name directly from the API response
        const servicePlanName =
          (firstUsageRecord.servicePlanName as string) || 'Unknown Service Plan';

        // Calculate usage value based on calculation method
        const calculatedValue = calculateUsageValue(
          usageData,
          params.calculationMethod,
          startDate,
          endDate,
        );

        // Apply rounding to the calculated value
        const roundedValue = roundValue(
          calculatedValue,
          params.roundingDirection,
          params.decimalPlaces,
          params.applyRounding,
        );

        // Calculate CU consumed (if available) and apply rounding
        let cuConsumed = 0;
        if (firstUsageRecord.cuConsumed) {
          cuConsumed = calculateUsageValue(
            usageData.map((record) => ({
              usageAmount: record.cuConsumed,
            })),
            params.calculationMethod,
            startDate,
            endDate,
          );

          cuConsumed = roundValue(
            cuConsumed,
            params.roundingDirection,
            params.decimalPlaces,
            params.applyRounding,
          );
        }

        // Skip zero usage items if filtering is enabled AND both usageAmount and cuConsumed are zero
        if (params.filterOutZeroUsage && roundedValue === 0 && cuConsumed === 0) {
          continue;
        }

        // Process byte conversion if enabled and unit contains 'byte' or 'Byte'
        let finalUsageAmount = roundedValue;
        let finalUsageUnit = usageUnit;

        if (
          params.convertByteValues &&
          typeof usageUnit === 'string' &&
          (usageUnit.toLowerCase().includes('byte') || usageUnit.toLowerCase().includes('b'))
        ) {
          // Convert the value to the target unit
          finalUsageAmount = convertBytesToUnit(roundedValue, params.byteConversionUnit);
          // Update the unit
          finalUsageUnit = params.byteConversionUnit;
        }

        // Create usage item
        const usageItem: IUsageItem = {
          editionName,
          servicePlanId,
          servicePlanName,
          usageDescription,
          usageAmount: params.applyRounding
            ? roundValue(finalUsageAmount, params.roundingDirection, params.decimalPlaces, true)
            : finalUsageAmount,
          usageUnit: finalUsageUnit,
          cuConsumed,
        };

        usageItems.push(usageItem);
      }

      // Skip modules with no usage items
      if (usageItems.length === 0) {
        continue;
      }

      // Create module
      const module: IProductModule = {
        productModuleId: moduleId,
        productModuleName,
        usageItems,
      };

      modules.push(module);
    }

    // Skip products with no modules
    if (modules.length === 0) {
      continue;
    }

    // Create product
    const product: IProduct = {
      productId,
      productName,
      tenantId,
      tenantType,
      modules,
    };

    products.push(product);
  }

  // Create customer consumption data
  return {
    customerGlobalId,
    customerName,
    accountName,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    products,
  };
}

/**
 * Processes consumption data and builds hierarchical structure for all customers
 * @param consumptionData Raw consumption data from API
 * @param customerLookup Lookup object for customer details
 * @param params Processing parameters (calculation method, rounding, etc.)
 * @param startDate Start date of the billing period
 * @param endDate End date of the billing period
 * @returns Array of processed customer consumption data
 */
function buildHierarchicalConsumptionData(
  consumptionData: IDataObject[],
  customerLookup: { [key: string]: IDataObject },
  params: IProcessingParams,
  startDate: Date,
  endDate: Date,
): ICustomerConsumption[] {
  // Group consumption data by customer
  const customerMap = groupConsumptionDataByCustomer(consumptionData);
  const result: ICustomerConsumption[] = [];

  // Process each customer's data
  for (const customerData of customerMap.values()) {
    // Process customer's consumption data
    const customerConsumption = processCustomerConsumptionData(
      customerData,
      customerLookup,
      params,
      startDate,
      endDate,
    );

    // Skip customers with no products (after filtering)
    if (customerConsumption.products.length === 0) {
      continue;
    }

    result.push(customerConsumption);
  }

  return result;
}

/**
 * Validates the processed data to ensure all required fields are present and values are valid
 * @param data The processed customer consumption data
 * @returns Object containing validation results
 */
function validateOutputData(data: ICustomerConsumption[]): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];

  // Check if we have any data
  if (!data.length) {
    issues.push('No data available after processing');
    return { isValid: false, issues };
  }

  // Check each customer record
  for (const customer of data) {
    // Validate customer fields
    if (!customer.customerGlobalId) {
      issues.push(`Missing customerGlobalId for customer: ${customer.customerName || 'Unknown'}`);
    }

    if (!customer.customerName) {
      issues.push(
        `Missing customerName for customer ID: ${customer.customerGlobalId || 'Unknown'}`,
      );
    }

    if (!customer.products || !customer.products.length) {
      issues.push(
        `No products for customer: ${customer.customerName || customer.customerGlobalId || 'Unknown'}`,
      );
      continue;
    }

    // Validate product fields
    for (const product of customer.products) {
      if (!product.productId) {
        issues.push(
          `Missing productId for product: ${product.productName || 'Unknown'} in customer: ${customer.customerName || 'Unknown'}`,
        );
      }

      if (!product.productName) {
        issues.push(
          `Missing productName for product ID: ${product.productId || 'Unknown'} in customer: ${customer.customerName || 'Unknown'}`,
        );
      }

      if (!product.modules || !product.modules.length) {
        issues.push(
          `No modules for product: ${product.productName || 'Unknown'} in customer: ${customer.customerName || 'Unknown'}`,
        );
        continue;
      }

      // Validate module fields
      for (const module of product.modules) {
        if (!module.productModuleId) {
          issues.push(
            `Missing productModuleId for module: ${module.productModuleName || 'Unknown'} in product: ${product.productName || 'Unknown'}`,
          );
        }

        if (!module.productModuleName) {
          issues.push(
            `Missing productModuleName for module ID: ${module.productModuleId || 'Unknown'} in product: ${product.productName || 'Unknown'}`,
          );
        }

        if (!module.usageItems || !module.usageItems.length) {
          issues.push(
            `No usage items for module: ${module.productModuleName || 'Unknown'} in product: ${product.productName || 'Unknown'}`,
          );
          continue;
        }

        // Validate usage item fields
        for (const usageItem of module.usageItems) {
          if (usageItem.usageAmount < 0) {
            issues.push(
              `Negative usageAmount (${usageItem.usageAmount}) for usage: ${usageItem.usageDescription || 'Unknown'} in module: ${module.productModuleName || 'Unknown'}`,
            );
          }

          if (!usageItem.usageDescription) {
            issues.push(
              `Missing usageDescription for usage item in module: ${module.productModuleName || 'Unknown'}`,
            );
          }

          if (!usageItem.usageUnit) {
            issues.push(
              `Missing usageUnit for usage item: ${usageItem.usageDescription || 'Unknown'} in module: ${module.productModuleName || 'Unknown'}`,
            );
          }
        }
      }
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * Executes the Consumption Billing Analyzer operation.
 * @param this The context object.
 * @param i The index of the current item.
 * @returns The result of the operation.
 */
export async function executeConsumptionBillingAnalyzerOperation(
  this: IExecuteFunctions,
  i: number,
): Promise<INodeExecutionData[]> {
  const operation = this.getNodeParameter('operation', i, '') as string;
  let responseData: INodeExecutionData[] = [];

  try {
    if (operation === 'analyzeConsumption') {
      // Get date parameters based on selection method
      const dateSelectionMethod = this.getNodeParameter(
        'dateSelectionMethod',
        i,
        'relativeDates',
      ) as string;
      let startDate = '';
      let endDate = '';

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

      // Get calculation parameters
      const calculationMethod = this.getNodeParameter('calculationMethod', i, 'average') as
        | 'average'
        | 'highWaterMark';
      const roundingDirection = this.getNodeParameter('roundingDirection', i, 'none') as
        | 'none'
        | 'up'
        | 'down';
      const decimalPlaces = this.getNodeParameter('decimalPlaces', i, 2) as number;
      const filterOutZeroUsage = this.getNodeParameter('filterOutZeroUsage', i, false) as boolean;
      const applyRounding = this.getNodeParameter('applyRounding', i, false) as boolean;
      const convertByteValues = this.getNodeParameter('convertByteValues', i, false) as boolean;
      const byteConversionUnit = this.getNodeParameter('byteConversionUnit', i, 'TB') as
        | 'GB'
        | 'TB';

      // Create filters array for all filters
      const filterBy: IReportFilter[] = [];

      // Add date range filter
      filterBy.push(...createDateRangeFilter(startDate, endDate));

      // Add customer filter if specified
      const filterByCustomers = this.getNodeParameter('filterByCustomers', i, false) as boolean;
      let customerIds: string[] = [];
      if (filterByCustomers) {
        customerIds = this.getNodeParameter('customerIds', i, []) as string[];
        if (customerIds.length > 0) {
          filterBy.push(createCustomerFilter(customerIds));
        }
      }

      // ------- DATA RETRIEVAL PHASE -------

      console.log('[INFO] Starting data retrieval phase...');

      // Fetch Customer data for enrichment
      console.log('[INFO] Fetching customer data for enrichment...');
      const customersEndpoint = '/msp/v2/customers';
      const customers = (await druvaMspApiRequestAllItems.call(
        this,
        'GET',
        customersEndpoint,
        'customers',
        {},
        { pageSize: 500 },
      )) as IDataObject[];

      // Create a lookup object for quick customer reference
      const customerLookup = createCustomerLookup(customers);

      console.log(`[INFO] Retrieved ${customers.length} customers`);

      // Fetch Consumption Data
      console.log('[INFO] Fetching consumption data...');
      const consumptionEndpoint = '/msp/reporting/v1/reports/consumptionItemized';

      // Prepare request body with the correct structure - always fetch all data with maximum page size
      const body: IDataObject = {
        filters: createReportFilters(500, filterBy), // Always use maximum page size to get all data
        // Zero usage filtering handled in post-processing
      };

      // Use the specific helper for report v2 endpoints which handles pagination correctly
      const consumptionData = (await druvaMspApiRequestAllReportV2Items.call(
        this,
        consumptionEndpoint,
        body,
        'data',
      )) as IDataObject[];

      console.log(`[INFO] Retrieved ${consumptionData.length} consumption records`);

      // Validate the data retrieved
      if (!consumptionData.length) {
        console.log('[WARNING] No consumption data found for the selected period and filters');

        // Return informative error when no data is found
        return this.helpers.returnJsonArray({
          success: false,
          message: 'No consumption data found for the selected period and filters',
          parameters: {
            startDate,
            endDate,
            calculationMethod,
            roundingDirection,
            decimalPlaces,
            filterOutZeroUsage,
            customerFilter: filterByCustomers ? 'Applied' : 'Not applied',
          },
        });
      }

      // ------- PROCESSING PHASE -------

      console.log('[INFO] Processing consumption data...');

      // Parse date strings to Date objects for calculations
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);

      // Process the consumption data
      const processedData = buildHierarchicalConsumptionData(
        consumptionData,
        customerLookup,
        {
          calculationMethod,
          roundingDirection,
          decimalPlaces,
          filterOutZeroUsage,
          applyRounding,
          convertByteValues,
          byteConversionUnit,
        },
        startDateObj,
        endDateObj,
      );

      console.log(`[INFO] Processed data for ${processedData.length} customers`);

      // ------- OUTPUT GENERATION PHASE -------

      console.log('[INFO] Generating final output...');

      // Validate the output data
      const validationResult = validateOutputData(processedData);

      if (!validationResult.isValid) {
        console.log('[WARNING] Validation issues found in the processed data:');
        for (const issue of validationResult.issues) {
          console.log(`- ${issue}`);
        }
      }

      // Add timestamp information
      const timestamp = new Date().toISOString();

      // Return the final output
      const outputResponse: IDataObject = {
        success: true,
        message: 'Consumption Billing Analysis completed successfully',
        timestamp,
        analysisVersion: '1.0',
        parameters: {
          startDate,
          endDate,
          calculationMethod,
          roundingDirection: applyRounding ? roundingDirection : 'none',
          decimalPlaces: applyRounding && roundingDirection !== 'none' ? decimalPlaces : 'N/A',
          applyRounding,
          filterOutZeroUsage,
          convertByteValues,
          byteConversionUnit: convertByteValues ? byteConversionUnit : 'N/A',
          customerFilter: filterByCustomers ? customerIds.join(', ') : 'All customers',
        },
        validation: {
          isValid: validationResult.isValid,
          issueCount: validationResult.issues.length,
          issues: validationResult.issues.length ? validationResult.issues : undefined,
        },
        data: processedData,
      };

      responseData = this.helpers.returnJsonArray([outputResponse]);
    }

    return responseData;
  } catch (error) {
    if (this.continueOnFail()) {
      return this.helpers.returnJsonArray({ error: error.message });
    }
    throw error;
  }
}
