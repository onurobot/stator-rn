"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { Icon } from "./icons";
import * as D from "./data";

/* ---------- Brand logo (gauge-ring motif) ---------- */
export function Logo({ size = 28, radius = 8 }: { size?: number; radius?: number }) {
  const s = size, c = s / 2, r = s * 0.3, circ = 2 * Math.PI * r;
  return (
    <div style={{ width: s, height: s, borderRadius: radius, background: "var(--accent)", display: "grid", placeItems: "center", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25), inset 0 0 0 1px rgba(255,255,255,0.12), 0 1px 2px rgba(0,0,0,0.3)", flexShrink: 0 }}>
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ transform: "rotate(135deg)" }}>
        <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(255,255,255,0.32)" strokeWidth={s * 0.1} strokeLinecap="round" />
        <circle cx={c} cy={c} r={r} fill="none" stroke="#fff" strokeWidth={s * 0.1} strokeLinecap="round" strokeDasharray={`${circ * 0.7} ${circ}`} />
      </svg>
    </div>
  );
}

/* ---------- Brand mark (tool monogram tile) ---------- */
export function ToolMark({ tool, size = 30 }: { tool: { mark?: D.Mark }; size?: number }) {
  const m = tool.mark || { letters: "?", tint: "#888" };
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.28, flexShrink: 0, display: "grid", placeItems: "center", background: m.tint, color: "#fff", fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: size * 0.36, letterSpacing: "-0.02em", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.12), 0 1px 2px rgba(0,0,0,0.25)" }}>{m.letters}</div>
  );
}

/* ---------- Category dot ---------- */
export function CategoryDot({ cat, size = 7 }: { cat: string; size?: number }) {
  const c = D.CATEGORIES[cat as D.Category];
  return <span style={{ width: size, height: size, borderRadius: 2, background: c?.color || "var(--text-faint)", display: "inline-block", flexShrink: 0 }} />;
}

/* ---------- Badge ---------- */
type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger" | "violet";
interface BadgeProps { children: React.ReactNode; tone?: BadgeTone; soft?: boolean; icon?: string; size?: "sm" | "md"; style?: React.CSSProperties; }
export function Badge({ children, tone = "neutral", soft = true, icon, size = "md", style = {} }: BadgeProps) {
  const tones: Record<BadgeTone, [string, string]> = {
    neutral: ["var(--text-dim)", "var(--panel-2)"],
    accent:  ["var(--accent-text)", "var(--accent-soft)"],
    success: ["var(--success)", "var(--success-soft)"],
    warning: ["var(--warning)", "var(--warning-soft)"],
    danger:  ["var(--danger)", "var(--danger-soft)"],
    violet:  ["var(--violet)", "var(--violet-soft)"],
  };
  const [fg, bg] = tones[tone] || tones.neutral;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: size === "sm" ? "1px 6px" : "2px 8px", borderRadius: 5, fontSize: size === "sm" ? 10.5 : 11.5, fontWeight: 500, lineHeight: 1.3, whiteSpace: "nowrap", color: fg, background: soft ? bg : "transparent", boxShadow: soft ? "none" : `inset 0 0 0 1px ${fg}`, ...style }}>
      {icon && <Icon name={icon} size={size === "sm" ? 11 : 12} />}
      {children}
    </span>
  );
}

/* ---------- Status dot ---------- */
export function StatusDot({ tone = "neutral", pulse = false }: { tone?: string; pulse?: boolean }) {
  const c: Record<string, string> = { ok: "var(--success)", warn: "var(--warning)", danger: "var(--danger)", neutral: "var(--text-faint)", accent: "var(--accent)" };
  const color = c[tone] || "var(--text-faint)";
  return (
    <span style={{ position: "relative", width: 8, height: 8, flexShrink: 0, display: "inline-block" }}>
      <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: color }} />
      {pulse && <span style={{ position: "absolute", inset: -2, borderRadius: "50%", background: color, opacity: 0.3, animation: "stator-pulse 1.6s ease infinite" }} />}
    </span>
  );
}

