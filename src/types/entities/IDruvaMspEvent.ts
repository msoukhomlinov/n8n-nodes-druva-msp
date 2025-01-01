export interface IDruvaMspEvent {
  id: string;
  type: string;
  severity: string;
  timestamp: string;
  details: Record<string, unknown>;
  category?: string;
  feature?: string;
  globalID?: string;
  syslogFacility?: number;
  syslogSeverity?: number;
} 