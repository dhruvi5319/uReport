import React, { Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import LoginPage from '@/pages/LoginPage';
import CallbackPage from '@/pages/CallbackPage';

// Wave 3a: Ticket pages (P0)
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

// Wave 3c: New feature pages (F2, F10, F12, F14, F15, F16, F17, F19, F20)
import Open311ServiceListPage  from '@/pages/Open311ServiceListPage';
import BookmarksPage           from '@/pages/admin/BookmarksPage';
import ContactMethodsPage      from '@/pages/admin/ContactMethodsPage';
import TicketMapPage           from '@/pages/admin/TicketMapPage';
import AdminJobsPage           from '@/pages/admin/AdminJobsPage';
import MetricsDashboardPage    from '@/pages/admin/MetricsDashboardPage';
import ReportsPage             from '@/pages/admin/ReportsPage';
import IssueTypesPage          from '@/pages/admin/IssueTypesPage';
import ResponseTemplatesPage   from '@/pages/admin/ResponseTemplatesPage';

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

  // F2: Open311 public service list (no auth required)
  { path: '/open311-services', element: withLayout(<Open311ServiceListPage />) },

  // Ticket routes (authenticated, any role)
  { path: '/tickets',     element: authRoute(<TicketListPage />) },
  { path: '/tickets/:id', element: authRoute(<TicketDetailPage />) },

  // Ticket creation (staff only)
  { path: '/tickets/new', element: staffRoute(<CreateTicketPage />) },

  // F15: Geo-cluster map view (staff only)
  { path: '/map', element: staffRoute(<TicketMapPage />) },

  // F12: Bookmarks (staff only)
  { path: '/bookmarks', element: staffRoute(<BookmarksPage />) },

  // Wave 3b: People admin (F5)
  { path: '/people',       element: staffRoute(<PeopleListPage />) },
  { path: '/people/:id',   element: staffRoute(<PersonDetailPage />) },
  { path: '/admin/people',     element: staffRoute(<PeopleListPage />) },
  { path: '/admin/people/:id', element: staffRoute(<PersonDetailPage />) },

  // Wave 3b: Department admin (F6)
  { path: '/departments',        element: staffRoute(<DepartmentsPage />) },
  { path: '/admin/departments',  element: staffRoute(<DepartmentsPage />) },

  // Wave 3b: Categories admin (F7)
  { path: '/categories',        element: staffRoute(<CategoriesPage />) },
  { path: '/admin/categories',  element: staffRoute(<CategoriesPage />) },

  // Wave 3b: Substatus admin (F8)
  { path: '/admin/substatus',   element: staffRoute(<SubstatusPage />) },
  { path: '/admin/substatuses', element: staffRoute(<SubstatusPage />) },

  // Wave 3b: Actions admin (F9)
  { path: '/admin/actions', element: staffRoute(<ActionsPage />) },

  // Wave 3b: API Clients admin (F13)
  { path: '/admin/clients', element: staffRoute(<ClientsPage />) },

  // F19: Issue Types admin (staff only)
  { path: '/issue-types', element: staffRoute(<IssueTypesPage />) },

  // F14: Contact Methods (staff only)
  { path: '/contact-methods', element: staffRoute(<ContactMethodsPage />) },

  // F20: Response Templates admin (staff only)
  { path: '/response-templates', element: staffRoute(<ResponseTemplatesPage />) },

  // F17: Metrics dashboard (staff only)
  { path: '/metrics', element: staffRoute(<MetricsDashboardPage />) },

  // F17: Reports page (staff only)
  { path: '/reports', element: staffRoute(<ReportsPage />) },

  // F16: Scheduler admin jobs (staff only)
  { path: '/admin/jobs', element: staffRoute(<AdminJobsPage />) },

  // Fallback
  { path: '*', element: <Navigate to="/tickets" replace /> },
]);

const AppRouter: React.FC = () => (
  <Suspense fallback={<LoadingSpinner />}>
    <RouterProvider router={router} />
  </Suspense>
);
export default AppRouter;
