import { create } from 'zustand';
import type { Ticket, TicketSearchParams, PagedResult } from '@/types/ticket';

interface TicketState {
  result: PagedResult<Ticket> | null;
  filters: TicketSearchParams;
  loading: boolean;
  error: string | null;
  setResult: (r: PagedResult<Ticket> | null) => void;
  setFilters: (f: TicketSearchParams) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
}

export const useTicketStore = create<TicketState>(set => ({
  result: null,
  filters: { page: 1, limit: 25 },
  loading: false,
  error: null,
  setResult: result => set({ result }),
  setFilters: filters => set({ filters }),
  setLoading: loading => set({ loading }),
  setError: error => set({ error }),
}));
