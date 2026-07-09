import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchInput({ value, onChange }: SearchInputProps) {
  const [local, setLocal] = useState(value);

  // Sync local state when URL param changes externally (e.g. clear filters)
  useEffect(() => {
    setLocal(value);
  }, [value]);

  // Debounce: notify parent after 300ms idle
  const debounced = useDebounce(local, 300);
  useEffect(() => {
    if (debounced !== value) onChange(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <Input
      type="search"
      placeholder="Search cases..."
      value={local}
      onChange={e => setLocal(e.target.value)}
      aria-label="Search cases"
      className="w-64"
    />
  );
}
