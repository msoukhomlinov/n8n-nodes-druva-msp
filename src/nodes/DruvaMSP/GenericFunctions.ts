// Generic helper functions for Druva MSP API calls, authentication, pagination, etc.
// This file has been refactored to import functions from smaller, more focused files

// Import everything from the new helper files
import { getDruvaMspAccessToken } from './helpers/AuthHelpers';
import { druvaMspApiRequest } from './helpers/ApiRequestHelpers';
import {
  PaginationHelper,
  druvaMspApiRequestAllItems,
  druvaMspApiRequestAllItemsForOptions,
  druvaMspApiRequestAllReportItems,
  druvaMspApiRequestAllReportV2Items,
  druvaMspApiRequestAllPagedItems,
} from './helpers/PaginationHelpers';
import { getTenantCustomerId } from './helpers/EntityHelpers';
import { waitForTaskCompletion } from './helpers/TaskHelpers';

// Re-export everything
export {
  // Authentication
  getDruvaMspAccessToken,

  // API Request
  druvaMspApiRequest,

  // Pagination
  PaginationHelper,
  druvaMspApiRequestAllItems,
  druvaMspApiRequestAllItemsForOptions,
  druvaMspApiRequestAllReportItems,
  druvaMspApiRequestAllReportV2Items,
  druvaMspApiRequestAllPagedItems,

  // Entity helpers
  getTenantCustomerId,

  // Task helpers
  waitForTaskCompletion,
};
