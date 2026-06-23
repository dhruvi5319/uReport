import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { TopNav } from '@/components/nav/TopNav';
import { Sidebar } from '@/components/nav/Sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Validate session (middleware only checked cookie presence)
  const user = await getSession();

  if (!user) {
    redirect('/login');
  }

  // Public role should not access staff dashboard
  if (user.role === 'public') {
    redirect('/submit');
  }

  return (
    <div className="flex min-h-screen flex-col">
      <TopNav user={user} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar user={user} />
        <main
          id="main-content"
          className="flex-1 overflow-y-auto bg-muted/20 p-6"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
