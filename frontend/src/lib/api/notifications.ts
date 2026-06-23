// frontend/src/lib/api/notifications.ts
import { apiFetch } from '@/lib/api/client';

export interface NotificationSettings {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string; // masked in GET response; set to '' if not changed on PUT
  smtpTls: boolean;
  smtpFromAddress: string;
  smtpFromName: string;
  digestEnabled: boolean;
  digestSchedule: string; // cron expression or named schedule e.g. 'daily_7am'
}

export async function fetchNotificationSettings(): Promise<NotificationSettings> {
  const res = await apiFetch('/api/notifications/settings');
  return res.data as NotificationSettings;
}

export async function updateNotificationSettings(
  settings: Partial<NotificationSettings>,
): Promise<NotificationSettings> {
  const res = await apiFetch('/api/notifications/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  return res.data as NotificationSettings;
}
