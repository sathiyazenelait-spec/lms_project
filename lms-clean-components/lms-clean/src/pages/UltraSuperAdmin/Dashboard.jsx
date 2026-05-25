// src/pages/UltraSuperAdmin/Dashboard.jsx
import { useState, useEffect, useCallback } from "react";
import { T } from "../../assets/styles/theme";
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import {
  usaGetStats, usaGetOrganizations, usaCreateOrganization,
  usaGetSuperAdmins, usaCreateSuperAdmin, usaToggleOrgActive,
  usaGetStudentsByOrg, usaGetTeachersByOrg, usaGetParentsByOrg,
  usaGetFeatures, usaCreateFeature, usaToggleFeatureActive,
  usaGetOrgFeatures, usaToggleOrgFeature,
  usaGetPackages, usaCreatePackage, usaTogglePackageActive,
  usaDeletePackage, usaGetSubscriptions, usaAssignSubscription,
  usaGetRevenueAnalysis, usaGetNotifications, usaMarkNotifRead,
  usaMarkAllNotifsRead, usaTriggerExpiryCheck, usaSendRenewalReminder
} from "../../api/auth";

const C = { gold:"#F59E0B", red:"#EF4444", green:"#10B981", blue:"#06B6D4", purple:"#7C3AED" };
const PAGE_SIZE = 20;

// ── helpers ───────────────────────────────────────────────────────────────────
const injectStyles = () => {
  if (document.getElementById("usa-dash-styles")) return;
  const s = document.createElement("style");
  s.id = "usa-dash-styles";
  s.textContent = `
    @keyframes usaFadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    @keyframes usaFadeLeft{from{transform:translateX(100%)}to{transform:translateX(0)}}
    @keyframes usaSpin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
    .usa-nav:hover{background:rgba(245,158,11,.08)!important}
    .usa-row:hover{background:rgba(245,158,11,.04)!important}
    .usa-tbl-head{font-size:11px;font-weight:700;color:#7C6FAA;text-transform:uppercase;letter-spacing:.6px;padding:10px 16px;border-bottom:1px solid #2D2160}
    .usa-tbl-row{padding:12px 16px;border-bottom:1px solid rgba(45,33,96,.35);transition:background .15s}
    .usa-input{width:100%;background:rgba(255,255,255,.05);border:1.5px solid #2D2160;border-radius:9px;padding:11px 14px;font-size:13px;color:#EDE9FE;outline:none;font-family:'DM Sans',sans-serif;box-sizing:border-box;transition:border-color .2s}
    .usa-input:focus{border-color:rgba(245,158,11,.6)}
    .usa-input::placeholder{color:rgba(255,255,255,.2)}
    .usa-submit{width:100%;border:none;padding:13px;border-radius:10px;font-weight:800;font-size:14px;cursor:pointer;font-family:'DM Sans',sans-serif;background:linear-gradient(135deg,#F59E0B,#EF4444);color:#000;transition:opacity .2s}
    .usa-submit:disabled{opacity:.5;cursor:not-allowed}
  `;
  document.head.appendChild(s);
};

const Chip = ({ children, color = C.gold }) => (
  <span style={{ display:"inline-block", padding:"2px 10px", borderRadius:20, background:`${color}18`, border:`1px solid ${color}35`, color, fontSize:11, fontWeight:700 }}>{children}</span>
);

