
### R2: Full Operations — "Complete Staff and Admin Workflows"

**Theme:** Deliver all P1 capabilities. After R2, department administrators can fully configure categories, manage staff, and run scheduler jobs. System administrators can provision users and manage API clients. Case workers have media upload, location search, and email notifications.

**Story Count:** 24 P1 stories

**Stories in R2:**

| Story ID | Title | Primary Persona | Journey Enabled |
|----------|-------|----------------|----------------|
| US-5.1 | Create and Manage Staff User Accounts | PER-03 | JRN-03.1 Stage 4, JRN-02.3 Stage 2 |
| US-5.2 | Manage Multiple Emails, Phones, Addresses | PER-03 | JRN-02.3 / notification routing |
| US-5.3 | Search the People Directory | PER-01 | JRN-01.2 (person lookup) |
| US-5.4 | View All Tickets Associated With a Person | PER-01 | JRN-01.2 (repeat reporter) |
| US-6.1 | Create and Manage Departments | PER-02 | JRN-02.1 Stage 2 |
| US-6.2 | Assign Categories and Action Types to Departments | PER-02 | JRN-02.1 Stage 2, JRN-02.3 Stage 3 |
| US-7.1 | Create and Configure a Category | PER-02 | JRN-02.1 Stages 2–6 |
| US-7.2 | Manage Category Groups | PER-02 | JRN-02.1 Stage 2 |
| US-7.3 | Configure Auto-Close Rules Per Category | PER-02 | JRN-02.1 Stage 6 |
| US-8.1 | Create and Manage Substatuses | PER-02 | JRN-01.2 Stage 4 (prerequisite) |
| US-8.2 | Apply Substatus to Ticket Lifecycle Actions | PER-01 | JRN-01.2 Stage 4 |
| US-9.1 | Create and Manage Department Action Types | PER-02 | JRN-02.1 Stage 2 |
| US-9.2 | Configure Category Action Response Overrides | PER-02 | JRN-02.1 Stage 6 |
| US-9.3 | Render Template Variables in History Descriptions | PER-01 | JRN-01.2 Stage 3 |
| US-10.1 | Upload Media to a Ticket | PER-01 | JRN-01.2 Stage 5 |
| US-10.2 | Serve Media Files and Thumbnails | PER-01 | JRN-01.2 Stage 5 |
| US-13.1 | Register and Manage an API Client | PER-03 | JRN-03.2 Stage 2 |
| US-13.2 | API Key Rotation | PER-03 | JRN-03.2 Stage 4 |
| US-15.1 | Capture and Validate Ticket Location | PER-01 | JRN-01.2 (location) |
| US-15.2 | Rebuild Geo-Clusters via Scheduled Job | PER-03 | JRN-03.3 Stage 2 |
| US-15.3 | Location-Based Ticket Search | PER-01 | JRN-01.1 Stage 3 (geo filter) |
| US-16.1 | Receive Email Notification After Ticket Action | PER-01 | JRN-01.2 (notification confirmation) |
| US-16.2 | Auto-Close Stale Tickets by Category Rule | PER-02 | JRN-03.3 Stage 3 |
| US-16.3 | Audit Data Integrity via Scheduled Job | PER-03 | JRN-03.3 Stage 3 |

**Personas Served by R2 (incremental, adds to R1):**
- PER-02 Diana (Dept Admin) — first release where Diana's primary journey is fully enabled
- PER-03 Jordan (Sys Admin) — full user management, API client management, scheduler health
- PER-01 Marcus — enhanced with media upload, location search, email notifications, substatus

**JTBD Addressed by R2 (completing what R1 started):**

| JTBD-ID | Status after R2 |
|---------|----------------|
| JTBD-01.1 | ✅ Complete + enhanced (geo filters, substatus filter) |
| JTBD-01.2 | ✅ Complete — media upload, substatus, template variables, notifications all live |
| JTBD-01.3 | ❌ Deferred to R3 |
| JTBD-02.1 | ✅ Complete — full category config, auto-close, action responses |
| JTBD-02.2 | ❌ Deferred to R3 |
| JTBD-02.3 | ✅ Complete — Dept admin can create people, assign to categories without Jordan |
| JTBD-03.1 | ✅ Complete — user CRUD, JWT migration verified, auth logs |
| JTBD-03.2 | ✅ Complete — API client registration and key rotation without service restart |
| JTBD-03.3 | ✅ Complete — scheduler logs, geo-cluster job, audit job, Open311 integration tests |
| JTBD-04.1 | ✅ Complete (carried from R1) |
| JTBD-04.2 | ✅ Complete (carried from R1) |
| JTBD-04.3 | ✅ Complete (carried from R1) |

**Complete Journeys Newly Enabled by R2:**
- ✅ JRN-02.1 (Category Configuration) — all 6 stages covered
- ✅ JRN-02.3 (Staff Onboarding) — all 5 stages covered
- ✅ JRN-03.1 (Post-Migration JWT Validation) — all 5 stages covered
- ✅ JRN-03.2 (API Client Registration & Key Rotation) — all 5 stages covered
- ✅ JRN-03.3 (Post-Deployment Health Verification) — all 5 stages covered

---
