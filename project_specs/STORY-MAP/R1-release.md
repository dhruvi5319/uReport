---

## Release Planning

---

### Release R1 — "Core Workflows & Platform Foundation"

**Theme:** Deliver the complete core staff and public workflows with zero regressions on Open311, authentication, database migration, design system, and accessibility. R1 makes the system fully operational for Marcus (311 Operator) and Priya (Citizen Reporter) and lays the foundation for all subsequent releases.

**Journey Completeness Enabled:**
- ✅ JRN-01.1: Live-Call Case Intake — complete end-to-end
- ✅ JRN-01.2: Caller Status Inquiry — complete end-to-end
- ✅ JRN-01.3: Storm Event Bulk Cleanup — complete end-to-end
- ✅ JRN-04.1: Mobile Service Request Submission — complete end-to-end
- ⬜ JRN-02.x: Diane's journeys — Login and basic case views covered; overdue/dashboard in R2
- ⬜ JRN-03.x: Jordan's admin journeys — deferred to R2

**Stories in R1 (50 stories — all P0):**

| Story ID | Title | Epic | Primary Persona | JTBD |
|---|---|---|---|---|
| US-0.1 | List Available Services (Open311) | F0 | External clients | JTBD-03.2 |
| US-0.2 | Retrieve Service Requests with Filters (Open311) | F0 | External clients | JTBD-03.2 |
| US-0.3 | Submit a New Service Request via Open311 | F0 | External clients | JTBD-03.2 |
| US-0.4 | Retrieve a Single Service Request by ID | F0 | External clients | JTBD-03.2 |
| US-1.1 | Create a New Ticket from a Phone Call | F1 | PER-01 Marcus | JTBD-01.1 |
| US-1.2 | Close a Ticket with a Substatus | F1 | PER-01 Marcus | JTBD-01.1, JTBD-02.2 |
| US-1.3 | Reopen a Closed Ticket | F1 | PER-01 Marcus | JTBD-01.1 |
| US-1.4 | Assign a Ticket to a Staff Person | F1 | PER-01 Marcus | JTBD-01.1, JTBD-02.1 |
| US-1.5 | Perform Bulk Operations on Multiple Tickets | F1 | PER-01 Marcus | JTBD-01.3 |
| US-2.1 | Complete the Multi-Step Submission Wizard on Mobile | F2 | PER-04 Priya | JTBD-04.1 |
| US-2.2 | Drop a Map Pin to Identify Issue Location | F2 | PER-04 Priya | JTBD-04.2 |
| US-2.3 | Upload a Photo from Phone Camera During Submission | F2 | PER-04 Priya | JTBD-04.1 |
| US-2.4 | Receive a Confirmation Screen with Case ID | F2 | PER-04 Priya | JTBD-04.3 |
| US-3.1 | Search for a Case Using Live Full-Text Search | F3 | PER-01 Marcus | JTBD-01.2 |
| US-3.2 | Filter the Case List by Multiple Criteria | F3 | PER-01 Marcus, PER-02 Diane | JTBD-01.2, JTBD-02.1 |
| US-3.3 | Sort the Case List by Column | F3 | PER-01 Marcus | JTBD-01.2 |
| US-3.4 | Paginate Through the Case List | F3 | PER-01 Marcus | JTBD-01.3 |
| US-3.5 | Save a Search as a Bookmark for Quick Recall | F3 | PER-02 Diane | JTBD-02.1 |
| US-3.6 | Export Case List Results to CSV | F3 | PER-01 Marcus | JTBD-01.3 |
| US-4.1 | View Complete Case Metadata and History on One Screen | F4 | PER-01 Marcus | JTBD-01.1, JTBD-01.2 |
| US-4.2 | Edit Case Fields Inline Without Leaving the Screen | F4 | PER-01 Marcus | JTBD-01.2, JTBD-02.3 |
| US-4.3 | Log a Response and Optionally Notify the Reporter | F4 | PER-02 Diane | JTBD-02.2 |
| US-4.4 | Use a Response Template to Pre-Fill Action Notes | F4 | PER-02 Diane | JTBD-02.2 |
| US-9.1 | Automatic System Action Created on Ticket Events | F9 | PER-01 Marcus | JTBD-01.1 |
| US-9.2 | Send Email Notification to Reporter on Action | F9 | PER-01 Marcus, PER-04 Priya | JTBD-01.1, JTBD-04.3 |
| US-9.3 | Load Response Template into Action Notes | F9 | PER-02 Diane | JTBD-02.2 |
| US-11.1 | Search Tickets with PostgreSQL Full-Text Search | F11 | PER-01 Marcus | JTBD-01.2 |
| US-11.2 | See Highlighted Keyword Matches in Search Results | F11 | PER-01 Marcus | JTBD-01.2 |
| US-11.3 | Search and Filter Can Be Combined | F11 | PER-02 Diane | JTBD-02.1 |
| US-11.4 | Search Vector Auto-Maintained by Database Trigger | F11 | PER-03 Jordan | JTBD-03.1 |
| US-12.1 | Log In via CAS Single Sign-On | F12 | PER-01 Marcus, PER-02 Diane | JTBD-02.1 |
| US-12.2 | Log In via LDAP Credentials | F12 | PER-02 Diane | JTBD-02.1 |
| US-12.3 | Session Expiry and Automatic Token Refresh | F12 | PER-01 Marcus | JTBD-02.2 |
| US-12.4 | Sign Out and Invalidate the Session | F12 | PER-01 Marcus | JTBD-01.1 |
| US-12.5 | View and Update Own Profile on the Account Screen | F12 | PER-01 Marcus | JTBD-01.1 |
| US-17.1 | Use a Consistent, Branded Design System Across All Screens | F17 | All | All |
| US-17.2 | Toggle Dark Mode and Have the Preference Persisted | F17 | PER-01 Marcus | JTBD-01.1 |
| US-17.3 | Experience Smooth Animations Respecting Motion Preferences | F17 | PER-04 Priya | JTBD-04.1 |
| US-18.1 | Navigate the Application Using the Persistent Navbar and Sidebar | F18 | PER-01 Marcus | JTBD-01.1 |
| US-18.2 | Navigate the Application on a Mobile Device via the Hamburger Drawer | F18 | PER-02 Diane | JTBD-02.2 |
| US-18.3 | Use Keyboard Navigation and Skip Links for Accessibility | F18 | All | All |
| US-19.1 | Access All Features Using Only a Keyboard | F19 | All staff | All |
| US-19.2 | Use a Screen Reader to Operate the Application | F19 | All | All |
| US-19.3 | Use the Application Comfortably on a Mobile Device | F19 | PER-02 Diane, PER-04 Priya | JTBD-02.2, JTBD-04.1 |
| US-19.4 | Read Content with Sufficient Color Contrast | F19 | All | All |
| US-21.1 | Migrate the Full MySQL Schema to PostgreSQL via Flyway | F21 | PER-03 Jordan | JTBD-03.1 |
| US-21.2 | Migrate All Production Data from MySQL to PostgreSQL | F21 | PER-03 Jordan | JTBD-03.1 |

