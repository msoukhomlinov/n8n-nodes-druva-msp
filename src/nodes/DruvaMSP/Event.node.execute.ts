import type {
  IExecuteFunctions,
  INodeExecutionData,
  IDataObject,
  NodeApiError,
} from 'n8n-workflow';

// Import the helper functions for API requests and pagination
import { druvaMspApiRequest, druvaMspApiRequestAllItems } from './GenericFunctions';

/**
 * Filter events based on provided filters
 */
function filterEvents(events: IDataObject[], filters: IDataObject): IDataObject[] {
  console.log('[DEBUG] Event node - Starting event filtering');

  // Check event structure to diagnose pagination issues
  if (events.length > 0) {
    console.log(
      '[DEBUG] Event node - Sample event structure:',
      `${JSON.stringify(events[0]).substring(0, 300)}...`,
    );
    console.log('[DEBUG] Event node - Event keys:', Object.keys(events[0]));
  }

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

  // Filter by category
  if (filters.category && Array.isArray(filters.category) && filters.category.length > 0) {
    filteredEvents = filteredEvents.filter((event) => {
      return (filters.category as string[]).includes(event.category as string);
    });
  }

  // Filter by event type
  if (filters.eventType && Array.isArray(filters.eventType) && filters.eventType.length > 0) {
    filteredEvents = filteredEvents.filter((event) => {
      return (filters.eventType as string[]).includes(event.type as string);
    });
  }

  // Filter by severity
  if (filters.severity && Array.isArray(filters.severity) && filters.severity.length > 0) {
    filteredEvents = filteredEvents.filter((event) => {
      // API might return syslogSeverity as either a number or a string
      let severityValue = event.syslogSeverity;
      if (typeof severityValue === 'number') {
        severityValue = severityValue.toString();
      }
      return (filters.severity as string[]).includes(severityValue as string);
    });
  }

  // Filter by feature
  if (filters.feature && Array.isArray(filters.feature) && filters.feature.length > 0) {
    filteredEvents = filteredEvents.filter((event) => {
      return (filters.feature as string[]).includes(event.feature as string);
    });
  }

  // Filter by who initiated the event
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
 * Maps syslogSeverity codes to human-readable severity names
 */
function getSeverityName(severityCode: string | number): string {
  // Convert to string if it's a number
  const code = typeof severityCode === 'number' ? severityCode.toString() : severityCode;

  switch (code) {
    case '0':
      return 'Emergency';
    case '1':
      return 'Alert';
    case '2':
      return 'Critical';
    case '3':
      return 'Error';
    case '4':
      return 'Warning';
    case '5':
      return 'Notice';
    case '6':
      return 'Informational';
    case '7':
      return 'Debug';
    default:
      return `Unknown (${code})`;
  }
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
      processedEvent.severityName = getSeverityName(
        processedEvent.syslogSeverity as string | number,
      );
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
      const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
      const options = this.getNodeParameter('options', i, {}) as IDataObject;
      const endpoint = '/msp/v2/events';

      let events: IDataObject[] = [];

      if (returnAll) {
        // Use pagination with maximum pageSize of 500 (API limit)
        console.log('[DEBUG] Event node - Starting paginated request to fetch all events');

        // Only include pageSize in the first request - don't add other filters
        // that might interfere with pagination
        const queryParams = { pageSize: 500 };
        console.log('[DEBUG] Event node - Using queryParams for first page:', queryParams);

        try {
          // Get the first page directly to examine structure
          const firstPageResponse = await druvaMspApiRequest.call(
            this,
            'GET',
            endpoint,
            undefined,
            queryParams,
          );

          console.log(
            '[DEBUG] Event node - First page response structure:',
            `${JSON.stringify(firstPageResponse).substring(0, 500)}...`,
          );

          const firstPageEvents =
            ((firstPageResponse as IDataObject)?.events as IDataObject[]) || [];
          console.log('[DEBUG] Event node - First page events count:', firstPageEvents.length);

          if (firstPageEvents.length > 0) {
            console.log(
              '[DEBUG] Event node - Sample event structure:',
              `${JSON.stringify(firstPageEvents[0]).substring(0, 300)}...`,
            );
          }

          // Continue with full pagination using the shared helper function
          // This function handles pageToken properly as we fixed it
          events = await druvaMspApiRequestAllItems.call(
            this,
            'GET',
            endpoint,
            'events',
            undefined,
            queryParams,
          );

          console.log(
            `[DEBUG] Event node - Successfully retrieved ${events.length} events with pagination`,
          );
        } catch (error) {
          console.error(
            `[ERROR] Event node - Failed to retrieve events using pagination: ${(error as Error).message}`,
          );
          throw error;
        }
      } else {
        // Ensure limit doesn't exceed 500 for a single request
        const pageSize = Math.min(limit, 500);
        console.log(`[DEBUG] Event node - Starting single request to fetch ${pageSize} events`);
        try {
          const response = await druvaMspApiRequest.call(this, 'GET', endpoint, undefined, {
            pageSize,
          });
          events = ((response as IDataObject)?.events as IDataObject[]) || [];
          console.log(
            `[DEBUG] Event node - Successfully retrieved ${events.length} events in a single request`,
          );
        } catch (error) {
          console.error(
            `[ERROR] Event node - Failed to retrieve events in single request: ${(error as Error).message}`,
          );
          throw error;
        }
      }

      // Apply client-side filtering
      console.log(`[DEBUG] Event node - Applying filters: ${JSON.stringify(filters)}`);
      events = filterEvents(events, filters);
      console.log(
        `[DEBUG] Event node - Filtered to ${events.length} events after applying filters`,
      );

      // Process events (format timestamps, etc.)
      events = processEvents(events, options);

      responseData = this.helpers.returnJsonArray(events);
    } else if (operation === 'listCustomer') {
      // Implement List Customer Events logic
      const returnAll = this.getNodeParameter('returnAll', i, false) as boolean;
      const limit = this.getNodeParameter('limit', i, 50) as number;
      const customerId = this.getNodeParameter('customerId', i) as string;
      const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
      const options = this.getNodeParameter('options', i, {}) as IDataObject;
      const endpoint = `/msp/v3/customers/${customerId}/events`;

      let events: IDataObject[] = [];

      if (returnAll) {
        // Use pagination with maximum pageSize of 500 (API limit)
        console.log(
          `[DEBUG] Event node - Starting paginated request to fetch all customer events for ${customerId}`,
        );
        const queryParams = { pageSize: 500 };
        try {
          events = await druvaMspApiRequestAllItems.call(
            this,
            'GET',
            endpoint,
            'events',
            undefined,
            queryParams,
          );
          console.log(
            `[DEBUG] Event node - Successfully retrieved ${events.length} customer events with pagination`,
          );
        } catch (error) {
          console.error(
            `[ERROR] Event node - Failed to retrieve customer events using pagination: ${(error as Error).message}`,
          );
          throw error;
        }
      } else {
        // Ensure limit doesn't exceed 500 for a single request
        const pageSize = Math.min(limit, 500);
        console.log(
          `[DEBUG] Event node - Starting single request to fetch ${pageSize} customer events`,
        );
        try {
          const response = await druvaMspApiRequest.call(this, 'GET', endpoint, undefined, {
            pageSize,
          });
          events = ((response as IDataObject)?.events as IDataObject[]) || [];
          console.log(
            `[DEBUG] Event node - Successfully retrieved ${events.length} customer events in a single request`,
          );
        } catch (error) {
          console.error(
            `[ERROR] Event node - Failed to retrieve customer events in single request: ${(error as Error).message}`,
          );
          throw error;
        }
      }

      // Apply client-side filtering
      console.log(`[DEBUG] Event node - Applying filters: ${JSON.stringify(filters)}`);
      events = filterEvents(events, filters);
      console.log(
        `[DEBUG] Event node - Filtered to ${events.length} customer events after applying filters`,
      );

      // Process events (format timestamps, etc.)
      events = processEvents(events, options);

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
