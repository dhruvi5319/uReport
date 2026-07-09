import { motion, AnimatePresence } from 'framer-motion';
import { itemVariants } from '@/lib/animations';
import { Badge } from '@/components/ui/badge';
import type { FilterState } from '@/types/ticket';

interface FilterChipsProps {
  filterState: FilterState;
  onRemove: (key: keyof FilterState) => void;
}

interface Chip {
  key: keyof FilterState;
  label: string;
}

function deriveChips(filterState: FilterState): Chip[] {
  const chips: Chip[] = [];

  const labelMap: Partial<Record<keyof FilterState, string>> = {
    q: 'Search',
    status: 'Status',
    substatusId: 'Substatus',
    categoryId: 'Category',
    departmentId: 'Department',
    assignedPersonId: 'Assignee',
    issueTypeId: 'Issue Type',
    dateFrom: 'Date from',
    dateTo: 'Date to',
  };

  const filterKeys: (keyof FilterState)[] = [
    'q', 'status', 'substatusId', 'categoryId', 'departmentId',
    'assignedPersonId', 'issueTypeId', 'dateFrom', 'dateTo',
  ];

  for (const key of filterKeys) {
    const val = filterState[key];
    if (val !== undefined && val !== '' && val !== null) {
      const prefix = labelMap[key] ?? key;
      chips.push({ key, label: `${prefix}: ${val}` });
    }
  }

  return chips;
}

export function FilterChips({ filterState, onRemove }: FilterChipsProps) {
  const chips = deriveChips(filterState);
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2" role="list" aria-label="Active filters">
      <AnimatePresence>
        {chips.map(({ key, label }) => (
          <motion.div
            key={key}
            variants={itemVariants}
            initial="initial"
            animate="animate"
            exit="initial"
            role="listitem"
          >
            <Badge variant="secondary" className="flex items-center gap-1">
              {label}
              <button
                aria-label={`Remove ${label} filter`}
                onClick={() => onRemove(key)}
                className="ml-1 hover:text-destructive"
              >
                ×
              </button>
            </Badge>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
