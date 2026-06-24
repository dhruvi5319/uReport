// F17: Metrics Dashboard — onTimePercentage for selected category and date window
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { usePermission } from '@/hooks/usePermission';
import { metricsApi, MetricsResponse } from '@/api/metrics';
import OnTimeChart from '@/components/metrics/OnTimeChart';
import { apiClient } from '@/api/client';

interface Category { id: number; name: string; }

const MetricsDashboardPage: React.FC = () => {
  const authorized = usePermission('staff');
  if (!authorized) return <Navigate to="/" replace />;

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [numDays, setNumDays] = useState(30);
  const [effectiveDate, setEffectiveDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get<Category[]>('/categories').then(r => setCategories(r.data)).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await metricsApi.getMetrics({
        category_id: categoryId as number,
        numDays,
        effectiveDate,
      });
      setMetrics(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '1.5rem' }}>
      <h1 style={{ marginBottom: '1.5rem' }}>Metrics Dashboard</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem', alignItems: 'flex-end' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Category</label>
          <select
            value={categoryId}
            onChange={e => setCategoryId(Number(e.target.value))}
            style={{ border: '1px solid #d1d5db', borderRadius: 4, padding: '0.375rem 0.75rem', fontSize: '0.875rem' }}
            required
          >
            <option value="">Select category…</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Days</label>
          <input
            type="number"
            min={1}
            max={365}
            value={numDays}
            onChange={e => setNumDays(Number(e.target.value))}
            style={{ border: '1px solid #d1d5db', borderRadius: 4, padding: '0.375rem 0.75rem', fontSize: '0.875rem', width: 80 }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>As of Date</label>
          <input
            type="date"
            value={effectiveDate}
            onChange={e => setEffectiveDate(e.target.value)}
            style={{ border: '1px solid #d1d5db', borderRadius: 4, padding: '0.375rem 0.75rem', fontSize: '0.875rem' }}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !categoryId}
          style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, padding: '0.375rem 1rem', fontSize: '0.875rem', cursor: 'pointer', opacity: loading || !categoryId ? 0.5 : 1 }}
        >
          {loading ? 'Loading…' : 'Load Metrics'}
        </button>
      </form>

      {error && <p style={{ color: '#dc2626', marginBottom: '1rem' }}>{error}</p>}

      {metrics && (
        <div style={{ maxWidth: 512, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            {metrics.categoryName} — {metrics.numDays} days ending {metrics.effectiveDate}
            <br />
            {metrics.onTimeCount} of {metrics.closedCount} tickets closed on time
          </div>
          <OnTimeChart
            percentage={metrics.onTimePercentage}
            label="On-Time Closure Rate"
          />
        </div>
      )}
    </div>
  );
};

export default MetricsDashboardPage;
