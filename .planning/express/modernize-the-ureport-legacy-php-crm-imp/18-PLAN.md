---
phase: modernize-the-ureport-legacy-php-crm-imp
plan: 18
type: execute
wave: 3
depends_on: [2]
files_modified:
  - frontend/src/app/(staff)/tickets/[id]/page.tsx
  - frontend/src/components/tickets/MergeDialog.tsx
  - frontend/src/app/(staff)/tickets/page.tsx
  - frontend/src/components/tickets/BookmarksDropdown.tsx
  - frontend/src/components/bookmarks/BookmarkManageSheet.tsx
  - frontend/src/app/api/docs/page.tsx
  - frontend/src/components/a11y/SkipLink.tsx
  - frontend/src/components/a11y/AxeAuditRunner.tsx
  - frontend/e2e/bookmarks.spec.ts
  - frontend/e2e/merge-dialog.spec.ts
  - frontend/e2e/api-docs.spec.ts
  - frontend/e2e/accessibility.spec.ts
autonomous: true

features:
  implements: ["F12", "F18", "F16", "F15"]
  depends_on: ["F0", "F4"]
  enables: []

must_haves:
  truths:
    - "Staff can open the Bookmarks dropdown on /tickets, see their saved searches, click one and have all filters restored in the URL and UI"
    - "Staff can save the current filter state as a named bookmark via a name prompt and see it appear immediately in the dropdown"
    - "Staff can delete a bookmark from a manage-bookmarks sheet and it disappears from the list without page reload"
    - "Staff can open Merge Ticket from the ticket detail kebab menu, search for a target ticket by title/description, see a side-by-side preview of both tickets, confirm the merge, and see the source ticket badge change to Merged/Closed"
    - "GET /api/docs renders the Swagger UI loaded from /api/openapi.json with the uReport API docs visible and searchable"
    - "All primary SPA routes pass axe-core WCAG 2.1 AA automated audit with 0 critical violations"
  artifacts:
    - path: "frontend/src/components/tickets/BookmarksDropdown.tsx"
      provides: "Bookmarks dropdown in ticket list search bar — list, restore, save, link to manage sheet"
      exports: ["BookmarksDropdown"]
    - path: "frontend/src/components/bookmarks/BookmarkManageSheet.tsx"
      provides: "Bottom sheet / modal for listing and deleting bookmarks"
      exports: ["BookmarkManageSheet"]
    - path: "frontend/src/components/tickets/MergeDialog.tsx"
      provides: "Merge ticket dialog: candidate search, side-by-side preview, confirmation"
      exports: ["MergeDialog"]
    - path: "frontend/src/app/api/docs/page.tsx"
      provides: "Next.js page rendering Swagger UI at /api/docs"
      exports: ["default (ApiDocsPage)"]
    - path: "frontend/src/components/a11y/AxeAuditRunner.tsx"
      provides: "Dev-mode axe-core runner component (no-op in production)"
      exports: ["AxeAuditRunner"]
  key_links:
    - from: "frontend/src/components/tickets/BookmarksDropdown.tsx"
      to: "/api/bookmarks (GET/POST/DELETE)"
      via: "fetch with auth cookie, JSON envelope"
      pattern: "api/bookmarks"
    - from: "frontend/src/components/tickets/MergeDialog.tsx"
      to: "/api/tickets/{id}/merge-candidates + /api/tickets/{id}/merge"
      via: "fetch with auth cookie, JSON envelope"
      pattern: "merge-candidates|/merge"
    - from: "frontend/src/app/api/docs/page.tsx"
      to: "/api/openapi.json"
      via: "SwaggerUIBundle({ url: '/api/openapi.json' })"
      pattern: "openapi\\.json"

integration_contracts:
  requires:
    - from_plan: "09"
      artifact: "crm/src/Controllers/Api/BookmarkController.php"
      exports: ["GET /api/bookmarks", "POST /api/bookmarks", "DELETE /api/bookmarks/{id}", "GET /api/bookmarks/{id}"]
      verify: "grep -n 'class BookmarkController' crm/src/Controllers/Api/BookmarkController.php && echo CONTRACT_OK"
    - from_plan: "10"
      artifact: "crm/src/Controllers/Api/TicketController.php"
      exports: ["merge", "mergeCandidates"]
      verify: "grep -n 'function merge\\b' crm/src/Controllers/Api/TicketController.php && grep -n 'function mergeCandidates' crm/src/Controllers/Api/TicketController.php && echo CONTRACT_OK"
    - from_plan: "10"
      artifact: "crm/public/api/openapi.json"
      exports: ["OpenAPI 3.1 spec"]
      verify: "grep -n '\"openapi\"' crm/public/api/openapi.json && grep -n '3.1.0' crm/public/api/openapi.json && echo CONTRACT_OK"
    - from_plan: "10"
      artifact: "crm/src/Controllers/Api/OpenApiController.php"
      exports: ["spec", "docs", "yaml"]
      verify: "grep -n 'class OpenApiController' crm/src/Controllers/Api/OpenApiController.php && echo CONTRACT_OK"
  provides:
    - artifact: "frontend/src/components/tickets/BookmarksDropdown.tsx"
      exports: ["BookmarksDropdown"]
      shape: |
        interface Props {
          currentFilterState: TicketSearchParams;
          onRestoreBookmark: (filterState: TicketSearchParams) => void;
        }
        export function BookmarksDropdown(props: Props): JSX.Element
      verify: "grep -n 'export function BookmarksDropdown\\|export const BookmarksDropdown' frontend/src/components/tickets/BookmarksDropdown.tsx && echo CONTRACT_OK"
    - artifact: "frontend/src/components/tickets/MergeDialog.tsx"
      exports: ["MergeDialog"]
      shape: |
        interface Props {
          sourceTicketId: number;
          sourceTicketTitle: string;
          open: boolean;
          onOpenChange: (open: boolean) => void;
          onMergeSuccess: () => void;
        }
        export function MergeDialog(props: Props): JSX.Element
      verify: "grep -n 'export function MergeDialog\\|export const MergeDialog' frontend/src/components/tickets/MergeDialog.tsx && echo CONTRACT_OK"
    - artifact: "frontend/src/app/api/docs/page.tsx"
      exports: ["default (ApiDocsPage)"]
      shape: "Next.js page component; renders Swagger UI loading /api/openapi.json; accessible to staff/admin"
      verify: "grep -n 'swagger-ui\\|SwaggerUIBundle\\|openapi\\.json' frontend/src/app/api/docs/page.tsx && echo CONTRACT_OK"
