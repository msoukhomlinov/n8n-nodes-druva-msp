export interface IDruvaMspCustomer {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  address?: string;
  phone?: string;
  type?: string;
}

/**
 * Response type for the Generate API Token operation
 */
export interface IDruvaMspCustomerToken {
  /**
   * The generated API access token
   */
  token: string;
  
  /**
   * Token expiration timestamp
   */
  expiresAt: string;
  
  /**
   * Customer ID associated with the token
   */
  customerId: string;
} 