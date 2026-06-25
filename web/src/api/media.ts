import { apiClient } from './client';

export interface MediaItem {
  id: number;
  ticket_id: number;
  filename: string;
  internalFilename: string;
  mime_type: string;
  uploaded: string;
  person_id: number | null;
  url: string;
  thumbnailUrl: string | null;
}

export const mediaApi = {
  uploadFile: (ticketId: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post<MediaItem>(`/tickets/${ticketId}/media`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },
  listMedia: (ticketId: number) =>
    apiClient.get<MediaItem[]>(`/tickets/${ticketId}/media`).then(r => r.data),
  deleteMedia: (ticketId: number, mediaId: number) =>
    apiClient.delete(`/tickets/${ticketId}/media/${mediaId}`),
  // URL helpers — backend serves files at these paths
  originalUrl: (internalFilename: string) =>
    `/api/v1/media/${internalFilename}`,
  thumbnailUrl: (internalFilename: string) =>
    `/api/v1/media/${internalFilename}/thumbnail`,
};
