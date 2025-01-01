export interface IEndpointsReport {
  users: IEndpointsUserReport[];
  licenseUsage: IEndpointsLicenseUsageReport[];
  userProvisioning: IEndpointsUserProvisioningReport[];
  userRollout: IEndpointsUserRolloutReport[];
  lastBackupStatus: IEndpointsLastBackupStatusReport[];
}

export interface IEndpointsUserReport {
  customerId: string;
  customerName: string;
  addedUsers: number;
  deletedUsers: number;
  preservedUsers: number;
  period: string;
}

export interface IEndpointsLicenseUsageReport {
  customerId: string;
  customerName: string;
  totalUsers: number;
  activeUsers: number;
  preservedUsers: number;
  allocatedLicenses: number;
}

export interface IEndpointsUserProvisioningReport {
  customerId: string;
  customerName: string;
  userId: string;
  email: string;
  status: string;
  provisionedDate: string;
}

export interface IEndpointsUserRolloutReport {
  customerId: string;
  customerName: string;
  deviceId: string;
  deviceName: string;
  activationDate: string;
  firstBackupStatus: string;
}

export interface IEndpointsLastBackupStatusReport {
  customerId: string;
  customerName: string;
  deviceId: string;
  deviceName: string;
  lastBackupDate: string;
  backupStatus: string;
  dataSize: number;
} 