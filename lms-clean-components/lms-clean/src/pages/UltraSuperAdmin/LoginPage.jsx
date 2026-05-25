// src/pages/UltraSuperAdmin/LoginPage.jsx
// Hidden portal — accessed only via secret link from the bottom of the login page
import { useState, useEffect } from "react";
import { T } from "../../assets/styles/theme";
import { login } from "../../api/auth";

const injectStyles = () => {
  if (document.getElementById("usa-login-styles")) return;
  const s = document.createElement("style");
  s.id = "usa-login-styles";
  s.textContent = `
    @keyframes usaFadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
    @keyframes usaSpin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    @keyframes usaGlow   { 0%,100%{opacity:.6} 50%{opacity:1} }
    .usa-input {
      width:100%; background:rgba(245,158,11,.06); border:1.5px solid rgba(245,158,11,.18);
      border-radius:10px; padding:12px 16px; font-size:14px; color:#fff; outline:none;
      font-family:'DM Sans',sans-serif; box-sizing:border-box; transition:border-color .2s,box-shadow .2s;
    }
    .usa-input::placeholder{color:rgba(255,255,255,.25)}
    .usa-input:focus{border-color:rgba(245,158,11,.65);box-shadow:0 0 0 3px rgba(245,158,11,.1)}
    .usa-login-btn {
      width:100%;border:none;padding:13px;border-radius:10px;font-weight:800;font-size:14px;
      cursor:pointer;font-family:'DM Sans',sans-serif;letter-spacing:.3px;
      background:linear-gradient(135deg,#F59E0B,#EF4444);color:#000;
      transition:opacity .2s,transform .15s;
    }
    .usa-login-btn:hover:not(:disabled){opacity:.9;transform:translateY(-1px)}
    .usa-login-btn:disabled{opacity:.5;cursor:not-allowed}
  `;
  document.head.appendChild(s);
};

export default function UltraSuperAdminLoginPage({ onLoginSuccess, onBack }) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  useEffect(() => { injectStyles(); }, []);

  const handleLogin = async () => {
    setError("");
    if (!email || !password) { setError("Email and password are required."); return; }
    try {
      setLoading(true);
      const auth = await login(email, password, "ultra-super-admin");
      onLoginSuccess(auth);
    } catch (err) {
      setError(err.message || "Login failed. Check your credentials.");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:"100vh", background:T.bg, display:"flex", flexDirection:"column", fontFamily:"'DM Sans',sans-serif" }}>

      {/* Header */}
      <div style={{ padding:"0 24px", height:64, display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:`1px solid ${T.border}`, background:"rgba(6,4,15,.92)", backdropFilter:"blur(20px)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:9, background:"linear-gradient(135deg,#F59E0B,#EF4444)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>🌐</div>
          <span style={{ fontFamily:"Syne", fontWeight:900, fontSize:17, color:"#fff" }}>Zenelait<span style={{ color:"#F59E0B" }}>InfoTech</span></span>
        </div>
        <button onClick={() => {
        window.history.replaceState({}, "", "/"); // ✅ change URL
        onBack(); // ✅ change view
        }} style={{ background:"rgba(255,255,255,.06)", border:`1px solid ${T.border}`, color:T.muted, padding:"7px 16px", borderRadius:8, fontSize:12, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>← Back 
        </button>
      </div>

      {/* Body */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 16px", background:`radial-gradient(ellipse 55% 55% at 50% 40%, rgba(245,158,11,.07), transparent 70%)` }}>
        <div style={{ width:"100%", maxWidth:400, animation:"usaFadeUp .4s ease" }}>

          {/* Icon */}
          <div style={{ display:"flex", justifyContent:"center", marginBottom:24 }}>
            <div style={{ width:70, height:70, borderRadius:18, background:"rgba(245,158,11,.1)", border:"1.5px solid rgba(245,158,11,.25)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:30, animation:"usaGlow 3s ease infinite" }}>🌐</div>
          </div>

          {/* Title */}
          <div style={{ textAlign:"center", marginBottom:28 }}>
            <h1 style={{ fontFamily:"Syne", fontSize:24, fontWeight:900, color:"#fff", margin:"0 0 6px" }}>Ultra Super Admin</h1>
            <p style={{ color:T.muted, fontSize:13, margin:0 }}>Platform-level access · Restricted portal</p>
          </div>

          {/* Card */}
          <div style={{ background:T.card, border:"1.5px solid rgba(245,158,11,.18)", borderRadius:18, padding:"26px 24px", boxShadow:"0 24px 64px rgba(0,0,0,.45), 0 0 40px rgba(245,158,11,.05)" }}>

            {/* Warning */}
            <div style={{ background:"rgba(245,158,11,.07)", border:"1px solid rgba(245,158,11,.18)", borderRadius:8, padding:"8px 12px", marginBottom:20, display:"flex", gap:8, alignItems:"center" }}>
              <span style={{ fontSize:13 }}>⚠️</span>
              <span style={{ fontSize:11, color:"rgba(245,158,11,.8)", lineHeight:1.4 }}>Restricted to Ultra Super Admins only. Unauthorized access is logged.</span>
            </div>

            {/* Email */}
            <div style={{ marginBottom:13 }}>
              <label style={{ display:"block", fontSize:12, fontWeight:600, color:T.muted, marginBottom:5 }}>Email Address</label>
              <input className="usa-input" type="email" placeholder="ultrasuperadmin@email.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key==="Enter" && handleLogin()} autoComplete="email" />
            </div>

            {/* Password */}
            <div style={{ marginBottom:20, position:"relative" }}>
              <label style={{ display:"block", fontSize:12, fontWeight:600, color:T.muted, marginBottom:5 }}>Password</label>
              <input className="usa-input" type={showPw?"text":"password"} placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key==="Enter" && handleLogin()} style={{ paddingRight:44 }} />
              <button onClick={() => setShowPw(p=>!p)} style={{ position:"absolute", right:12, top:36, background:"none", border:"none", cursor:"pointer", color:T.muted, fontSize:14 }}>{showPw?"🙈":"👁️"}</button>
            </div>

            {/* Error */}
            {error && (
              <div style={{ background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.25)", borderRadius:8, padding:"8px 12px", marginBottom:14, fontSize:12, color:"#FCA5A5" }}>❌ {error}</div>
            )}

            {/* Login */}
            <button className="usa-login-btn" onClick={handleLogin} disabled={loading}>
              {loading
                ? <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                    <span style={{ width:13, height:13, border:"2px solid #000", borderTopColor:"transparent", borderRadius:"50%", display:"inline-block", animation:"usaSpin .7s linear infinite" }} />
                    Authenticating…
                  </span>
                : "🔐  Sign In to Platform"}
            </button>
          </div>

          <p style={{ textAlign:"center", fontSize:11, color:T.muted, marginTop:18 }}>
            Not an Ultra Super Admin?{" "}
            <button onClick={() => {
            window.history.replaceState({}, "", "/"); // ✅ change URL
            onBack(); // ✅ change view
            }} style={{ background:"none", border:"none", color:"#F59E0B", cursor:"pointer", fontSize:11, fontFamily:"'DM Sans',sans-serif" }}>Go back 
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
