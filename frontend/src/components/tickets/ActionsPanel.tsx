'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ComposePanel } from './ComposePanel';
import { closeTicket, reopenTicket, assignTicket } from '@/lib/api/tickets';
import { useToast } from '@/components/ui/use-toast';
import type { Ticket } from '@/types/api';

interface ActionsPanelProps {
  ticket: Ticket;
  onMutated: () => void;
  isAdmin?: boolean;
}

export function ActionsPanel({ ticket, onMutated, isAdmin = false }: ActionsPanelProps) {
  const { toast } = useToast();
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [reopenModalOpen, setReopenModalOpen] = useState(false);
  const [closeResponse, setCloseResponse] = useState('');
  const [reopenReason, setReopenReason] = useState('');
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClose = async () => {
    setLoading(true);
    try {
      await closeTicket(ticket.id, { response: closeResponse || undefined });
      toast({ title: `Ticket #${ticket.id} closed` });
      setCloseModalOpen(false);
      setCloseResponse('');
      onMutated();
    } catch (err: unknown) {
      const e = err as { errors?: Array<{ code: string }> };
      if (e?.errors?.[0]?.code === 'ALREADY_CLOSED') {
        toast({ variant: 'destructive', title: 'Ticket is already closed' });
      } else {
        toast({ variant: 'destructive', title: 'Failed to close ticket' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReopen = async () => {
    if (!reopenReason.trim()) return;
    setLoading(true);
    try {
      await reopenTicket(ticket.id, { reason: reopenReason });
      toast({ title: `Ticket #${ticket.id} reopened` });
      setReopenModalOpen(false);
      setReopenReason('');
      onMutated();
    } catch {
      toast({ variant: 'destructive', title: 'Failed to reopen ticket' });
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    // Stub: full assignee search with workload count is Wave 3a complete UX.
    // For now wires the assign API endpoint with a placeholder assigneeId from search field.
    const parsedId = parseInt(assigneeSearch, 10);
    if (!parsedId) return;
    setLoading(true);
    try {
      await assignTicket(ticket.id, { assigneeId: parsedId });
      toast({ title: 'Ticket assigned' });
      setAssigneeSearch('');
      onMutated();
    } catch {
      toast({ variant: 'destructive', title: 'Failed to assign ticket' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside
      className="w-72 shrink-0 border-l bg-gray-50 p-4 space-y-5 overflow-y-auto"
      aria-label="Ticket actions"
    >
      {/* Status block */}
      <div>
        <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Status</p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`font-medium capitalize ${ticket.status === 'open' ? 'text-blue-600' : 'text-gray-500'}`}>
            {ticket.status}
          </span>
          {ticket.substatus && (
            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded border">{ticket.substatus.label}</span>
          )}
        </div>

        <div className="flex gap-2 mt-2">
          {ticket.status === 'open' && (
            <Button size="sm" variant="outline" onClick={() => setCloseModalOpen(true)}>
              Close Ticket
            </Button>
          )}
          {ticket.status === 'closed' && (
            <Button size="sm" variant="outline" onClick={() => setReopenModalOpen(true)}>
              Reopen
            </Button>
          )}
        </div>
      </div>

      {/* Assignee block */}
      <div>
        <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Assignee</p>
        {ticket.assignee ? (
          <p className="text-sm mb-2">{ticket.assignee.name}</p>
        ) : (
          <p className="text-sm text-gray-500 mb-2">Unassigned</p>
        )}
        <div className="flex gap-2">
          <input
            className="flex-1 text-sm border rounded px-2 py-1"
            placeholder="Staff ID or name…"
            value={assigneeSearch}
            onChange={(e) => setAssigneeSearch(e.target.value)}
            aria-label="Search assignee"
          />
          <Button size="sm" disabled={loading || !assigneeSearch} onClick={handleAssign}>
            Assign
          </Button>
        </div>
      </div>

      {/* Compose panel */}
      <div>
        <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Compose</p>
        <ComposePanel ticketId={ticket.id} onSent={onMutated} />
      </div>

      {/* Admin-only more actions */}
      {isAdmin && (
        <div className="pt-2 border-t">
          <p className="text-xs text-gray-500">Admin actions</p>
          <Button size="sm" variant="ghost" className="text-red-600 w-full justify-start mt-1">
            Delete Ticket
          </Button>
        </div>
      )}

      {/* Close modal */}
      <Dialog open={closeModalOpen} onOpenChange={setCloseModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Ticket #{ticket.id}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Optional resolution message to send to reporter:</p>
            <Textarea
              value={closeResponse}
              onChange={(e) => setCloseResponse(e.target.value)}
              placeholder="Resolution message (optional)…"
              rows={4}
              aria-label="Close resolution message"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseModalOpen(false)}>Cancel</Button>
            <Button onClick={handleClose} disabled={loading}>
              {closeResponse.trim() ? 'Close & Notify Reporter' : 'Close Silently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reopen modal */}
      <Dialog open={reopenModalOpen} onOpenChange={setReopenModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reopen Ticket #{ticket.id}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Textarea
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
              placeholder="Reason for reopening (required)…"
              rows={3}
              aria-label="Reopen reason"
            />
            {reopenReason.trim() === '' && (
              <p className="text-xs text-red-600">Reason is required to reopen</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReopenModalOpen(false)}>Cancel</Button>
            <Button onClick={handleReopen} disabled={loading || !reopenReason.trim()}>
              Reopen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
