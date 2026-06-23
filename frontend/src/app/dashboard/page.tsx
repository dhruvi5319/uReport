import { getSession } from '@/lib/auth';
import Link from 'next/link';

export default async function DashboardPage() {
  const user = await getSession();

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {greeting}{user ? `, ${user.firstName}` : ''}.
        </h1>
        <Link
          href="/tickets/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          + New Ticket
        </Link>
      </div>

      {/* KPI cards — placeholder until Wave 3d adds real data */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'SLA Breached', value: '—', color: 'text-sla-breach', href: '/tickets?sla=breached' },
          { label: 'Due Today', value: '—', color: 'text-sla-warning', href: '/tickets?sla=due_today' },
          { label: 'Open Tickets', value: '—', color: 'text-status-open', href: '/tickets?status=open' },
          { label: 'SLA On-Time', value: '—', color: 'text-sla-ok', href: '/reports/sla' },
        ].map((kpi) => (
          <Link
            key={kpi.label}
            href={kpi.href}
            className="group rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <p className={`text-3xl font-bold ${kpi.color}`}>{kpi.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{kpi.label}</p>
            <p className="mt-2 text-xs text-primary opacity-0 transition-opacity group-hover:opacity-100">
              View →
            </p>
          </Link>
        ))}
      </div>

      {/* Quick links */}
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-base font-semibold">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/tickets" className="rounded-md border px-3 py-2 text-sm hover:bg-muted">
            View All Tickets
          </Link>
          <Link href="/tickets/new" className="rounded-md border px-3 py-2 text-sm hover:bg-muted">
            Create Ticket
          </Link>
          <Link href="/reports/sla" className="rounded-md border px-3 py-2 text-sm hover:bg-muted">
            SLA Report
          </Link>
        </div>
      </div>
    </div>
  );
}
