// F17: Reports Page — 10 canned reports with date range filters and table display
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { usePermission } from '@/hooks/usePermission';
import { metricsApi, ReportType, ReportResponse } from '@/api/metrics';
import ReportTable from '@/components/metrics/ReportTable';

const REPORT_TYPES: { value: ReportType; label: string }[] = [
  { value: 'activity',    label: 'Activity' },
  { value: 'assignments', label: 'Assignments' },
  { value: 'categories',  label: 'Categories' },
  { value: 'staff',       label: 'Staff' },
  { value: 'person',      label: 'Person' },
  { value: 'sla',         label: 'SLA Compliance' },
  { value: 'volume',      label: 'Volume Trend' },
  { value: 'current',     label: 'Current Open' },
  { value: 'opened',      label: 'Opened Today' },
  { value: 'closed',      label: 'Closed Today' },
];

const ReportsPage: React.FC = () => {
  const authorized = usePermission('staff');
  if (!authorized) return <Navigate to="/" replace />;

  const [reportType, setReportType] = useState<ReportType>('activity');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRun = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const result = await metricsApi.getReport(reportType, params);
      setReport(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to run report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '1.5rem' }}>
      <h1 style={{ marginBottom: '1.5rem' }}>Reports</h1>
      <form onSubmit={handleRun} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem', alignItems: 'flex-end' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Report Type</label>
          <select
            value={reportType}
            onChange={e => setReportType(e.target.value as ReportType)}
            style={{ border: '1px solid #d1d5db', borderRadius: 4, padding: '0.375rem 0.75rem', fontSize: '0.875rem' }}
          >
            {REPORT_TYPES.map(rt => (
              <option key={rt.value} value={rt.value}>{rt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            style={{ border: '1px solid #d1d5db', borderRadius: 4, padding: '0.375rem 0.75rem', fontSize: '0.875rem' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            style={{ border: '1px solid #d1d5db', borderRadius: 4, padding: '0.375rem 0.75rem', fontSize: '0.875rem' }}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, padding: '0.375rem 1rem', fontSize: '0.875rem', cursor: 'pointer', opacity: loading ? 0.5 : 1 }}
        >
          {loading ? 'Running…' : 'Run Report'}
        </button>
      </form>

      {error && <p style={{ color: '#dc2626', marginBottom: '1rem' }}>{error}</p>}

      {report && (
        <div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
            Generated at {new Date(report.generatedAt).toLocaleString()} — {report.data.length} rows
          </div>
          <ReportTable data={report.data} />
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
