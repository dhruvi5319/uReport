// frontend/src/app/admin/settings/notifications/page.tsx
import { NotificationSettingsForm } from '@/components/admin/NotificationSettingsForm';
import { requireRole } from '@/lib/auth/guards'; // established in Wave 3a/3b

export const metadata = { title: 'Notification Settings — uReport Admin' };

export default async function NotificationSettingsPage() {
  await requireRole(['admin']); // throws redirect if not admin
  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-6 text-2xl font-bold">Notification Settings</h1>
      <NotificationSettingsForm />
    </div>
  );
}
