import { apiClient } from './client';

export interface ResponseTemplate {
  id: number;
  name: string;
  template: string;
  actionId: number | null;
  actionName?: string;
}

export interface CreateResponseTemplateRequest {
  name: string;
  template: string;
  action_id: number | null;
}

export const responseTemplatesApi = {
  list: (actionId?: number) =>
    apiClient.get<ResponseTemplate[]>('/response-templates', {
      params: actionId != null ? { action_id: actionId } : undefined,
    }).then(r => r.data),
  create: (req: CreateResponseTemplateRequest) =>
    apiClient.post<ResponseTemplate>('/response-templates', req).then(r => r.data),
  update: (id: number, req: CreateResponseTemplateRequest) =>
    apiClient.put<ResponseTemplate>(`/response-templates/${id}`, req).then(r => r.data),
  delete: (id: number) =>
    apiClient.delete(`/response-templates/${id}`),
};
