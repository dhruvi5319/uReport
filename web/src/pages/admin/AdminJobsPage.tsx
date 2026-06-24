// F16: Admin Scheduler Jobs — Manual trigger buttons for scheduler jobs
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { usePermission } from '@/hooks/usePermission';
import { adminJobsApi, JobName } from '@/api/adminJobs';

interface JobCard {
  jobName: JobName;
  label: string;
  description: string;
}

const JOBS: JobCard[] = [
  {
    jobName: 'digest-notifications',
    label: 'Digest Notifications',
    description: 'Process pending ticketHistory entries and send email notifications.',
  },
  {
    jobName: 'auto-close',
    label: 'Auto-Close Stale Tickets',
    description: 'Close open tickets that have exceeded their category SLA window.',
  },
  {
    jobName: 'audit',
    label: 'Data Integrity Audit',
    description: 'Check for data inconsistencies and log findings.',
  },
  {
    jobName: 'geo-cluster',
    label: 'Geo-Cluster Rebuild',
    description: 'Rebuild geoclusters and ticket_geodata for all zoom levels.',
  },
];

const AdminJobsPage: React.FC = () => {
  const authorized = usePermission('staff');
  if (!authorized) return <Navigate to="/" replace />;

  const [running, setRunning] = useState<JobName | null>(null);
  const [results, setResults] = useState<Record<string, { ok: boolean; message: string }>>({});

  const handleRun = async (jobName: JobName) => {
    setRunning(jobName);
    try {
      const res = await adminJobsApi.run(jobName);
      setResults(prev => ({
        ...prev,
        [jobName]: { ok: true, message: `Triggered at ${res.triggeredAt ?? new Date().toISOString()}` },
      }));
    } catch (e: unknown) {
      setResults(prev => ({
        ...prev,
        [jobName]: { ok: false, message: e instanceof Error ? e.message : 'Error' },
      }));
    } finally {
      setRunning(null);
    }
  };

  return (
    <div style={{ padding: '1.5rem' }}>
      <h1 style={{ marginBottom: '1.5rem' }}>Admin Scheduler Jobs</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {JOBS.map(job => (
          <div key={job.jobName} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <h2 style={{ margin: 0, fontSize: '1rem' }}>{job.label}</h2>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>{job.description}</p>
            <button
              onClick={() => handleRun(job.jobName)}
              disabled={running === job.jobName}
              style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, padding: '0.375rem 1rem', fontSize: '0.875rem', cursor: 'pointer', opacity: running === job.jobName ? 0.5 : 1, alignSelf: 'flex-start' }}
            >
              {running === job.jobName ? 'Running…' : 'Run Now'}
            </button>
            {results[job.jobName] && (
              <p style={{ fontSize: '0.75rem', color: results[job.jobName].ok ? '#16a34a' : '#dc2626', margin: 0 }}>
                {results[job.jobName].message}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminJobsPage;
