import type {
  IExecuteFunctions,
  INodeExecutionData,
  IDataObject,
  NodeApiError,
} from 'n8n-workflow';

// Import the helper functions for API requests and pagination
import { druvaMspApiRequest, PaginationHelper } from './GenericFunctions';
import { getSyslogSeverityLabel } from './helpers/ValueConverters';
import { getRelativeDateRange } from './helpers/DateHelpers';

/**
 * Filter events based on provided filters that cannot be handled by the API
 * Or for additional filtering after server-side filtering
 */
function applyRemainingFilters(events: IDataObject[], filters: IDataObject): IDataObject[] {
  if (Object.keys(filters).length === 0) {
    return events;
  }

  let filteredEvents = [...events];

  // Filter by date range
  if (
    filters.dateRange &&
    (filters.dateRange as IDataObject).dateRangeValues &&
    Object.keys((filters.dateRange as IDataObject).dateRangeValues as IDataObject).length > 0
  ) {
    const dateRangeValues = (filters.dateRange as IDataObject).dateRangeValues as IDataObject;
    const startDate = dateRangeValues.startDate
      ? new Date(dateRangeValues.startDate as string).getTime()
      : null;
    const endDate = dateRangeValues.endDate
      ? new Date(dateRangeValues.endDate as string).getTime()
      : null;

    if (startDate !== null || endDate !== null) {
      filteredEvents = filteredEvents.filter((event) => {
        // Check for both timeStamp and timestamp since we're not sure which one the API returns
        const timeStampValue = event.timeStamp || event.timestamp;

        if (!timeStampValue) {
          return false; // Skip events with no timestamp
        }

        // Handle if the timestamp is already a number (unix epoch) or needs conversion
        let eventDate: number;
        if (typeof timeStampValue === 'number') {
          // API returns timestamps in seconds, but JavaScript Date uses milliseconds
          // Convert from seconds to milliseconds by multiplying by 1000
          eventDate = timeStampValue * 1000;
        } else {
          // Try to convert from string to number directly first (unix epoch)
          const epochTimestamp = Number(timeStampValue);
          if (!Number.isNaN(epochTimestamp)) {
            // If it's a valid number, it's likely an epoch timestamp in seconds
            // Convert from seconds to milliseconds
            eventDate = epochTimestamp * 1000;
          } else {
            // Otherwise treat it as a date string
            eventDate = new Date(timeStampValue as string).getTime();
          }
        }

        if (startDate !== null && eventDate < startDate) {
          return false;
        }
        if (endDate !== null && eventDate > endDate) {
          return false;
        }
        return true;
      });
    }
  }

  // Filter by category (if not already filtered server-side or if multiple values selected)
  if (filters.category && Array.isArray(filters.category) && filters.category.length > 1) {
    // If we have multiple categories, the first one was used for server-side filtering
    // We need to check the remaining categories client-side
    const remainingCategories = [...filters.category];
    // Remove the first category as it was already used server-side
    remainingCategories.shift();

    if (remainingCategories.length > 0) {
      filteredEvents = filteredEvents.filter((event) => {
        return remainingCategories.includes(event.category as string);
      });
    }
  }

  // Filter by event type (if not already filtered server-side or if multiple values selected)
  if (filters.eventType && Array.isArray(filters.eventType) && filters.eventType.length > 1) {
    // If we have multiple event types, the first one was used for server-side filtering
    // We need to check the remaining types client-side
    const remainingTypes = [...filters.eventType];
    // Remove the first type as it was already used server-side
    remainingTypes.shift();

    if (remainingTypes.length > 0) {
      filteredEvents = filteredEvents.filter((event) => {
        return remainingTypes.includes(event.type as string);
      });
    }
  }

  // Filter by severity (if not already filtered server-side or if multiple values selected)
  if (filters.severity && Array.isArray(filters.severity) && filters.severity.length > 1) {
    // If we have multiple severities, the first one was used for server-side filtering
    // We need to check the remaining severities client-side
    const remainingSeverities = [...filters.severity];
    // Remove the first severity as it was already used server-side
    remainingSeverities.shift();

    if (remainingSeverities.length > 0) {
      filteredEvents = filteredEvents.filter((event) => {
        // API might return syslogSeverity as either a number or a string
        let severityValue = event.syslogSeverity;
        if (typeof severityValue === 'number') {
          severityValue = severityValue.toString();
        }
        return remainingSeverities.includes(severityValue as string);
      });
    }
  }

  // Filter by feature (not supported by API, must be done client-side)
  if (filters.feature && Array.isArray(filters.feature) && filters.feature.length > 0) {
    filteredEvents = filteredEvents.filter((event) => {
      return (filters.feature as string[]).includes(event.feature as string);
    });
  }

  // Filter by who initiated the event (not supported by API, must be done client-side)
  if (filters.initiatedBy && (filters.initiatedBy as string).trim() !== '') {
    const initiatedBy = (filters.initiatedBy as string).trim().toLowerCase();
    filteredEvents = filteredEvents.filter((event) => {
      if (
        event.details &&
        (event.details as IDataObject).initiatorName &&
        ((event.details as IDataObject).initiatorName as string).toLowerCase().includes(initiatedBy)
      ) {
        return true;
      }
      if (
        event.details &&
        (event.details as IDataObject).initiatorId &&
        ((event.details as IDataObject).initiatorId as string).toLowerCase().includes(initiatedBy)
      ) {
        return true;
      }
      return false;
    });
  }

  return filteredEvents;
}

