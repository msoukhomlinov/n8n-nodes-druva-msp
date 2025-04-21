# n8n-nodes-druva-msp

This package provides n8n nodes to integrate with Druva MSP APIs, allowing Managed Service Providers to automate various operations related to customer management, tenant provisioning, reporting, and more.

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

## Authentication

This node requires Druva MSP API credentials to authenticate:

1. Sign in to your Druva MSP portal
2. Navigate to Settings > API Credentials
3. Create new API credentials (Client ID and Secret Key)
4. Use these credentials in the Druva MSP API credentials in n8n

## Usage Examples

### Create a New Customer

Automate customer onboarding by creating a new customer account:

1. Add a Druva MSP node
2. Select "Customer" as the Resource
3. Select "Create" as the Operation
4. Fill required fields: Customer Name, Phone Number, Address
5. Optionally add Tenant Admins

### Generate Customer Token

Generate a customer-specific token for delegated API access:

1. Add a Druva MSP node
2. Select "Customer" as the Resource
3. Select "Get Token" as the Operation
4. Provide the Customer ID
5. Execute to receive a customer-specific access token

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for details on all releases and updates.

## License

This project is licensed under the [MIT License](LICENSE.md).
