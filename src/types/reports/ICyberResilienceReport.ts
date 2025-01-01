export interface ICyberResilienceReport {
  dataProtectionRisk: IDataProtectionRiskReport[];
}

export interface IDataProtectionRiskReport {
  customerId: string;
  customerName: string;
  agentId: string;
  agentName: string;
  connectionStatus: string;
  lastConnectionTime: string;
  riskLevel: string;
} 