import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge }    from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface Props {
  id:               string;
  displayName:      string;
  category:         string;
  syncType:         string;
  syncStatus:       string;
  lastSyncedAt:     Date | string | null;
  creditsUsed:      number | null;
  creditsRemaining: number | null;
  creditLimit:      number | null;
  costToDate:       number;
  renewalDate:      string | null;
}

export function ToolCard(props: Props) {
  const pct = props.creditLimit && props.creditsUsed !== null
    ? Math.round((props.creditsUsed / props.creditLimit) * 100)
    : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">{props.displayName}</CardTitle>
        <div className="flex gap-1">
          <Badge variant="outline" className="capitalize">{props.category}</Badge>
          {props.syncType === 'manual' && <Badge variant="secondary">Manual</Badge>}
          {props.syncStatus === 'sync_error' && <Badge variant="destructive">Sync Error</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {pct !== null && (
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Usage</span>
              <span className="font-medium">{pct}%</span>
            </div>
            <Progress value={pct} className="h-1.5" />
            {props.creditsRemaining !== null && (
              <p className="text-xs text-muted-foreground mt-1">
                {props.creditsRemaining.toLocaleString()} remaining
              </p>
            )}
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Spend this period</span>
          <span className="font-medium">${props.costToDate.toFixed(2)}</span>
        </div>
        {props.renewalDate && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Renews</span>
            <span>{props.renewalDate}</span>
          </div>
        )}
        {props.lastSyncedAt && (
          <p className="text-xs text-muted-foreground">
            Last synced: {new Date(props.lastSyncedAt).toLocaleString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
