import { apiClient } from './client';

export interface Bookmark {
  id: number;
  type: string;
  name: string;
  requestUri: string;
  createdAt: string;
}

export interface CreateBookmarkRequest {
  name: string;
  requestUri: string;
  type?: string;
}

export const bookmarksApi = {
  list: () =>
    apiClient.get<Bookmark[]>('/bookmarks').then(r => r.data),
  create: (req: CreateBookmarkRequest) =>
    apiClient.post<Bookmark>('/bookmarks', req).then(r => r.data),
  delete: (id: number) =>
    apiClient.delete(`/bookmarks/${id}`),
};
