import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { CaseDetailPage } from '@/pages/CaseDetailPage';
import { server } from './setup/server';
import { http, HttpResponse } from 'msw';
import type { Ticket, TicketHistory, Media } from '@/types/ticket';

// Vitest lifecycle
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock Leaflet and Mapbox since jsdom doesn't support canvas/DOM manipulation
vi.mock('leaflet', () => ({
  default: {
    map: () => ({
      setView: function () { return this; },
      addTo: vi.fn(),
      remove: vi.fn(),
      on: vi.fn(),
      addLayer: vi.fn(),
    }),
    tileLayer: () => ({ addTo: vi.fn() }),
    circleMarker: () => ({ addTo: vi.fn(), on: vi.fn() }),
    marker: () => ({ addTo: vi.fn() }),
  },
}));

vi.mock('mapbox-gl', () => ({
  default: {
    Map: vi.fn().mockImplementation(() => ({
      on: vi.fn(),
      off: vi.fn(),
      remove: vi.fn(),
      addSource: vi.fn(),
      addLayer: vi.fn(),
      flyTo: vi.fn(),
      getSource: vi.fn(),
    })),
    accessToken: '',
  },
}));

const mockTicket: Ticket = {
  id: 42,
  ticketId: '2024-042',
  status: 'open',
  categoryName: 'Pothole',
  categoryId: 1,
  departmentId: 1,
  departmentName: 'Public Works',
  enteredDate: new Date().toISOString(),
  description: 'Large pothole on Main St',
  location: '123 Main St',
  slaDays: 7,
  isOverdue: false,
};

const mockHistory: TicketHistory[] = [
  {
    id: 1,
    actionName: 'Open',
    notes: 'Ticket created',
    actorName: 'John Staff',
    createdAt: new Date().toISOString(),
    media: [],
  },
];

