'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { Person, PersonRole, Department } from '@/lib/api/admin';
import { getPeople, getDepartments, updatePerson } from '@/lib/api/admin';

const ROLE_BADGE_VARIANT: Record<PersonRole, 'destructive' | 'default' | 'secondary'> = {
  admin: 'destructive',
  staff: 'default',
  public: 'secondary',
};

const ROLE_LABELS: Record<PersonRole, string> = {
  admin: 'Admin',
  staff: 'Staff',
  public: 'Public',
};

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState<PersonRole | 'all'>('all');
  const [activeFilter, setActiveFilter] = useState<'all' | 'true' | 'false'>('all');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const PER_PAGE = 25;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, string | number | boolean> = { page, perPage: PER_PAGE };
      if (q.trim()) params.q = q.trim();
      if (roleFilter !== 'all') params.role = roleFilter;
      if (activeFilter !== 'all') params.active = activeFilter === 'true';

      const res = await getPeople(params as Parameters<typeof getPeople>[0]);
      setPeople(res.data);

      const meta = res.meta as { total?: number; pages?: number };
      setTotal(meta.total ?? res.data.length);
      setTotalPages(meta.pages ?? 1);
    } catch {
      setError('Failed to load people. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [q, roleFilter, activeFilter, page]);

  useEffect(() => {
    void load();
  }, [load]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [q, roleFilter, activeFilter]);

  async function handleToggleActive(person: Person) {
    await updatePerson(person.id, { active: !person.active });
    await load();
  }

  const deptMap = new Map(departments.map((d) => [d.id, d.name]));

  // Load departments for display
  useEffect(() => {
    getDepartments()
      .then((res) => setDepartments(res.data))
      .catch(() => {/* ignore */});
  }, []);

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-semibold text-gray-900">People</h1>
        <Link href="/admin/people/new">
          <Button>+ New Person</Button>
        </Link>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <details open className="group">
          <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 md:hidden mb-3">
            <span>Filters</span>
            <span className="ml-auto group-open:rotate-180 transition-transform">▾</span>
          </summary>
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[180px] space-y-1">
              <Label htmlFor="search-q">Search by name or email</Label>
              <Input
                id="search-q"
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search…"
                aria-label="Search people by name or email"
              />
            </div>

            {/* Role filter */}
            <div className="min-w-[160px] space-y-1">
              <Label htmlFor="role-filter-trigger">Role</Label>
              <Select
                value={roleFilter}
                onValueChange={(v) => setRoleFilter(v as PersonRole | 'all')}
              >
                <SelectTrigger id="role-filter-trigger" aria-label="Filter by role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="public">Public (Citizen)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Active filter */}
            <div className="min-w-[140px] space-y-1">
              <Label htmlFor="active-filter-trigger">Status</Label>
              <Select
                value={activeFilter}
                onValueChange={(v) => setActiveFilter(v as 'all' | 'true' | 'false')}
              >
                <SelectTrigger id="active-filter-trigger" aria-label="Filter by active status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </details>
      </div>

      {/* Error state */}
      {error && (
        <div role="alert" className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <p className="text-sm text-gray-500" aria-live="polite" aria-busy="true">
          Loading people…
        </p>
      )}

      {/* Desktop table */}
      {!loading && !error && (
        <>
          <div className="hidden md:block bg-white rounded-lg border border-gray-200 overflow-hidden">
            {people.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                No people found matching your filters.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left font-medium text-gray-700">Full Name</th>
                    <th scope="col" className="px-4 py-3 text-left font-medium text-gray-700">Role</th>
                    <th scope="col" className="px-4 py-3 text-left font-medium text-gray-700">Department</th>
                    <th scope="col" className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {people.map((person) => (
                    <tr key={person.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {person.fullName}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={ROLE_BADGE_VARIANT[person.role]}>
                          {ROLE_LABELS[person.role]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {person.departmentId
                          ? (deptMap.get(person.departmentId) ?? `Dept #${person.departmentId}`)
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={person.active ? 'default' : 'secondary'}>
                          {person.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/people/${person.id}`}>
                            <Button variant="outline" size="sm">Edit</Button>
                          </Link>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className={person.active ? 'text-red-600 border-red-200 hover:bg-red-50' : ''}
                              >
                                {person.active ? 'Deactivate' : 'Reactivate'}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {person.active ? 'Deactivate' : 'Reactivate'} {person.fullName}?
                                </AlertDialogTitle>
                                <AlertDialogDescription id={`toggle-desc-${person.id}`}>
                                  {person.active
                                    ? `${person.fullName} will no longer be able to log in.`
                                    : `${person.fullName} will be able to log in again.`}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className={person.active ? 'bg-red-600 hover:bg-red-700' : ''}
                                  onClick={() => void handleToggleActive(person)}
                                >
                                  {person.active ? 'Deactivate' : 'Reactivate'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Mobile card list */}
          <div className="md:hidden space-y-3">
            {people.length === 0 ? (
              <p className="text-center text-sm text-gray-500">
                No people found matching your filters.
              </p>
            ) : (
              people.map((person) => (
                <div
                  key={person.id}
                  className="bg-white rounded-lg border border-gray-200 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-gray-900">{person.fullName}</p>
                      {person.departmentId && (
                        <p className="text-sm text-gray-500 mt-0.5">
                          {deptMap.get(person.departmentId) ?? `Dept #${person.departmentId}`}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <Badge variant={ROLE_BADGE_VARIANT[person.role]}>
                        {ROLE_LABELS[person.role]}
                      </Badge>
                      <Badge variant={person.active ? 'default' : 'secondary'}>
                        {person.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/admin/people/${person.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">Edit</Button>
                    </Link>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          {person.active ? 'Deactivate' : 'Reactivate'}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {person.active ? 'Deactivate' : 'Reactivate'} {person.fullName}?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {person.active
                              ? `${person.fullName} will no longer be able to log in.`
                              : `${person.fullName} will be able to log in again.`}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => void handleToggleActive(person)}>
                            {person.active ? 'Deactivate' : 'Reactivate'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav aria-label="People pagination" className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing page {page} of {totalPages} ({total} total)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page <= 1}
                  aria-label="Previous page"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages}
                  aria-label="Next page"
                >
                  Next
                </Button>
              </div>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