> **Note:** US-2.1 is in R1 because the public form Verify stage (Jordan confirming a new category appears immediately) makes use of it — but the story itself is primarily R1 as the public submission flow is a P0 feature.

**Personas Served in R1:**
- ✅ PER-01 Marcus — Primary: full case intake, search, status lookup, bulk close
- ✅ PER-04 Priya — Primary: complete mobile submission journey
- ✅ PER-02 Diane — Partial: authentication, basic case list/detail, close from field (mobile layout)
- ⬜ PER-03 Jordan — Infrastructure only (DB migration, search trigger)

**JTBD Addressed in R1:**
- ✅ JTBD-01.1: Live-call case intake — fully covered
- ✅ JTBD-01.2: Instant case lookup — fully covered
- ✅ JTBD-01.3: Bulk cleanup of duplicates — fully covered
- ✅ JTBD-04.1: Frictionless mobile submission — fully covered
- ✅ JTBD-04.2: Map-based location identification — fully covered
- ✅ JTBD-04.3: Submission confirmation and case reference — fully covered
- ⬜ JTBD-02.1: Department triage — partially covered (case list + filter, not dashboard)
- ⬜ JTBD-02.2: Field closure with photo — partially covered (mobile layout + close, not photo upload)
- ⬜ JTBD-02.3: Overdue escalation — partially covered (timeline visible, not overdue dashboard)
- ⬜ JTBD-03.1: Service taxonomy config — deferred to R2
- ⬜ JTBD-03.2: API client onboarding — partially covered (API works; admin UI in R2)
- ⬜ JTBD-03.3: Vendor API documentation — deferred to R2

---