/* ---------- Button ---------- */
interface ButtonProps { children?: React.ReactNode; variant?: "default" | "primary" | "ghost" | "outline" | "danger"; size?: "sm" | "md" | "lg"; icon?: string; iconRight?: string; full?: boolean; onClick?: () => void; disabled?: boolean; style?: React.CSSProperties; title?: string; }
export function Button({ children, variant = "default", size = "md", icon, iconRight, full, onClick, disabled, style = {}, title }: ButtonProps) {
  const [hov, setHov] = useState(false);
  const sizes: Record<string, [string, number, number]> = { sm: ["6px 9px", 12, 6], md: ["7px 12px", 13, 7], lg: ["10px 16px", 14, 8] };
  const [pad, fs, gap] = sizes[size];
  let bg = "transparent", fg = "var(--text)", bd = "transparent", sh = "none";
  if (variant === "default") { bg = hov ? "var(--hover)" : "var(--panel-2)"; bd = "var(--stator-border)"; }
  if (variant === "primary") { bg = hov ? "var(--accent-hover)" : "var(--accent)"; fg = "#fff"; sh = "0 1px 2px rgba(0,0,0,0.2)"; }
  if (variant === "ghost") { bg = hov ? "var(--hover)" : "transparent"; fg = "var(--text-dim)"; }
  if (variant === "outline") { bg = hov ? "var(--hover)" : "transparent"; bd = "var(--stator-border-2)"; }
  if (variant === "danger") { bg = hov ? "var(--danger)" : "var(--danger-soft)"; fg = hov ? "#fff" : "var(--danger)"; }
  return (
    <button onClick={onClick} disabled={disabled} title={title} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap, padding: pad, fontSize: fs, fontWeight: 500, borderRadius: "var(--stator-radius-sm)", color: fg, background: bg, border: `1px solid ${bd}`, boxShadow: sh, width: full ? "100%" : "auto", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, transition: "background .12s, color .12s", whiteSpace: "nowrap", fontFamily: "inherit", ...style }}>
      {icon && <Icon name={icon} size={fs + 2} />}
      {children}
      {iconRight && <Icon name={iconRight} size={fs + 1} />}
    </button>
  );
}

/* ---------- Icon button ---------- */
export function IconButton({ name, onClick, size = 30, iconSize = 16, active, title }: { name: string; onClick?: (e: React.MouseEvent) => void; size?: number; iconSize?: number; active?: boolean; title?: string; }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} title={title} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ width: size, height: size, display: "grid", placeItems: "center", borderRadius: "var(--stator-radius-sm)", border: "1px solid transparent", background: active || hov ? "var(--hover)" : "transparent", color: active ? "var(--text)" : "var(--text-dim)", flexShrink: 0, transition: "background .12s", fontFamily: "inherit" }}>
      <Icon name={name} size={iconSize} />
    </button>
  );
}

/* ---------- Switch ---------- */
export function Switch({ checked, onChange, size = "md" }: { checked: boolean; onChange: (v: boolean) => void; size?: "sm" | "md"; }) {
  const w = size === "sm" ? 30 : 36, h = size === "sm" ? 18 : 21, knob = h - 6;
  return (
    <button onClick={() => onChange(!checked)} role="switch" aria-checked={checked}
      style={{ width: w, height: h, borderRadius: h, border: "none", padding: 0, position: "relative", background: checked ? "var(--accent)" : "var(--stator-border-2)", transition: "background .18s", flexShrink: 0, cursor: "pointer" }}>
      <span style={{ position: "absolute", top: 3, left: checked ? w - knob - 3 : 3, width: knob, height: knob, borderRadius: "50%", background: "#fff", transition: "left .18s cubic-bezier(.22,1,.36,1)", boxShadow: "0 1px 2px rgba(0,0,0,0.3)", display: "block" }} />
    </button>
  );
}

