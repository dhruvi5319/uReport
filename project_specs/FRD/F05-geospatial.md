---

## F05: Geospatial Features

**Description:** Service requests are inherently location-based. uReport captures latitude/longitude coordinates and a human-readable address string for every ticket, integrates with a configurable address lookup service to resolve entered addresses to coordinates, and displays tickets on interactive maps with density clustering powered by Solr geospatial indexing.

**Terminology:**
- **Geocoding:** The process of converting a human-readable address string into latitude/longitude coordinates.
- **Reverse Geocoding:** Converting lat/lng back into a human-readable address string.
- **Address Service:** The configurable external service (e.g., Google Maps, Nominatim, a city GIS API) used for geocoding.
- **GeoCluster:** A Solr-computed spatial grid cell aggregating nearby tickets for density map rendering. Maps to `geoclusters` table.
- **Bounding Box:** A rectangular geographic area defined by `minLat, minLng, maxLat, maxLng`.
- **Heatmap / Density Map:** The map view showing relative ticket density per area.

**Sub-features:**
- Store lat/lng and address string per ticket
- Geocode address → lat/lng via configurable address service
- Reverse geocode lat/lng → address string
- Display single ticket on map (marker)
- Display search results as geo-clustered density map
- Support bounding-box and radius-based geographic filtering (see F04)
- Return cluster data endpoint for map rendering

---

### F05 Process: Geocode on Ticket Create

1. Caller provides `address` string (and optionally lat/lng).
2. If lat/lng not provided, system calls the configured address service with the `address` string.
3. Address service returns lat/lng; system stores in `ticket_geodata`.
4. If address service is unavailable or returns no result, system stores ticket without coordinates and sets `geoStatus = 'pending'`.
5. A background job (or retry on next view) attempts geocoding for `pending` tickets.

### F05 Process: Reverse Geocode on Coordinate-Only Submit

1. Caller provides lat/lng but no address string (common via Open311 mobile apps).
2. System calls address service with lat/lng for reverse geocoding.
3. System stores the returned address string in `tickets.address`.
4. If reverse geocode fails, `tickets.address` remains null.

### F05 Process: Geo-Cluster Map Data

1. Client requests `/api/tickets/clusters` with optional bounding box or search filters.
2. System queries Solr geospatial clustering (spatial heatmap component) with the filters.
3. Solr returns cluster grid cells with ticket counts and centroid coordinates.
4. System returns cluster array: `[{ lat, lng, count, level }]` for map rendering.
5. Individual ticket markers: returned from standard search results at high zoom levels when count per cell < threshold (default 10).

### F05 Process: Address Service Integration

1. System reads address service config: `ADDRESS_SERVICE_TYPE` (google|nominatim|city_gis|none), `ADDRESS_SERVICE_URL`, `ADDRESS_SERVICE_KEY`.
2. All geocoding calls are routed through an `AddressService` interface (repository pattern).
3. If `ADDRESS_SERVICE_TYPE = 'none'`, geocoding is disabled; lat/lng from caller is stored as-is.
4. Geocoding calls are cached by address string (Redis or in-memory) to avoid redundant API calls.

---

### F05 Inputs

**Geocode request (internal):**
- `address` (string, required): Human-readable address to geocode

**Reverse geocode request (internal):**
- `lat` (decimal, required): Latitude
- `lng` (decimal, required): Longitude

**Cluster map request:**
- `bbox` (string, optional): Bounding box `minLat,minLng,maxLat,maxLng`
- `zoom` (integer, optional): Map zoom level (1–20) — determines cluster grid resolution
- Plus all standard search filter params (see F04)

---

### F05 Outputs

- **Geocoded coordinates:** `{ lat: decimal, lng: decimal, addressNormalized: string }`
- **Cluster array:** `[{ lat, lng, count, zoom }]`
- **Single ticket map marker:** included in ticket detail response as `{ lat, lng, address }`

---

### F05 Validation

- `lat` must be in −90..+90; `lng` in −180..+180
- `address` for geocoding must be non-empty, max 500 chars
- `zoom` for clusters must be 1–20 inclusive if provided
- `bbox` format: 4 comma-separated decimals, `minLat < maxLat`, `minLng < maxLng`
- Geocoding is optional on ticket create if lat/lng are directly provided

---

### F05 Error States

| Scenario | HTTP | Error Code | Message |
|----------|------|------------|---------|
| Address service unavailable | 503 | GEO_SERVICE_UNAVAILABLE | "Address lookup service unavailable; ticket saved without coordinates" |
| Address not found by geocoding service | 422 | ADDRESS_NOT_FOUND | "Address could not be geocoded; please provide coordinates manually" |
| Invalid bounding box | 422 | INVALID_BBOX | "Bounding box must be minLat,minLng,maxLat,maxLng" |
| Coordinates out of range | 422 | INVALID_COORDINATES | "Latitude must be −90 to +90; longitude −180 to +180" |

> **Note:** Geocoding failure is non-fatal for ticket creation — the ticket is saved without coordinates and flagged for retry.

---

### F05 API Surface (this feature)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/tickets/clusters` | Any (role-filtered) | Geo-cluster data for map |
| GET | `/api/geocode` | staff | Geocode an address (utility endpoint for SPA map picker) |
| GET | `/api/tickets/{id}/location` | Any (visibility-checked) | Get ticket location data |

---

### F05 Schema Surface (this feature)

Tables: `ticket_geodata`, `geoclusters`. See `Y0b-schema-supporting.md` §geodata.

Key columns:
- `ticket_geodata`: `id`, `ticketId` (FK → tickets), `lat` (decimal 10,7), `lng` (decimal 10,7), `address`, `geoStatus` (enum: located|pending|failed), `addressNormalized`
- `geoclusters`: `id`, `lat`, `lng`, `zoom`, `count`, `updatedAt` — periodically recomputed by Solr cluster job
