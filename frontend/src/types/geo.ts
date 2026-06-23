// frontend/src/types/geo.ts

export interface GeoCluster {
  lat: number;
  lng: number;
  count: number;
  zoom: number;
}

export interface TicketPin {
  id: number;
  title: string;
  status: 'open' | 'closed';
  lat: number;
  lng: number;
}

export interface ClusterParams {
  bbox?: string;
  zoom?: number;
  status?: string;
  categoryId?: number[];
  departmentId?: number[];
}
