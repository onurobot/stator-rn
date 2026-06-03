"use client";
import { useState, useEffect, useRef } from "react";
import { Icon } from "./icons";
import * as D from "./data";
import { Logo, Avatar, Badge, Button, IconButton, ToastHost, Toast, inputStyle } from "./components";
import { Dashboard } from "./screen-dashboard";
import { ToolsScreen, AddToolScreen, ToolDetail } from "./screen-tools";
import { AlertsScreen } from "./screen-alerts";
import { ReportsScreen } from "./screen-reports";
import { SettingsScreen } from "./screen-settings";

type Route = "dashboard" | "tools" | "add" | "alerts" | "reports" | "settings";

const ACCENTS: Record<string, { name: string; h: number }> = {
  "#5b73ff": { name: "Electric", h: 264 },
  "#3ecf8e": { name: "Emerald",  h: 158 },
  "#a78bfa": { name: "Violet",   h: 300 },
  "#ff7a59": { name: "Coral",    h: 30  },
};

function applyAccent(hex: string, dark: boolean) {
  const a = ACCENTS[hex]; if (!a) return;
  const root = document.documentElement;
  const L = dark ? 0.66 : 0.55, C = 0.16;
  root.style.setProperty("--accent",      `oklch(${L} ${C} ${a.h})`);
  root.style.setProperty("--accent-hover",`oklch(${L + 0.05} ${C} ${a.h})`);
  root.style.setProperty("--accent-soft", `oklch(${L} ${C} ${a.h} / ${dark ? 0.14 : 0.12})`);
  root.style.setProperty("--accent-text", `oklch(${dark ? 0.78 : 0.5} ${dark ? 0.13 : 0.18} ${a.h})`);
}

/* ---------- Sidebar ---------- */
function Sidebar({ route, onNav }: { route: Route; onNav: (r: Route) => void }) {
  const nav = [
    { id: "dashboard", label: "Overview", icon: "dashboard" },
    { id: "tools",     label: "Tools",    icon: "grid" },
    { id: "alerts",    label: "Alerts",   icon: "bell", badge: 3 },
    { id: "reports",   label: "Reports",  icon: "report" },
  ] as const;
  return (
    <aside style={{ width: 220, flexShrink: 0, borderRight: "1px solid var(--stator-border)", background: "var(--bg-sunken)", display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "16px 16px 12px", display: "flex", alignItems: "center", gap: 9 }}>
        <Logo size={28} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, letterSpacing: "-0.02em" }}>Stator</div>
        </div>
      </div>
      <div style={{ padding: "0 12px 12px" }}>
        <button style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: 8, border: "1px solid var(--stator-border)", background: "var(--panel)", cursor: "pointer", fontFamily: "inherit" }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: "oklch(0.55 0.13 264)", color: "#fff", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700 }}>N</div>
          <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{D.ORG.name}</div>
            <div style={{ fontSize: 10.5, color: "var(--text-faint)" }}>Team · 6 members</div>
          </div>
          <span style={{ color: "var(--text-faint)" }}><Icon name="chevDown" size={14} /></span>
        </button>
      </div>
      <nav style={{ padding: "0 12px", display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
        {nav.map(n => {
          const on = route === n.id;
          return (
            <button key={n.id} onClick={() => onNav(n.id as Route)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 11px", borderRadius: 7, border: "none", textAlign: "left", fontSize: 13, fontWeight: 500, position: "relative", cursor: "pointer", fontFamily: "inherit",
                background: on ? "var(--panel)" : "transparent", color: on ? "var(--text)" : "var(--text-dim)",
                boxShadow: on ? "0 1px 2px rgba(0,0,0,0.12), inset 0 0 0 1px var(--stator-border)" : "none", transition: "background .1s" }}>
              {on && <span style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: 16, borderRadius: 3, background: "var(--accent)" }} />}
              <Icon name={n.icon} size={16} />{n.label}
              {"badge" in n && n.badge && <span className="mono" style={{ marginLeft: "auto", fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 20, background: "var(--danger-soft)", color: "var(--danger)" }}>{n.badge}</span>}
            </button>
          );
        })}
        <div style={{ height: 1, background: "var(--stator-border)", margin: "10px 4px" }} />
        <button onClick={() => onNav("add")}
          style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 11px", borderRadius: 7, border: "1px dashed var(--stator-border-2)", textAlign: "left", fontSize: 12.5, fontWeight: 500, background: "transparent", color: "var(--text-dim)", cursor: "pointer", fontFamily: "inherit" }}>
          <Icon name="plus" size={15} /> Add tool
        </button>
      </nav>
      <div style={{ padding: 12, borderTop: "1px solid var(--stator-border)" }}>
        <button onClick={() => onNav("settings")}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "7px 8px", borderRadius: 7, border: "none", background: route === "settings" ? "var(--panel)" : "transparent", textAlign: "left", cursor: "pointer", fontFamily: "inherit" }}>
          <Avatar name="Maya Reyes" size={26} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Maya Reyes</div>
            <div style={{ fontSize: 10.5, color: "var(--text-faint)" }}>Owner</div>
          </div>
          <span style={{ color: "var(--text-faint)" }}><Icon name="settings" size={15} /></span>
        </button>
      </div>
    </aside>
  );
}

