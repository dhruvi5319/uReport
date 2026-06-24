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

// Wave 3b: Admin pages (F5, F6, F7, F8, F9, F13)
import PeopleListPage   from '@/pages/admin/PeopleListPage';
import PersonDetailPage from '@/pages/admin/PersonDetailPage';
import DepartmentsPage  from '@/pages/admin/DepartmentsPage';
import CategoriesPage   from '@/pages/admin/CategoriesPage';
import SubstatusPage    from '@/pages/admin/SubstatusPage';
import ActionsPage      from '@/pages/admin/ActionsPage';
import ClientsPage      from '@/pages/admin/ClientsPage';

// Placeholder factory — Wave 3c will replace these with real components
const Placeholder = (title: string): React.FC =>
  () => <div style={{ padding: '1.5rem' }}><h2>{title}</h2><p>Coming in a future wave.</p></div>;

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

  // Wave 3b: People admin (F5)
  { path: '/admin/people',     element: staffRoute(<PeopleListPage />) },
  { path: '/admin/people/:id', element: staffRoute(<PersonDetailPage />) },

  // Wave 3b: Department admin (F6)
  { path: '/admin/departments', element: staffRoute(<DepartmentsPage />) },

  // Wave 3b: Categories admin (F7)
  { path: '/admin/categories', element: staffRoute(<CategoriesPage />) },

  // Wave 3b: Substatus admin (F8)
  { path: '/admin/substatus', element: staffRoute(<SubstatusPage />) },

  // Wave 3b: Actions admin (F9)
  { path: '/admin/actions', element: staffRoute(<ActionsPage />) },

  // Wave 3b: API Clients admin (F13)
  { path: '/admin/clients', element: staffRoute(<ClientsPage />) },

  // Legacy placeholders kept for backward compat with Wave 3a Sidebar links
  { path: '/people',            element: staffRoute(<PeopleListPage />) },
  { path: '/departments',       element: staffRoute(<DepartmentsPage />) },
  { path: '/categories',        element: staffRoute(<CategoriesPage />) },
  { path: '/admin/substatuses', element: staffRoute(<SubstatusPage />) },

  // Wave 3c placeholders (jobs, metrics, reports)
  { path: '/admin/jobs',  element: staffRoute(<AdminJobsPage />) },
  { path: '/metrics',     element: staffRoute(<MetricsDashboardPage />) },
  { path: '/reports',     element: staffRoute(<ReportsPage />) },
]);

const AppRouter: React.FC = () => (
  <Suspense fallback={<LoadingSpinner />}>
    <RouterProvider router={router} />
  </Suspense>
);
export default AppRouter;
