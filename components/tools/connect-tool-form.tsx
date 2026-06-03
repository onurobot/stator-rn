'use client';
import { useTransition } from 'react';
import { useRouter }     from 'next/navigation';
import { useState }      from 'react';
import { Button }  from '@/components/ui/button';
import { Input }   from '@/components/ui/input';
import { Label }   from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createTool } from '@/actions/tools';
import { CATALOG }    from '@/lib/integrations/registry';

export function ConnectToolForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selectedSlug, setSelectedSlug] = useState('');

  const isManual = selectedSlug === 'custom' || selectedSlug === 'midjourney';

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd       = new FormData(e.currentTarget);
    const toolSlug = fd.get('toolSlug') as string;
    const catalog  = CATALOG.find(t => t.slug === toolSlug);

    startTransition(async () => {
      await createTool({
        toolSlug:        toolSlug === 'custom' ? (fd.get('customSlug') as string || 'custom') : toolSlug,
        displayName:     (fd.get('displayName') as string) || catalog?.displayName || toolSlug,
        category:        (catalog?.category ?? (fd.get('category') as any)) || 'text',
        syncType:        isManual ? 'manual' : 'api',
        apiKey:          (fd.get('apiKey') as string) || undefined,
        billingType:     (fd.get('billingType') as any) || 'subscription',
        planMonthlyCost: fd.get('planMonthlyCost') ? Number(fd.get('planMonthlyCost')) : undefined,
        creditLimit:     fd.get('creditLimit') ? Number(fd.get('creditLimit')) : undefined,
        renewalDate:     (fd.get('renewalDate') as string) || undefined,
      });
      router.push('/tools');
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div>
        <Label htmlFor="toolSlug">Tool</Label>
        <Select name="toolSlug" required onValueChange={(v) => setSelectedSlug((v as string) ?? '')}>
          <SelectTrigger><SelectValue placeholder="Select a tool" /></SelectTrigger>
          <SelectContent>
            {CATALOG.map(t => <SelectItem key={t.slug} value={t.slug}>{t.displayName}</SelectItem>)}
            <SelectItem value="custom">Custom tool…</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="displayName">Display Name</Label>
        <Input name="displayName" placeholder="My OpenAI account" />
      </div>
      {!isManual && (
        <div>
          <Label htmlFor="apiKey">API Key</Label>
          <Input name="apiKey" type="password" placeholder="sk-…" />
        </div>
      )}
      <div>
        <Label htmlFor="billingType">Billing Type</Label>
        <Select name="billingType" required>
          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="subscription">Subscription</SelectItem>
            <SelectItem value="credits">Credits</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="planMonthlyCost">Monthly Cost ($)</Label>
        <Input name="planMonthlyCost" type="number" step="0.01" placeholder="20.00" />
      </div>
      <div>
        <Label htmlFor="creditLimit">Credit Limit</Label>
        <Input name="creditLimit" type="number" placeholder="1000" />
      </div>
      <div>
        <Label htmlFor="renewalDate">Renewal Date</Label>
        <Input name="renewalDate" type="date" />
      </div>
      <Button type="submit" disabled={pending || !selectedSlug}>
        {pending ? 'Connecting…' : 'Connect Tool'}
      </Button>
    </form>
  );
}
