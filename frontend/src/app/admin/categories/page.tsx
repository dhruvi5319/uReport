'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  getCategories,
  getDepartments,
  deleteCategory,
  type Category,
  type Department,
} from '@/lib/api/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('');
  const { toast } = useToast();

  const loadDepartments = useCallback(async () => {
    try {
      const res = await getDepartments();
      setDepartments(res.data ?? []);
    } catch {
      /* silent */
    }
  }, []);

  const loadCategories = useCallback(async (departmentId?: number) => {
    setLoading(true);
    try {
      const res = await getCategories(departmentId ? { departmentId } : undefined);
      setCategories(res.data ?? []);
    } catch {
      toast({ title: 'Failed to load categories', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadDepartments();
    void loadCategories();
  }, [loadDepartments, loadCategories]);

  const handleDeptFilterChange = (value: string) => {
    setDeptFilter(value);
    void loadCategories(value ? Number(value) : undefined);
  };

  const handleDeactivate = async (id: number, name: string) => {
    try {
      await deleteCategory(id);
      toast({ title: `Category "${name}" deactivated` });
      void loadCategories(deptFilter ? Number(deptFilter) : undefined);
    } catch {
      toast({ title: 'Failed to deactivate category', variant: 'destructive' });
    }
  };

  // Client-side search filter
  const filtered = categories.filter((c) =>
    search.trim() === '' || c.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Categories</h1>
        <Link href="/admin/categories/new">
          <Button>+ New Category</Button>
        </Link>
      </div>

      {/* Search + Filter row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <Input
          type="search"
          placeholder="Search categories…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
          aria-label="Search categories"
        />
        <Select value={deptFilter} onValueChange={handleDeptFilterChange}>
          <SelectTrigger className="sm:max-w-xs" aria-label="Filter by department">
            <SelectValue placeholder="All departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d.id} value={String(d.id)}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div aria-busy="true" className="p-8 text-gray-500">
          Loading categories…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="text-gray-500">
            {search || deptFilter ? 'No categories match your filters.' : 'No categories yet.'}
          </p>
          {!search && !deptFilter && (
            <Link href="/admin/categories/new" className="mt-4 inline-block">
              <Button variant="outline">Create your first category</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table
            className="min-w-full divide-y divide-gray-200"
            aria-label="Categories list"
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
                  Department
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  SLA Days
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Display
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
              {filtered.map((cat) => {
                const dept = departments.find((d) => d.id === cat.departmentId);
                return (
                  <tr key={cat.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {cat.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {dept?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {cat.slaDays != null ? `${cat.slaDays}d` : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 capitalize">
                      {cat.displayPermission}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={cat.active ? 'default' : 'secondary'}>
                        {cat.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Link href={`/admin/categories/${cat.id}`}>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </Link>
                      {cat.active && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => void handleDeactivate(cat.id, cat.name)}
                        >
                          Deactivate
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
