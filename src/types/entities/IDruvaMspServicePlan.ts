export interface IDruvaMspServicePlan {
  id: string;
  name: string;
  description: string;
  features: string[];
  status: string;
  productId?: number;
  limits?: Record<string, unknown>;
} 