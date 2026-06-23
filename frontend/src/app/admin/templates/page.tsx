'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { Template } from '@/lib/api/admin';
import { getTemplates, updateTemplate, deleteTemplate } from '@/lib/api/admin';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch all templates including inactive for admin view
      const res = await getTemplates({ active: 'all' });
      setTemplates(res.data);
    } catch {
      setError('Failed to load templates. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleToggleActive(template: Template) {
    try {
      await updateTemplate(template.id, { active: !template.active });
      await load();
    } catch {
      // Error is visible via page refresh
    }
  }

  async function handleDelete(template: Template) {
    if (template.slug !== null) return; // Guard: system templates cannot be deleted
    try {
      await deleteTemplate(template.id);
      await load();
    } catch {
      // Error is visible via page refresh
    }
  }

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-semibold text-gray-900">Response Templates</h1>
        <Link href="/admin/templates/new">
          <Button>+ New Template</Button>
        </Link>
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
          Loading templates…
        </p>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          {templates.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              No templates yet. Create your first response template.
            </div>
          ) : (
            <table className="w-full text-sm min-w-[600px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left font-medium text-gray-700">
                    Name
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-medium text-gray-700">
                    Subject
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-medium text-gray-700">
                    Active
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-medium text-gray-700">
                    System?
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-medium text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {templates.map((tpl) => {
                  const isSystem = tpl.slug !== null;
                  return (
                    <tr key={tpl.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {tpl.name}
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">
                        {tpl.subject ?? <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={tpl.active ? 'default' : 'secondary'}>
                          {tpl.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {isSystem ? (
                          <Badge
                            variant="secondary"
                            title="System templates cannot be deleted"
                          >
                            System
                          </Badge>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/templates/${tpl.id}`}>
                            <Button variant="outline" size="sm">
                              Edit
                            </Button>
                          </Link>

                          {/* Toggle active — available for all templates */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void handleToggleActive(tpl)}
                            aria-label={`${tpl.active ? 'Deactivate' : 'Activate'} template "${tpl.name}"`}
                          >
                            {tpl.active ? 'Deactivate' : 'Activate'}
                          </Button>

                          {/* Delete — only for non-system templates */}
                          {isSystem ? (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled
                              aria-disabled="true"
                              title="System templates cannot be deleted"
                              aria-label={`Cannot delete system template "${tpl.name}"`}
                            >
                              Delete
                            </Button>
                          ) : (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                  aria-label={`Delete template "${tpl.name}"`}
                                >
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete template?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Delete <strong>{tpl.name}</strong>? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-red-600 hover:bg-red-700"
                                    onClick={() => void handleDelete(tpl)}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
