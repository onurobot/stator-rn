"use client";
import { useState, useEffect } from "react";
import { Icon } from "./icons";
import * as D from "./data";
import { Avatar, Badge, Button, IconButton, Switch, Modal, Panel, SectionLabel, Field, TextInput, PageHeader, inputStyle } from "./components";

const PLANS = [
  { id: "free",  name: "Free",  price: 0,  blurb: "For trying things out",   feats: ["3 connected tools", "Daily sync", "Email alerts", "Current month only", "1 member"] },
  { id: "pro",   name: "Pro",   price: 19, blurb: "For solo operators",       feats: ["Unlimited tools", "Hourly sync", "Email + WhatsApp alerts", "PDF export", "12-month history", "1 member"] },
  { id: "team",  name: "Team",  price: 49, blurb: "For agencies & teams",     feats: ["Everything in Pro", "Multiple members", "Shared dashboard", "Per-member alert routing", "Priority sync"] },
];

export function SettingsScreen({ toast, onNav: _onNav }: { toast: (msg: string, tone?: string, icon?: string) => void; onNav: (r: string) => void }) {
  const [tab, setTab] = useState("plan");
  const tabs = [
    { id: "plan",          label: "Plan & billing",  icon: "credit" },
    { id: "notifications", label: "Notifications",   icon: "bell" },
    { id: "members",       label: "Members",          icon: "users" },
    { id: "security",      label: "Security",         icon: "shield" },
  ];
  return (
    <div className="anim-fade">
      <PageHeader title="Settings" sub={`${D.ORG.name} · ${D.ORG.plan === "team" ? "Team" : D.ORG.plan} workspace`} />
      <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 24, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, position: "sticky", top: 0 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 11px", borderRadius: 7, border: "none", textAlign: "left", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
                background: tab === t.id ? "var(--panel-2)" : "transparent", color: tab === t.id ? "var(--text)" : "var(--text-dim)" }}>
              <Icon name={t.icon} size={15} />{t.label}
            </button>
          ))}
        </div>
        <div style={{ minWidth: 0 }}>
          {tab === "plan"          && <PlanSettings toast={toast} />}
          {tab === "notifications" && <NotificationSettings toast={toast} />}
          {tab === "members"       && <MemberSettings toast={toast} />}
          {tab === "security"      && <SecuritySettings toast={toast} />}
        </div>
      </div>
    </div>
  );
}

function PlanSettings({ toast }: { toast: (msg: string, tone?: string, icon?: string) => void }) {
  const current = "team";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Panel>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: "var(--accent-soft)", color: "var(--accent-text)", display: "grid", placeItems: "center" }}><Icon name="layers" size={19} /></div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 15, fontWeight: 600 }}>Team plan</span><Badge tone="accent" size="sm">Current</Badge></div>
              <div style={{ fontSize: 12, color: "var(--text-faint)" }}>$49/mo · renews Jul 1, 2026 · 6 of 8 seats used</div>
            </div>
          </div>
          <Button variant="default" size="sm" icon="external" onClick={() => toast("Opening Stripe portal…", "accent", "external")}>Manage billing</Button>
        </div>
      </Panel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {PLANS.map(p => {
          const isCurrent = p.id === current;
          return (
            <Panel key={p.id} style={{ display: "flex", flexDirection: "column", gap: 12, borderColor: isCurrent ? "var(--accent)" : "var(--stator-border)", position: "relative" }}>
              {p.id === "team" && <div style={{ position: "absolute", top: -1, right: 14, transform: "translateY(-50%)" }}><Badge tone="accent">Popular</Badge></div>}
              <div><div style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</div><div style={{ fontSize: 11.5, color: "var(--text-faint)" }}>{p.blurb}</div></div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                <span className="mono" style={{ fontSize: 24, fontWeight: 600 }}>${p.price}</span>
                <span style={{ fontSize: 12, color: "var(--text-faint)" }}>/mo</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7, flex: 1 }}>
                {p.feats.map(f => <div key={f} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "var(--text-dim)" }}><span style={{ color: "var(--success)" }}><Icon name="check" size={13} /></span>{f}</div>)}
              </div>
              <Button variant={isCurrent ? "default" : p.id === "team" ? "primary" : "outline"} full disabled={isCurrent} onClick={() => toast(`Switching to ${p.name}…`, "accent")}>{isCurrent ? "Current plan" : p.price > 49 ? "Upgrade" : p.id === "free" ? "Downgrade" : "Switch"}</Button>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

