// frontend/src/components/reports/DownloadCsvButton.tsx
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button'; // shadcn/ui

interface Props {
  href: string; // e.g. /api/reports/activity?dateFrom=...&format=csv
  filename?: string;
  label?: string;
}

export function DownloadCsvButton({ href, filename = 'report.csv', label = 'Download CSV' }: Props) {
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setLoading(true);
    // Trigger via anchor to get browser's native file download
    const a = document.createElement('a');
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={loading}
      aria-label={loading ? 'Preparing CSV download...' : label}
    >
      {loading ? (
        <>
          <span className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Preparing CSV...
        </>
      ) : (
        <>📥 {label}</>
      )}
    </Button>
  );
}
