export interface Ticket {
  id: number;
  status: 'open' | 'closed';
  substatusName?: string;
  categoryId: number;
  categoryName?: string;
  description: string;
  location?: string;
  city?: string;
  state?: string;
  zip?: string;
  latitude?: number;
  longitude?: number;
  enteredDate: string;
  lastModified: string;
  closedDate?: string;
  assignedPersonId?: number;
  assignedPersonName?: string;
  reportedByPersonId?: number;
  contactMethodName?: string;
  mediaCount?: number;
  customFields?: Record<string, unknown>;
}

export interface TicketSearchParams {
  q?: string;
  status?: string;
  categoryId?: number;
  departmentId?: number;
  assignedPersonId?: number;
  enteredByPersonId?: number;
  substatusId?: number;
  contactMethodId?: number;
  issueTypeId?: number;
  enteredDateFrom?: string;
  enteredDateTo?: string;
  closedDateFrom?: string;
  closedDateTo?: string;
  city?: string;
  zip?: string;
  lat?: number;
  lon?: number;
  radius?: number;
  page?: number;
  limit?: number;
}

export interface TicketHistoryEntry {
  id: number;
  actionName: string;
  renderedDescription: string;
  enteredByPersonName?: string;
  actionPersonName?: string;
  enteredDate: string;
  notes?: string;
  sentNotifications?: string;
}

export interface PagedResult<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}
