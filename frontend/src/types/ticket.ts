export type TicketStatus = 'open' | 'closed';

export interface Ticket {
  id: number;
  ticketId: string;              // display ID, e.g. "2024-001"
  enteredDate: string;           // ISO 8601
  categoryName: string;
  categoryId: number;
  departmentName: string;
  departmentId: number;
  assigneeName?: string;
  assignedPersonId?: number;
  reporterName?: string;
  reporterEmail?: string;
  status: TicketStatus;
  substatus?: string;
  substatusId?: number;
  description?: string;
  location?: string;
  lat?: number;
  lon?: number;
  slaDays?: number;
  isOverdue?: boolean;
  slaDueDate?: string;
  issueType?: string;
  issueTypeId?: number;
  contactMethod?: string;
  contactMethodId?: number;
}

export interface TicketSummary {
  id: number;
  ticketId: string;
  categoryName: string;
  reporterName?: string;
  status: TicketStatus;
  substatus?: string;
  enteredDate: string;
}

export interface FilterState {
  q?: string;
  status?: TicketStatus;
  substatusId?: string;
  categoryId?: string;
  departmentId?: string;
  assignedPersonId?: string;
  issueTypeId?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface PaginatedTickets {
  items: Ticket[];
  total: number;
  page: number;
  pageSize: number;
}
