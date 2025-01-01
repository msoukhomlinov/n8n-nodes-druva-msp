# Technical Specifications for Druva MSP n8n Node

## Development Environment & Standards

### Language & Tools
- **TypeScript**: 
  - Strict type checking enabled via tsconfig.json
  - All source files must be .ts
  - Compile target: ES2019 to match n8n requirements
- **ESLint & Prettier**: 
  - Use n8n's recommended ESLint config
  - Enforce consistent code style via .prettierrc
  - Pre-commit hooks to ensure code quality
- **Node.js**: Target LTS version compatible with n8n

## Node Implementation

### Core Structure
- Extend n8n's `INodeType` and `INodeTypeDescription` interfaces
- Implement required methods:
  - `description()`: Node metadata and UI configuration
  - `execute()`: Main execution logic
- Use n8n's built-in types:
  - `IDataObject` for dynamic data
  - `IExecuteFunctions` for execution context
  - `IHttpRequestOptions` for API calls
  - `INodePropertyOptions` for dropdown menus

### Authentication Implementation
- Create `DruvaMspApi.credentials.ts` (example below):
  ```typescript
  export class DruvaMspApi implements ICredentialType {
    name = 'druvaMspApi';
    displayName = 'Druva MSP API';
    properties = [
      {
        displayName: 'Client ID',
        name: 'clientId',
        type: 'string',
        required: true,
      },
      {
        displayName: 'Client Secret',
        name: 'clientSecret',
        type: 'string',
        required: true,
        typeOptions: {
          password: true,
        },
      },
      {
        displayName: 'Environment',
        name: 'environment',
        type: 'options',
        default: 'production',
        options: [
          {
            name: 'Production',
            value: 'https://apis.druva.com/msp',
          },
          {
            name: 'Custom',
            value: 'custom',
          },
        ],
      }
    ];
  }
  ```

### Entity Types
- Create `types` directory containing:
  - `IDruvaMspCustomer.ts`
  - `IDruvaMspTenant.ts`
  - `IDruvaMspServicePlan.ts`
  - `IDruvaMspAdmin.ts`
  - `IDruvaMspTask.ts`
  - `IDruvaMspEvent.ts`
  - `IDruvaMspReport.ts`
- Each type file should reflect the API response structure

### API Integration
- Implement separate methods for each API endpoint category:
  - Customer Management
  - Tenant Operations
  - Service Plans
  - Admin Management
  - Tasks & Events
  - Reports
- Handle pagination using n8n's built-in helpers (where applicable)

### Pagination Implementation
- Handle two pagination modes:
  1. PageToken-based:
     - Initial request: no pageToken
     - Subsequent requests: use nextPageToken from previous response
     - Maximum record limit: 500
  2. Filter-based:
     - Use pageSize parameter (max 500)
     - Support additional filter parameters
     - Cannot be combined with pageToken

- Implementation example:
  ```typescript
  interface PaginationParams {
    pageToken?: string;
    pageSize?: number;
    filters?: Record<string, any>;
  }

  async function handlePagination(
    params: PaginationParams,
    endpoint: string
  ): Promise<any[]> {
    // Implementation details...
  }
  ```

### Rate Limiting
- Implement exponential backoff
- Handle 429 responses
- Track remaining API quotas

### Error Handling
- Implement comprehensive error handling:
  - API-specific error responses
  - Rate limiting
  - Authentication failures
  - Network issues
- Use n8n's NodeOperationError for consistent error reporting
- Standardized error response format
- Retry strategy for recoverable errors
- Logging requirements

### Documentation Requirements
- Code documentation:
  - JSDoc comments for all methods
  - Type definitions
  - Complex logic explanation
- API reference documentation in docs/
- OpenAPI specifications in docs/druva-msp-api.json