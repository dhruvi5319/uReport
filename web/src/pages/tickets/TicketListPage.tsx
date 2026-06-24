import React, { useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ticketsApi } from '@/api/tickets';
import { useTicketStore } from '@/store/ticketStore';
import { usePermission } from '@/hooks/usePermission';
import TicketSearchFilters from '@/components/tickets/TicketSearchFilters';
import TicketStatusBadge from '@/components/tickets/TicketStatusBadge';
import Pagination from '@/components/common/Pagination';
import ErrorBanner from '@/components/common/ErrorBanner';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import type { TicketSearchParams } from '@/types/ticket';

const TicketListPage: React.FC = () => {
  const { result, filters, loading, error, setResult, setFilters, setLoading, setError } = useTicketStore();
  const isStaff = usePermission('staff');

  const fetchTickets = useCallback(async (params: TicketSearchParams) => {
    setLoading(true);
    setError(null);
    try {
      const data = await ticketsApi.search(params);
      setResult(data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data;
      setError(msg?.message ?? msg?.error ?? 'Failed to load tickets.');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setResult]);

  useEffect(() => { fetchTickets(filters); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilterChange = (newFilters: TicketSearchParams) => {
    setFilters(newFilters);
    fetchTickets(newFilters);
  };

  const handlePageChange = (page: number) => {
    const updated = { ...filters, page };
    setFilters(updated);
    fetchTickets(updated);
  };

  const handleCsvExport = () => {
    window.location.href = ticketsApi.buildExportUrl(filters, 'csv');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.4rem' }}>Tickets</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {isStaff && (
            <button onClick={handleCsvExport}
              style={{ padding: '0.4rem 1rem', background: '#fff', border: '1px solid #1a73e8', color: '#1a73e8', borderRadius: 4, cursor: 'pointer', fontWeight: 500 }}>
              Export CSV
            </button>
          )}
          {isStaff && (
            <Link to="/tickets/new"
              style={{ padding: '0.4rem 1rem', background: '#1a73e8', color: '#fff', borderRadius: 4, textDecoration: 'none', fontWeight: 500 }}>
              New Ticket
            </Link>
          )}
        </div>
      </div>

      <TicketSearchFilters filters={filters} onFilterChange={handleFilterChange} />

      <ErrorBanner error={error} />

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 6, overflow: 'hidden' }}>
            {(!result?.content?.length) ? (
              <p style={{ padding: '1.5rem', color: '#666', textAlign: 'center' }}>No tickets found.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #e0e0e0' }}>
                    {['ID', 'Status', 'Category', 'Description', 'Location', 'Entered', 'Assigned To'].map(h => (
                      <th key={h} style={{ padding: '0.6rem 1rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.content.map(ticket => (
                    <tr key={ticket.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '0.6rem 1rem' }}>
                        <Link to={`/tickets/${ticket.id}`} style={{ color: '#1a73e8', fontWeight: 500 }}>#{ticket.id}</Link>
                      </td>
                      <td style={{ padding: '0.6rem 1rem' }}>
                        <TicketStatusBadge status={ticket.status} substatus={ticket.substatusName} />
                      </td>
                      <td style={{ padding: '0.6rem 1rem', fontSize: '0.9rem' }}>{ticket.categoryName ?? ticket.categoryId}</td>
                      <td style={{ padding: '0.6rem 1rem', fontSize: '0.9rem', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ticket.description}
                      </td>
                      <td style={{ padding: '0.6rem 1rem', fontSize: '0.9rem' }}>{[ticket.location, ticket.city].filter(Boolean).join(', ')}</td>
                      <td style={{ padding: '0.6rem 1rem', fontSize: '0.85rem', color: '#555' }}>
                        {new Date(ticket.enteredDate).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }}>{ticket.assignedPersonName ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {result && result.totalPages > 1 && (
            <Pagination
              page={result.page}
              totalPages={result.totalPages}
              onPageChange={handlePageChange}
            />
          )}

          {result && (
            <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
              {result.totalElements} ticket{result.totalElements !== 1 ? 's' : ''} found
            </p>
          )}
        </>
      )}
    </div>
  );
};
export default TicketListPage;
