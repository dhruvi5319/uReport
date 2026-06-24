---

## F15: Location / Address Management and Geo-Cluster Analysis

**Description:** Tickets carry geographic data (latitude, longitude, street address, city, state, zip). The `locations` table provides a canonical validated address registry. Geo-cluster analysis groups nearby tickets into hierarchical spatial clusters across 7 zoom levels (0–6), used by the map view. A scheduled background job (replacing `matchLocationAddresses.php`) links tickets to canonical addresses and rebuilds geo-clusters using PostGIS spatial operations.

---

### Terminology

- **locations:** Canonical address records — a registry of validated street addresses with lat/long.
- **addressId:** FK on `tickets` linking to a validated `locations` record (may be null if address unvalidated).
- **geoclusters:** Spatial cluster records at each of 7 zoom levels, each with a center point and level.
- **ticket_geodata:** Join table linking each ticket to its cluster assignment at each of the 7 zoom levels.
- **cluster_id_N:** The cluster assignment at zoom level N (0 = coarsest, 6 = finest).
- **geo_point:** A `GEOGRAPHY(POINT, 4326)` column on `tickets` for PostGIS spatial queries.
- **AddressService:** An optional external address validation/normalization service integration (see F15 §Integration).
- **matchLocationAddresses job:** The legacy PHP cron script replaced by `GeoClusterScheduler` in Spring.

---

### Sub-features

- Capture and store lat/long, address, city, state, zip on tickets
- Validate and normalize addresses via optional AddressService
- Store canonical address records in `locations`
- Generate geo-cluster entries in `geoclusters` (7 zoom levels)
- Link each ticket to its cluster assignments in `ticket_geodata`
- Rebuild geo-clusters via scheduled background job
- Serve map view with geo-clustered ticket data (F11)
- Support location-based ticket search (radius, city, zip filters) (F11)

---

### Process

#### Address Capture on Ticket Creation
1. On ticket creation (F00), caller provides `location`, `city`, `state`, `zip`, `latitude`, `longitude`.
2. System stores raw fields on `tickets` directly.
3. If `latitude` and `longitude` are provided, system populates `tickets.geo_point = ST_MakePoint(longitude, latitude)::geography`.
4. System optionally calls AddressService to validate/normalize the address (if configured); stores `additionalFields` JSON from AddressService response.
5. System looks up or creates a `locations` record matching the canonical address.
6. System sets `tickets.addressId` to the matching `locations.id`.

#### Geo-Cluster Rebuild Job
1. `GeoClusterScheduler` runs on a configured cron schedule (default: nightly at 2 AM).
2. Job queries all tickets with non-null `geo_point`.
3. For each zoom level N (0–6), job groups nearby tickets using a spatial clustering algorithm:
   - Level 0: clusters within ~50km radius.
   - Level 6: clusters within ~100m radius.
   - Cluster radii configurable via `app.geo.clusterRadii[0..6]` (meters).
4. For each new cluster: job inserts a `geoclusters` row with `level = N` and `center = ST_Centroid(...)`.
5. Job upserts `ticket_geodata` rows linking each ticket to its cluster at each level.
6. Job logs execution time and counts.

#### Cluster Radius (Default Values)

| Level | Approximate Radius |
|-------|-------------------|
| 0 | 50,000 m (50 km) |
| 1 | 20,000 m (20 km) |
| 2 | 10,000 m (10 km) |
| 3 | 5,000 m (5 km) |
| 4 | 2,000 m (2 km) |
| 5 | 500 m |
| 6 | 100 m |

---

### Inputs

**Ticket location fields (at ticket creation/update):**
- `latitude` (NUMERIC 9,6, optional): Decimal latitude.
- `longitude` (NUMERIC 9,6, optional): Decimal longitude.
- `location` (string, optional): Human-readable address string.
- `city` (string, optional): City name.
- `state` (string, optional): 2-char state abbreviation.
- `zip` (string, optional): ZIP/postal code.
- `additionalFields` (JSONB, optional): Extra address data from AddressService.

**Map view query (F11):**
- `zoomLevel` (integer 0–6): Determines which `cluster_id_N` column to group by.
- Standard ticket search filter parameters.

---

### Outputs

- **Location object:** id, address, city, state, zip, latitude, longitude.
- **Geocluster object:** id, level, center (lat/long), ticketCount.
- **Map view response:** Array of cluster objects `{ cluster_id, count, lat, long }` (see F11).
- **ticket_geodata:** Internal table; not directly exposed via API.

---

### Validation Rules

- `latitude` in [-90, 90]; `longitude` in [-180, 180] (enforced at ticket creation).
- `geo_point` populated only when both `latitude` and `longitude` are non-null.
- `locations` records are upserted on address match (normalized street + city + state + zip).
- Geo-cluster rebuild job is idempotent — re-running produces the same clusters.
- `zoomLevel` parameter for map view must be 0–6; defaults to 3 if not provided.
- AddressService integration is optional; if unavailable, system stores raw address without validation.

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|----------|-------------|------------|---------|
| Invalid lat/long on ticket create | 422 | INVALID_COORDINATES | "Latitude/longitude out of valid range" |
| Invalid zoomLevel for map view | 422 | INVALID_ZOOM_LEVEL | "Zoom level must be 0–6" |
| AddressService unavailable (soft) | — | — | (logged; ticket created without canonical address) |
| Geo-cluster rebuild job failure | — | — | (logged; job retries on next schedule) |

---

### API Surface (this feature)

Map view served via F11 endpoint. Direct location management:

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/locations` | staff | List canonical locations |
| GET | `/api/v1/locations/{id}` | staff | Get location detail |
| GET | `/api/v1/tickets/map` | any | Map view with geo-clusters (see F11) |

---

### Schema Surface (this feature)

Tables: `locations`, `geoclusters`, `ticket_geodata`. See `Y0d-schema-geo.md §Geo`.

Key columns:
- `locations`: id (SERIAL PK), address (VARCHAR 255), city (VARCHAR 100), state (VARCHAR 2), zip (VARCHAR 10), latitude (NUMERIC 9,6), longitude (NUMERIC 9,6), geo_point (GEOGRAPHY(POINT, 4326)).
- `geoclusters`: id (BIGSERIAL PK), level (SMALLINT CHECK 0-6), center (GEOGRAPHY(POINT, 4326)), UNIQUE(level, center).
- `ticket_geodata`: ticket_id (FK tickets), cluster_id_0 ... cluster_id_6 (FK geoclusters, nullable), PRIMARY KEY(ticket_id).
- `tickets` additions: geo_point (GEOGRAPHY(POINT, 4326)), addressId (FK locations, nullable).
