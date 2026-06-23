// frontend/src/app/(staff)/map/components/TicketMap.tsx
'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { ClusterLayer } from './ClusterLayer';
import { TicketPinLayer } from './TicketPinLayer';
import { useClusterData } from '../hooks/useClusterData';
import type { ClusterParams } from '@/types/geo';

interface TicketMapProps {
  initialFilters?: Omit<ClusterParams, 'bbox' | 'zoom'>;
  height?: string;
}

function BboxTracker({
  onBoundsChange,
}: {
  onBoundsChange: (bbox: string, zoom: number) => void;
}) {
  const map = useMapEvents({
    moveend: () => {
      const b = map.getBounds();
      const bbox = [
        b.getSouth().toFixed(6),
        b.getWest().toFixed(6),
        b.getNorth().toFixed(6),
        b.getEast().toFixed(6),
      ].join(',');
      onBoundsChange(bbox, map.getZoom());
    },
  });

  // Trigger on mount
  const fired = useRef(false);
  useEffect(() => {
    if (!fired.current) {
      fired.current = true;
      const b = map.getBounds();
      const bbox = [
        b.getSouth().toFixed(6),
        b.getWest().toFixed(6),
        b.getNorth().toFixed(6),
        b.getEast().toFixed(6),
      ].join(',');
      onBoundsChange(bbox, map.getZoom());
    }
  });

  return null;
}

export default function TicketMap({ initialFilters = {}, height = '600px' }: TicketMapProps) {
  const { clusters, pins, showPins, isLoading, error, refetch } = useClusterData(initialFilters);

  return (
    <div className="relative" style={{ height }}>
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 text-xs text-gray-600 px-3 py-1 rounded-full shadow border">
          Loading map data…
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div
          role="alert"
          className="absolute top-2 left-1/2 -translate-x-1/2 z-[1000] bg-red-50 text-xs text-red-700 px-3 py-1 rounded-full shadow border border-red-200"
        >
          Map data temporarily unavailable
        </div>
      )}

      <MapContainer
        center={[39.5, -98.35]} // Continental US default center
        zoom={5}
        style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
        aria-label="Ticket location map"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        <BboxTracker onBoundsChange={refetch} />

        {!showPins && <ClusterLayer clusters={clusters} />}
        {showPins && <TicketPinLayer pins={pins} />}
      </MapContainer>
    </div>
  );
}
