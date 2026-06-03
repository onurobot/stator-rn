'use server';
import { db }               from '@/lib/db';
import { monthlyReports, organizations, users } from '@/lib/db/schema';
import { auth }             from '@clerk/nextjs/server';
import { canExportPdf }     from '@/lib/stripe';
import { MonthlyReportPDF } from '@/lib/reports/pdf';
import { renderToBuffer }   from '@react-pdf/renderer';
import { put }              from '@vercel/blob';
import { eq, and }          from 'drizzle-orm';
import React                from 'react';
import type { DocumentProps } from '@react-pdf/renderer';

async function getCurrentContext() {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthenticated');
  const rows = await db
    .select({
      organizationId: users.organizationId,
      plan:           organizations.plan,
      orgName:        organizations.name,
    })
    .from(users)
    .innerJoin(organizations, eq(users.organizationId, organizations.id))
    .where(eq(users.clerkId, userId))
    .limit(1);
  if (!rows[0]) throw new Error('User not found');
  return rows[0];
}

export async function exportReportPdf(reportId: string): Promise<{ url: string }> {
  const ctx = await getCurrentContext();
  if (!canExportPdf(ctx.plan)) throw new Error('PDF export requires a Pro or Team plan.');

  const rows = await db.select().from(monthlyReports)
    .where(and(eq(monthlyReports.id, reportId), eq(monthlyReports.organizationId, ctx.organizationId)));
  const report = rows[0];
  if (!report) throw new Error('Report not found');

  // Return existing PDF if already generated
  if (report.pdfUrl) return { url: report.pdfUrl };

  const element = React.createElement(MonthlyReportPDF, {
    orgName:     ctx.orgName,
    periodStart: report.periodStart,
    periodEnd:   report.periodEnd,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data:        report.reportData as any,
  }) as React.ReactElement<DocumentProps>;

  const buffer = await renderToBuffer(element);

  const blob = await put(`reports/${ctx.organizationId}/${reportId}.pdf`, buffer, { access: 'private' });

  await db.update(monthlyReports)
    .set({ pdfUrl: blob.url, status: 'ready' })
    .where(eq(monthlyReports.id, reportId));

  return { url: blob.url };
}
