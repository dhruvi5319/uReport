import React from 'react';
import { ReportRow } from '@/api/metrics';

interface Props {
  data: ReportRow[];
}

const ReportTable: React.FC<Props> = ({ data }) => {
  if (data.length === 0) return <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>No data.</p>;

  const columns = Object.keys(data[0]);

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
        <thead>
          <tr style={{ background: '#f9fafb' }}>
            {columns.map(col => (
              <th key={col} style={{ padding: '0.625rem 0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb', fontWeight: 600, textTransform: 'capitalize' }}>
                {col.replace(/_/g, ' ')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
              {columns.map(col => (
                <td key={col} style={{ padding: '0.625rem 0.75rem' }}>
                  {row[col] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReportTable;
