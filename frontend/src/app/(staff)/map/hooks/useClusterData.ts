// frontend/src/app/(staff)/map/hooks/useClusterData.ts
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchClusters, fetchTicketPins } from '@/lib/api/geo';
import type { GeoCluster, ClusterParams, TicketPin } from '@/types/geo';

const DRILL_DOWN_THRESHOLD = 10; // switch to individual pins when max cluster count < this

export function useClusterData(baseFilters: Omit<ClusterParams, 'bbox' | 'zoom'>) {
  const [clusters,  setClusters]  = useState<GeoCluster[]>([]);
  const [pins,      setPins]      = useState<TicketPin[]>([]);
  const [showPins,  setShowPins]  = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const refetch = useCallback(
    (bbox: string, zoom: number) => {
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      setIsLoading(true);
      setError(null);

      const params: ClusterParams = { bbox, zoom, ...baseFilters };

      fetchClusters(params, abortRef.current.signal)
        .then(async (newClusters) => {
          // Determine if all clusters are small enough to drill down to pins
          const maxCount = newClusters.reduce((m, c) => Math.max(m, c.count), 0);
          if (zoom >= 14 && maxCount < DRILL_DOWN_THRESHOLD) {
            // Fetch individual pins instead
            const newPins = await fetchTicketPins(bbox, abortRef.current?.signal);
            setPins(newPins);
            setClusters([]);
            setShowPins(true);
          } else {
            setClusters(newClusters);
            setPins([]);
            setShowPins(false);
          }
        })
        .catch((err: Error) => {
          if (err.name === 'AbortError') return;
          setError(err.message);
        })
        .finally(() => setIsLoading(false));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(baseFilters)],
  );

  return { clusters, pins, showPins, isLoading, error, refetch };
}