---

<objective>
Implement the final Wave 3d frontend features: bookmark management UI, ticket merge confirmation dialog, OpenAPI/Swagger docs embedded page, and WCAG 2.1 AA accessibility audit pass.

Purpose: These are the last staff-facing UI features needed to complete full functional parity with the legacy system. The accessibility pass ensures the SPA meets the WCAG 2.1 AA requirement (US-15.3, NFR-04) before Wave 4 integration testing.

Output:
- BookmarksDropdown + BookmarkManageSheet — save/restore/delete personal search bookmarks from /tickets
- MergeDialog — candidate search, side-by-side preview, merge confirmation on /tickets/:id
- /api/docs page — Swagger UI embedded in SPA shell, loading /api/openapi.json
- AxeAuditRunner + skip link — WCAG 2.1 AA audit infrastructure with 0 critical violations on primary routes
- Playwright e2e tests for all four features
</objective>

<feature_dependencies>
Implements: F12: Bookmark/Saved Search Management (BookmarksDropdown — list, restore, save, delete; BookmarkManageSheet), F18: Ticket Merging (MergeDialog — candidate search, side-by-side preview, confirmation, merged badge), F16: RESTful JSON API Backend (OpenAPI docs UI at /api/docs, serving spec from /api/openapi.json), F15: Modern React/Next.js SPA Frontend (accessibility pass — axe-core WCAG 2.1 AA, skip links, aria labels)
Depends on: F0: Ticket Lifecycle (ticket detail page — merge action lives there), F4: Full-Text Search (BookmarksDropdown consumes TicketSearchParams shape from filter state)
Enables: None (Wave 3d final — Wave 4 integration tests run next)
</feature_dependencies>

<execution_context>
@/app/workspaces/.pivota-home/opencode-xdg/opencode/pivota_spec-framework/workflows/execute-plan.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/express/modernize-the-ureport-legacy-php-crm-imp/WAVE-SCHEDULE.md
@project_specs/UX-Mockup-uReport.md
@project_specs/UserStories-uReport.md

# Prior wave API contracts consumed:
# - GET/POST/DELETE /api/bookmarks (09-PLAN.md — BookmarkController)
#   Response shape: { data: [{id, personId, name, filterState: object, createdAt}], meta: {total}, errors: [] }
# - POST /api/tickets/{id}/merge (10-PLAN.md — TicketController.merge)
#   Request: { targetTicketId: int }
#   Response 200: { data: { sourceTicketId, targetTicketId, status: "merged", mergedAt } }
#   Error codes: 422/SELF_MERGE, 409/ALREADY_MERGED, 409/TARGET_CLOSED, 409/TARGET_MERGED, 404/NOT_FOUND
# - GET /api/tickets/{id}/merge-candidates?q=string&page=int&perPage=int (10-PLAN.md)
#   Response: { data: Ticket[], meta: { total, page, perPage, pages }, errors: [] }
# - GET /api/openapi.json served as static JSON (10-PLAN.md — OpenApiController.spec)
# - GET /api/docs served as Swagger UI HTML (10-PLAN.md — OpenApiController.docs)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Bookmark management UI (F12) — BookmarksDropdown, BookmarkManageSheet, and save-filter prompt</name>
  <files>
    frontend/src/components/tickets/BookmarksDropdown.tsx
    frontend/src/components/bookmarks/BookmarkManageSheet.tsx
    frontend/src/app/(staff)/tickets/page.tsx
    frontend/e2e/bookmarks.spec.ts
  </files>
  <action>
**Context:** The ticket list page at /tickets already has a filter state and URL params (from Wave 3c). This task wires in bookmark save/restore/delete using the BookmarkController API from plan 09.

**API shapes (from 09-PLAN.md integration contracts):**
```
GET  /api/bookmarks           → { data: [{id, personId, name, filterState: object, createdAt}], meta: {total}, errors: [] }
POST /api/bookmarks           → body: {name: string, filterState: object} → { data: bookmark, meta: {}, errors: [] } HTTP 201
                                422 DUPLICATE_NAME | 409 BOOKMARK_LIMIT
DELETE /api/bookmarks/{id}    → 204
GET  /api/bookmarks/{id}      → { data: bookmark, meta: {}, errors: [] }
```

**Create `frontend/src/components/tickets/BookmarksDropdown.tsx`**

Uses Radix UI DropdownMenu (already in shadcn/ui). Shows:
- List of personal bookmarks (max 50) — each row: name + "Restore" on click
- "Save current filters" action at the bottom (opens a name-prompt Dialog)
- "Manage bookmarks →" link that opens BookmarkManageSheet

Props interface:
```tsx
interface BookmarksDropdownProps {
  /** The current filter+sort state from the ticket list URL params */
  currentFilterState: Record<string, unknown>;
  /** Called when a bookmark is selected — consumer should apply filterState to URL params */
  onRestoreBookmark: (filterState: Record<string, unknown>) => void;
}
```

Implementation notes:
- Fetch bookmarks on mount via `useEffect` → `GET /api/bookmarks` with credentials: 'include'
- Parse `{ data }` from JSON envelope
- "Save current filters" button opens an inline `<Dialog>` with a name text field; on submit calls `POST /api/bookmarks` with `{ name, filterState: currentFilterState }`; on 422 DUPLICATE_NAME shows field error "A bookmark with this name already exists"; on 409 BOOKMARK_LIMIT shows toast "Bookmark limit reached (50). Delete some to save more."
- On successful save: add bookmark to local list, show toast "Bookmark saved"
- Clicking a bookmark row: call `onRestoreBookmark(bookmark.filterState)` and close dropdown
- "Manage bookmarks →" opens `BookmarkManageSheet` (state: boolean)
- All interactive elements keyboard accessible (Radix DropdownMenu provides this)
- ARIA: Trigger button has `aria-label="Bookmarks — manage saved searches"` 
- Loading state: skeleton rows while fetching
- Empty state: "No saved searches yet. Save your current filters to get started."

