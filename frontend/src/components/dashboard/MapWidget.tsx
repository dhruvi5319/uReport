/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

export interface MapWidgetProps {
  clusters: GeoJSON.FeatureCollection | null;
  onPinClick?: (ticketId: number) => void;
  loading?: boolean;
}

export function MapWidget({ clusters, onPinClick, loading = false }: MapWidgetProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || loading) return;

    // Clean up previous map instance
    cleanupRef.current?.();
    cleanupRef.current = null;

    // Access Vite's import.meta.env via type cast to avoid TS strict checks
    const env = (import.meta as any).env as Record<string, string | undefined>;
    const token = env['VITE_MAPBOX_TOKEN'];

    if (token) {
      // Mapbox path — dynamic import to avoid bundling when token absent
      let aborted = false;

      (import('mapbox-gl') as Promise<any>).then((mapboxMod: any) => {
        if (aborted || !mapContainerRef.current) return;
        const mapboxgl = mapboxMod.default ?? mapboxMod;
        mapboxgl.accessToken = token;
        const map = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: 'mapbox://styles/mapbox/light-v11',
          center: [-90.1994, 38.627],
          zoom: 10,
        });

        map.on('load', () => {
          if (clusters) {
            map.addSource('clusters', {
              type: 'geojson',
              data: clusters,
              cluster: true,
              clusterMaxZoom: 14,
              clusterRadius: 50,
            });
            map.addLayer({
              id: 'cluster-circles',
              type: 'circle',
              source: 'clusters',
              filter: ['has', 'point_count'],
              paint: {
                'circle-color': '#3b82f6',
                'circle-radius': 20,
                'circle-opacity': 0.8,
              },
            });
            map.addLayer({
              id: 'unclustered-point',
              type: 'circle',
              source: 'clusters',
              filter: ['!', ['has', 'point_count']],
              paint: {
                'circle-color': '#ef4444',
                'circle-radius': 8,
                'circle-opacity': 0.9,
              },
            });

            map.on('click', 'unclustered-point', (e: any) => {
              const feature = e.features?.[0];
              if (!feature?.properties) return;
              const ticketId = feature.properties['id'] ?? feature.properties['ticketId'];
              if (ticketId) {
                if (onPinClick) {
                  onPinClick(Number(ticketId));
                } else {
                  navigate(`/cases/${ticketId}`);
                }
              }
            });

            map.on('click', 'cluster-circles', (e: any) => {
              const features = map.queryRenderedFeatures(e.point, { layers: ['cluster-circles'] });
              const clusterId = features?.[0]?.properties?.cluster_id;
              if (typeof clusterId === 'number') {
                map.getSource('clusters').getClusterExpansionZoom(
                  clusterId,
                  (_err: any, zoom: number) => {
                    const coords = features[0].geometry.coordinates as [number, number];
                    map.easeTo({ center: coords, zoom });
                  }
                );
              }
            });
          }
        });

        cleanupRef.current = () => { map.remove(); };
      }).catch(() => {
        // If mapbox-gl import fails, fall back to Leaflet
        initLeaflet();
      });

      return () => {
        aborted = true;
        cleanupRef.current?.();
        cleanupRef.current = null;
      };
    } else {
      // Leaflet fallback (no Mapbox token — test environment and default)
      initLeaflet();
    }

    function initLeaflet() {
      if (!mapContainerRef.current) return;
      import('leaflet').then((L: any) => {
        if (!mapContainerRef.current) return;

        // Inject Leaflet CSS if not already present
        if (!document.querySelector('link[href*="leaflet"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }

        const leaflet = L.default ?? L;
        const map = leaflet.map(mapContainerRef.current).setView([38.627, -90.1994], 10);

        leaflet
          .tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
          })
          .addTo(map);

        if (clusters?.features) {
          clusters.features.forEach((feature: GeoJSON.Feature) => {
            if (feature.geometry?.type === 'Point') {
              const [lng, lat] = (feature.geometry as GeoJSON.Point).coordinates;
              const marker = leaflet
                .circleMarker([lat, lng], {
                  radius: 8,
                  fillColor: '#ef4444',
                  color: '#fff',
                  weight: 1,
                  opacity: 1,
                  fillOpacity: 0.9,
                })
                .addTo(map);

              const ticketId =
                feature.properties?.['id'] ?? feature.properties?.['ticketId'];
              if (ticketId) {
                marker.on('click', () => {
                  if (onPinClick) {
                    onPinClick(Number(ticketId));
                  } else {
                    navigate(`/cases/${ticketId}`);
                  }
                });
              }
            }
          });
        }

        cleanupRef.current = () => { map.remove(); };
      });
    }

    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clusters, loading]);

  if (loading) {
    return <Skeleton className="h-48 md:h-64 w-full rounded-lg" />;
  }

  return (
    <div
      ref={mapContainerRef}
      className="h-48 md:h-64 w-full rounded-lg"
      style={{ minHeight: '192px' }}
      data-testid="map-widget"
      aria-label="Geographic case distribution map"
    />
  );
}

export default MapWidget;
