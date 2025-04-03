# Changelog

All notable changes to the n8n-nodes-druva-msp package will be documented in this file.

## [0.1.0] - 2025-03-31

### Added

#### Completed and Production-Ready Resources

The following resources have been fully implemented, tested, and are ready for production use:

- **Admin Resource**
  - List Admins - Get a list of all administrators
  - Get Admin - Retrieve details for a specific administrator by ID
  - Create Admin - Create a new administrator
  - Update Admin - Update details for an existing administrator
  - Delete Admin - Remove an administrator

- **Customer Resource**
  - Create - Create a new MSP customer account
  - Get - Retrieve details for a specific customer
  - Get Many - Retrieve a list of customers
  - Get Token - Generate a customer-specific API token
  - Update - Update details of an existing customer

- **Event Resource**
  - Get Many MSP Events - Retrieve events at the MSP level
  - Get Many Customer Events - Retrieve events for a specific customer

- **Tenant Resource**
  - Get - Retrieve details for a specific tenant
  - Get Many - Retrieve a list of tenants
  - Suspend - Suspend a tenant
  - Unsuspend - Unsuspend a tenant

- **Service Plan Resource**
  - Get - Retrieve details for a specific service plan
  - Get Many - Retrieve a list of service plans with filtering by status, name, editions, and features

- **Task Resource**
  - Get - Retrieve details for a specific task

#### In Development Resources

The following resources are implemented but require additional testing:

- **Report Resources**
  - **Usage Reports**
    - Global Usage Summary - Retrieve global usage data across all customers
    - Tenant Consumption - Retrieve tenant consumption data
    - Tenant Quota - Retrieve tenant quota information

  - **Cyber Resilience Reports**
    - Rollback Actions - Retrieve data on rollback actions
    - Data Protection Risk - Retrieve data protection risk information

  - **Endpoint Reports**
    - Users - Retrieve endpoint user information
    - User Rollout - Retrieve user rollout statistics
    - User Provisioning - Retrieve user provisioning information
    - License Usage - Retrieve license usage statistics
    - Last Backup Status - Retrieve information on last backup statuses
    - Alerts - Retrieve endpoint alert information
    - Storage Statistics - Retrieve storage statistics
    - Storage Alert - Retrieve storage alert information
    - Cloud Cache Statistics - Retrieve cloud cache statistics

  - **Hybrid Workloads Reports**
    - Backup Activity - Retrieve backup activity information
    - Consumption by Backup Set - Retrieve consumption data by backup set
    - DR Failback Activity - Retrieve disaster recovery failback information
    - DR Failover Activity - Retrieve disaster recovery failover information
    - DR Replication Activity - Retrieve disaster recovery replication information
    - Resource Status - Retrieve resource status information
    - Alert History - Retrieve alert history information

### Fixed

- Fixed issue with Customer Token generation API requiring form-urlencoded content type
- Sorted Customer operations alphabetically for better usability
- Fixed pagination issue with MSP Events List where the Druva API exhibits unusual behavior - first page returns many items (400+) but subsequent pages return only 1 item. Updated pagination logic to handle this scenario correctly by:
  - Implementing the API's requirement that when using `pageToken`, no other query parameters should be present
  - Adding safeguards against infinite loops by tracking previously seen page tokens
  - Adding detailed logging to monitor pagination behavior
  - Improving cursor-based pagination implementation to respect API design
- Updated Tenant filtering to use a single Customer ID as per API documentation, which only supports filtering by one customer at a time
- Fixed Tenant filtering query parameter name from 'customerId' to 'customerIds' to match the API's expected parameter name
- Fixed Tenant suspend and unsuspend operations to correctly use the customer ID in the API endpoint path, resolving authentication issues when performing these operations

### Changed

- Implemented proper pagination handling for all list endpoints
- Added consistent error handling and logging across all API calls
- Renamed Events operations from 'listMsp' and 'listCustomer' to 'getManyMspEvents' and 'getManyCustomerEvents' for consistency with n8n naming conventions
- Enhanced Customer picklist implementation with alphabetical sorting and improved display names
- Improved error handling and removed excessive debug logging across option loaders
- Next focus area: Complete implementation and testing of the Tenant resource
- Renamed Tenant operation from 'list' to 'getMany' for consistency with n8n naming conventions
- Updated Tenant filtering to use a single customer ID dropdown with dynamic loading of customer options
- Added ApiValueConverters utility with functions to convert numeric API values to human-readable labels:
  - Tenant status codes (0-5) are now displayed with descriptive names (e.g., "Ready", "Suspended")
  - Tenant type codes (1-3) are now displayed with descriptive names (e.g., "Sandbox", "Commercial")
  - Product ID codes (1-2) are now displayed with descriptive names (e.g., "Hybrid Workloads")
  - API responses are automatically enriched with human-readable labels while preserving original values
- Added post-processing filter options for Tenant status and Tenant type in the Get Many operation, allowing users to filter results by these fields using friendly picklists
- Removed complex Tenant operations (Create, Update) due to API complexity and undocumented requirements, focusing on stable read operations (Get, Get Many) and basic write operations (Suspend, Unsuspend) instead
- Next focus area: Implementation and testing of the various Reporting resources
- Renamed Service Plan operation from 'List' to 'Get Many' for consistency with n8n naming conventions
- Enhanced Service Plan responses with human-readable status labels, converting numeric status codes to descriptive text (e.g., 0 → "Updating", 1 → "Ready")
- Added post-API filtering options to Service Plan Get Many operation, allowing users to filter results by editions (Business, Enterprise, Elite) and features (Hybrid Workloads, Microsoft 365, etc.)
- Extended Service Plan filtering capabilities with Status filter (Ready, Updating) and Name contains filter (case-insensitive text search)
- Improved consistency by using shared constants for all status options throughout the codebase
- Applied alphabetical sorting to Service Plan filter options for better usability
- Completed full implementation and testing of the Service Plan resource, including advanced filtering options
- Next focus area: Implementation and testing of the Report Resources for usage tracking, cyber resilience, endpoints, and hybrid workloads

## Notes

This initial release focuses on establishing the core infrastructure for Druva MSP API integration. The Admin, Customer, and Event resources have been thoroughly tested and are considered production-ready. The remaining resources require additional testing before being used in production environments. 
