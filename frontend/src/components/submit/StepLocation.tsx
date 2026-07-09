import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWizard } from '@/contexts/WizardContext';
import { useDebounce } from '@/hooks/useDebounce';
import { MapWidget } from '@/components/dashboard/MapWidget';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

interface GeocodeSuggestion {
  display: string;
  lat: number;
  lon: number;
}



export function StepLocation() {
  const { formData, updateFormData, goNext, goBack } = useWizard();
  const [addressInput, setAddressInput] = useState(formData.address ?? '');
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [pinLat, setPinLat] = useState<number | null>(formData.lat ?? null);
  const [pinLon, setPinLon] = useState<number | null>(formData.lon ?? null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // 300ms debounced geocode query
  const debouncedAddress = useDebounce(addressInput, 300);

  const { data: geocodeResults } = useQuery<{ suggestions: GeocodeSuggestion[] }>({
    queryKey: ['geocode', debouncedAddress],
    queryFn: () => fetch(`/api/geocode?q=${encodeURIComponent(debouncedAddress)}`).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }),
    enabled: debouncedAddress.length > 2, // only query when 3+ chars
  });

  useEffect(() => {
    if (geocodeResults?.suggestions) {
      setSuggestions(geocodeResults.suggestions);
      setShowSuggestions(true);
    }
  }, [geocodeResults]);

  const handleSuggestionSelect = (s: GeocodeSuggestion) => {
    setAddressInput(s.display);
    setPinLat(s.lat);
    setPinLon(s.lon);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // When map pin is dragged: reverse geocode via GET /api/geocode?lat={lat}&lon={lon}
  const handlePinDrag = async (lat: number, lon: number) => {
    setPinLat(lat);
    setPinLon(lon);
    try {
      const res = await fetch(`/api/geocode?lat=${lat}&lon=${lon}`);
      const data = await res.json();
      if (data.address) setAddressInput(data.address);
    } catch {
      // reverse geocode failure is non-fatal
    }
  };

  const canAdvance = !!(addressInput.trim().length > 0 || (pinLat !== null && pinLon !== null));

  const handleNext = () => {
    updateFormData({ address: addressInput, lat: pinLat ?? undefined, lon: pinLon ?? undefined });
    goNext();
  };

  // Build minimal GeoJSON for MapWidget single-pin display
  const pinGeoJSON = pinLat !== null && pinLon !== null ? {
    type: 'FeatureCollection' as const,
    features: [{
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [pinLon, pinLat] },
      properties: { isDraggable: true },
    }],
  } : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Location</CardTitle>
        <CardDescription>Where is the issue located?</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Address autocomplete input */}
        <div className="relative">
          <label htmlFor="address" className="text-sm font-medium">Address</label>
          <Input
            id="address"
            value={addressInput}
            onChange={e => { setAddressInput(e.target.value); setShowSuggestions(true); }}
            placeholder="Start typing an address..."
            aria-label="Street address"
            aria-autocomplete="list"
            aria-expanded={showSuggestions && suggestions.length > 0}
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-10 w-full bg-background border rounded-md shadow-md mt-1" role="listbox">
              {suggestions.map((s, i) => (
                <li
                  key={i}
                  className="px-3 py-2 cursor-pointer hover:bg-muted text-sm"
                  onClick={() => handleSuggestionSelect(s)}
                  role="option"
                  aria-selected={false}
                >
                  {s.display}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Map with draggable pin */}
        <div className="h-48 rounded-lg overflow-hidden">
          <MapWidget
            clusters={pinGeoJSON}
            onPinDrag={handlePinDrag}
            loading={false}
          />
        </div>
        <p className="text-xs text-muted-foreground">Drag the pin to set the exact location</p>

        {!canAdvance && <p className="text-xs text-destructive">Please enter an address or drop a pin on the map</p>}

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={goBack}>← Back</Button>
          <Button className="flex-1" disabled={!canAdvance} onClick={handleNext}>
            Next: Description →
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
