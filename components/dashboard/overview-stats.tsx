import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  totalSpend:   number;
  toolsCount:   number;
  nearLimit:    number;
  inactive:     number;
}

export function OverviewStats({ totalSpend, toolsCount, nearLimit, inactive }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-1"><CardTitle className="text-sm text-muted-foreground">Monthly Spend</CardTitle></CardHeader>
        <CardContent><p className="text-2xl font-bold">${totalSpend.toFixed(2)}</p></CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-1"><CardTitle className="text-sm text-muted-foreground">Tools Tracked</CardTitle></CardHeader>
        <CardContent><p className="text-2xl font-bold">{toolsCount}</p></CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-1"><CardTitle className="text-sm text-muted-foreground">Near Limit</CardTitle></CardHeader>
        <CardContent><p className="text-2xl font-bold text-orange-500">{nearLimit}</p></CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-1"><CardTitle className="text-sm text-muted-foreground">Inactive Tools</CardTitle></CardHeader>
        <CardContent><p className="text-2xl font-bold text-muted-foreground">{inactive}</p></CardContent>
      </Card>
    </div>
  );
}
