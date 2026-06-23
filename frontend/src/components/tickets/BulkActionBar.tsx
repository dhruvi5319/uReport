'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { bulkAssign } from '@/lib/api/tickets';
import { useToast } from '@/components/ui/use-toast';

interface BulkActionBarProps {
  selectedIds: number[];
  onClear: () => void;
  onComplete: () => void;
}

export function BulkActionBar({ selectedIds, onClear, onComplete }: BulkActionBarProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  if (selectedIds.length === 0) return null;

  const handleBulkAssign = async (assigneeId: number) => {
    setLoading(true);
    try {
      const res = await bulkAssign({ ticketIds: selectedIds, assigneeId });
      toast({
        title: `${res.data.reassigned} ticket${res.data.reassigned !== 1 ? 's' : ''} reassigned`,
        description: res.data.failed.length > 0
          ? `${res.data.failed.length} failed to reassign`
          : undefined,
      });
      onClear();
      onComplete();
    } catch {
      toast({ variant: 'destructive', title: 'Bulk assign failed', description: 'Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg px-4 py-3 flex items-center gap-4"
      role="toolbar"
      aria-label="Bulk actions"
    >
      <span className="text-sm font-medium">
        {selectedIds.length} ticket{selectedIds.length !== 1 ? 's' : ''} selected
      </span>
      <Button variant="outline" size="sm" disabled={loading} onClick={() => {
        // Placeholder: in Wave 3a assignee search dialog would open here
        // For now provide stub to satisfy bulk-assign wiring
        handleBulkAssign(0);
      }}>
        Assign to…
      </Button>
      <Button variant="ghost" size="sm" onClick={onClear} aria-label="Clear selection">
        ✕
      </Button>
    </div>
  );
}
