import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

interface StatusData {
  status: string;
  count: number;
}

interface StatusDonutProps {
  data: StatusData[];
  loading: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  open: 'hsl(var(--color-primary, 221 83% 53%))',
  closed: 'hsl(var(--muted-foreground, 215 16% 47%))',
  resolved: 'hsl(var(--muted-foreground, 215 16% 47%))',
  duplicate: 'hsl(var(--color-warning, 38 92% 50%))',
  bogus: 'hsl(var(--destructive, 0 84% 60%))',
};

const DEFAULT_COLORS = [
  '#3b82f6', '#6b7280', '#f59e0b', '#ef4444', '#8b5cf6', '#10b981',
];

function getColor(status: string, index: number): string {
  return STATUS_COLORS[status.toLowerCase()] ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length];
}

export function StatusDonut({ data, loading }: StatusDonutProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4">
        <Skeleton className="h-[200px] w-[200px] rounded-full" />
      </div>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="status"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${entry.status}`}
                fill={getColor(entry.status, index)}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string) => [value, name]}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>

      {/* Accessible data table — hidden visually, available to screen readers */}
      <table className="sr-only">
        <caption>Status breakdown</caption>
        <thead>
          <tr>
            <th scope="col">Status</th>
            <th scope="col">Count</th>
          </tr>
        </thead>
        <tbody>
          {data.map((entry) => (
            <tr key={entry.status}>
              <td>{entry.status}</td>
              <td>{entry.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default StatusDonut;
