import React from 'react';
import type { TicketSearchParams } from '@/types/ticket';

interface Props {
  filters: TicketSearchParams;
  onFilterChange: (params: TicketSearchParams) => void;
}

const TicketSearchFilters: React.FC<Props> = ({ filters, onFilterChange }) => {
  const update = (field: keyof TicketSearchParams, value: string | number | undefined) =>
    onFilterChange({ ...filters, [field]: value || undefined, page: 1 });

  return (
    <form
      style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 6, padding: '1rem', marginBottom: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}
      onSubmit={e => e.preventDefault()}
    >
      <div>
        <label htmlFor="q" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 2 }}>Keyword</label>
        <input id="q" type="text" value={filters.q ?? ''} placeholder="Search tickets…"
          onChange={e => update('q', e.target.value)}
          style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
      </div>

      <div>
        <label htmlFor="status" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 2 }}>Status</label>
        <select id="status" value={filters.status ?? ''} onChange={e => update('status', e.target.value)}
          style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }}>
          <option value="">All</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <div>
        <label htmlFor="categoryId" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 2 }}>Category ID</label>
        <input id="categoryId" type="number" value={filters.categoryId ?? ''} placeholder="Category ID"
          onChange={e => update('categoryId', e.target.value ? Number(e.target.value) : undefined)}
          style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
      </div>

      <div>
        <label htmlFor="departmentId" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 2 }}>Department ID</label>
        <input id="departmentId" type="number" value={filters.departmentId ?? ''} placeholder="Department ID"
          onChange={e => update('departmentId', e.target.value ? Number(e.target.value) : undefined)}
          style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
      </div>

      <div>
        <label htmlFor="assignedPersonId" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 2 }}>Assigned Person ID</label>
        <input id="assignedPersonId" type="number" value={filters.assignedPersonId ?? ''} placeholder="Person ID"
          onChange={e => update('assignedPersonId', e.target.value ? Number(e.target.value) : undefined)}
          style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
      </div>

      <div>
        <label htmlFor="substatusId" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 2 }}>Substatus ID</label>
        <input id="substatusId" type="number" value={filters.substatusId ?? ''} placeholder="Substatus ID"
          onChange={e => update('substatusId', e.target.value ? Number(e.target.value) : undefined)}
          style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
      </div>

      <div>
        <label htmlFor="contactMethodId" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 2 }}>Contact Method ID</label>
        <input id="contactMethodId" type="number" value={filters.contactMethodId ?? ''} placeholder="1–4"
          onChange={e => update('contactMethodId', e.target.value ? Number(e.target.value) : undefined)}
          style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
      </div>

      <div>
        <label htmlFor="enteredDateFrom" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 2 }}>Entered Date From</label>
        <input id="enteredDateFrom" type="date" value={filters.enteredDateFrom ?? ''}
          onChange={e => update('enteredDateFrom', e.target.value)}
          style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
      </div>

      <div>
        <label htmlFor="enteredDateTo" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 2 }}>Entered Date To</label>
        <input id="enteredDateTo" type="date" value={filters.enteredDateTo ?? ''}
          onChange={e => update('enteredDateTo', e.target.value)}
          style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
      </div>

      <div>
        <label htmlFor="city" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 2 }}>City</label>
        <input id="city" type="text" value={filters.city ?? ''}
          onChange={e => update('city', e.target.value)}
          style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
      </div>

      <div>
        <label htmlFor="zip" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: 2 }}>Zip</label>
        <input id="zip" type="text" value={filters.zip ?? ''}
          onChange={e => update('zip', e.target.value)}
          style={{ width: '100%', padding: '0.4rem 0.6rem', border: '1px solid #ccc', borderRadius: 4, boxSizing: 'border-box' }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end' }}>
        <button type="button" onClick={() => onFilterChange({ page: 1, limit: 25 })}
          style={{ padding: '0.4rem 1rem', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', background: '#fff' }}>
          Clear Filters
        </button>
      </div>
    </form>
  );
};
export default TicketSearchFilters;
