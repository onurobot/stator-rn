'use client';
import { useTransition }   from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge }           from '@/components/ui/badge';
import { Button }          from '@/components/ui/button';
import { exportReportPdf } from '@/actions/reports';

interface Props {
  id:          string;
  periodStart: string;
  periodEnd:   string;
  totalSpend:  number;
  status:      string;
  pdfUrl:      string | null;
  canExport:   boolean;
}

export function ReportCard({ id, periodStart, periodEnd, totalSpend, status, pdfUrl, canExport }: Props) {
  const [pending, startTransition] = useTransition();

  function handleExport() {
    startTransition(async () => {
      const { url } = await exportReportPdf(id);
      window.open(url, '_blank');
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">{periodStart} → {periodEnd}</CardTitle>
        <Badge variant={status === 'ready' ? 'default' : 'secondary'}>{status}</Badge>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <p className="text-xl font-bold">${totalSpend.toFixed(2)}</p>
        <div className="flex gap-2">
          {pdfUrl && (
            <Button size="sm" variant="outline" onClick={() => window.open(pdfUrl, '_blank')}>
              View PDF
            </Button>
          )}
          {!pdfUrl && canExport && (
            <Button size="sm" variant="outline" disabled={pending} onClick={handleExport}>
              {pending ? 'Generating…' : 'Export PDF'}
            </Button>
          )}
          {!canExport && (
            <span className="text-xs text-muted-foreground">Pro required for PDF</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
