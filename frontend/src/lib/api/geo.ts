// frontend/src/lib/api/geo.ts
import type { GeoCluster, ClusterParams } from '@/types/geo';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

export async function fetchClusters(
  params: ClusterParams,
  signal?: AbortSignal,
): Promise<GeoCluster[]> {
  const qs = new URLSearchParams();
  if (params.bbox)   qs.set('bbox', params.bbox);
  if (params.zoom)   qs.set('zoom', String(params.zoom));
  if (params.status) qs.set('status', params.status);
  params.categoryId?.forEach((id) => qs.append('categoryId[]', String(id)));
  params.departmentId?.forEach((id) => qs.append('departmentId[]', String(id)));

  const res = await fetch(
    `${API_BASE}/api/tickets/clusters${qs.toString() ? '?' + qs.toString() : ''}`,
    { credentials: 'include', signal },
  );
  if (!res.ok) throw new Error(`Cluster fetch failed: HTTP ${res.status}`);
  const body = await res.json();
  return (body as { data: GeoCluster[] }).data as GeoCluster[];
}

/**
 * Fetch individual ticket pins at high zoom (when cluster count < 10).
 * Reuses the search endpoint with a tight bbox filter.
 */
export async function fetchTicketPins(
  bbox: string,
  signal?: AbortSignal,
): Promise<Array<{ id: number; title: string; status: 'open' | 'closed'; lat: number; lng: number }>> {
  const res = await fetch(
    `${API_BASE}/api/tickets?bbox=${encodeURIComponent(bbox)}&perPage=50&status=open`,
    { credentials: 'include', signal },
  );
  if (!res.ok) return [];
  const body = await res.json();
  return ((body as { data?: unknown[] }).data ?? [])
    .filter((t) => {
      const ticket = t as { lat: number | null; lng: number | null };
      return ticket.lat !== null && ticket.lng !== null;
    })
    .map((t) => {
      const ticket = t as { id: number; title: string; status: 'open' | 'closed'; lat: number; lng: number };
      return { id: ticket.id, title: ticket.title, status: ticket.status, lat: ticket.lat, lng: ticket.lng };
    });
}
