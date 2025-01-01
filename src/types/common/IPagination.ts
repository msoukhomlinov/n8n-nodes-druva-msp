export interface IPaginationResponse<T> {
  items: T[];
  nextPageToken?: string;
  totalCount?: number;
}

export interface IReportFilters {
  pageSize?: number;
  pageToken?: string;
  startDate?: string;
  endDate?: string;
  customerIds?: string[];
  productId?: number;
} 