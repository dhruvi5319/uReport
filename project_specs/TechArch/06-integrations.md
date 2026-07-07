---

## 7. Integration Points

### 7.1 External System Dependencies

| System | Type | Direction | Required | Fallback |
|---|---|---|---|---|
| LDAP Server | Authentication | Outbound | Conditional (if LDAP enabled) | CAS; or local error if both disabled |
| CAS Server | Authentication SSO | Outbound | Conditional (if CAS enabled) | LDAP; or local error |
| SMTP Server | Email notifications | Outbound | Soft (non-fatal) | Notifications skipped; history entry saved |
| Mapbox GL JS | Map tiles + geocoding | Outbound (browser) | Soft | Leaflet + OpenStreetMap tiles |
| Nominatim (OSM) | Geocoding fallback | Outbound (server-side proxy) | Soft | Manual address entry only |
| Open311 Clients | API consumers | Inbound | N/A | N/A |
| PostgreSQL | Database | Internal (same OCI network / env var `DATABASE_URL`) | Required | None |

---

### 7.2 LDAP Integration

**Provider:** Spring Security LDAP  
**Protocol:** LDAP / LDAPS (configurable via `ldap.url`)  
**Auth mechanism:** Simple bind — Spring binds with `uid={username},ou=people,{base-dn}` and the provided password.  
**Attribute mapping:** Username extracted from the bind DN. No group attributes used; role is stored in `people.role`.

```
Spring Boot → LDAP bind request → LDAP Server
            ← success / BindException
```

**Failure handling:**
- `BindException` → 401 response; "Invalid credentials" message.
- LDAP server unreachable → 503; "Authentication service unavailable".
- Account locked (LDAP control response code 49) → 401; "Account locked".

---

### 7.3 CAS Integration

**Provider:** Spring Security CAS extension (spring-security-cas)  
**Protocol:** CAS 2.0 (service ticket validation via `/serviceValidate`)  
**Flow:**
1. Spring Security redirects to: `{casServer}/login?service={ureportServiceUrl}/auth/cas/callback`
2. After auth, CAS redirects to: `/auth/cas/callback?ticket={ST-xxxxx}`
3. Spring Security CAS filter calls: `GET {casServer}/serviceValidate?ticket=ST-xxxxx&service={serviceUrl}`
4. CAS returns XML with `<cas:authenticationSuccess><cas:user>{username}</cas:user></cas:authenticationSuccess>`
5. Spring Security extracts the username; `AuthService` looks up the `people` record.

**Single Sign-Out:** On `POST /api/auth/logout`, Spring Boot redirects to `{casServer}/logout?service={serviceUrl}`. CAS server then sends a back-channel POST to the service's SLO endpoint to invalidate all sessions.

---

### 7.4 SMTP Email Integration

**Provider:** Spring JavaMailSender  
**Protocol:** SMTP with STARTTLS (configurable; port 587 default)  
**Trigger:** `NotificationService.sendNotification()` called by `TicketService` after action history entry is saved.

**Email structure:**
- **From:** Configured system email address
- **Reply-To:** `category_action_responses.reply_email` → `actions.reply_email` → system default
- **To:** Reporter's `usedForNotifications = true` email (if "Notify Reporter") + assignee's notification email (if "Notify Assignee")
- **Subject:** `[uReport] Case #${ticketId} — ${actionName}`
- **Body:** Plain text with `ticket_history.notes` content + standard footer with case URL

**Failure handling:** SMTP send failure is non-fatal. The `ticket_history` record is committed. `sent_notifications` is set to the list of addresses successfully sent. On failure, a warning is appended to the API response. Staff sees a toast: "Action saved. Email notification failed to send."

---

### 7.5 Mapbox GL JS / Geocoding Integration

**Map rendering:** Mapbox GL JS in browser (React component via `react-map-gl`). Access token provided from environment variable (`VITE_MAPBOX_TOKEN`), delivered to the React app as a build-time env var.

**Geocoding (address autocomplete):**
- Primary: Mapbox Geocoding API (`GET https://api.mapbox.com/geocoding/v5/mapbox.places/{q}.json?access_token=...`)
- Fallback: Server-side proxy at `GET /api/geocode?q={address}` → forwards to Nominatim (OpenStreetMap)
- Debounce: 300 ms before issuing geocoding request
- Results shown as autocomplete dropdown; selecting a result sets lat/lon in form state

