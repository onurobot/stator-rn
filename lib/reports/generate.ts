export interface ToolSnapshot {
  toolId:      string;
  toolName:    string;
  category:    string;
  costToDate:  string;
  creditsUsed: number | null;
  creditLimit: number | null;
}

export interface ReportData {
  totalSpend: number;
  byCategory: Record<string, number>;
  tools: Array<{
    toolId:       string;
    toolName:     string;
    category:     string;
    spend:        number;
    usagePercent: number | null;
  }>;
}

export function assembleReportData(snapshots: ToolSnapshot[]): ReportData {
  let totalSpend = 0;
  const byCategory: Record<string, number> = {};
  const tools = snapshots.map(s => {
    const spend = parseFloat(s.costToDate);
    totalSpend += spend;
    byCategory[s.category] = (byCategory[s.category] ?? 0) + spend;
    const usagePercent =
      s.creditsUsed !== null && s.creditLimit
        ? Math.round((s.creditsUsed / s.creditLimit) * 100)
        : null;
    return { toolId: s.toolId, toolName: s.toolName, category: s.category, spend, usagePercent };
  });
  return { totalSpend, byCategory, tools };
}
