"use client";
import { useState } from "react";
import { Icon } from "./icons";
import * as D from "./data";
import { Badge, Panel, SectionLabel, Button, IconButton, PageHeader } from "./components";

export function ReportsScreen({ toast }: { toast: (msg: string, tone?: string, icon?: string) => void }) {
  const [openId, setOpenId] = useState<string | null>(null);
  if (openId) {
    const rep = D.REPORTS.find(r => r.id === openId);
    if (rep) return <ReportDetail report={rep} onBack={() => setOpenId(null)} toast={toast} />;
  }
  const current = { label: "June 2026", spend: 1325.40 };
  return (
    <div className="anim-fade">
      <PageHeader title="Reports" sub="Auto-generated on the 1st of each month · 12-month history on Team"
        actions={<Button variant="default" size="sm" icon="download" onClick={() => toast("Exporting May 2026 as PDF…", "accent", "download")}>Export latest</Button>} />

      <Panel style={{ marginBottom: "var(--gap)", display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ width: 42, height: 42, borderRadius: 11, display: "grid", placeItems: "center", background: "var(--accent-soft)", color: "var(--accent-text)" }}><Icon name="calendar" size={20} /></div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{current.label}</span>
            <Badge tone="accent" icon="pulse" size="sm">In progress</Badge>
          </div>
          <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 2 }}>Closes Jun 30 · report generates automatically Jul 1</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="mono tnum" style={{ fontSize: 22, fontWeight: 600 }}>{D.fmtMoney(current.spend, 0)}</div>
          <div style={{ fontSize: 11, color: "var(--text-faint)" }}>spend to date</div>
        </div>
      </Panel>

      <SectionLabel>History</SectionLabel>
      <Panel pad={false} style={{ overflow: "hidden" }}>
        {D.REPORTS.map((r, i) => (
          <div key={r.id} onClick={() => setOpenId(r.id)} className="stator-trow"
            style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 16px", borderBottom: i < D.REPORTS.length - 1 ? "1px solid var(--stator-border)" : "none", cursor: "pointer" }}>
            <div style={{ width: 36, height: 44, borderRadius: 5, flexShrink: 0, background: "var(--panel-2)", border: "1px solid var(--stator-border-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="report" size={15} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{r.label}</div>
              <div style={{ fontSize: 11.5, color: "var(--text-faint)" }}>{r.toolCount} tools · top spend {D.CATEGORIES[r.topCategory]?.short} · generated {D.fmtDate(r.generatedAt.slice(0, 10))}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 70, justifyContent: "flex-end" }}>
              <Icon name={r.momChange >= 0 ? "arrowUp" : "arrowDown"} size={13} style={{ color: r.momChange >= 0 ? "var(--danger)" : "var(--success)" }} />
              <span className="mono" style={{ fontSize: 12, color: r.momChange >= 0 ? "var(--danger)" : "var(--success)" }}>{Math.abs(Math.round(r.momChange * 100))}%</span>
            </div>
            <div className="mono tnum" style={{ fontSize: 14, fontWeight: 600, minWidth: 90, textAlign: "right" }}>{D.fmtMoney(r.totalSpend, 0)}</div>
            <Badge tone="success" icon="checkCircle" size="sm">Ready</Badge>
            <IconButton name="download" size={30} iconSize={15} onClick={e => { e.stopPropagation(); toast(`Exporting ${r.label} as PDF…`, "accent", "download"); }} title="Download PDF" />
          </div>
        ))}
      </Panel>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, padding: "11px 14px", borderRadius: 8, background: "var(--panel-2)", fontSize: 12, color: "var(--text-faint)" }}>
        <Icon name="info" size={14} /> Free plan keeps the current month only. Team retains 12 months of history with PDF export.
      </div>
    </div>
  );
}

