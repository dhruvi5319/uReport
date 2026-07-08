// Stub component - full implementation in Phase 8 Case List plan
interface EmptyStateProps {
  title?: string;
  description?: string;
  onClearFilters?: () => void;
}

export function EmptyState({ title = 'No cases found', description, onClearFilters }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-lg font-medium text-foreground">{title}</p>
      {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      {onClearFilters && (
        <button
          onClick={onClearFilters}
          className="mt-3 text-sm text-primary hover:underline"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

export default EmptyState;