const mockMedia: Media[] = [
  {
    id: 1,
    filename: 'photo.jpg',
    url: '/media/42/photo.jpg',
    thumbnailUrl: '/media/42/thumb_photo.jpg',
    mimeType: 'image/jpeg',
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

function renderCaseDetail(qc: QueryClient, ticketId: string = '42') {
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[`/cases/${ticketId}`]}>
        <Routes>
          <Route path="/cases/:id" element={<CaseDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

test('renders split-pane layout with metadata and timeline', async () => {
  server.use(
    http.get('/api/tickets/42', () => HttpResponse.json(mockTicket)),
    http.get('/api/tickets/42/history', () => HttpResponse.json(mockHistory)),
    http.get('/api/tickets/42/media', () => HttpResponse.json([])),
    http.get('/api/categories/public', () => HttpResponse.json([])),
    http.get('/api/issue-types', () => HttpResponse.json([])),
    http.get('/api/contact-methods', () => HttpResponse.json([])),
    http.get('/api/actions', () => HttpResponse.json([])),
  );

  const qc = makeQueryClient();
  renderCaseDetail(qc);

  await waitFor(() => expect(screen.getByText('Case #2024-042')).toBeInTheDocument());
  expect(screen.getByText('Pothole')).toBeInTheDocument();
  expect(screen.getByText('123 Main St')).toBeInTheDocument();
});

test('fires 3 parallel queries on mount (ticket, history, media)', async () => {
  const calls: string[] = [];

  server.use(
    http.get('/api/tickets/42', () => {
      calls.push('ticket');
      return HttpResponse.json(mockTicket);
    }),
    http.get('/api/tickets/42/history', () => {
      calls.push('history');
      return HttpResponse.json([]);
    }),
    http.get('/api/tickets/42/media', () => {
      calls.push('media');
      return HttpResponse.json([]);
    }),
    http.get('/api/categories/public', () => HttpResponse.json([])),
    http.get('/api/issue-types', () => HttpResponse.json([])),
    http.get('/api/contact-methods', () => HttpResponse.json([])),
    http.get('/api/actions', () => HttpResponse.json([])),
  );

  const qc = makeQueryClient();
  renderCaseDetail(qc);

  await waitFor(() => expect(calls).toContain('ticket'));
  await waitFor(() => expect(calls).toContain('history'));
  await waitFor(() => expect(calls).toContain('media'));
});

test('CloseDialog requires substatus before enabling confirm button', async () => {
  server.use(
    http.get('/api/tickets/42', () => HttpResponse.json(mockTicket)),
    http.get('/api/tickets/42/history', () => HttpResponse.json([])),
    http.get('/api/tickets/42/media', () => HttpResponse.json([])),
    http.get('/api/categories/public', () => HttpResponse.json([])),
    http.get('/api/issue-types', () => HttpResponse.json([])),
    http.get('/api/contact-methods', () => HttpResponse.json([])),
    http.get('/api/actions', () => HttpResponse.json([])),
    http.get('/api/substatus', () =>
      HttpResponse.json([
        { id: 1, name: 'Resolved' },
        { id: 2, name: 'Duplicate' },
      ])
    ),
  );

  const qc = makeQueryClient();
  renderCaseDetail(qc);

  // Wait for ticket to load (open status shows Close Case button)
  await waitFor(() => expect(screen.getByText('Close Case')).toBeInTheDocument());

  // Click to open the dialog
  await userEvent.click(screen.getByText('Close Case'));

  // Confirm button should be disabled before substatus selected
  const confirmBtn = screen.getByRole('button', { name: /Confirm Close/i });
  expect(confirmBtn).toBeDisabled();
});

test('SlaProgressBar renders with progressbar role and aria attributes', async () => {
  server.use(
    http.get('/api/tickets/42', () => HttpResponse.json(mockTicket)),
    http.get('/api/tickets/42/history', () => HttpResponse.json([])),
    http.get('/api/tickets/42/media', () => HttpResponse.json([])),
    http.get('/api/categories/public', () => HttpResponse.json([])),
    http.get('/api/issue-types', () => HttpResponse.json([])),
    http.get('/api/contact-methods', () => HttpResponse.json([])),
    http.get('/api/actions', () => HttpResponse.json([])),
  );

  const qc = makeQueryClient();
  renderCaseDetail(qc);

  await waitFor(() => screen.getByText('Case #2024-042'));

  const progressbar = screen.getByRole('progressbar');
  expect(progressbar).toBeInTheDocument();
  expect(progressbar).toHaveAttribute('aria-valuemin', '0');
  expect(progressbar).toHaveAttribute('aria-valuemax', '100');
});

test('inline edit: pencil click shows edit mode', async () => {
  server.use(
    http.get('/api/tickets/42', () => HttpResponse.json(mockTicket)),
    http.get('/api/tickets/42/history', () => HttpResponse.json([])),
    http.get('/api/tickets/42/media', () => HttpResponse.json([])),
    http.get('/api/categories/public', () => HttpResponse.json([])),
    http.get('/api/issue-types', () => HttpResponse.json([])),
    http.get('/api/contact-methods', () => HttpResponse.json([])),
    http.get('/api/actions', () => HttpResponse.json([])),
  );

  const qc = makeQueryClient();
  renderCaseDetail(qc);

  await waitFor(() => screen.getByText('Case #2024-042'));

  // Click the pencil icon for the Location field
  const editLocationBtn = screen.getByRole('button', { name: /Edit Location/i });
  await userEvent.click(editLocationBtn);

  // Should show Save and Cancel buttons
  expect(screen.getByRole('button', { name: /Save/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
});

test('inline edit: save calls PATCH on location field', async () => {
  let patched: object = {};

  server.use(
    http.get('/api/tickets/42', () => HttpResponse.json(mockTicket)),
    http.get('/api/tickets/42/history', () => HttpResponse.json([])),
    http.get('/api/tickets/42/media', () => HttpResponse.json([])),
    http.get('/api/categories/public', () => HttpResponse.json([])),
    http.get('/api/issue-types', () => HttpResponse.json([])),
    http.get('/api/contact-methods', () => HttpResponse.json([])),
    http.get('/api/actions', () => HttpResponse.json([])),
    http.patch('/api/tickets/42', async ({ request }) => {
      patched = await request.json() as object;
      return HttpResponse.json({ ...mockTicket, ...patched });
    }),
  );

  const qc = makeQueryClient();
  renderCaseDetail(qc);

  await waitFor(() => screen.getByText('Case #2024-042'));

  // Click pencil for Location
  const editBtn = screen.getByRole('button', { name: /Edit Location/i });
  await userEvent.click(editBtn);

  // Clear and type new location
  const locationInput = screen.getByPlaceholderText('Enter location...');
  await userEvent.clear(locationInput);
  await userEvent.type(locationInput, '456 New Ave');

  // Click Save
  await userEvent.click(screen.getByRole('button', { name: /Save/i }));

  await waitFor(() => expect(patched).toMatchObject({ location: '456 New Ave' }));
});

test('action log form renders action type select and notes textarea', async () => {
  server.use(
    http.get('/api/tickets/42', () => HttpResponse.json(mockTicket)),
    http.get('/api/tickets/42/history', () => HttpResponse.json([])),
    http.get('/api/tickets/42/media', () => HttpResponse.json([])),
    http.get('/api/categories/public', () => HttpResponse.json([])),
    http.get('/api/issue-types', () => HttpResponse.json([])),
    http.get('/api/contact-methods', () => HttpResponse.json([])),
    http.get('/api/actions', () =>
      HttpResponse.json([{ id: 1, name: 'Response', departmentId: 1 }])
    ),
  );

  const qc = makeQueryClient();
  renderCaseDetail(qc);

  await waitFor(() => screen.getByText('Log Action / Response'));
  // Action form rendered with placeholder text
  expect(screen.getByText('Select action type...')).toBeInTheDocument();
  // Notes textarea
  expect(screen.getByPlaceholderText('Add notes...')).toBeInTheDocument();
  // Submit button should be present (disabled without action selection)
  const submitBtn = screen.getByRole('button', { name: /Submit/i });
  expect(submitBtn).toBeDisabled();
});

test('media gallery: lightbox opens on thumbnail click', async () => {
  server.use(
    http.get('/api/tickets/42', () => HttpResponse.json(mockTicket)),
    http.get('/api/tickets/42/history', () => HttpResponse.json([])),
    http.get('/api/tickets/42/media', () => HttpResponse.json(mockMedia)),
    http.get('/api/categories/public', () => HttpResponse.json([])),
    http.get('/api/issue-types', () => HttpResponse.json([])),
    http.get('/api/contact-methods', () => HttpResponse.json([])),
    http.get('/api/actions', () => HttpResponse.json([])),
  );

  const qc = makeQueryClient();
  renderCaseDetail(qc);

  await waitFor(() => screen.getByAltText('photo.jpg'));

  await userEvent.click(screen.getByAltText('photo.jpg'));

  await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
});

test('media gallery: drop triggers upload mutation', async () => {
  let uploaded = false;

  server.use(
    http.get('/api/tickets/42', () => HttpResponse.json(mockTicket)),
    http.get('/api/tickets/42/history', () => HttpResponse.json([])),
    http.get('/api/tickets/42/media', () => HttpResponse.json([])),
    http.get('/api/categories/public', () => HttpResponse.json([])),
    http.get('/api/issue-types', () => HttpResponse.json([])),
    http.get('/api/contact-methods', () => HttpResponse.json([])),
    http.get('/api/actions', () => HttpResponse.json([])),
    http.post('/api/tickets/42/media', () => {
      uploaded = true;
      return HttpResponse.json({ id: 1, filename: 'new.jpg', url: '/media/1', thumbnailUrl: '/thumb/1', mimeType: 'image/jpeg' });
    }),
  );

  const qc = makeQueryClient();
  renderCaseDetail(qc);

  await waitFor(() => screen.getByText('Drop photos here'));

  const dropZone = screen.getByLabelText('Drop photos here or click Attach Photo');
  const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

  fireEvent.drop(dropZone, {
    dataTransfer: {
      files: [file],
      items: [{ kind: 'file', type: 'image/jpeg', getAsFile: () => file }],
      types: ['Files'],
    },
  });

  await waitFor(() => expect(uploaded).toBe(true));
});

test('closed ticket shows Reopen Case button instead of Close Case', async () => {
  const closedTicket = { ...mockTicket, status: 'closed' as const, substatus: 'Resolved' };

  server.use(
    http.get('/api/tickets/42', () => HttpResponse.json(closedTicket)),
    http.get('/api/tickets/42/history', () => HttpResponse.json([])),
    http.get('/api/tickets/42/media', () => HttpResponse.json([])),
    http.get('/api/categories/public', () => HttpResponse.json([])),
    http.get('/api/issue-types', () => HttpResponse.json([])),
    http.get('/api/contact-methods', () => HttpResponse.json([])),
    http.get('/api/actions', () => HttpResponse.json([])),
  );

  const qc = makeQueryClient();
  renderCaseDetail(qc);

  await waitFor(() => screen.getByText('Case #2024-042'));
  expect(screen.getByText('Reopen Case')).toBeInTheDocument();
  expect(screen.queryByText('Close Case')).not.toBeInTheDocument();
});

test('timeline shows newest-first entries with actor name', async () => {
  server.use(
    http.get('/api/tickets/42', () => HttpResponse.json(mockTicket)),
    http.get('/api/tickets/42/history', () => HttpResponse.json(mockHistory)),
    http.get('/api/tickets/42/media', () => HttpResponse.json([])),
    http.get('/api/categories/public', () => HttpResponse.json([])),
    http.get('/api/issue-types', () => HttpResponse.json([])),
    http.get('/api/contact-methods', () => HttpResponse.json([])),
    http.get('/api/actions', () => HttpResponse.json([])),
  );

  const qc = makeQueryClient();
  renderCaseDetail(qc);

  await waitFor(() => screen.getByText('Activity Timeline'));
  expect(screen.getByText('Open')).toBeInTheDocument();
  expect(screen.getByText('John Staff')).toBeInTheDocument();
  expect(screen.getByText('Ticket created')).toBeInTheDocument();
});