function ReportDetail({ report, onBack, toast }: { report: D.Report; onBack: () => void; toast: (msg: string, tone?: string, icon?: string) => void }) {
  const stats = D.dashboardStats();
  const scale = report.totalSpend / stats.totalSpend;
  const rows = D.TOOLS.map(t => ({ ...t, spend: t.costToDate * scale })).sort((a, b) => b.spend - a.spend).slice(0, 10);
  const byCat: Record<string, number> = {};
  D.TOOLS.forEach(t => { byCat[t.category] = (byCat[t.category] || 0) + t.costToDate * scale; });
  const unused = D.TOOLS.filter(t => t.lastUsedDaysAgo >= 7).slice(0, 3);
  const ink = "#1a1c22", inkDim = "#6b7080", line = "#e6e7eb", paper = "#ffffff";

  return (
    <div className="anim-fade">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <button onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, color: "var(--text-dim)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
          <Icon name="chevLeft" size={15} /> All reports
        </button>
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="default" size="sm" icon="copy" onClick={() => toast("Share link copied", "success", "link")}>Share</Button>
          <Button variant="primary" size="sm" icon="download" onClick={() => toast(`Generating ${report.label} PDF…`, "accent", "download")}>Download PDF</Button>
        </div>
      </div>

      <div style={{ display: "grid", placeItems: "start center", padding: "8px 0 40px" }}>
        <div style={{ width: 720, maxWidth: "100%", background: paper, color: ink, borderRadius: 6, boxShadow: "var(--shadow-lg)", overflow: "hidden", fontFamily: "var(--font-sans)" }}>
          <div style={{ padding: "30px 40px 22px", borderBottom: `2px solid ${ink}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: ink, display: "grid", placeItems: "center" }}><div style={{ width: 9, height: 9, borderRadius: 2, background: paper }} /></div>
                  <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: "-0.01em" }}>Stator</span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>AI Tools Cost Report</div>
                <div style={{ fontSize: 13, color: inkDim, marginTop: 3 }}>{D.ORG.name} · {report.label}</div>
              </div>
              <div style={{ textAlign: "right", fontSize: 11, color: inkDim, fontFamily: "var(--font-mono)" }}>
                <div>{D.fmtDate(report.periodStart)} – {D.fmtDate(report.periodEnd)}</div>
                <div style={{ marginTop: 2 }}>Generated {D.fmtDate(report.generatedAt.slice(0, 10))}</div>
                <div style={{ marginTop: 2 }}>{report.id.toUpperCase()}</div>
              </div>
            </div>
          </div>

          <div style={{ padding: "26px 40px 36px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18, marginBottom: 30 }}>
              {([["Total spend", D.fmtMoney(report.totalSpend, 0), `${report.momChange >= 0 ? "+" : ""}${Math.round(report.momChange * 100)}% vs prior`, report.momChange >= 0 ? "#c0392b" : "#1f8a5b"],
                ["Tools tracked", String(report.toolCount), "active in period", inkDim],
                ["Top category", D.CATEGORIES[report.topCategory]?.short || "—", "highest spend", inkDim]] as [string, string, string, string][]).map(([l, v, s, sc]) => (
                <div key={l}>
                  <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.06em", color: inkDim, fontWeight: 600 }}>{l}</div>
                  <div style={{ fontSize: 26, fontWeight: 700, fontFamily: "var(--font-mono)", marginTop: 5, letterSpacing: "-0.02em" }}>{v}</div>
                  <div style={{ fontSize: 11, color: sc, marginTop: 2 }}>{s}</div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 30 }}>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700, color: ink, marginBottom: 12 }}>Spend trend</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 14, height: 96, paddingTop: 10 }}>
                {D.SPEND_TREND.slice(0, 6).map((d, i) => {
                  const max = Math.max(...D.SPEND_TREND.map(x => x.spend));
                  const isThis = d.spend === report.totalSpend;
                  return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      <div style={{ width: "100%", maxWidth: 46, height: (d.spend / max) * 76, background: isThis ? ink : "#d6d8de", borderRadius: "3px 3px 0 0" }} />
                      <div style={{ fontSize: 10, color: isThis ? ink : inkDim, fontWeight: isThis ? 700 : 400, fontFamily: "var(--font-mono)" }}>{d.month}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ marginBottom: 30 }}>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700, color: ink, marginBottom: 12 }}>Per-tool breakdown</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${ink}` }}>
                    {["Tool", "Category", "Usage", "Spend"].map((h, i) => <th key={h} style={{ textAlign: i >= 2 ? "right" : "left", padding: "7px 4px", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", color: inkDim }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(t => (
                    <tr key={t.id} style={{ borderBottom: `1px solid ${line}` }}>
                      <td style={{ padding: "7px 4px", fontWeight: 600 }}>{t.name}</td>
                      <td style={{ padding: "7px 4px", color: inkDim }}>{D.CATEGORIES[t.category]?.short}</td>
                      <td style={{ padding: "7px 4px", textAlign: "right", fontFamily: "var(--font-mono)", color: inkDim }}>{D.usagePct(t) != null ? D.usagePct(t) + "%" : "—"}</td>
                      <td style={{ padding: "7px 4px", textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 600 }}>{D.fmtMoney(t.spend, 0)}</td>
                    </tr>
                  ))}
                  <tr style={{ borderTop: `2px solid ${ink}` }}>
                    <td colSpan={3} style={{ padding: "8px 4px", fontWeight: 700 }}>Total</td>
                    <td style={{ padding: "8px 4px", textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 700 }}>{D.fmtMoney(report.totalSpend, 0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30 }}>
              <div>
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700, color: ink, marginBottom: 12 }}>By category</div>
                {Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([c, v]) => (
                  <div key={c} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${line}`, fontSize: 12 }}>
                    <span>{D.CATEGORIES[c as D.Category]?.short}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{D.fmtMoney(v, 0)}</span>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700, color: ink, marginBottom: 12 }}>Unused / underused</div>
                {unused.map(t => (
                  <div key={t.id} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${line}`, fontSize: 12 }}>
                    <span>{t.name}</span>
                    <span style={{ color: inkDim, fontFamily: "var(--font-mono)" }}>{t.lastUsedDaysAgo}d idle</span>
                  </div>
                ))}
                <div style={{ fontSize: 11, color: inkDim, marginTop: 8 }}>Cutting these {unused.length} tools saves ~{D.fmtMoney(unused.reduce((s, t) => s + t.costToDate, 0), 0)}/mo.</div>
              </div>
            </div>
          </div>

          <div style={{ padding: "14px 40px", borderTop: `1px solid ${line}`, display: "flex", justifyContent: "space-between", fontSize: 10, color: inkDim, fontFamily: "var(--font-mono)" }}>
            <span>Generated by Stator · stator.app</span>
            <span>{D.ORG.name} · Confidential</span>
          </div>
        </div>
      </div>
    </div>
  );
}
