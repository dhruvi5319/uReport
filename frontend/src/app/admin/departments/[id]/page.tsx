import { notFound } from 'next/navigation';
import { getDepartment } from '@/lib/api/admin';
import { DepartmentForm } from '@/components/admin/DepartmentForm';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DepartmentEditPage({ params }: Props) {
  const { id } = await params;

  // New department
  if (id === 'new') {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">New Department</h1>
        <DepartmentForm />
      </div>
    );
  }

  const numId = parseInt(id, 10);
  if (isNaN(numId)) {
    notFound();
  }

  let department;
  try {
    const res = await getDepartment(numId);
    department = res.data;
  } catch {
    notFound();
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">
        Edit Department — {department.name}
      </h1>
      <DepartmentForm initialData={department} />
    </div>
  );
}
