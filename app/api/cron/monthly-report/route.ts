import { NextRequest, NextResponse }   from 'next/server';
import { db }                          from '@/lib/db';
import { organizations, connectedTools, usageSnapshots, monthlyReports } from '@/lib/db/schema';
import { eq, and, gte, lte, desc }     from 'drizzle-orm';
import { assembleReportData }          from '@/lib/reports/generate';
import { MonthlyReportPDF }            from '@/lib/reports/pdf';
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer';
import { put }                         from '@vercel/blob';
import React                           from 'react';

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) throw new Error('CRON_SECRET environment variable is not set');
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const now = new Date();
  const prevMonth   = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const periodStart = prevMonth.toISOString().slice(0, 10);
  const periodEnd   = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);

  const orgs = await db.select().from(organizations);

  for (const org of orgs) {
    const tools = await db.select().from(connectedTools)
      .where(eq(connectedTools.organizationId, org.id));

    const snapshots = (await Promise.all(tools.map(async tool => {
      const snaps = await db.select().from(usageSnapshots)
        .where(and(
          eq(usageSnapshots.connectedToolId, tool.id),
          gte(usageSnapshots.periodStart, periodStart),
          lte(usageSnapshots.periodEnd,   periodEnd),
        ))
        .orderBy(desc(usageSnapshots.recordedAt))
        .limit(1);
      const snap = snaps[0];
      if (!snap) return null;
      return {
        toolId:      tool.id,
        toolName:    tool.displayName,
        category:    tool.category,
        costToDate:  snap.costToDate,
        creditsUsed: snap.creditsUsed,
        creditLimit: tool.creditLimit,
      };
    }))).filter((s): s is NonNullable<typeof s> => s !== null);

    const reportData = assembleReportData(snapshots);

    const inserted = await db.insert(monthlyReports).values({
      organizationId: org.id,
      periodStart,
      periodEnd,
      totalSpend:  reportData.totalSpend.toString(),
      reportData,
      status:      'generating',
    }).returning();
    const report = inserted[0];

    // Generate PDF
    try {
      const element = React.createElement(MonthlyReportPDF, {
        orgName:     org.name,
        periodStart,
        periodEnd,
        data:        reportData,
      }) as React.ReactElement<DocumentProps>;
      const buffer = await renderToBuffer(element);
      const blob = await put(`reports/${org.id}/${report.id}.pdf`, buffer, { access: 'private' });
      await db.update(monthlyReports)
        .set({ pdfUrl: blob.url, status: 'ready' })
        .where(eq(monthlyReports.id, report.id));
    } catch (err) {
      console.error('PDF generation failed for org', org.id, err);
      await db.update(monthlyReports)
        .set({ status: 'pdf_failed' })
        .where(eq(monthlyReports.id, report.id));
    }
  }

  return NextResponse.json({ generated: orgs.length });
}
