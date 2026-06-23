import { CategoryForm } from '@/components/admin/CategoryForm';

export default function NewCategoryPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">New Category</h1>
      <CategoryForm />
    </div>
  );
}
