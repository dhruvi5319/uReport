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
  /** The current filter+sort state from the ticket list URL params */
  currentFilterState: Record<string, unknown>;
  /** Called when a bookmark is selected — consumer should apply filterState to URL params */
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

  useEffect(() => {
    fetchBookmarks();
  }, []);

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
        setSaveNameError(err?.message ?? 'A bookmark with this name already exists');
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
            <div
              className="px-3 py-2 text-sm text-gray-500"
              role="status"
              aria-live="polite"
            >
              Loading bookmarks…
            </div>
          ) : bookmarks.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">
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
            onSelect={(e) => {
              e.preventDefault();
              setSaveDialogOpen(true);
            }}
            className="cursor-pointer"
          >
            <BookmarkPlus className="h-4 w-4 mr-2" aria-hidden="true" />
            Save current filters
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setManageSheetOpen(true);
            }}
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
            <DialogTitle id="save-bookmark-title">
              Save current search as bookmark
            </DialogTitle>
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
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
              }}
            />
            {saveNameError && (
              <p
                id="bookmark-name-error"
                className="text-sm text-red-600 mt-1"
                role="alert"
              >
                {saveNameError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSaveDialogOpen(false);
                setSaveName('');
                setSaveNameError('');
              }}
            >
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
