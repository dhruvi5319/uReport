// frontend/src/app/(staff)/tickets/hooks/useTicketSearch.ts
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { searchTickets } from '@/lib/api/search';
import type { TicketListItem, TicketSearchMeta, TicketSearchParams, SearchFacets } from '@/types/search';

function paramsFromUrl(sp: URLSearchParams): TicketSearchParams {
  const arr = (key: string) => sp.getAll(key).map(Number).filter(Boolean);
  return {
    q:             sp.get('q') ?? undefined,
    status:        sp.get('status') ?? undefined,
    substatusId:   sp.has('substatusId') ? Number(sp.get('substatusId')) : undefined,
    categoryId:    arr('categoryId').length ? arr('categoryId') : undefined,
    departmentId:  arr('departmentId').length ? arr('departmentId') : undefined,
    assigneeId:    sp.has('assigneeId') ? Number(sp.get('assigneeId')) : undefined,
    reporterEmail: sp.get('reporterEmail') ?? undefined,
    dateFrom:      sp.get('dateFrom') ?? undefined,
    dateTo:        sp.get('dateTo') ?? undefined,
    sort:          (sp.get('sort') as TicketSearchParams['sort']) ?? 'date_desc',
    page:          sp.has('page') ? Number(sp.get('page')) : 1,
    perPage:       sp.has('perPage') ? Number(sp.get('perPage')) : 25,
  };
}

export function useTicketSearch() {
  const router      = useRouter();
  const pathname    = usePathname();
  const searchParams = useSearchParams();

  const [results,   setResults]   = useState<TicketListItem[]>([]);
  const [meta,      setMeta]      = useState<TicketSearchMeta | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [isSearchUnavailable, setIsSearchUnavailable] = useState(false);

  const params = paramsFromUrl(searchParams);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setParam = useCallback(
    (updates: Partial<TicketSearchParams>) => {
      const next = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        next.delete(key);
        if (value === undefined || value === null || value === '') return;
        if (Array.isArray(value)) {
          (value as number[]).forEach((v) => next.append(key, String(v)));
        } else {
          next.set(key, String(value));
        }
      });
      // Reset page when any filter changes
      if (!('page' in updates)) next.set('page', '1');
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      setIsLoading(true);
      setError(null);
      setIsSearchUnavailable(false);

      searchTickets(params, abortRef.current.signal)
        .then((res) => {
          setResults(res.data);
          setMeta(res.meta);
        })
        .catch((err: Error & { status?: number }) => {
          if (err.name === 'AbortError') return;
          if (err.status === 503) {
            setIsSearchUnavailable(true);
            setResults([]);
          } else {
            setError(err.message);
          }
        })
        .finally(() => setIsLoading(false));
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // Depend on the serialized URL params — avoids stale closure issues
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  return {
    params,
    setParam,
    results,
    facets: meta?.facets ?? null,
    meta,
    isLoading,
    error,
    isSearchUnavailable,
  };
}

// Satisfy TypeScript — SearchFacets is used in the return type via meta.facets
export type { SearchFacets };
