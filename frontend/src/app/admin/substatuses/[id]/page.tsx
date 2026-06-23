import { notFound } from 'next/navigation';
import { getSubstatuses } from '@/lib/api/admin';
import { SubstatusForm } from '@/components/admin/SubstatusForm';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SubstatusEditPage({ params }: Props) {
  const { id } = await params;

  // New substatus
  if (id === 'new') {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">New Substatus</h1>
        <SubstatusForm />
      </div>
    );
  }

  const numId = parseInt(id, 10);
  if (isNaN(numId)) {
    notFound();
  }

  // Fetch all substatuses and find the one we need
  let substatus;
  try {
    const res = await getSubstatuses();
    substatus = (res.data ?? []).find((s) => s.id === numId);
    if (!substatus) {
      notFound();
    }
  } catch {
    notFound();
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">
        Edit Substatus — {substatus.label}
      </h1>
      <SubstatusForm initialData={substatus} />
    </div>
  );
}
