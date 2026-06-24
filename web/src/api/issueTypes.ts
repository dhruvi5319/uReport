import { apiClient } from './client';

export interface IssueType {
  id: number;
  name: string;
  isSystem: boolean;
}

export interface CreateIssueTypeRequest {
  name: string;
}

export const issueTypesApi = {
  list: () =>
    apiClient.get<IssueType[]>('/issue-types').then(r => r.data),
  create: (req: CreateIssueTypeRequest) =>
    apiClient.post<IssueType>('/issue-types', req).then(r => r.data),
  update: (id: number, req: CreateIssueTypeRequest) =>
    apiClient.put<IssueType>(`/issue-types/${id}`, req).then(r => r.data),
  delete: (id: number) =>
    apiClient.delete(`/issue-types/${id}`),
};
