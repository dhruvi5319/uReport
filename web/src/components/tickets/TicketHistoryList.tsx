import React from 'react';
import type { TicketHistoryEntry } from '@/types/ticket';

interface Props { entries: TicketHistoryEntry[]; }

const TicketHistoryList: React.FC<Props> = ({ entries }) => {
  if (!entries.length) return <p style={{ color: '#666' }}>No history entries.</p>;
  return (
    <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {entries.map(entry => (
        <li key={entry.id} style={{ borderLeft: '3px solid #1a73e8', marginBottom: '0.75rem', paddingLeft: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{entry.actionName}</span>
            <span style={{ fontSize: '0.8rem', color: '#666' }}>
              {new Date(entry.enteredDate).toLocaleString()}
            </span>
          </div>
          <div style={{ fontSize: '0.9rem', color: '#333', marginBottom: 2 }}>
            {entry.renderedDescription}
          </div>
          {entry.enteredByPersonName && (
            <div style={{ fontSize: '0.8rem', color: '#666' }}>By: {entry.enteredByPersonName}</div>
          )}
          {entry.notes && (
            <div style={{ fontSize: '0.85rem', fontStyle: 'italic', color: '#555', marginTop: 4, borderLeft: '2px solid #ccc', paddingLeft: '0.5rem' }}>{entry.notes}</div>
          )}
          {entry.sentNotifications && (
            <div style={{ fontSize: '0.75rem', color: '#888', marginTop: 2 }}>Notified: {entry.sentNotifications}</div>
          )}
        </li>
      ))}
    </ol>
  );
};
export default TicketHistoryList;
