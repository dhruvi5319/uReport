import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { CaseListPage } from '@/pages/CaseListPage';
import { server } from './setup/server';
import { http, HttpResponse } from 'msw';
import type { Ticket } from '@/types/ticket';

// Vitest lifecycle
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const mockTickets: Ticket[] = [
  {
    id: 1,
    ticketId: '2024-001',
    categoryName: 'Pothole',
    categoryId: 1,
    departmentName: 'Public Works',
    departmentId: 1,
    status: 'open',
    reporterName: 'Jane Doe',
    enteredDate: new Date().toISOString(),
  },
  {
    id: 2,
    ticketId: '2024-002',
    categoryName: 'Graffiti',
    categoryId: 2,
    departmentName: 'Public Works',
    departmentId: 1,
    status: 'closed',
    substatus: 'Resolved',
    reporterName: 'John Smith',
    enteredDate: new Date().toISOString(),
  },
  {
    id: 3,
    ticketId: '2024-003',
    categoryName: 'Street Light',
    categoryId: 3,
    departmentName: 'Utilities',
    departmentId: 2,
    status: 'open',
    reporterName: 'Alice Brown',
    enteredDate: new Date().toISOString(),
  },
  {
    id: 4,
    ticketId: '2024-004',
    categoryName: 'Noise',
    categoryId: 4,
    departmentName: 'Enforcement',
    departmentId: 3,
    status: 'closed',
    substatus: 'Bogus',
    reporterName: 'Bob Wilson',
    enteredDate: new Date().toISOString(),
  },
  {
    id: 5,
    ticketId: '2024-005',
    categoryName: 'Litter',
    categoryId: 5,
    departmentName: 'Parks',
    departmentId: 4,
    status: 'open',
    reporterName: 'Carol Davis',
    enteredDate: new Date().toISOString(),
  },
];

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
    },
  });
}

function renderCaseList(
  qc: QueryClient,
  initialUrl: string = '/'
) {
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[initialUrl]}>
        <Routes>
          <Route path="*" element={<CaseListPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

test('renders ticket table with correct columns', async () => {
  server.use(
    http.get('/api/tickets', () =>
      HttpResponse.json({
        items: mockTickets,
        total: 5,
        page: 1,
        pageSize: 25,
      })
    )
  );

  const qc = makeQueryClient();
  renderCaseList(qc);

  // Column headers should be visible
  await waitFor(() => {
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Department')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  // Ticket data should render
  await waitFor(() => {
    expect(screen.getByText('2024-001')).toBeInTheDocument();
  });
});

test('skeleton shows 5 rows during loading', async () => {
  server.use(
    http.get('/api/tickets', async () => {
      // Delay response so skeleton is visible
      await new Promise(r => setTimeout(r, 200));
      return HttpResponse.json({
        items: [],
        total: 0,
        page: 1,
        pageSize: 25,
      });
    })
  );

  const qc = makeQueryClient();
  renderCaseList(qc);

  // Skeleton rows should show immediately while loading
  const skeletonRows = screen.getAllByTestId('table-skeleton-row');
  expect(skeletonRows).toHaveLength(5);
});

test('search input debounces before firing query', async () => {
  let callCount = 0;
  server.use(
    http.get('/api/tickets', () => {
      callCount++;
      return HttpResponse.json({
        items: [],
        total: 0,
        page: 1,
        pageSize: 25,
      });
    })
  );

  const qc = makeQueryClient();
  renderCaseList(qc);

  // Wait for initial load
  await waitFor(() => expect(callCount).toBeGreaterThanOrEqual(1));
  const initialCount = callCount;

  const input = screen.getByRole('searchbox');

  // Type rapidly (3 chars) — should NOT trigger 3 separate API calls immediately
  await userEvent.type(input, 'pot');

  // After debounce, only 1 more call (not 3)
  await waitFor(
    () => expect(callCount).toBeLessThanOrEqual(initialCount + 1),
    { timeout: 500 }
  );
});

test('filter chips appear when filter is active', async () => {
  server.use(
    http.get('/api/tickets', () =>
      HttpResponse.json({
        items: mockTickets,
        total: 5,
        page: 1,
        pageSize: 25,
      })
    )
  );

  const qc = makeQueryClient();

  // Render with status=open filter pre-set in URL
  renderCaseList(qc, '/?status=open');

  await waitFor(() => {
    expect(screen.getByText('Status: open')).toBeInTheDocument();
  });
});

test('bulk action bar slides in when rows are selected', async () => {
  server.use(
    http.get('/api/tickets', () =>
      HttpResponse.json({
        items: mockTickets,
        total: 5,
        page: 1,
        pageSize: 25,
      })
    )
  );

  const qc = makeQueryClient();
  renderCaseList(qc);

  // Wait for tickets to load
  await waitFor(() => screen.getByText('2024-001'));

  // Initially no bulk action bar
  expect(screen.queryByText(/case.*selected/i)).not.toBeInTheDocument();

  // Select the first data row checkbox (index 1, index 0 is the select-all)
  const checkboxes = screen.getAllByRole('checkbox');
  await userEvent.click(checkboxes[1]);

  // Bulk action bar should now show
  await waitFor(() => {
    expect(screen.getByText('1 case selected')).toBeInTheDocument();
  });
});

test('empty state renders when API returns 0 results', async () => {
  server.use(
    http.get('/api/tickets', () =>
      HttpResponse.json({
        items: [],
        total: 0,
        page: 1,
        pageSize: 25,
      })
    )
  );

  const qc = makeQueryClient();
  renderCaseList(qc);

  await waitFor(() => {
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });
  expect(screen.getByText('No cases match your filters')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument();
});

test('pagination shows correct page size options', async () => {
  server.use(
    http.get('/api/tickets', () =>
      HttpResponse.json({
        items: mockTickets,
        total: 100,
        page: 1,
        pageSize: 25,
      })
    )
  );

  const qc = makeQueryClient();
  renderCaseList(qc);

  await waitFor(() => screen.getByText('2024-001'));

  // Page size selector should be present
  const pageSizeSelect = screen.getByRole('combobox', { name: /rows per page/i });
  expect(pageSizeSelect).toBeInTheDocument();
});