/* ---------- Segmented control ---------- */
interface SegOption { value: string | number; label: string; }
export function Segmented({ options, value, onChange, size = "md" }: { options: (string | SegOption)[]; value: string | number; onChange: (v: string | number) => void; size?: "sm" | "md"; }) {
  return (
    <div style={{ display: "inline-flex", padding: 2, gap: 2, background: "var(--bg-sunken)", borderRadius: "var(--stator-radius-sm)", border: "1px solid var(--stator-border)" }}>
      {options.map(o => {
        const v = typeof o === "string" || typeof o === "number" ? o : o.value;
        const label = typeof o === "string" || typeof o === "number" ? o : o.label;
        const on = v === value;
        return (
          <button key={String(v)} onClick={() => onChange(v)} style={{ padding: size === "sm" ? "3px 9px" : "4px 11px", fontSize: size === "sm" ? 11.5 : 12.5, fontWeight: 500, borderRadius: 4, border: "none", whiteSpace: "nowrap", background: on ? "var(--panel-2)" : "transparent", color: on ? "var(--text)" : "var(--text-dim)", boxShadow: on ? "0 1px 2px rgba(0,0,0,0.18)" : "none", transition: "background .12s, color .12s", cursor: "pointer", fontFamily: "inherit" }}>{label}</button>
        );
      })}
    </div>
  );
}

/* ---------- Panel / Card ---------- */
interface PanelProps { children?: React.ReactNode; style?: React.CSSProperties; pad?: boolean; onClick?: () => void; className?: string; onMouseEnter?: () => void; onMouseLeave?: () => void; }
export function Panel({ children, style = {}, pad = true, onClick, className = "", onMouseEnter, onMouseLeave }: PanelProps) {
  return (
    <div onClick={onClick} className={className} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}
      style={{ background: "var(--panel)", border: "1px solid var(--stator-border)", borderRadius: "var(--stator-radius)", padding: pad ? "var(--pad-card)" : 0, boxShadow: "var(--shadow)", cursor: onClick ? "pointer" : "default", ...style }}>
      {children}
    </div>
  );
}

export function SectionLabel({ children, right, style = {} }: { children: React.ReactNode; right?: React.ReactNode; style?: React.CSSProperties; }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, ...style }}>
      <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-faint)" }}>{children}</span>
      {right}
    </div>
  );
}

/* ---------- Usage progress bar ---------- */
export function UsageBar({ pct, state = "ok", height = 6 }: { pct: number | null; state?: string; height?: number; }) {
  const color: Record<string, string> = { ok: "var(--accent)", warn: "var(--warning)", critical: "var(--danger)", low: "var(--text-faint)", inactive: "var(--text-faint)", error: "var(--stator-border-2)" };
  return (
    <div style={{ width: "100%", height, borderRadius: height, background: "var(--bg-sunken)", overflow: "hidden" }}>
      <div style={{ width: (pct == null ? 0 : Math.min(100, pct)) + "%", height: "100%", borderRadius: height, background: color[state] || "var(--accent)", transition: "width .5s cubic-bezier(.22,1,.36,1)" }} />
    </div>
  );
}

/* ---------- Sparkline ---------- */
export function Sparkline({ data, w = 120, h = 30, color = "var(--accent)", fill = true, strokeW = 1.6 }: { data: number[]; w?: number; h?: number; color?: string; fill?: boolean; strokeW?: number; }) {
  const { path, area } = useMemo(() => {
    const max = Math.max(...data, 0.001), min = Math.min(...data);
    const rng = max - min || 1;
    const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - 3 - ((v - min) / rng) * (h - 6)]);
    const path = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
    const area = path + ` L${w} ${h} L0 ${h} Z`;
    return { path, area };
  }, [data, w, h]);
  const id = "sg" + Math.random().toString(36).slice(2, 7);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block", overflow: "visible" }}>
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity="0.22" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      {fill && <path d={area} fill={`url(#${id})`} />}
      <path d={path} fill="none" stroke={color} strokeWidth={strokeW} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/* ---------- Area / line chart ---------- */
