# Personas: uReport Modernization

| Field | Value |
|---|---|
| **Product Name** | uReport — Municipal Constituent Issue Tracking System |
| **Version** | 1.0 |
| **Date** | 2026-06-24 |
| **Related PRD** | `project_specs/PRD-uReport.md` |
| **Source** | PRD Section 2.2 (Target Users), Section 2 (Problem Statement), Section 5 (Features) |

---

## Persona Summary

| PER-ID | Name | Role | Primary Goal |
|--------|------|------|--------------|
| PER-01 | Marcus Webb | City Case Worker (Staff) | Efficiently manage a daily caseload — create, update, assign, close, and communicate on constituent tickets with minimal friction |
| PER-02 | Diana Reyes | Department Administrator | Configure and maintain her department's categories, SLAs, and staff assignments so tickets route correctly and close on time |
| PER-03 | Jordan Kim | System Administrator | Maintain the full platform — users, API clients, system config, and deployment health — across all departments |
| PER-04 | Integra Transit App | External API Client / Third-Party Integrator | Submit and retrieve service requests via the Open311 API reliably without any changes to existing integration code |

> **Note on constituents:** Public citizens who submit tickets via the web form or mobile apps are indirect users of uReport. Their interaction surface is the Open311 API and any public-facing ticket status page. They are represented here through PER-04 (API integration) and through the constituent-facing constraints embedded in PER-01's daily work. A dedicated "Constituent" persona is omitted because this project is a 1:1 migration — no new constituent-facing UI is being designed.

---

## PER-01: Marcus Webb

**Role Title:** City Case Worker (Staff)

**Role & Context:**
Marcus is a case worker in a mid-size municipality's public works department. He manages an active queue of 30–60 open tickets at any given time, covering everything from pothole reports to illegal dumping complaints. He works primarily from a desktop browser, logged into uReport 6–7 hours per day. His workflow alternates between reviewing his assigned queue, communicating status updates to constituents, and escalating tickets to supervisors when SLAs approach. Marcus coordinates daily with 4–5 colleagues and reports to a department supervisor who expects weekly closure metrics. He occasionally needs to look up a constituent's full history to handle repeat callers or investigate duplicate tickets.

**Goals:**
- Work through his daily ticket queue without switching between multiple tools or spreadsheets (F0, F11)
- Find any ticket in under 30 seconds using keyword, address, or constituent name search (F11)
- Record comments, responses, and media attachments on tickets without navigating away from the ticket (F0, F1, F10)
- Avoid missing SLA deadlines by seeing overdue or near-deadline tickets prominently in filtered views (F0, F8, F12)
- Communicate with constituents via templated response actions so responses are consistent and fast (F9, F20)
- Export a set of tickets to CSV or print when preparing a briefing for his supervisor (F0, F18)

**Pain Points (from PRD Section 2):**
- The legacy PHP session auth cannot serve a modern SPA, causing slow page transitions and inconsistent state across tabs
- Server-side template rendering means the ticket list and search results reload fully on every filter change — no live filtering
- Bulk exports (CSV/print) require navigating separate pages with no feedback while the server renders
- No persistent saved searches — Marcus rebuilds the same filter combinations every morning (addressed by F12)

**Technical Expertise:** Intermediate — fluent in web apps and forms, not a developer. Comfortable with browser-based tools; avoids anything requiring command-line interaction.

**Top Tasks:**
1. Review and triage assigned ticket queue each morning, filtering by status and due date (daily, critical)
2. Open, update, and close tickets — including attaching photos and recording response notes (daily, critical)
3. Search for a ticket by constituent name, address, or keyword (many times per day, high)
4. Reassign a ticket to a colleague or different department (weekly, medium)
5. Save a recurring search as a bookmark and navigate to it on return (weekly, medium)

**Success Criteria:**
- Can locate any ticket by keyword or address in under 30 seconds
- Can complete a full ticket update (comment + status change + media attach) in under 3 minutes
- Saved bookmark searches load in under 2 seconds
- Zero SLA-breached tickets due to system confusion or navigation friction
- CSV export of a 200-ticket search result set completes in under 10 seconds

