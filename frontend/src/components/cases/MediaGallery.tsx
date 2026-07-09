import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Media } from '@/types/ticket';

interface MediaGalleryProps {
  media: Media[];
  ticketId?: string;
}

export function MediaGallery({ media, ticketId }: MediaGalleryProps) {
  const [lightboxMedia, setLightboxMedia] = useState<Media | null>(null);
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return fetch(`/api/tickets/${ticketId}/media`, {
        method: 'POST',
        body: form,
      }).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-media', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['ticket-history', ticketId] }); // media upload creates history entry
    },
  });

  // HTML5 drag-and-drop handlers (native — no third-party uploader)
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    files.forEach(f => {
      if (f.type.startsWith('image/')) uploadMutation.mutate(f);
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Photos ({media.length})</h3>
        <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
          + Attach Photo
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif"
          multiple
          className="hidden"
          onChange={e =>
            Array.from(e.target.files ?? []).forEach(f => uploadMutation.mutate(f))
          }
        />
      </div>

      {/* Drag-and-drop zone (HTML5 native events — per locked decision) */}
      <div
        className="border-2 border-dashed border-muted rounded-lg p-4 text-center text-muted-foreground text-sm min-h-[80px] flex items-center justify-center"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        aria-label="Drop photos here or click Attach Photo"
      >
        {uploadMutation.isPending ? 'Uploading...' : 'Drop photos here'}
      </div>

      {/* Thumbnail grid */}
      {media.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {media.map(m => (
            <button
              key={m.id}
              onClick={() => setLightboxMedia(m)}
              className="aspect-square overflow-hidden rounded focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label={`View photo ${m.filename}`}
            >
              <img src={m.thumbnailUrl} alt={m.filename} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox — uses Radix Dialog fullscreen per locked decision */}
      <Dialog open={!!lightboxMedia} onOpenChange={open => !open && setLightboxMedia(null)}>
        <DialogContent className="max-w-screen-lg max-h-screen p-0 bg-black/90">
          <DialogHeader className="absolute top-2 right-2 z-10">
            <DialogTitle className="sr-only">{lightboxMedia?.filename}</DialogTitle>
          </DialogHeader>
          {lightboxMedia && (
            <img
              src={lightboxMedia.url}
              alt={lightboxMedia.filename}
              className="max-w-full max-h-screen object-contain mx-auto"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
