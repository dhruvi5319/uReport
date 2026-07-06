## Epic 16: Geo-Clustering for Map Views (F16)

The geo-clustering feature pre-computes geographic clusters of ticket pins for legible map rendering in dense urban areas. Cluster data is migrated from MySQL to PostgreSQL and rendered via Mapbox GL JS / Leaflet.

---

### US-16.1: View Clustered Ticket Pins on the Map
**As a** Marcus Rivera (311 Operator), **I want to** see open ticket pins clustered into bubble groups on the dashboard map at low zoom levels, **so that** densely reported areas remain readable without overlapping pins.

**Acceptance Criteria:**
- [ ] At low zoom levels, the map shows cluster bubbles from the `geoclusters` table, each displaying the count of constituent tickets
- [ ] At high zoom levels, the map shows individual ticket pins from `ticket_geodata`
- [ ] Clicking a cluster bubble zooms in one level to reveal constituent clusters or individual pins
- [ ] Clicking an individual pin shows a popover: ticket ID, category, status, and a link to case detail
- [ ] Pre-computed `geoclusters` data is migrated from MySQL to PostgreSQL with no data loss
- [ ] Cluster rendering works with both Mapbox GL JS and Leaflet fallback

**Priority:** P2 | **Feature Ref:** F16

---

### US-16.2: View a Single Ticket Pin on Case Detail Map
**As a** Marcus Rivera (311 Operator), **I want to** see the exact location of a ticket displayed as a single pin on the map in the case detail view, **so that** I can verify the reported address is correct and understand the geographic context.

**Acceptance Criteria:**
- [ ] The case detail metadata panel includes a map widget showing a single pin at `tickets.latitude` / `tickets.longitude`
- [ ] If lat/lon is null (no coordinates), the map widget shows a "Location not set" placeholder
- [ ] The pin is not interactive (no click action needed) — display only
- [ ] Map tile load failure shows an error tile; case metadata is still displayed normally

**Priority:** P2 | **Feature Ref:** F16

---