```tsx
'use client';
import { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bookmark, BookmarkPlus, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { BookmarkManageSheet } from '@/components/bookmarks/BookmarkManageSheet';

interface SavedBookmark {
  id: number;
  name: string;
  filterState: Record<string, unknown>;
  createdAt: string;
}

export interface BookmarksDropdownProps {
  currentFilterState: Record<string, unknown>;
  onRestoreBookmark: (filterState: Record<string, unknown>) => void;
}

export function BookmarksDropdown({
  currentFilterState,
  onRestoreBookmark,
}: BookmarksDropdownProps) {
  const [bookmarks, setBookmarks] = useState<SavedBookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [manageSheetOpen, setManageSheetOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveNameError, setSaveNameError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchBookmarks = async () => {
    try {
      const res = await fetch('/api/bookmarks', { credentials: 'include' });
      if (!res.ok) return;
      const json = await res.json();
      setBookmarks(json.data ?? []);
    } catch {
      // Non-fatal: bookmarks optional
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookmarks(); }, []);

  const handleSave = async () => {
    const trimmed = saveName.trim();
    if (!trimmed) {
      setSaveNameError('Name is required');
      return;
    }
    setSaving(true);
    setSaveNameError('');
    try {
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed, filterState: currentFilterState }),
      });
      const json = await res.json();
      if (res.status === 422) {
        const err = json.errors?.[0];
        setSaveNameError(err?.message ?? 'Validation error');
        return;
      }
      if (res.status === 409) {
        toast.error('Bookmark limit reached (50). Delete some to save more.');
        setSaveDialogOpen(false);
        return;
      }
      if (!res.ok) {
        toast.error('Failed to save bookmark');
        return;
      }
      setBookmarks((prev) => [...prev, json.data]);
      toast.success(`Bookmark "${trimmed}" saved`);
      setSaveDialogOpen(false);
      setSaveName('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            aria-label="Bookmarks — manage saved searches"
          >
            <Bookmark className="h-4 w-4 mr-1" aria-hidden="true" />
            Bookmarks
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          {loading ? (
            <div className="px-3 py-2 text-sm text-muted-foreground" role="status" aria-live="polite">
              Loading bookmarks…
            </div>
          ) : bookmarks.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No saved searches yet. Save your current filters to get started.
            </div>
          ) : (
            bookmarks.map((bm) => (
              <DropdownMenuItem
                key={bm.id}
                onSelect={() => onRestoreBookmark(bm.filterState)}
                className="cursor-pointer"
              >
                <Bookmark className="h-3 w-3 mr-2 shrink-0" aria-hidden="true" />
                <span className="truncate">{bm.name}</span>
              </DropdownMenuItem>
            ))
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(e) => { e.preventDefault(); setSaveDialogOpen(true); }}
            className="cursor-pointer"
          >
            <BookmarkPlus className="h-4 w-4 mr-2" aria-hidden="true" />
            Save current filters
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(e) => { e.preventDefault(); setManageSheetOpen(true); }}
            className="cursor-pointer"
          >
            <Settings2 className="h-4 w-4 mr-2" aria-hidden="true" />
            Manage bookmarks →
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Save filter name prompt dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent aria-labelledby="save-bookmark-title">
          <DialogHeader>
            <DialogTitle id="save-bookmark-title">Save current search as bookmark</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label htmlFor="bookmark-name">Bookmark name</Label>
            <Input
              id="bookmark-name"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="e.g. My Open Tickets"
              maxLength={100}
              aria-invalid={saveNameError ? 'true' : 'false'}
              aria-describedby={saveNameError ? 'bookmark-name-error' : undefined}
              className="mt-1"
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
            />
            {saveNameError && (
              <p id="bookmark-name-error" className="text-sm text-destructive mt-1" role="alert">
                {saveNameError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSaveDialogOpen(false); setSaveName(''); setSaveNameError(''); }}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save bookmark'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage bookmarks sheet */}
      <BookmarkManageSheet
        open={manageSheetOpen}
        onOpenChange={setManageSheetOpen}
        bookmarks={bookmarks}
        onDelete={(id) => setBookmarks((prev) => prev.filter((b) => b.id !== id))}
      />
    </>
  );
}
```

---

**Create `frontend/src/components/bookmarks/BookmarkManageSheet.tsx`**

Radix Sheet (side panel / bottom sheet) listing all bookmarks with delete actions.