function NotificationSettings({ toast }: { toast: (msg: string, tone?: string, icon?: string) => void }) {
  const [optedIn, setOptedIn] = useState(true);
  const [phone] = useState("+1 (415) 555-0142");
  const [emailAll, setEmailAll] = useState(true);
  const [wOpen, setWOpen] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Panel>
        <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 14 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "var(--accent-soft)", color: "var(--accent-text)", display: "grid", placeItems: "center" }}><Icon name="mail" size={16} /></div>
          <div><div style={{ fontSize: 13.5, fontWeight: 600 }}>Email</div><div style={{ fontSize: 11.5, color: "var(--text-faint)" }}>Available on all plans</div></div>
        </div>
        <SettingRow label="Send to all team members" sub="Otherwise only the workspace owner receives alerts" control={<Switch checked={emailAll} onChange={setEmailAll} />} />
      </Panel>
      <Panel>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "var(--success-soft)", color: "var(--success)", display: "grid", placeItems: "center" }}><Icon name="whatsapp" size={16} /></div>
            <div><div style={{ fontSize: 13.5, fontWeight: 600 }}>WhatsApp</div><div style={{ fontSize: 11.5, color: "var(--text-faint)" }}>Pro & Team · requires opt-in</div></div>
          </div>
          {optedIn ? <Badge tone="success" icon="checkCircle">Opted in</Badge> : <Badge tone="neutral">Not connected</Badge>}
        </div>
        {optedIn ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <SettingRow label="Phone number" sub="Verified · messages use Twilio-approved templates" control={<span className="mono" style={{ fontSize: 12.5 }}>{phone}</span>} />
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <Button variant="default" size="sm" icon="edit" onClick={() => setWOpen(true)}>Change number</Button>
              <Button variant="ghost" size="sm" style={{ color: "var(--danger)" }} onClick={() => { setOptedIn(false); toast("WhatsApp opted out", "neutral"); }}>Opt out</Button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: "11px 12px", borderRadius: 8, background: "var(--warning-soft)", marginBottom: 12 }}>
              <span style={{ color: "var(--warning)", marginTop: 1 }}><Icon name="info" size={14} /></span>
              <div style={{ fontSize: 11.5, color: "var(--text-dim)" }}>WhatsApp alert rules are active but silently skipped until you opt in.</div>
            </div>
            <Button variant="primary" icon="whatsapp" onClick={() => setWOpen(true)}>Set up WhatsApp</Button>
          </div>
        )}
      </Panel>
      <Panel>
        <SectionLabel>Delivery fallback</SectionLabel>
        <SettingRow label="Fall back to email if WhatsApp fails" sub="Recorded as a fallback in the notification log" control={<Switch checked={true} onChange={() => toast("Fallback is always on for reliability", "accent")} />} />
      </Panel>
      <WhatsAppOptIn open={wOpen} onClose={() => setWOpen(false)} onDone={p => { setOptedIn(true); setWOpen(false); toast(`WhatsApp verified for ${p}`, "success", "whatsapp"); }} />
    </div>
  );
}

function WhatsAppOptIn({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: (phone: string) => void }) {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [consent, setConsent] = useState(false);
  useEffect(() => { if (open) { setStep(1); setPhone(""); setCode(""); setConsent(false); } }, [open]);
  return (
    <Modal open={open} onClose={onClose} width={440} title="Connect WhatsApp" sub="Receive critical alerts on WhatsApp"
      footer={step === 1
        ? <><Button variant="default" onClick={onClose}>Cancel</Button><Button variant="primary" disabled={!phone || !consent} onClick={() => setStep(2)}>Send code</Button></>
        : <><Button variant="default" onClick={() => setStep(1)}>Back</Button><Button variant="primary" disabled={code.length < 4} icon="check" onClick={() => onDone(phone)}>Verify</Button></>}>
      {step === 1 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Field label="Phone number" required hint="Include country code. Standard message rates may apply.">
            <TextInput value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (415) 555-0000" style={{ fontFamily: "var(--font-mono)" }} />
          </Field>
          <button onClick={() => setConsent(c => !c)} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: 12, borderRadius: 8, border: "1px solid var(--stator-border-2)", background: "var(--bg-sunken)", textAlign: "left", cursor: "pointer", fontFamily: "inherit" }}>
            <div style={{ width: 17, height: 17, borderRadius: 5, flexShrink: 0, marginTop: 1, display: "grid", placeItems: "center", border: consent ? "none" : "1.5px solid var(--stator-border-2)", background: consent ? "var(--accent)" : "transparent", color: "#fff" }}>{consent && <Icon name="check" size={12} />}</div>
            <span style={{ fontSize: 11.5, color: "var(--text-dim)", lineHeight: 1.5 }}>I consent to receive automated alert messages from Stator via WhatsApp. I can opt out anytime by replying STOP.</span>
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, textAlign: "center", padding: "10px 0" }}>
          <div style={{ fontSize: 13, color: "var(--text-dim)" }}>We sent a 6-digit code to <span className="mono" style={{ color: "var(--text)" }}>{phone}</span></div>
          <input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="······" maxLength={6}
            style={{ ...inputStyle, textAlign: "center", fontSize: 24, letterSpacing: "0.4em", fontFamily: "var(--font-mono)", padding: "12px" }} />
          <button onClick={() => {}} style={{ fontSize: 12, color: "var(--accent-text)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Resend code</button>
        </div>
      )}
    </Modal>
  );
}

