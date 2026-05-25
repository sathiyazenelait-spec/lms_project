import { useState } from "react";
import { T } from "../../assets/styles/theme";

// ─── BUTTON ───────────────────────────────────────────────────────────────────
export const Btn = ({ children, variant = "primary", size = "md", onClick, style = {}, full = false }) => {
  const styles = {
    primary: { background: `linear-gradient(135deg, ${T.primary}, ${T.primaryL})`, color: "#fff", border: "none" },
    accent: { background: `linear-gradient(135deg, ${T.accent}, #0EA5E9)`, color: "#fff", border: "none" },
    ghost: { background: "transparent", color: T.text, border: `1.5px solid ${T.border}` },
    danger: { background: `linear-gradient(135deg, ${T.accentR}, #DC2626)`, color: "#fff", border: "none" },
    success: { background: `linear-gradient(135deg, ${T.accentG}, #059669)`, color: "#fff", border: "none" },
    warning: { background: `linear-gradient(135deg, ${T.accentY}, #D97706)`, color: "#fff", border: "none" },
    dark: { background: T.bg3, color: T.text, border: `1.5px solid ${T.border}` },
    info: { background: `linear-gradient(135deg, ${T.accent}, #0284C7)`, color: "#fff", border: "none" },
  };
  const sizes = {
    xs: { padding: "4px 10px", fontSize: 11, borderRadius: 6 },
    sm: { padding: "6px 14px", fontSize: 12, borderRadius: 7 },
    md: { padding: "9px 20px", fontSize: 13, borderRadius: 9 },
    lg: { padding: "13px 32px", fontSize: 15, borderRadius: 11 },
    xl: { padding: "16px 40px", fontSize: 16, borderRadius: 13 },
  };
  return (
    <button
      onClick={onClick}
      style={{
        ...styles[variant], ...sizes[size],
        fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
        transition: "all .2s", width: full ? "100%" : "auto", justifyContent: full ? "center" : "flex-start",
        whiteSpace: "nowrap", ...style
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.filter = "brightness(1.1)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.filter = ""; }}
    >{children}</button>
  );
};

// ─── CARD ─────────────────────────────────────────────────────────────────────
export const Card = ({ children, style = {}, hover = true }) => (
  <div
    style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20, transition: "all .3s", ...style }}
    onMouseEnter={hover ? e => { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.boxShadow = `0 8px 32px rgba(124,58,237,.18)`; } : undefined}
    onMouseLeave={hover ? e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = "none"; } : undefined}
  >{children}</div>
);

// ─── INPUT ────────────────────────────────────────────────────────────────────
export const Input = ({ label, type = "text", placeholder, value, onChange, style = {}, ...props }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>{label}</label>}
    <input
      type={type} placeholder={placeholder} value={value} onChange={onChange}
      style={{ width: "100%", background: T.bg3, border: `1.5px solid ${T.border}`, borderRadius: 9, padding: "10px 14px", fontSize: 13, color: T.text, outline: "none", transition: "all .2s", ...style }}
      onFocus={e => { e.target.style.borderColor = T.primary; e.target.style.boxShadow = `0 0 0 3px rgba(124,58,237,.15)`; }}
      onBlur={e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = "none"; }}
      {...props}
    />
  </div>
);

// ─── SELECT ───────────────────────────────────────────────────────────────────
export const Select = ({ label, options = [], value, onChange }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>{label}</label>}
    <select
      value={value} onChange={onChange}
      style={{ width: "100%", background: T.bg3, border: `1.5px solid ${T.border}`, borderRadius: 9, padding: "10px 14px", fontSize: 13, color: T.text, outline: "none" }}
    >
      {options.map((o, i) => {
        // Handle BOTH string options AND {value, label} object options safely
        const val = (o !== null && typeof o === "object") ? o.value : o;
        const lbl = (o !== null && typeof o === "object") ? o.label : o;
        return (
          <option key={val ?? i} value={val ?? ""}>
            {String(lbl ?? "")}
          </option>
        );
      })}
    </select>
  </div>
);

