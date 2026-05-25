// src/pages/Auth/LoginPage.jsx
import { useState, useEffect } from "react";
import { T } from "../../assets/styles/theme";
import { Btn, Modal, Input, Select } from "../../components/UI";
import { login, registerUser, getActiveDepartments, getOrganizations } from "../../api/auth";

// ─── ROLE LOGIN CARDS ─────────────────────────────────────────────────────────
const ROLES = [
  { key: "student", icon: "👨‍🎓", label: "Student", sub: "Access courses, assignments & performance", color: T.accent,  bg: "linear-gradient(135deg,#011F2B,#02485E)" },
  { key: "teacher", icon: "👨‍🏫", label: "Teacher", sub: "Manage courses, students & classes",       color: T.accentG, bg: "linear-gradient(135deg,#001A0E,#01321A)" },
  { key: "parent",  icon: "👨‍👩‍👦", label: "Parent",  sub: "Track your child's progress & fees",       color: T.accentR, bg: "linear-gradient(135deg,#1A0005,#2D0010)" },
  { key: "admin",   icon: "🛡️",  label: "Admin",   sub: "Full system control & analytics",           color: T.accentY, bg: "linear-gradient(135deg,#1A1200,#2D2000)" },
];

// ─── INLINE STYLES ─────────────────────────────────────────────────────────────
const injectStyles = () => {
  if (document.getElementById("lms-login-styles")) return;
  const style = document.createElement("style");
  style.id = "lms-login-styles";
  style.textContent = `
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .lms-card-form { animation: fadeUp .35s ease; }

    /* ── Mobile dropdown ── */
    .lms-mobile-select {
      width: 100%;
      background: rgba(255,255,255,.07);
      border: 1.5px solid rgba(255,255,255,.15);
      color: #fff;
      padding: 13px 16px;
      border-radius: 12px;
      font-size: 15px;
      font-family: 'DM Sans', sans-serif;
      outline: none;
      cursor: pointer;
      appearance: none;
      -webkit-appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='rgba(255,255,255,0.5)' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 14px center;
    }
    .lms-mobile-select option { background: #1a1030; color: #fff; }

    .lms-card-input {
      width: 100%;
      background: rgba(255,255,255,.08);
      border: 1.5px solid rgba(255,255,255,.15);
      border-radius: 9px;
      padding: 11px 14px;
      font-size: 13px;
      color: #fff;
      outline: none;
      font-family: 'DM Sans', sans-serif;
      box-sizing: border-box;
    }
    .lms-card-input::placeholder { color: rgba(255,255,255,.35); }
  `;
  document.head.appendChild(style);
};

