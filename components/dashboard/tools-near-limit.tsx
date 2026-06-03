import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge }    from '@/components/ui/badge';

interface Tool { id: string; name: string; usagePct: number; }

export function ToolsNearLimit({ tools }: { tools: Tool[] }) {
  if (tools.length === 0) return null;
  return (
    <Card>
      <CardHeader><CardTitle>Near Limit</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {tools.map(t => (
          <div key={t.id}>
            <div className="flex justify-between text-sm mb-1">
              <span>{t.name}</span>
              <Badge variant={t.usagePct >= 90 ? 'destructive' : 'secondary'}>{t.usagePct}%</Badge>
            </div>
            <Progress value={t.usagePct} className="h-1.5" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
