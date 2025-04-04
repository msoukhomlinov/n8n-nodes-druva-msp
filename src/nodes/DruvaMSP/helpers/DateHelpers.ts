// No need for IDataObject import since it's not used
// import type { IDataObject } from 'n8n-workflow';

/**
 * Format a date for API requests in various formats
 * @param dateTime Date string from n8n
 * @param format Optional format type: 'iso' (default), 'date-only', or 'report'
 * @returns Formatted date string in the requested format
 */
export function formatDate(
  dateTime: string,
  format: 'iso' | 'date-only' | 'report' = 'iso',
): string {
  const date = new Date(dateTime);

  switch (format) {
    case 'date-only':
      // Format as YYYY-MM-DD for some request bodies
      return date.toISOString().split('T')[0];
    // Remove redundant cases and use default
    default:
      // Full ISO string (RFC3339 format) for most API requests
      return date.toISOString();
  }
}

/**
 * Format a date for use in report filters (RFC3339 format)
 * @param dateTime Date string from n8n
 * @returns Formatted date string in RFC3339 format (e.g., "2023-01-01T00:00:00Z")
 */
export function formatReportDate(dateTime: string): string {
  return formatDate(dateTime, 'report');
}

/**
 * Get the default start date (30 days ago) if not provided
 */
export function getDefaultStartDate(): string {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date.toISOString();
}

/**
 * Get the default end date (current date) if not provided
 */
export function getDefaultEndDate(): string {
  return new Date().toISOString();
}

/**
 * Calculate start and end dates based on a relative date range
 * @param relativeDateRange The selected relative date range
 * @returns Object with startDate and endDate in ISO format
 */
export function getRelativeDateRange(relativeDateRange: string): {
  startDate: string;
  endDate: string;
} {
  const now = new Date();
  const endDate = new Date(now);
  let startDate: Date;

  // Reset time to end of day for end date (23:59:59.999)
  endDate.setHours(23, 59, 59, 999);

  switch (relativeDateRange) {
    case 'currentMonth': {
      // Start: 1st day of current month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    }

    case 'previousMonth': {
      // Start: 1st day of previous month
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      // End: Last day of previous month
      endDate.setDate(0); // Sets to last day of previous month
      break;
    }

    case 'currentQuarter': {
      // Start: 1st day of current quarter
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
      startDate = new Date(now.getFullYear(), quarterStartMonth, 1);
      break;
    }

    case 'previousQuarter': {
      // Get current quarter
      const currentQuarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
      // Start: 1st day of previous quarter
      startDate = new Date(now.getFullYear(), currentQuarterStartMonth - 3, 1);
      // End: Last day of previous quarter
      endDate.setFullYear(now.getFullYear(), currentQuarterStartMonth, 0);
      break;
    }

    case 'currentYear': {
      // Start: January 1st of current year
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    }

    case 'previousYear': {
      // Start: January 1st of previous year
      startDate = new Date(now.getFullYear() - 1, 0, 1);
      // End: December 31st of previous year
      endDate.setFullYear(now.getFullYear() - 1, 11, 31);
      break;
    }

    case 'last30Days': {
      // Start: 30 days ago
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
      break;
    }

    case 'last60Days': {
      // Start: 60 days ago
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 60);
      break;
    }

    case 'last90Days': {
      // Start: 90 days ago
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 90);
      break;
    }

    case 'last6Months': {
      // Start: 6 months ago
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 6);
      break;
    }

    case 'last12Months': {
      // Start: 12 months ago
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 12);
      break;
    }

    case 'yearToDate': {
      // Start: January 1st of current year
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    }

    default: {
      // Default to last 30 days
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
    }
  }

  // Reset time to start of day for start date (00:00:00.000)
  startDate.setHours(0, 0, 0, 0);

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };
}