---

## PER-02: Diana Reyes

**Role Title:** Department Administrator (Streets & Sanitation)

**Role & Context:**
Diana is the operations manager for the Streets and Sanitation department, responsible for a staff of 12 case workers and 3 supervisors. She uses uReport in an administrative capacity — she rarely handles individual tickets herself, but she owns the configuration layer: which service categories are active, what custom fields each category collects, what SLA targets are set, and which staff members are assigned to each category. Diana also monitors the metrics dashboard to track SLA compliance trends and flags categories that are falling behind on closures. She interacts with the System Administrator (Jordan) to request new user accounts and occasionally to register an API client for a departmental app. Diana logs in to uReport 2–3 times per week for configuration tasks and daily during reporting periods.

**Goals:**
- Keep her department's category taxonomy accurate and current so tickets route to the right people without manual intervention (F7, F6)
- Set realistic SLA targets per category and get early warning when a category is falling behind (F7, F17)
- Ensure the right staff get auto-assigned tickets when a new ticket enters her department (F6, F7)
- Define custom fields for categories that require structured data from constituents (e.g., which pothole — intersection vs. midblock) (F7)
- Manage her staff's access and assignments without needing to call the system admin for routine changes (F5, F6)
- Review on-time closure percentages and volume trends by category at the end of each month (F17)

**Pain Points (from PRD Section 2):**
- The legacy template-driven rendering makes the category configuration screens slow to iterate — each save triggers a full page reload
- Category custom field schema editing requires hand-editing JSON in a text field with no validation feedback
- SLA reporting requires navigating to a separate reports screen and manually assembling filter combinations each time
- There is no departmental dashboard — Diana must run 3–4 separate reports and mentally stitch the picture together

**Technical Expertise:** Moderate — comfortable with form-based admin UIs and structured configuration. Does not write code but understands JSON field schema at a conceptual level. Expects clear labels and validation feedback.

**Top Tasks:**
1. Create or update a service category — setting active status, permission level, SLA days, default assignee, and custom field schema (weekly, critical)
2. Review the metrics dashboard for SLA compliance by category over the past 30 days (monthly, high)
3. Add a new staff member to her department and assign them to the appropriate categories (as needed, high)
4. Define or update a category action response template for her department's outbound communications (quarterly, medium)
5. Pull a volume trend report to forecast staffing needs for the upcoming quarter (monthly, medium)

**Success Criteria:**
- Can create or fully reconfigure a category (all fields, SLA, custom fields, assignee) in under 10 minutes
- Metrics dashboard loads her department's 30-day SLA summary in under 5 seconds
- Can add a new staff member and assign to 3 categories in under 5 minutes without system admin involvement
- Custom field schema changes take effect on the next ticket submission without a deployment

---

## PER-03: Jordan Kim

**Role Title:** System Administrator

**Role & Context:**
Jordan is the IT administrator for the municipality who owns uReport's operational health end-to-end. He manages all user accounts across departments, registers and keys external API clients, handles the Docker deployment and upgrades, and is the point of contact when the system behaves unexpectedly. Jordan is not a day-to-day ticket worker — his job is to keep the platform reliable, secure, and correctly configured for the staff who depend on it. He interacts with the uReport admin surfaces several times a week: onboarding new staff users, rotating API keys, reviewing system logs when a department reports a bug, and performing scheduled maintenance. After the modernization, Jordan will be responsible for migrating user accounts, validating JWT auth works for all staff, and confirming that registered API clients authenticate successfully against the new Spring Boot backend.

**Goals:**
- Manage all user accounts and roles from a single admin interface without touching the database directly (F5, F3)
- Register, key, and retire external API clients without code changes (F13)
- Ensure the JWT auth migration preserves all existing staff logins with no manual password resets (F4)
- Monitor the deployment via `docker-compose` using a familiar interface — same service names and ports as the legacy stack (NFR-5)
- Validate Open311 API compatibility after each deployment by running automated tests (F2, NFR-1)
- Confirm all cron-driven jobs (digest notifications, auto-close, audit) run reliably via Spring Scheduler (F16)

