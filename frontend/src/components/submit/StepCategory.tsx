import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWizard } from '@/contexts/WizardContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface Category {
  id: number;
  name: string;
  postingPermissionLevel?: string;
}

interface CategoryGroup {
  id: number;
  name: string;
  categories: Category[];
}

export function StepCategory() {
  const { formData, updateFormData, goNext, goBack } = useWizard();
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(formData.categoryGroupId ?? null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(formData.categoryId ?? null);

  const { data: groups, isLoading } = useQuery<CategoryGroup[]>({
    queryKey: ['categories-public'],
    queryFn: () => fetch('/api/categories/public').then(r => r.json()),
  });

  const selectedGroup = groups?.find(g => g.id === selectedGroupId);
  const canAdvance = !!selectedCategoryId;

  const handleNext = () => {
    if (!canAdvance) return;
    const cat = selectedGroup?.categories.find(c => c.id === selectedCategoryId);
    updateFormData({
      categoryGroupId: selectedGroupId!,
      categoryGroupName: selectedGroup?.name,
      categoryId: selectedCategoryId!,
      categoryName: cat?.name,
    });
    goNext();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category</CardTitle>
        <CardDescription>What kind of issue are you reporting?</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array(4).fill(null).map((_, i) => <Skeleton key={i} className="h-16" />)}
          </div>
        ) : (
          <>
            {/* Category group tiles */}
            {!selectedGroupId && (
              <div className="grid grid-cols-2 gap-3">
                {groups?.map(group => (
                  <button
                    key={group.id}
                    onClick={() => setSelectedGroupId(group.id)}
                    className={cn(
                      'p-4 rounded-lg border text-left hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary',
                      selectedGroupId === group.id && 'border-primary bg-primary/5',
                    )}
                    aria-pressed={selectedGroupId === group.id}
                  >
                    <div className="font-medium text-sm">{group.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">{group.categories?.length ?? 0} types</div>
                  </button>
                ))}
              </div>
            )}

            {/* Category tiles — shown after group selected */}
            {selectedGroupId && selectedGroup && (
              <>
                <button
                  onClick={() => { setSelectedGroupId(null); setSelectedCategoryId(null); }}
                  className="text-sm text-primary underline"
                >
                  ← Back to categories
                </button>
                <div className="grid grid-cols-2 gap-3">
                  {selectedGroup.categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className={cn(
                        'p-4 rounded-lg border text-left hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary',
                        selectedCategoryId === cat.id && 'border-primary bg-primary/5',
                      )}
                      aria-pressed={selectedCategoryId === cat.id}
                    >
                      <div className="font-medium text-sm">{cat.name}</div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={goBack}>← Back</Button>
          <Button className="flex-1" disabled={!canAdvance} onClick={handleNext}>
            Next: Location →
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
