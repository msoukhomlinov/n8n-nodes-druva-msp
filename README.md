# n8n-nodes-druva-msp

This is an n8n community node for interacting with the Druva MSP API. It provides a comprehensive integration with Druva's MSP platform, allowing you to automate various operations including customer management, tenant operations, service plans, admin management, tasks, events, and reporting.

## Prerequisites

- n8n instance (Version 1.0.0 or later)
- Druva MSP account with API access
- API credentials (Client ID and Client Secret)

## Installation

Follow these steps to install the node:

1. Open your n8n instance
2. Go to Settings > Community Nodes
3. Click on "Install Another Node"
4. Enter `n8n-nodes-druva-msp`
5. Click "Install"

## Authentication

This node uses OAuth2 authentication. You'll need to:

1. Obtain Client ID and Client Secret from Druva MSP
2. Configure these credentials in n8n's credentials manager
3. Select "Druva MSP API" when creating a new credential

## Features

### Supported Resources

- Customers
  - List all customers
  - Create a new customer
  - Get customer details
  - Update customer details
  - Generate API access token
- Tenants
  - Create a new tenant
  - Get tenants list
  - Get tenant details
  - Update an existing tenant
  - Suspend a customer tenant
  - Unsuspend a customer tenant
- Service Plans
  - List all service plans
  - Get service plan details
- Admins
  - List all administrators
- Tasks
  - Get task details
- Events
  - List customer level events
  - List MSP level events
- Reports
  - Get global usage report summary
  - Get Itemized Tenant Consumption Report
  - Get Itemized Tenant Quota Report
- Hybrid Workloads Reports
  - Alert History Report
  - Backup Activity Report
  - Resource Status Report
  - Storage Consumption Report
  - DR Replication Activity Report
  - DR Failback Activity Report
  - DR Failover Activity Report
- Endpoints Reports
  - Alert Report
  - Users Report
  - License Usage Report
  - User Provisioning Report
  - User Rollout Report
  - Last Backup Status Report
  - Storage Statistics Report
  - Storage Alerts Report
  - Cloud Cache Statistics Report
- Cyber Resilience Reports
  - Rollback Actions Report
  - Data Protection Risk Report

### Pagination

The node handles pagination automatically with two options:

1. **Retrieve All Records**
   - Toggle option to retrieve all available records
   - Automatically handles pagination in the background
   - Uses maximum page size (500) for efficiency

2. **Maximum Records**
   - Specify maximum number of records to retrieve
   - Automatically handles pagination if records > 500
   - Only visible when "Retrieve All" is disabled

## Usage Examples

### Get All Customers

```json
{
  "node": "Druva MSP",
  "resource": "customer",
  "operation": "list",
  "parameters": {
    "filters": {
      "retrieveAll": true
    }
  }
}
```

### Get Limited Number of Customers

```json
{
  "node": "Druva MSP",
  "resource": "customer",
  "operation": "list",
  "parameters": {
    "filters": {
      "retrieveAll": false,
      "maxRecords": 1000
    }
  }
}
```

### Create a Tenant

```json
{
  "node": "Druva MSP",
  "resource": "tenant",
  "operation": "create",
  "parameters": {
    "additionalFields": {
      "name": "New Tenant",
      "customerId": "customer123",
      "servicePlanId": "plan456",
      "region": "us-east-1",
      "productId": 1
    }
  }
}
```

## Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the node:
   ```bash
   npm run build
   ```
4. Link to your n8n installation:
   ```bash
   npm link
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Resources

- [Druva MSP API Documentation](https://help.druva.com/en/articles/8805729-integration-with-druva-msp-apis)
- [n8n Community Nodes Documentation](https://docs.n8n.io/integrations/creating-nodes/)
