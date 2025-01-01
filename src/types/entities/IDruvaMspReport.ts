export interface IDruvaMspReport {
  id: string;
  name: string;
  type: string;
  format: string;
  generatedAt: string;
  url: string;
  filters?: Record<string, unknown>;
  status?: string;
  size?: number;
} 