'use client';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LocationValue {
  address: string;
  lat?: number;
  lng?: number;
}

interface LocationStepProps {
  value: LocationValue;
  onChange: (v: LocationValue) => void;
}

export function LocationStep({ value, onChange }: LocationStepProps) {
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeFailed, setGeocodeFailed] = useState(false);

  const geocode = async (address: string) => {
    if (!address.trim()) return;
    setGeocoding(true);
    setGeocodeFailed(false);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(address)}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        onChange({ address, lat: data.data?.lat, lng: data.data?.lng });
      } else {
        setGeocodeFailed(true);
        onChange({ ...value, address });
      }
    } catch {
      // Non-fatal: ticket saved with geoStatus='pending'
      setGeocodeFailed(true);
      onChange({ ...value, address });
    } finally {
      setGeocoding(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="location-address">Street address</Label>
        <div className="relative mt-1">
          <Input
            id="location-address"
            value={value.address}
            onChange={(e) => onChange({ ...value, address: e.target.value })}
            onBlur={(e) => geocode(e.target.value)}
            placeholder="e.g. Oak Avenue near Main Street"
          />
          {geocoding && (
            <span className="absolute right-3 top-2.5 text-xs text-gray-500 animate-pulse">
              Looking up address…
            </span>
          )}
        </div>
        {geocodeFailed && (
          <p className="text-xs text-amber-600 mt-1" role="alert">
            Address not confirmed. Ticket will still be saved.
          </p>
        )}
        {value.lat && value.lng && (
          <p className="text-xs text-green-600 mt-1" role="status">
            ✅ Location confirmed: {value.lat.toFixed(4)}, {value.lng.toFixed(4)}
          </p>
        )}
      </div>

      {/* Map placeholder — full Leaflet integration in Wave 3c */}
      <div
        className="h-48 bg-gray-100 rounded-md flex items-center justify-center border border-dashed"
        aria-label="Map picker (interactive map loads in Wave 3c)"
      >
        <p className="text-sm text-gray-500">📍 Map picker available in the next update</p>
      </div>

      {value.lat && value.lng && (
        <div className="flex gap-4">
          <div className="flex-1">
            <Label htmlFor="lat-field">Latitude</Label>
            <Input
              id="lat-field"
              type="number"
              value={value.lat}
              onChange={(e) => onChange({ ...value, lat: parseFloat(e.target.value) })}
              step="0.0001"
              min={-90}
              max={90}
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="lng-field">Longitude</Label>
            <Input
              id="lng-field"
              type="number"
              value={value.lng}
              onChange={(e) => onChange({ ...value, lng: parseFloat(e.target.value) })}
              step="0.0001"
              min={-180}
              max={180}
            />
          </div>
        </div>
      )}
    </div>
  );
}
