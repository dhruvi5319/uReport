import axios from 'axios';

export interface Open311Service {
  service_code: string;
  service_name: string;
  description: string | null;
  metadata: boolean;
  type: string;
  keywords: string | null;
  group: string | null;
}

export interface Open311ServiceAttribute {
  code: string;
  datatype: string;
  required: boolean;
  description: string;
  order: number;
  values?: { key: string; name: string }[];
}

// NOTE: /open311/services does NOT require auth — uses plain axios, not apiClient
export const open311Api = {
  listServices: () =>
    axios.get<Open311Service[]>('/open311/services').then(r => r.data),
  getService: (serviceCode: string) =>
    axios.get<{ service: Open311Service; attributes: Open311ServiceAttribute[] }>(
      `/open311/services/${serviceCode}`
    ).then(r => r.data),
};