**Pain Points (from PRD Section 2):**
- The legacy PHP session auth cannot serve API clients or the SPA, forcing Jordan to maintain two separate auth paths
- The Solr process requires separate JVM tuning and ops monitoring — a distinct operational burden from the rest of the stack
- The Ansible + Apache deployment model diverges from Docker-native operations, requiring Jordan to maintain separate configuration tooling
- API keys are stored unhashed in the legacy database, creating a security exposure he cannot remediate without a code change

**Technical Expertise:** High — fluent in Docker, Linux, SQL, and web APIs. Comfortable reading logs, running database queries, and inspecting JWT tokens. Not a Java or React developer but can read stack traces and configuration files.

**Top Tasks:**
1. Create, update, or deactivate user accounts and assign roles (weekly, critical)
2. Register a new API client — assign an API key and link to a contact person (monthly, high)
3. Rotate or revoke an API key for an existing client (as needed, high)
4. Verify that all Spring Scheduler jobs (notification digest, auto-close, audit) ran successfully overnight (daily during initial rollout, medium)
5. Run the Open311 response-shape integration tests after a deployment to confirm backward compatibility (per deployment, critical)

**Success Criteria:**
- Can create a new staff user, assign role, and associate with a department in under 3 minutes
- API key rotation is reflected immediately without a service restart
- All legacy staff accounts authenticate via JWT after migration with zero manual interventions
- Spring Scheduler job execution is visible in logs with timestamp, job name, and outcome
- `docker-compose up` from clean checkout completes in under 10 minutes (NFR-5)

---

## PER-04: Integra Transit App

**Role Title:** External API Client / Third-Party Integrator

**Role & Context:**
Integra is a representative external application — a transit-authority constituent portal that has been programmatically integrated with uReport via the Open311 GeoReport v2 API for several years. Integra's backend submits service requests (pothole reports, signal outages) on behalf of riders using a registered API key, and its frontend polls for status updates on previously submitted requests to show constituents their ticket status. Integra's developers wrote their integration once against the existing PHP uReport's Open311 endpoints and have not revisited it since. Any change to the JSON or XML response shapes — field names, types, ordering, HTTP status codes, or error response structures — would break Integra's parser without notice. This persona represents all registered external API clients: mobile apps, other city department systems, civic tech integrations, and Open311 aggregators.

**Goals:**
- Submit service requests (POST /open311/requests) and receive a valid service_request_id without any code changes after the migration (F2, F4)
- Retrieve service request status (GET /open311/requests/{id} and GET /open311/requests) with byte-identical JSON/XML response shapes (F2, F18, NFR-1)
- Discover available services (GET /open311/services) and get accurate custom attribute schemas for each service code (F2, F7)
- Authenticate write operations using existing API keys without re-registration (F13, F4, NFR-8)
- Receive HTTP 403 and 404 error responses in the same format as the legacy system for invalid or unauthorized requests (F2, F3)

**Pain Points (from PRD Section 2):**
- PHP session auth is irrelevant to Integra — it always used API keys. The risk is that the JWT migration could inadvertently change API key validation semantics
- The legacy Solr-to-MySQL ticket search powering GET /open311/requests returns results in a specific ordering and pagination format; any drift in search result ordering or field presence would break Integra's parser
- If the XML format for any Open311 endpoint changes even slightly (e.g., a CDATA wrapping added, a null field omitted vs. returned as empty string), Integra's XML parser will silently fail or crash

**Technical Expertise:** N/A — this is a software system, not a human. Its "expertise" is the rigidity of its parser against the existing Open311 contract.