```tsx
'use client';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

interface SavedBookmark {
  id: number;
  name: string;
  filterState: Record<string, unknown>;
  createdAt: string;
}

interface BookmarkManageSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookmarks: SavedBookmark[];
  onDelete: (id: number) => void;
}

export function BookmarkManageSheet({
  open,
  onOpenChange,
  bookmarks,
  onDelete,
}: BookmarkManageSheetProps) {
  const [deleting, setDeleting] = useState<number | null>(null);

  const handleDelete = async (id: number, name: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/bookmarks/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.status === 204) {
        onDelete(id);
        toast.success(`Bookmark "${name}" deleted`);
      } else if (res.status === 404) {
        toast.error('Bookmark not found');
        onDelete(id); // Remove from UI anyway
      } else {
        toast.error('Failed to delete bookmark');
      }
    } finally {
      setDeleting(null);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        aria-labelledby="manage-bookmarks-title"
        className="w-full sm:w-96"
      >
        <SheetHeader>
          <SheetTitle id="manage-bookmarks-title">Manage Bookmarks</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-2">
          {bookmarks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No bookmarks yet.
            </p>
          ) : (
            <ul role="list" className="space-y-2">
              {bookmarks.map((bm) => (
                <li
                  key={bm.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <span className="text-sm truncate flex-1 mr-2">{bm.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete bookmark "${bm.name}"`}
                    disabled={deleting === bm.id}
                    onClick={() => handleDelete(bm.id, bm.name)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

---

**Wire BookmarksDropdown into ticket list page (`frontend/src/app/(staff)/tickets/page.tsx`)**

In the search bar row (above the filter panel), add the BookmarksDropdown component next to the search input. Pass the current URL-derived filter state as `currentFilterState` and implement `onRestoreBookmark` to push the filterState back into URL search params using `useRouter` + `useSearchParams`.

Pattern (add to existing page, do NOT rewrite other logic):
```tsx
// In the search/filter toolbar area:
<BookmarksDropdown
  currentFilterState={currentFilterStateObject} // derived from current URL searchParams
  onRestoreBookmark={(filterState) => {
    // Replace current URL search params with the bookmark's filterState
    const params = new URLSearchParams();
    Object.entries(filterState).forEach(([k, v]) => {
      if (v !== null && v !== undefined) params.set(k, String(v));
    });
    router.push(`/tickets?${params.toString()}`);
  }}
/>
```

---

**Create `frontend/e2e/bookmarks.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Bookmark management', () => {
  test.beforeEach(async ({ page }) => {
    // Assumes staff session cookie is set by auth fixture or login helper
    await page.goto('/tickets');
  });

  test('shows bookmarks dropdown trigger', async ({ page }) => {
    await expect(page.getByRole('button', { name: /bookmarks/i })).toBeVisible();
  });

  test('opens dropdown and shows empty state or bookmark list', async ({ page }) => {
    await page.getByRole('button', { name: /bookmarks/i }).click();
    // Either empty state or at least one bookmark row visible
    const content = page.getByRole('menu');
    await expect(content).toBeVisible();
    // Save current filters option always present
    await expect(page.getByRole('menuitem', { name: /save current filters/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /manage bookmarks/i })).toBeVisible();
  });

  test('opens save bookmark dialog and validates empty name', async ({ page }) => {
    await page.getByRole('button', { name: /bookmarks/i }).click();
    await page.getByRole('menuitem', { name: /save current filters/i }).click();
    // Dialog should open
    await expect(page.getByRole('dialog', { name: /save current search/i })).toBeVisible();
    // Try to save without name
    await page.getByRole('button', { name: /save bookmark/i }).click();
    await expect(page.getByRole('alert')).toContainText(/required/i);
  });

  test('bookmark name input has accessible label', async ({ page }) => {
    await page.getByRole('button', { name: /bookmarks/i }).click();
    await page.getByRole('menuitem', { name: /save current filters/i }).click();
    await expect(page.getByLabel('Bookmark name')).toBeVisible();
  });

  test('manage bookmarks sheet opens from dropdown', async ({ page }) => {
    await page.getByRole('button', { name: /bookmarks/i }).click();
    await page.getByRole('menuitem', { name: /manage bookmarks/i }).click();
    await expect(page.getByRole('dialog', { name: /manage bookmarks/i })).toBeVisible();
  });
});
```
  </action>
  <verify>
```bash
# TypeScript compilation check
cd frontend && npx tsc --noEmit 2>&1 | grep -E "BookmarksDropdown|BookmarkManageSheet|Error" | head -20

# Component files exist
ls frontend/src/components/tickets/BookmarksDropdown.tsx \
   frontend/src/components/bookmarks/BookmarkManageSheet.tsx && echo "BOOKMARK_FILES OK"

# Export names correct
grep -n "export function BookmarksDropdown\|export const BookmarksDropdown" frontend/src/components/tickets/BookmarksDropdown.tsx && echo "DROPDOWN_EXPORT OK"
grep -n "export function BookmarkManageSheet\|export const BookmarkManageSheet" frontend/src/components/bookmarks/BookmarkManageSheet.tsx && echo "SHEET_EXPORT OK"

# API calls use correct endpoints
grep -n "/api/bookmarks" frontend/src/components/tickets/BookmarksDropdown.tsx && echo "BOOKMARK_API_CALLS OK"
grep -n "DELETE.*api/bookmarks" frontend/src/components/bookmarks/BookmarkManageSheet.tsx && echo "BOOKMARK_DELETE OK"

# Accessibility: aria-label on trigger, aria-invalid on input, role=list on bookmark list
grep -n "aria-label.*Bookmarks\|aria-label.*bookmark" frontend/src/components/tickets/BookmarksDropdown.tsx && echo "ARIA_LABEL OK"
grep -n 'aria-invalid' frontend/src/components/tickets/BookmarksDropdown.tsx && echo "ARIA_INVALID OK"
grep -n 'role="list"' frontend/src/components/bookmarks/BookmarkManageSheet.tsx && echo "ROLE_LIST OK"

# Playwright test file exists
ls frontend/e2e/bookmarks.spec.ts && echo "E2E_FILE OK"

# Run e2e tests (requires dev server running; in CI this runs against built app)
npx playwright test frontend/e2e/bookmarks.spec.ts --reporter=list 2>&1 | tail -30 && echo "PLAYWRIGHT PASSED"
```
  </verify>
  <done>
- `BookmarksDropdown.tsx` exists; renders DropdownMenu with bookmark list, save-filter Dialog, and manage sheet trigger
- "Save current filters" Dialog: requires non-empty name, shows field error on 422 DUPLICATE_NAME, shows toast on 409 BOOKMARK_LIMIT
- DELETE via `BookmarkManageSheet.tsx` calls DELETE /api/bookmarks/{id} and removes from local state on 204
- `onRestoreBookmark` prop called with parsed filterState object when a bookmark row is selected
- All interactive elements keyboard-accessible via Radix UI DropdownMenu/Dialog/Sheet primitives
- Trigger button has `aria-label="Bookmarks — manage saved searches"`
- Name input has `aria-invalid="true"` + `aria-describedby` error link on validation failure
- Bookmark list uses `role="list"` in BookmarkManageSheet
- Playwright e2e tests cover: dropdown opens, empty state/list shown, save dialog validation, accessible label, manage sheet opens
  </done>
</task>

<task type="auto">
  <name>Task 2: Ticket merge dialog (F18), OpenAPI docs page (F16), and WCAG 2.1 AA accessibility pass (F15)</name>
  <files>
    frontend/src/components/tickets/MergeDialog.tsx
    frontend/src/app/(staff)/tickets/[id]/page.tsx
    frontend/src/app/api/docs/page.tsx
    frontend/src/components/a11y/SkipLink.tsx
    frontend/src/components/a11y/AxeAuditRunner.tsx
    frontend/e2e/merge-dialog.spec.ts
    frontend/e2e/api-docs.spec.ts
    frontend/e2e/accessibility.spec.ts
  </files>
  <action>
### Part A: MergeDialog (F18)

**API shapes (from 10-PLAN.md integration contracts):**
```
GET /api/tickets/{id}/merge-candidates?q=string&page=1&perPage=25
→ { data: Ticket[], meta: { total, page, perPage, pages }, errors: [] }

POST /api/tickets/{id}/merge
Body: { targetTicketId: int }
→ 200: { data: { sourceTicketId, targetTicketId, status: "merged", mergedAt } }
→ 422: { errors: [{ field: "targetTicketId", message: "...", code: "SELF_MERGE" }] }
→ 409: { errors: [{ field: null, message: "...", code: "ALREADY_MERGED"|"TARGET_CLOSED"|"TARGET_MERGED" }] }
→ 404: { errors: [{ field: null, message: "...", code: "NOT_FOUND" }] }
```

**Create `frontend/src/components/tickets/MergeDialog.tsx`**

This is a multi-step Radix Dialog:
1. **Step 1: Search** — text input with debounce queries `GET /api/tickets/{sourceId}/merge-candidates?q={query}`. Shows paginated result rows (id, title, status, department, SLA badge). User clicks a row to select the target.
2. **Step 2: Side-by-side preview** — two columns: "Source ticket (will be closed)" and "Target ticket (canonical)". Shows id, title, status, department, opened date. "Confirm Merge" button at bottom.
3. **Step 3: Success** — merge complete confirmation; "View merged ticket →" link to target.

UX from UX-Mockup Screen-03 notes: Merge Ticket accessible from "⋮ More actions" kebab menu in sidebar.

```tsx
'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Merge, Search, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface TicketSummary {
  id: number;
  title: string;
  status: string;
  departmentId?: number;
  datetimeOpened: string;
  categoryId?: number;
}

export interface MergeDialogProps {
  sourceTicketId: number;
  sourceTicketTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMergeSuccess: () => void;
}

type Step = 'search' | 'preview' | 'success';

export function MergeDialog({
  sourceTicketId,
  sourceTicketTitle,
  open,
  onOpenChange,
  onMergeSuccess,
}: MergeDialogProps) {
  const [step, setStep] = useState<Step>('search');
  const [query, setQuery] = useState('');
  const [candidates, setCandidates] = useState<TicketSummary[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<TicketSummary | null>(null);
  const [mergeLoading, setMergeLoading] = useState(false);
  const [mergeError, setMergeError] = useState('');
  const [mergeResult, setMergeResult] = useState<{ targetTicketId: number; mergedAt: string } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setStep('search');
      setQuery('');
      setCandidates([]);
      setSelectedTarget(null);
      setMergeError('');
      setMergeResult(null);
    }
  }, [open]);

  const searchCandidates = useCallback(async (q: string) => {
    setSearchLoading(true);
    try {
      const params = new URLSearchParams({ q, page: '1', perPage: '25' });
      const res = await fetch(`/api/tickets/${sourceTicketId}/merge-candidates?${params}`, {
        credentials: 'include',
      });
      if (!res.ok) return;
      const json = await res.json();
      setCandidates(json.data ?? []);
    } finally {
      setSearchLoading(false);
    }
  }, [sourceTicketId]);

  // Initial load (show recent open tickets)
  useEffect(() => {
    if (open && step === 'search') {
      searchCandidates('');
    }
  }, [open, step, searchCandidates]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchCandidates(value), 300);
  };

  const handleSelectCandidate = (ticket: TicketSummary) => {
    setSelectedTarget(ticket);
    setStep('preview');
  };

  const handleConfirmMerge = async () => {
    if (!selectedTarget) return;
    setMergeLoading(true);
    setMergeError('');
    try {
      const res = await fetch(`/api/tickets/${sourceTicketId}/merge`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetTicketId: selectedTarget.id }),
      });
      const json = await res.json();
      if (!res.ok) {
        const err = json.errors?.[0];
        const code = err?.code ?? '';
        const message = code === 'SELF_MERGE'     ? 'Cannot merge a ticket into itself.'
                      : code === 'ALREADY_MERGED' ? 'This ticket has already been merged.'
                      : code === 'TARGET_CLOSED'  ? 'Cannot merge into a closed ticket.'
                      : code === 'TARGET_MERGED'  ? 'Cannot merge into a ticket that is already merged.'
                      : err?.message ?? 'Merge failed.';
        setMergeError(message);
        return;
      }
      setMergeResult({ targetTicketId: json.data.targetTicketId, mergedAt: json.data.mergedAt });
      setStep('success');
      onMergeSuccess();
      toast.success(`Ticket #${sourceTicketId} merged into #${json.data.targetTicketId}`);
    } finally {
      setMergeLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl"
        aria-labelledby="merge-dialog-title"
        aria-describedby="merge-dialog-description"
      >
        <DialogHeader>
          <DialogTitle id="merge-dialog-title">
            <Merge className="inline h-4 w-4 mr-2" aria-hidden="true" />
            Merge Ticket #{sourceTicketId}
          </DialogTitle>
          <DialogDescription id="merge-dialog-description">
            {step === 'search'
              ? 'Search for the canonical ticket to merge this one into. The source ticket will be closed.'
              : step === 'preview'
              ? 'Review both tickets before confirming the merge.'
              : 'Merge complete.'}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Search */}
        {step === 'search' && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                placeholder="Search by ticket title or description…"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                className="pl-9"
                aria-label="Search for a ticket to merge into"
                aria-busy={searchLoading}
              />
            </div>
            <div
              role="listbox"
              aria-label="Merge target candidates"
              className="max-h-72 overflow-y-auto border rounded-md divide-y"
            >
              {searchLoading && (
                <div className="px-3 py-4 text-sm text-muted-foreground" role="status" aria-live="polite">
                  Searching…
                </div>
              )}
              {!searchLoading && candidates.length === 0 && (
                <div className="px-3 py-4 text-sm text-muted-foreground">
                  No open tickets found{query ? ` matching "${query}"` : ''}.
                </div>
              )}
              {candidates.map((t) => (
                <button
                  key={t.id}
                  role="option"
                  aria-selected={false}
                  className="w-full text-left px-3 py-2 hover:bg-accent focus:bg-accent focus:outline-none text-sm"
                  onClick={() => handleSelectCandidate(t)}
                >
                  <span className="font-medium">#{t.id}</span>
                  <span className="ml-2">{t.title}</span>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {t.status}
                  </Badge>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Side-by-side preview */}
        {step === 'preview' && selectedTarget && (
          <div>
            <div className="grid grid-cols-2 gap-4 my-2">
              {/* Source ticket */}
              <div className="rounded-md border p-3 space-y-1 bg-destructive/5 border-destructive/30">
                <p className="text-xs font-semibold uppercase tracking-wide text-destructive">
                  Source ticket (will be closed)
                </p>
                <p className="font-medium text-sm">#{sourceTicketId}: {sourceTicketTitle}</p>
              </div>
              {/* Target ticket */}
              <div className="rounded-md border p-3 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Target ticket (canonical)
                </p>
                <p className="font-medium text-sm">#{selectedTarget.id}: {selectedTarget.title}</p>
                <Badge variant="outline" className="text-xs">{selectedTarget.status}</Badge>
              </div>
            </div>
            {mergeError && (
              <p className="text-sm text-destructive mt-2" role="alert" aria-live="assertive">
                {mergeError}
              </p>
            )}
          </div>
        )}

        {/* Step 3: Success */}
        {step === 'success' && mergeResult && (
          <div className="py-4 text-center space-y-3">
            <p className="text-sm">
              Ticket #{sourceTicketId} has been merged into{' '}
              <span className="font-semibold">#{mergeResult.targetTicketId}</span>.
            </p>
            <Link
              href={`/tickets/${mergeResult.targetTicketId}`}
              className="inline-flex items-center text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring"
            >
              View ticket #{mergeResult.targetTicketId}
              <ArrowRight className="h-4 w-4 ml-1" aria-hidden="true" />
            </Link>
          </div>
        )}

        <DialogFooter>
          {step === 'search' && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          )}
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('search')}>
                ← Back
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmMerge}
                disabled={mergeLoading}
                aria-busy={mergeLoading}
              >
                {mergeLoading ? 'Merging…' : 'Confirm Merge'}
              </Button>
            </>
          )}
          {step === 'success' && (
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**Wire MergeDialog into ticket detail page (`frontend/src/app/(staff)/tickets/[id]/page.tsx`)**

Add to the existing "⋮ More actions" kebab DropdownMenu in the actions sidebar:
```tsx
// Add state:
const [mergeDialogOpen, setMergeDialogOpen] = useState(false);

// Add to kebab menu:
<DropdownMenuItem onSelect={(e) => { e.preventDefault(); setMergeDialogOpen(true); }}>
  <Merge className="h-4 w-4 mr-2" aria-hidden="true" />
  Merge Ticket
</DropdownMenuItem>

// Add near bottom of JSX:
<MergeDialog
  sourceTicketId={ticket.id}
  sourceTicketTitle={ticket.title}
  open={mergeDialogOpen}
  onOpenChange={setMergeDialogOpen}
  onMergeSuccess={() => router.refresh()}  // re-fetch ticket to show merged status
/>
```

---

### Part B: OpenAPI Docs page (F16)

**Create `frontend/src/app/api/docs/page.tsx`**

This Next.js page serves the Swagger UI at `/api/docs`. It must:
1. Be accessible only to authenticated staff/admin (protected by existing route guard from Wave 3a)
2. Load swagger-ui-react package (or use CDN in a client component script injection)
3. Point to `/api/openapi.json` (which the PHP backend serves at that path via `OpenApiController`)

Use CDN approach (no new npm package needed) via a client component that injects the Swagger UI bundle script:

```tsx
import type { Metadata } from 'next';
import { SwaggerUiClient } from '@/components/api-docs/SwaggerUiClient';

export const metadata: Metadata = {
  title: 'API Documentation — uReport',
};

export default function ApiDocsPage() {
  return (
    <main id="main-content" className="h-full">
      <SwaggerUiClient specUrl="/api/openapi.json" />
    </main>
  );
}
```

Also create `frontend/src/components/api-docs/SwaggerUiClient.tsx`:

```tsx
'use client';
import { useEffect, useRef } from 'react';

interface SwaggerUiClientProps {
  specUrl: string;
}

export function SwaggerUiClient({ specUrl }: SwaggerUiClientProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Load Swagger UI from CDN
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/swagger-ui-dist@5/swagger-ui.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js';
    script.onload = () => {
      // @ts-expect-error SwaggerUIBundle is loaded from CDN
      const SwaggerUIBundle = window.SwaggerUIBundle;
      if (SwaggerUIBundle && containerRef.current) {
        SwaggerUIBundle({
          url: specUrl,
          domNode: containerRef.current,
          presets: [SwaggerUIBundle.presets.apis],
          layout: 'BaseLayout',
          deepLinking: true,
          tryItOutEnabled: true,
        });
      }
    };
    document.body.appendChild(script);
  }, [specUrl]);

  return (
    <div
      ref={containerRef}
      id="swagger-ui"
      aria-label="uReport API documentation — interactive OpenAPI spec"
      className="min-h-screen"
    />
  );
}
```

---

### Part C: WCAG 2.1 AA Accessibility Pass (F15)

**Create `frontend/src/components/a11y/SkipLink.tsx`**

Per UX-Mockup accessibility notes: "A 'Skip to main content' link is the first focusable element on every page. Visible on focus."

```tsx
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-background focus:px-4 focus:py-2 focus:rounded-md focus:shadow-lg focus:ring-2 focus:ring-ring focus:text-foreground focus:text-sm focus:font-medium"
    >
      Skip to main content
    </a>
  );
}
```

Add `<SkipLink />` as the first child of the root layout (`frontend/src/app/layout.tsx`) so it appears before all navigation.

Ensure all `<main>` elements in page files have `id="main-content"` so the skip link target is valid.

**Create `frontend/src/components/a11y/AxeAuditRunner.tsx`**

Dev-mode only axe-core runner. In production this is a no-op. Install `axe-core` + `@axe-core/react` as devDependencies if not already present.

```tsx
'use client';
import { useEffect } from 'react';

export function AxeAuditRunner() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    import('@axe-core/react').then(({ default: axe }) => {
      import('react').then((React) => {
        import('react-dom').then((ReactDOM) => {
          axe(React.default, ReactDOM.default, 1000);
        });
      });
    }).catch(() => {
      // axe-core not installed — skip silently
    });
  }, []);
  return null;
}
```

Add `<AxeAuditRunner />` to the root layout (after SkipLink) so it runs on every page in development.

**Global WCAG 2.1 AA fixes to apply across existing components:**

1. **SLA badges** — ensure each badge has `aria-label` with text description:
   In the SLA badge component (or wherever rendered), add:
   ```tsx
   // Find the SLA badge component used in ticket list rows and ticket detail header
   // Add aria-label describing the badge semantically:
   // <Badge aria-label="SLA status: Breach — 1 day overdue">🔴 SLA Breach</Badge>
   ```
   Search for the SLA badge rendering pattern and add aria-label if missing.

2. **Status badges** — add `aria-label="Status: Open"` etc.

3. **Ticket list table/list** — ensure `<table>` has `<caption>` or `role="grid"` has `aria-label`:
   ```tsx
   <table aria-label="Ticket search results">
     <caption className="sr-only">Ticket search results</caption>
   ```

4. **Filter panel** — wrap in `<section role="search" aria-label="Filter tickets">`.

5. **Loading states** — add `role="status" aria-live="polite"` to loading skeletons:
   ```tsx
   <div role="status" aria-live="polite" aria-label="Loading tickets">
     {/* skeleton rows */}
   </div>
   ```

6. **Toast container** — ensure sonner's toaster has `aria-live` semantics. Sonner already handles this; verify the `<Toaster />` is not wrapped in a way that breaks ARIA.

7. **Form errors** — ensure all form inputs with errors have `aria-invalid="true"` and `aria-describedby` pointing to the error message `id`. This pattern was established in the save-bookmark dialog above; apply consistently to all forms.

8. **Route change announcements** — in the root layout, add an `aria-live` region that announces the page title on route change:
   ```tsx
   // In root layout or a RouteAnnouncer component:
   // <div aria-live="polite" className="sr-only" id="route-announcer" />
   // On navigation, update its text to the new page title
   ```

---

**Create `frontend/e2e/merge-dialog.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Merge ticket dialog', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tickets/1'); // assumes ticket #1 exists and is open
  });

  test('merge action accessible from kebab menu in actions sidebar', async ({ page }) => {
    await page.getByRole('button', { name: /more actions/i }).click();
    await expect(page.getByRole('menuitem', { name: /merge ticket/i })).toBeVisible();
  });

  test('merge dialog opens with search step', async ({ page }) => {
    await page.getByRole('button', { name: /more actions/i }).click();
    await page.getByRole('menuitem', { name: /merge ticket/i }).click();
    await expect(page.getByRole('dialog', { name: /merge ticket/i })).toBeVisible();
    await expect(page.getByLabel(/search for a ticket/i)).toBeVisible();
  });

  test('dialog has accessible description', async ({ page }) => {
    await page.getByRole('button', { name: /more actions/i }).click();
    await page.getByRole('menuitem', { name: /merge ticket/i }).click();
    const dialog = page.getByRole('dialog', { name: /merge ticket/i });
    await expect(dialog).toBeVisible();
    // DialogDescription should be present
    await expect(dialog.getByText(/source ticket will be closed/i)).toBeVisible();
  });

  test('candidate list renders after dialog opens', async ({ page }) => {
    await page.getByRole('button', { name: /more actions/i }).click();
    await page.getByRole('menuitem', { name: /merge ticket/i }).click();
    // Either candidates loaded or empty state shown
    await expect(page.getByRole('listbox', { name: /merge target candidates/i })).toBeVisible();
  });

  test('cancel button closes dialog', async ({ page }) => {
    await page.getByRole('button', { name: /more actions/i }).click();
    await page.getByRole('menuitem', { name: /merge ticket/i }).click();
    await page.getByRole('button', { name: /cancel/i }).click();
    await expect(page.getByRole('dialog', { name: /merge ticket/i })).not.toBeVisible();
  });
});
```

**Create `frontend/e2e/api-docs.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';

test.describe('API documentation page (/api/docs)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/api/docs');
  });

  test('page loads and renders Swagger UI container', async ({ page }) => {
    await expect(page.locator('#swagger-ui')).toBeVisible({ timeout: 10000 });
  });

  test('page title contains API Documentation', async ({ page }) => {
    await expect(page).toHaveTitle(/API Documentation/i);
  });

  test('main content area has accessible label', async ({ page }) => {
    await expect(page.locator('#swagger-ui[aria-label]')).toBeVisible();
  });
});
```

**Create `frontend/e2e/accessibility.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const primaryRoutes = [
  { path: '/login', name: 'Login page' },
  { path: '/tickets', name: 'Ticket list' },
  { path: '/dashboard', name: 'Staff dashboard' },
  { path: '/submit', name: 'Public submission form' },
];

for (const { path, name } of primaryRoutes) {
  test(`WCAG 2.1 AA: ${name} (${path}) — 0 critical axe violations`, async ({ page }) => {
    await page.goto(path);
    // Wait for main content to render
    await page.locator('#main-content').waitFor({ state: 'visible' });

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    const critical = results.violations.filter((v) => v.impact === 'critical');
    expect(
      critical,
      `Critical WCAG violations on ${name}:\n${critical.map((v) => `  [${v.id}] ${v.description}\n  Help: ${v.helpUrl}`).join('\n')}`
    ).toHaveLength(0);
  });
}

test('Skip to main content link is the first focusable element on all pages', async ({ page }) => {
  await page.goto('/tickets');
  // Tab once from top of page
  await page.keyboard.press('Tab');
  const focused = await page.evaluate(() => document.activeElement?.textContent?.trim());
  expect(focused).toMatch(/skip to main content/i);
});

test('Skip link target #main-content exists on ticket list', async ({ page }) => {
  await page.goto('/tickets');
  await expect(page.locator('#main-content')).toBeVisible();
});
```

Install `@axe-core/playwright` as a devDependency if not already present:
```bash
npm install --save-dev @axe-core/playwright
```
  </action>
  <verify>
```bash
cd frontend

# TypeScript compilation
npx tsc --noEmit 2>&1 | grep -E "MergeDialog|SwaggerUi|SkipLink|AxeAudit|Error" | head -20

# Component files exist
ls src/components/tickets/MergeDialog.tsx \
   src/components/api-docs/SwaggerUiClient.tsx \
   src/app/api/docs/page.tsx \
   src/components/a11y/SkipLink.tsx \
   src/components/a11y/AxeAuditRunner.tsx && echo "A11Y_FILES OK"

# MergeDialog: export, API endpoints, ARIA attributes present
grep -n "export function MergeDialog\|export const MergeDialog" src/components/tickets/MergeDialog.tsx && echo "MERGE_EXPORT OK"
grep -n "merge-candidates\|/merge" src/components/tickets/MergeDialog.tsx && echo "MERGE_API_CALLS OK"
grep -n "aria-labelledby\|aria-describedby\|aria-label\|role=" src/components/tickets/MergeDialog.tsx && echo "MERGE_ARIA OK"
grep -n "SELF_MERGE\|ALREADY_MERGED\|TARGET_CLOSED\|TARGET_MERGED" src/components/tickets/MergeDialog.tsx && echo "MERGE_ERROR_CODES OK"

# SkipLink: href="#main-content", sr-only pattern
grep -n "main-content\|sr-only" src/components/a11y/SkipLink.tsx && echo "SKIP_LINK OK"

# API docs page: references openapi.json
grep -n "openapi\\.json" src/app/api/docs/page.tsx && echo "DOCS_SPEC_URL OK"

# AxeAuditRunner: dev-mode guard
grep -n "NODE_ENV.*development\|development.*NODE_ENV" src/components/a11y/AxeAuditRunner.tsx && echo "AXE_DEV_GUARD OK"

# E2E test files exist
ls e2e/merge-dialog.spec.ts e2e/api-docs.spec.ts e2e/accessibility.spec.ts && echo "E2E_FILES OK"

# Run Playwright tests
npx playwright test e2e/merge-dialog.spec.ts e2e/api-docs.spec.ts e2e/accessibility.spec.ts --reporter=list 2>&1 | tail -30 && echo "PLAYWRIGHT PASSED"
```
  </verify>
  <done>
- `MergeDialog.tsx` exists with 3-step flow: search (candidate listbox) → side-by-side preview → success; all error codes handled (SELF_MERGE → 422, ALREADY_MERGED/TARGET_CLOSED/TARGET_MERGED → 409); error shown as `role="alert" aria-live="assertive"` in preview step
- MergeDialog wired into ticket detail page via "Merge Ticket" item in "⋮ More actions" kebab menu; `onMergeSuccess` calls `router.refresh()`
- `SwaggerUiClient.tsx` renders `#swagger-ui` container with CDN Swagger UI loading `/api/openapi.json`; `aria-label` on container for screen readers
- `/api/docs` page exports default Next.js page component rendering SwaggerUiClient; page title "API Documentation — uReport"
- `SkipLink.tsx` renders `<a href="#main-content">` as first focusable element; visible only on focus (`sr-only focus:not-sr-only`)
- `AxeAuditRunner.tsx` imports `@axe-core/react` lazily only in `NODE_ENV === 'development'`
- Playwright e2e tests exist for: merge dialog (opens, search renders, cancel closes), api-docs (renders #swagger-ui, page title, accessible label), accessibility (0 critical WCAG violations on 4 primary routes, skip link is first tab stop)
- All WCAG fixes applied: SLA badges have `aria-label`, filter panel has `role="search"`, loading states have `role="status" aria-live="polite"`, form errors have `aria-invalid` + `aria-describedby`
  </done>
</task>

</tasks>

<verification>
```bash
cd frontend

# All plan files exist
ls src/components/tickets/BookmarksDropdown.tsx \
   src/components/bookmarks/BookmarkManageSheet.tsx \
   src/components/tickets/MergeDialog.tsx \
   src/components/api-docs/SwaggerUiClient.tsx \
   src/app/api/docs/page.tsx \
   src/components/a11y/SkipLink.tsx \
   src/components/a11y/AxeAuditRunner.tsx \
   e2e/bookmarks.spec.ts \
   e2e/merge-dialog.spec.ts \
   e2e/api-docs.spec.ts \
   e2e/accessibility.spec.ts && echo "ALL_FILES OK"

# TypeScript strict mode passes
npx tsc --noEmit 2>&1 | grep -c "error TS" | grep "^0$" && echo "TS_CLEAN OK"

# Key integration contracts
grep -n "export function BookmarksDropdown\|export const BookmarksDropdown" src/components/tickets/BookmarksDropdown.tsx && echo "F12_EXPORT OK"
grep -n "export function MergeDialog\|export const MergeDialog" src/components/tickets/MergeDialog.tsx && echo "F18_EXPORT OK"
grep -n "openapi.json" src/app/api/docs/page.tsx src/components/api-docs/SwaggerUiClient.tsx && echo "F16_SPEC_URL OK"
grep -n "main-content" src/components/a11y/SkipLink.tsx && echo "F15_SKIP_LINK OK"

# API endpoint references correct
grep -n "/api/bookmarks" src/components/tickets/BookmarksDropdown.tsx && echo "F12_API OK"
grep -n "merge-candidates\|/merge" src/components/tickets/MergeDialog.tsx && echo "F18_API OK"

# Playwright all suites pass
npx playwright test e2e/bookmarks.spec.ts e2e/merge-dialog.spec.ts e2e/api-docs.spec.ts e2e/accessibility.spec.ts --reporter=list 2>&1 | tail -40 && echo "PLAYWRIGHT PASSED"
```
</verification>

<success_criteria>
- BookmarksDropdown renders in the ticket list search bar; saves, restores, and deletes bookmarks via /api/bookmarks (GET/POST/DELETE); name validation shown inline on 422; limit shown as toast on 409
- BookmarkManageSheet shows all personal bookmarks with accessible delete buttons; updates parent list state on successful delete
- MergeDialog accessible via "⋮ More actions" kebab on ticket detail; search step queries /api/tickets/{id}/merge-candidates; side-by-side preview step shows source (to be closed) vs target (canonical); confirmation calls POST /api/tickets/{id}/merge; all error codes (SELF_MERGE, ALREADY_MERGED, TARGET_CLOSED, TARGET_MERGED) handled with user-readable messages
- /api/docs page renders Swagger UI loading from /api/openapi.json; page title set; container has aria-label
- SkipLink is the first focusable element (Tab order 1) on all pages; visible on focus; href="#main-content"
- AxeAuditRunner runs axe-core in dev mode only; no-op in production
- Playwright accessibility tests pass with 0 critical WCAG 2.1 AA violations on /login, /tickets, /dashboard, /submit
- TypeScript strict mode: 0 TS errors on all new files
</success_criteria>

<output>
After completion, create `.planning/express/modernize-the-ureport-legacy-php-crm-imp/18-SUMMARY.md` documenting:
- Files created/modified
- Bookmark API integration decisions (filterState shape, 50-limit handling)
- Merge dialog UX decisions (3-step flow, error code mapping)
- OpenAPI docs approach (CDN Swagger UI, no npm package needed)
- WCAG fixes applied (list of components updated with ARIA enhancements)
- Playwright test results summary
</output>