/**
 * Formats timestamps in event data to a more readable format if requested.
 * @param events The events to process.
 * @param options The processing options.
 * @returns The processed events.
 */
function processEvents(events: IDataObject[], options: IDataObject): IDataObject[] {
  if (!events || events.length === 0) {
    return events;
  }

  const includeDetails = options.includeDetails !== false;
  const formatTimestamps = options.formatTimestamps !== false;

  const processedEvents = events.map((event) => {
    const processedEvent = { ...event };

    // Process timestamp, check for both timeStamp and timestamp
    if (formatTimestamps) {
      const timeStampValue = processedEvent.timeStamp || processedEvent.timestamp;
      if (timeStampValue) {
        let dateTimeObj: Date;

        // Handle if the timestamp is a number (unix epoch) or needs conversion
        if (typeof timeStampValue === 'number') {
          // API returns timestamps in seconds, convert to milliseconds for JS Date
          dateTimeObj = new Date(timeStampValue * 1000);

          // Add the dateTime field in ISO format with timezone
          processedEvent.dateTime = dateTimeObj.toISOString();
        } else {
          // Try to convert from string to number first (unix epoch)
          const epochTimestamp = Number(timeStampValue);
          if (!Number.isNaN(epochTimestamp)) {
            // If it's a valid number, it's likely an epoch timestamp in seconds
            dateTimeObj = new Date(epochTimestamp * 1000);

            // Add the dateTime field in ISO format with timezone
            processedEvent.dateTime = dateTimeObj.toISOString();
          } else {
            // Otherwise treat it as a date string
            dateTimeObj = new Date(timeStampValue as string);

            // Add the dateTime field in ISO format with timezone
            processedEvent.dateTime = dateTimeObj.toISOString();
          }
        }
      }
    }

    // Add human-readable severity name if syslogSeverity is present
    if (processedEvent.syslogSeverity !== undefined) {
      // Convert to number if it's a string
      const severityCode =
        typeof processedEvent.syslogSeverity === 'string'
          ? Number(processedEvent.syslogSeverity)
          : (processedEvent.syslogSeverity as number);

      processedEvent.severityName = getSyslogSeverityLabel(severityCode);
    }

    // Remove details if not requested
    if (!includeDetails && processedEvent.details) {
      // Set to undefined instead of using delete
      processedEvent.details = undefined;
    }

    return processedEvent;
  });

  return processedEvents;
}

/**
 * A helper function to fetch events with consistent logic for both MSP and Customer events.
 *
 * IMPORTANT PAGINATION NOTES:
 * - This implementation uses direct token-based pagination with PaginationHelper to handle large event sets (>1000 events)
 * - We use a high loop count limit (10000) to allow fetching up to ~5 million events while maintaining loop protection
 * - The Druva MSP API has a specific requirement: You cannot use pageToken and filters simultaneously
 * - For subsequent requests after the first page, we must use ONLY the pageToken parameter
 * - The pageSize is set to 500 (API maximum) to minimize the number of requests needed
 *
 * @param this The context object.
 * @param endpoint The API endpoint to call.
 * @param returnAll Whether to return all results or limit them.
 * @param limit The maximum number of results to return if returnAll is false.
 * @param i The index of the current item.
 * @param options Additional options for processing the events.
 * @returns A promise resolving to an array of event objects.
 */
