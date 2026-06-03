"use client";
import { useState } from "react";
import { Icon } from "./icons";
import * as D from "./data";
import { ToolMark, CategoryDot, Badge, StatusDot, Button, IconButton, Segmented, Panel, SectionLabel, UsageBar, Sparkline, Drawer, Field, TextInput, SelectInput, EmptyState, PageHeader, ToolCard, TRIGGER_META, inputStyle } from "./components";

function SyncPill({ tool }: { tool: D.Tool }) {
  if (tool.syncType === "manual")             return <Badge tone="neutral" icon="edit" size="sm">Manual</Badge>;
  if (tool.syncStatus === "ok")               return <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "var(--text-dim)" }}><StatusDot tone="ok" /> {D.relTime(tool.lastSyncedAt)}</span>;
  if (tool.syncStatus === "never_synced")     return <Badge tone="neutral" icon="clock" size="sm">Never synced</Badge>;
  return <Badge tone="danger" icon="alert" size="sm">Sync error</Badge>;
}

interface ToolsProps { onOpenTool: (id: string) => void; onNav: (r: string) => void; toast: (msg: string, tone?: string, icon?: string) => void; }

export function ToolsScreen({ onOpenTool, onNav, toast: _toast }: ToolsProps) {
  const [view, setView] = useState("table");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [sort, setSort] = useState("usage");

  let tools = D.TOOLS.filter(t => (cat === "all" || t.category === cat) && (q === "" || t.name.toLowerCase().includes(q.toLowerCase())));
  tools = [...tools].sort((a, b) => {
    if (sort === "usage")   return (D.usagePct(b) || 0) - (D.usagePct(a) || 0);
    if (sort === "cost")    return b.costToDate - a.costToDate;
    if (sort === "name")    return a.name.localeCompare(b.name);
    if (sort === "renewal") return D.daysUntil(a.renewalDate) - D.daysUntil(b.renewalDate);
    return 0;
  });

  return (
    <div className="anim-fade">
      <PageHeader title="Tools" sub={`${D.TOOLS.length} connected · Team plan · unlimited tools`}
        actions={<Button variant="primary" icon="plus" size="sm" onClick={() => onNav("add")}>Add tool</Button>} />

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200, maxWidth: 280 }}>
          <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "var(--text-faint)" }}><Icon name="search" size={14} /></span>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search tools…" style={{ ...inputStyle, paddingLeft: 30, padding: "7px 10px 7px 30px" }} />
        </div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", flex: 1 }}>
          {["all", ...Object.keys(D.CATEGORIES)].map(c => (
            <button key={c} onClick={() => setCat(c)}
              style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 9px", borderRadius: 20, fontSize: 11.5, fontWeight: 500, border: "1px solid", cursor: "pointer", fontFamily: "inherit",
                borderColor: cat === c ? "transparent" : "var(--stator-border)", background: cat === c ? "var(--accent-soft)" : "transparent", color: cat === c ? "var(--accent-text)" : "var(--text-dim)" }}>
              {c !== "all" && <CategoryDot cat={c} size={6} />}{c === "all" ? "All" : D.CATEGORIES[c as D.Category]?.short}
            </button>
          ))}
        </div>
        <SelectInput value={sort} onChange={setSort} style={{ width: 150 }}
          options={[{ value: "usage", label: "Sort: Usage %" }, { value: "cost", label: "Sort: Cost" }, { value: "renewal", label: "Sort: Renewal" }, { value: "name", label: "Sort: Name" }]} />
        <Segmented size="sm" value={view} onChange={v => setView(v as string)} options={[{ value: "table", label: "List" }, { value: "grid", label: "Grid" }]} />
      </div>

      {view === "grid" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "var(--gap)" }}>
          {tools.map(t => <ToolCard key={t.id} tool={t} onClick={() => onOpenTool(t.id)} />)}
        </div>
      ) : (
        <Panel pad={false} style={{ overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--stator-border)" }}>
                {["Tool", "Usage", "Cost / period", "Billing", "Renews", "Sync", "Alerts"].map((h, i) => (
                  <th key={h} style={{ textAlign: i >= 2 && i <= 4 ? "right" : "left", padding: "9px 14px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-faint)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tools.map(t => {
                const pct = D.usagePct(t), state = D.usageState(t);
                const rules = (D.RULE_BY_TOOL[t.id] || []).filter(r => r.active);
                const renew = D.daysUntil(t.renewalDate);
                return (
                  <tr key={t.id} onClick={() => onOpenTool(t.id)} className="stator-trow"
                    style={{ borderBottom: "1px solid var(--stator-border)", cursor: "pointer" }}>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <ToolMark tool={t} size={28} />
                        <div>
                          <div style={{ fontWeight: 500 }}>{t.name}</div>
                          <div style={{ fontSize: 11, color: "var(--text-faint)", display: "flex", alignItems: "center", gap: 4 }}><CategoryDot cat={t.category} size={6} />{D.CATEGORIES[t.category]?.short}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "10px 14px", minWidth: 150 }}>
                      {state === "error" ? <span style={{ color: "var(--danger)", fontSize: 11.5 }}>—</span> : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                            <span className="mono" style={{ color: "var(--text-faint)" }}>{D.fmtNum(t.creditsUsed)}/{D.fmtNum(t.creditLimit)}</span>
                            <span className="mono tnum" style={{ fontWeight: 600, color: state === "critical" ? "var(--danger)" : state === "warn" ? "var(--warning)" : "var(--text-dim)" }}>{pct}%</span>
                          </div>
                          <UsageBar pct={pct} state={state} height={4} />
                        </div>
                      )}
                    </td>
                    <td className="mono tnum" style={{ padding: "10px 14px", textAlign: "right", fontWeight: 500 }}>{D.fmtMoney(t.costToDate, 0)}</td>
                    <td style={{ padding: "10px 14px", textAlign: "right" }}><Badge tone={t.billingType === "subscription" ? "violet" : "accent"} size="sm">{t.billingType === "subscription" ? "Subscription" : "Credits"}</Badge></td>
                    <td className="mono" style={{ padding: "10px 14px", textAlign: "right", color: renew <= 5 ? "var(--warning)" : "var(--text-dim)", whiteSpace: "nowrap" }}>{renew <= 0 ? "today" : renew + "d"}</td>
                    <td style={{ padding: "10px 14px" }}><SyncPill tool={t} /></td>
                    <td style={{ padding: "10px 14px" }}>{rules.length > 0 ? <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, color: "var(--text-dim)" }}><Icon name="bell" size={12} />{rules.length}</span> : <span style={{ color: "var(--text-faint)" }}>—</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Panel>
      )}
    </div>
  );
}

