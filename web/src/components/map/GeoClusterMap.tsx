import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { GeoClusterMarker } from '@/api/geo';

interface Props {
  clusters: GeoClusterMarker[];
  onClusterClick?: (cluster: GeoClusterMarker) => void;
}

const GeoClusterMap: React.FC<Props> = ({ clusters, onClusterClick }) => {
  return (
    <MapContainer
      center={[39.5, -98.35]}
      zoom={4}
      style={{ height: '600px', width: '100%', borderRadius: 6, border: '1px solid #e5e7eb' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {clusters.map(cluster => (
        <CircleMarker
          key={cluster.clusterId}
          center={[cluster.lat, cluster.lng]}
          radius={Math.min(Math.max(cluster.ticketCount / 2, 6), 30)}
          pathOptions={{
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.6,
          }}
          eventHandlers={{
            click: () => onClusterClick?.(cluster),
          }}
        >
          <Popup>
            <strong>{cluster.ticketCount}</strong> ticket{cluster.ticketCount !== 1 ? 's' : ''}
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
};

export default GeoClusterMap;
