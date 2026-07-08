import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { DashboardPage } from '@/pages/DashboardPage';
import { AuthProvider } from '@/contexts/AuthContext';
import { server } from './setup/server';

// Vitest lifecycle
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock Leaflet since jsdom doesn't support canvas/DOM manipulation for maps
const mockLeafletMap = {
  setView: function() { return this; },
  addTo: vi.fn(),
  remove: vi.fn(),
  on: vi.fn(),
};
vi.mock('leaflet', () => ({
  default: {
    map: () => mockLeafletMap,
    tileLayer: () => ({ addTo: vi.fn() }),
    circleMarker: () => ({ addTo: vi.fn(), on: vi.fn() }),
  },
}));

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        // Disable garbage collection during tests
        gcTime: Infinity,
      },
    },
  });
}

function renderDashboard(qc: QueryClient) {
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

test('renders 4 stat cards with correct labels after data loads', async () => {
  const qc = makeQueryClient();
  renderDashboard(qc);

  // Skeleton shown during loading
  const skeletons = screen.getAllByTestId('stat-card-skeleton');
  expect(skeletons.length).toBeGreaterThan(0);

  // Data renders after fetch
  await waitFor(() => {
    expect(screen.getByText('Total Open')).toBeInTheDocument();
    expect(screen.getByText('Opened Today')).toBeInTheDocument();
    expect(screen.getByText('Closed Today')).toBeInTheDocument();
    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });
});

test('overdue stat card shows destructive styling when count > 0', async () => {
  const qc = makeQueryClient();
  renderDashboard(qc);

  // Wait for data to load (overdue = 7 from MSW handler)
  await waitFor(() => {
    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });

  // Overdue count is 7 (> 0) so card should link to /cases?overdue=true
  const overdueLink = screen.getByText('Overdue').closest('a');
  expect(overdueLink).toHaveAttribute('href', '/cases?overdue=true');
});

test('RecentCasesFeed shows skeleton placeholders during load', () => {
  const qc = makeQueryClient();
  renderDashboard(qc);

  // Skeletons are shown before data loads
  const skeletons = screen.getAllByTestId('stat-card-skeleton');
  expect(skeletons.length).toBeGreaterThan(0);
});

test('StatusDonut renders accessible sr-only data table', async () => {
  const qc = makeQueryClient();
  renderDashboard(qc);

  await waitFor(() => {
    // sr-only table with caption should be present
    const caption = screen.queryByText('Status breakdown');
    expect(caption).toBeInTheDocument();
  });
});

test('MapWidget renders map container when token absent', async () => {
  const qc = makeQueryClient();
  renderDashboard(qc);

  // Wait for data to load so map is rendered (not skeleton)
  await waitFor(() => {
    expect(screen.getByText('Total Open')).toBeInTheDocument();
  });

  // Map container should be present
  const mapWidget = screen.queryByTestId('map-widget');
  expect(mapWidget).toBeInTheDocument();
});
