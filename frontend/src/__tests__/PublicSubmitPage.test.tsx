import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { PublicSubmitPage } from '@/pages/PublicSubmitPage';
import { server } from './setup/server';
import { http, HttpResponse } from 'msw';

// MSW lifecycle
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock leaflet/mapbox since jsdom doesn't support DOM map rendering
vi.mock('leaflet', () => ({
  default: {
    map: () => ({
      setView: function() { return this; },
      addTo: vi.fn(),
      remove: vi.fn(),
      on: vi.fn(),
    }),
    tileLayer: () => ({ addTo: vi.fn() }),
    circleMarker: () => ({ addTo: vi.fn(), on: vi.fn() }),
  },
}));

vi.mock('mapbox-gl', () => ({
  default: {
    Map: vi.fn(() => ({
      on: vi.fn(),
      remove: vi.fn(),
      addSource: vi.fn(),
      addLayer: vi.fn(),
    })),
    accessToken: '',
  },
}));

const mockCategories = [
  {
    id: 1,
    name: 'Infrastructure',
    categories: [
      { id: 10, name: 'Pothole', postingPermissionLevel: 'anonymous' },
    ],
  },
];

function renderWizard() {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
    },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <PublicSubmitPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

test('Step 1: renders contact form with Skip button', () => {
  renderWizard();
  expect(screen.getByText('Contact Information')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument();
  // Step 1 is shown in progress indicator
  expect(screen.getByText('Submit a Service Request')).toBeInTheDocument();
});

test('Step 1: Skip advances to Step 2 without requiring any data', async () => {
  server.use(
    http.get('/api/categories/public', () => HttpResponse.json(mockCategories))
  );
  renderWizard();
  await userEvent.click(screen.getByRole('button', { name: /skip/i }));
  await waitFor(() => expect(screen.getByText('Category')).toBeInTheDocument());
});

test('Step 1: invalid email shows Zod error', async () => {
  renderWizard();
  const emailInput = screen.getByLabelText(/email/i);
  await userEvent.type(emailInput, 'not-an-email');
  await userEvent.click(screen.getByRole('button', { name: /next.*category/i }));
  expect(await screen.findByText(/invalid email/i)).toBeInTheDocument();
});

test('Step 2: shows categories from public API', async () => {
  server.use(
    http.get('/api/categories/public', () => HttpResponse.json(mockCategories))
  );
  renderWizard();
  // Navigate to Step 2
  await userEvent.click(screen.getByRole('button', { name: /skip/i }));
  await waitFor(() => expect(screen.getByText('Infrastructure')).toBeInTheDocument());
  // Cannot advance without selecting
  expect(screen.getByRole('button', { name: /next.*location/i })).toBeDisabled();
});

test('Step 2: selecting category enables Next button', async () => {
  server.use(
    http.get('/api/categories/public', () => HttpResponse.json(mockCategories))
  );
  renderWizard();
  await userEvent.click(screen.getByRole('button', { name: /skip/i }));
  await waitFor(() => screen.getByText('Infrastructure'));
  await userEvent.click(screen.getByText('Infrastructure')); // select group
  await waitFor(() => screen.getByText('Pothole'));
  await userEvent.click(screen.getByText('Pothole')); // select category
  expect(screen.getByRole('button', { name: /next.*location/i })).not.toBeDisabled();
});

test('Step 4: description min 10 chars validated', async () => {
  server.use(
    http.get('/api/categories/public', () => HttpResponse.json(mockCategories))
  );
  renderWizard();
  // Navigate to Step 2 via Skip
  await userEvent.click(screen.getByRole('button', { name: /skip/i }));
  // Step 2: select category
  await waitFor(() => screen.getByText('Infrastructure'));
  await userEvent.click(screen.getByText('Infrastructure'));
  await waitFor(() => screen.getByText('Pothole'));
  await userEvent.click(screen.getByText('Pothole'));
  // Step 2 -> Step 3
  await userEvent.click(screen.getByRole('button', { name: /next.*location/i }));
  // Step 3 -> Step 4 (skip location — advance button may be enabled if address is not required strictly)
  await waitFor(() => screen.getByText('Location'));
  // Type in address to enable advancement
  const addressInput = screen.getByPlaceholderText(/start typing an address/i);
  await userEvent.type(addressInput, 'Main Street');
  await userEvent.click(screen.getByRole('button', { name: /next.*description/i }));
  await waitFor(() => screen.getByText('Description & Photos'));
  // Type fewer than 10 chars
  const descriptionArea = screen.getByPlaceholderText(/describe the issue/i);
  await userEvent.type(descriptionArea, 'short');
  await userEvent.click(screen.getByRole('button', { name: /review/i }));
  expect(await screen.findByText(/at least 10 characters/i)).toBeInTheDocument();
});

test('Step 5: POST /api/tickets/public called on Submit; confirmation shows case ID', async () => {
  let submitted = false;
  server.use(
    http.get('/api/categories/public', () => HttpResponse.json(mockCategories)),
    http.post('/api/tickets/public', () => {
      submitted = true;
      return HttpResponse.json({ id: 999, ticketId: '2024-999' });
    }),
  );
  renderWizard();
  // Step 1: Skip contact
  await userEvent.click(screen.getByRole('button', { name: /skip/i }));
  // Step 2: Select category
  await waitFor(() => screen.getByText('Infrastructure'));
  await userEvent.click(screen.getByText('Infrastructure'));
  await waitFor(() => screen.getByText('Pothole'));
  await userEvent.click(screen.getByText('Pothole'));
  await userEvent.click(screen.getByRole('button', { name: /next.*location/i }));
  // Step 3: Enter address and proceed
  await waitFor(() => screen.getByText('Location'));
  const addressInput = screen.getByPlaceholderText(/start typing an address/i);
  await userEvent.type(addressInput, '123 Main St');
  await userEvent.click(screen.getByRole('button', { name: /next.*description/i }));
  // Step 4: Enter description and proceed
  await waitFor(() => screen.getByText('Description & Photos'));
  const descArea = screen.getByPlaceholderText(/describe the issue/i);
  await userEvent.type(descArea, 'A pothole on the main road causing problems');
  await userEvent.click(screen.getByRole('button', { name: /review/i }));
  // Step 5: Submit
  await waitFor(() => screen.getByText('Review Your Report'));
  await userEvent.click(screen.getByRole('button', { name: /submit report/i }));
  // Confirmation
  await waitFor(() => expect(submitted).toBe(true));
  await waitFor(() =>
    expect(screen.getByTestId('case-id')).toHaveTextContent('#2024-999')
  );
});

test('Back button preserves form state from previous steps', async () => {
  server.use(
    http.get('/api/categories/public', () => HttpResponse.json(mockCategories))
  );
  renderWizard();
  // Fill in Step 1 contact info
  const firstNameInput = screen.getByLabelText(/first name/i);
  await userEvent.type(firstNameInput, 'Jane');
  await userEvent.click(screen.getByRole('button', { name: /next.*category/i }));
  // Step 2 → go back
  await waitFor(() => screen.getByText('Category'));
  await userEvent.click(screen.getByRole('button', { name: /back/i }));
  // Should see Jane still in the first name field
  await waitFor(() => expect(screen.getByDisplayValue('Jane')).toBeInTheDocument());
});