/* ---------- Topbar ---------- */
function Topbar({ route, onNav, theme, onToggleTheme }: { route: Route; onNav: (r: Route) => void; theme: string; onToggleTheme: () => void; }) {
  const titles: Record<Route, string> = { dashboard: "Overview", tools: "Tools", add: "Add tool", alerts: "Alerts", reports: "Reports", settings: "Settings" };
  const [q, setQ] = useState("");
  return (
    <header style={{ height: 52, flexShrink: 0, borderBottom: "1px solid var(--stator-border)", display: "flex", alignItems: "center", gap: 14, padding: "0 22px", background: "var(--bg)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: "var(--text-faint)" }}>
        <span>{D.ORG.name}</span><Icon name="chevRight" size={13} /><span style={{ color: "var(--text)", fontWeight: 500 }}>{titles[route] || "Overview"}</span>
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ position: "relative", width: 220 }}>
        <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "var(--text-faint)" }}><Icon name="search" size={14} /></span>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search tools, alerts…"
          style={{ ...inputStyle, padding: "6px 10px 6px 30px", background: "var(--bg-sunken)" }} />
        <span className="mono" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 10, color: "var(--text-faint)", border: "1px solid var(--stator-border-2)", borderRadius: 4, padding: "1px 5px" }}>⌘K</span>
      </div>
      <IconButton name={theme === "dark" ? "sun" : "moon"} onClick={onToggleTheme} title="Toggle theme" />
      <button onClick={() => onNav("alerts")} style={{ position: "relative", width: 30, height: 30, display: "grid", placeItems: "center", borderRadius: 7, border: "none", background: "transparent", color: "var(--text-dim)", cursor: "pointer" }}>
        <Icon name="bell" size={17} />
        <span style={{ position: "absolute", top: 5, right: 6, width: 7, height: 7, borderRadius: "50%", background: "var(--danger)", boxShadow: "0 0 0 2px var(--bg)" }} />
      </button>
      <Button variant="primary" size="sm" icon="plus" onClick={() => onNav("add")}>Add tool</Button>
    </header>
  );
}

/* ---------- Onboarding ---------- */
function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const steps = [
    { icon: "layers",  title: "Welcome to Stator",          body: "One place to track usage, spend, and renewals across every AI tool your team uses." },
    { icon: "bell",    title: "Never blow a budget again",   body: "Set smart alerts per tool. Get pinged on email or WhatsApp before you hit a limit — or when a tool goes unused." },
    { icon: "report",  title: "Reports on autopilot",        body: "Monthly cost reports generate automatically. Export any month as a PDF, see month-over-month trends, and spot waste." },
  ];
  const s = steps[step];
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "grid", placeItems: "center", background: "var(--bg)", padding: 20 }}>
      <div className="anim-scale" style={{ width: 420, maxWidth: "100%", textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, margin: "0 auto 22px", background: "var(--accent-soft)", color: "var(--accent-text)", display: "grid", placeItems: "center" }}>
          <Icon name={s.icon} size={26} />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 10 }}>{s.title}</h1>
        <p style={{ fontSize: 14, color: "var(--text-dim)", lineHeight: 1.55, maxWidth: 340, margin: "0 auto 28px" }}>{s.body}</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, marginBottom: 24 }}>
          {steps.map((_, i) => <span key={i} style={{ width: i === step ? 20 : 7, height: 7, borderRadius: 7, background: i === step ? "var(--accent)" : "var(--stator-border-2)", transition: "all .2s" }} />)}
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          {step > 0 && <Button variant="default" onClick={() => setStep(step - 1)}>Back</Button>}
          <Button variant="primary" size="lg" iconRight={step < steps.length - 1 ? "arrowRight" : "check"} onClick={() => step < steps.length - 1 ? setStep(step + 1) : onDone()}>
            {step < steps.length - 1 ? "Next" : "Get started"}
          </Button>
        </div>
        {step < steps.length - 1 && <button onClick={onDone} style={{ marginTop: 16, fontSize: 12, color: "var(--text-faint)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Skip intro</button>}
      </div>
    </div>
  );
}

/* ---------- App ---------- */
export function StatorApp() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [accent, setAccent] = useState("#5b73ff");
  const [route, setRoute] = useState<Route>("dashboard");
  const [openTool, setOpenTool] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [onboard, setOnboard] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try { if (localStorage.getItem("stator_onboarded") === "1") setOnboard(false); } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    applyAccent(accent, theme === "dark");
  }, [theme, accent]);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0; }, [route]);

  const toast = (msg: string, tone = "accent", icon?: string) => {
    const id = Date.now() + Math.random();
    setToasts(ts => [...ts, { id, msg, tone, icon }]);
    setTimeout(() => setToasts(ts => ts.filter(x => x.id !== id)), 3000);
  };

  const nav = (r: string) => { setOpenTool(null); setRoute(r as Route); };
  const finishOnboard = () => {
    setOnboard(false);
    try { localStorage.setItem("stator_onboarded", "1"); } catch {}
  };

  return (
    <div className="stator-root">
      {onboard && <Onboarding onDone={finishOnboard} />}
      <Sidebar route={route} onNav={nav} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Topbar route={route} onNav={nav} theme={theme} onToggleTheme={() => setTheme(t => t === "dark" ? "light" : "dark")} />
        <main ref={scrollRef} style={{ flex: 1, overflow: "auto", padding: "22px 26px 60px" }}>
          <div style={{ maxWidth: 1180, margin: "0 auto" }}>
            {route === "dashboard" && <Dashboard onOpenTool={setOpenTool} onNav={nav} toast={toast} />}
            {route === "tools"     && <ToolsScreen onOpenTool={setOpenTool} onNav={nav} toast={toast} />}
            {route === "add"       && <AddToolScreen onNav={nav} toast={toast} />}
            {route === "alerts"    && <AlertsScreen onOpenTool={setOpenTool} toast={toast} />}
            {route === "reports"   && <ReportsScreen toast={toast} />}
            {route === "settings"  && <SettingsScreen toast={toast} onNav={nav} />}
          </div>
        </main>
      </div>
      <ToolDetail toolId={openTool} onClose={() => setOpenTool(null)} onNav={nav} toast={toast} />
      <ToastHost toasts={toasts} />
    </div>
  );
}
