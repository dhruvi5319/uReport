// F15: Ticket Map — Geo-clustered ticket view using react-leaflet
import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { usePermission } from '@/hooks/usePermission';
import { geoApi, GeoClusterMarker, MapViewResponse } from '@/api/geo';
import GeoClusterMap from '@/components/map/GeoClusterMap';

const TicketMapPage: React.FC = () => {
  const authorized = usePermission('staff');
  if (!authorized) return <Navigate to="/" replace />;

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mapData, setMapData] = useState<MapViewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params: Record<string, string> = {};
    searchParams.forEach((v, k) => { params[k] = v; });
    geoApi.searchMap(params)
      .then(setMapData)
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load map data'))
      .finally(() => setLoading(false));
  }, [searchParams]);

  const handleClusterClick = (cluster: GeoClusterMarker) => {
    const params = new URLSearchParams(searchParams);
    params.set('lat', String(cluster.lat));
    params.set('long', String(cluster.lng));
    params.set('radius', '5000');
    navigate(`/tickets?${params.toString()}`);
  };

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h1 style={{ margin: 0 }}>Ticket Map</h1>
        <button
          onClick={() => navigate(`/tickets?${searchParams.toString()}`)}
          style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '0.875rem' }}
        >
          ← Switch to List View
        </button>
      </div>
      {mapData && (
        <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
          Showing {mapData.total} tickets across {mapData.clusters.length} cluster
          {mapData.clusters.length !== 1 ? 's' : ''}.
        </p>
      )}
      {loading ? (
        <div style={{ height: 384, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
          Loading map data…
        </div>
      ) : error ? (
        <div style={{ padding: '1rem', color: '#dc2626' }}>Error: {error}</div>
      ) : (
        <GeoClusterMap
          clusters={mapData?.clusters ?? []}
          onClusterClick={handleClusterClick}
        />
      )}
    </div>
  );
};

export default TicketMapPage;
