// frontend/src/app/(staff)/tickets/components/TicketResultsList.test.tsx
import { render, screen } from '@testing-library/react';
import { TicketResultsList } from './TicketResultsList';

const mockTickets = [
  {
    id: 101,
    title: 'Pothole on Oak Ave',
    status: 'open' as const,
    substatusId: null,
    categoryId: 3,
    departmentId: 1,
    assigneeId: 5,
    reporterName: 'Priya Nair',
    reporterEmail: 'priya@example.com',
    address: 'Oak Ave @ Main St',
    lat: 40.7128,
    lng: -74.006,
    datetimeOpened: '2026-06-01T10:00:00Z',
    datetimeClosed: null,
    datetimeUpdated: null,
    mergedIntoTicketId: null,
    slaStatus: 'breach' as const,
  },
];

describe('TicketResultsList', () => {
  it('renders ticket rows with id and title', () => {
    render(
      <TicketResultsList
        tickets={mockTickets}
        isLoading={false}
        meta={{ total: 1, page: 1, pages: 1 }}
        onPageChange={jest.fn()}
      />,
    );
    expect(screen.getByText(/#101 Pothole on Oak Ave/)).toBeInTheDocument();
  });

  it('shows SLA breach badge when slaStatus=breach', () => {
    render(
      <TicketResultsList
        tickets={mockTickets}
        isLoading={false}
        meta={{ total: 1, page: 1, pages: 1 }}
        onPageChange={jest.fn()}
      />,
    );
    expect(screen.getByLabelText(/SLA status: breach/i)).toBeInTheDocument();
  });

  it('renders skeleton when isLoading=true', () => {
    render(
      <TicketResultsList
        tickets={[]}
        isLoading={true}
        meta={null}
        onPageChange={jest.fn()}
      />,
    );
    expect(screen.getByLabelText(/loading tickets/i)).toBeInTheDocument();
  });

  it('shows empty state when no tickets', () => {
    render(
      <TicketResultsList
        tickets={[]}
        isLoading={false}
        meta={{ total: 0, page: 1, pages: 0 }}
        onPageChange={jest.fn()}
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent(/no tickets match/i);
  });
});
