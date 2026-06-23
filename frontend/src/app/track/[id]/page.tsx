'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import TicketStatusCard from '@/components/track/TicketStatusCard';
import PublicHistory from '@/components/track/PublicHistory';

interface PublicTicket {
  id: number;
  title: string;
  categoryName?: string;
  status: 'open' | 'closed';
  substatusLabel?: string;
  departmentName?: string;
  datetimeUpdated: string;
  address?: string;
}

interface PublicAction {
  id: number;
  type: string;
  visibility: string;
  datetimeCreated: string;
  payload?: Record<string, unknown>;
}

export default function TrackPage() {
  const params = useParams();
  const id = params?.id as string;
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '';

  const [ticket, setTicket] = useState<PublicTicket | null>(null);
  const [history, setHistory] = useState<PublicAction[]>([]);
  const [error, setError] = useState<'not_found' | 'forbidden' | 'error' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${apiBase}/api/tickets/${id}`, {
          // No auth cookie — public access
          credentials: 'omit',
        });

        if (res.status === 404) {
          setError('not_found');
          setLoading(false);
          return;
        }
        if (res.status === 403) {
          setError('forbidden');
          setLoading(false);
          return;
        }
        if (!res.ok) {
          setError('error');
          setLoading(false);
          return;
        }

        const data = await res.json();
        setTicket(data.data);

        // Fetch public history (internal actions filtered by API for anonymous callers)
        const histRes = await fetch(`${apiBase}/api/tickets/${id}/history`, {
          credentials: 'omit',
        });
        if (histRes.ok) {
          const histData = await histRes.json();
          // Only show external/public visibility actions
          const publicActions = (histData.data ?? []).filter(
            (a: PublicAction) =>
              a.visibility === 'external' || a.type === 'open'
          );
          setHistory(publicActions);
        }
      } catch {
        setError('error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, apiBase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error === 'not_found') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center gap-4">
        <h1 className="text-xl font-semibold">Report not found</h1>
        <p className="text-muted-foreground">
          Check your ticket number and try again.
        </p>
        <Link href="/submit" className="underline text-sm">
          Submit a new report
        </Link>
      </div>
    );
  }

  if (error === 'forbidden') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center gap-4">
        <h1 className="text-xl font-semibold">Report not publicly viewable</h1>
        <p className="text-muted-foreground">
          This report is not available for public viewing.
        </p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center gap-4">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="text-muted-foreground">Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-4 py-3 border-b flex items-center gap-3">
        <h2 className="font-semibold text-base">Track Report</h2>
      </header>

      <main className="flex-1 px-4 pt-6 pb-12 max-w-lg mx-auto w-full flex flex-col gap-6">
        <TicketStatusCard ticket={ticket} />
        <PublicHistory actions={history} />
        <Link
          href="/submit"
          className="text-sm text-center underline text-muted-foreground"
        >
          Submit another report
        </Link>
      </main>
    </div>
  );
}
