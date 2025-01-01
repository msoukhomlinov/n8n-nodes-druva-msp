export interface IDruvaMspAdmin {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  phone?: string;
  lastLogin?: string;
  creatorAdminId?: number;
  isActive?: boolean;
} 