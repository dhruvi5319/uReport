import React, { Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import LoginPage from '@/pages/LoginPage';
import CallbackPage from '@/pages/CallbackPage';

// Eagerly-loaded P0 ticket pages
import TicketListPage   from '@/pages/tickets/TicketListPage';
import TicketDetailPage from '@/pages/tickets/TicketDetailPage';
import CreateTicketPage from '@/pages/tickets/CreateTicketPage';

// Placeholder factory — Wave 3b/3c will replace these with real components
const Placeholder = (title: string): React.FC =>
  () => <div style={{ padding: '1.5rem' }}><h2>{title}</h2><p>Coming in a future wave.</p></div>;

const PeopleListPage        = Placeholder('People');
const DepartmentsPage       = Placeholder('Departments');
const CategoriesPage        = Placeholder('Categories');
const SubstatusPage         = Placeholder('Substatuses');
const ActionsPage           = Placeholder('Action Types');
const ClientsPage           = Placeholder('API Clients');
const AdminJobsPage         = Placeholder('Scheduler Jobs');
const MetricsDashboardPage  = Placeholder('Metrics Dashboard');
const ReportsPage           = Placeholder('Reports');

const withLayout = (el: React.ReactNode) => <AppLayout>{el}</AppLayout>;
const staffRoute = (el: React.ReactNode) => (
  <ProtectedRoute requiredRole="staff">{withLayout(el)}</ProtectedRoute>
);
const authRoute = (el: React.ReactNode) => (
  <ProtectedRoute requiredRole="public">{withLayout(el)}</ProtectedRoute>
);

const router = createBrowserRouter([
  { path: '/',         element: <Navigate to="/tickets" replace /> },
  { path: '/login',    element: <LoginPage /> },
  { path: '/callback', element: <CallbackPage /> },

  // Ticket routes (authenticated, any role)
  { path: '/tickets',     element: authRoute(<TicketListPage />) },
  { path: '/tickets/:id', element: authRoute(<TicketDetailPage />) },

  // Ticket creation (staff only)
  { path: '/tickets/new', element: staffRoute(<CreateTicketPage />) },

  // Admin pages (staff only) — placeholders until Wave 3b
  { path: '/people',             element: staffRoute(<PeopleListPage />) },
  { path: '/departments',        element: staffRoute(<DepartmentsPage />) },
  { path: '/categories',         element: staffRoute(<CategoriesPage />) },
  { path: '/admin/substatuses',  element: staffRoute(<SubstatusPage />) },
  { path: '/admin/actions',      element: staffRoute(<ActionsPage />) },
  { path: '/admin/clients',      element: staffRoute(<ClientsPage />) },
  { path: '/admin/jobs',         element: staffRoute(<AdminJobsPage />) },
  { path: '/metrics',            element: staffRoute(<MetricsDashboardPage />) },
  { path: '/reports',            element: staffRoute(<ReportsPage />) },
]);

const AppRouter: React.FC = () => (
  <Suspense fallback={<LoadingSpinner />}>
    <RouterProvider router={router} />
  </Suspense>
);
export default AppRouter;
