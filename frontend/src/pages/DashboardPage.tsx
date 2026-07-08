import { useQueries } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { pageVariants } from '../lib/animations';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentCasesFeed } from '@/components/dashboard/RecentCasesFeed';
import { StatusDonut } from '@/components/dashboard/StatusDonut';
import { MapWidget } from '@/components/dashboard/MapWidget';
import { QuickLinks } from '@/components/dashboard/QuickLinks';
import type { TicketSummary } from '@/types/ticket';

interface DashboardStats {
  open: number;
  openedToday: number;
  closedToday: number;
  overdue: number;
}

interface StatusChartItem {
  status: string;
  count: number;
}

interface PaginatedTickets {
  items: TicketSummary[];
  total: number;
  page: number;
  pageSize: number;
}

export function DashboardPage() {
  const results = useQueries({
    queries: [
      {
        queryKey: ['dashboard-stats'],
        queryFn: (): Promise<DashboardStats> =>
          fetch('/api/dashboard/stats').then((r) => r.json()),
      },
      {
        queryKey: ['dashboard-chart'],
        queryFn: (): Promise<StatusChartItem[]> =>
          fetch('/api/dashboard/chart').then((r) => r.json()),
      },
      {
        queryKey: ['geoclusters', { zoom: 10 }],
        queryFn: (): Promise<GeoJSON.FeatureCollection> =>
          fetch('/api/geoclusters?zoom=10').then((r) => r.json()),
      },
      {
        queryKey: ['tickets-recent'],
        queryFn: (): Promise<PaginatedTickets> =>
          fetch('/api/tickets?page=1&pageSize=10&sort=entered_date,desc').then((r) => r.json()),
      },
    ],
  });

  const [statsResult, chartResult, clustersResult, recentResult] = results;
  const isAnyLoading = results.some((r) => r.isLoading);

  const stats = statsResult.data;
  const chartData = chartResult.data ?? [];
  const clusters = clustersResult.data ?? null;
  const tickets = recentResult.data?.items ?? [];

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-6"
    >
      <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>

      {/* Stat cards row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isAnyLoading || !stats ? (
          <>
            <div data-testid="stat-card-skeleton"><Card><CardContent className="pt-6"><Skeleton className="h-8 w-16 mb-2" /><Skeleton className="h-4 w-24" /></CardContent></Card></div>
            <div data-testid="stat-card-skeleton"><Card><CardContent className="pt-6"><Skeleton className="h-8 w-16 mb-2" /><Skeleton className="h-4 w-24" /></CardContent></Card></div>
            <div data-testid="stat-card-skeleton"><Card><CardContent className="pt-6"><Skeleton className="h-8 w-16 mb-2" /><Skeleton className="h-4 w-24" /></CardContent></Card></div>
            <div data-testid="stat-card-skeleton"><Card><CardContent className="pt-6"><Skeleton className="h-8 w-16 mb-2" /><Skeleton className="h-4 w-24" /></CardContent></Card></div>
          </>
        ) : (
          <>
            <StatCard
              label="Total Open"
              count={stats.open}
              filterParam={{ status: 'open' }}
            />
            <StatCard
              label="Opened Today"
              count={stats.openedToday}
              filterParam={{ openedToday: 'true' }}
            />
            <StatCard
              label="Closed Today"
              count={stats.closedToday}
              filterParam={{ closedToday: 'true' }}
            />
            <StatCard
              label="Overdue"
              count={stats.overdue}
              filterParam={{ overdue: 'true' }}
              variant="destructive"
              data-testid="stat-card-overdue"
            />
          </>
        )}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: map + feed */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Geographic Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {isAnyLoading ? (
                <Skeleton className="h-48 md:h-64 w-full rounded-lg" />
              ) : (
                <MapWidget clusters={clusters} loading={false} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <RecentCasesFeed tickets={tickets} loading={isAnyLoading} />
            </CardContent>
          </Card>
        </div>

        {/* Right column: donut + quick links */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusDonut data={chartData} loading={isAnyLoading} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
            </CardHeader>
            <CardContent>
              <QuickLinks />
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

export default DashboardPage;