export function AreaChart({ data, w = 600, h = 180, pad = 28 }: { data: D.SpendPoint[]; w?: number; h?: number; pad?: number; }) {
  const [hi, setHi] = useState<number | null>(null);
  const vals = data.map(d => d.spend);
  const max = Math.max(...vals) * 1.12, min = 0;
  const iw = w - pad * 2, ih = h - pad - 16;
  const x = (i: number) => pad + (i / (data.length - 1)) * iw;
  const y = (v: number) => pad + ih - ((v - min) / (max - min)) * ih;
  const line = data.map((d, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(d.spend).toFixed(1)).join(" ");
  const area = line + ` L${x(data.length - 1)} ${pad + ih} L${x(0)} ${pad + ih} Z`;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(max * f / 100) * 100);
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }} onMouseLeave={() => setHi(null)}>
      <defs><linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--accent)" stopOpacity="0.25" /><stop offset="1" stopColor="var(--accent)" stopOpacity="0" /></linearGradient></defs>
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={pad} x2={w - pad} y1={y(t)} y2={y(t)} stroke="var(--stator-border)" strokeWidth="1" strokeDasharray={i === 0 ? "0" : "2 4"} />
          <text x={pad - 6} y={y(t) + 3} textAnchor="end" fontSize="10" fill="var(--text-faint)" fontFamily="var(--font-mono)">{t >= 1000 ? (t / 1000) + "k" : t}</text>
        </g>
      ))}
      <path d={area} fill="url(#areaGrad)" />
      <path d={line} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" />
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(d.spend)} r={hi === i ? 4.5 : 3} fill={d.partial ? "var(--bg)" : "var(--accent)"} stroke="var(--accent)" strokeWidth="2" />
          <text x={x(i)} y={h - 2} textAnchor="middle" fontSize="10.5" fill={hi === i ? "var(--text)" : "var(--text-faint)"} fontFamily="var(--font-mono)">{d.month}</text>
          <rect x={x(i) - iw / data.length / 2} y={pad} width={iw / data.length} height={ih} fill="transparent" onMouseEnter={() => setHi(i)} />
          {hi === i && (
            <g style={{ pointerEvents: "none" }}>
              <rect x={x(i) - 34} y={y(d.spend) - 30} width="68" height="20" rx="4" fill="var(--panel-2)" stroke="var(--stator-border-2)" />
              <text x={x(i)} y={y(d.spend) - 16} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--text)" fontFamily="var(--font-mono)">{D.fmtMoney(d.spend, 0)}{d.partial ? " MTD" : ""}</text>
            </g>
          )}
        </g>
      ))}
    </svg>
  );
}

/* ---------- Horizontal category bars ---------- */
export function CategoryBars({ byCat }: { byCat: Record<string, number>; total?: number; }) {
  const rows = Object.entries(byCat).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...rows.map(r => r[1]));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
      {rows.map(([cat, v]) => {
        const c = D.CATEGORIES[cat as D.Category];
        return (
          <div key={cat} style={{ display: "grid", gridTemplateColumns: "92px 1fr 64px", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "var(--text-dim)" }}><CategoryDot cat={cat} /> {c?.short}</div>
            <div style={{ height: 8, borderRadius: 4, background: "var(--bg-sunken)", overflow: "hidden" }}>
              <div style={{ width: (v / max * 100) + "%", height: "100%", background: c?.color, borderRadius: 4, transition: "width .5s cubic-bezier(.22,1,.36,1)" }} />
            </div>
            <div className="mono tnum" style={{ fontSize: 12, textAlign: "right", color: "var(--text)" }}>{D.fmtMoney(v, 0)}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Donut ---------- */
export function Donut({ segments, size = 120, thickness = 16, center }: { segments: { value: number; color: string }[]; size?: number; thickness?: number; center?: React.ReactNode; }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = (size - thickness) / 2, c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-sunken)" strokeWidth={thickness} />
        {segments.map((s, i) => {
          const len = (s.value / total) * c;
          const el = <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color} strokeWidth={thickness} strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset} strokeLinecap="butt" style={{ transition: "stroke-dasharray .6s" }} />;
          offset += len;
          return el;
        })}
      </svg>
      {center && <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>{center}</div>}
    </div>
  );
}

