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
            <p className="text-sm text-gray-500 py-4 text-center">
              No bookmarks yet.
            </p>
          ) : (
            <ul role="list" className="space-y-2">
              {bookmarks.map((bm) => (
                <li
                  key={bm.id}
                  className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2"
                >
                  <span className="text-sm truncate flex-1 mr-2">{bm.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete bookmark "${bm.name}"`}
                    disabled={deleting === bm.id}
                    onClick={() => handleDelete(bm.id, bm.name)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" aria-hidden="true" />
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
