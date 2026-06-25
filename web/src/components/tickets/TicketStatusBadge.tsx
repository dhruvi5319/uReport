import React from 'react';

interface BadgeProps { status: string; substatus?: string; }
const colors: Record<string, string> = { open: '#2e7d32', closed: '#c62828' };

const TicketStatusBadge: React.FC<BadgeProps> = ({ status, substatus }) => (
  <span style={{ background: colors[status] ?? '#555', color: '#fff', borderRadius: 12, padding: '2px 10px', fontSize: '0.8rem', fontWeight: 600 }}>
    {substatus ? `${status} / ${substatus}` : status}
  </span>
);
export default TicketStatusBadge;