interface AddToolProps { onNav: (r: string) => void; toast: (msg: string, tone?: string, icon?: string) => void; }

export function AddToolScreen({ onNav, toast }: AddToolProps) {
  const [step, setStep] = useState(1);
  const [picked, setPicked] = useState<D.CatalogTool | null>(null);
  const [form, setForm] = useState({ displayName: "", apiKey: "", category: "text", billingType: "subscription", planMonthlyCost: "", creditLimit: "", renewalDate: "", unit: "credits" });
  const [showKey, setShowKey] = useState(false);
  const [q, setQ] = useState("");

  const pick = (t: D.CatalogTool) => {
    setPicked(t);
    setForm(f => ({ ...f, displayName: t.isCustom ? "" : t.name, category: t.category, billingType: t.billingType }));
    setStep(2);
  };

  const isApi = picked && !picked.isCustom && picked.billingType === "credits";
  const finish = () => {
    setStep(3);
    setTimeout(() => { onNav("tools"); toast(`${form.displayName || picked?.name} connected`, "success", "checkCircle"); }, 2200);
  };

  const catalog = D.TOOL_CATALOG.filter(t => q === "" || t.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="anim-fade" style={{ maxWidth: 720, margin: "0 auto" }}>
      <button onClick={() => step > 1 ? setStep(1) : onNav("tools")} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, color: "var(--text-dim)", background: "none", border: "none", marginBottom: 14, cursor: "pointer", fontFamily: "inherit" }}>
        <Icon name="chevLeft" size={15} /> {step === 1 ? "Back to tools" : "Choose another tool"}
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 22 }}>
        {["Select tool", "Configure", "Connect"].map((s, i) => {
          const n = i + 1, done = step > n, on = step === n;
          return (
            <span key={s} style={{ display: "flex", alignItems: "center", gap: 7, flex: i < 2 ? "auto" : undefined }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 600, background: done ? "var(--accent)" : on ? "var(--accent-soft)" : "var(--panel-2)", color: done ? "#fff" : on ? "var(--accent-text)" : "var(--text-faint)", boxShadow: on ? "0 0 0 1px var(--accent)" : "none" }}>{done ? <Icon name="check" size={12} /> : n}</div>
                <span style={{ fontSize: 12.5, fontWeight: 500, color: on || done ? "var(--text)" : "var(--text-faint)" }}>{s}</span>
              </span>
              {i < 2 && <div style={{ flex: 1, height: 1, background: step > n ? "var(--accent)" : "var(--stator-border)", marginLeft: 8 }} />}
            </span>
          );
        })}
      </div>

      {step === 1 && (
        <div className="anim-up">
          <h1 style={{ fontSize: 19, fontWeight: 600, marginBottom: 4 }}>Add a tool</h1>
          <p style={{ fontSize: 13, color: "var(--text-faint)", marginBottom: 16 }}>Connect from the catalog for automatic syncing, or add any tool manually.</p>
          <div style={{ position: "relative", marginBottom: 16 }}>
            <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-faint)" }}><Icon name="search" size={15} /></span>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search 40+ supported tools…" style={{ ...inputStyle, paddingLeft: 34, padding: "10px 12px 10px 34px" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
            {catalog.map(t => <CatalogCard key={t.slug} tool={t} onClick={() => pick(t)} />)}
          </div>
        </div>
      )}

      {step === 2 && picked && (
        <div className="anim-up">
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
            <ToolMark tool={picked} size={42} />
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 600 }}>{picked.isCustom ? "Custom tool" : `Connect ${picked.name}`}</h1>
              <p style={{ fontSize: 12.5, color: "var(--text-faint)" }}>{isApi ? "Enter your API key — we'll encrypt it and run a first sync." : "Enter billing details — usage is tracked manually."}</p>
            </div>
          </div>
          <Panel style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Field label="Display name" required>
              <TextInput value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })} placeholder={picked.isCustom ? "e.g. Internal LLM gateway" : picked.name} />
            </Field>
            {picked.isCustom && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Field label="Category"><SelectInput value={form.category} onChange={v => setForm({ ...form, category: v })} options={Object.entries(D.CATEGORIES).map(([v, c]) => ({ value: v, label: c.label }))} /></Field>
                <Field label="Billing type"><SelectInput value={form.billingType} onChange={v => setForm({ ...form, billingType: v })} options={[{ value: "subscription", label: "Subscription" }, { value: "credits", label: "Credits / metered" }]} /></Field>
              </div>
            )}
            {isApi ? (
              <Field label="API key" required hint="Encrypted with AES-256 server-side. Never shown to the browser again.">
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-faint)" }}><Icon name="key" size={14} /></span>
                  <TextInput type={showKey ? "text" : "password"} value={form.apiKey} onChange={e => setForm({ ...form, apiKey: e.target.value })} placeholder={`${picked.slug === "anthropic" ? "sk-ant-" : "sk-"}…`} style={{ paddingLeft: 32, paddingRight: 36, fontFamily: "var(--font-mono)" }} />
                  <button onClick={() => setShowKey(s => !s)} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-faint)", cursor: "pointer" }}><Icon name={showKey ? "eyeOff" : "eye"} size={15} /></button>
                </div>
              </Field>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Field label="Monthly plan cost"><TextInput value={form.planMonthlyCost} onChange={e => setForm({ ...form, planMonthlyCost: e.target.value })} placeholder="$ 0.00" /></Field>
                <Field label={form.billingType === "credits" ? "Credit limit" : "Included units"}><TextInput value={form.creditLimit} onChange={e => setForm({ ...form, creditLimit: e.target.value })} placeholder="e.g. 1000" /></Field>
                <Field label="Renewal date"><TextInput type="date" value={form.renewalDate} onChange={e => setForm({ ...form, renewalDate: e.target.value })} /></Field>
                <Field label="Usage unit"><TextInput value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} placeholder="e.g. credits, minutes" /></Field>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 11px", borderRadius: 7, background: "var(--accent-soft)", fontSize: 11.5, color: "var(--accent-text)" }}>
              <Icon name="shield" size={14} /> {isApi ? "Read-only access. Stator only pulls usage & billing data." : "You'll log usage manually or via the API later."}
            </div>
          </Panel>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
            <Button variant="default" onClick={() => setStep(1)}>Cancel</Button>
            <Button variant="primary" iconRight="arrowRight" disabled={!form.displayName || (!!(isApi) && !form.apiKey)} onClick={finish}>{isApi ? "Connect & sync" : "Add tool"}</Button>
          </div>
        </div>
      )}

      {step === 3 && picked && (
        <div className="anim-scale" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", textAlign: "center" }}>
          <div style={{ position: "relative", width: 60, height: 60, marginBottom: 18 }}>
            <ToolMark tool={picked} size={60} />
            <div style={{ position: "absolute", inset: -6, borderRadius: 20, border: "2px solid var(--accent)", borderTopColor: "transparent", animation: "stator-spin .8s linear infinite" }} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{isApi ? "Running first sync…" : "Adding tool…"}</div>
          <div style={{ fontSize: 12.5, color: "var(--text-faint)", marginTop: 4 }}>{isApi ? "Pulling usage & billing from " + picked.name : "Saving configuration"}</div>
        </div>
      )}
    </div>
  );
}

