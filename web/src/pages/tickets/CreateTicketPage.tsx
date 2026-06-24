import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketsApi } from '@/api/tickets';
import ErrorBanner from '@/components/common/ErrorBanner';

const CreateTicketPage: React.FC = () => {
  const navigate = useNavigate();
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation]       = useState('');
  const [city, setCity]               = useState('');
  const [zip, setZip]                 = useState('');
  const [error, setError]             = useState<string | null>(null);
  const [submitting, setSubmitting]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || !description.trim()) {
      setError('Category ID and description are required.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const ticket = await ticketsApi.create({
        categoryId: Number(categoryId),
        description: description.trim(),
        location: location || undefined,
        city: city || undefined,
        zip: zip || undefined,
      });
      navigate(`/tickets/${ticket.id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data;
      setError(msg?.message ?? msg?.error ?? 'Failed to create ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 680 }}>
      <h1 style={{ fontSize: '1.4rem', margin: '0 0 1.5rem' }}>Create New Ticket</h1>
      <ErrorBanner error={error} />

      <form onSubmit={handleSubmit} style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 6, padding: '1.5rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="categoryId" style={{ display: 'block', fontWeight: 500, marginBottom: 4 }}>Category ID *</label>
          <input
            id="categoryId" type="number" value={categoryId} required
            onChange={e => setCategoryId(e.target.value)}
            style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }}
          />
          <small style={{ color: '#666' }}>Enter the numeric category ID (visible in Categories admin page)</small>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="description" style={{ display: 'block', fontWeight: 500, marginBottom: 4 }}>Description *</label>
          <textarea
            id="description" value={description} required rows={5}
            onChange={e => setDescription(e.target.value)}
            style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box', resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div>
            <label htmlFor="location" style={{ display: 'block', fontWeight: 500, marginBottom: 4 }}>Address</label>
            <input id="location" type="text" value={location} onChange={e => setLocation(e.target.value)}
              style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
          </div>
          <div>
            <label htmlFor="city" style={{ display: 'block', fontWeight: 500, marginBottom: 4 }}>City</label>
            <input id="city" type="text" value={city} onChange={e => setCity(e.target.value)}
              style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
          </div>
          <div>
            <label htmlFor="zip" style={{ display: 'block', fontWeight: 500, marginBottom: 4 }}>Zip</label>
            <input id="zip" type="text" value={zip} onChange={e => setZip(e.target.value)}
              style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="submit" disabled={submitting}
            style={{ padding: '0.6rem 1.5rem', background: '#1a73e8', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 600, cursor: 'pointer' }}>
            {submitting ? 'Creating…' : 'Create Ticket'}
          </button>
          <button type="button" onClick={() => navigate('/tickets')}
            style={{ padding: '0.6rem 1.5rem', background: '#fff', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
export default CreateTicketPage;
