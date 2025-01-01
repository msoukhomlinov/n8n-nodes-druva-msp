export interface IDruvaMspTenant {
  id: string;
  name: string;
  status: string;
  customerId: string;
  servicePlanId: string;
  createdAt: string;
  updatedAt: string;
  productId?: number;
  region?: string;
  settings?: Record<string, unknown>;
} 