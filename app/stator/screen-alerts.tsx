"use client";
import { useState } from "react";
import { Icon } from "./icons";
import * as D from "./data";
import { ToolMark, Badge, StatusDot, Button, IconButton, Switch, Modal, Panel, Field, SelectInput, Segmented, EmptyState, PageHeader, TRIGGER_META } from "./components";

function ChannelChips({ channels, size = 13 }: { channels: string[]; size?: number }) {
  return (
    <div style={{ display: "flex", gap: 5 }}>
      {channels.includes("email")    && <span title="Email"    style={{ display: "inline-flex", color: "var(--accent-text)" }}><Icon name="mail"     size={size} /></span>}
      {channels.includes("whatsapp") && <span title="WhatsApp" style={{ display: "inline-flex", color: "var(--success)"  }}><Icon name="whatsapp" size={size} /></span>}
    </div>
  );
}

interface AlertsProps { onOpenTool: (id: string) => void; toast: (msg: string, tone?: string, icon?: string) => void; }

export function AlertsScreen({ onOpenTool, toast }: AlertsProps) {
  const [rules, setRules] = useState(D.ALERT_RULES);
  const [builder, setBuilder] = useState<D.AlertRule | {} | null>(null);
  const [filter, setFilter] = useState("all");
  const toggle = (id: string) => setRules(rs => rs.map(r => r.id === id ? { ...r, active: !r.active } : r));
  const activeCount = rules.filter(r => r.active).length;
  const shown = rules.filter(r => filter === "all" || (filter === "active" ? r.active : r.triggerType === filter));

  return (
    <div className="anim-fade">
      <PageHeader title="Alerts"
        sub={`${activeCount} active rules · evaluated hourly · ${D.NOTIFICATIONS.length} fired in the last 7 days`}
        actions={<Button variant="primary" icon="plus" size="sm" onClick={() => setBuilder({})}>New rule</Button>} />

      <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: "var(--gap)", alignItems: "start" }}>
        <div>
          <div style={{ display: "flex", gap: 4, marginBottom: 12, flexWrap: "wrap" }}>
            {[["all", "All rules"], ["active", "Active"], ["threshold_high", "Usage high"], ["threshold_low", "Underused"], ["unused", "Inactive"]].map(([v, l]) => (
              <button key={v} onClick={() => setFilter(v)}
                style={{ padding: "4px 10px", borderRadius: 20, fontSize: 11.5, fontWeight: 500, border: "1px solid", cursor: "pointer", fontFamily: "inherit",
                  borderColor: filter === v ? "transparent" : "var(--stator-border)", background: filter === v ? "var(--accent-soft)" : "transparent", color: filter === v ? "var(--accent-text)" : "var(--text-dim)" }}>{l}</button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {shown.map(r => {
              const tool = D.TOOL_BY_ID[r.toolId];
              const m = TRIGGER_META[r.triggerType];
              const onCooldown = r.lastFiredAt && (new Date("2026-06-02T13:30:00Z").getTime() - new Date(r.lastFiredAt).getTime()) / 3600000 < r.cooldownHours;
              return (
                <Panel key={r.id} pad={false} style={{ padding: "13px 14px", opacity: r.active ? 1 : 0.62, transition: "opacity .15s" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, display: "grid", placeItems: "center", flexShrink: 0, background: `var(--${m.tone === "neutral" ? "panel-2" : m.tone + "-soft"})`, color: `var(--${m.tone === "neutral" ? "text-dim" : m.tone})` }}>
                      <Icon name={m.icon} size={16} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{tool?.name}</span>
                        <span style={{ fontSize: 12, color: "var(--text-dim)" }}>{m.label.toLowerCase()}</span>
                      </div>
                      <div style={{ fontSize: 11.5, color: "var(--text-faint)", marginTop: 1 }}>{m.desc(r)} · cooldown {r.cooldownHours}h{r.lastFiredAt ? " · last fired " + D.relTime(r.lastFiredAt) : " · never fired"}</div>
                    </div>
                    {onCooldown && <Badge tone="neutral" icon="clock" size="sm">Cooling</Badge>}
                    <ChannelChips channels={r.channels} />
                    <div style={{ width: 1, height: 22, background: "var(--stator-border)" }} />
                    <Switch checked={r.active} onChange={() => toggle(r.id)} size="sm" />
                    <IconButton name="edit" size={28} iconSize={14} onClick={() => setBuilder(r)} />
                  </div>
                </Panel>
              );
            })}
            {shown.length === 0 && <Panel><EmptyState icon="bell" title="No rules here" sub="Create a rule to get notified before you hit a limit." action={<Button variant="primary" size="sm" icon="plus" onClick={() => setBuilder({})}>New rule</Button>} /></Panel>}
          </div>
        </div>

        {/* activity feed */}
        <Panel pad={false} style={{ position: "sticky", top: 0 }}>
          <div style={{ padding: "13px 16px", borderBottom: "1px solid var(--stator-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Recent activity</span>
            <Badge tone="neutral" size="sm">7 days</Badge>
          </div>
          <div style={{ maxHeight: 540, overflow: "auto" }}>
            {D.NOTIFICATIONS.map((n, i) => {
              const tool = D.TOOL_BY_ID[n.toolId];
              const m = TRIGGER_META[n.triggerType];
              return (
                <div key={n.id} onClick={() => onOpenTool(n.toolId)}
                  style={{ display: "flex", gap: 11, padding: "12px 16px", borderBottom: i < D.NOTIFICATIONS.length - 1 ? "1px solid var(--stator-border)" : "none", cursor: "pointer" }} className="stator-trow">
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <ToolMark tool={tool} size={28} />
                    <span style={{ position: "absolute", bottom: -3, right: -3, width: 16, height: 16, borderRadius: "50%", display: "grid", placeItems: "center", background: "var(--panel)", color: n.channel === "whatsapp" ? "var(--success)" : "var(--accent-text)" }}>
                      <Icon name={n.channel === "whatsapp" ? "whatsapp" : "mail"} size={10} />
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, lineHeight: 1.4 }}>{n.detail}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, fontSize: 10.5, color: "var(--text-faint)" }}>
                      <span>{D.relTime(n.sentAt)}</span>
                      <span style={{ opacity: 0.4 }}>·</span>
                      {n.status === "delivered" && !n.fallbackUsed && <span style={{ color: "var(--success)", display: "inline-flex", alignItems: "center", gap: 3 }}><StatusDot tone="ok" />Delivered</span>}
                      {n.fallbackUsed && <span style={{ color: "var(--warning)", display: "inline-flex", alignItems: "center", gap: 3 }}><Icon name="refresh" size={10} />Email fallback</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      {builder !== null && (
        <RuleBuilder
          rule={"id" in builder ? builder as D.AlertRule : null}
          onClose={() => setBuilder(null)}
          onSave={rule => {
            setRules(rs => rule.id ? rs.map(r => r.id === rule.id ? rule : r) : [{ ...rule, id: "r" + Date.now() }, ...rs]);
            setBuilder(null);
            toast(rule.id ? "Rule updated" : "Alert rule created", "success");
          }} />
      )}
    </div>
  );
}

function RuleBuilder({ rule, onClose, onSave }: { rule: D.AlertRule | null; onClose: () => void; onSave: (r: D.AlertRule) => void }) {
  const [toolId, setToolId] = useState(rule?.toolId || D.TOOLS[0].id);
  const [trigger, setTrigger] = useState<D.TriggerType>(rule?.triggerType || "threshold_high");
  const [threshold, setThreshold] = useState(rule?.thresholdPercent || 80);
  const [unusedDays, setUnusedDays] = useState(rule?.unusedDays || 7);
  const [channels, setChannels] = useState<string[]>(rule?.channels || ["email"]);
  const [cooldown, setCooldown] = useState<number>(rule?.cooldownHours || 24);
  const tool = D.TOOL_BY_ID[toolId];
  const m = TRIGGER_META[trigger];

  const toggleCh = (c: string) => setChannels(cs => cs.includes(c) ? cs.filter(x => x !== c) : [...cs, c]);
  const preview = trigger === "unused"
    ? `When ${tool?.name} records no usage for ${unusedDays} days`
    : trigger === "threshold_low"
      ? `When ${tool?.name} is below ${threshold}% used`
      : `When ${tool?.name} reaches ${threshold}% of its limit`;

  return (
    <Modal open onClose={onClose} width={520} title={rule ? "Edit alert rule" : "New alert rule"} sub="Stator evaluates every active rule hourly."
      footer={<>
        <Button variant="default" onClick={onClose}>Cancel</Button>
        <Button variant="primary" icon="check" disabled={channels.length === 0}
          onClick={() => onSave({ ...(rule || {}), id: rule?.id || "", toolId, triggerType: trigger, thresholdPercent: trigger === "unused" ? null : threshold, unusedDays: trigger === "unused" ? unusedDays : null, channels, cooldownHours: cooldown, active: rule ? rule.active : true, lastFiredAt: rule?.lastFiredAt || null } as D.AlertRule)}>
          {rule ? "Save changes" : "Create rule"}
        </Button>
      </>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <Field label="Tool">
          <SelectInput value={toolId} onChange={setToolId} options={D.TOOLS.map(t => ({ value: t.id, label: t.name }))} />
        </Field>

        <div>
          <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-dim)", display: "block", marginBottom: 7 }}>Trigger</span>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {Object.entries(TRIGGER_META).map(([v, meta]) => (
              <button key={v} onClick={() => setTrigger(v as D.TriggerType)}
                style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6, padding: "11px 12px", borderRadius: 9, textAlign: "left", border: "1px solid", cursor: "pointer", fontFamily: "inherit",
                  borderColor: trigger === v ? "var(--accent)" : "var(--stator-border-2)", background: trigger === v ? "var(--accent-soft)" : "var(--bg-sunken)" }}>
                <span style={{ color: trigger === v ? "var(--accent-text)" : "var(--text-faint)" }}><Icon name={meta.icon} size={17} /></span>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{meta.label}</span>
              </button>
            ))}
          </div>
        </div>

        {trigger !== "unused" ? (
          <Field label={trigger === "threshold_low" ? "Fire when usage is below" : "Fire when usage reaches"}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <input type="range" min="5" max="100" step="5" value={threshold} onChange={e => setThreshold(+e.target.value)} style={{ flex: 1, accentColor: "var(--accent)" }} />
              <span className="mono tnum" style={{ fontSize: 16, fontWeight: 600, minWidth: 48, textAlign: "right" }}>{threshold}%</span>
            </div>
          </Field>
        ) : (
          <Field label="Fire when no usage for" hint="Based on consecutive usage snapshots with zero net new usage.">
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <input type="range" min="1" max="30" step="1" value={unusedDays} onChange={e => setUnusedDays(+e.target.value)} style={{ flex: 1, accentColor: "var(--accent)" }} />
              <span className="mono tnum" style={{ fontSize: 16, fontWeight: 600, minWidth: 64, textAlign: "right" }}>{unusedDays} days</span>
            </div>
          </Field>
        )}

        <div>
          <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-dim)", display: "block", marginBottom: 7 }}>Notify via</span>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {([["email", "mail", "Email", "All members"], ["whatsapp", "whatsapp", "WhatsApp", "Pro & Team · opt-in"]] as [string, string, string, string][]).map(([c, icon, label, sub]) => {
              const on = channels.includes(c);
              return (
                <button key={c} onClick={() => toggleCh(c)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 12px", borderRadius: 9, border: "1px solid", textAlign: "left", cursor: "pointer", fontFamily: "inherit",
                    borderColor: on ? "var(--accent)" : "var(--stator-border-2)", background: on ? "var(--accent-soft)" : "var(--bg-sunken)" }}>
                  <span style={{ color: c === "whatsapp" ? "var(--success)" : "var(--accent-text)" }}><Icon name={icon} size={17} /></span>
                  <div style={{ flex: 1 }}><div style={{ fontSize: 12.5, fontWeight: 600 }}>{label}</div><div style={{ fontSize: 10.5, color: "var(--text-faint)" }}>{sub}</div></div>
                  <div style={{ width: 16, height: 16, borderRadius: 5, display: "grid", placeItems: "center", border: on ? "none" : "1.5px solid var(--stator-border-2)", background: on ? "var(--accent)" : "transparent", color: "#fff" }}>{on && <Icon name="check" size={11} />}</div>
                </button>
              );
            })}
          </div>
        </div>

        <Field label="Cooldown" hint="Minimum time between repeat alerts for this rule.">
          <Segmented value={cooldown} onChange={v => setCooldown(v as number)} options={[{ value: 12, label: "12h" }, { value: 24, label: "24h" }, { value: 72, label: "3 days" }, { value: 168, label: "Weekly" }]} />
        </Field>

        <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 14px", borderRadius: 9, background: "var(--bg-sunken)", border: "1px dashed var(--stator-border-2)" }}>
          <span style={{ color: `var(--${m.tone === "neutral" ? "text-dim" : m.tone})` }}><Icon name={m.icon} size={17} /></span>
          <div style={{ fontSize: 12.5, lineHeight: 1.45 }}>
            <span style={{ color: "var(--text)" }}>{preview}</span>
            <span style={{ color: "var(--text-faint)" }}>, notify via {channels.length ? channels.map(c => c === "whatsapp" ? "WhatsApp" : "email").join(" + ") : "no channel"}, at most once per {cooldown >= 168 ? "week" : cooldown + "h"}.</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
