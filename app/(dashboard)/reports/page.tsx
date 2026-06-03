import { db }              from '@/lib/db';
import { getOrCreateUser } from '@/lib/ensure-user';
import { monthlyReports }  from '@/lib/db/schema';
import { eq, desc }        from 'drizzle-orm';
import { canExportPdf }    from '@/lib/stripe';
import { ReportCard }      from '@/components/reports/report-card';

export default async function ReportsPage() {
  const { orgId, plan } = await getOrCreateUser();

  const reports = await db.select().from(monthlyReports)
    .where(eq(monthlyReports.organizationId, orgId))
    .orderBy(desc(monthlyReports.periodStart));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reports</h1>
      {reports.length === 0 && (
        <p className="text-muted-foreground">
          No reports yet. Your first report will be generated automatically at the end of the month.
        </p>
      )}
      <div className="space-y-3">
        {reports.map(r => (
          <ReportCard
            key={r.id}
            id={r.id}
            periodStart={r.periodStart}
            periodEnd={r.periodEnd}
            totalSpend={parseFloat(r.totalSpend)}
            status={r.status}
            pdfUrl={r.pdfUrl}
            canExport={canExportPdf(plan)}
          />
        ))}
      </div>
    </div>
  );
}
