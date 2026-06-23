'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  getSubstatuses,
  deleteSubstatus,
  type Substatus,
} from '@/lib/api/admin';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

export default function SubstatusesPage() {
  const [substatuses, setSubstatuses] = useState<Substatus[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSubstatuses();
      setSubstatuses(res.data ?? []);
    } catch {
      toast({ title: 'Failed to load substatuses', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDeactivate = async (id: number, label: string) => {
    try {
      await deleteSubstatus(id);
      toast({ title: `Substatus "${label}" deactivated` });
      void load();
    } catch {
      toast({ title: 'Failed to deactivate substatus', variant: 'destructive' });
    }
  };

  const openSubstatuses = substatuses
    .filter((s) => s.primaryStatus === 'open')
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const closedSubstatuses = substatuses
    .filter((s) => s.primaryStatus === 'closed')
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (loading) {
    return (
      <div aria-busy="true" className="p-8 text-gray-500">
        Loading substatuses…
      </div>
    );
  }

  const SubstatusTable = ({ items }: { items: Substatus[] }) => (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200" aria-label="Substatuses">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
            >
              Label
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
            >
              Status
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
            >
              Sort
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {items.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                No substatuses in this group.
              </td>
            </tr>
          ) : (
            items.map((sub) => (
              <tr key={sub.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  <span className="flex items-center gap-2">
                    {sub.label}
                    {sub.isDefault && (
                      <Badge variant="secondary" className="text-xs">
                        Default
                      </Badge>
                    )}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={sub.active ? 'default' : 'secondary'}>
                    {sub.active ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{sub.sortOrder}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  <Link href={`/admin/substatuses/${sub.id}`}>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </Link>
                  {sub.active && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => void handleDeactivate(sub.id, sub.label)}
                    >
                      Deactivate
                    </Button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Substatuses</h1>
        <Link href="/admin/substatuses/new">
          <Button>+ New Substatus</Button>
        </Link>
      </div>

      {substatuses.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="text-gray-500">No substatuses yet.</p>
          <Link href="/admin/substatuses/new" className="mt-4 inline-block">
            <Button variant="outline">Create your first substatus</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Open statuses section */}
          <section aria-label="Open statuses">
            <h2 className="text-lg font-medium text-gray-800 mb-3">Open statuses</h2>
            <SubstatusTable items={openSubstatuses} />
          </section>

          {/* Closed statuses section */}
          <section aria-label="Closed statuses">
            <h2 className="text-lg font-medium text-gray-800 mb-3">Closed statuses</h2>
            <SubstatusTable items={closedSubstatuses} />
          </section>
        </div>
      )}
    </div>
  );
}
