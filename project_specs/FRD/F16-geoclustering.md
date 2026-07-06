---

## F16: Geo-Clustering for Map Views

**Priority:** P2 — Medium

### Description

The application pre-computes geographic clusters of ticket pins so map views remain legible in dense urban areas. The `geoclusters` table stores cluster center points at multiple zoom levels (0–6). The `ticket_geodata` join table links each ticket to its cluster membership at each zoom level. The map widget on the dashboard and the case detail map use this data to render clustered and individual pins via Mapbox GL JS or Leaflet.

### Terminology

- **Geocluster** — A pre-computed geographic cluster of nearby tickets at a given zoom level. Stored in `geoclusters`.
- **Zoom level** — Integer 0–6 corresponding to map zoom tiers. Level 0 = widest cluster; level 6 = finest cluster (near individual pins).
- **ticket_geodata** — Join table linking `tickets.id` to `geoclusters.id` at each zoom level (cluster_id_0 through cluster_id_6).
- **Cluster center** — A `POINT` geometry (lat/lon) stored in `geoclusters.center` representing the centroid of the cluster.

### Sub-features

- Pre-computed cluster data migrated from MySQL `geoclusters` and `ticket_geodata` to PostgreSQL
- Dashboard map widget: cluster pins at low zoom, individual pins at high zoom
- Cluster bubble shows constituent ticket count
- Cluster click zooms in one level
- Individual pin click opens case preview popover (ticket ID, category, status, link to detail)
- Case detail map: single ticket location pin (no clustering needed)
- Dashboard cluster data served via `GET /api/geoclusters`

### Process — Dashboard Map Rendering

1. Map widget loads; initial zoom level determined from browser (default: city center, zoom 11 → use cluster_id_3 or cluster_id_4 tier).
2. React issues `GET /api/geoclusters?zoom={level}`.
3. API returns cluster centers and ticket counts for the requested zoom tier.
4. Map renders cluster bubbles at each center point; bubble label shows count.
5. User zooms in: map fires zoom event; React issues new `GET /api/geoclusters?zoom={newLevel}`.
6. At highest zoom level (6) or zoom > 14: `GET /api/tickets?status=open&pageSize=500` fetched for individual pins.
7. Clicking a cluster: map zooms to `zoom + 1`; cluster expands.
8. Clicking an individual pin: popover opens with: Case #{id}, Category, Status, "View Case" link.

### Process — Cluster Data API

```
GET /api/geoclusters?zoom={0-6}
```

Response:
```json
{
  "zoom": 4,
  "clusters": [
    {"id": 12, "lat": 39.165, "lon": -86.526, "count": 23},
    {"id": 13, "lat": 39.170, "lon": -86.531, "count": 8},
    ...
  ]
}
```

The `count` for each cluster is computed by:
```sql
SELECT tg.cluster_id_4 as cluster_id, COUNT(*) as count, g.center
FROM ticket_geodata tg
JOIN geoclusters g ON g.id = tg.cluster_id_4
JOIN tickets t ON t.id = tg.ticket_id
WHERE t.status = 'open'
GROUP BY tg.cluster_id_4, g.center;
```

(Zoom parameter maps to `cluster_id_{zoom}` column dynamically, whitelisted server-side.)

### Process — Case Detail Map

1. Case detail page loads; map widget renders with a single marker at `tickets.latitude`, `tickets.longitude`.
2. No clustering; static single pin.
3. Map is informational (view only, not interactive for editing on this screen).
4. Location editing on case detail uses the inline field edit (F4), not the map.

### PostgreSQL Spatial Support

- The `geoclusters.center` column uses PostgreSQL `POINT` type (not PostGIS; keeping parity with MySQL `POINT` type).
- Spatial index on `center` column is recreated in Flyway migration.
- If PostGIS is available in the environment, the type may be upgraded to `geometry(Point, 4326)` in a later migration.
- For now: `POINT` type with a functional GiST index or sp-GiST index is acceptable.

### Inputs

| Parameter | Type | Required | Validation |
|---|---|---|---|
| `zoom` | integer | [R] | 0–6; values outside range clamped to valid range |
| `status` | string | [O] | `open` or `closed`; default `open` |

### Outputs

- Array of cluster objects: id, lat, lon, count
- At zoom > max cluster level: individual ticket pins from ticket list endpoint

### Validation

- `zoom` must be 0–6; values outside this range clamped to [0, 6].
- Only open tickets are clustered by default; `status` param overrides.

### Error States

| Scenario | HTTP Status | Behavior |
|---|---|---|
| Mapbox key absent | — | Leaflet/OSM tile fallback; cluster data still loads |
| Cluster API failure | 500 | Map shows error state; retry button available |
| Ticket at null lat/lon | — | Ticket excluded from map display (not in ticket_geodata) |

### API Surface

| Method | Path | Description |
|---|---|---|
| GET | `/api/geoclusters` | Cluster data for map widget |

### Schema Surface

- `geoclusters` — cluster center points by zoom level
- `ticket_geodata` — per-ticket cluster membership at each zoom level