/* ---------- KPI tile ---------- */
export function KPI({ label, value, sub, delta, icon, accent, deltaInvert, children }: { label: string; value: string | number; sub?: string; delta?: number; icon?: string; accent?: string; deltaInvert?: boolean; children?: React.ReactNode; }) {
  const ac = accent || "var(--text-faint)";
  const good = deltaInvert ? (delta || 0) < 0 : (delta || 0) >= 0;
  return (
    <Panel style={{ display: "flex", flexDirection: "column", gap: 11, position: "relative", overflow: "hidden" }}>
      <span style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${ac}, transparent 70%)`, opacity: 0.5 }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11.5, color: "var(--text-dim)", fontWeight: 500, letterSpacing: "0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
        {icon && <span style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0, display: "grid", placeItems: "center", color: ac, background: `color-mix(in oklch, ${ac} 13%, transparent)` }}><Icon name={icon} size={14} /></span>}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "nowrap" }}>
        <span className="mono tnum" style={{ fontSize: 27, fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1 }}>{value}</span>
        {delta != null && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 1, fontSize: 11.5, fontWeight: 600, padding: "2px 6px 2px 4px", borderRadius: 20, color: good ? "var(--success)" : "var(--danger)", background: good ? "var(--success-soft)" : "var(--danger-soft)" }}>
            <Icon name={delta >= 0 ? "arrowUp" : "arrowDown"} size={12} />{Math.abs(Math.round(delta * 100))}%
          </span>
        )}
      </div>
      {sub && <span style={{ fontSize: 11.5, color: "var(--text-faint)" }}>{sub}</span>}
      {children}
    </Panel>
  );
}

/* ---------- Avatar ---------- */
export function Avatar({ name, size = 26 }: { name: string; size?: number }) {
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("");
  const hue = (name.charCodeAt(0) * 47) % 360;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center", fontSize: size * 0.38, fontWeight: 600, background: `oklch(0.5 0.12 ${hue})`, color: "#fff", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.12)" }}>{initials}</div>
  );
}

/* ---------- Modal ---------- */
interface ModalProps { open: boolean; onClose: () => void; children?: React.ReactNode; width?: number; title?: React.ReactNode; sub?: string; footer?: React.ReactNode; pad?: boolean; }
export function Modal({ open, onClose, children, width = 480, title, sub, footer, pad = true }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200, display: "grid", placeItems: "center", background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)", animation: "stator-fadeInBg .15s ease", padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ width, maxWidth: "100%", maxHeight: "90vh", display: "flex", flexDirection: "column", background: "var(--panel)", border: "1px solid var(--stator-border-2)", borderRadius: "var(--stator-radius-lg)", boxShadow: "var(--shadow-lg)", animation: "stator-scaleIn .2s cubic-bezier(.22,1,.36,1)", overflow: "hidden" }}>
        {title && (
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "16px 18px", borderBottom: "1px solid var(--stator-border)" }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{title}</div>
              {sub && <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 2 }}>{sub}</div>}
            </div>
            <IconButton name="x" onClick={onClose} />
          </div>
        )}
        <div style={{ overflow: "auto", padding: pad ? 18 : 0, flex: 1 }}>{children}</div>
        {footer && <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", padding: "13px 18px", borderTop: "1px solid var(--stator-border)", background: "var(--bg-sunken)" }}>{footer}</div>}
      </div>
    </div>
  );
}

/* ---------- Drawer ---------- */
interface DrawerProps { open: boolean; onClose: () => void; children?: React.ReactNode; width?: number; title?: React.ReactNode; sub?: string | null; footer?: React.ReactNode; }
export function Drawer({ open, onClose, children, width = 460, title, sub, footer }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)", animation: "stator-fadeInBg .15s ease" }}>
      <div onClick={e => e.stopPropagation()} style={{ position: "absolute", top: 0, right: 0, bottom: 0, width, maxWidth: "100%", background: "var(--panel)", borderLeft: "1px solid var(--stator-border-2)", boxShadow: "var(--shadow-lg)", display: "flex", flexDirection: "column", animation: "stator-drawerIn .26s cubic-bezier(.22,1,.36,1)" }}>
        {title && (
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--stator-border)" }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{title}</div>
              {sub && <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 2 }}>{sub}</div>}
            </div>
            <IconButton name="x" onClick={onClose} />
          </div>
        )}
        <div style={{ overflow: "auto", padding: 20, flex: 1 }}>{children}</div>
        {footer && <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", padding: "14px 20px", borderTop: "1px solid var(--stator-border)", background: "var(--bg-sunken)" }}>{footer}</div>}
      </div>
    </div>
  );
}

/* ---------- Field primitives ---------- */
export function Field({ label, hint, children, required }: { label: string; hint?: string; children?: React.ReactNode; required?: boolean; }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-dim)" }}>{label}{required && <span style={{ color: "var(--danger)" }}> *</span>}</span>
      {children}
      {hint && <span style={{ fontSize: 11, color: "var(--text-faint)" }}>{hint}</span>}
    </label>
  );
}

export const inputStyle: React.CSSProperties = { width: "100%", padding: "8px 10px", fontSize: 13, color: "var(--text)", background: "var(--bg-sunken)", border: "1px solid var(--stator-border-2)", borderRadius: "var(--stator-radius-sm)", outline: "none", fontFamily: "inherit" };

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [foc, setFoc] = useState(false);
  return <input {...props} onFocus={e => { setFoc(true); props.onFocus?.(e); }} onBlur={e => { setFoc(false); props.onBlur?.(e); }}
    style={{ ...inputStyle, borderColor: foc ? "var(--accent)" : "var(--stator-border-2)", boxShadow: foc ? "0 0 0 3px var(--accent-soft)" : "none", ...props.style }} />;
}

export function SelectInput({ options, value, onChange, style }: { options: ({ value: string; label: string } | string)[]; value: string; onChange: (v: string) => void; style?: React.CSSProperties; }) {
  return (
    <div style={{ position: "relative" }}>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ ...inputStyle, appearance: "none", paddingRight: 28, cursor: "pointer", ...style }}>
        {options.map(o => { const v = typeof o === "string" ? o : o.value; const l = typeof o === "string" ? o : o.label; return <option key={v} value={v}>{l}</option>; })}
      </select>
      <span style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-faint)" }}><Icon name="chevDown" size={14} /></span>
    </div>
  );
}

/* ---------- Empty state ---------- */
export function EmptyState({ icon, title, sub, action }: { icon: string; title: string; sub?: string; action?: React.ReactNode; }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: "44px 20px", textAlign: "center" }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, display: "grid", placeItems: "center", background: "var(--panel-2)", color: "var(--text-faint)" }}><Icon name={icon} size={20} /></div>
      <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
      {sub && <div style={{ fontSize: 12.5, color: "var(--text-faint)", maxWidth: 280 }}>{sub}</div>}
      {action}
    </div>
  );
}

/* ---------- Toast host ---------- */
interface Toast { id: number; msg: string; tone?: string; icon?: string; }
export function ToastHost({ toasts }: { toasts: Toast[] }) {
  return (
    <div style={{ position: "fixed", bottom: 18, left: "50%", transform: "translateX(-50%)", zIndex: 400, display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
      {toasts.map(t => (
        <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "var(--panel-2)", border: "1px solid var(--stator-border-2)", borderRadius: 8, boxShadow: "var(--shadow-lg)", fontSize: 13, animation: "stator-slideUp .25s cubic-bezier(.22,1,.36,1)", minWidth: 240 }}>
          <span style={{ color: t.tone === "danger" ? "var(--danger)" : t.tone === "success" ? "var(--success)" : "var(--accent)" }}>
            <Icon name={t.icon || (t.tone === "success" ? "checkCircle" : t.tone === "danger" ? "alert" : "info")} size={16} />
          </span>
          <span style={{ flex: 1 }}>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------- Trigger label helper ---------- */
export const TRIGGER_META: Record<string, { label: string; icon: string; tone: string; desc: (r: { thresholdPercent?: number | null; unusedDays?: number | null }) => string }> = {
  threshold_high: { label: "Usage high",  icon: "trend",     tone: "danger",  desc: r => `Fires at ${r.thresholdPercent}% used` },
  threshold_low:  { label: "Underused",   icon: "trendDown", tone: "warning", desc: r => `Fires when under ${r.thresholdPercent}% used` },
  unused:         { label: "Inactive",    icon: "pause",     tone: "neutral", desc: r => `No use for ${r.unusedDays} days` },
};

/* ---------- Tool row card ---------- */
export function ToolCard({ tool, onClick }: { tool: D.Tool; onClick?: () => void; }) {
  const [hov, setHov] = useState(false);
  const pct = D.usagePct(tool);
  const state = D.usageState(tool);
  const rules = (D.RULE_BY_TOOL[tool.id] || []).filter(r => r.active);
  const stateBadge: Record<string, [BadgeTone, string]> = {
    critical: ["danger", "Critical"], warn: ["warning", "Near limit"], low: ["neutral", "Underused"],
    inactive: ["neutral", "Inactive"], error: ["danger", tool.syncStatus === "never_synced" ? "Never synced" : "Sync error"], ok: ["success", "Healthy"],
  };
  const [badgeTone, badgeLabel] = stateBadge[state] || ["neutral", "Unknown"];
  const renew = D.daysUntil(tool.renewalDate);
  return (
    <Panel onClick={onClick} pad={false} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ padding: "var(--pad-card)", display: "flex", flexDirection: "column", gap: 12, borderColor: hov ? "var(--stator-border-2)" : "var(--stator-border)", transform: hov && onClick ? "translateY(-1px)" : "none", transition: "transform .12s, border-color .12s" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <ToolMark tool={tool} size={32} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>{tool.name}</span>
            {tool.syncType === "manual" && <Badge tone="neutral" size="sm">manual</Badge>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "var(--text-faint)", marginTop: 1 }}>
            <CategoryDot cat={tool.category} size={6} /> {D.CATEGORIES[tool.category]?.short}
            <span style={{ opacity: 0.4 }}>·</span>
            {D.fmtMoney(tool.costToDate, 0)}/mo
          </div>
        </div>
        <Badge tone={badgeTone}>{badgeLabel}</Badge>
      </div>
      {state !== "error" && pct != null ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 11.5 }}>
            <span className="mono" style={{ color: "var(--text-dim)" }}>{D.fmtNum(tool.creditsUsed)} / {D.fmtNum(tool.creditLimit)} {tool.unit}</span>
            <span className="mono tnum" style={{ fontWeight: 600, color: state === "critical" ? "var(--danger)" : state === "warn" ? "var(--warning)" : "var(--text)" }}>{pct}%</span>
          </div>
          <UsageBar pct={pct} state={state} />
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 9px", borderRadius: 6, background: "var(--danger-soft)", color: "var(--danger)", fontSize: 11.5 }}>
          <Icon name="alert" size={13} /> {tool.syncStatus === "never_synced" ? "Awaiting first sync" : "Last sync failed — using cached data"}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, color: "var(--text-faint)", paddingTop: 2, borderTop: "1px solid var(--stator-border)" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name="calendar" size={12} /> Renews {renew <= 0 ? "today" : "in " + renew + "d"}</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          {rules.length > 0 ? <><Icon name="bell" size={12} /> {rules.length} rule{rules.length > 1 ? "s" : ""}</> : tool.syncType === "api" ? <><Icon name="refresh" size={12} /> {D.relTime(tool.lastSyncedAt) || "—"}</> : "manual entry"}
        </span>
      </div>
    </Panel>
  );
}

/* ---------- Page header ---------- */
export function PageHeader({ title, sub, actions }: { title: string; sub?: string; actions?: React.ReactNode; }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
      <div>
        <h1 style={{ fontSize: 21, fontWeight: 600, letterSpacing: "-0.02em" }}>{title}</h1>
        {sub && <p style={{ fontSize: 13, color: "var(--text-faint)", marginTop: 3 }}>{sub}</p>}
      </div>
      {actions && <div style={{ display: "flex", gap: 8, alignItems: "center" }}>{actions}</div>}
    </div>
  );
}

export type { Toast };
export { Icon };
