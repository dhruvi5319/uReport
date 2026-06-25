import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ticketsApi } from '@/api/tickets';
import { usePermission } from '@/hooks/usePermission';
import TicketStatusBadge from '@/components/tickets/TicketStatusBadge';
import TicketHistoryList from '@/components/tickets/TicketHistoryList';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorBanner from '@/components/common/ErrorBanner';
import type { Ticket, TicketHistoryEntry } from '@/types/ticket';

const TicketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const ticketId = Number(id);
  const isStaff = usePermission('staff');

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [history, setHistory] = useState<TicketHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!ticketId) return;
    setLoading(true);
    Promise.all([ticketsApi.getById(ticketId), ticketsApi.getHistory(ticketId)])
      .then(([t, h]) => { setTicket(t); setHistory(h); })
      .catch(err => {
        const msg = (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data;
        setError(msg?.message ?? msg?.error ?? 'Failed to load ticket.');
      })
      .finally(() => setLoading(false));
  }, [ticketId]);

  const handleReopen = async () => {
    if (!ticket) return;
    setActionLoading(true);
    try {
      const updated = await ticketsApi.reopen(ticket.id);
      setTicket(updated);
      const h = await ticketsApi.getHistory(ticket.id);
      setHistory(h);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data;
      setError(msg?.message ?? 'Reopen failed.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/tickets" style={{ color: '#1a73e8', textDecoration: 'none', fontSize: '0.9rem' }}>← Back to Tickets</Link>
      </div>

      <ErrorBanner error={error} />

      {ticket && (
        <>
          <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 6, padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <h1 style={{ margin: 0, fontSize: '1.3rem' }}>Ticket #{ticket.id}</h1>
              <TicketStatusBadge status={ticket.status} substatus={ticket.substatusName} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.9rem' }}>
              <div><strong>Category:</strong> {ticket.categoryName ?? ticket.categoryId}</div>
              <div><strong>Assigned To:</strong> {ticket.assignedPersonName ?? '—'}</div>
              <div><strong>Location:</strong> {[ticket.location, ticket.city, ticket.state, ticket.zip].filter(Boolean).join(', ') || '—'}</div>
              <div><strong>Contact Method:</strong> {ticket.contactMethodName ?? '—'}</div>
              <div><strong>Entered:</strong> {new Date(ticket.enteredDate).toLocaleString()}</div>
              <div><strong>Last Modified:</strong> {new Date(ticket.lastModified).toLocaleString()}</div>
              {ticket.closedDate && <div><strong>Closed:</strong> {new Date(ticket.closedDate).toLocaleString()}</div>}
            </div>

            <div style={{ marginTop: '1rem' }}>
              <strong>Description:</strong>
              <p style={{ marginTop: '0.4rem', background: '#f8f9fa', borderRadius: 4, padding: '0.75rem', whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
                {ticket.description}
              </p>
            </div>

            {/* Staff action buttons */}
            {isStaff && (
              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                {ticket.status === 'closed' && (
                  <button onClick={handleReopen} disabled={actionLoading}
                    style={{ padding: '0.4rem 1rem', background: '#2e7d32', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 500 }}>
                    Reopen
                  </button>
                )}
                {/* Close and Assign buttons would require substatus selector / person picker;
                    Wire them in Wave 3b when admin data (substatus list) is available */}
              </div>
            )}
          </div>

          <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 6, padding: '1.5rem' }}>
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>History</h2>
            <TicketHistoryList entries={history} />
          </div>
        </>
      )}
    </div>
  );
};
export default TicketDetailPage;
