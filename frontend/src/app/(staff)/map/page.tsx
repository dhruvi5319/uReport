// frontend/src/app/(staff)/map/page.tsx
'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Dynamic import prevents Leaflet SSR issues — Leaflet uses window/document
const TicketMap = dynamic(() => import('./components/TicketMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm animate-pulse">
      Loading map…
    </div>
  ),
});

function MapPageContent() {
  const searchParams = useSearchParams();

  // Forward relevant filter params from /tickets page to map
  const mapFilters = {
    status:       searchParams.get('status') ?? undefined,
    categoryId:   searchParams.getAll('categoryId').map(Number).filter(Boolean),
    departmentId: searchParams.getAll('departmentId').map(Number).filter(Boolean),
  };

  // Build back-link preserving filters
  const backHref = `/tickets?${searchParams.toString()}`;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900">Ticket Map</h1>
          <Link href={backHref}>
            <Button variant="outline" size="sm" aria-label="Switch to list view">
              ≡ List View
            </Button>
          </Link>
        </div>

        <TicketMap
          initialFilters={mapFilters}
          height="calc(100vh - 160px)"
        />

        <p className="mt-2 text-xs text-gray-400 text-center">
          Map tiles © OpenStreetMap contributors. Clusters update on pan/zoom.
          At high zoom, individual ticket pins are shown (click for details).
        </p>
      </div>
    </main>
  );
}

export default function MapPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading map…</div>}>
      <MapPageContent />
    </Suspense>
  );
}
