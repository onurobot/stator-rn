"use client";
import { useState } from "react";
import { Icon } from "./icons";
import * as D from "./data";
import { ToolMark, Badge, CategoryDot, UsageBar, Panel, SectionLabel, AreaChart, CategoryBars, Donut, KPI, ToolCard, PageHeader, Button, Segmented } from "./components";

function AttentionRow({ tool, kind, onOpen }: { tool: D.Tool; kind: "near" | "inactive" | "error"; onOpen: (id: string) => void; }) {
  const [hov, setHov] = useState(false);
  const pct = D.usagePct(tool);
  const meta = {
    near:     { tone: pct && pct >= 90 ? "var(--danger)" : "var(--warning)", text: `${pct}% used`,     hint: `${D.fmtNum(D.creditsRemaining(tool))} ${tool.unit} left` },
    inactive: { tone: "var(--text-faint)", text: `${tool.lastUsedDaysAgo}d idle`,                        hint: `${D.fmtMoney(tool.costToDate, 0)}/mo wasted` },
    error:    { tone: "var(--danger)",     text: tool.syncStatus === "never_synced" ? "Never synced" : "Sync failed", hint: tool.syncStatus === "never_synced" ? "Add API key to start" : "Last ok " + (D.relTime(tool.lastSyncedAt) || "—") },
  }[kind];
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onClick={() => onOpen(tool.id)}
      style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 10px", borderRadius: 7, cursor: "pointer", background: hov ? "var(--hover)" : "transparent", transition: "background .1s" }}>
      <ToolMark tool={tool} size={28} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 500 }}>{tool.name}</div>
        <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{meta.hint}</div>
      </div>
      {kind === "near" && <div style={{ width: 54 }}><UsageBar pct={pct} state={D.usageState(tool)} height={5} /></div>}
      <span className="mono" style={{ fontSize: 11.5, fontWeight: 600, color: meta.tone, minWidth: 64, textAlign: "right" }}>{meta.text}</span>
      <span style={{ color: hov ? "var(--text-dim)" : "var(--text-faint)", opacity: hov ? 1 : 0.5 }}><Icon name="chevRight" size={15} /></span>
    </div>
  );
}

interface DashboardProps { onOpenTool: (id: string) => void; onNav: (route: string) => void; toast: (msg: string, tone?: string, icon?: string) => void; }