const StatCard = ({ icon, label, value, color = C.gold }) => (
  <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"16px 18px", display:"flex", alignItems:"center", gap:12, flex:"1 1 150px" }}>
    <div style={{ width:42, height:42, borderRadius:11, background:`${color}15`, border:`1.5px solid ${color}28`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>{icon}</div>
    <div>
      <div style={{ fontSize:21, fontWeight:800, color:"#fff", fontFamily:"Syne", lineHeight:1.1 }}>{value ?? "—"}</div>
      <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>{label}</div>
    </div>
  </div>
);

const Field = ({ label, type="text", value, onChange, placeholder, required }) => (
  <div style={{ marginBottom:13 }}>
    <label style={{ display:"block", fontSize:12, fontWeight:600, color:T.muted, marginBottom:5 }}>{label}{required && <span style={{ color:C.gold }}> *</span>}</label>
    <input className="usa-input" type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
  </div>
);

const Spinner = () => <span style={{ width:13, height:13, border:"2px solid #000", borderTopColor:"transparent", borderRadius:"50%", display:"inline-block", animation:"usaSpin .7s linear infinite", verticalAlign:"middle", marginRight:6 }} />;

const Modal = ({ title, onClose, children }) => (
  <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.72)", backdropFilter:"blur(6px)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
    onClick={e => e.target === e.currentTarget && onClose()}>
    <div style={{ background:T.card2, border:"1.5px solid rgba(245,158,11,.22)", borderRadius:18, padding:"26px 24px", width:"100%", maxWidth:480, maxHeight:"90vh", overflowY:"auto", animation:"usaFadeUp .3s ease" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <h3 style={{ fontFamily:"Syne", fontWeight:800, fontSize:17, color:"#fff", margin:0 }}>{title}</h3>
        <button onClick={onClose} style={{ background:"rgba(255,255,255,.08)", border:"none", color:T.muted, width:28, height:28, borderRadius:7, cursor:"pointer", fontSize:16, lineHeight:1 }}>×</button>
      </div>
      {children}
    </div>
  </div>
);

const Pagination = ({ page, total, pageSize, onChange }) => {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;
  return (
    <div style={{ display:"flex", gap:6, alignItems:"center", justifyContent:"center", padding:"14px 0" }}>
      <button onClick={() => onChange(page - 1)} disabled={page === 1}
        style={{ background:"rgba(255,255,255,.06)", border:`1px solid ${T.border}`, color:T.muted, padding:"5px 12px", borderRadius:7, cursor:page===1?"not-allowed":"pointer", fontSize:12 }}>‹</button>
      {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
        const p = totalPages <= 7 ? i+1 : page <= 4 ? i+1 : page >= totalPages-3 ? totalPages-6+i : page-3+i;
        return (
          <button key={p} onClick={() => onChange(p)}
            style={{ background:page===p ? C.gold : "rgba(255,255,255,.06)", border:`1px solid ${page===p ? C.gold : T.border}`, color:page===p?"#000":T.muted, padding:"5px 10px", borderRadius:7, cursor:"pointer", fontSize:12, fontWeight:page===p?700:400 }}>{p}</button>
        );
      })}
      <button onClick={() => onChange(page + 1)} disabled={page === totalPages}
        style={{ background:"rgba(255,255,255,.06)", border:`1px solid ${T.border}`, color:T.muted, padding:"5px 12px", borderRadius:7, cursor:page===totalPages?"not-allowed":"pointer", fontSize:12 }}>›</button>
      <span style={{ fontSize:11, color:T.muted, marginLeft:6 }}>{total} records</span>
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
export default function UltraSuperAdminDashboard({ auth, onLogout }) {
  const [tab, setTab]     = useState("overview");
  const [stats, setStats] = useState(null);
  const [orgs,  setOrgs]  = useState([]);
  const [admins,setAdmins]= useState([]);

  // user list state
  const [selectedOrg,  setSelectedOrg]  = useState(null); // org object
  const [userTab,      setUserTab]       = useState("students"); // students|teachers|parents
  const [students,     setStudents]      = useState([]);
  const [teachers,     setTeachers]      = useState([]);
  const [parents,      setParents]       = useState([]);
  const [usersLoading, setUsersLoading]  = useState(false);
  const [stuPage,      setStuPage]       = useState(1);
  const [tchPage,      setTchPage]       = useState(1);
  const [parPage,      setParPage]       = useState(1);

  // modals
  const [showOrgModal,  setShowOrgModal]  = useState(false);
  const [showAdmModal,  setShowAdmModal]  = useState(false);
  const [showFeatModal, setShowFeatModal] = useState(false);
  const [orgForm,  setOrgForm]  = useState({ name:"", email:"", phone:"", address:"", city:"", country:"", description:"" });
  const [admForm,  setAdmForm]  = useState({ name:"", email:"", password:"", academyName:"", organizationId:"", gender:"", phone:"" });
  const [featForm, setFeatForm] = useState({ name: "", featureKey: "", description: "" });
  const [orgSaving,setOrgSaving]= useState(false);
  const [admSaving,setAdmSaving]= useState(false);
  const [featSaving, setFeatSaving] = useState(false);
  const [orgErr,   setOrgErr]   = useState("");
  const [admErr,   setAdmErr]   = useState("");
  const [featErr,  setFeatErr]  = useState("");

  // Features state
  const [features, setFeatures] = useState([]);
  const [orgFeatsSelectedOrg, setOrgFeatsSelectedOrg] = useState(null);
  const [orgFeats, setOrgFeats] = useState([]);
  const [featsLoading, setFeatsLoading] = useState(false);

  // Subscription management state
  const [packages, setPackages] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [showPkgModal, setShowPkgModal] = useState(false);
  const [pkgForm, setPkgForm] = useState({ name: "", description: "", price: "", packageType: "MONTHLY", durationDays: "" });
  const [pkgSaving, setPkgSaving] = useState(false);
  const [pkgErr, setPkgErr] = useState("");

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({ organizationId: "", packageId: "" });
  const [assignSaving, setAssignSaving] = useState(false);
  const [assignErr, setAssignErr] = useState("");

  const [expiringOrgs, setExpiringOrgs] = useState([]);
  const [showExpiringPopup, setShowExpiringPopup] = useState(false);

  // New Revenue and Notification States
  const [notifications, setNotifications] = useState([]);
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [revenueData, setRevenueData] = useState(null);
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [customGrowthRate, setCustomGrowthRate] = useState(10);
  const [triggeringCheck, setTriggeringCheck] = useState(false);
  const [remindingSubId, setRemindingSubId] = useState(null);

  const loadPackages = useCallback(async () => {
    try {
      const data = await usaGetPackages();
      setPackages(Array.isArray(data) ? data : []);
    } catch {}
  }, []);

  const loadSubscriptions = useCallback(async () => {
    try {
      const data = await usaGetSubscriptions();
      setSubscriptions(Array.isArray(data) ? data : []);
    } catch {}
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const data = await usaGetNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch {}
  }, []);

  const loadRevenueAnalysis = useCallback(async () => {
    setRevenueLoading(true);
    try {
      const data = await usaGetRevenueAnalysis();
      setRevenueData(data);
    } catch (err) {
      console.error("Failed to load revenue analysis", err);
    } finally {
      setRevenueLoading(false);
    }
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await usaMarkNotifRead(id);
      loadNotifications();
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await usaMarkAllNotifsRead();
      loadNotifications();
    } catch {}
  };

  const handleTriggerScan = async () => {
    setTriggeringCheck(true);
    try {
      await usaTriggerExpiryCheck();
      alert("✅ Expiry scan completed successfully! Subscription alerts and notifications have been synced.");
      loadNotifications();
      loadSubscriptions();
    } catch (err) {
      alert("Error running scan: " + err.message);
    } finally {
      setTriggeringCheck(false);
    }
  };

  const handleSendReminder = async (subId, orgName) => {
    if (!window.confirm(`Are you sure you want to send a renewal email reminder to the Super Admin of "${orgName}"?`)) return;
    setRemindingSubId(subId);
    try {
      await usaSendRenewalReminder(subId);
      alert(`✉️ Renewal email reminder sent successfully to the Super Admin of "${orgName}"!`);
      loadNotifications();
    } catch (err) {
      alert("Error sending reminder: " + err.message);
    } finally {
      setRemindingSubId(null);
    }
  };

  const getCalculatedProjections = () => {
    if (!revenueData) return [];
    const mrr = revenueData.mrr || 0;
    const totalRevenue = revenueData.totalRevenue || 0;
    const rate = customGrowthRate / 100.0;
    
    const projections = [];
    let currentPredictMRR = mrr;
    let currentPredictCumulative = totalRevenue;
    const now = new Date();
    
    for (let i = 1; i <= 6; i++) {
      const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const label = futureDate.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      currentPredictMRR = currentPredictMRR * (1.0 + rate);
      currentPredictCumulative += currentPredictMRR;
      
      projections.push({
        month: label,
        "Projected MRR": Math.round(currentPredictMRR),
        "Projected Cumulative Revenue": Math.round(currentPredictCumulative)
      });
    }
    return projections;
  };

  const projectedData = getCalculatedProjections();

  useEffect(() => { injectStyles(); }, []);

  const loadStats = useCallback(async () => { try { setStats(await usaGetStats()); } catch {} }, []);
  const loadOrgs  = useCallback(async () => { try { setOrgs(await usaGetOrganizations()); } catch {} }, []);
  const loadAdmins= useCallback(async () => { try { setAdmins(await usaGetSuperAdmins()); } catch {} }, []);
  const loadFeatures = useCallback(async () => { try { setFeatures(await usaGetFeatures() || []); } catch {} }, []);

  useEffect(() => {
    loadStats(); loadOrgs(); loadAdmins(); loadFeatures(); loadPackages(); loadSubscriptions();
    loadNotifications(); loadRevenueAnalysis();
  }, []);

  useEffect(() => {
    if (subscriptions.length > 0 && orgs.length > 0) {
      const expiring = [];
      const now = new Date();
      subscriptions.forEach(sub => {
        if (sub.status === "ACTIVE") {
          const diff = new Date(sub.endDate) - now;
          const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
          if (daysLeft <= 1 && daysLeft >= 0) {
            const org = orgs.find(o => o.id === sub.organizationId);
            if (org) {
              expiring.push({ orgName: org.name, orgCode: org.orgCode, daysLeft });
            }
          }
        }
      });
      if (expiring.length > 0) {
        setExpiringOrgs(expiring);
        setShowExpiringPopup(true);
      }
    }
  }, [subscriptions, orgs]);

  useEffect(() => {
    if (!orgFeatsSelectedOrg) return;
    setFeatsLoading(true);
    usaGetOrgFeatures(orgFeatsSelectedOrg.id)
      .then(data => {
        setOrgFeats(data || []);
      })
      .catch(() => {})
      .finally(() => setFeatsLoading(false));
  }, [orgFeatsSelectedOrg]);

  const handleCreateFeature = async () => {
    setFeatErr("");
    if (!featForm.name || !featForm.featureKey) { setFeatErr("Name and key are required."); return; }
    try {
      setFeatSaving(true);
      await usaCreateFeature(featForm);
      setShowFeatModal(false);
      setFeatForm({ name: "", featureKey: "", description: "" });
      loadFeatures();
    } catch (err) { setFeatErr(err.message || "Failed to create feature."); }
    finally { setFeatSaving(false); }
  };

  const handleToggleGlobalFeature = async (featureId) => {
    try {
      await usaToggleFeatureActive(featureId);
      loadFeatures();
    } catch (err) { alert(err.message || "Failed to toggle global feature."); }
  };

  const handleToggleOrgFeature = async (featureId) => {
    if (!orgFeatsSelectedOrg) return;
    try {
      await usaToggleOrgFeature(orgFeatsSelectedOrg.id, featureId);
      const updated = await usaGetOrgFeatures(orgFeatsSelectedOrg.id);
      setOrgFeats(updated || []);
    } catch (err) { alert(err.message || "Failed to toggle organization feature."); }
  };

  // Load users when org or userTab changes
  useEffect(() => {
    if (!selectedOrg) return;
    const id = selectedOrg.id;
    setUsersLoading(true);
    setStuPage(1); setTchPage(1); setParPage(1);
    Promise.all([
      usaGetStudentsByOrg(id).catch(() => []),
      usaGetTeachersByOrg(id).catch(() => []),
      usaGetParentsByOrg(id).catch(() => []),
    ]).then(([s, t, p]) => {
      setStudents(Array.isArray(s) ? s : []);
      setTeachers(Array.isArray(t) ? t : []);
      setParents(Array.isArray(p)  ? p : []);
    }).finally(() => setUsersLoading(false));
  }, [selectedOrg]);

  // paginate helpers
  const paginate = (arr, page) => arr.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  // ── Create org ────────────────────────────────────────────────────────────
  const handleCreateOrg = async () => {
    setOrgErr("");
    if (!orgForm.name || !orgForm.email) { setOrgErr("Name and email are required."); return; }
    try {
      setOrgSaving(true);
      await usaCreateOrganization(orgForm);
      setShowOrgModal(false);
      setOrgForm({ name:"", email:"", phone:"", address:"", city:"", country:"", description:"" });
      loadOrgs(); loadStats();
    } catch (err) { setOrgErr(err.message || "Failed."); }
    finally { setOrgSaving(false); }
  };

  // ── Create super admin ────────────────────────────────────────────────────
  const handleCreateAdmin = async () => {
    setAdmErr("");
    if (!admForm.name || !admForm.email || !admForm.password || !admForm.organizationId) {
      setAdmErr("Name, email, password and organization are required."); return;
    }
    try {
      setAdmSaving(true);
      await usaCreateSuperAdmin({
        ...admForm,
        organizationId: Number(admForm.organizationId),
        academyName: admForm.academyName || admForm.name,
        referralId: "dummy",
      });
      setShowAdmModal(false);
      setAdmForm({ name:"", email:"", password:"", academyName:"", organizationId:"", gender:"", phone:"" });
      loadAdmins(); loadStats();
    } catch (err) { setAdmErr(err.message || "Failed."); }
    finally { setAdmSaving(false); }
  };

  const handleToggleOrg = async (id) => {
    try { await usaToggleOrgActive(id); loadOrgs(); loadStats(); }
    catch (err) { alert(err.message || "Failed to toggle."); }
  };

  // ── Subscription Package & Plan Handlers ───────────────────────────────────
  const handleCreatePackage = async () => {
    setPkgErr("");
    if (!pkgForm.name || !pkgForm.price) {
      setPkgErr("Name and price are required.");
      return;
    }
    try {
      setPkgSaving(true);
      await usaCreatePackage({
        ...pkgForm,
        price: Number(pkgForm.price),
        durationDays: pkgForm.durationDays ? Number(pkgForm.durationDays) : undefined
      });
      setShowPkgModal(false);
      setPkgForm({ name: "", description: "", price: "", packageType: "MONTHLY", durationDays: "" });
      loadPackages();
    } catch (err) {
      setPkgErr(err.message || "Failed to create package.");
    } finally {
      setPkgSaving(false);
    }
  };

  const handleTogglePackage = async (id) => {
    try {
      await usaTogglePackageActive(id);
      loadPackages();
    } catch (err) {
      alert(err.message || "Failed to toggle package status.");
    }
  };

  const handleDeletePackage = async (id) => {
    if (!window.confirm("Are you sure you want to delete this package?")) return;
    try {
      await usaDeletePackage(id);
      loadPackages();
    } catch (err) {
      alert(err.message || "Failed to delete package.");
    }
  };

  const handleAssignSubscription = async () => {
    setAssignErr("");
    if (!assignForm.organizationId || !assignForm.packageId) {
      setAssignErr("Both organization and package are required.");
      return;
    }
    try {
      setAssignSaving(true);
      await usaAssignSubscription(Number(assignForm.organizationId), Number(assignForm.packageId));
      setShowAssignModal(false);
      setAssignForm({ organizationId: "", packageId: "" });
      loadSubscriptions();
    } catch (err) {
      setAssignErr(err.message || "Failed to assign subscription.");
    } finally {
      setAssignSaving(false);
    }
  };

  // ── NAV ───────────────────────────────────────────────────────────────────
  const NAV = [
    { key:"overview",    icon:"📊", label:"Overview"      },
    { key:"orgs",        icon:"🏢", label:"Organizations" },
    { key:"superadmins", icon:"👑", label:"Super Admins"  },
    { key:"users",       icon:"👥", label:"Users by Org"  },
    { key:"features",    icon:"⚙️", label:"Feature Toggles" },
    { key:"packages",    icon:"💎", label:"Subscriptions"  },
    { key:"revenue",     icon:"💵", label:"Revenue Analysis" },
    { key:"renewals",    icon:"🔔", label:"Renewal Alerts" },
  ];

  const activeOrgs   = orgs.filter(o => o.active).length;

  // ── User list table helper (unused) ──

  const userRow = (u, i, color = C.blue) => (
    <div key={u.id} className="usa-row" style={{ display:"grid", gridTemplateColumns:"1fr 120px 1fr 110px 80px", padding:"11px 16px", borderBottom:`1px solid rgba(45,33,96,.3)`, alignItems:"center" }}>
      <div>
        <div style={{ fontSize:13, fontWeight:600, color:"#fff" }}>{u.name}</div>
        <div style={{ fontSize:11, color:T.muted }}>{u.department || "—"}</div>
      </div>
      <div><Chip color={color}>{u.userId || `—`}</Chip></div>
      <div style={{ fontSize:12, color:T.muted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.email}</div>
      <div style={{ fontSize:12, color:T.muted }}>{u.phone || "—"}</div>
      <div><Chip color={u.active ? C.green : C.red}>{u.active ? "Active" : "Off"}</Chip></div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:T.bg, display:"flex", fontFamily:"'DM Sans',sans-serif" }}>

      {/* ── Sidebar ── */}
      <aside style={{ width:210, flexShrink:0, background:T.bg2, borderRight:`1px solid ${T.border}`, display:"flex", flexDirection:"column", position:"sticky", top:0, height:"100vh" }}>
        <div style={{ padding:"18px 16px", borderBottom:`1px solid ${T.border}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:9 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:"linear-gradient(135deg,#F59E0B,#EF4444)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>🌐</div>
            <div>
              <div style={{ fontFamily:"Syne", fontSize:13, fontWeight:900, color:"#fff", lineHeight:1.1 }}>Zenelait</div>
              <div style={{ fontSize:10, color:C.gold, fontWeight:700, letterSpacing:.5 }}>ULTRA ADMIN</div>
            </div>
          </div>
        </div>
        <nav style={{ padding:"12px 8px", flex:1 }}>
          {NAV.map(n => {
            const unreadCount = notifications.filter(x => !x.read).length;
            return (
              <button key={n.key} className="usa-nav" onClick={() => setTab(n.key)} style={{
                width:"100%", display:"flex", alignItems:"center", gap:9, padding:"9px 11px", borderRadius:9, border:"none",
                background: tab===n.key ? "rgba(245,158,11,.11)" : "transparent",
                color: tab===n.key ? C.gold : T.muted, fontSize:13, fontWeight: tab===n.key ? 700 : 500,
                cursor:"pointer", marginBottom:2, textAlign:"left", fontFamily:"'DM Sans',sans-serif",
                borderLeft: tab===n.key ? `3px solid ${C.gold}` : "3px solid transparent",
              }}>
                <span>{n.icon}</span>
                <span style={{ flex: 1 }}>{n.label}</span>
                {n.key === "renewals" && unreadCount > 0 && (
                  <span style={{
                    background: C.red, color: "#fff", fontSize: 9, fontWeight: 800,
                    padding: "2px 6px", borderRadius: 10, minWidth: 14, textAlign: "center"
                  }}>{unreadCount}</span>
                )}
              </button>
            );
          })}
        </nav>
        <div style={{ padding:"13px 15px", borderTop:`1px solid ${T.border}` }}>
          <div style={{ fontSize:12, color:"#fff", fontWeight:600, marginBottom:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{auth?.name}</div>
          <div style={{ fontSize:10, color:T.muted, marginBottom:9, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{auth?.userCode}</div>
          <button onClick={onLogout} style={{ width:"100%", background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.2)", color:"#FCA5A5", padding:"7px", borderRadius:7, fontSize:12, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontWeight:600 }}>🚪 Logout</button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex:1, padding:"26px 26px", overflowY:"auto", position: "relative" }}>

        {/* ── Header ── */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, borderBottom: `1px solid ${T.border}`, paddingBottom: 14 }}>
          <div>
            <h1 style={{ fontFamily: "Syne", fontSize: 22, fontWeight: 900, color: "#fff", margin: 0 }}>
              {NAV.find(n => n.key === tab)?.label || "Dashboard"}
            </h1>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>Ultra Super Admin Control Panel</div>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* Notification Bell Widget */}
            <div style={{ position: "relative" }}>
              <button onClick={() => setShowNotifDrawer(true)} style={{
                background: "rgba(255,255,255,0.05)", border: `1.5px solid ${T.border}`,
                color: "#fff", width: 40, height: 40, borderRadius: "50%", display: "flex",
                alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 18,
                transition: "all 0.2s"
              }} title="View Notification History">
                🔔
              </button>
              {notifications.filter(n => !n.read).length > 0 && (
                <span style={{
                  position: "absolute", top: -3, right: -3, background: C.red, color: "#fff",
                  fontSize: 10, fontWeight: 900, width: 18, height: 18, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${T.bg}`
                }}>
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </div>
            
            <div style={{ width: 1.5, height: 24, background: T.border }} />
            
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: `linear-gradient(135deg, ${C.gold}, ${C.red})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: "bold", color: "#000" }}>
                {auth?.name ? auth.name.charAt(0).toUpperCase() : "A"}
              </div>
              <div style={{ display: "block" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{auth?.name}</div>
                <div style={{ fontSize: 10, color: T.muted }}>Platform Owner</div>
              </div>
            </div>
          </div>
        </header>

        {/* ════ OVERVIEW ════ */}
        {tab === "overview" && (
          <div style={{ animation:"usaFadeUp .35s ease" }}>
            <div style={{ marginBottom:22 }}>
              <h2 style={{ fontFamily:"Syne", fontSize:21, fontWeight:900, color:"#fff", margin:"0 0 4px" }}>Platform Overview</h2>
              <p style={{ color:T.muted, fontSize:13, margin:0 }}>Welcome back, <span style={{ color:C.gold }}>{auth?.name}</span></p>
            </div>
            <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:26 }}>
              <StatCard icon="🏢" label="Total Orgs"     value={stats?.totalOrganizations}  color={C.gold}   />
              <StatCard icon="✅" label="Active Orgs"    value={stats?.activeOrganizations} color={C.green}  />
              <StatCard icon="👑" label="Super Admins"   value={stats?.totalSuperAdmins}    color={C.blue}   />
              <StatCard icon="🛡️" label="Reg Admins"    value={stats?.totalAdmins}         color={C.purple} />
              <StatCard icon="👨‍🎓" label="Students"      value={stats?.totalStudents}       color={C.blue}   />
              <StatCard icon="👨‍🏫" label="Teachers"      value={stats?.totalTeachers}       color={C.green}  />
              <StatCard icon="👨‍👩‍👦" label="Parents"       value={stats?.totalParents}        color={C.red}    />
            </div>
            <div style={{ marginBottom:18 }}>
              <h3 style={{ fontFamily:"Syne", fontSize:14, fontWeight:800, color:"#fff", marginBottom:12 }}>Quick Actions</h3>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                <button onClick={() => { setTab("orgs"); setShowOrgModal(true); }} style={{ background:`linear-gradient(135deg,${C.gold},${C.red})`, border:"none", color:"#000", padding:"10px 18px", borderRadius:9, fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>🏢 Create Organization</button>
                <button onClick={() => { setTab("superadmins"); setShowAdmModal(true); }} style={{ background:`rgba(245,158,11,.1)`, border:`1.5px solid rgba(245,158,11,.28)`, color:C.gold, padding:"10px 18px", borderRadius:9, fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>👑 Create Super Admin</button>
                <button onClick={() => setTab("users")} style={{ background:"rgba(6,182,212,.1)", border:"1.5px solid rgba(6,182,212,.28)", color:C.blue, padding:"10px 18px", borderRadius:9, fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>👥 View Users by Org</button>
              </div>
            </div>
            {/* Recent orgs */}
            <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
              <div style={{ padding:"13px 18px", borderBottom:`1px solid ${T.border}`, fontFamily:"Syne", fontSize:14, fontWeight:700, color:"#fff" }}>Recent Organizations</div>
              {orgs.length === 0
                ? <div style={{ padding:24, textAlign:"center", color:T.muted, fontSize:13 }}>No organizations yet.</div>
                : orgs.slice(0,5).map((org,i) => (
                  <div key={org.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 18px", borderBottom: i<4 ? `1px solid ${T.border}` : "none" }}>
                    <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                      <div style={{ width:34, height:34, borderRadius:9, background:"rgba(245,158,11,.1)", border:"1px solid rgba(245,158,11,.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>🏢</div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:"#fff" }}>{org.name}</div>
                        <div style={{ fontSize:11, color:T.muted }}>{org.orgCode} · {org.city||"—"}</div>
                      </div>
                    </div>
                    <Chip color={org.active ? C.green : C.red}>{org.active?"Active":"Inactive"}</Chip>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* ════ ORGANIZATIONS ════ */}
        {tab === "orgs" && (
          <div style={{ animation:"usaFadeUp .35s ease" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <div>
                <h2 style={{ fontFamily:"Syne", fontSize:21, fontWeight:900, color:"#fff", margin:"0 0 4px" }}>Organizations</h2>
                <p style={{ color:T.muted, fontSize:13, margin:0 }}>{orgs.length} total · {activeOrgs} active</p>
              </div>
              <button onClick={() => setShowOrgModal(true)} style={{ background:`linear-gradient(135deg,${C.gold},${C.red})`, border:"none", color:"#000", padding:"9px 16px", borderRadius:9, fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>+ Create Organization</button>
            </div>
            <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
              {/* thead */}
              <div style={{ display:"grid", gridTemplateColumns:"1.2fr 1fr 90px 100px 120px 90px 80px", padding:"10px 16px", borderBottom:`1px solid ${T.border}`, fontSize:11, fontWeight:700, color:T.muted, textTransform:"uppercase", letterSpacing:.5 }}>
                <span>Organization</span><span>Email</span><span>City</span><span>Code</span><span>Current Plan</span><span>Status</span><span>Action</span>
              </div>
              {orgs.length === 0
                ? <div style={{ padding:32, textAlign:"center", color:T.muted, fontSize:13 }}>No organizations yet.</div>
                : orgs.map((org,i) => {
                  const activeSub = subscriptions.find(s => s.organizationId === org.id && s.status === "ACTIVE");
                  return (
                    <div key={org.id} className="usa-row" style={{ display:"grid", gridTemplateColumns:"1.2fr 1fr 90px 100px 120px 90px 80px", padding:"12px 16px", alignItems:"center", borderBottom: i<orgs.length-1 ? `1px solid ${T.border}` : "none" }}>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:"#fff" }}>{org.name}</div>
                        <div style={{ fontSize:11, color:T.muted }}>{org.description?.slice(0,40)||"—"}</div>
                      </div>
                      <div style={{ fontSize:12, color:T.muted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{org.email}</div>
                      <div style={{ fontSize:12, color:T.muted }}>{org.city||"—"}</div>
                      <div><Chip color={C.gold}>{org.orgCode}</Chip></div>
                      <div>
                        {activeSub ? (
                          <div style={{ fontSize:12, fontWeight:700, color:C.purple }}>
                            {activeSub.subscriptionPackage?.name}
                          </div>
                        ) : (
                          <span style={{ fontSize:12, color:T.muted }}>None</span>
                        )}
                      </div>
                      <div><Chip color={org.active ? C.green : C.red}>{org.active?"Active":"Inactive"}</Chip></div>
                      <button onClick={() => handleToggleOrg(org.id)} style={{ background: org.active ? "rgba(239,68,68,.1)" : "rgba(16,185,129,.1)", border:`1px solid ${org.active ? "rgba(239,68,68,.3)" : "rgba(16,185,129,.3)"}`, color: org.active ? C.red : C.green, padding:"4px 9px", borderRadius:6, fontSize:11, cursor:"pointer", fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>{org.active?"Disable":"Enable"}</button>
                    </div>
                  );
                })
              }
            </div>
          </div>
        )}

        {/* ════ SUPER ADMINS ════ */}
        {tab === "superadmins" && (
          <div style={{ animation:"usaFadeUp .35s ease" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <div>
                <h2 style={{ fontFamily:"Syne", fontSize:21, fontWeight:900, color:"#fff", margin:"0 0 4px" }}>Super Admins</h2>
                <p style={{ color:T.muted, fontSize:13, margin:0 }}>{admins.length} super admins platform-wide</p>
              </div>
              <button onClick={() => setShowAdmModal(true)} style={{ background:`linear-gradient(135deg,${C.gold},${C.red})`, border:"none", color:"#000", padding:"9px 16px", borderRadius:9, fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>+ Create Super Admin</button>
            </div>
            <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 120px 120px 80px", padding:"10px 16px", borderBottom:`1px solid ${T.border}`, fontSize:11, fontWeight:700, color:T.muted, textTransform:"uppercase", letterSpacing:.5 }}>
                <span>Name</span><span>Email</span><span>User Code</span><span>Organization</span><span>Status</span>
              </div>
              {admins.length === 0
                ? <div style={{ padding:32, textAlign:"center", color:T.muted, fontSize:13 }}>No super admins yet.</div>
                : admins.map((a,i) => (
                  <div key={a.id} className="usa-row" style={{ display:"grid", gridTemplateColumns:"1fr 1fr 120px 120px 80px", padding:"12px 16px", alignItems:"center", borderBottom: i<admins.length-1 ? `1px solid ${T.border}` : "none" }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color:"#fff" }}>{a.name}</div>
                      <div style={{ fontSize:11, color:T.muted }}>{a.academyName||"—"}</div>
                    </div>
                    <div style={{ fontSize:12, color:T.muted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.email}</div>
                    <div><Chip color={C.gold}>{a.userId}</Chip></div>
                    <div style={{ fontSize:12, color:T.muted }}>{orgs.find(o=>o.id===a.organizationId)?.name||`Org #${a.organizationId}`}</div>
                    <div><Chip color={a.active ? C.green : C.red}>{a.active?"Active":"Off"}</Chip></div>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* ════ USERS BY ORG ════ */}
        {tab === "users" && (
          <div style={{ animation:"usaFadeUp .35s ease" }}>
            <div style={{ marginBottom:20 }}>
              <h2 style={{ fontFamily:"Syne", fontSize:21, fontWeight:900, color:"#fff", margin:"0 0 4px" }}>Users by Organization</h2>
              <p style={{ color:T.muted, fontSize:13, margin:0 }}>Select an organization to view its students, teachers and parents</p>
            </div>

            {/* Org selector */}
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:20 }}>
              {orgs.filter(o=>o.active).map(org => (
                <button key={org.id} onClick={() => setSelectedOrg(org)}
                  style={{ padding:"7px 16px", borderRadius:50, cursor:"pointer", fontSize:12, fontWeight:600, fontFamily:"'DM Sans',sans-serif", border:`1.5px solid ${selectedOrg?.id===org.id ? C.gold : T.border}`, background: selectedOrg?.id===org.id ? `${C.gold}18` : "transparent", color: selectedOrg?.id===org.id ? C.gold : T.muted }}>
                  🏢 {org.name}
                </button>
              ))}
              {orgs.filter(o=>o.active).length === 0 && <span style={{ color:T.muted, fontSize:13 }}>No active organizations found.</span>}
            </div>

            {selectedOrg && (
              <>
                {/* Org header */}
                <div style={{ background:T.card, border:`1px solid rgba(245,158,11,.2)`, borderRadius:12, padding:"14px 18px", marginBottom:16, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div>
                    <div style={{ fontFamily:"Syne", fontWeight:800, fontSize:15, color:"#fff" }}>{selectedOrg.name}</div>
                    <div style={{ fontSize:12, color:T.muted, marginTop:2 }}>{selectedOrg.orgCode} · {selectedOrg.email}</div>
                  </div>
                  <div style={{ display:"flex", gap:12, fontSize:13 }}>
                    <span style={{ color:C.blue }}>👨‍🎓 {students.length}</span>
                    <span style={{ color:C.green }}>👨‍🏫 {teachers.length}</span>
                    <span style={{ color:C.red }}>👨‍👩‍👦 {parents.length}</span>
                  </div>
                </div>

                {/* Sub-tabs */}
                <div style={{ display:"flex", gap:8, marginBottom:16 }}>
                  {[["students","👨‍🎓","Students",students.length,C.blue],["teachers","👨‍🏫","Teachers",teachers.length,C.green],["parents","👨‍👩‍👦","Parents",parents.length,C.red]].map(([k,ic,lb,cnt,col]) => (
                    <button key={k} onClick={() => setUserTab(k)}
                      style={{ padding:"7px 16px", borderRadius:9, cursor:"pointer", fontSize:12, fontWeight:600, fontFamily:"'DM Sans',sans-serif", border:`1.5px solid ${userTab===k ? col : T.border}`, background: userTab===k ? `${col}18` : "transparent", color: userTab===k ? col : T.muted }}>
                      {ic} {lb} ({cnt})
                    </button>
                  ))}
                </div>

                <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
                  {usersLoading
                    ? <div style={{ padding:32, textAlign:"center", color:T.muted, fontSize:13 }}><Spinner /> Loading…</div>
                    : <>
                        {/* Column header */}
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 120px 1fr 110px 80px", padding:"10px 16px", borderBottom:`1px solid ${T.border}`, fontSize:11, fontWeight:700, color:T.muted, textTransform:"uppercase", letterSpacing:.5 }}>
                          <span>Name</span><span>ID</span><span>Email</span><span>Phone</span><span>Status</span>
                        </div>
                        {userTab === "students" && (
                          <>
                            {paginate(students, stuPage).length === 0
                              ? <div style={{ padding:32, textAlign:"center", color:T.muted, fontSize:13 }}>No students in this organization.</div>
                              : paginate(students, stuPage).map((u,i) => userRow(u, i, C.blue))
                            }
                            <Pagination page={stuPage} total={students.length} pageSize={PAGE_SIZE} onChange={setStuPage} />
                          </>
                        )}
                        {userTab === "teachers" && (
                          <>
                            {paginate(teachers, tchPage).length === 0
                              ? <div style={{ padding:32, textAlign:"center", color:T.muted, fontSize:13 }}>No teachers in this organization.</div>
                              : paginate(teachers, tchPage).map((u,i) => userRow(u, i, C.green))
                            }
                            <Pagination page={tchPage} total={teachers.length} pageSize={PAGE_SIZE} onChange={setTchPage} />
                          </>
                        )}
                        {userTab === "parents" && (
                          <>
                            {paginate(parents, parPage).length === 0
                              ? <div style={{ padding:32, textAlign:"center", color:T.muted, fontSize:13 }}>No parents in this organization.</div>
                              : paginate(parents, parPage).map((u,i) => userRow(u, i, C.red))
                            }
                            <Pagination page={parPage} total={parents.length} pageSize={PAGE_SIZE} onChange={setParPage} />
                          </>
                        )}
                      </>
                  }
                </div>
              </>
            )}

            {!selectedOrg && orgs.filter(o=>o.active).length > 0 && (
              <div style={{ padding:"48px 0", textAlign:"center", color:T.muted }}>
                <div style={{ fontSize:36, marginBottom:10 }}>🏢</div>
                <div style={{ fontFamily:"Syne", fontWeight:700, fontSize:15 }}>Select an organization above</div>
                <div style={{ fontSize:13, marginTop:6 }}>to view its students, teachers and parents</div>
              </div>
            )}
          </div>
        )}

        {/* ════ FEATURE TOGGLES ════ */}
        {tab === "features" && (
          <div style={{ animation:"usaFadeUp .35s ease" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <div>
                <h2 style={{ fontFamily:"Syne", fontSize:21, fontWeight:900, color:"#fff", margin:"0 0 4px" }}>Feature Management</h2>
                <p style={{ color:T.muted, fontSize:13, margin:0 }}>{features.length} system features defined</p>
              </div>
              <button onClick={() => setShowFeatModal(true)} style={{ background:`linear-gradient(135deg,${C.gold},${C.red})`, border:"none", color:"#000", padding:"9px 16px", borderRadius:9, fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>+ Create Feature</button>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1.2fr 1fr", gap:20, alignItems:"start" }}>
              {/* Global Features Table */}
              <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
                <div style={{ padding:"13px 18px", borderBottom:`1px solid ${T.border}`, fontFamily:"Syne", fontSize:14, fontWeight:700, color:"#fff" }}>Global System Features</div>
                <div style={{ display:"grid", gridTemplateColumns:"1.2fr 1fr 80px 80px", padding:"10px 16px", borderBottom:`1px solid ${T.border}`, fontSize:11, fontWeight:700, color:T.muted, textTransform:"uppercase", letterSpacing:.5 }}>
                  <span>Feature</span><span>Key</span><span>Status</span><span>Action</span>
                </div>
                {features.length === 0
                  ? <div style={{ padding:32, textAlign:"center", color:T.muted, fontSize:13 }}>No features created.</div>
                  : features.map((f, i) => (
                    <div key={f.id} className="usa-row" style={{ display:"grid", gridTemplateColumns:"1.2fr 1fr 80px 80px", padding:"12px 16px", alignItems:"center", borderBottom: i<features.length-1 ? `1px solid ${T.border}` : "none" }}>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:"#fff" }}>{f.name}</div>
                        <div style={{ fontSize:11, color:T.muted }}>{f.description || "No description"}</div>
                      </div>
                      <div><Chip color={C.blue}>{f.featureKey}</Chip></div>
                      <div><Chip color={f.active ? C.green : C.red}>{f.active ? "Active" : "Disabled"}</Chip></div>
                      <button onClick={() => handleToggleGlobalFeature(f.id)} style={{ background: f.active ? "rgba(239,68,68,.1)" : "rgba(16,185,129,.1)", border:`1px solid ${f.active ? "rgba(239,68,68,.3)" : "rgba(16,185,129,.3)"}`, color: f.active ? C.red : C.green, padding:"4px 9px", borderRadius:6, fontSize:11, cursor:"pointer", fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>
                        {f.active ? "Disable" : "Enable"}
                      </button>
                    </div>
                  ))
                }
              </div>

              {/* Organization Feature configuration */}
              <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:20 }}>
                <h3 style={{ fontFamily:"Syne", fontSize:15, fontWeight:800, color:"#fff", margin:"0 0 6px" }}>Organization Feature Access</h3>
                <p style={{ color:T.muted, fontSize:12, margin:"0 0 16px" }}>Toggle features for a specific organization</p>
                
                <div style={{ marginBottom:20 }}>
                  <select value={orgFeatsSelectedOrg?.id || ""} onChange={e => {
                    const selected = orgs.find(o => o.id === Number(e.target.value));
                    setOrgFeatsSelectedOrg(selected || null);
                  }} className="usa-input" style={{ cursor:"pointer" }}>
                    <option value="">-- Choose Organization --</option>
                    {orgs.filter(o => o.active).map(o => <option key={o.id} value={o.id} style={{ background:T.card2 }}>{o.name}</option>)}
                  </select>
                </div>

                {orgFeatsSelectedOrg ? (
                  <div>
                    <div style={{ background:"rgba(255,255,255,.02)", border:`1px solid ${T.border}`, borderRadius:10, padding:14, marginBottom:16 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:"#fff" }}>{orgFeatsSelectedOrg.name}</div>
                      <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>Code: {orgFeatsSelectedOrg.orgCode}</div>
                    </div>

                    {featsLoading ? (
                      <div style={{ padding:20, textAlign:"center", color:T.muted }}><Spinner /> Loading features…</div>
                    ) : (
                      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                        {features.filter(f => f.active).map(f => {
                          const isEnabled = orgFeats.some(of => of.id === f.id);
                          return (
                            <div key={f.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", background:"rgba(255,255,255,.03)", border:`1px solid ${T.border}`, borderRadius:10 }}>
                              <div>
                                <div style={{ fontSize:13, fontWeight:600, color:"#fff" }}>{f.name}</div>
                                <div style={{ fontSize:10, color:T.muted }}>{f.featureKey}</div>
                              </div>
                              <div onClick={() => handleToggleOrgFeature(f.id)} style={{
                                width: 44, height: 22, borderRadius: 50, background: isEnabled ? C.green : "#332B5F",
                                cursor: "pointer", position: "relative", transition: "background-color 0.2s"
                              }}>
                                <div style={{
                                  width: 16, height: 16, borderRadius: "50%", background: "#fff",
                                  position: "absolute", top: 3, left: isEnabled ? 25 : 3, transition: "left 0.2s"
                                }} />
                              </div>
                            </div>
                          );
                        })}
                        {features.filter(f => f.active).length === 0 && (
                          <div style={{ padding:16, textAlign:"center", color:T.muted, fontSize:12 }}>No active features found.</div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ padding:"40px 10px", textAlign:"center", color:T.muted }}>
                    <div style={{ fontSize:28, marginBottom:8 }}>🏢</div>
                    <div style={{ fontSize:12, fontWeight:600 }}>Select an active organization above</div>
                    <div style={{ fontSize:11, marginTop:4 }}>to customize its enabled features</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ════ SUBSCRIPTIONS (PACKAGES & PLANS) ════ */}
        {tab === "packages" && (
          <div style={{ animation:"usaFadeUp .35s ease" }}>
            {/* Packages Section */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <div>
                <h2 style={{ fontFamily:"Syne", fontSize:21, fontWeight:900, color:"#fff", margin:"0 0 4px" }}>Subscription Packages</h2>
                <p style={{ color:T.muted, fontSize:13, margin:0 }}>{packages.length} packages created</p>
              </div>
              <button onClick={() => setShowPkgModal(true)} style={{ background:`linear-gradient(135deg,${C.gold},${C.red})`, border:"none", color:"#000", padding:"9px 16px", borderRadius:9, fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>+ Create Package</button>
            </div>
            
            <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden", marginBottom:30 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1.2fr 100px 100px 100px 80px 120px", padding:"10px 16px", borderBottom:`1px solid ${T.border}`, fontSize:11, fontWeight:700, color:T.muted, textTransform:"uppercase", letterSpacing:.5 }}>
                <span>Package</span><span>Price</span><span>Type</span><span>Duration</span><span>Status</span><span>Action</span>
              </div>
              {packages.length === 0
                ? <div style={{ padding:32, textAlign:"center", color:T.muted, fontSize:13 }}>No packages created yet.</div>
                : packages.map((pkg, i) => (
                    <div key={pkg.id} className="usa-row" style={{ display:"grid", gridTemplateColumns:"1.2fr 100px 100px 100px 80px 120px", padding:"12px 16px", alignItems:"center", borderBottom: i < packages.length - 1 ? `1px solid ${T.border}` : "none" }}>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:"#fff" }}>{pkg.name}</div>
                        <div style={{ fontSize:11, color:T.muted }}>{pkg.description || "No description"}</div>
                      </div>
                      <div style={{ fontSize:13, fontWeight:700, color:C.gold }}>₹{pkg.price.toLocaleString("en-IN")}</div>
                      <div><Chip color={C.blue}>{pkg.packageType}</Chip></div>
                      <div style={{ fontSize:12, color:T.muted }}>{pkg.durationDays} Days</div>
                      <div><Chip color={pkg.active ? C.green : C.red}>{pkg.active ? "Active" : "Disabled"}</Chip></div>
                      <div style={{ display:"flex", gap:6 }}>
                        <button onClick={() => handleTogglePackage(pkg.id)} style={{ background: pkg.active ? "rgba(239,68,68,.1)" : "rgba(16,185,129,.1)", border:`1px solid ${pkg.active ? "rgba(239,68,68,.3)" : "rgba(16,185,129,.3)"}`, color: pkg.active ? C.red : C.green, padding:"4px 9px", borderRadius:6, fontSize:11, cursor:"pointer", fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>
                          {pkg.active ? "Disable" : "Enable"}
                        </button>
                        <button onClick={() => handleDeletePackage(pkg.id)} style={{ background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.3)", color:C.red, padding:"4px 9px", borderRadius:6, fontSize:11, cursor:"pointer", fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>
                          🗑
                        </button>
                      </div>
                    </div>
                  ))
              }
            </div>

            {/* Subscriptions Section */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <div>
                <h2 style={{ fontFamily:"Syne", fontSize:21, fontWeight:900, color:"#fff", margin:"0 0 4px" }}>Organization Subscriptions</h2>
                <p style={{ color:T.muted, fontSize:13, margin:0 }}>{subscriptions.length} subscription assignments</p>
              </div>
              <button onClick={() => setShowAssignModal(true)} style={{ background:`rgba(6,182,212,.1)`, border:`1.5px solid rgba(6,182,212,.28)`, color:C.blue, padding:"9px 16px", borderRadius:9, fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>💎 Assign Subscription</button>
            </div>

            <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 100px 180px 100px 100px", padding:"10px 16px", borderBottom:`1px solid ${T.border}`, fontSize:11, fontWeight:700, color:T.muted, textTransform:"uppercase", letterSpacing:.5 }}>
                <span>Organization</span><span>Package</span><span>Type</span><span>Validity</span><span>Days Left</span><span>Status</span>
              </div>
              {subscriptions.length === 0
                ? <div style={{ padding:32, textAlign:"center", color:T.muted, fontSize:13 }}>No active subscription assignments found.</div>
                : subscriptions.map((sub, i) => {
                    const org = orgs.find(o => o.id === sub.organizationId);
                    const diff = new Date(sub.endDate) - new Date();
                    const daysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
                    return (
                      <div key={sub.id} className="usa-row" style={{ display:"grid", gridTemplateColumns:"1fr 1fr 100px 180px 100px 100px", padding:"12px 16px", alignItems:"center", borderBottom: i < subscriptions.length - 1 ? `1px solid ${T.border}` : "none" }}>
                        <div>
                          <div style={{ fontSize:13, fontWeight:600, color:"#fff" }}>{org?.name || `Org #${sub.organizationId}`}</div>
                          <div style={{ fontSize:11, color:T.muted }}>{org?.orgCode || "—"}</div>
                        </div>
                        <div>
                          <div style={{ fontSize:13, fontWeight:600, color:"#fff" }}>{sub.subscriptionPackage?.name}</div>
                          <div style={{ fontSize:11, color:T.muted }}>₹{sub.subscriptionPackage?.price?.toLocaleString("en-IN")}</div>
                        </div>
                        <div><Chip color={C.blue}>{sub.subscriptionPackage?.packageType}</Chip></div>
                        <div style={{ fontSize:12, color:T.muted }}>
                          {new Date(sub.startDate).toLocaleDateString("en-IN")} - {new Date(sub.endDate).toLocaleDateString("en-IN")}
                        </div>
                        <div style={{ fontSize:13, fontWeight:700, color: sub.status === "ACTIVE" ? (daysLeft <= 3 ? C.red : daysLeft <= 10 ? C.gold : C.green) : T.muted }}>
                          {sub.status === "ACTIVE" ? `${daysLeft} Days` : "—"}
                        </div>
                        <div><Chip color={sub.status === "ACTIVE" ? C.green : C.red}>{sub.status}</Chip></div>
                      </div>
                    );
                  })
              }
            </div>
          </div>
        )}

        {/* ════ REVENUE ANALYSIS ════ */}
        {tab === "revenue" && (
          <div style={{ animation: "usaFadeUp .35s ease" }}>
            {revenueLoading ? (
              <div style={{ padding: 48, textAlign: "center", color: T.muted }}><Spinner /> Loading revenue metrics…</div>
            ) : (
              <div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 26 }}>
                  <StatCard icon="💵" label="Total Revenue" value={`₹${(revenueData?.totalRevenue || 0).toLocaleString("en-IN")}`} color={C.green} />
                  <StatCard icon="📈" label="Monthly Recur. Revenue (MRR)" value={`₹${Math.round(revenueData?.mrr || 0).toLocaleString("en-IN")}`} color={C.blue} />
                  <StatCard icon="📊" label="Annual Recur. Revenue (ARR)" value={`₹${Math.round(revenueData?.arr || 0).toLocaleString("en-IN")}`} color={C.purple} />
                  <StatCard icon="🏢" label="Active Subscriptions" value={revenueData?.activeSubscriptionsCount || 0} color={C.gold} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20, marginBottom: 26, alignItems: "stretch" }}>
                  {/* Historical Growth Chart */}
                  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 18, display: "flex", flexDirection: "column" }}>
                    <h3 style={{ fontFamily: "Syne", fontSize: 15, fontWeight: 800, color: "#fff", margin: "0 0 4px" }}>Historical Sales Growth</h3>
                    <p style={{ color: T.muted, fontSize: 11, margin: "0 0 16px" }}>Monthly sales revenue trend from organization subscriptions</p>
                    
                    <div style={{ flex: 1, minHeight: 280 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={
                          revenueData && revenueData.historicalRevenue
                            ? Object.entries(revenueData.historicalRevenue).map(([key, val]) => ({
                                month: key,
                                "Revenue": val
                              }))
                            : []
                        } margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={C.green} stopOpacity={0.3}/>
                              <stop offset="95%" stopColor={C.green} stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="month" stroke={T.muted} style={{ fontSize: 10 }} />
                          <YAxis stroke={T.muted} style={{ fontSize: 10 }} />
                          <Tooltip contentStyle={{ background: T.card2, border: `1.5px solid ${T.border}`, borderRadius: 8, color: "#fff" }} />
                          <Area type="monotone" dataKey="Revenue" stroke={C.green} fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Growth Forecast Slider */}
                  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 18, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <h3 style={{ fontFamily: "Syne", fontSize: 15, fontWeight: 800, color: "#fff", margin: "0 0 4px" }}>Interactive Revenue Projection</h3>
                      <p style={{ color: T.muted, fontSize: 11, margin: "0 0 16px" }}>Simulate sales growth based on a MoM compound rate</p>
                      
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", color: "#fff", fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
                          <span>Target Growth Rate (MoM):</span>
                          <span style={{ color: C.gold, fontSize: 14, fontWeight: 800 }}>{customGrowthRate}%</span>
                        </div>
                        <input type="range" min="0" max="50" step="1" value={customGrowthRate} onChange={e => setCustomGrowthRate(Number(e.target.value))}
                          style={{ width: "100%", accentColor: C.gold, cursor: "pointer", background: "rgba(255,255,255,0.1)", borderRadius: 4, height: 6 }} />
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: T.muted, marginTop: 6 }}>
                          <span>0% (Steady)</span>
                          <span>25%</span>
                          <span>50% (High Growth)</span>
                        </div>
                      </div>
                      
                      <div style={{ borderTop: `1px solid rgba(255,255,255,0.06)`, paddingTop: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.muted, marginBottom: 6 }}>
                          <span>Avg. Historical Rate:</span>
                          <span style={{ color: "#fff", fontWeight: 600 }}>{Math.round((revenueData?.avgHistoricalGrowthRate || 0.10) * 100)}%</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.muted }}>
                          <span>Simulated 6mo MRR:</span>
                          <span style={{ color: C.blue, fontWeight: 700 }}>₹{Math.round(projectedData[5]?.["Projected MRR"] || 0).toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.5, background: "rgba(255,255,255,0.02)", border: `1px solid ${T.border}`, borderRadius: 8, padding: 10, marginTop: 12 }}>
                      💡 Historical MoM rate is automatically computed based on previous subscription activations. Use the slider to forecast potential shifts.
                    </div>
                  </div>
                </div>

                {/* 6-Month Projection Chart */}
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: 18 }}>
                  <h3 style={{ fontFamily: "Syne", fontSize: 15, fontWeight: 800, color: "#fff", margin: "0 0 4px" }}>6-Month Forecast Chart</h3>
                  <p style={{ color: T.muted, fontSize: 11, margin: "0 0 16px" }}>Estimated Monthly Recurring Revenue and Cumulative Earnings</p>
                  
                  <div style={{ minHeight: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={projectedData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <XAxis dataKey="month" stroke={T.muted} style={{ fontSize: 10 }} />
                        <YAxis stroke={T.muted} style={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ background: T.card2, border: `1.5px solid ${T.border}`, borderRadius: 8, color: "#fff" }} />
                        <Legend wrapperStyle={{ fontSize: 11, color: T.muted }} />
                        <Line type="monotone" dataKey="Projected MRR" stroke={C.blue} strokeWidth={2.5} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="Projected Cumulative" stroke={C.purple} strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════ RENEWAL ALERTS & ACTIONS ════ */}
        {tab === "renewals" && (
          <div style={{ animation: "usaFadeUp .35s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontFamily: "Syne", fontSize: 21, fontWeight: 900, color: "#fff", margin: "0 0 4px" }}>Organization Renewal Center</h2>
                <p style={{ color: T.muted, fontSize: 13, margin: 0 }}>Scan plan expirations, trigger automated system alerts, and send manual email reminders.</p>
              </div>
              
              <button onClick={handleTriggerScan} disabled={triggeringCheck} style={{
                background: triggeringCheck ? "rgba(245,158,11,0.3)" : `linear-gradient(135deg, ${C.gold}, ${C.red})`,
                border: "none", color: "#000", padding: "10px 18px", borderRadius: 9, fontWeight: 700,
                fontSize: 13, cursor: triggeringCheck ? "not-allowed" : "pointer", fontFamily: "'DM Sans',sans-serif",
                display: "flex", alignItems: "center", gap: 6
              }}>
                {triggeringCheck ? <Spinner /> : "⚡"} Force Expiry Scan
              </button>
            </div>

            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 180px 100px 100px 120px", padding: "10px 16px", borderBottom: `1px solid ${T.border}`, fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: .5 }}>
                <span>Organization</span><span>Package</span><span>Validity</span><span>Days Left</span><span>Status</span><span>Reminder</span>
              </div>
              
              {subscriptions.length === 0 ? (
                <div style={{ padding: 32, textAlign: "center", color: T.muted, fontSize: 13 }}>No subscriptions found.</div>
              ) : (
                [...subscriptions]
                  .sort((a, b) => {
                    if (a.status === "ACTIVE" && b.status !== "ACTIVE") return -1;
                    if (a.status !== "ACTIVE" && b.status === "ACTIVE") return 1;
                    return new Date(a.endDate) - new Date(b.endDate);
                  })
                  .map((sub, i) => {
                    const org = orgs.find(o => o.id === sub.organizationId);
                    const diff = new Date(sub.endDate) - new Date();
                    const daysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
                    const isUrgent = sub.status === "ACTIVE" && daysLeft <= 10;
                    
                    return (
                      <div key={sub.id} className="usa-row" style={{
                        display: "grid", gridTemplateColumns: "1.2fr 1fr 180px 100px 100px 120px",
                        padding: "12px 16px", alignItems: "center", borderBottom: i < subscriptions.length - 1 ? `1px solid ${T.border}` : "none",
                        background: isUrgent ? "rgba(239,68,68,0.02)" : "transparent"
                      }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{org?.name || `Org #${sub.organizationId}`}</div>
                          <div style={{ fontSize: 11, color: T.muted }}>{org?.email || "—"}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{sub.subscriptionPackage?.name}</div>
                          <div style={{ fontSize: 11, color: T.muted }}>₹{sub.subscriptionPackage?.price?.toLocaleString("en-IN")}</div>
                        </div>
                        <div style={{ fontSize: 12, color: T.muted }}>
                          {new Date(sub.startDate).toLocaleDateString("en-IN")} - {new Date(sub.endDate).toLocaleDateString("en-IN")}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: sub.status === "ACTIVE" ? (daysLeft <= 3 ? C.red : daysLeft <= 10 ? C.gold : C.green) : T.muted }}>
                          {sub.status === "ACTIVE" ? `${daysLeft} Days` : "Expired"}
                        </div>
                        <div>
                          <Chip color={sub.status === "ACTIVE" ? C.green : C.red}>{sub.status}</Chip>
                        </div>
                        <div>
                          {sub.status === "ACTIVE" && (
                            <button
                              onClick={() => handleSendReminder(sub.id, org?.name || `Org #${sub.organizationId}`)}
                              disabled={remindingSubId === sub.id}
                              style={{
                                background: remindingSubId === sub.id ? "rgba(6,182,212,0.1)" : "rgba(245,158,11,0.1)",
                                border: `1px solid ${remindingSubId === sub.id ? "rgba(6,182,212,0.2)" : "rgba(245,158,11,0.2)"}`,
                                color: remindingSubId === sub.id ? C.blue : C.gold,
                                padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: remindingSubId === sub.id ? "not-allowed" : "pointer",
                                width: "100%", textAlign: "center", fontFamily: "'DM Sans',sans-serif"
                              }}
                            >
                              {remindingSubId === sub.id ? <Spinner /> : "✉️ Remind"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        )}
      </main>

      {/* ════ CREATE ORG MODAL ════ */}
      {showOrgModal && (
        <Modal title="🏢 Create Organization" onClose={() => { setShowOrgModal(false); setOrgErr(""); }}>
          <Field label="Organization Name" value={orgForm.name}       onChange={v=>setOrgForm(p=>({...p,name:v}))}        placeholder="e.g. Zenelait Academy" required />
          <Field label="Email" type="email" value={orgForm.email}     onChange={v=>setOrgForm(p=>({...p,email:v}))}        placeholder="org@email.com" required />
          <Field label="Phone"             value={orgForm.phone}      onChange={v=>setOrgForm(p=>({...p,phone:v}))}        placeholder="Contact number" />
          <Field label="Address"           value={orgForm.address}    onChange={v=>setOrgForm(p=>({...p,address:v}))}      placeholder="Street address" />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Field label="City"   value={orgForm.city}    onChange={v=>setOrgForm(p=>({...p,city:v}))}    placeholder="Chennai" />
            <Field label="Country" value={orgForm.country} onChange={v=>setOrgForm(p=>({...p,country:v}))} placeholder="India" />
          </div>
          <Field label="Description" value={orgForm.description} onChange={v=>setOrgForm(p=>({...p,description:v}))} placeholder="Brief description" />
          {orgErr && <div style={{ background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.25)", borderRadius:8, padding:"8px 12px", marginBottom:12, fontSize:12, color:"#FCA5A5" }}>❌ {orgErr}</div>}
          <button className="usa-submit" onClick={handleCreateOrg} disabled={orgSaving}>{orgSaving ? <><Spinner />Saving…</> : "Create Organization →"}</button>
        </Modal>
      )}

      {/* ════ CREATE SUPER ADMIN MODAL ════ */}
      {showAdmModal && (
        <Modal title="👑 Create Super Admin" onClose={() => { setShowAdmModal(false); setAdmErr(""); }}>
          <Field label="Full Name"           value={admForm.name}       onChange={v=>setAdmForm(p=>({...p,name:v}))}       placeholder="Full name" required />
          <Field label="Email" type="email"  value={admForm.email}      onChange={v=>setAdmForm(p=>({...p,email:v}))}      placeholder="superadmin@email.com" required />
          <Field label="Password" type="password" value={admForm.password} onChange={v=>setAdmForm(p=>({...p,password:v}))} placeholder="Min 8 characters" required />
          <Field label="Academy Name"        value={admForm.academyName} onChange={v=>setAdmForm(p=>({...p,academyName:v}))} placeholder="Academy / Institute name" />
          <div style={{ marginBottom:13 }}>
            <label style={{ display:"block", fontSize:12, fontWeight:600, color:T.muted, marginBottom:5 }}>Organization <span style={{ color:C.gold }}>*</span></label>
            <select value={admForm.organizationId} onChange={e => setAdmForm(p=>({...p,organizationId:e.target.value}))}
              className="usa-input" style={{ cursor:"pointer" }}>
              <option value="">-- Select Organization --</option>
              {orgs.filter(o=>o.active).map(o => <option key={o.id} value={o.id} style={{ background:T.card2 }}>{o.name} ({o.orgCode})</option>)}
            </select>
          </div>
          <Field label="Phone" value={admForm.phone} onChange={v=>setAdmForm(p=>({...p,phone:v}))} placeholder="Contact number" />
          {admErr && <div style={{ background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.25)", borderRadius:8, padding:"8px 12px", marginBottom:12, fontSize:12, color:"#FCA5A5" }}>❌ {admErr}</div>}
          <button className="usa-submit" onClick={handleCreateAdmin} disabled={admSaving}>{admSaving ? <><Spinner />Saving…</> : "Create Super Admin →"}</button>
        </Modal>
      )}

      {/* ════ CREATE FEATURE MODAL ════ */}
      {showFeatModal && (
        <Modal title="⚙️ Create New Feature" onClose={() => { setShowFeatModal(false); setFeatErr(""); }}>
          <Field label="Feature Name" value={featForm.name} onChange={v => setFeatForm(p => ({...p, name: v}))} placeholder="e.g. Interactive AI Chat" required />
          <Field label="Feature Key" value={featForm.featureKey} onChange={v => setFeatForm(p => ({...p, featureKey: v.toUpperCase().replace(/\s+/g, "_")}))} placeholder="e.g. AI_CHAT" required />
          <Field label="Description" value={featForm.description} onChange={v => setFeatForm(p => ({...p, description: v}))} placeholder="What this feature does" />
          {featErr && <div style={{ background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.25)", borderRadius:8, padding:"8px 12px", marginBottom:12, fontSize:12, color:"#FCA5A5" }}>❌ {featErr}</div>}
          <button className="usa-submit" onClick={handleCreateFeature} disabled={featSaving}>{featSaving ? <><Spinner />Saving…</> : "Create Feature →"}</button>
        </Modal>
      )}

      {/* ════ CREATE PACKAGE MODAL ════ */}
      {showPkgModal && (
        <Modal title="💎 Create Subscription Package" onClose={() => { setShowPkgModal(false); setPkgErr(""); }}>
          <Field label="Package Name" value={pkgForm.name} onChange={v => setPkgForm(p => ({...p, name: v}))} placeholder="e.g. Premium Plan" required />
          <div style={{ marginBottom: 13 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 5 }}>Package Type <span style={{ color: C.gold }}>*</span></label>
            <select value={pkgForm.packageType} onChange={e => setPkgForm(p => ({...p, packageType: e.target.value}))} className="usa-input" style={{ cursor: "pointer" }}>
              <option value="MONTHLY" style={{ background: T.card2 }}>Monthly</option>
              <option value="YEARLY" style={{ background: T.card2 }}>Yearly</option>
            </select>
          </div>
          <Field label="Price (₹)" type="number" value={pkgForm.price} onChange={v => setPkgForm(p => ({...p, price: v}))} placeholder="e.g. 999" required />
          <Field label="Duration (Days)" type="number" value={pkgForm.durationDays} onChange={v => setPkgForm(p => ({...p, durationDays: v}))} placeholder="Leave empty for type defaults (30/365)" />
          <Field label="Description" value={pkgForm.description} onChange={v => setPkgForm(p => ({...p, description: v}))} placeholder="Brief details about package benefits" />
          {pkgErr && <div style={{ background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.25)", borderRadius: 8, padding: "8px 12px", marginBottom: 12, fontSize: 12, color: "#FCA5A5" }}>❌ {pkgErr}</div>}
          <button className="usa-submit" onClick={handleCreatePackage} disabled={pkgSaving}>{pkgSaving ? <><Spinner />Saving…</> : "Create Package →"}</button>
        </Modal>
      )}

      {/* ════ ASSIGN SUBSCRIPTION MODAL ════ */}
      {showAssignModal && (
        <Modal title="💎 Assign Subscription to Organization" onClose={() => { setShowAssignModal(false); setAssignErr(""); }}>
          <div style={{ marginBottom: 13 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 5 }}>Organization <span style={{ color: C.gold }}>*</span></label>
            <select value={assignForm.organizationId} onChange={e => setAssignForm(p => ({...p, organizationId: e.target.value}))} className="usa-input" style={{ cursor: "pointer" }}>
              <option value="">-- Select Organization --</option>
              {orgs.filter(o => o.active).map(o => <option key={o.id} value={o.id} style={{ background: T.card2 }}>{o.name} ({o.orgCode})</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 13 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 5 }}>Package <span style={{ color: C.gold }}>*</span></label>
            <select value={assignForm.packageId} onChange={e => setAssignForm(p => ({...p, packageId: e.target.value}))} className="usa-input" style={{ cursor: "pointer" }}>
              <option value="">-- Select Package --</option>
              {packages.filter(p => p.active).map(p => <option key={p.id} value={p.id} style={{ background: T.card2 }}>{p.name} (₹{p.price}/{p.packageType.toLowerCase()})</option>)}
            </select>
          </div>
          {assignErr && <div style={{ background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.25)", borderRadius: 8, padding: "8px 12px", marginBottom: 12, fontSize: 12, color: "#FCA5A5" }}>❌ {assignErr}</div>}
          <button className="usa-submit" onClick={handleAssignSubscription} disabled={assignSaving}>{assignSaving ? <><Spinner />Assigning…</> : "Assign Subscription →"}</button>
        </Modal>
      )}

      {/* ════ EXPIRING PLAN ALERT POPUP ════ */}
      {showExpiringPopup && expiringOrgs.length > 0 && (
        <Modal title="⚠️ Plan Expiry Warning" onClose={() => setShowExpiringPopup(false)}>
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>⚠️</div>
            <h3 style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 16, color: C.red, marginBottom: 12 }}>
              ORGANIZATION PLAN EXPIRES TOMORROW!
            </h3>
            <p style={{ fontSize: 13, color: T.text, lineHeight: 1.5, marginBottom: 20 }}>
              The following organizations have active subscriptions expiring within 24 hours:
            </p>
            <div style={{ maxHeight: "200px", overflowY: "auto", background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}`, borderRadius: 10, padding: 12, marginBottom: 20, textAlign: "left" }}>
              {expiringOrgs.map((org, index) => (
                <div key={index} style={{ padding: "8px 0", borderBottom: index < expiringOrgs.length - 1 ? `1px solid ${T.border}` : "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontWeight: 700, color: "#fff", fontSize: 13 }}>{org.orgName}</span>
                    <span style={{ fontSize: 11, color: T.muted, marginLeft: 8 }}>({org.orgCode})</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.red, background: "rgba(239,68,68,0.15)", padding: "2px 8px", borderRadius: 4 }}>Tomorrow</span>
                </div>
              ))}
            </div>
            <button className="usa-submit" onClick={() => { setShowExpiringPopup(false); setTab("packages"); }}>
              Manage Subscriptions →
            </button>
          </div>
        </Modal>
      )}

      {/* Slide-out Notification Drawer */}
      {showNotifDrawer && (
        <div style={{
          position: "fixed", top: 0, right: 0, bottom: 0, width: 360,
          background: T.card2, borderLeft: `1.5px solid ${T.border}`, zIndex: 9999,
          boxShadow: "-8px 0 32px rgba(0,0,0,0.5)", display: "flex", flexDirection: "column",
          animation: "usaFadeLeft 0.3s ease-out"
        }}>
          <div style={{ padding: "20px 18px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontFamily: "Syne", fontSize: 16, fontWeight: 800, color: "#fff", margin: 0 }}>Notification Logs</h3>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {notifications.some(n => !n.read) && (
                <button onClick={handleMarkAllRead} style={{ background: "transparent", border: "none", color: C.gold, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Mark all read</button>
              )}
              <button onClick={() => setShowNotifDrawer(false)} style={{ background: "rgba(255,255,255,.08)", border: "none", color: T.muted, width: 24, height: 24, borderRadius: 6, cursor: "pointer", fontSize: 14 }}>×</button>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 8px" }}>
            {notifications.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: T.muted, fontSize: 13 }}>No notification history.</div>
            ) : (
              notifications.map(n => (
                <div key={n.id} style={{
                  padding: 12, borderRadius: 8, background: n.read ? "transparent" : "rgba(245,158,11,0.04)",
                  border: `1px solid ${n.read ? "transparent" : "rgba(245,158,11,0.15)"}`,
                  marginBottom: 8, position: "relative", transition: "all 0.2s"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ fontSize: 12, color: n.read ? "#A78BFA" : "#fff", fontWeight: n.read ? 400 : 600, lineHeight: 1.4 }}>{n.message}</div>
                    {!n.read && (
                      <button onClick={() => handleMarkRead(n.id)} style={{
                        background: "rgba(245,158,11,0.1)", border: "none", color: C.gold, fontSize: 10,
                        padding: "2px 6px", borderRadius: 4, cursor: "pointer", height: "fit-content", flexShrink: 0
                      }}>Read</button>
                    )}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6, fontSize: 10, color: T.muted }}>
                    <span>{n.type}</span>
                    <span>{new Date(n.createdAt).toLocaleDateString("en-IN")}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
