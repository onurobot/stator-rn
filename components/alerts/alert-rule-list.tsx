'use client';
import { useTransition }                          from 'react';
import { useRouter }                              from 'next/navigation';
import { Badge }                                  from '@/components/ui/badge';
import { Button }                                 from '@/components/ui/button';
import { deleteAlertRule, toggleAlertRule }       from '@/actions/alerts';

interface Rule {
  id:               string;
  toolName:         string;
  triggerType:      string;
  thresholdPercent: number | null;
  unusedDays:       number | null;
  channels:         string[];
  active:           boolean;
  lastFiredAt:      Date | string | null;
}

function describeRule(r: Rule): string {
  if (r.triggerType === 'threshold_high') return `Usage ≥ ${r.thresholdPercent}%`;
  if (r.triggerType === 'threshold_low')  return `Usage < ${r.thresholdPercent}%`;
  return `Unused for ${r.unusedDays} days`;
}

export function AlertRuleList({ rules }: { rules: Rule[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (rules.length === 0) {
    return <p className="text-muted-foreground text-sm">No alert rules yet.</p>;
  }

  return (
    <div className="space-y-2">
      {rules.map(rule => (
        <div key={rule.id} className="flex items-center justify-between border rounded-lg p-3 text-sm">
          <div>
            <p className="font-medium">{rule.toolName}</p>
            <p className="text-muted-foreground">{describeRule(rule)} · {rule.channels.join(', ')}</p>
            {rule.lastFiredAt && (
              <p className="text-xs text-muted-foreground">
                Last fired: {new Date(rule.lastFiredAt).toLocaleString()}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={rule.active ? 'default' : 'secondary'}>
              {rule.active ? 'Active' : 'Paused'}
            </Badge>
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => startTransition(async () => {
                await toggleAlertRule(rule.id, !rule.active);
                router.refresh();
              })}
            >
              {rule.active ? 'Pause' : 'Resume'}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={pending}
              onClick={() => startTransition(async () => {
                await deleteAlertRule(rule.id);
                router.refresh();
              })}
            >
              Delete
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
