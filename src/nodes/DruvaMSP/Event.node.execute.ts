import type {
  IExecuteFunctions,
  INodeExecutionData,
  IDataObject,
  NodeApiError,
} from 'n8n-workflow';

// Import the helper functions for API requests and pagination
import { druvaMspApiRequest, druvaMspApiRequestAllItems } from './GenericFunctions';
import { getSyslogSeverityLabel } from './helpers/ValueConverters';

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
 * A helper function to fetch events with consistent logic for both MSP and Customer events
 */
async function fetchEvents(
  this: IExecuteFunctions,
  endpoint: string,
  returnAll: boolean,
  limit: number,
  filters: IDataObject,
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

  // Apply server-side filtering for supported parameters

  // Category filtering (API supports single value)
  if (filters.category && Array.isArray(filters.category) && filters.category.length > 0) {
    // Use first category for server-side filtering
    queryParams.category = filters.category[0] as string;
  }

  // Event type filtering (API parameter is 'type')
  if (filters.eventType && Array.isArray(filters.eventType) && filters.eventType.length > 0) {
    // Use first event type for server-side filtering
    queryParams.type = filters.eventType[0] as string;
  }

  // Severity filtering (API parameter is 'syslogSeverity')
  if (filters.severity && Array.isArray(filters.severity) && filters.severity.length > 0) {
    // Use first severity for server-side filtering, convert to number if needed
    const severityValue = filters.severity[0] as string;
    queryParams.syslogSeverity = Number.parseInt(severityValue, 10);
  }

  try {
    if (returnAll) {
      // Use pagination with maximum pageSize of 500 (API limit)
      events = await druvaMspApiRequestAllItems.call(
        this,
        'GET',
        endpoint,
        'events',
        undefined,
        queryParams,
      );
    } else {
      const response = await druvaMspApiRequest.call(this, 'GET', endpoint, undefined, queryParams);
      events = ((response as IDataObject)?.events as IDataObject[]) || [];
    }
  } catch (error) {
    console.error(`Error retrieving events: ${(error as Error).message}`);
    throw error;
  }

  // Apply remaining client-side filtering for parameters not supported by the API
  // or for additional filter values beyond the first one used server-side
  const hasRemainingFilters = Object.keys(filters).some((key) => {
    if (key === 'dateRange' || key === 'feature' || key === 'initiatedBy') {
      return true;
    }
    // Check if we have multiple values for category, eventType, or severity
    if (
      (key === 'category' || key === 'eventType' || key === 'severity') &&
      Array.isArray(filters[key]) &&
      filters[key].length > 1
    ) {
      return true;
    }
    return false;
  });

  if (hasRemainingFilters) {
    const originalCount = events.length;
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
      const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
      const options = this.getNodeParameter('options', i, {}) as IDataObject;
      const endpoint = '/msp/v2/events';

      const events = await fetchEvents.call(this, endpoint, returnAll, limit, filters, options);

      responseData = this.helpers.returnJsonArray(events);
    } else if (operation === 'getManyCustomerEvents') {
      // Implement Get Many Customer Events logic
      const returnAll = this.getNodeParameter('returnAll', i, false) as boolean;
      const limit = this.getNodeParameter('limit', i, 50) as number;
      const customerId = this.getNodeParameter('customerId', i) as string;
      const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
      const options = this.getNodeParameter('options', i, {}) as IDataObject;
      const endpoint = `/msp/v3/customers/${customerId}/events`;

      const events = await fetchEvents.call(this, endpoint, returnAll, limit, filters, options);

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
