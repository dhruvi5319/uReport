import { apiClient } from './client';

export interface GeoClusterMarker {
  clusterId: number;
  level: number;
  lat: number;
  lng: number;
  ticketCount: number;
}

export interface MapViewResponse {
  clusters: GeoClusterMarker[];
  total: number;
}

export const geoApi = {
  // Send the same search params as ticket list but with view=map
  searchMap: (params: Record<string, string | number | undefined>) =>
    apiClient.get<MapViewResponse>('/tickets', {
      params: { ...params, view: 'map' },
    }).then(r => r.data),
};
