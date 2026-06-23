'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

type StatusValue = '' | 'open' | 'closed';

export function StatusFilter() {
  const router = useRouter();
  const params = useSearchParams();
  const current = (params.get('status') ?? '') as StatusValue;

  const setStatus = (value: StatusValue) => {
    const next = new URLSearchParams(params.toString());
    if (value) {
      next.set('status', value);
    } else {
      next.delete('status');
    }
    router.push(`/tickets?${next.toString()}`);
  };

  const options: { label: string; value: StatusValue }[] = [
    { label: 'All', value: '' },
    { label: 'Open', value: 'open' },
    { label: 'Closed', value: 'closed' },
  ];

  return (
    <div className="flex gap-2" role="group" aria-label="Filter by status">
      {options.map((opt) => (
        <Button
          key={opt.value}
          variant={current === opt.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatus(opt.value)}
          aria-pressed={current === opt.value}
        >
          {opt.label}
        </Button>
      ))}
    </div>
  );
}
