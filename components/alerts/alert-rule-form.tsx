'use client';
import { useTransition, useState } from 'react';
import { useRouter }               from 'next/navigation';
import { Button }   from '@/components/ui/button';
import { Label }    from '@/components/ui/label';
import { Input }    from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createAlertRule } from '@/actions/alerts';

interface Tool { id: string; displayName: string; }

export function AlertRuleForm({ tools }: { tools: Tool[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [triggerType, setTriggerType] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const channels: string[] = [];
    if (fd.get('channel_email'))    channels.push('email');
    if (fd.get('channel_whatsapp')) channels.push('whatsapp');

    startTransition(async () => {
      await createAlertRule({
        connectedToolId:  fd.get('toolId') as string,
        triggerType:      fd.get('triggerType') as 'threshold_high' | 'threshold_low' | 'unused',
        thresholdPercent: fd.get('thresholdPercent') ? Number(fd.get('thresholdPercent')) : undefined,
        unusedDays:       fd.get('unusedDays')        ? Number(fd.get('unusedDays'))        : undefined,
        channels,
        cooldownHours:    fd.get('cooldownHours')     ? Number(fd.get('cooldownHours'))     : 24,
      });
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md border rounded-lg p-4">
      <h3 className="font-semibold">New Alert Rule</h3>
      <div>
        <Label>Tool</Label>
        <Select name="toolId" required>
          <SelectTrigger><SelectValue placeholder="Select tool" /></SelectTrigger>
          <SelectContent>
            {tools.map(t => <SelectItem key={t.id} value={t.id}>{t.displayName}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Trigger</Label>
        <Select name="triggerType" required onValueChange={(val: string | null) => setTriggerType(val ?? '')}>
          <SelectTrigger><SelectValue placeholder="Select trigger" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="threshold_high">Usage above %</SelectItem>
            <SelectItem value="threshold_low">Usage below %</SelectItem>
            <SelectItem value="unused">Unused for N days</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {(triggerType === 'threshold_high' || triggerType === 'threshold_low') && (
        <div>
          <Label>Threshold %</Label>
          <Input name="thresholdPercent" type="number" min={1} max={100} placeholder="80" />
        </div>
      )}
      {triggerType === 'unused' && (
        <div>
          <Label>Unused days</Label>
          <Input name="unusedDays" type="number" min={1} placeholder="7" />
        </div>
      )}
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="channel_email" defaultChecked /> Email
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="channel_whatsapp" /> WhatsApp
        </label>
      </div>
      <div>
        <Label>Cooldown (hours)</Label>
        <Input name="cooldownHours" type="number" min={1} defaultValue={24} />
      </div>
      <Button type="submit" disabled={pending || !triggerType}>
        {pending ? 'Saving…' : 'Add Rule'}
      </Button>
    </form>
  );
}
