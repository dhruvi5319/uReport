<?php

declare(strict_types=1);

namespace Services;

/**
 * AddressService — geocoding/reverse-geocoding abstraction.
 *
 * Provider selected by ADDRESS_SERVICE_TYPE env var:
 *   'google'    → Google Maps Geocoding API (requires ADDRESS_SERVICE_KEY)
 *   'nominatim' → OpenStreetMap Nominatim (free, no key required)
 *   'city_gis'  → Custom GIS endpoint (requires ADDRESS_SERVICE_URL + optional KEY)
 *   'none'      → Geocoding disabled; lat/lng from caller is stored as-is
 *
 * Results are cached in-memory by address string.
 *
 * F5: Geocode on Ticket Create, Reverse Geocode on Coordinate-Only Submit
 */
class AddressService
{
    private string $type;
    private string $url;
    private string $key;

    /** Simple in-memory cache: md5(address) → result */
    private static array $geocodeCache = [];

    public function __construct(?string $type = null, ?string $url = null, ?string $key = null)
    {
        $this->type = $type ?? (getenv('ADDRESS_SERVICE_TYPE') ?: 'none');
        $this->url  = $url  ?? (getenv('ADDRESS_SERVICE_URL') ?: '');
        $this->key  = $key  ?? (getenv('ADDRESS_SERVICE_KEY') ?: '');
    }

    /**
     * Geocode an address string → coordinates.
     *
     * Returns ['lat' => float, 'lng' => float, 'addressNormalized' => string]
     * or null if geocoding fails / disabled.
     */
    public function geocode(string $address): ?array
    {
        if ($this->type === 'none' || $address === '') {
            return null;
        }

        $cacheKey = md5(strtolower(trim($address)));
        if (isset(self::$geocodeCache[$cacheKey])) {
            return self::$geocodeCache[$cacheKey];
        }

        $result = match ($this->type) {
            'google'    => $this->geocodeGoogle($address),
            'nominatim' => $this->geocodeNominatim($address),
            'city_gis'  => $this->geocodeCityGis($address),
            default     => null,
        };

        if ($result !== null) {
            self::$geocodeCache[$cacheKey] = $result;
        }

        return $result;
    }

    /**
     * Reverse-geocode coordinates → human-readable address string.
     * Returns address string or null on failure.
     */
    public function reverseGeocode(float $lat, float $lng): ?string
    {
        if ($this->type === 'none') {
            return null;
        }

        return match ($this->type) {
            'google'    => $this->reverseGeocodeGoogle($lat, $lng),
            'nominatim' => $this->reverseGeocodeNominatim($lat, $lng),
            'city_gis'  => $this->reverseGeocodeCityGis($lat, $lng),
            default     => null,
        };
    }

    // ── Google Maps ───────────────────────────────────────────────────────────

    private function geocodeGoogle(string $address): ?array
    {
        $url      = 'https://maps.googleapis.com/maps/api/geocode/json?' . http_build_query([
            'address' => $address,
            'key'     => $this->key,
        ]);
        $response = $this->httpGet($url);
        if ($response === null) {
            return null;
        }
        $data = json_decode($response, true);
        if (($data['status'] ?? '') !== 'OK' || empty($data['results'][0])) {
            return null;
        }
        $loc = $data['results'][0]['geometry']['location'];
        return [
            'lat'               => (float) $loc['lat'],
            'lng'               => (float) $loc['lng'],
            'addressNormalized' => $data['results'][0]['formatted_address'] ?? $address,
        ];
    }

    private function reverseGeocodeGoogle(float $lat, float $lng): ?string
    {
        $url      = 'https://maps.googleapis.com/maps/api/geocode/json?' . http_build_query([
            'latlng' => "{$lat},{$lng}",
            'key'    => $this->key,
        ]);
        $response = $this->httpGet($url);
        if ($response === null) {
            return null;
        }
        $data = json_decode($response, true);
        return $data['results'][0]['formatted_address'] ?? null;
    }

    // ── Nominatim ─────────────────────────────────────────────────────────────

    private function geocodeNominatim(string $address): ?array
    {
        $baseUrl  = $this->url ?: 'https://nominatim.openstreetmap.org';
        $url      = $baseUrl . '/search?' . http_build_query([
            'q'              => $address,
            'format'         => 'json',
            'limit'          => 1,
            'addressdetails' => 1,
        ]);
        $response = $this->httpGet($url, ['User-Agent: uReport/1.0']);
        if ($response === null) {
            return null;
        }
        $data = json_decode($response, true);
        if (empty($data[0])) {
            return null;
        }
        return [
            'lat'               => (float) $data[0]['lat'],
            'lng'               => (float) $data[0]['lon'],
            'addressNormalized' => $data[0]['display_name'] ?? $address,
        ];
    }

    private function reverseGeocodeNominatim(float $lat, float $lng): ?string
    {
        $baseUrl  = $this->url ?: 'https://nominatim.openstreetmap.org';
        $url      = $baseUrl . '/reverse?' . http_build_query([
            'lat'    => $lat,
            'lon'    => $lng,
            'format' => 'json',
        ]);
        $response = $this->httpGet($url, ['User-Agent: uReport/1.0']);
        if ($response === null) {
            return null;
        }
        $data = json_decode($response, true);
        return $data['display_name'] ?? null;
    }

    // ── City GIS ──────────────────────────────────────────────────────────────

    private function geocodeCityGis(string $address): ?array
    {
        if ($this->url === '') {
            return null;
        }
        $url      = $this->url . '?' . http_build_query(['address' => $address, 'key' => $this->key]);
        $response = $this->httpGet($url);
        if ($response === null) {
            return null;
        }
        $data = json_decode($response, true);
        if (empty($data['lat']) || empty($data['lng'])) {
            return null;
        }
        return [
            'lat'               => (float) $data['lat'],
            'lng'               => (float) $data['lng'],
            'addressNormalized' => $data['address'] ?? $address,
        ];
    }

    private function reverseGeocodeCityGis(float $lat, float $lng): ?string
    {
        if ($this->url === '') {
            return null;
        }
        $url      = $this->url . '/reverse?' . http_build_query(['lat' => $lat, 'lng' => $lng, 'key' => $this->key]);
        $response = $this->httpGet($url);
        if ($response === null) {
            return null;
        }
        $data = json_decode($response, true);
        return $data['address'] ?? null;
    }

    // ── HTTP helper ───────────────────────────────────────────────────────────

    private function httpGet(string $url, array $headers = []): ?string
    {
        $ctx = stream_context_create([
            'http' => [
                'timeout'       => 5,
                'ignore_errors' => true,
                'header'        => implode("\r\n", $headers),
            ],
        ]);

        $response = @file_get_contents($url, false, $ctx);
        return $response !== false ? $response : null;
    }

    /** Clear in-memory cache (for testing). */
    public static function clearCache(): void
    {
        self::$geocodeCache = [];
    }
}
