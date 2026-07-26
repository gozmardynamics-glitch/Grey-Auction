'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button, Switch } from '@/shared/components/common';
import { defaultPreferences } from '../../../models/data';

export default function SettingsNotifications() {
  const [preferences, setPreferences] = useState(defaultPreferences);

  const toggle = (index: number) => {
    setPreferences((prev) =>
      prev.map((p, i) =>
        i === index ? { ...p, enabled: !p.enabled } : p
      )
    );
  };

  const onSave = async () => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      await fetch(`${apiBase}/settings/notifications`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences }),
      });
      toast.success('Notification preferences saved.');
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
      toast.error('Failed to save notification preferences.');
    }
  };

  return (
    <div className="space-y-5 w-full sm:w-[50%]">
      <div className="space-y-4">
        {preferences.map((pref, i) => (
          <div
            key={pref.key}
            className="flex items-center justify-between py-1"
          >
            <span className="text-sm">{pref.label}</span>
            <Switch
              checked={pref.enabled}
              onCheckedChange={() => toggle(i)}
            />
          </div>
        ))}
      </div>

      <Button onClick={onSave}>Save Changes</Button>
    </div>
  );
}