function MemberSettings({ toast }: { toast: (msg: string, tone?: string, icon?: string) => void }) {
  const members = [
    { name: "Maya Reyes", email: "maya@northbeam.studio", role: "owner",  wa: true },
    { name: "Leo Kim",    email: "leo@northbeam.studio",  role: "member", wa: true },
    { name: "Priya Shah", email: "priya@northbeam.studio",role: "member", wa: false },
    { name: "Dana Wolfe", email: "dana@northbeam.studio", role: "member", wa: true },
    { name: "Sam Tran",   email: "sam@northbeam.studio",  role: "member", wa: false },
    { name: "Iris Cole",  email: "iris@northbeam.studio", role: "member", wa: false },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Panel pad={false}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", borderBottom: "1px solid var(--stator-border)" }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Members · {members.length} of 8 seats</span>
          <Button variant="primary" size="sm" icon="plus" onClick={() => toast("Invite sent", "success")}>Invite</Button>
        </div>
        {members.map((m, i) => (
          <div key={m.email} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", borderBottom: i < members.length - 1 ? "1px solid var(--stator-border)" : "none" }}>
            <Avatar name={m.name} size={30} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{m.name}</div>
              <div style={{ fontSize: 11.5, color: "var(--text-faint)" }}>{m.email}</div>
            </div>
            {m.wa && <span title="WhatsApp opted in" style={{ color: "var(--success)" }}><Icon name="whatsapp" size={14} /></span>}
            <Badge tone={m.role === "owner" ? "accent" : "neutral"} size="sm">{m.role}</Badge>
            <IconButton name="more" size={28} iconSize={15} />
          </div>
        ))}
      </Panel>
    </div>
  );
}

function SecuritySettings({ toast }: { toast: (msg: string, tone?: string, icon?: string) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Panel>
        <SectionLabel>API key storage</SectionLabel>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 11, padding: "12px 13px", borderRadius: 8, background: "var(--success-soft)", marginBottom: 12 }}>
          <span style={{ color: "var(--success)", marginTop: 1 }}><Icon name="lock" size={16} /></span>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text)" }}>All keys encrypted with AES-256</div>
            <div style={{ fontSize: 11.5, color: "var(--text-dim)", marginTop: 2 }}>Stored server-side and never returned to the browser. 9 connected API tools.</div>
          </div>
        </div>
        <SettingRow label="Row-level security (RLS)" sub="Every query scoped by organization at the database layer" control={<Badge tone="success" size="sm" icon="check">Enforced</Badge>} />
        <div style={{ height: 1, background: "var(--stator-border)", margin: "12px 0" }} />
        <SettingRow label="Clerk session validation" sub="All API routes verify org membership before processing" control={<Badge tone="success" size="sm" icon="check">Active</Badge>} />
      </Panel>
      <Panel>
        <SectionLabel>Danger zone</SectionLabel>
        <SettingRow label="Rotate all API keys" sub="Re-encrypt every stored key with a fresh secret" control={<Button variant="default" size="sm" icon="key" onClick={() => toast("Key rotation scheduled", "accent")}>Rotate</Button>} />
        <div style={{ height: 1, background: "var(--stator-border)", margin: "12px 0" }} />
        <SettingRow label="Delete workspace" sub="Permanently remove all tools, rules and reports" control={<Button variant="danger" size="sm" icon="trash">Delete</Button>} />
      </Panel>
    </div>
  );
}

function SettingRow({ label, sub, control }: { label: string; sub?: string; control: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
      <div><div style={{ fontSize: 12.5, fontWeight: 500 }}>{label}</div>{sub && <div style={{ fontSize: 11.5, color: "var(--text-faint)", marginTop: 1 }}>{sub}</div>}</div>
      <div style={{ flexShrink: 0 }}>{control}</div>
    </div>
  );
}