**Top Tasks:**
1. POST /open311/requests — submit a new service request with API key, service_code, lat/long, description, and optional custom attributes (on constituent action, critical)
2. GET /open311/requests/{id} — poll for status update on a submitted request (on constituent page load, critical)
3. GET /open311/services — enumerate active service types and their custom attribute schemas on app startup (daily, high)
4. GET /open311/requests with filter params — retrieve recent open requests in a geographic area (background sync, medium)
5. GET /open311/discovery — read API metadata and endpoint URLs on configuration refresh (weekly, low)

**Success Criteria:**
- Zero changes required to Integra's integration code after uReport migration
- All Open311 JSON and XML response payloads pass byte-level comparison against legacy PHP fixtures (NFR-1)
- Existing API key authenticates successfully against Spring Boot backend (F4, F13)
- HTTP error response shapes (403, 404) are identical to legacy system
- GET /open311/requests pagination, field ordering, and null-handling are indistinguishable from legacy output

---

## Persona Relationships

| Persona | Interacts With | Nature of Interaction |
|---------|---------------|----------------------|
| PER-01 Marcus (Case Worker) | PER-02 Diana (Dept Admin) | Marcus's ticket routing, category assignment, and SLA targets are all configured by Diana. Diana reviews Marcus's team closure metrics. |
| PER-01 Marcus (Case Worker) | PER-03 Jordan (Sys Admin) | Jordan provisions Marcus's user account and role. Marcus contacts Jordan when auth fails or the system is unreachable. |
| PER-02 Diana (Dept Admin) | PER-03 Jordan (Sys Admin) | Diana requests new user accounts from Jordan. Jordan handles API client registration that may feed into Diana's department categories. |
| PER-03 Jordan (Sys Admin) | PER-04 Integra (API Client) | Jordan registers Integra as a client, generates and rotates its API key, and monitors its request activity in the system. |
| PER-04 Integra (API Client) | PER-01 Marcus (Case Worker) | Tickets submitted by Integra appear in Marcus's work queue just like web-submitted tickets. Marcus closes them; Integra polls for that status change. |
| PER-04 Integra (API Client) | PER-02 Diana (Dept Admin) | Diana's category configuration (active/inactive, posting permission, custom fields) directly determines what Integra can submit via the Open311 API. |

---

## Feature–Persona Matrix

**Key:** P = Primary user of this feature | S = Secondary / indirectly affected | — = Not applicable

| Feature | PER-01 Marcus (Case Worker) | PER-02 Diana (Dept Admin) | PER-03 Jordan (Sys Admin) | PER-04 Integra (API Client) |
|---------|----------------------------|--------------------------|--------------------------|------------------------------|
| **F0** Ticket / Case Lifecycle Management | P | S | — | S |
| **F1** Ticket History and Action Log | P | S | — | — |
| **F2** Open311 GeoReport v2 REST API | S | S | S | P |
| **F3** Role-Based Access Control | S | S | P | S |
| **F4** Authentication — JWT / Spring Security | P | P | P | P |
| **F5** People / Contact Management | P | S | P | — |
| **F6** Department Administration | — | P | P | — |
| **F7** Category and Category-Group Management | S | P | S | S |
| **F8** Substatus System | P | P | S | — |
| **F9** Action Types and Response Templates | P | P | — | — |
| **F10** Media / Attachment Upload | P | — | — | S |
| **F11** Full-Text Search (PostgreSQL FTS) | P | S | — | S |
| **F12** Bookmarks (Staff Saved Searches) | P | — | — | — |
| **F13** API Client Management | — | — | P | S |
| **F14** Contact Method Tracking | P | S | — | S |
| **F15** Location / Address Management & Geo-Clusters | P | S | S | S |
| **F16** Digest Email Notifications | S | S | P | — |
| **F17** Metrics and Reporting Dashboard | S | P | S | — |
| **F18** Multi-Format Output Feeds | S | — | S | P |
| **F19** Issue Type Management | P | P | S | — |
| **F20** Response Templates | P | P | — | — |

---

*PERSONAS generated 2026-06-24 | uReport Modernization Project*