async function fetchEvents(
  this: IExecuteFunctions,
  endpoint: string,
  returnAll: boolean,
  limit: number,
  i: number,
  options: IDataObject,
): Promise<IDataObject[]> {
  let events: IDataObject[] = [];

  // Create query parameters with API-supported filters
  const queryParams: IDataObject = {};

  // Always set a page size
  if (returnAll) {
    queryParams.pageSize = 500; // Maximum allowed by API
  } else {
    queryParams.pageSize = Math.min(limit, 500);
  }

  // Handle date selection based on method
  const dateSelectionMethod = this.getNodeParameter(
    'dateSelectionMethod',
    i,
    'relativeDates',
  ) as string;
  let startDate = '';
  let endDate = '';

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
  }

  // Check each filter toggle and apply server-side filtering for supported parameters

  // Category filtering (API supports single value)
  const filterByCategory = this.getNodeParameter('filterByCategory', i, false) as boolean;
  let categoryValues: string[] = [];
  if (filterByCategory) {
    categoryValues = this.getNodeParameter('category', i, []) as string[];
    if (categoryValues.length > 0) {
      // Use first category for server-side filtering
      queryParams.category = categoryValues[0];
    }
  }

  // Event type filtering (API parameter is 'type')
  const filterByEventType = this.getNodeParameter('filterByEventType', i, false) as boolean;
  let eventTypeValues: string[] = [];
  if (filterByEventType) {
    eventTypeValues = this.getNodeParameter('eventType', i, []) as string[];
    if (eventTypeValues.length > 0) {
      // Use first event type for server-side filtering
      queryParams.type = eventTypeValues[0];
    }
  }

  // Severity filtering (API parameter is 'syslogSeverity')
  const filterBySeverity = this.getNodeParameter('filterBySeverity', i, false) as boolean;
  let severityValues: string[] = [];
  if (filterBySeverity) {
    severityValues = this.getNodeParameter('severity', i, []) as string[];
    if (severityValues.length > 0) {
      // Use first severity for server-side filtering, convert to number if needed
      const severityValue = severityValues[0];
      queryParams.syslogSeverity = Number.parseInt(severityValue, 10);
    }
  }

  try {
    if (returnAll) {
      // Use PaginationHelper with a much higher loop count limit (10000 instead of 100)
      // This allows for retrieving up to ~5 million events (assuming 500 events per page)
      const paginationHelper = new PaginationHelper(10000);
      events = [];

      let nextPageToken: string | undefined = undefined;
      let responseData: IDataObject;
      // Track consecutive pages with very few events (indicating we're near the end)
      let consecutiveLowCountPages = 0;
      const LOW_EVENT_THRESHOLD = 0.1; // 10% of requested page size
      const MAX_CONSECUTIVE_LOW_COUNT = 3; // Stop after 3 consecutive low count pages

      do {
        // If we have a nextPageToken, use only that parameter without any filters
        // This is a requirement of the Druva MSP API
        const requestParams = nextPageToken ? { pageToken: nextPageToken } : { ...queryParams };

        // Make the API request
        responseData = (await druvaMspApiRequest.call(
          this,
          'GET',
          endpoint,
          undefined,
          requestParams,
        )) as IDataObject;

        // Extract events from the response
        const pageEvents = (responseData.events as IDataObject[]) || [];

        // Check if we received substantially fewer events than requested
        // This is a strong indicator that we've reached or are near the end of available data
        let requestedPageSize = 500; // Default value
        if ('pageToken' in requestParams) {
          // If using page token, get the page size from the original query params
          requestedPageSize = Number(queryParams.pageSize) || 500;
        } else {
          // Otherwise get it from the current request params
          requestedPageSize = Number(requestParams.pageSize) || 500;
        }
        const lowEventThreshold = Math.floor(requestedPageSize * LOW_EVENT_THRESHOLD);

        if (pageEvents.length > 0 && pageEvents.length < lowEventThreshold) {
          consecutiveLowCountPages++;
          console.log(
            `[DEBUG] Received only ${pageEvents.length} events (less than ${lowEventThreshold}). This may indicate we're near the end of available data.`,
          );

          // If we've had multiple consecutive pages with very few events, assume we've got all meaningful data
          if (consecutiveLowCountPages >= MAX_CONSECUTIVE_LOW_COUNT) {
            console.log(
              `[DEBUG] Received ${MAX_CONSECUTIVE_LOW_COUNT} consecutive pages with very few events. Assuming all meaningful data retrieved.`,
            );
            break;
          }
        } else {
          // Reset the counter if we receive a substantial number of events
          consecutiveLowCountPages = 0;
        }

        // Add events to our collection
        events.push(...pageEvents);

        // Get the next page token
        nextPageToken = responseData.nextPageToken as string;

        // Log progress for debugging
        console.log(
          `[DEBUG] Retrieved ${pageEvents.length} events. Total so far: ${events.length}. Next token: ${nextPageToken || 'none'}`,
        );

        // Track the token and check for loops or max count
        if (!paginationHelper.trackToken(nextPageToken)) {
          console.log('[DEBUG] Pagination stopped due to loop detection or max count reached.');
          break;
        }

        // Special case: If we got exactly 0 events but have a next token, this is likely an API quirk
        // In this case, we should stop pagination to avoid unnecessary requests
        if (pageEvents.length === 0 && nextPageToken) {
          console.log(
            '[DEBUG] Received 0 events but have a next token. Stopping pagination to avoid unnecessary requests.',
          );
          break;
        }
      } while (nextPageToken);

      console.log(`[DEBUG] Retrieved a total of ${events.length} events.`);
    } else {
      const response = await druvaMspApiRequest.call(this, 'GET', endpoint, undefined, queryParams);
      events = ((response as IDataObject)?.events as IDataObject[]) || [];
    }
  } catch (error) {
    console.error(`Error retrieving events: ${(error as Error).message}`);
    throw error;
  }

  // Check if we need to apply client-side filtering
  const filterByFeature = this.getNodeParameter('filterByFeature', i, false) as boolean;
  const filterByInitiator = this.getNodeParameter('filterByInitiator', i, false) as boolean;

  const hasDateFilter = dateSelectionMethod !== 'allDates' && (startDate || endDate);

  const hasRemainingFilters =
    hasDateFilter ||
    filterByFeature ||
    filterByInitiator ||
    (filterByCategory && categoryValues.length > 1) ||
    (filterByEventType && eventTypeValues.length > 1) ||
    (filterBySeverity && severityValues.length > 1);

  if (hasRemainingFilters) {
    const originalCount = events.length;

    // Build filters object for applyRemainingFilters function
    const filters: IDataObject = {};

    // Add date range filter if enabled
    if (hasDateFilter) {
      // Create nested structure as expected by applyRemainingFilters
      filters.dateRange = {
        dateRangeValues: {
          startDate,
          endDate,
        },
      };
    }

    // Add category filter if multiple values are selected
    if (filterByCategory && categoryValues.length > 1) {
      filters.category = categoryValues;
    }

    // Add event type filter if multiple values are selected
    if (filterByEventType && eventTypeValues.length > 1) {
      filters.eventType = eventTypeValues;
    }

    // Add severity filter if multiple values are selected
    if (filterBySeverity && severityValues.length > 1) {
      filters.severity = severityValues;
    }

    // Add feature filter if enabled
    if (filterByFeature) {
      filters.feature = this.getNodeParameter('feature', i, []) as string[];
    }

    // Add initiator filter if enabled
    if (filterByInitiator) {
      filters.initiatedBy = this.getNodeParameter('initiatedBy', i, '') as string;
    }

    events = applyRemainingFilters(events, filters);
    console.log(`[DEBUG] Events filtered: ${originalCount} -> ${events.length}`);
  }

  // Process events (format timestamps, etc.)
  events = processEvents(events, options);

  return events;
}

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
    if (operation === 'getManyMspEvents') {
      // Implement Get Many MSP Events logic
      const returnAll = this.getNodeParameter('returnAll', i, false) as boolean;
      const limit = this.getNodeParameter('limit', i, 50) as number;
      const options = this.getNodeParameter('options', i, {}) as IDataObject;
      const endpoint = '/msp/v2/events';

      const events = await fetchEvents.call(this, endpoint, returnAll, limit, i, options);

      responseData = this.helpers.returnJsonArray(events);
    } else if (operation === 'getManyCustomerEvents') {
      // Implement Get Many Customer Events logic
      const returnAll = this.getNodeParameter('returnAll', i, false) as boolean;
      const limit = this.getNodeParameter('limit', i, 50) as number;
      const customerId = this.getNodeParameter('customerId', i) as string;
      const options = this.getNodeParameter('options', i, {}) as IDataObject;
      const endpoint = `/msp/v3/customers/${customerId}/events`;

      const events = await fetchEvents.call(this, endpoint, returnAll, limit, i, options);

      responseData = this.helpers.returnJsonArray(events);
    }
  } catch (error) {
    if (this.continueOnFail()) {
      return [{ json: {}, error: error as NodeApiError }];
    }
    throw error;
  }

  return responseData;
}
