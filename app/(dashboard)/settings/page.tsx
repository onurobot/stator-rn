'use client';
import { useState, useTransition } from 'react';
import { Button }  from '@/components/ui/button';
import { Input }   from '@/components/ui/input';
import { Label }   from '@/components/ui/label';
import { updateWhatsAppSettings } from '@/actions/tools';

export default function SettingsPage() {
  const [phone, setPhone]               = useState('');
  const [optIn, setOptIn]               = useState(false);
  const [pending, startTransition]      = useTransition();
  const [saved, setSaved]               = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await updateWhatsAppSettings(phone, optIn);
      setSaved(true);
    });
  }

  return (
    <div className="space-y-6 max-w-md">
      <h1 className="text-2xl font-bold">Settings</h1>
      <form onSubmit={handleSave} className="space-y-4 border rounded-lg p-4">
        <h2 className="font-semibold">WhatsApp Notifications</h2>
        <div>
          <Label htmlFor="phone">Phone Number (with country code)</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+905001234567"
            value={phone}
            onChange={e => setPhone(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={optIn}
            onChange={e => setOptIn(e.target.checked)}
          />
          I agree to receive WhatsApp notifications from AI Tracker
        </label>
        <Button type="submit" disabled={pending || !phone || !optIn}>
          {pending ? 'Saving…' : 'Save'}
        </Button>
        {saved && <p className="text-sm text-green-600">Settings saved!</p>}
      </form>
    </div>
  );
}