**Mapbox unavailability:**
- If `VITE_MAPBOX_TOKEN` is empty or undefined, React detects and renders Leaflet with OpenStreetMap tiles instead.
- Geocoding degrades to Nominatim via the server-side proxy.
- All map functionality remains available (pan, zoom, pin-drop) using Leaflet.

---

### 7.6 Open311 External Client Integration

External Open311 clients (mobile apps, 311 aggregators) call the frozen GeoReport v2 API:

```
Mobile App / Aggregator → GET /open311/v2/services        → Spring Boot → PostgreSQL
                        → GET /open311/v2/requests         → Spring Boot → PostgreSQL
                        → GET /open311/v2/requests/{id}    → Spring Boot → PostgreSQL
                        → POST /open311/v2/requests        → Spring Boot → PostgreSQL
                            (with api_key in query/header)
```

**API key lifecycle:**
1. Admin registers a new client record via `/api/clients` (generates UUID api_key).
2. Admin provides the api_key to the external client operator out-of-band.
3. External client includes `api_key` in every write request.
4. Spring Boot `Open311ApiKeyFilter` validates api_key against `clients.api_key` on each POST.
5. Revocation: admin deletes or updates the client record; key is immediately invalid.

**OBSOLETE_API_KEYS:** Keys listed in `open311.obsolete-api-keys` configuration receive the "mobile shutdown" category list on `GET /services` — three synthetic categories with instructional messages directing users to update their app. Preserved from existing PHP behavior.

---

### 7.7 File Storage

Media files are stored on the host filesystem via a persistent volume (mounted into the container):

```
Volume: media_files → mounted at /var/ureport/media (api container)
                    → optionally mounted at /var/ureport/media (nginx container for direct serving)

Directory structure:
/var/ureport/media/
  {ticket_id}/
    {uuid}.jpg          ← original file (internalFilename)
    {uuid}_thumb.jpg    ← 150×150 thumbnail (generated on first request)
```

**Thumbnail generation:** Thumbnailator library generates the thumbnail on first access of `GET /api/media/{mediaId}/thumbnail`. The thumbnail is cached on disk alongside the original. Subsequent requests serve the cached file.

**Backup:** The `media_files` volume should be included in the host backup strategy (rsync or cloud snapshot). No in-application backup mechanism is implemented.

---

## 8. Non-Functional Design Notes

### Performance Targets

| Metric | Target | Implementation |
|---|---|---|
| Case list initial load | ≤ 2 s (desktop) | Paginated query; GIN index for FTS |
| Search query P95 | ≤ 500 ms | `plainto_tsquery` + GIN index; ≤ 100K tickets |
| Open311 API P95 | ≤ 300 ms | Simple indexed queries; no JOIN-heavy operations |
| Dashboard load | ≤ 2 s | 4 parallel lightweight aggregate queries |
| Concurrent staff | ≥ 50 | HikariCP pool=20; embedded Tomcat threadpool |

### Browser Support

Chrome, Firefox, Safari, and Edge — latest 2 major versions. No IE11 support.

### Mobile Breakpoints

| Breakpoint | Width | Layout |
|---|---|---|
| Mobile | 375 px | Single-column, stacked; hamburger nav |
| Tablet | 768 px | 2-column grid; sidebar optional |
| Desktop | 1280 px+ | Full sidebar + split-pane layouts |

### Accessibility

- WCAG 2.1 Level AA compliance enforced via axe-core in CI and manual audit.
- All shadcn/ui components use Radix UI primitives with ARIA roles and keyboard navigation built in.
- `prefers-reduced-motion`: `useReducedMotion()` hook disables all Framer Motion variants globally.
- Focus indicators: visible on all interactive elements (`:focus-visible` ring via Tailwind).
- Touch targets: minimum 44 × 44 px on mobile.
- Color contrast: minimum 4.5:1 for normal text, 3:1 for large text (enforced in design token CSS vars).

---

*TechArch-UReport.md — uReport CRM Modernization v1.0 — 2026-07-06*
