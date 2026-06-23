'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Merge, Search, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface TicketSummary {
  id: number;
  title: string;
  status: string;
  departmentId?: number;
  datetimeOpened: string;
  categoryId?: number;
}

export interface MergeDialogProps {
  sourceTicketId: number;
  sourceTicketTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMergeSuccess: () => void;
}

type Step = 'search' | 'preview' | 'success';

export function MergeDialog({
  sourceTicketId,
  sourceTicketTitle,
  open,
  onOpenChange,
  onMergeSuccess,
}: MergeDialogProps) {
  const [step, setStep] = useState<Step>('search');
  const [query, setQuery] = useState('');
  const [candidates, setCandidates] = useState<TicketSummary[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<TicketSummary | null>(null);
  const [mergeLoading, setMergeLoading] = useState(false);
  const [mergeError, setMergeError] = useState('');
  const [mergeResult, setMergeResult] = useState<{
    targetTicketId: number;
    mergedAt: string;
  } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setStep('search');
      setQuery('');
      setCandidates([]);
      setSelectedTarget(null);
      setMergeError('');
      setMergeResult(null);
    }
  }, [open]);

  const searchCandidates = useCallback(
    async (q: string) => {
      setSearchLoading(true);
      try {
        const params = new URLSearchParams({ q, page: '1', perPage: '25' });
        const res = await fetch(
          `/api/tickets/${sourceTicketId}/merge-candidates?${params}`,
          { credentials: 'include' }
        );
        if (!res.ok) return;
        const json = await res.json();
        setCandidates(json.data ?? []);
      } finally {
        setSearchLoading(false);
      }
    },
    [sourceTicketId]
  );

  // Initial load (show recent open tickets)
  useEffect(() => {
    if (open && step === 'search') {
      searchCandidates('');
    }
  }, [open, step, searchCandidates]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchCandidates(value), 300);
  };

  const handleSelectCandidate = (ticket: TicketSummary) => {
    setSelectedTarget(ticket);
    setStep('preview');
  };

  const handleConfirmMerge = async () => {
    if (!selectedTarget) return;
    setMergeLoading(true);
    setMergeError('');
    try {
      const res = await fetch(`/api/tickets/${sourceTicketId}/merge`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetTicketId: selectedTarget.id }),
      });
      const json = await res.json();
      if (!res.ok) {
        const err = json.errors?.[0];
        const code = err?.code ?? '';
        const message =
          code === 'SELF_MERGE'
            ? 'Cannot merge a ticket into itself.'
            : code === 'ALREADY_MERGED'
              ? 'This ticket has already been merged.'
              : code === 'TARGET_CLOSED'
                ? 'Cannot merge into a closed ticket.'
                : code === 'TARGET_MERGED'
                  ? 'Cannot merge into a ticket that is already merged.'
                  : (err?.message ?? 'Merge failed.');
        setMergeError(message);
        return;
      }
      setMergeResult({
        targetTicketId: json.data.targetTicketId,
        mergedAt: json.data.mergedAt,
      });
      setStep('success');
      onMergeSuccess();
      toast.success(
        `Ticket #${sourceTicketId} merged into #${json.data.targetTicketId}`
      );
    } finally {
      setMergeLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl"
        aria-labelledby="merge-dialog-title"
        aria-describedby="merge-dialog-description"
      >
        <DialogHeader>
          <DialogTitle id="merge-dialog-title">
            <Merge className="inline h-4 w-4 mr-2" aria-hidden="true" />
            Merge Ticket #{sourceTicketId}
          </DialogTitle>
          <DialogDescription id="merge-dialog-description">
            {step === 'search'
              ? 'Search for the canonical ticket to merge this one into. The source ticket will be closed.'
              : step === 'preview'
                ? 'Review both tickets before confirming the merge.'
                : 'Merge complete.'}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Search */}
        {step === 'search' && (
          <div className="space-y-3">
            <div className="relative">
              <Search
                className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
                aria-hidden="true"
              />
              <Input
                placeholder="Search by ticket title or description…"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                className="pl-9"
                aria-label="Search for a ticket to merge into"
                aria-busy={searchLoading}
              />
            </div>
            <div
              role="listbox"
              aria-label="Merge target candidates"
              className="max-h-72 overflow-y-auto border border-gray-200 rounded-md divide-y divide-gray-100"
            >
              {searchLoading && (
                <div
                  className="px-3 py-4 text-sm text-gray-500"
                  role="status"
                  aria-live="polite"
                >
                  Searching…
                </div>
              )}
              {!searchLoading && candidates.length === 0 && (
                <div className="px-3 py-4 text-sm text-gray-500">
                  No open tickets found{query ? ` matching "${query}"` : ''}.
                </div>
              )}
              {candidates.map((t) => (
                <button
                  key={t.id}
                  role="option"
                  aria-selected={false}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none text-sm"
                  onClick={() => handleSelectCandidate(t)}
                >
                  <span className="font-medium">#{t.id}</span>
                  <span className="ml-2">{t.title}</span>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {t.status}
                  </Badge>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Side-by-side preview */}
        {step === 'preview' && selectedTarget && (
          <div>
            <div className="grid grid-cols-2 gap-4 my-2">
              {/* Source ticket */}
              <div className="rounded-md border border-red-200 p-3 space-y-1 bg-red-50">
                <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
                  Source ticket (will be closed)
                </p>
                <p className="font-medium text-sm">
                  #{sourceTicketId}: {sourceTicketTitle}
                </p>
              </div>
              {/* Target ticket */}
              <div className="rounded-md border border-gray-200 p-3 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Target ticket (canonical)
                </p>
                <p className="font-medium text-sm">
                  #{selectedTarget.id}: {selectedTarget.title}
                </p>
                <Badge variant="outline" className="text-xs">
                  {selectedTarget.status}
                </Badge>
              </div>
            </div>
            {mergeError && (
              <p
                className="text-sm text-red-600 mt-2"
                role="alert"
                aria-live="assertive"
              >
                {mergeError}
              </p>
            )}
          </div>
        )}

        {/* Step 3: Success */}
        {step === 'success' && mergeResult && (
          <div className="py-4 text-center space-y-3">
            <p className="text-sm">
              Ticket #{sourceTicketId} has been merged into{' '}
              <span className="font-semibold">#{mergeResult.targetTicketId}</span>.
            </p>
            <Link
              href={`/tickets/${mergeResult.targetTicketId}`}
              className="inline-flex items-center text-sm text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            >
              View ticket #{mergeResult.targetTicketId}
              <ArrowRight className="h-4 w-4 ml-1" aria-hidden="true" />
            </Link>
          </div>
        )}

        <DialogFooter>
          {step === 'search' && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          )}
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('search')}>
                ← Back
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmMerge}
                disabled={mergeLoading}
                aria-busy={mergeLoading}
              >
                {mergeLoading ? 'Merging…' : 'Confirm Merge'}
              </Button>
            </>
          )}
          {step === 'success' && (
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
