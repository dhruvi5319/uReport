import { apiClient } from './client';

export interface ContactMethod {
  id: number;
  name: string;
  isSystem: boolean;
}

export const contactMethodsApi = {
  list: () =>
    apiClient.get<ContactMethod[]>('/contact-methods').then(r => r.data),
};
