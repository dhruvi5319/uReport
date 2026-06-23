// frontend/src/components/admin/NotificationSettingsForm.tsx
'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  fetchNotificationSettings,
  updateNotificationSettings,
  type NotificationSettings,
} from '@/lib/api/notifications';

export function NotificationSettingsForm() {
  const [settings, setSettings] = useState<Partial<NotificationSettings>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchNotificationSettings()
      .then(setSettings)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateNotificationSettings(settings);
      setSettings(updated);
      toast.success('Notification settings saved.');
    } catch {
      toast.error('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div role="status" aria-live="polite" className="h-64 animate-pulse rounded bg-gray-100" />
    );
  }

  return (
    <div className="max-w-xl space-y-6">
      <section>
        <h2 className="mb-4 text-base font-semibold">SMTP Configuration</h2>
        <div className="space-y-4">
          <Field
            id="smtpHost"
            label="SMTP Host"
            value={settings.smtpHost ?? ''}
            onChange={(v) => setSettings((s) => ({ ...s, smtpHost: v }))}
            placeholder="mail.example.com"
          />
          <Field
            id="smtpPort"
            label="SMTP Port"
            value={String(settings.smtpPort ?? 587)}
            onChange={(v) => setSettings((s) => ({ ...s, smtpPort: Number(v) }))}
            type="number"
            placeholder="587"
          />
          <Field
            id="smtpUser"
            label="SMTP Username"
            value={settings.smtpUser ?? ''}
            onChange={(v) => setSettings((s) => ({ ...s, smtpUser: v }))}
          />
          <Field
            id="smtpPass"
            label="SMTP Password"
            value={settings.smtpPass ?? ''}
            onChange={(v) => setSettings((s) => ({ ...s, smtpPass: v }))}
            type="password"
            placeholder="Leave blank to keep existing"
          />
          <Field
            id="smtpFromAddress"
            label="From Address"
            value={settings.smtpFromAddress ?? ''}
            onChange={(v) => setSettings((s) => ({ ...s, smtpFromAddress: v }))}
            placeholder="noreply@city.gov"
          />
          <Field
            id="smtpFromName"
            label="From Name"
            value={settings.smtpFromName ?? ''}
            onChange={(v) => setSettings((s) => ({ ...s, smtpFromName: v }))}
            placeholder="uReport"
          />
          <div className="flex items-center gap-3">
            <Switch
              id="smtpTls"
              checked={settings.smtpTls ?? false}
              onCheckedChange={(v) => setSettings((s) => ({ ...s, smtpTls: v }))}
            />
            <Label htmlFor="smtpTls">Use STARTTLS</Label>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-base font-semibold">Digest Email</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch
              id="digestEnabled"
              checked={settings.digestEnabled ?? false}
              onCheckedChange={(v) => setSettings((s) => ({ ...s, digestEnabled: v }))}
            />
            <Label htmlFor="digestEnabled">Enable daily digest emails</Label>
          </div>
          {settings.digestEnabled && (
            <Field
              id="digestSchedule"
              label="Digest Schedule (cron or named)"
              value={settings.digestSchedule ?? 'daily_7am'}
              onChange={(v) => setSettings((s) => ({ ...s, digestSchedule: v }))}
              placeholder="daily_7am"
              helpText="Supported: daily_7am, daily_8am, or a cron expression"
            />
          )}
        </div>
      </section>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save Settings'}
      </Button>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  helpText,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  helpText?: string;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1"
      />
      {helpText && <p className="mt-1 text-xs text-muted-foreground">{helpText}</p>}
    </div>
  );
}
