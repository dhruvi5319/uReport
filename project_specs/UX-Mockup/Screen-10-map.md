---

### Screen 10: Map View (Geo-Clustered Tickets)

**Route:** `/map` (also togglable from /tickets)  
**Purpose:** Visualize ticket density across the city. Staff identify neighborhood hotspots. Clusters drill down to individual ticket markers on zoom.  
**User Stories:** US-5.2, US-4.1  
**Personas:** Dana (PER-01), Marcus (PER-02)  
**Journey:** JRN-01.1 (implied — geospatial triage)

#### Layout (Desktop — 1280px+)

```
┌───────────────────────────────────────────────────────────────────────────┐
│ [Top Nav]                                               [⊞ List view]    │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│ ┌────────────────────────────────────────────────────────────────────┐   │  ← Map fills viewport
│ │                                                                    │   │
│ │  [Full-width interactive map — Leaflet / MapLibre]                 │   │
│ │                                                                    │   │
│ │          ⬤ 45              ⬤ 23                                   │   │  ← cluster circles
│ │       (red cluster)     (amber cluster)                            │   │
│ │                    ⬤ 8                                            │   │
│ │                  (green)                                           │   │
│ │                                          📍  📍  📍                │   │  ← individual markers
│ │                                          (high zoom: individual)   │   │
│ │                                                                    │   │
│ │  [─ zoom controls ─]                                               │   │
│ └────────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│ ┌────────────────────────────────────────────────────────────────────┐   │  ← Filter overlay panel
│ │ Filters (same as /tickets filter panel)                            │   │
│ │ Status: ● Open ○ Closed  │  Category: [All ▾]  │  [Apply]         │   │
│ └────────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│ ┌────────────────────────────────────────────────────────────────────┐   │  ← Ticket popup (on click)
│ │  📍  Ticket #4821                                    [View ticket] │   │
│ │       Pothole on Oak Avenue                                        │   │
│ │       Status: Open  🔴 SLA Breach                                  │   │
│ │       Assigned: Dana R.  |  Jun 21, 2026                          │   │
│ └────────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────────┘
```

#### Cluster Behavior

| Zoom Level | Behavior | API source |
|-----------|----------|-----------|
| 1–10 (city / region) | Large colored cluster circles, count shown | GET /api/tickets/clusters |
| 11–14 (neighborhood) | Medium clusters; ≤ 10 per cell → individual markers | GET /api/tickets/clusters |
| 15–20 (street level) | Individual ticket markers; cluster circles gone | GET /api/tickets (with bbox) |

**Cluster color by SLA status:**
- 🔴 Red cluster: ≥1 ticket in SLA breach within the cluster
- 🟡 Amber cluster: ≥1 ticket due within 24 hours (no breaches)
- 🟢 Green cluster: all tickets within SLA window
- Gray cluster: no SLA configured for tickets in cluster

#### Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Map with cluster circles | Full viewport |
| Primary | Ticket popup on cluster/marker click | Overlay at click point |
| Secondary | Filter panel | Bottom overlay (collapsible) |
| Secondary | Cluster counts | Inside each cluster circle |
| Tertiary | List view toggle | Top right |
| Tertiary | Zoom controls | Left side of map |

#### States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Loading clusters | Spinner overlay on map | "Loading ticket data..." |
| No tickets in viewport | Empty map with filter panel | "No tickets in this area. Zoom out or clear filters." |
| Cluster clicked | Zooms in one level (or shows popup if individual marker) | N/A |
| Individual marker clicked | Popup with ticket summary | [View ticket →] link |
| Geo service unavailable | Banner | "Map data temporarily unavailable." |
| Filter applied | Clusters refresh to reflect filtered tickets | N/A |

#### Interactive Elements

| Element | Type | Behavior |
|---------|------|----------|
| Cluster circle | Click | Zooms in one level; if <10 items, shows list popup |
| Individual marker | Click | Opens ticket summary popup |
| "View ticket" in popup | Navigation | /tickets/:id |
| Map drag/pan | Map interaction | Updates bbox; fetches new cluster data |
| Zoom in/out | Map controls | Changes cluster resolution |
| Filter panel | Collapsible | Apply filters → refreshes cluster data |
| "List view" toggle | Navigation | /tickets with same filters |

#### Mobile Map (375px)
- Map fills entire screen (no sidebar)
- Filter icon (⚙) in top-right opens a bottom sheet with filter controls
- Ticket popup appears as a bottom sheet (not an overlay bubble)
- "View ticket" in popup navigates to /tickets/:id
- Zoom controls accessible via pinch gesture + floating +/- buttons
