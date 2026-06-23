import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth/guards';
import { AdminNav } from '@/components/admin/AdminNav';
import { Toaster } from '@/components/ui/toaster';

export const metadata = {
  title: 'Admin — uReport',
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Server-side role guard — redirects to /login if unauthenticated, /access-denied if not admin
  let session: { userId: number; role: 'admin' | 'staff' | 'public' | 'anonymous'; exp: number };
  try {
    session = await requireRole(['admin']);
  } catch {
    // requireRole calls redirect() which throws — re-throw so Next.js handles it
    throw redirect('/login');
  }

  void session; // used for guard only; role check done in requireRole

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left sidebar nav */}
      <AdminNav />

      {/* Main content area */}
      <main
        id="main-content"
        className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8"
        role="main"
      >
        {children}
      </main>

      {/* Toast notifications */}
      <Toaster />
    </div>
  );
}
