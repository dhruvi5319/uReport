'use client';

import dynamic from 'next/dynamic';
import { useCallback, useRef, useState } from 'react';

const LeafletMap = dynamic(() => import('./LeafletMapPicker'), { ssr: false });

type GeoStatus = 'idle' | 'pending' | 'confirmed' | 'failed';

interface LocationStepProps {
  address: string;
  lat: number | null;
  lng: number | null;
  geoStatus: GeoStatus;
  onLocationChange: (update: {
    address?: string;
    lat?: number | null;
    lng?: number | null;
    addressNormalized?: string;
    geoStatus?: GeoStatus;
  }) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function LocationStep({
  address,
  lat,
  lng,
  geoStatus,
  onLocationChange,
  onBack,
  onNext,
}: LocationStepProps) {
  const [locationError, setLocationError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '';

  const geocodeAddress = useCallback(
    async (addr: string) => {
      if (!addr.trim()) return;
      onLocationChange({ geoStatus: 'pending' });
      try {
        const res = await fetch(
          `${apiBase}/api/geocode?address=${encodeURIComponent(addr)}`
        );
        if (res.ok) {
          const data = await res.json();
          const { lat: glat, lng: glng, addressNormalized } = data.data ?? {};
          if (glat != null && glng != null) {
            onLocationChange({
              lat: glat,
              lng: glng,
              addressNormalized: addressNormalized ?? addr,
              geoStatus: 'confirmed',
            });
            return;
          }
        }
        onLocationChange({ geoStatus: 'failed' });
      } catch {
        onLocationChange({ geoStatus: 'failed' });
      }
    },
    [apiBase, onLocationChange]
  );

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onLocationChange({ address: val, geoStatus: 'idle' });

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (val.trim()) geocodeAddress(val);
    }, 800);
  };

  const handleAddressBlur = () => {
    if (address.trim() && geoStatus === 'idle') {
      geocodeAddress(address);
    }
  };

  const handleMapClick = async (clickLat: number, clickLng: number) => {
    onLocationChange({ lat: clickLat, lng: clickLng, geoStatus: 'pending' });
    try {
      const res = await fetch(
        `${apiBase}/api/geocode?lat=${clickLat}&lng=${clickLng}`
      );
      if (res.ok) {
        const data = await res.json();
        const { addressNormalized } = data.data ?? {};
        onLocationChange({
          lat: clickLat,
          lng: clickLng,
          addressNormalized: addressNormalized ?? '',
          address: addressNormalized ?? address,
          geoStatus: 'confirmed',
        });
        return;
      }
    } catch {
      // ignore — fall back to confirmed with coords only
    }
    onLocationChange({ lat: clickLat, lng: clickLng, geoStatus: 'confirmed' });
  };

  const handleNext = () => {
    if (!address.trim() && lat === null) {
      setLocationError('Please enter a location or tap the map.');
      return;
    }
    setLocationError(null);
    onNext();
  };

  const canAdvance = geoStatus !== 'idle' || address.trim() !== '' || lat !== null;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Where is the problem?</h2>

      <div className="flex flex-col gap-1">
        <label htmlFor="address-input" className="text-sm font-medium">
          Street address
        </label>
        <input
          id="address-input"
          type="text"
          placeholder="e.g. 123 Main St"
          value={address}
          onChange={handleAddressChange}
          onBlur={handleAddressBlur}
          className="w-full px-3 py-2 border rounded-md text-base outline-none focus:ring-2 focus:ring-primary/50"
          aria-label="Address"
        />
      </div>

      {/* Geocode status banners */}
      {geoStatus === 'pending' && (
        <p className="text-sm text-muted-foreground animate-pulse">
          Looking up location...
        </p>
      )}
      {geoStatus === 'confirmed' && (
        <div className="rounded-md bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-700">
          ✅ Location confirmed
        </div>
      )}
      {geoStatus === 'failed' && (
        <div className="rounded-md bg-amber-50 border border-amber-200 px-4 py-2 text-sm text-amber-700">
          Exact location not confirmed — you can still submit.
        </div>
      )}

      {locationError && (
        <p className="text-sm text-red-600">{locationError}</p>
      )}

      {/* Leaflet map */}
      <div>
        <LeafletMap lat={lat} lng={lng} onMapClick={handleMapClick} />
        <p className="text-xs text-muted-foreground mt-1 text-center">
          Tap map to place pin
        </p>
      </div>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t z-10">
        <div className="max-w-lg mx-auto flex gap-3">
          <button
            onClick={onBack}
            className="flex-1 h-11 rounded-md border font-medium hover:bg-muted/50 transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={handleNext}
            disabled={!canAdvance}
            className="flex-1 h-11 rounded-md bg-primary text-primary-foreground font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
