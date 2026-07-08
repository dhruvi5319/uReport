import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface Substatus {
  id: number;
  name: string;
}

interface CloseDialogProps {
  ticketId: string;
}

export function CloseDialog({ ticketId }: CloseDialogProps) {
  const [open, setOpen] = useState(false);
  const [substatusId, setSubstatusId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const queryClient = useQueryClient();

  // Fetch substatus options
  const { data: substatuses } = useQuery<Substatus[]>({
    queryKey: ['substatuses'],
    queryFn: () => fetch('/api/substatus').then(r => r.json()),
  });

  const closeMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/tickets/${ticketId}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ substatusId: Number(substatusId), notes }),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['ticket-history', ticketId] });
      setOpen(false);
      setSubstatusId('');
      setNotes('');
    },
  });

  const canSubmit = substatusId !== ''; // substatus is REQUIRED

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">Close Case</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Close Case #{ticketId}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium">Resolution *</label>
            <Select value={substatusId} onValueChange={setSubstatusId}>
              <SelectTrigger>
                <SelectValue placeholder="Select resolution..." />
              </SelectTrigger>
              <SelectContent>
                {substatuses?.map((s: Substatus) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {substatusId === '' && (
              <p className="text-xs text-destructive mt-1">Resolution is required</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">Notes (optional)</label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={!canSubmit || closeMutation.isPending}
            onClick={() => closeMutation.mutate()}
          >
            {closeMutation.isPending ? 'Closing...' : 'Confirm Close'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
