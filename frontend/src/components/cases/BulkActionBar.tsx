import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface BulkActionBarProps {
  selectedIds: Set<number>;
  onSuccess: () => void;
}

type BulkAction = 'assign' | 'change_status' | 'close' | null;

const SUBSTATUS_OPTIONS = [
  { id: 1, name: 'Resolved' },
  { id: 2, name: 'Duplicate' },
  { id: 3, name: 'Bogus' },
];

export function BulkActionBar({ selectedIds, onSuccess }: BulkActionBarProps) {
  const queryClient = useQueryClient();
  const [action, setAction] = useState<BulkAction>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('open');
  const [selectedSubstatusId, setSelectedSubstatusId] = useState<string>('');

  const bulkMutation = useMutation({
    mutationFn: (payload: { action: string; payload: Record<string, unknown> }) =>
      fetch('/api/tickets/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketIds: Array.from(selectedIds),
          action: payload.action,
          payload: payload.payload,
        }),
      }).then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      onSuccess(); // clear selection
      setAction(null);
    },
  });

  function confirmAction() {
    if (action === 'close') {
      if (!selectedSubstatusId) return;
      bulkMutation.mutate({
        action: 'close',
        payload: { substatusId: Number(selectedSubstatusId) },
      });
    } else if (action === 'change_status') {
      bulkMutation.mutate({
        action: 'change_status',
        payload: { status: selectedStatus },
      });
    }
  }

  return (
    <>
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-4 bg-muted p-3 rounded-md">
              <span className="text-sm font-medium">
                {selectedIds.size} case{selectedIds.size !== 1 ? 's' : ''} selected
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAction('assign')}
                disabled={bulkMutation.isPending}
              >
                Assign
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAction('change_status')}
                disabled={bulkMutation.isPending}
              >
                Change Status
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setAction('close')}
                disabled={bulkMutation.isPending}
              >
                Close
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Change Status Dialog */}
      <Dialog open={action === 'change_status'} onOpenChange={open => !open && setAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Status</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger aria-label="Select status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAction(null)}>
              Cancel
            </Button>
            <Button
              onClick={confirmAction}
              disabled={bulkMutation.isPending}
            >
              {bulkMutation.isPending ? 'Updating…' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Dialog */}
      <Dialog open={action === 'close'} onOpenChange={open => !open && setAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Close {selectedIds.size} case{selectedIds.size !== 1 ? 's' : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">
              Substatus (required)
            </label>
            <Select value={selectedSubstatusId} onValueChange={setSelectedSubstatusId}>
              <SelectTrigger aria-label="Select substatus">
                <SelectValue placeholder="Select substatus…" />
              </SelectTrigger>
              <SelectContent>
                {SUBSTATUS_OPTIONS.map(s => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAction(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmAction}
              disabled={bulkMutation.isPending || !selectedSubstatusId}
            >
              {bulkMutation.isPending ? 'Closing…' : 'Close Cases'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={action === 'assign'} onOpenChange={open => !open && setAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Assign {selectedIds.size} case{selectedIds.size !== 1 ? 's' : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Assign feature requires person selection. Use the individual case view for now.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAction(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default BulkActionBar;