// ─── REGISTRATION MODAL ───────────────────────────────────────────────────────
const RegModal = ({ role, onClose, onSuccess }) => {
  const [form, setForm]     = useState({});
  const [depts, setDepts]   = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingDepts, setLoadingDepts] = useState(false);

  useEffect(() => {
    getOrganizations()
      .then(d => setOrgs(Array.isArray(d) ? d : []))
      .catch(console.error);
  }, []);

  const f   = (key) => form[key] || "";
  
  // Custom setter that fetches departments when organizationName changes
  const handleFieldChange = (key) => (e) => {
    const val = e.target.value;
    setForm(prev => ({ ...prev, [key]: val }));

    if (key === "organizationName") {
      if (role === "student" || role === "teacher") {
        // Find the organization object to get its ID
        const selectedOrg = orgs.find(o => o.name === val);
        if (selectedOrg) {
          setLoadingDepts(true);
          // We import and use getActiveDepartmentsByOrg
          import("../../api/auth").then(({ getActiveDepartmentsByOrg }) => {
            getActiveDepartmentsByOrg(selectedOrg.id)
              .then(d => {
                setDepts(Array.isArray(d) ? d : []);
                setForm(prev => ({ ...prev, department: "" })); // reset department selection
              })
              .catch(err => {
                console.error(err);
                setDepts([]);
              })
              .finally(() => setLoadingDepts(false));
          });
        } else {
          setDepts([]);
          setForm(prev => ({ ...prev, department: "" }));
        }
      }
    }
  };

  const handleSubmit = async () => {
    const password = f("password");
    const confirm  = f("confirm");
    if (password !== confirm) { alert("Passwords do not match!"); return; }
    if (password.length < 8)  { alert("Password must be at least 8 characters."); return; }

    const base = { name: f("name"), email: f("email"), password, role: role.toUpperCase() };
    let extra = {};
    if (role === "student" || role === "teacher")
      extra = { department: f("department"), gender: f("gender") || null, phone: f("phone") || null,organizationName: f("organizationName") || null };
    if(role === "parent")
      extra = { organizationName: f("organizationName") || null };
    if (role === "teacher")
      extra = { ...extra, qualification: f("qualification") || null ,organizationName: f("organizationName") || null};
    if (role === "admin")
      extra = { academyName: f("academyName"), referralId: f("referralId"), gender: f("gender") || null };

    try {
      setLoading(true);
      const auth = await registerUser({ ...base, ...extra });
      if (auth?.emailWarnings?.length > 0) {
        const cantReach = auth.emailWarnings.filter(w => w.startsWith("Can't reach"));
        const failed    = auth.emailWarnings.filter(w => w.startsWith("Failed to send"));
        if (cantReach.length > 0)
          alert("✅ Account created!\n\n⚠️ Some emails couldn't be delivered:\n" + cantReach.map(w => "  • " + w).join("\n"));
        else if (failed.length > 0)
          alert("✅ Account created!\n\n❌ Some emails failed:\n" + failed.map(w => "  • " + w).join("\n"));
      }
      onSuccess(auth);
    } catch (err) {
      alert(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const title = role.charAt(0).toUpperCase() + role.slice(1) + " Registration";
  return (
    <Modal open title={title} onClose={onClose}>
      <p style={{ fontSize: 12, color: T.muted, marginBottom: 16 }}>
        {role === "admin"
          ? "⚠️ Admin registration requires a valid referral from an existing Super Admin."
          : "Create your account to get started."}
      </p>
      <Input label={`${title.replace(" Registration", "")} Name *`} value={f("name")} onChange={handleFieldChange("name")} placeholder="Full name" />
      {role === "admin" && <Input label="Academy Name *"   value={f("academyName")}   onChange={handleFieldChange("academyName")}   placeholder="Academy / Institute name" />}
      {role === "admin" && <Input label="Referral ID *"    value={f("referralId")}    onChange={handleFieldChange("referralId")}    placeholder="Super Admin referral ID" />}
      {role === "teacher" && <Input label="Qualification" value={f("qualification")} onChange={handleFieldChange("qualification")} placeholder="e.g. M.Tech, PhD" />}
      
      {(role === "student" || role === "teacher" || role ==="parent") && (
        <Select label="Organization *" value={f("organizationName")} onChange={handleFieldChange("organizationName")}
          options={[
            { value: "", label: orgs.length === 0 ? "Loading organizations…" : "-- Select Organization --" },
            ...orgs.map(o => ({ value: o.name, label: o.name })),
          ]}
        />
      )}

      {(role === "student" || role === "teacher") && (
        <Select label="Department *" value={f("department")} onChange={handleFieldChange("department")}
          disabled={!f("organizationName") || loadingDepts}
          options={[
            { value: "", label: !f("organizationName") ? "-- Select Organization First --" : loadingDepts ? "Loading departments…" : depts.length === 0 ? "No departments found for this organization" : "-- Select Department --" },
            ...depts.map(d => ({ value: d.name, label: d.name })),
          ]}
        />
      )}

      {(role === "student" || role === "teacher" || role === "admin") && (
        <Select label="Gender" value={f("gender")} onChange={handleFieldChange("gender")}
          options={[
            { value: "", label: "Select Gender" },
            { value: "Male",   label: "Male" },
            { value: "Female", label: "Female" },
            { value: "Other",  label: "Other" },
          ]}
        />
      )}
      <Input label="Email Address *"   type="email"    value={f("email")}    onChange={handleFieldChange("email")}    placeholder={`${role}@email.com`} />
      <Input label="Password *"        type="password" value={f("password")} onChange={handleFieldChange("password")} placeholder="Min 8 characters" />
      <Input label="Confirm Password *" type="password" value={f("confirm")}  onChange={handleFieldChange("confirm")}  placeholder="Repeat password" />
      <Btn variant="primary" full size="lg" onClick={handleSubmit} disabled={loading}>
        {loading ? "Creating account…" : "Create Account →"}
      </Btn>
    </Modal>
  );
};

// ─── SHARED LOGIN FORM (used in both card & mobile panel) ─────────────────────
const LoginForm = ({ role, credentials, onFieldChange, onLoginClick, onRegisterClick, loadingRole }) => {
  const textColor = (role.key === "admin" || role.key === "parent") ? "#000" : "#fff";
  return (
    <div className="lms-card-form" style={{ marginTop: 20 }}>
      <div style={{ marginBottom: 10 }}>
        <input
          className="lms-card-input"
          type="email"
          placeholder={`${role.label.toLowerCase()}@email.com`}
          value={credentials[role.key].email}
          onChange={onFieldChange(role.key, "email")}
          onFocus={e => (e.target.style.borderColor = role.color)}
          onBlur={e  => (e.target.style.borderColor = "rgba(255,255,255,.15)")}
        />
      </div>
      <div style={{ marginBottom: 14 }}>
        <input
          className="lms-card-input"
          type="password"
          placeholder="Password"
          value={credentials[role.key].password}
          onChange={onFieldChange(role.key, "password")}
          onFocus={e => (e.target.style.borderColor = role.color)}
          onBlur={e  => (e.target.style.borderColor = "rgba(255,255,255,.15)")}
        />
      </div>
      <button
        onClick={() => onLoginClick(role.key)}
        disabled={loadingRole === role.key}
        style={{
          width: "100%", border: "none", padding: "12px", borderRadius: 9,
          fontWeight: 800, fontSize: 14, cursor: "pointer", marginBottom: 10,
          fontFamily: "DM Sans",
          background: `linear-gradient(135deg, ${role.color}, ${role.color}CC)`,
          color: textColor,
          opacity: loadingRole === role.key ? 0.7 : 1,
        }}
      >
        {loadingRole === role.key ? "Logging in…" : `Login as ${role.label} →`}
      </button>
      <button
        onClick={() => onRegisterClick(role.key)}
        style={{
          width: "100%", background: "rgba(255,255,255,.06)",
          border: "1px solid rgba(255,255,255,.15)", color: "rgba(255,255,255,.6)",
          padding: "9px", borderRadius: 9, fontSize: 12, cursor: "pointer", fontFamily: "DM Sans",
        }}
      >
        New {role.label}? Register here
      </button>
    </div>
  );
};

// ─── LOGIN PAGE ───────────────────────────────────────────────────────────────
const LoginPage = ({ onLoginSuccess, onBack, onUltraAdminLogin }) => {
  useEffect(() => { injectStyles(); }, []);

  const [zoomed,      setZoomed]      = useState(null);   // hover (desktop)
  const [pinned,      setPinned]      = useState(null);   // click-pinned (desktop)
  const [mobileRole,  setMobileRole]  = useState("");     // dropdown (mobile)
  const [modal,       setModal]       = useState(null);
  const [loadingRole, setLoadingRole] = useState(null);
  const [credentials, setCredentials] = useState({
    student: { email: "", password: "" },
    teacher: { email: "", password: "" },
    parent:  { email: "", password: "" },
    admin:   { email: "", password: "" },
  });

  const handleFieldChange = (roleKey, field) => (e) =>
    setCredentials(prev => ({ ...prev, [roleKey]: { ...prev[roleKey], [field]: e.target.value } }));

  const handleLoginClick = async (roleKey) => {
    const { email, password } = credentials[roleKey];
    if (!email || !password) { alert("Enter email and password."); return; }
    try {
      setLoadingRole(roleKey);
      const auth = await login(email, password, roleKey);
      onLoginSuccess(auth);
    } catch (err) {
      alert(err.message || "Login failed");
    } finally {
      setLoadingRole(null);
    }
  };

  // Click toggles pin; hover only applies when nothing is pinned
  const handleCardClick = (key) => setPinned(prev => prev === key ? null : key);
  const activeKey = pinned || zoomed;

  const mobileRoleObj = ROLES.find(r => r.key === mobileRole);

  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", flexDirection: "column" }}>

      {/* ── Header ── */}
      <div style={{
        padding: "0 20px", height: 64, display: "flex", alignItems: "center",
        justifyContent: "space-between", borderBottom: `1px solid ${T.border}`,
        background: "rgba(6,4,15,.8)", backdropFilter: "blur(20px)",
      }}>
        <div style={{ fontFamily: "Syne", fontSize: 18, fontWeight: 900, display: "flex", alignItems: "center", gap: 10, color: "#fff" }}>
          <div style={{ width: 32, height: 32, background: `linear-gradient(135deg,${T.primary},${T.accent})`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
            🎓
          </div>
          Zenelait<span style={{ color: T.accent }}>InfoTech</span>
        </div>
        <Btn variant="ghost" size="sm" onClick={onBack}>← Back</Btn>
      </div>

      {/* ── Content ── */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "32px 16px",
        background: `radial-gradient(ellipse 80% 80% at 50% 50%, rgba(124,58,237,.12), transparent 70%)`,
      }}>
        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontFamily: "Syne", fontSize: "clamp(22px,5vw,40px)", fontWeight: 900, color: "#fff", marginBottom: 8 }}>
            Welcome to <span style={{ color: T.accent }}>Zenelait</span> LMS
          </div>
          <p style={{ color: T.muted, fontSize: 13 }}>
            Select your role and sign in to continue
          </p>
        </div>

        {/* ══════════════════════════════════════════
            MOBILE VIEW  (≤ 680px)  — dropdown + panel
        ══════════════════════════════════════════ */}
        <div style={{ display: "none", width: "100%", maxWidth: 440 }}
          className="lms-mobile-view"
          // shown via the <style> block below
        >
          {/* Role dropdown */}
          <select
            className="lms-mobile-select"
            value={mobileRole}
            onChange={e => setMobileRole(e.target.value)}
            style={{ marginBottom: mobileRole ? 16 : 0 }}
          >
            <option value="">— Select your role —</option>
            {ROLES.map(r => (
              <option key={r.key} value={r.key}>{r.icon}  {r.label}</option>
            ))}
          </select>

          {/* Role panel */}
          {mobileRoleObj && (
            <div style={{
              background: mobileRoleObj.bg,
              border: `1.5px solid ${mobileRoleObj.color}`,
              borderRadius: 16,
              padding: "22px 18px",
              animation: "fadeUp .3s ease",
            }}>
              {/* Role header */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12, fontSize: 22,
                  background: `${mobileRoleObj.color}25`, border: `1.5px solid ${mobileRoleObj.color}50`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {mobileRoleObj.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: "#fff", fontFamily: "Syne" }}>{mobileRoleObj.label}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,.45)", lineHeight: 1.4 }}>{mobileRoleObj.sub}</div>
                </div>
              </div>

              <LoginForm
                role={mobileRoleObj}
                credentials={credentials}
                onFieldChange={handleFieldChange}
                onLoginClick={handleLoginClick}
                onRegisterClick={setModal}
                loadingRole={loadingRole}
              />
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════
            DESKTOP VIEW  (> 680px)  — expanding cards
        ══════════════════════════════════════════ */}
        <div style={{ display: "flex", gap: 16, width: "100%", maxWidth: 1100 }}
          className="lms-desktop-view"
        >
          {ROLES.map(role => {
            const isActive = activeKey === role.key;
            const isShrunk = activeKey && activeKey !== role.key;
            const isPinned = pinned === role.key;
            return (
              <div
                key={role.key}
                onClick={() => handleCardClick(role.key)}
                onMouseEnter={() => !pinned && setZoomed(role.key)}
                onMouseLeave={() => !pinned && setZoomed(null)}
                style={{
                  flex: isActive ? 2.4 : isShrunk ? 0.55 : 1,
                  minHeight: 420, borderRadius: 20, overflow: "hidden", cursor: "pointer",
                  border: `1.5px solid ${isActive ? role.color : T.border}`,
                  transition: "all .42s cubic-bezier(.4,0,.2,1)",
                  background: role.bg,
                  boxShadow: isActive ? `0 28px 72px rgba(0,0,0,.55), 0 0 36px ${role.color}28` : "none",
                  opacity: isShrunk ? 0.5 : 1,
                  position: "relative",
                }}
              >
                {/* Pin indicator */}
                {isPinned && (
                  <div style={{
                    position: "absolute", top: 12, right: 12,
                    background: role.color, color: "#000",
                    fontSize: 10, fontWeight: 800, padding: "3px 8px",
                    borderRadius: 20, fontFamily: "DM Sans", zIndex: 2,
                  }}>
                    PINNED
                  </div>
                )}

                <div style={{ padding: "26px 22px", height: "100%", display: "flex", flexDirection: "column", position: "relative", zIndex: 1 }}>
                  <div style={{
                    width: 58, height: 58, borderRadius: 15,
                    background: `${role.color}25`, border: `1.5px solid ${role.color}45`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 26, marginBottom: 14,
                    transform: isActive ? "scale(1.1)" : "scale(1)",
                    transition: "transform .3s",
                  }}>
                    {role.icon}
                  </div>
                  <h3 style={{ fontFamily: "Syne", fontSize: 20, fontWeight: 800, marginBottom: 5, color: "#fff" }}>
                    {role.label}
                  </h3>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,.5)", lineHeight: 1.5 }}>{role.sub}</p>

                  {isActive && (
                    <LoginForm
                      role={role}
                      credentials={credentials}
                      onFieldChange={handleFieldChange}
                      onLoginClick={handleLoginClick}
                      onRegisterClick={setModal}
                      loadingRole={loadingRole}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer links */}
        <div style={{ display: "flex", gap: 20, marginTop: 28, flexWrap: "wrap", justifyContent: "center" }}>
          {["← Back to Website", "Forgot Password?", "Need Help?", "Privacy Policy"].map(l => (
            <button key={l}
              onClick={l === "← Back to Website" ? onBack : undefined}
              style={{ background: "none", border: "none", color: T.muted, fontSize: 12, cursor: "pointer" }}
            >{l}</button>
          ))}
          {/* Hidden ultra admin portal link — subtle and unobtrusive */}
          <button
            onClick={onUltraAdminLogin}
            title="Ultra Super Admin Portal"
            style={{ background: "none", border: "none", color: "rgba(245,158,11,.25)", fontSize: 11, cursor: "pointer", letterSpacing: ".5px" }}
          >*</button>
        </div>
      </div>

      {/* Registration Modal */}
      {modal && (
        <RegModal role={modal} onClose={() => setModal(null)}
          onSuccess={(auth) => { setModal(null); onLoginSuccess(auth); }}
        />
      )}

      {/* Responsive breakpoint styles */}
      <style>{`
        @media (max-width: 680px) {
          .lms-mobile-view  { display: block !important; }
          .lms-desktop-view { display: none  !important; }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
