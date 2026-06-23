'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default icon paths broken by webpack
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Large touch target custom icon (≥44×44px touch area via CSS)
const PinIcon = L.divIcon({
  html: `<div style="
    width: 32px; height: 48px;
    display: flex; align-items: flex-end; justify-content: center;
    cursor: pointer;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
  ">
    <svg width="32" height="48" viewBox="0 0 32 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 32 16 32s16-20 16-32C32 7.163 24.837 0 16 0z" fill="#2563EB"/>
      <circle cx="16" cy="16" r="7" fill="white"/>
    </svg>
  </div>`,
  className: '',
  iconSize: [32, 48],
  iconAnchor: [16, 48],
});

interface ClickHandlerProps {
  onMapClick: (lat: number, lng: number) => void;
}

function ClickHandler({ onMapClick }: ClickHandlerProps) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface LeafletMapPickerProps {
  lat: number | null;
  lng: number | null;
  onMapClick: (lat: number, lng: number) => void;
}

const DEFAULT_CENTER: [number, number] = [43.7, -79.4];

export default function LeafletMapPicker({ lat, lng, onMapClick }: LeafletMapPickerProps) {
  const center: [number, number] = lat !== null && lng !== null ? [lat, lng] : DEFAULT_CENTER;

  return (
    <div
      aria-label="Interactive map — tap to place location pin"
      className="w-full rounded-md overflow-hidden border"
      style={{ height: '300px' }}
    >
      <MapContainer
        center={center}
        zoom={13}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onMapClick={onMapClick} />
        {lat !== null && lng !== null && (
          <Marker position={[lat, lng]} icon={PinIcon} />
        )}
      </MapContainer>
    </div>
  );
}
