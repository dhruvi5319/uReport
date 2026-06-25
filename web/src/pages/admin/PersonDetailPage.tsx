// F5: US-5.1, US-5.2, US-5.4 — Person detail with email/phone/address sub-forms
import React, { useState, useEffect } from 'react';
import { Navigate, useParams, Link } from 'react-router-dom';
import { usePermission } from '@/hooks/usePermission';
import { usePeople } from '@/hooks/useAdminApi';
import { apiClient } from '@/api/client';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorBanner from '@/components/common/ErrorBanner';
import PersonForm from '@/components/admin/PersonForm';
import PersonEmailsForm from '@/components/admin/PersonEmailsForm';
import PersonPhonesForm from '@/components/admin/PersonPhonesForm';
import PersonAddressesForm from '@/components/admin/PersonAddressesForm';
import type { Person } from '@/types/admin';

interface Ticket { id: number; description: string; status: string; enteredDate: string; }

const PersonDetailPage: React.FC = () => {
  const authorized = usePermission('staff');
  if (!authorized) return <Navigate to="/" replace />;

  const { id } = useParams<{ id: string }>();
  const {
    getById, update,
    addEmail, updateEmail, removeEmail,
    addPhone, updatePhone, removePhone,
    addAddress, updateAddress, removeAddress,
  } = usePeople();

  const [person, setPerson] = useState<Person | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [emailsOpen, setEmailsOpen] = useState(true);
  const [phonesOpen, setPhonesOpen] = useState(false);
  const [addressesOpen, setAddressesOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    Promise.all([
      getById(Number(id)),
      apiClient.get(`/people/${id}/tickets`).then(r => r.data).catch(() => []),
    ])
      .then(([p, t]) => { setPerson(p); setTickets(t.content ?? t); })
      .catch(e => setError(e.response?.data?.message ?? 'Failed to load person'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async (data: Partial<Person>) => {
    if (!id) return;
    setSaveError(null);
    setSaved(false);
    try {
      const updated = await update(Number(id), data);
      setPerson(updated);
      setSaved(true);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setSaveError(err.response?.data?.message ?? 'Failed to save');
    }
  };

  const refreshPerson = async () => {
    if (!id) return;
    const p = await getById(Number(id));
    setPerson(p);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div style={{ padding: '1.5rem' }}><ErrorBanner error={error} /></div>;
  if (!person) return null;

  const personName = [person.firstname, person.middlename, person.lastname].filter(Boolean).join(' ');

  return (
    <div style={{ padding: '1.5rem', maxWidth: 900 }}>
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/admin/people" style={{ color: '#2563eb', textDecoration: 'none', fontSize: '0.875rem' }}>
          ← Back to People
        </Link>
      </div>

      <h1 style={{ marginBottom: '1.5rem' }}>{personName}</h1>

      {/* Person edit form */}
      <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '1.25rem', marginBottom: '1.5rem' }}>
        <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Person Details</h2>
        {saveError && <ErrorBanner error={saveError} />}
        {saved && <p style={{ color: '#16a34a', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Saved ✓</p>}
        <PersonForm
          initialValues={person}
          onSubmit={handleSave}
          onCancel={() => { setSaveError(null); setSaved(false); }}
        />
      </div>

      {/* Associated Tickets */}
      <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '1.25rem', marginBottom: '1.5rem' }}>
        <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>
          Associated Tickets
          {' '}
          <Link
            to={`/tickets?reportedByPerson_id=${id}`}
            style={{ fontSize: '0.8rem', color: '#2563eb' }}
          >
            View all
          </Link>
        </h2>
        {tickets.length === 0 ? (
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>No tickets associated.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '0.4rem' }}>ID</th>
                <th style={{ textAlign: 'left', padding: '0.4rem' }}>Description</th>
                <th style={{ textAlign: 'left', padding: '0.4rem' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '0.4rem' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t: Ticket) => (
                <tr key={t.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '0.4rem' }}>
                    <Link to={`/tickets/${t.id}`} style={{ color: '#2563eb' }}>#{t.id}</Link>
                  </td>
                  <td style={{ padding: '0.4rem', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.description}
                  </td>
                  <td style={{ padding: '0.4rem' }}>{t.status}</td>
                  <td style={{ padding: '0.4rem', color: '#6b7280' }}>{t.enteredDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Emails */}
      <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '1.25rem', marginBottom: '1rem' }}>
        <button
          onClick={() => setEmailsOpen(o => !o)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '1rem', padding: 0 }}
        >
          {emailsOpen ? '▾' : '▸'} Emails
        </button>
        {emailsOpen && (
          <div style={{ marginTop: '0.75rem' }}>
            <PersonEmailsForm
              personId={Number(id)}
              emails={person.emails ?? []}
              onAdd={async body => { await addEmail(Number(id), body); await refreshPerson(); }}
              onUpdate={async (emailId, body) => { await updateEmail(Number(id), emailId, body); await refreshPerson(); }}
              onRemove={async emailId => { await removeEmail(Number(id), emailId); await refreshPerson(); }}
            />
          </div>
        )}
      </div>

      {/* Phones */}
      <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '1.25rem', marginBottom: '1rem' }}>
        <button
          onClick={() => setPhonesOpen(o => !o)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '1rem', padding: 0 }}
        >
          {phonesOpen ? '▾' : '▸'} Phones
        </button>
        {phonesOpen && (
          <div style={{ marginTop: '0.75rem' }}>
            <PersonPhonesForm
              personId={Number(id)}
              phones={person.phones ?? []}
              onAdd={async body => { await addPhone(Number(id), body); await refreshPerson(); }}
              onUpdate={async (phoneId, body) => { await updatePhone(Number(id), phoneId, body); await refreshPerson(); }}
              onRemove={async phoneId => { await removePhone(Number(id), phoneId); await refreshPerson(); }}
            />
          </div>
        )}
      </div>

      {/* Addresses */}
      <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '1.25rem', marginBottom: '1rem' }}>
        <button
          onClick={() => setAddressesOpen(o => !o)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '1rem', padding: 0 }}
        >
          {addressesOpen ? '▾' : '▸'} Addresses
        </button>
        {addressesOpen && (
          <div style={{ marginTop: '0.75rem' }}>
            <PersonAddressesForm
              personId={Number(id)}
              addresses={person.addresses ?? []}
              onAdd={async body => { await addAddress(Number(id), body); await refreshPerson(); }}
              onUpdate={async (addrId, body) => { await updateAddress(Number(id), addrId, body); await refreshPerson(); }}
              onRemove={async addrId => { await removeAddress(Number(id), addrId); await refreshPerson(); }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonDetailPage;
