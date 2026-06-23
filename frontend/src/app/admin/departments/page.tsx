'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  getDepartments,
  deleteDepartment,
  updateDepartment,
  type Department,
} from '@/lib/api/admin';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { ApiError } from '@/lib/api-client';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [deactivateTarget, setDeactivateTarget] = useState<Department | null>(null);
  const [confirmName, setConfirmName] = useState('');
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const res = await getDepartments();
      setDepartments(res.data ?? []);
    } catch {
      toast({ title: 'Failed to load departments', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeactivate = async (dept: Department) => {
    try {
      await deleteDepartment(dept.id);
      toast({ title: 'Department deactivated' });
      void load();
    } catch (err) {
      if (err instanceof ApiError && err.code === 'HAS_ACTIVE_TICKETS') {
        setDeactivateTarget(dept);
        setConfirmName('');
      } else {
        toast({ title: 'Failed to deactivate department', variant: 'destructive' });
      }
    }
  };

  const handleConfirmedDeactivate = async () => {
    if (!deactivateTarget) return;
    try {
      await deleteDepartment(deactivateTarget.id, { force: true });
      toast({ title: 'Department deactivated' });
      setDeactivateTarget(null);
      void load();
    } catch {
      toast({ title: 'Failed to deactivate department', variant: 'destructive' });
    }
  };

  const handleReactivate = async (id: number) => {
    try {
      await updateDepartment(id, { active: true });
      toast({ title: 'Department reactivated' });
      void load();
    } catch {
      toast({ title: 'Failed to reactivate department', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div aria-busy="true" className="p-8 text-gray-500">
        Loading departments…
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Departments</h1>
        <Link href="/admin/departments/new">
          <Button>+ New Department</Button>
        </Link>
      </div>

      {departments.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="text-gray-500">No departments yet.</p>
          <Link href="/admin/departments/new" className="mt-4 inline-block">
            <Button variant="outline">Create your first department</Button>
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table
            className="min-w-full divide-y divide-gray-200"
            aria-label="Departments list"
          >
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Default Assignee
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Active
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
              {departments.map((dept) => (
                <tr key={dept.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {dept.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {dept.defaultAssignee?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={dept.active ? 'default' : 'secondary'}>
                      {dept.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Link href={`/admin/departments/${dept.id}`}>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </Link>
                    {dept.active ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => void handleDeactivate(dept)}
                      >
                        Deactivate
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void handleReactivate(dept.id)}
                      >
                        Reactivate
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Deactivation confirmation dialog for HAS_ACTIVE_TICKETS */}
      <AlertDialog
        open={!!deactivateTarget}
        onOpenChange={(open) => !open && setDeactivateTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Department?</AlertDialogTitle>
            <AlertDialogDescription>
              This department has active tickets. Deactivating it will remove it from ticket
              routing and the Open311 services list. Existing tickets will not be affected.
              <br />
              <br />
              Type <strong>{deactivateTarget?.name}</strong> to confirm:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <input
            type="text"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm mt-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            aria-label="Type department name to confirm deactivation"
            placeholder={deactivateTarget?.name ?? ''}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={confirmName !== deactivateTarget?.name}
              onClick={() => void handleConfirmedDeactivate()}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-40"
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
