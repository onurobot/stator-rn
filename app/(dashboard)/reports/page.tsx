import { db }           from '@/lib/db';
import { auth }         from '@clerk/nextjs/server';
import { monthlyReports, users, organizations } from '@/lib/db/schema';
import { eq, desc }     from 'drizzle-orm';
import { redirect }     from 'next/navigation';
import { canExportPdf } from '@/lib/stripe';
import { ReportCard }   from '@/components/reports/report-card';

export default async function ReportsPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const userRows = await db
    .select({
      organizationId: users.organizationId,
      plan:           organizations.plan,
    })
    .from(users)
    .innerJoin(organizations, eq(users.organizationId, organizations.id))
    .where(eq(users.clerkId, userId))
    .limit(1);
  if (!userRows[0]) redirect('/sign-in');

  const { organizationId: orgId, plan } = userRows[0];

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
