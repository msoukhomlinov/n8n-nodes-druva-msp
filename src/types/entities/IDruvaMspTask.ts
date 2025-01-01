export interface IDruvaMspTask {
  id: string;
  type: string;
  status: string;
  progress: number;
  startTime: string;
  endTime: string;
  details: Record<string, unknown>;
  resourceId?: string;
  resourceType?: string;
} 