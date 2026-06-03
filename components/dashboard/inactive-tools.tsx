import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Tool { id: string; name: string; daysSinceUse: number; }

export function InactiveTools({ tools }: { tools: Tool[] }) {
  if (tools.length === 0) return null;
  return (
    <Card>
      <CardHeader><CardTitle>Inactive Tools</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {tools.map(t => (
          <div key={t.id} className="flex justify-between items-center text-sm">
            <span>{t.name}</span>
            <Badge variant="outline">{t.daysSinceUse}d idle</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
