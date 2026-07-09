import { Link } from 'react-router-dom';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';

interface StatCardProps {
  label: string;
  count: number;
  filterParam: Record<string, string>;
  variant?: 'default' | 'destructive';
  loading?: boolean;
  'data-testid'?: string;
}

function AnimatedCount({ count }: { count: number }) {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (v) => Math.round(v).toString());
  const hasAnimated = useRef(false);

  useEffect(() => {
    const controls = animate(motionValue, count, { duration: 0.8, ease: 'easeOut' });
    hasAnimated.current = true;
    return controls.stop;
  }, [count, motionValue]);

  return <motion.span>{rounded}</motion.span>;
}

export function StatCard({
  label,
  count,
  filterParam,
  variant = 'default',
  loading = false,
  'data-testid': testId,
}: StatCardProps) {
  const isDestructiveActive = variant === 'destructive' && count > 0;
  const href = '/cases?' + new URLSearchParams(filterParam).toString();

  if (loading) {
    return (
      <div data-testid="stat-card-skeleton">
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-4 w-24" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Link to={href} data-testid={testId}>
      <Card
        className={cn(
          'hover:shadow-md transition-shadow cursor-pointer',
          isDestructiveActive && 'border-destructive'
        )}
      >
        <CardContent className="pt-6">
          <p
            className={cn(
              'text-3xl font-bold tabular-nums',
              isDestructiveActive && 'text-destructive'
            )}
          >
            <AnimatedCount count={count} />
          </p>
          <p
            className={cn(
              'text-sm text-muted-foreground mt-1',
              isDestructiveActive && 'text-destructive'
            )}
          >
            {label}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

export default StatCard;
