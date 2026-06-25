import React, { useCallback, useRef, useState } from 'react';
import { mediaApi, MediaItem } from '@/api/media';

interface Props {
  ticketId: number;
  onUploaded: (media: MediaItem) => void;
}

const MediaUploader: React.FC<Props> = ({ ticketId, onUploaded }) => {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      setUploading(true);
      setError(null);
      try {
        const media = await mediaApi.uploadFile(ticketId, file);
        onUploaded(media);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Upload failed');
      } finally {
        setUploading(false);
      }
    },
    [ticketId, onUploaded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      const files = Array.from(e.dataTransfer.files);
      files.forEach(uploadFile);
    },
    [uploadFile]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    files.forEach(uploadFile);
    e.target.value = '';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? '#3b82f6' : '#d1d5db'}`,
          borderRadius: 6,
          padding: '1.5rem',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragging ? '#eff6ff' : '#fff',
          transition: 'border-color 0.2s, background 0.2s',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        {uploading ? (
          <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>Uploading…</p>
        ) : (
          <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
            Drag files here or <span style={{ color: '#2563eb', textDecoration: 'underline' }}>click to browse</span>
          </p>
        )}
      </div>
      {error && <p style={{ color: '#dc2626', fontSize: '0.875rem', margin: 0 }}>{error}</p>}
    </div>
  );
};

export default MediaUploader;
