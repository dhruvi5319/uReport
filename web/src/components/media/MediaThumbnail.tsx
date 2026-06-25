import React from 'react';
import { mediaApi } from '@/api/media';

interface Props {
  internalFilename: string;
  filename: string;
  mimeType: string;
}

const MediaThumbnail: React.FC<Props> = ({ internalFilename, filename, mimeType }) => {
  const isImage = mimeType.startsWith('image/');
  const originalUrl = mediaApi.originalUrl(internalFilename);

  return (
    <div style={{
      border: '1px solid #e5e7eb',
      borderRadius: 6,
      padding: '0.5rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.25rem',
      width: 128,
    }}>
      {isImage ? (
        <a href={originalUrl} target="_blank" rel="noopener noreferrer">
          <img
            src={mediaApi.thumbnailUrl(internalFilename)}
            alt={filename}
            style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 4 }}
            onError={e => {
              (e.target as HTMLImageElement).src = originalUrl;
            }}
          />
        </a>
      ) : (
        <a
          href={originalUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#2563eb', textDecoration: 'underline', fontSize: '0.75rem', wordBreak: 'break-all' }}
        >
          {filename}
        </a>
      )}
      <span style={{ fontSize: '0.75rem', color: '#6b7280', width: '100%', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {filename}
      </span>
    </div>
  );
};

export default MediaThumbnail;
