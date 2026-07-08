// Stub component - full implementation in Phase 8 Case List plan
interface BulkActionBarProps {
  selectedIds?: Set<number>;
  onSuccess?: () => void;
}

export function BulkActionBar({ selectedIds = new Set<number>(), onSuccess: _onSuccess }: BulkActionBarProps) {
  if (selectedIds.size === 0) return null;
  return (
    <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-md text-sm">
      <span>{selectedIds.size} selected</span>
    </div>
  );
}

export default BulkActionBar;