function CatalogCard({ tool, onClick }: { tool: D.CatalogTool; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, textAlign: "left", borderRadius: "var(--stator-radius)", border: "1px solid", cursor: "pointer", fontFamily: "inherit",
        borderColor: hov ? "var(--stator-border-2)" : "var(--stator-border)", background: hov ? "var(--hover)" : "var(--panel)", transition: "all .12s" }}>
      {tool.isCustom ? (
        <div style={{ width: 36, height: 36, borderRadius: 10, display: "grid", placeItems: "center", border: "1.5px dashed var(--stator-border-2)", color: "var(--text-faint)" }}><Icon name="plus" size={18} /></div>
      ) : <ToolMark tool={tool} size={36} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 13.5, fontWeight: 600 }}>{tool.name}</span>
          {tool.popular && <Badge tone="accent" size="sm">Popular</Badge>}
        </div>
        <div style={{ fontSize: 11.5, color: "var(--text-faint)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tool.desc}</div>
      </div>
      <span style={{ color: "var(--text-faint)", opacity: hov ? 1 : 0.4 }}><Icon name="arrowRight" size={15} /></span>
    </button>
  );
}

function MiniStat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: string }) {
  return (
    <div style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid var(--stator-border)", background: "var(--panel-2)" }}>
      <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{label}</div>
      <div className="mono tnum" style={{ fontSize: 16, fontWeight: 600, marginTop: 2, color: tone ? `var(--${tone})` : "var(--text)" }}>{value}</div>
      {sub && <div style={{ fontSize: 10.5, color: "var(--text-faint)", marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

interface ToolDetailProps { toolId: string | null; onClose: () => void; onNav: (r: string) => void; toast: (msg: string, tone?: string, icon?: string) => void; }

export function ToolDetail({ toolId, onClose, onNav, toast }: ToolDetailProps) {
  const tool = toolId ? D.TOOL_BY_ID[toolId] : null;
  const [logVal, setLogVal] = useState("");
  if (!tool) return null;
  const pct = D.usagePct(tool), state = D.usageState(tool);
  const rules = D.RULE_BY_TOOL[tool.id] || [];
  const renew = D.daysUntil(tool.renewalDate);
  const stateText: Record<string, string> = { critical: "Critical — near limit", warn: "Approaching limit", low: "Underused", inactive: `Idle ${tool.lastUsedDaysAgo} days`, error: "Sync error", ok: "Healthy" };
  const stateTone: Record<string, string> = { critical: "danger", warn: "warning", low: "neutral", inactive: "neutral", error: "danger", ok: "success" };

  return (
    <Drawer open={!!tool} onClose={onClose} width={500}
      title={<span style={{ display: "flex", alignItems: "center", gap: 10 }}><ToolMark tool={tool} size={30} />{tool.name}</span>}
      sub={null}
      footer={<>
        <Button variant="ghost" icon="trash" style={{ marginRight: "auto", color: "var(--danger)" }} onClick={() => { onClose(); toast(`${tool.name} disconnected`, "danger", "trash"); }}>Disconnect</Button>
        <Button variant="default" icon="edit">Edit</Button>
        <Button variant="primary" icon="bell" onClick={() => { onClose(); onNav("alerts"); }}>Add alert</Button>
      </>}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
        <Badge tone={stateTone[state] as "danger" | "warning" | "success" | "neutral"}>{stateText[state]}</Badge>
        <Badge tone={tool.billingType === "subscription" ? "violet" : "accent"}>{tool.billingType === "subscription" ? "Subscription" : "Credits"}</Badge>
        <CategoryDot cat={tool.category} /><span style={{ fontSize: 12, color: "var(--text-faint)" }}>{D.CATEGORIES[tool.category]?.label}</span>
      </div>

      {state !== "error" && pct != null && (
        <Panel style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: "var(--text-dim)" }}>Usage this period</span>
            <span className="mono tnum" style={{ fontSize: 22, fontWeight: 600, color: state === "critical" ? "var(--danger)" : state === "warn" ? "var(--warning)" : "var(--text)" }}>{pct}%</span>
          </div>
          <UsageBar pct={pct} state={state} height={8} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 7, fontSize: 11.5, color: "var(--text-faint)" }} className="mono">
            <span>{D.fmtNum(tool.creditsUsed)} used</span>
            <span>{D.fmtNum(D.creditsRemaining(tool))} {tool.unit} left</span>
          </div>
        </Panel>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        <MiniStat label="Cost this period" value={D.fmtMoney(tool.costToDate, 0)} sub={tool.billingType === "subscription" ? "flat subscription" : "metered"} />
        <MiniStat label="MoM change" value={tool.momChange === 0 ? "—" : D.fmtPct(tool.momChange)} sub="vs last month" tone={tool.momChange > 0.3 ? "danger" : tool.momChange < 0 ? "success" : undefined} />
        <MiniStat label="Renews" value={renew <= 0 ? "Today" : "in " + renew + "d"} sub={D.fmtDate(tool.renewalDate)} />
        <MiniStat label={tool.syncType === "api" ? "Last synced" : "Updated"} value={tool.syncType === "api" ? (D.relTime(tool.lastSyncedAt) || "never") : "manual"} sub={tool.syncType === "api" ? "auto · hourly" : "by " + tool.owner} />
      </div>

      <SectionLabel>14-day usage</SectionLabel>
      <Panel style={{ marginBottom: 14, paddingBottom: 10 }}>
        <Sparkline data={tool.spark} w={440} h={56} strokeW={2} />
      </Panel>

      {tool.syncStatus === "sync_error" && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: "11px 12px", borderRadius: 8, background: "var(--danger-soft)", marginBottom: 14 }}>
          <span style={{ color: "var(--danger)", marginTop: 1 }}><Icon name="alert" size={15} /></span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--danger)" }}>Sync failing since {D.relTime(tool.lastSyncedAt)}</div>
            <div style={{ fontSize: 11.5, color: "var(--text-dim)", marginTop: 2 }}>The API key may be invalid or revoked. Last known data shown above.</div>
            <Button variant="default" size="sm" icon="key" style={{ marginTop: 8 }} onClick={() => toast("Re-sync queued", "accent", "refresh")}>Update key & retry</Button>
          </div>
        </div>
      )}

      {tool.syncType === "manual" && (
        <>
          <SectionLabel>Log usage</SectionLabel>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <TextInput value={logVal} onChange={e => setLogVal(e.target.value)} placeholder={`${tool.unit} used this period`} />
            <Button variant="default" icon="check" disabled={!logVal} onClick={() => { setLogVal(""); toast("Usage updated", "success"); }}>Save</Button>
          </div>
        </>
      )}

      <SectionLabel right={<button onClick={() => { onClose(); onNav("alerts"); }} style={{ fontSize: 11.5, color: "var(--accent-text)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Manage</button>}>Alert rules · {rules.length}</SectionLabel>
      {rules.length === 0 ? (
        <div style={{ fontSize: 12, color: "var(--text-faint)", padding: "10px 0" }}>No alerts on this tool yet.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {rules.map(r => {
            const m = TRIGGER_META[r.triggerType];
            return (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 11px", borderRadius: 7, border: "1px solid var(--stator-border)", background: "var(--panel-2)" }}>
                <span style={{ color: `var(--${m.tone === "neutral" ? "text-dim" : m.tone})` }}><Icon name={m.icon} size={15} /></span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 500 }}>{m.label}</div>
                  <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{m.desc(r)}</div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  {r.channels.includes("email")    && <span style={{ color: "var(--text-faint)" }}><Icon name="mail" size={13} /></span>}
                  {r.channels.includes("whatsapp") && <span style={{ color: "var(--success)" }}><Icon name="whatsapp" size={13} /></span>}
                </div>
                <Badge tone={r.active ? "success" : "neutral"} size="sm">{r.active ? "On" : "Off"}</Badge>
              </div>
            );
          })}
        </div>
      )}
    </Drawer>
  );
}