// ─── BADGE ────────────────────────────────────────────────────────────────────
export const Badge = ({ children, type = "primary" }) => {
  const colors = {
    primary: { bg: "rgba(124,58,237,.18)", color: T.primaryL },
    success: { bg: "rgba(16,185,129,.15)", color: T.accentG },
    warning: { bg: "rgba(245,158,11,.15)", color: T.accentY },
    danger: { bg: "rgba(239,68,68,.15)", color: T.accentR },
    info: { bg: "rgba(6,182,212,.15)", color: T.accent },
    muted: { bg: "rgba(124,111,170,.12)", color: T.muted },
  };
  return (
    <span style={{ ...colors[type], padding: "3px 10px", borderRadius: 50, fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>{children}</span>
  );
};

// ─── AVATAR ───────────────────────────────────────────────────────────────────
export const Avatar = ({ name = "U", size = 36, color = T.primary, src }) => (
  src ? (
    <img
      src={src}
      alt={name}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        objectFit: "cover",
        flexShrink: 0,
        border: `1.5px solid ${color}`
      }}
    />
  ) : (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `linear-gradient(135deg, ${color}, ${T.accent})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * .38, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
      {(name || "U")[0].toUpperCase()}
    </div>
  )
);

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────────
export const ProgressBar = ({ value, color = T.primary, height = 6 }) => (
  <div style={{ height, background: T.bg3, borderRadius: 50, overflow: "hidden" }}>
    <div style={{ height: "100%", width: `${value}%`, background: `linear-gradient(90deg, ${color}, ${T.accent})`, borderRadius: 50, transition: "width 1s ease" }} />
  </div>
);

// ─── STAT CARD ────────────────────────────────────────────────────────────────
export const StatCard = ({ icon, label, value, change, color = T.primaryL }) => (
  <Card style={{ display: "flex", alignItems: "center", gap: 16 }}>
    <div style={{ width: 52, height: 52, borderRadius: 13, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>{icon}</div>
    <div>
      <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: .8 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1.2, fontFamily: "Syne" }}>{value}</div>
      {change && <div style={{ fontSize: 11, color: T.accentG, fontWeight: 600 }}>{change}</div>}
    </div>
  </Card>
);

// ─── TABLE ────────────────────────────────────────────────────────────────────
export const Table = ({ columns, rows = [], pageSize = 20 }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(rows.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRows = rows.slice(startIndex, startIndex + pageSize);

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>{columns.map(c => <th key={c} style={{ textAlign: "left", fontSize: 10, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 1, padding: "10px 14px", borderBottom: `1px solid ${T.border}` }}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {paginatedRows.length === 0 ? (
            <tr><td colSpan={columns.length} style={{ padding: "11px 14px", fontSize: 13, textAlign: "center", color: T.muted }}>No records found.</td></tr>
          ) : (
            paginatedRows.map((row, i) => (
              <tr key={i}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(124,58,237,.05)"}
                onMouseLeave={e => e.currentTarget.style.background = "none"}
              >
                {row.map((cell, j) => <td key={j} style={{ padding: "11px 14px", fontSize: 13, borderBottom: `1px solid rgba(45,33,96,.4)` }}>{cell}</td>)}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px", borderTop: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 12, color: T.muted }}>
            Showing {startIndex + 1} to {Math.min(startIndex + pageSize, rows.length)} of {rows.length} records
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn size="xs" variant="ghost" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>
              ← Prev
            </Btn>
            <div style={{ fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", padding: "0 8px" }}>
              Page {currentPage} of {totalPages}
            </div>
            <Btn size="xs" variant="ghost" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>
              Next →
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── TABS ─────────────────────────────────────────────────────────────────────
export const Tabs = ({ tabs, active, onChange }) => (
  <div style={{ display: "flex", gap: 4, background: T.bg3, padding: 4, borderRadius: 10, marginBottom: 20 }}>
    {tabs.map(t => (
      <button key={t} onClick={() => onChange(t)}
        style={{ flex: 1, padding: "8px 14px", borderRadius: 7, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all .2s", background: active === t ? T.primary : "transparent", color: active === t ? "#fff" : T.muted }}
      >{t}</button>
    ))}
  </div>
);

// ─── MODAL ────────────────────────────────────────────────────────────────────
export const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,.65)",
        zIndex: 9999,
        display: "flex",
        alignItems: "flex-start",       // ← was "center", now starts from top
        justifyContent: "center",
        backdropFilter: "blur(6px)",
        animation: "fadeIn .3s ease",
        overflowY: "auto",              // ← outer scroll so modal never clips
        padding: "40px 16px 40px", 
        height:"fit-content"     // ← top/bottom breathing room
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: T.card,
          border: `1px solid ${T.border}`,
          borderRadius: 18,
          padding: 32,
          width: "90%",
             // ← wide prop for bigger modals
          position: "relative",
          animation: "zoomCard .3s ease",
          // No maxHeight — let content breathe; outer div scrolls instead
          flexShrink: 0,                // ← prevents squishing in flex container
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 14, right: 14,
            width: 30, height: 30,
            border: `1px solid ${T.border}`,
            borderRadius: "50%",
            background: T.bg3,
            cursor: "pointer",
            color: T.muted,
            fontSize: 16,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >✕</button>
        <h3 style={{ fontSize: 20, fontWeight: 800, fontFamily: "Syne", marginBottom: 20 }}>{title}</h3>
        {children}
      </div>
    </div>
  );
};

// ─── DONUT CHART ──────────────────────────────────────────────────────────────
export const DonutChart = ({ pct, color = T.primary, size = 110, label = "" }) => {
  const r = 44, circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div style={{ position: "relative", width: size, height: size, margin: "0 auto" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={T.bg3} strokeWidth={10} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={10} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 20, fontWeight: 800, color, fontFamily: "Syne" }}>{pct}%</div>
        {label && <div style={{ fontSize: 10, color: T.muted }}>{label}</div>}
      </div>
    </div>
  );
};

// ─── MINI BAR CHART ───────────────────────────────────────────────────────────
export const MiniBarChart = ({ data, color = T.primary }) => (
  <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 56 }}>
    {data.map((v, i) => (
      <div key={i}
        style={{ flex: 1, borderRadius: "4px 4px 0 0", background: `linear-gradient(180deg, ${color}, ${T.primaryD})`, height: `${v}%`, minHeight: 4, transition: "height .8s ease", cursor: "pointer" }}
        onMouseEnter={e => e.target.style.filter = "brightness(1.3)"}
        onMouseLeave={e => e.target.style.filter = ""}
      />
    ))}
  </div>
);

// ─── PAGE HEADER ──────────────────────────────────────────────────────────────
export const PageHeader = ({ title, subtitle, actions }) => (
  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 900, fontFamily: "Syne", lineHeight: 1.2 }}>{title}</h1>
      {subtitle && <p style={{ fontSize: 13, color: T.muted, marginTop: 4 }}>{subtitle}</p>}
    </div>
    {actions && <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>{actions}</div>}
  </div>
);

// ─── PROFILE ALERT ────────────────────────────────────────────────────────────
const PROFILE_FIELDS = {
  admin: [
    { key: "name",         label: "Full Name",     weight: 20 },
    { key: "email",        label: "Email",          weight: 20 },
    { key: "phone",        label: "Mobile Number",  weight: 15 },
    { key: "address",      label: "Address",        weight: 15 },
    { key: "academyName",  label: "Academy Name",   weight: 20 },
    { key: "profilePicUrl",label: "Profile Photo",  weight: 10 },
  ],
  student: [
    { key: "name",         label: "Full Name",     weight: 20 },
    { key: "email",        label: "Email",          weight: 20 },
    { key: "phone",        label: "Mobile Number",  weight: 15 },
    { key: "address",      label: "Address",        weight: 15 },
    { key: "department",   label: "Department",     weight: 15 },
    { key: "profilePicUrl",label: "Profile Photo",  weight: 15 },
  ],
  teacher: [
    { key: "name",         label: "Full Name",     weight: 20 },
    { key: "email",        label: "Email",          weight: 20 },
    { key: "phone",        label: "Mobile Number",  weight: 15 },
    { key: "address",      label: "Address",        weight: 15 },
    { key: "department",   label: "Department",     weight: 15 },
    { key: "profilePicUrl",label: "Profile Photo",  weight: 15 },
  ],
  parent: [
    { key: "name",         label: "Full Name",     weight: 25 },
    { key: "email",        label: "Email",          weight: 25 },
    { key: "phone",        label: "Mobile Number",  weight: 25 },
    { key: "address",      label: "Address",        weight: 25 },
  ],
};

export const calcProfileCompletion = (role, profileData) => {
  const fields = PROFILE_FIELDS[role] || PROFILE_FIELDS.admin;
  let earned = 0;
  const missing = [];
  fields.forEach(({ key, label, weight }) => {
    const val = profileData?.[key];
    if (val && String(val).trim().length > 0) {
      earned += weight;
    } else {
      missing.push(label);
    }
  });
  return { pct: Math.min(100, earned), missing };
};

// ─── PROFILE ALERT ────────────────────────────────────────────────────────────
export const ProfileAlert = ({ pct, missing = [], onComplete }) => {
  if (pct >= 100) return null;

  const barColor =
    pct < 40 ? T.accentR :
    pct < 70 ? T.accentY : T.accentG;

  const urgency =
    pct < 40 ? { bg:"rgba(239,68,68,.08)",  border:"rgba(239,68,68,.3)",  icon:"🚨", label:"Incomplete"       } :
    pct < 70 ? { bg:"rgba(245,158,11,.08)", border:"rgba(245,158,11,.3)", icon:"⚠️", label:"Almost There"     } :
               { bg:"rgba(16,185,129,.08)", border:"rgba(16,185,129,.3)", icon:"✅", label:"Nearly Complete"  };

  return (
    <div style={{
      background: `linear-gradient(135deg, ${urgency.bg}, rgba(124,58,237,.05))`,
      border: `1px solid ${urgency.border}`,
      borderRadius: 14, padding: "16px 20px", marginBottom: 24,
    }}>
      {/* Top row */}
      <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:10 }}>
        <div style={{ fontSize:24, flexShrink:0 }}>{urgency.icon}</div>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:700, fontSize:14, color:barColor }}>
            Profile {pct}% Complete — {pct < 80 ? "Need 80% to Access All Features" : "Almost there!"}
          </div>
          <div style={{ fontSize:12, color:T.muted, marginTop:2 }}>
            Complete your profile to unlock the full dashboard experience.
          </div>
        </div>
        <div style={{ textAlign:"right", flexShrink:0 }}>
          <div style={{ fontFamily:"Syne", fontSize:22, fontWeight:900, color:barColor }}>{pct}%</div>
          <div style={{ fontSize:10, color:T.muted }}>{urgency.label}</div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height:6, background:"rgba(255,255,255,.08)", borderRadius:50, overflow:"hidden", marginBottom:10 }}>
        <div style={{
          height:"100%", width:`${pct}%`,
          background:`linear-gradient(90deg, ${barColor}, ${barColor}99)`,
          borderRadius:50, transition:"width 1s ease",
        }} />
      </div>

      {/* Missing field chips */}
      {missing.length > 0 && (
        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:10 }}>
          <span style={{ fontSize:11, color:T.muted, fontWeight:600 }}>Missing:</span>
          {missing.map(field => (
            <span key={field} style={{
              fontSize:10, fontWeight:700,
              background:"rgba(239,68,68,.12)", color:T.accentR,
              border:"1px solid rgba(239,68,68,.2)",
              borderRadius:50, padding:"2px 10px",
            }}>{field}</span>
          ))}
        </div>
      )}

      <Btn variant="warning" size="sm" onClick={onComplete}>Complete Now →</Btn>
    </div>
  );
};
