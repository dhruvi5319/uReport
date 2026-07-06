# Flow-04: Field Resolution Closure with Photo Evidence

**Trigger:** Diane is at a completed job site; needs to close the case, log resolution, attach photos, notify reporter — all on her phone
**User Stories:** US-1.2, US-4.3, US-9.2, US-10.2, US-4.1
**Journey:** JRN-02.2 — Field Resolution Closure
**Success Metric:** Case closed with 2 photos from 375 px mobile browser in ≤3 minutes

---

## Flow Diagram

```
[Diane opens uReport mobile browser]
        │
        ▼
[CAS session persists — no re-login needed]
        │
        ▼
[/cases — pre-filtered to My Department, mobile layout]
  → Large touch targets (≥44px)
  → Case 4812 "Pothole, Oak & 3rd" visible
        │
        ▼
[Taps case row → /cases/4812]
        │
        ▼
[Mobile case detail: stacked layout]
  Metadata at top (location, status visible above fold)
  Action form below metadata
  Timeline scrollable below action form
        │
        ▼
[Taps "Log Response"]
  Action form expands:
  • Action type: Response
  • Notes textarea: "Pothole filled with cold patch asphalt"
  • Substatus: Resolved
  • Notify Reporter: [toggle ON]
        │
        ▼
[Taps "Add Photos" button]
  → Native file picker opens camera roll
  → Selects 2 photos
  → Thumbnails appear inline
        │
        ▼
[Taps "Submit"]
  → POST /api/tickets/4812/history (with photo files)
        │
    ┌───┴───┐
 Success  Error
    │         └──▶ Error toast; form preserved; retry available
    ▼
[Toast: "Case 4812 closed. Reporter notified."]
  No redirect — stays on case detail
  Status badge updates to CLOSED (green) in place
  Timeline prepends new entry at top
```

---

## Steps

1. **Mobile access**: CAS session persists for the shift (8 hr JWT). Diane opens uReport in Safari mobile. No re-login. Pre-filtered "My Department" view loads immediately.
2. **Case list (mobile)**: Large tap targets. Row shows: Case ID badge, category, location summary, status pill. Overdue badge visible if applicable. Swipe-to-scroll works naturally.
3. **Case detail (mobile stacked)**: Location address and status badge visible above the fold without scrolling. Map pin shows location. Action form is below metadata — accessible without deep scrolling on mobile.
4. **Action log form**: Textarea auto-expands as Diane types. "Notify Reporter" toggle is thumb-reachable (bottom of form area). Submit button is full-width at the bottom of the form — easy to tap.
5. **Photo upload**: `<input type="file" accept="image/*" capture>` — native iOS/Android picker opens camera roll. Multiple selection supported. Thumbnails appear immediately below the form. Diane can remove a photo by tapping the "×" on the thumbnail.
6. **Submit**: Single tap. Loading indicator on the button. No spinner overlay that blocks the page.
7. **Success**: Toast notification "Case 4812 closed. Reporter notified." Status badge animates (Framer Motion, 200 ms) from blue (open) to green (closed). Timeline entry appears at the top. No redirect — Diane can immediately see confirmation.

---

## Exit Points

| Outcome | Destination |
|---|---|
| Success | Stay on `/cases/4812` — updated state |
| Submit error | Stay on `/cases/4812` — form preserved |
| Back to list | `/cases` (tap breadcrumb) |

---

*End of Flow-04-field-closure.md*
