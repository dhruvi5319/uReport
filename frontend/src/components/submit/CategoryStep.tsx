'use client';

import { useEffect, useState } from 'react';

interface Category {
  id: number;
  name: string;
  icon?: string;
  postingPermission: string;
}

interface CategoryStepProps {
  selectedId: number | null;
  onSelect: (categoryId: number, label: string) => void;
  onNext: () => void;
}

const FALLBACK_EMOJI: Record<string, string> = {
  pothole: '🕳️',
  graffiti: '🖌️',
  garbage: '🗑️',
  tree: '🌳',
  water: '💧',
  road: '🛣️',
  light: '💡',
  noise: '🔊',
  park: '🌿',
  snow: '❄️',
  animal: '🐾',
};

function deriveEmoji(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, emoji] of Object.entries(FALLBACK_EMOJI)) {
    if (lower.includes(key)) return emoji;
  }
  return '📋';
}

export default function CategoryStep({ selectedId, onSelect, onNext }: CategoryStepProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '';

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${apiBase}/api/categories?postingPermission[]=public&postingPermission[]=anonymous&active=true`
        );
        if (!res.ok) throw new Error('Failed to load categories');
        const data = await res.json();
        const cats: Category[] = (data.data ?? []).filter(
          (c: Category) =>
            c.postingPermission === 'public' || c.postingPermission === 'anonymous'
        );
        setCategories(cats);
      } catch {
        setError('Unable to load categories. Please try refreshing.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [apiBase]);

  const filtered = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">What would you like to report?</h2>

      <input
        type="text"
        placeholder="Search categories..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full px-3 py-2 border rounded-md text-base outline-none focus:ring-2 focus:ring-primary/50"
        aria-label="Search categories"
      />

      {loading && (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          Loading categories...
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="flex flex-col gap-2">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No categories match your search.
            </p>
          ) : (
            filtered.map(cat => (
              <button
                key={cat.id}
                data-testid="category-card"
                onClick={() => onSelect(cat.id, cat.name)}
                className={`w-full text-left flex items-center gap-3 px-4 rounded-lg border transition-colors min-h-[48px] ${
                  selectedId === cat.id
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                }`}
                aria-pressed={selectedId === cat.id}
              >
                <span className="text-2xl flex-shrink-0">
                  {cat.icon ?? deriveEmoji(cat.name)}
                </span>
                <span className="font-medium text-sm">{cat.name}</span>
                {selectedId === cat.id && (
                  <span className="ml-auto text-primary">✓</span>
                )}
              </button>
            ))
          )}
        </div>
      )}

      <p className="text-sm text-muted-foreground text-center mt-2">
        Can&apos;t find your issue? Call us: 📞 555-0100
      </p>

      {/* Sticky Next button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t z-10">
        <div className="max-w-lg mx-auto">
          <button
            onClick={onNext}
            disabled={selectedId === null}
            className="w-full h-11 rounded-md bg-primary text-primary-foreground font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
