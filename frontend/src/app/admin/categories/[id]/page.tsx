import { notFound } from 'next/navigation';
import { getCategory } from '@/lib/api/admin';
import { CategoryForm } from '@/components/admin/CategoryForm';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CategoryEditPage({ params }: Props) {
  const { id } = await params;

  // New category
  if (id === 'new') {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">New Category</h1>
        <CategoryForm />
      </div>
    );
  }

  const numId = parseInt(id, 10);
  if (isNaN(numId)) {
    notFound();
  }

  let category;
  try {
    const res = await getCategory(numId);
    category = res.data;
  } catch {
    notFound();
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">
        Edit Category — {category.name}
      </h1>
      <CategoryForm initialData={category} />
    </div>
  );
}
