// frontend/src/app/(staff)/map/components/ClusterLayer.tsx
'use client';

import { useMap, CircleMarker, Tooltip } from 'react-leaflet';
import type { GeoCluster } from '@/types/geo';

interface ClusterLayerProps {
  clusters: GeoCluster[];
}

function clusterRadius(count: number): number {
  // min 14px, max 50px, log-scale
  return Math.min(50, Math.max(14, Math.round(14 + Math.log2(count + 1) * 5)));
}

export function ClusterLayer({ clusters }: ClusterLayerProps) {
  const map = useMap();

  return (
    <>
      {clusters.map((cluster, i) => (
        <CircleMarker
          key={`cluster-${i}-${cluster.lat}-${cluster.lng}`}
          center={[cluster.lat, cluster.lng]}
          radius={clusterRadius(cluster.count)}
          pathOptions={{
            fillColor: '#3b82f6',
            fillOpacity: 0.6,
            color: '#1d4ed8',
            weight: 1,
          }}
          eventHandlers={{
            click: () => {
              // Drill down: zoom in 2 levels centered on cluster
              map.setView([cluster.lat, cluster.lng], Math.min(20, map.getZoom() + 2));
            },
          }}
          aria-label={`Cluster of ${cluster.count} tickets`}
        >
          <Tooltip permanent direction="center" className="cluster-count-label">
            {cluster.count}
          </Tooltip>
        </CircleMarker>
      ))}
    </>
  );
}
