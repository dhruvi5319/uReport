---

## F16: Digest Email Notifications

**Description:** uReport sends outbound email notifications to constituents and staff when ticket events occur. The legacy PHP cron scripts (`digestNotifications.php`, `closeOldTickets.php`, `auditTickets.php`) are replaced by Spring Scheduler jobs. Notification emails are templated via the action template system (F09). Each `ticketHistory` entry records which emails were dispatched in `sentNotifications`. The scheduler also handles auto-close of stale tickets and periodic audit/integrity checks.

---

### Terminology

- **Digest notification:** A notification email sent to a reporter or staff member when a relevant ticket history event occurs.
- **notificationReplyEmail:** The reply-to email for notifications, set per-category in `categories.notificationReplyEmail`.
- **replyEmail:** An action-level or category_action_response-level override for the reply-to address.
- **sentNotifications:** A serialized list of email addresses that received notifications for a given `ticketHistory` entry, stored in `ticketHistory.sentNotifications`.
- **usedForNotifications:** A flag on `peopleEmails` — only flagged addresses receive digest notifications.
- **digestNotifications job:** The Spring Scheduler task replacing `digestNotifications.php`. Fires on a configurable schedule.
- **autoClose job:** The Spring Scheduler task replacing `closeOldTickets.php`. Fires nightly.
- **audit job:** The Spring Scheduler task replacing `auditTickets.php`. Fires on a configurable schedule.

---

### Sub-features

- Run scheduled digest notification job
- Identify pending notification history entries
- Render notification emails via action template variable substitution
- Send to all usedForNotifications emails for the reporter
- Record sent addresses in ticketHistory.sentNotifications
- Run scheduled auto-close job (close stale tickets per category auto-close rules)
- Run scheduled audit job (data integrity checks)

---

### Process

#### Digest Notification Job
1. `DigestNotificationScheduler` fires on schedule (default: every 5 minutes, configurable via `app.scheduler.digestInterval`).
2. Job queries `ticketHistory` entries where `sentNotifications IS NULL` AND `action_id` has a non-null `template` OR the category has a `category_action_response` for this action.
3. For each qualifying history entry:
   a. Load the ticket, category, action, and reporter's people record.
   b. Select the effective template: category_action_response.template > action.template.
   c. Select the effective replyEmail: category_action_response.replyEmail > action.replyEmail > category.notificationReplyEmail.
   d. Interpolate template variables (see F09 §Template Variable Reference).
   e. Collect all `peopleEmails.email` where `person_id = ticket.reportedByPerson_id` AND `usedForNotifications = true`.
   f. Send one email per address via configured SMTP/mail service.
   g. Set `ticketHistory.sentNotifications = comma-joined list of sent addresses`.
4. Job logs total entries processed, emails sent, failures.

#### Auto-Close Job
1. `AutoCloseScheduler` fires nightly (default: 1 AM, configurable).
2. Job queries categories where `autoCloseIsActive = true`.
3. For each such category, queries tickets where:
   - `status = 'open'`
   - `category_id = category.id`
   - `lastModified < NOW() - INTERVAL slaDays DAY` (or a separate `autoCloseDays` config per category if available; falls back to `slaDays`).
4. For each stale ticket:
   a. Sets `tickets.status = 'closed'`, `closedDate = NOW()`, `substatus_id = category.autoCloseSubstatus_id`.
   b. Appends `ticketHistory` entry with action "closed", `notes = 'Auto-closed by scheduler'`.
5. Logs count of auto-closed tickets.

#### Audit Job
1. `AuditScheduler` fires weekly (default: Sunday 3 AM, configurable).
2. Checks for data integrity issues: orphaned history entries, tickets with null category, missing geo_point when lat/long present.
3. Logs issues to application log; does not auto-correct.

---

### Email Message Format

- **Subject:** Configurable; default uses category name and ticket ID: `"[uReport] #{ticketId} - {categoryName} Update"`.
- **From:** Configurable system email (`app.mail.from`).
- **Reply-To:** Effective `replyEmail` (see above).
- **Body:** Rendered template text (plain text; optionally HTML if template contains HTML tags).
- **Footer:** Configurable system footer text (`app.mail.footer`).

---

### Inputs

*(Consumed internally by scheduler — not direct API inputs)*

- `ticketHistory` entries with null `sentNotifications` and non-null action template.
- `categories.autoCloseIsActive`, `categories.autoCloseSubstatus_id`, `categories.slaDays`.
- `peopleEmails.usedForNotifications`.
- SMTP configuration: `app.mail.host`, `app.mail.port`, `app.mail.username`, `app.mail.password`, `app.mail.from`.

---

### Outputs

- Outbound SMTP emails to constituent notification addresses.
- Updated `ticketHistory.sentNotifications` fields.
- Auto-closed tickets (status + history entries).
- Scheduler execution logs.

---

### Validation Rules

- Only emails with `usedForNotifications = true` receive digest notifications.
- `sentNotifications` is set once per history entry; job must not re-send to already-notified addresses.
- Auto-close only applies to tickets with `status = 'open'`; closed tickets are not re-closed.
- Auto-close requires `autoCloseSubstatus_id` to reference a valid closed-type substatus.
- Notification job is idempotent: a history entry with non-null `sentNotifications` is skipped.
- Email delivery failures are logged but do not prevent `sentNotifications` from being set (mark as sent even on failure to prevent retry loops; alternatively track failure status separately).
- Scheduler cron expressions are configurable via `application.yml`; defaults must match legacy PHP cron timing.

---

### Error States

*(All scheduler errors are logged; no HTTP responses)*

| Scenario | Log Level | Action |
|----------|-----------|--------|
| SMTP connection failure | ERROR | Log; mark notification as failed (null sentNotifications retained); retry next cycle |
| Template variable resolution failure | WARN | Log; send email with unresolved variable literal |
| Auto-close substatus not found | ERROR | Log; skip ticket; alert admin |
| Audit finds orphaned history | WARN | Log anomaly count |

---

### API Surface (this feature)

No direct REST API. Admin trigger endpoints for manual job execution:

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/admin/jobs/digest-notifications/run` | staff | Manually trigger digest job |
| POST | `/api/v1/admin/jobs/auto-close/run` | staff | Manually trigger auto-close job |
| POST | `/api/v1/admin/jobs/audit/run` | staff | Manually trigger audit job |

---

### Schema Surface (this feature)

No new tables. Uses existing: `ticketHistory.sentNotifications` (TEXT), `categories.autoCloseIsActive`, `categories.autoCloseSubstatus_id`, `categories.slaDays`, `categories.notificationReplyEmail`, `actions.template`, `actions.replyEmail`, `category_action_responses.template`, `category_action_responses.replyEmail`, `peopleEmails.usedForNotifications`.
