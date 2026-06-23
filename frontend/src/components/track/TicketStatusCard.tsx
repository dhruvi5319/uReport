'use client';

interface TicketStatusCardProps {
  ticket: {
    id: number;
    title: string;
    categoryName?: string;
    status: string;
    substatusLabel?: string;
    departmentName?: string;
    datetimeUpdated: string;
    address?: string;
  };
}

export default function TicketStatusCard({ ticket }: TicketStatusCardProps) {
  const statusColor =
    ticket.status === 'open'
      ? 'text-blue-600 bg-blue-50'
      : 'text-gray-600 bg-gray-100';

  return (
    <div className="rounded-lg border p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <h1 className="text-lg font-semibold leading-tight">Report #{ticket.id}</h1>
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${statusColor}`}
        >
          {ticket.status}
        </span>
      </div>

      {ticket.categoryName && (
        <p className="text-sm font-medium">{ticket.categoryName}</p>
      )}

      {ticket.substatusLabel && (
        <p className="text-sm text-muted-foreground">{ticket.substatusLabel}</p>
      )}

      <dl className="text-sm grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        {ticket.departmentName && (
          <>
            <dt className="text-muted-foreground">Department</dt>
            <dd>{ticket.departmentName}</dd>
          </>
        )}
        {ticket.address && (
          <>
            <dt className="text-muted-foreground">Location</dt>
            <dd>{ticket.address}</dd>
          </>
        )}
        <dt className="text-muted-foreground">Last updated</dt>
        <dd>{new Date(ticket.datetimeUpdated).toLocaleString()}</dd>
      </dl>
    </div>
  );
}
