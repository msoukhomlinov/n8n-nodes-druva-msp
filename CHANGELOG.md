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

#### In Development Resources

The following resources are implemented but require additional testing:

- **Event Resource**
  - List MSP Events - Retrieve events at the MSP level
  - List Customer Events - Retrieve events for a specific customer

- **Tenant Resource**
  - Create - Create a new tenant for a customer
  - Get - Retrieve details for a specific tenant
  - Get Many - Retrieve a list of tenants
  - Update - Update details of an existing tenant
  - Suspend - Suspend a tenant
  - Unsuspend - Unsuspend a tenant

- **Service Plan Resource**
  - Get - Retrieve details for a specific service plan
  - Get Many - Retrieve a list of service plans

- **Task Resource**
  - Get - Retrieve details for a specific task

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
  - Increasing tolerance for consecutive single-item pages

### Changed

- Implemented proper pagination handling for all list endpoints
- Added consistent error handling and logging across all API calls

## Notes

This initial release focuses on establishing the core infrastructure for Druva MSP API integration. Only the Admin and Customer resources have been thoroughly tested and are considered production-ready. The remaining resources require additional testing before being used in production environments. 