export function Dashboard({ onOpenTool, onNav, toast }: DashboardProps) {
  const stats = D.dashboardStats();
  const [tab, setTab] = useState<"near" | "inactive" | "error">("near");
  const [catFilter, setCatFilter] = useState("all");

  const attnTabs = [
    { value: "near",     label: "Near limit",  count: stats.nearLimit.length, tone: "warning" },
    { value: "inactive", label: "Inactive",    count: stats.inactive.length,  tone: "neutral" },
    { value: "error",    label: "Sync issues", count: stats.errors.length,    tone: "danger" },
  ];
  const attnList = tab === "near" ? stats.nearLimit : tab === "inactive" ? stats.inactive : stats.errors;
  const cats = ["all", ...Object.keys(D.CATEGORIES)];
  const tools = catFilter === "all" ? D.TOOLS : D.TOOLS.filter(t => t.category === catFilter);
  const donutSegs = Object.entries(stats.byCat).filter(([, v]) => v > 0).map(([c, v]) => ({ value: v, color: D.CATEGORIES[c as D.Category].color }));

  return (
    <div className="anim-fade">
      <PageHeader title="Overview"
        sub={`${D.TOOLS.length} tools tracked · billing period to date · synced ${D.relTime("2026-06-02T13:00:00Z")}`}
        actions={<>
          <Segmented size="sm" value="month" onChange={() => {}} options={[{ value: "month", label: "This period" }, { value: "30d", label: "30d" }]} />
          <Button variant="default" icon="refresh" size="sm" onClick={() => toast("Syncing 9 API tools…", "accent", "refresh")}>Sync</Button>
          <Button variant="primary" icon="plus" size="sm" onClick={() => onNav("add")}>Add tool</Button>
        </>} />

      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--gap)", marginBottom: "var(--gap)" }}>
        <KPI label="Period spend" value={D.fmtMoney(stats.totalSpend, 0)} delta={0.14} deltaInvert sub="across 13 tools" icon="dollar" accent="var(--accent)" />
        <KPI label="Projected" value={D.fmtMoney(stats.projected, 0)} sub="at current run rate" icon="trend" accent="var(--warning)" />
        <KPI label="Near limit" value={stats.nearLimit.length} sub={`${stats.inactive.length} idle · ${stats.errors.length} sync issues`} icon="alert" accent="var(--danger)" />
        <KPI label="Alerts · 7d" value="7" sub="1 WhatsApp fallback" icon="bell" accent="var(--violet)" />
      </div>

      {/* charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: "var(--gap)", marginBottom: "var(--gap)" }}>
        <Panel>
          <SectionLabel right={<Badge tone="success" icon="trend">+19% vs Apr</Badge>}>Monthly spend trend</SectionLabel>
          <AreaChart data={D.SPEND_TREND} h={190} />
        </Panel>
        <Panel>
          <SectionLabel right={<button onClick={() => onNav("reports")} style={{ fontSize: 11.5, color: "var(--accent-text)", background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 3 }}>Report <Icon name="arrowRight" size={12} /></button>}>Spend by category</SectionLabel>
          <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 14 }}>
            <Donut segments={donutSegs} size={104} thickness={14}
              center={<div><div className="mono tnum" style={{ fontSize: 17, fontWeight: 600 }}>{D.fmtMoney(stats.totalSpend, 0)}</div><div style={{ fontSize: 10, color: "var(--text-faint)" }}>total</div></div>} />
            <div style={{ flex: 1 }}><CategoryBars byCat={stats.byCat} total={stats.totalSpend} /></div>
          </div>
        </Panel>
      </div>

      {/* attention */}
      <Panel style={{ marginBottom: "var(--gap)" }} pad={false}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "var(--warning)" }}><Icon name="zap" size={16} /></span>
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>Needs attention</span>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {attnTabs.map(t => (
              <button key={t.value} onClick={() => setTab(t.value as "near" | "inactive" | "error")}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
                  background: tab === t.value ? "var(--panel-2)" : "transparent", color: tab === t.value ? "var(--text)" : "var(--text-dim)" }}>
                {t.label}
                <span className="mono" style={{ fontSize: 10.5, padding: "0px 5px", borderRadius: 20, background: tab === t.value ? `var(--${t.tone}-soft)` : "var(--bg-sunken)", color: tab === t.value ? `var(--${t.tone === "neutral" ? "text-dim" : t.tone})` : "var(--text-faint)" }}>{t.count}</span>
              </button>
            ))}
          </div>
        </div>
        <div style={{ padding: "8px 8px 10px" }}>
          {attnList.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", fontSize: 12.5, color: "var(--text-faint)" }}>All clear — nothing in this bucket.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 16px" }}>
              {attnList.map(t => <AttentionRow key={t.id} tool={t} kind={tab} onOpen={onOpenTool} />)}
            </div>
          )}
        </div>
      </Panel>

      {/* connected tools */}
      <SectionLabel right={
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {cats.map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 20, fontSize: 11.5, fontWeight: 500, border: "1px solid", cursor: "pointer", fontFamily: "inherit",
                borderColor: catFilter === c ? "transparent" : "var(--stator-border)", background: catFilter === c ? "var(--accent-soft)" : "transparent", color: catFilter === c ? "var(--accent-text)" : "var(--text-dim)" }}>
              {c !== "all" && <CategoryDot cat={c} size={6} />}
              {c === "all" ? "All tools" : D.CATEGORIES[c as D.Category]?.short}
            </button>
          ))}
        </div>
      }>Connected tools</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "var(--gap)" }}>
        {tools.map(t => <ToolCard key={t.id} tool={t} onClick={() => onOpenTool(t.id)} />)}
      </div>
    </div>
  );
}
