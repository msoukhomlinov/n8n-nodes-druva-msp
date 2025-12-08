# n8n-nodes-druva-msp

This package provides n8n nodes to integrate with Druva MSP APIs, allowing Managed Service Providers to automate various operations related to customer management, tenant provisioning, reporting, and more.

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-Support-yellow.svg)](https://buymeacoffee.com/msoukhomlinov)

> **IMPORTANT**: When updating between versions, make sure to restart your n8n instance after the update. UI changes and new features are only picked up after a restart.

## Features

The Druva MSP integration provides access to the following key resources:

### Production-Ready Resources

These resources have been fully tested and are ready for production use:

- **Admin Management**
  - List, create, retrieve, update, and delete administrators
  - Manage admin roles and permissions

- **Customer Management**
  - Create and manage MSP customers
  - Update customer details including contact information
  - Generate customer-specific access tokens for API operations
  - List and filter customers with client-side filtering capabilities

- **Consumption Billing Analyzer**
  - Process consumption data with custom calculation methods for billing purposes
  - Apply configurable rounding and byte-value conversion
  - Returns a fully flattened data structure for easy processing in n8n workflows
  - Filter by specific customers, date ranges, and service plans

### Additional Resources (In Development)

The following resources are available but require additional testing before production use:

- **Tenant Management**
  - Create, retrieve, and update tenants
  - Suspend and unsuspend tenant operations

- **Service Plan Management**
  - View available service plans
  - Retrieve detailed service plan information

- **Task Management**
  - Track task status and progress

- **Event Monitoring**
  - Access MSP-level and customer-level events

- **Comprehensive Reporting**
  - Usage Reports (Global Summary, Tenant Consumption, Tenant Quota)
  - Cyber Resilience Reports (Rollback Actions, Data Protection Risk)
  - Endpoint Reports (User metrics, License usage, Backup status, Storage statistics)
  - Hybrid Workloads Reports (Backup activity, DR operations, Resource status)

## Task polling (workflow-level)

The Task resource exposes **Get Task** to check task status. n8n Cloud restricts timers inside community nodes, so waiting/polling must be done at the workflow level:

**Pattern**
1. **Get Task** – fetch the task by `taskId`
2. **IF** – check `status === 4` (Finished)
   - If yes: continue
   - If no: Wait 5–10 seconds
3. Loop back to step 1 until finished

**Status values**
- 1: Queued
- 2: Running
- 3: Failed
- 4: Finished

## Authentication

This node requires Druva MSP API credentials to authenticate:

1. Sign in to your Druva MSP portal
2. Navigate to Settings > API Credentials
3. Create new API credentials (Client ID and Secret Key)
4. Use these credentials in the Druva MSP API credentials in n8n


## License

This project is licensed under the [MIT License](LICENSE.md).

## Support

If you find this node helpful and would like to support its development:

[![Buy Me A Coffee](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://buymeacoffee.com/msoukhomlinov)
