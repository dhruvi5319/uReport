import React from 'react';

interface Props {
  percentage: number;
  label: string;
}

const OnTimeChart: React.FC<Props> = ({ percentage, label }) => {
  const pct = Math.min(Math.max(percentage, 0), 100);
  const color = pct >= 80 ? '#22c55e' : pct >= 50 ? '#eab308' : '#ef4444';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
        <span>{label}</span>
        <span style={{ fontWeight: 600 }}>{pct.toFixed(1)}%</span>
      </div>
      <div style={{ width: '100%', background: '#e5e7eb', borderRadius: 4, height: 16 }}>
        <div
          style={{ width: `${pct}%`, height: 16, borderRadius: 4, background: color, transition: 'width 0.3s ease' }}
        />
      </div>
    </div>
  );
};

export default OnTimeChart;
