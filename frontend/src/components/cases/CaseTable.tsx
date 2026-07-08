import { useNavigate, Link } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, ArrowUp, ArrowDown, Eye } from 'lucide-react';
import type { Ticket, TicketStatus } from '@/types/ticket';

interface CaseTableProps {
  tickets: Ticket[];
  loading: boolean;
  selectedIds: Set<number>;
  onSelectionChange: (ids: Set<number>) => void;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  onSort: (col: string, dir: 'asc' | 'desc') => void;
}

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'open' | 'resolved' | 'duplicate' | 'bogus';

function getStatusBadgeVariant(status: TicketStatus, substatus?: string): BadgeVariant {
  if (status === 'open') return 'open';
  // closed statuses
  const sub = substatus?.toLowerCase();
  if (sub === 'resolved') return 'resolved';
  if (sub === 'duplicate') return 'duplicate';
  if (sub === 'bogus') return 'bogus';
  return 'secondary';
}

interface SortableHeaderProps {
  col: string;
  label: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  onSort: (col: string, dir: 'asc' | 'desc') => void;
}

function SortableHeader({ col, label, sortBy, sortDir, onSort }: SortableHeaderProps) {
  const isActive = sortBy === col;
  const nextDir = isActive && sortDir === 'asc' ? 'desc' : 'asc';

  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 data-[state=active]:font-bold"
      data-state={isActive ? 'active' : undefined}
      onClick={() => onSort(col, nextDir)}
      aria-label={`Sort by ${label} ${nextDir === 'asc' ? 'ascending' : 'descending'}`}
    >
      {label}
      {isActive ? (
        sortDir === 'asc' ? (
          <ArrowUp className="ml-1 h-3 w-3" />
        ) : (
          <ArrowDown className="ml-1 h-3 w-3" />
        )
      ) : (
        <ArrowUpDown className="ml-1 h-3 w-3 opacity-40" />
      )}
    </Button>
  );
}

const SKELETON_ROW_COUNT = 5;

export function CaseTable({
  tickets,
  loading,
  selectedIds,
  onSelectionChange,
  sortBy,
  sortDir,
  onSort,
}: CaseTableProps) {
  const navigate = useNavigate();

  const allSelected = tickets.length > 0 && selectedIds.size === tickets.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < tickets.length;

  function toggleAll() {
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(tickets.map(t => t.id)));
    }
  }

  function toggleRow(id: number) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">
            <Checkbox
              checked={someSelected ? 'indeterminate' : allSelected}
              onCheckedChange={toggleAll}
              aria-label="Select all rows"
            />
          </TableHead>
          <TableHead>
            <SortableHeader col="ticketId" label="ID" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
          </TableHead>
          <TableHead>
            <SortableHeader col="enteredDate" label="Date" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
          </TableHead>
          <TableHead>
            <SortableHeader col="categoryName" label="Category" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
          </TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Assignee</TableHead>
          <TableHead>
            <SortableHeader col="status" label="Status" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
          </TableHead>
          <TableHead className="w-10">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          Array.from({ length: SKELETON_ROW_COUNT }).map((_, i) => (
            <TableRow key={`skeleton-${i}`} data-testid="table-skeleton-row">
              {Array.from({ length: 8 }).map((_, j) => (
                <TableCell key={j}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          tickets.map(ticket => (
            <TableRow
              key={ticket.id}
              className="cursor-pointer"
              data-state={selectedIds.has(ticket.id) ? 'selected' : undefined}
              onClick={() => navigate('/cases/' + ticket.id)}
            >
              <TableCell onClick={e => e.stopPropagation()}>
                <Checkbox
                  checked={selectedIds.has(ticket.id)}
                  onCheckedChange={() => toggleRow(ticket.id)}
                  aria-label={`Select case ${ticket.ticketId}`}
                />
              </TableCell>
              <TableCell className="font-mono text-xs">{ticket.ticketId}</TableCell>
              <TableCell>{new Date(ticket.enteredDate).toLocaleDateString()}</TableCell>
              <TableCell>{ticket.categoryName}</TableCell>
              <TableCell>{ticket.departmentName}</TableCell>
              <TableCell>{ticket.assigneeName ?? '—'}</TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(ticket.status, ticket.substatus)}>
                  {ticket.substatus ?? ticket.status}
                </Badge>
              </TableCell>
              <TableCell onClick={e => e.stopPropagation()}>
                <Link
                  to={'/cases/' + ticket.id}
                  aria-label={`View case ${ticket.ticketId}`}
                  className="inline-flex items-center justify-center"
                  onClick={e => e.stopPropagation()}
                >
                  <Eye className="h-4 w-4" />
                </Link>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
