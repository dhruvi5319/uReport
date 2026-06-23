'use client';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface Category {
  id: number;
  name: string;
  department: { id: number; name: string } | null;
  groupName?: string;
}

interface CategoryStepProps {
  value: number | null;
  onChange: (id: number, category: Category) => void;
}

export function CategoryStep({ value, onChange }: CategoryStepProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [q, setQ] = useState('');

  useEffect(() => {
    fetch('/api/categories?active=1', { credentials: 'include' })
      .then((r) => r.json())
      .then((res) => setCategories(res.data ?? []))
      .catch(() => {});
  }, []);

  const filtered = q.trim()
    ? categories.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()))
    : categories;

  // Group by groupName
  const groups = filtered.reduce<Record<string, Category[]>>((acc, cat) => {
    const key = cat.groupName ?? 'Other';
    (acc[key] ??= []).push(cat);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="category-search" className="sr-only">Search categories</Label>
        <Input
          id="category-search"
          placeholder="🔍 Search categories…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <RadioGroup
        value={value?.toString() ?? ''}
        onValueChange={(v) => {
          const cat = categories.find((c) => c.id === parseInt(v, 10));
          if (cat) onChange(cat.id, cat);
        }}
        className="space-y-3"
      >
        {Object.entries(groups).map(([group, cats]) => (
          <div key={group}>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
              {group}
            </p>
            <div className="space-y-1 pl-2">
              {cats.map((cat) => (
                <div key={cat.id} className="flex items-center gap-2">
                  <RadioGroupItem value={cat.id.toString()} id={`cat-${cat.id}`} />
                  <Label htmlFor={`cat-${cat.id}`} className="flex-1 cursor-pointer flex items-center justify-between">
                    <span>{cat.name}</span>
                    {cat.department && (
                      <span className="text-xs text-gray-500 ml-2">→ {cat.department.name}</span>
                    )}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-gray-500 py-2">
            No categories found. Can&apos;t find your issue? Call us at 555-0100.
          </p>
        )}
      </RadioGroup>
    </div>
  );
}
