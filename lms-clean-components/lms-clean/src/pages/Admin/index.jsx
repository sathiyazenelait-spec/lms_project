import { useState, useEffect, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import { useAdminProfile } from "../../context/AdminProfileContext";
import { T } from "../../assets/styles/theme";
import {
  Btn, Card, Badge, Avatar, Input, Select,
  StatCard, Table, Tabs, ProgressBar, DonutChart,
  MiniBarChart, PageHeader, ProfileAlert, Modal, calcProfileCompletion,
} from "../../components/UI";
import { DashLayout } from "../../components/Layout";
import {
  getAdminStats,
  getRevenueSummary,
  getAdminProfile,
  updateAdminProfile,
  getAllStudents,
  getAllTeachers,
  getAllParents,
  deleteStudent,
  deleteTeacher,
  deleteParent,
  toggleStudent,
  toggleTeacher,
  getAllCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  getCourseStudents,
  enrollStudentsInCourse,
  unenrollStudentFromCourse,
  getAllBatches,
  createBatch,
  updateBatch,
  deleteBatch,
  addStudentsToBatch,
  removeStudentFromBatch,
  assignCourseToBatch,
  getAllFees,
  createFee,
  markFeePaid,
  generateBatchFee,
  getAllAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  syncBatchStatuses,
  cleanupCrossDeptStudents,
  getAllDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  toggleDepartment,
  getAdminNotifications,
  markAdminNotifRead,
  markAdminNotifReadAll,
  getContactMessages,
  updateContactStatus,
  deleteContactMessage,
  getActiveTimetable,
  getActiveBatchesForTT,
  createTimetableSlot,
  updateTimetableSlot,
  deleteTimetableSlot,
  getBatchCourses,
  addCourseToBatch,
  removeCourseFromBatch,
  getNonsuperAdmins,
  getOrgDepartments,
  deleteAdmin, registerUser ,adminRegisterUser,
  getAdminEnrollmentRequests, approveEnrollmentRequest, rejectEnrollmentRequest,
  getAdminTeachersPerformance, getAdminTeacherReviews, issueAdminCertificate,
  getMeetings, createMeeting, updateMeeting, cancelMeeting, deleteMeeting,
  checkMeetingConflicts, submitOpinionResponse, markMeetingAttendance,
  selfCheckInMeeting, sendAbsenteeFollowUp,
  adminGetActiveSubscription, adminGetPackages, adminSubscribe,
  getOrganizations,
  getAdminLeaves, createAdminLeave, deleteAdminLeave, getCourseWorkingDays
} from "../../api/auth";
import { initiatePayment } from "../../api/payment";

// ── Shared email warning popup ─────────────────────────────────────────────────
const showEmailWarnings = (warnings) => {
  if (!warnings || warnings.length === 0) return;
  const cantReach = warnings.filter(w => w?.startsWith("Can't reach"));
  const failed    = warnings.filter(w => w?.startsWith("Failed to send"));
  if (cantReach.length > 0) {
    alert("⚠️ Some emails couldn't be delivered (wrong address?):\n" +
      cantReach.map(w => "  • " + w).join("\n"));
  } else if (failed.length > 0) {
    alert("❌ Some emails failed to send:\n" +
      failed.map(w => "  • " + w).join("\n") +
      "\n\nCheck server logs for details.");
  }
};



const confirmAction = (msg) => window.confirm(msg);

// ─── ADMIN OVERVIEW ───────────────────────────────────────────────────────────
export const AdminOverview = ({ onNav }) => {
  const authData = JSON.parse(localStorage.getItem("zenelait-auth") || "{}");
  const isSuperAdmin = authData.superAdmin === true;

  const [stats, setStats] = useState({
    totalStudents: 0, totalTeachers: 0, totalParents: 0,
    totalAdmins: 0, totalCourses: 0, totalDepartments: 0,
    thisMonthStudents: 0, revenueThisMonth: "₹0", activeCourses: 0, activeBatches: 0,
  });
  const [revenue, setRevenue] = useState({
    collected: "₹0", pending: "₹0", total: "₹0",
    chartData: [0, 0, 0, 0, 0, 0],
    chartLabels: ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true); setError(null);
      const promises = [getAdminStats()];
      if (isSuperAdmin) {
        promises.push(getRevenueSummary());
      }
      const [data, rev] = await Promise.all(promises);
      setStats({
        totalStudents:     data?.totalStudents     ?? 0,
        totalTeachers:     data?.totalTeachers     ?? 0,
        totalParents:      data?.totalParents      ?? 0,
        totalAdmins:       data?.totalAdmins       ?? 0,
        totalCourses:      data?.totalCourses      ?? 0,
        totalDepartments:  data?.totalDepartments  ?? 0,
        thisMonthStudents: data?.thisMonthStudents  ?? 0,
        revenueThisMonth:  data?.revenueThisMonth != null ? `₹${Number(data.revenueThisMonth).toLocaleString("en-IN")}` : "₹0",
        activeCourses:     data?.activeCourses     ?? 0,
        activeBatches:     data?.activeBatches     ?? 0,
      });
      if (isSuperAdmin && rev?.monthlyChart) {
        const labels  = Object.keys(rev.monthlyChart);
        const values  = Object.values(rev.monthlyChart).map(Number);
        const maxVal  = Math.max(...values, 1);
        setRevenue({
          collected:   `₹${Number(rev.collected).toLocaleString("en-IN")}`,
          pending:     `₹${Number(rev.pending).toLocaleString("en-IN")}`,
          total:       `₹${Number(rev.total).toLocaleString("en-IN")}`,
          chartData:   values.map(v => Math.round((v / maxVal) * 100)),
          chartLabels: labels,
        });
      }
    } catch { setError("Failed to load dashboard stats."); }
    finally { setLoading(false); }
  };

  return (
    <div className="fade-up">
      <PageHeader title="Admin Dashboard" subtitle="Full system overview — Zenelait InfoTech Academy"
        actions={[<Btn size="sm" variant="ghost" onClick={fetchDashboard}>🔄 Refresh</Btn>]} />
      {error && <div style={{ background: `${T.accentR}20`, border: `1px solid ${T.accentR}40`, borderRadius: 10, padding: "10px 16px", marginBottom: 18, fontSize: 13, color: T.accentR }}>⚠️ {error}</div>}
      <div style={{ display: "grid", gridTemplateColumns: isSuperAdmin ? "repeat(4,1fr)" : "repeat(3,1fr)", gap: 18, marginBottom: 18 }}>
        <StatCard icon="👨‍🎓" label="Total Students"       value={loading ? "…" : stats.totalStudents}     change={`↑ ${stats.thisMonthStudents} this month`} color={T.primaryL} />
        <StatCard icon="👨‍🏫" label="Teachers"              value={loading ? "…" : stats.totalTeachers}     color={T.accent}  />
        <StatCard icon="👨‍👩‍👦" label="Parents"               value={loading ? "…" : stats.totalParents}      color={T.accentR} />
        {isSuperAdmin && (
          <StatCard icon="💰"  label="Revenue (This Month)"  value={loading ? "…" : stats.revenueThisMonth}  color={T.accentY} />
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18, marginBottom: 24 }}>
        <StatCard icon="📚" label="Active Courses"    value={loading ? "…" : stats.activeCourses}    change={`${stats.totalCourses} total`} color={T.accentG}  />
        <StatCard icon="🏫" label="Active Batches"    value={loading ? "…" : stats.activeBatches}    color={T.accent}   />
        <StatCard icon="🏢" label="Departments"       value={loading ? "…" : stats.totalDepartments} change="Manage →"   color={T.primaryL} />
        <StatCard icon="🛡️" label="Admins"            value={loading ? "…" : stats.totalAdmins}      color={T.accentR}  />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isSuperAdmin ? "2fr 1fr" : "1fr", gap: 20 }}>
        {isSuperAdmin && (
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 15 }}>Revenue — Last 6 Months</div>
              <Btn size="xs" variant="dark">⬇ Export PDF</Btn>
            </div>
            <MiniBarChart data={revenue.chartData} color={T.primary} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: T.muted, marginTop: 6 }}>
              {revenue.chartLabels.map((m, i) => <span key={m}>{m}{i === revenue.chartLabels.length - 1 ? " ⭐" : ""}</span>)}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginTop: 18 }}>
              {[["Collected", revenue.collected, T.accentG], ["Pending", revenue.pending, T.accentY], ["Total", revenue.total, T.accent]].map(([l, v, c]) => (
                <div key={l} style={{ background: T.bg3, borderRadius: 10, padding: 12, textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: T.muted }}>{l}</div>
                  <div style={{ fontFamily: "Syne", fontSize: 18, fontWeight: 800, color: c }}>{v}</div>
                </div>
              ))}
            </div>
          </Card>
        )}
        <div style={{ display: "grid", gridTemplateColumns: isSuperAdmin ? "1fr" : "1fr 1fr", gap: 20 }}>
          <Card style={{ marginBottom: isSuperAdmin ? 18 : 0 }}>
            <div style={{ fontFamily: "Syne", fontWeight: 700, marginBottom: 14 }}>Quick Actions</div>
            {[[ "👥 Manage Users", "users" ], [ "📚 Add Course", "courses" ], [ "🏢 Departments", "departments" ], isSuperAdmin ? [ "📈 Revenue Report", "revenue" ] : null]
              .filter(Boolean)
              .map(([l, key]) => (
                <div key={l} onClick={() => onNav(key)}
                  style={{ padding: "9px 12px", borderRadius: 8, cursor: "pointer", fontSize: 13, marginBottom: 6, background: T.bg3, border: `1px solid ${T.border}`, transition: "all .2s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = T.primary; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; }}
                >{l}</div>
              ))}
          </Card>
          <Card>
            <div style={{ fontFamily: "Syne", fontWeight: 700, marginBottom: 14 }}>System Status</div>
            {[["Server", "● Online", T.accentG], ["Database", "● Healthy", T.accentG], ["Storage", "68%", T.accentY]].map(([l, v, c]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "8px 0", borderBottom: `1px solid rgba(45,33,96,.4)` }}>
                <span style={{ color: T.muted }}>{l}</span><span style={{ color: c, fontWeight: 700 }}>{v}</span>
              </div>
            ))}
            <ProgressBar value={68} color={T.accentY} height={6} />
          </Card>
        </div>
      </div>
    </div>
  );
};

// ─── ADMIN PROFILE ────────────────────────────────────────────────────────────
export const AdminProfile = () => {
  const [form, setForm]           = useState({ name: "", phone: "", address: "", academyName: "", userId: "" });
  const [saving, setSaving]       = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef              = useRef(null);
  const { profilePhoto: photo, setProfilePhoto: setPhoto, setProfileName } = useAdminProfile();
  const { pct, missing } = calcProfileCompletion("admin", { ...form, profilePicUrl: photo });

  useEffect(() => {
    getAdminProfile().then(raw => {
      // Handle both flat response and nested { data: {...} } response
      const data = raw?.id ? raw : (raw?.data ?? raw ?? {});
    setForm({
        name:        data?.name        || "",
        phone:       data?.phone       || "",
        address:     data?.address     || "",
        academyName: data?.academyName || "",
        email:       data?.email       || "",
        userId:      data?.userId      || `ADM-${data?.id || "UNKNOWN"}`,
      });      
      if (data?.profilePicUrl) setPhoto(data.profilePicUrl);
      if (data?.name)          setProfileName(data.name);
    }).catch(console.error);
  }, []);

  const handleSave = async () => {
    try { setSaving(true); await updateAdminProfile(form); setProfileName(form.name); alert("Profile updated!"); }
    catch (err) { alert("Failed: " + err.message); } finally { setSaving(false); }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result; setPhoto(dataUrl);
      try { setUploading(true); await updateAdminProfile({ profilePicUrl: dataUrl }); }
      catch (err) { alert("Photo upload failed: " + err.message); setPhoto(null); }
      finally { setUploading(false); }
    };
    reader.readAsDataURL(file); e.target.value = "";
  };

  return (
    <div className="fade-up">
      <PageHeader title="Admin Profile" />
      <ProfileAlert pct={pct} missing={missing} onComplete={() => document.querySelector("input")?.focus()} />
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24 }}>
        <Card style={{ textAlign: "center", padding: 32 }}>
          <DonutChart pct={pct} color={T.primaryL} />
          <div style={{ position: "relative", width: 80, margin: "0 auto" }}>
            {photo ? (
              <div style={{ width: 80, height: 80, borderRadius: "50%", overflow: "hidden", border: `3px solid ${T.primaryL}` }}>
                <img src={photo} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ) : <Avatar name="Z" size={80} color={T.accentY} />}
            {uploading && <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>⏳</div>}
          </div>
          <div style={{ fontFamily: "Syne", fontSize: 18, fontWeight: 800, marginTop: 12 }}>{form.name || "Zenelait Admin"}</div>
          <div style={{ fontSize: 13, color: T.muted }}>{form.userId}</div>
          <Btn variant="dark" size="sm" full style={{ marginTop: 16 }} disabled={uploading} onClick={() => fileInputRef.current.click()}>
            📷 {uploading ? "Uploading…" : photo ? "Change Photo" : "Upload Photo (Optional)"}
          </Btn>
          {photo && !uploading && <Btn variant="ghost" size="sm" full style={{ marginTop: 8 }} onClick={() => { setPhoto(null); updateAdminProfile({ profilePicUrl: "" }).catch(console.error); }}>✕ Remove Photo</Btn>}
        </Card>
        <Card style={{ padding: 28 }}>
          <div style={{ fontFamily: "Syne", fontSize: 17, fontWeight: 800, marginBottom: 20 }}>Update Profile</div>
          <Input label="Academy Name"  value={form.academyName} onChange={e => setForm(f => ({ ...f, academyName: e.target.value }))} />
          <Input label="Full Name"     value={form.name}        onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <Input label="Email Address" value={form.email || ""} onChange={() => {}} style={{ opacity: 0.6, cursor: "not-allowed" }} />
          <Input label="Mobile Number" value={form.phone}       onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" />
          <Input label="Address"       value={form.address}     onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Street address" />
          <Btn variant="primary" size="lg" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Profile →"}</Btn>
        </Card>
      </div>
    </div>
  );
};

// ─── DEPARTMENTS ──────────────────────────────────────────────────────────────
export const AdminDepartments = () => {
  const [depts, setDepts]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState({ name: "", description: "" });
  const [saving, setSaving]   = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const raw = await getAdminProfile();
      const profile = raw?.id ? raw : (raw?.data ?? raw ?? {});
      const orgId = profile?.organizationId;
      
      if (orgId) {
        const d = await getAllDepartments();
        setDepts(Array.isArray(d) ? d : []);
      } else {
        setDepts([]);
      }
    } catch (err) {
      console.error(err);
      setDepts([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm({ name: "", description: "" }); setModal("create"); };
  const openEdit   = (dept) => { setEditing(dept); setForm({ name: dept.name, description: dept.description || "" }); setModal("edit"); };

  const handleSave = async () => {
    if (!form.name.trim()) { alert("Department name is required."); return; }
    
    // Check for duplicate department name case-insensitively and whitespace-insensitively
    const cleanNewName = form.name.replace(/\s+/g, "").toLowerCase();
    const isDuplicate = depts.some(d => {
      if (modal === "edit" && d.id === editing?.id) return false;
      return d.name.replace(/\s+/g, "").toLowerCase() === cleanNewName;
    });
    
    if (isDuplicate) {
      alert("Error: A department with this name already exists in your organization (case & space insensitive check).");
      return;
    }

    try {
      setSaving(true);
      if (modal === "create") {
        const created = await createDepartment(form);
        setDepts(d => [...d, created]);
      } else {
        const updated = await updateDepartment(editing.id, form);
        setDepts(d => d.map(x => x.id === editing.id ? updated : x));
      }
      setModal(false);
    } catch (err) { alert("Error: " + err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!confirmAction(`Delete department "${name}"?`)) return;
    await deleteDepartment(id).catch(e => { alert("Error: " + e.message); return; });
    setDepts(d => d.filter(x => x.id !== id));
  };

  const handleToggle = async (dept) => {
    try {
      const updated = await toggleDepartment(dept.id, !dept.active);
      setDepts(d => d.map(x => x.id === dept.id ? updated : x));
    } catch (err) { alert("Error: " + err.message); }
  };

  const active   = depts.filter(d => d.active);
  const inactive = depts.filter(d => !d.active);

  return (
    <div className="fade-up">
      <PageHeader title="Department Management" subtitle={`${active.length} active · ${inactive.length} inactive`}
        actions={[<Btn variant="primary" onClick={openCreate}>+ New Department</Btn>]} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18, marginBottom: 24 }}>
        <StatCard icon="🏢" label="Total Departments" value={depts.length}    color={T.primaryL} />
        <StatCard icon="✅" label="Active"             value={active.length}   color={T.accentG}  />
        <StatCard icon="⏸️" label="Inactive"           value={inactive.length} color={T.accentY}  />
      </div>
      <Card>
        {loading ? (
          <div style={{ padding: 32, textAlign: "center", color: T.muted }}>Loading departments…</div>
        ) : depts.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: T.muted }}>
            No departments yet.
            <div style={{ marginTop: 12 }}><Btn variant="primary" onClick={openCreate}>+ Create First Department</Btn></div>
          </div>
        ) : (
          <Table columns={["Department Name", "Description", "Status", "Actions"]}
            rows={depts.map(d => [
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: `${T.primary}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🏢</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{d.name}</div>
                  <div style={{ fontSize: 11, color: T.muted }}>ID: {d.id}</div>
                </div>
              </div>,
              <span style={{ fontSize: 13, color: T.muted }}>{d.description || "—"}</span>,
              <Badge type={d.active ? "success" : "warning"}>{d.active ? "Active" : "Inactive"}</Badge>,
              <div style={{ display: "flex", gap: 6 }}>
                <Btn size="xs" variant="dark"    onClick={() => openEdit(d)}>✏️ Edit</Btn>
                <Btn size="xs" variant={d.active ? "warning" : "success"} onClick={() => handleToggle(d)}>
                  {d.active ? "⏸ Deactivate" : "▶ Activate"}
                </Btn>
                <Btn size="xs" variant="danger"  onClick={() => handleDelete(d.id, d.name)}>🗑</Btn>
              </div>,
            ])}
          />
        )}
      </Card>
      <Modal open={!!modal} onClose={() => setModal(false)} title={modal === "create" ? "Create New Department" : `Edit: ${editing?.name}`}>
        <p style={{ fontSize: 13, color: T.muted, marginBottom: 16 }}>
          {modal === "create"
            ? "Once created, this department will appear in student and teacher registration forms immediately."
            : "Updating the name here does NOT change the department stored on existing student/teacher records."}
        </p>
        <Input label="Department Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Computer Science" />
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Description</label>
          <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Brief description (optional)"
            style={{ width: "100%", background: T.bg3, border: `1.5px solid ${T.border}`, borderRadius: 9, padding: "10px 14px", fontSize: 13, color: T.text, outline: "none", resize: "vertical", fontFamily: "DM Sans" }}
            onFocus={e => e.target.style.borderColor = T.primary} onBlur={e => e.target.style.borderColor = T.border} />
        </div>
        <Btn variant="primary" full size="lg" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : modal === "create" ? "Create Department →" : "Save Changes →"}
        </Btn>
      </Modal>
    </div>
  );
};

// ─── MANAGE USERS ─────────────────────────────────────────────────────────────
export const AdminUsers = () => {

  const [newUser, setNewUser] = useState({
  role: "student",
  name: "",
  email: "",
  password: "",
  department: "",
  organizationName: "",
});
  const [departments, setDepartments] = useState([]);
  const [departmentId, setDepartmentId] = useState(null);
  const [tab, setTab]           = useState("Students");
  const [modal, setModal]       = useState(false);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [parents, setParents]   = useState([]);
  const [admins, setAdmins]     = useState([]);
  const [orgId, setOrgId] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [page, setPage]         = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("");

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const raw = await getAdminProfile();
      // Handle both flat and nested { data: {...} } response shapes
      const profile = raw?.id ? raw : (raw?.data ?? raw ?? {});

      // console.log("Admin profile:", profile);
      setOrgId(profile?.organizationId || null);
      const depts = await getOrgDepartments(profile?.organizationId);
      const deptList = depts || [];

      setDepartments(deptList);

      if (deptList.length === 0) {
      console.warn("No departments found for this organization");
      }


      // ✅ Use profile.superAdmin boolean directly (NOT profile.role)
      const superAdmin = profile?.superAdmin === true;
      setIsSuperAdmin(superAdmin);

      if (superAdmin) {
        // Super admin: loads admins list + students + teachers + parents
        const [a, s, t, p] = await Promise.all([
          getNonsuperAdmins(),
          getAllStudents(),
          getAllTeachers(),
          getAllParents(),
        ]);
        setAdmins(Array.isArray(a)    ? a : []);
        setStudents(Array.isArray(s)  ? s : []);
        setTeachers(Array.isArray(t)  ? t : []);
        setParents(Array.isArray(p)   ? p : []);
        setTab("Admins"); // default tab for super admin
      } else {
        // Regular admin: only students, teachers, parents
        const [s, t, p] = await Promise.all([
          getAllStudents(),
          getAllTeachers(),
          getAllParents(),
        ]);
        setStudents(Array.isArray(s) ? s : []);
        setTeachers(Array.isArray(t) ? t : []);
        setParents(Array.isArray(p)  ? p : []);
        setTab("Students"); // default tab for regular admin
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };
  const handleCreateUser = async () => {
  try {
    if (!newUser.name || !newUser.email || !newUser.password) {
      alert("Please fill all required fields");
      return;
    }
//     if ((newUser.role === "student" || newUser.role === "teacher") && !departmentId) {
//   alert("Please select a department");
//   return;
// }
console.log("creating user with data:",{...newUser,departmentId,orgId});

    const payload = {
      name: newUser.name,
      email: newUser.email,
      password: newUser.password,
      role: newUser.role.toUpperCase(),

      ...(departmentId && { departmentId }),

      // 🔥 THIS IS IMPORTANT
      organizationId: orgId
    };

    await adminRegisterUser(payload);

    alert("User created successfully ✅");

    setModal(false);
    loadAll();

  } catch (err) {
    console.error(err);
    alert(err.message || "Failed to create user");
  }
};

  // ── Handlers ──
  const onDelStudent = async (id) => { if (!confirmAction("Delete student?")) return; await deleteStudent(id).catch(console.error); setStudents(s => s.filter(x => x.id !== id)); };
  const onDelTeacher = async (id) => { if (!confirmAction("Delete teacher?")) return; await deleteTeacher(id).catch(console.error); setTeachers(t => t.filter(x => x.id !== id)); };
  const onDelParent  = async (id) => { if (!confirmAction("Delete parent?"))  return; await deleteParent(id).catch(console.error);  setParents(p => p.filter(x => x.id !== id)); };
  const onDelAdmin   = async (id, name) => {
    if (!confirmAction(`Delete admin "${name}"? This is permanent.`)) return;
    try { await deleteAdmin(id); setAdmins(a => a.filter(x => x.id !== id)); }
    catch (err) { alert("Error: " + err.message); }
  };
  const onTogStudent = async (id, active) => { await toggleStudent(id, active).catch(console.error); setStudents(s => s.map(x => x.id === id ? { ...x, active } : x)); };
  const onTogTeacher = async (id, active) => { await toggleTeacher(id, active).catch(console.error); setTeachers(t => t.map(x => x.id === id ? { ...x, active } : x)); };

  // ── Filtering and Slicing ──
  const filteredStudents = students.filter(s => {
    const matchesName = s.name && s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = !selectedDept || s.department === selectedDept;
    return matchesName && matchesDept;
  });

  const filteredTeachers = teachers.filter(t => {
    const matchesName = t.name && t.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = !selectedDept || t.department === selectedDept;
    return matchesName && matchesDept;
  });

  const filteredParents = parents.filter(p => 
    p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAdmins = admins.filter(a => 
    a.name && a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Row builders ──
  const pageSize = 15;
  const paginatedStudents = filteredStudents.slice((page - 1) * pageSize, page * pageSize);
  const studentRows = paginatedStudents.map(s => [
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}><Avatar name={s.name} size={28} />{s.name}</div>,
    s.userId || `STU-${s.id}`, s.department || "—", s.email,
    <Badge type={s.active ? "success" : "warning"}>{s.active ? "Active" : "Inactive"}</Badge>,
    <div style={{ display: "flex", gap: 6 }}>
      <Btn size="xs" variant="dark"   onClick={() => onTogStudent(s.id, !s.active)}>{s.active ? "Deactivate" : "Activate"}</Btn>
      <Btn size="xs" variant="danger" onClick={() => onDelStudent(s.id)}>🗑</Btn>
    </div>,
  ]);

  const paginatedTeachers = filteredTeachers.slice((page - 1) * pageSize, page * pageSize);
  const teacherRows = paginatedTeachers.map(t => [
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}><Avatar name={t.name} size={28} color={T.accentG} />{t.name}</div>,
    t.userId || `TCH-${t.id}`, t.department || "—", t.email,
    <Badge type={t.active ? "success" : "warning"}>{t.active ? "Active" : "Inactive"}</Badge>,
    <div style={{ display: "flex", gap: 6 }}>
      <Btn size="xs" variant="dark"   onClick={() => onTogTeacher(t.id, !t.active)}>{t.active ? "Deactivate" : "Activate"}</Btn>
      <Btn size="xs" variant="danger" onClick={() => onDelTeacher(t.id)}>🗑</Btn>
    </div>,
  ]);

  const paginatedParents = filteredParents.slice((page - 1) * pageSize, page * pageSize);
  const parentRows = paginatedParents.map(p => [
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}><Avatar name={p.name} size={28} color={T.accentR} />{p.name}</div>,
    p.userId || `PAR-${p.id}`, p.email, p.phone || "—",
    <Btn size="xs" variant="danger" onClick={() => onDelParent(p.id)}>🗑</Btn>,
  ]);

  const paginatedAdmins = filteredAdmins.slice((page - 1) * pageSize, page * pageSize);
  const adminRows = paginatedAdmins.map(a => [
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <Avatar name={a.name} size={28} color={T.accentY} />{a.name}
    </div>,
    a.userId || `ADM-${a.id}`, a.email, a.phone || "—",
    <Badge type={a.active !== false ? "success" : "warning"}>{a.active !== false ? "Active" : "Inactive"}</Badge>,
    <Btn size="xs" variant="danger" onClick={() => onDelAdmin(a.id, a.name)}>🗑 Delete</Btn>,
  ]);

  // ── Tab config based on role ──
  const tabs = isSuperAdmin
    ? ["Admins", "Students", "Teachers", "Parents"]
    : ["Students", "Teachers", "Parents"];

  return (
    <div className="fade-up">
      <PageHeader
        title={isSuperAdmin ? "Admin Management" : "Manage Users"}
        subtitle={isSuperAdmin
          ? "Super admin view — manage all accounts across the system"
          : "Full system control over students, teachers and parents"}
        actions={[<Btn variant="primary" onClick={() => setModal(true)}>+ Add User</Btn>]}
      />

      {/* Role indicator badge */}
      <div style={{ marginBottom: 14 }}>
        <Badge type={isSuperAdmin ? "danger" : "info"}>
          {isSuperAdmin ? "🔐 Super Admin" : "🛡️ Admin"}
        </Badge>
      </div>

      <Tabs tabs={tabs} active={tab} onChange={(t) => { setTab(t); setPage(1); setSearchQuery(""); setSelectedDept(""); }} />

      <Card>
        {loading ? (
          <div style={{ padding: 32, textAlign: "center", color: T.muted }}>Loading…</div>
        ) : (
          <>
            {/* Search and Filters Header */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
              marginBottom: 20,
              flexWrap: "wrap"
            }}>
              <div style={{ flex: 1, minWidth: 260, position: "relative" }}>
                <input
                  type="text"
                  placeholder={`Search ${tab.toLowerCase()} by name...`}
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
                  style={{
                    width: "100%",
                    background: T.bg3,
                    border: `1.5px solid ${T.border}`,
                    borderRadius: 30,
                    padding: "8px 16px 8px 36px",
                    fontSize: 13,
                    color: T.text,
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />
                <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: T.muted }}>🔍</span>
              </div>
              
              {(tab === "Students" || tab === "Teachers") && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, color: T.muted, fontWeight: 600 }}>Department:</span>
                  <select
                    value={selectedDept}
                    onChange={e => { setSelectedDept(e.target.value); setPage(1); }}
                    style={{
                      background: T.bg3,
                      border: `1.5px solid ${T.border}`,
                      borderRadius: 30,
                      padding: "8px 16px",
                      fontSize: 13,
                      color: T.text,
                      outline: "none",
                      cursor: "pointer"
                    }}
                  >
                    <option value="">All Departments</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            {/* ── Admins tab (super admin only) ── */}
            {tab === "Admins" && isSuperAdmin && (
              <>
                <div style={{
                  background: `${T.accentY}15`, border: `1px solid ${T.accentY}40`,
                  borderRadius: 10, padding: "10px 16px", marginBottom: 16,
                  fontSize: 13, color: T.accentY,
                }}>
                  ⚠️ Showing all non-superadmin admin accounts. Deletion is permanent.
                </div>
                <Table
                  columns={["Admin", "ID", "Email", "Phone", "Status", "Actions"]}
                  rows={adminRows.length ? adminRows : [["No admins found", "", "", "", "", ""]]}
                />
              </>
            )}

            {/* ── Students tab ── */}
            {tab === "Students" && (
              <Table
                columns={["Student", "ID", "Department", "Email", "Status", "Actions"]}
                rows={studentRows.length ? studentRows : [["No students", "", "", "", "", ""]]}
              />
            )}

            {/* ── Teachers tab ── */}
            {tab === "Teachers" && (
              <Table
                columns={["Teacher", "ID", "Department", "Email", "Status", "Actions"]}
                rows={teacherRows.length ? teacherRows : [["No teachers", "", "", "", "", ""]]}
              />
            )}

            {/* ── Parents tab ── */}
            {tab === "Parents" && (
              <Table
                columns={["Parent", "ID", "Email", "Phone", "Actions"]}
                rows={parentRows.length ? parentRows : [["No parents", "", "", "", ""]]}
              />
            )}
            

            {/* Pagination Controls */}
            {(() => {
              const currentArray = tab === "Students" ? filteredStudents 
                                 : tab === "Teachers" ? filteredTeachers 
                                 : tab === "Parents" ? filteredParents 
                                 : filteredAdmins;
              if (currentArray.length <= pageSize) return null;
              const totalPages = Math.ceil(currentArray.length / pageSize);
              return (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 10, padding: 14 }}>
                  <Btn size="sm" variant="ghost" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</Btn>
                  <span style={{ fontSize: 13, alignSelf: 'center', color: T.muted }}>Page {page} of {totalPages}</span>
                  <Btn size="sm" variant="ghost" onClick={() => setPage(p => p < totalPages ? p + 1 : p)} disabled={page >= totalPages}>Next</Btn>
                </div>
              );
            })()}
          </>
        )}
      </Card>

      {/* Add User modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Add New User">

  <Select
    label="User Type"
    value={newUser.role}
    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
    options={[
      { value: "student", label: "Student" },
      { value: "teacher", label: "Teacher" },
      { value: "parent", label: "Parent" },
    ]}
  />

  <Input
    label="Full Name"
    value={newUser.name}
    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
    placeholder="Enter full name"
  />

  <Input
    label="Email"
    type="email"
    value={newUser.email}
    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
    placeholder="user@email.com"
  />

  <Input
    label="Password"
    type="password"
    value={newUser.password}
    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
    placeholder="Minimum 8 characters"
  />

  {(newUser.role === "student" || newUser.role === "teacher") && (
    <div style={{ marginBottom: 14 }}>
  <label
    style={{
      fontSize: 11,
      fontWeight: 700,
      color: T.muted,
      textTransform: "uppercase",
      letterSpacing: 1,
      display: "block",
      marginBottom: 6
    }}
  >
    Department
  </label>

  <select
    value={departmentId ?? ""}
    onChange={(e) => {
      const val = e.target.value;
      console.log("Selected department:", val);

      // ✅ avoid 0 issue
      setDepartmentId(val ? Number(val) : null);
    }}
    disabled={departments.length === 0}
    style={{
      width: "100%",
      background: T.bg3,
      border: `1.5px solid ${T.border}`,
      borderRadius: 9,
      padding: "10px 14px",
      fontSize: 13,
      color: T.text,
      outline: "none"
    }}
  >
    <option value="">Select Department</option>

    {departments.length > 0 ? (
      departments.map((d) => (
        <option key={d.id} value={d.id}>
          {d.name}
        </option>
      ))
    ) : (
      <option value="">No departments available</option>
    )}
  </select>
</div>

  )}


  <Btn variant="primary" full onClick={handleCreateUser}>
    Create User →
  </Btn>

</Modal>
    </div>
  );
};

// ─── COURSE MANAGEMENT ────────────────────────────────────────────────────────
export const AdminCourses = () => {
  const [courses, setCourses]         = useState([]);
  const [teachers, setTeachers]       = useState([]);
  const [depts, setDepts]             = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [allBatches, setAllBatches]   = useState([]);
  const [modal, setModal]             = useState(false);
  const [enrollModal, setEnrollModal] = useState(null);
  const [editModal, setEditModal]     = useState(null); // course being edited
  const [editForm, setEditForm]       = useState({ teacherId: "", title: "", durationHours: "", description: "" });
  const [loading, setLoading]         = useState(false);
  const [enrolledIds, setEnrolledIds] = useState([]);
  const [directEnrolledIds, setDirectEnrolledIds] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [saving, setSaving]           = useState(false);
  const [form, setForm] = useState({ title: "", description: "", department: "", durationHours: "", teacherId: "", batchId: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const load = async () => {
    setLoading(true);
    try {
      const [c, t, d, s, b] = await Promise.all([
        getAllCourses().catch(e => { console.error("Course load error:", e); return []; }),
        getAllTeachers().catch(e => { console.error("Teacher load error:", e); return []; }),
        getAllDepartments().catch(e => { console.error("Dept load error:", e); return []; }),
        getAllStudents().catch(e => { console.error("Student load error:", e); return []; }),
        getAllBatches().catch(e => { console.error("Batch load error:", e); return []; })
      ]);
      setCourses(Array.isArray(c) ? c : (c?.data || c?.content || []));
      setTeachers(Array.isArray(t) ? t : (t?.data || t?.content || []));
      setDepts(Array.isArray(d) ? d.filter(x => x.active) : (d?.data || d?.content || []).filter(x => x.active));
      setAllStudents(Array.isArray(s) ? s : (s?.data || s?.content || []));
      setAllBatches(Array.isArray(b) ? b : (b?.data || b?.content || []));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleBatchSelect = (batchId) => {
    const batch = allBatches.find(b => String(b.id) === String(batchId));
    setForm(f => ({ ...f, batchId, department: batch?.department || f.department }));
  };

  const handleCreate = async () => {
    if (!form.title.trim()) { alert("Course name is required."); return; }
    try {
      setSaving(true);
      const result = await createCourse({
        ...form,
        durationHours: Number(form.durationHours) || 0,
        teacherId: form.teacherId ? Number(form.teacherId) : undefined,
        batchId:   form.batchId   ? Number(form.batchId)   : undefined,
      });
      showEmailWarnings(result?.emailWarnings);
      setModal(false);
      setForm({ title: "", description: "", department: "", durationHours: "", teacherId: "", batchId: "" });
      load();
    } catch (err) { alert("Error: " + err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirmAction("Delete this course?")) return;
    await deleteCourse(id).catch(console.error);
    setCourses(c => c.filter(x => x.id !== id));
  };

  const openEdit = (course) => {
    setEditModal(course);
    setEditForm({
      title:         course.title        || "",
      durationHours: course.durationHours ?? "",
      description:   course.description  || "",
      teacherId:     course.teacher?.id   ? String(course.teacher.id) : "",
    });
  };

  const handleEditSave = async () => {
    if (!editModal) return;
    try {
      setSaving(true);
      await updateCourse(editModal.id, {
        title:        editForm.title,
        durationHours: editForm.durationHours ? Number(editForm.durationHours) : undefined,
        description:  editForm.description,
        teacherId:    editForm.teacherId || null,
      });
      setEditModal(null);
      load(); // refresh list
    } catch (err) { alert("Error: " + err.message); }
    finally { setSaving(false); }
  };

  const openEnroll = async (course) => {
    setEnrollModal(course);
    setSelectedStudents([]);
    try {
      const enrolled = await getCourseStudents(course.id);
      const enrolledArr = Array.isArray(enrolled) ? enrolled : [];
      setEnrolledIds(enrolledArr.map(s => s.id));
      setDirectEnrolledIds(enrolledArr.filter(s => s.isDirect).map(s => s.id));
    } catch {
      setEnrolledIds([]);
      setDirectEnrolledIds([]);
    }
  };

  const toggleStudentSelect = (id) => setSelectedStudents(p =>
    p.includes(id) ? p.filter(x => x !== id) : [...p, id]
  );

  const handleEnroll = async () => {
    if (selectedStudents.length === 0) { alert("Select at least one student."); return; }
    try {
      setSaving(true);
      await enrollStudentsInCourse(enrollModal.id, selectedStudents);
      setEnrolledIds(p => [...new Set([...p, ...selectedStudents])]);
      setDirectEnrolledIds(p => [...new Set([...p, ...selectedStudents])]);
      setSelectedStudents([]);
      alert(`✅ ${selectedStudents.length} student(s) enrolled in ${enrollModal.title}`);
      load();
    } catch (err) { alert("Error: " + err.message); }
    finally { setSaving(false); }
  };

  const handleUnenroll = async (studentId) => {
    await unenrollStudentFromCourse(enrollModal.id, studentId).catch(e => alert(e.message));
    setEnrolledIds(p => p.filter(x => x !== studentId));
    setDirectEnrolledIds(p => p.filter(x => x !== studentId));
  };

  const unenrolled = allStudents.filter(s => !enrolledIds.includes(s.id));
  const enrolled   = allStudents.filter(s =>  enrolledIds.includes(s.id));

  const statusType = s => s === "ACTIVE" ? "success" : s === "UPCOMING" ? "info" : s === "COMPLETED" ? "muted" : "warning";

  const filteredCourses = courses.filter(c => {
    const nameMatch = c.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const courseStatus = (c.effectiveStatus || c.status || "DRAFT").toUpperCase();
    if (statusFilter === "Active") return nameMatch && courseStatus === "ACTIVE";
    if (statusFilter === "Draft") return nameMatch && courseStatus === "DRAFT";
    if (statusFilter === "Completed") return nameMatch && (courseStatus === "INACTIVE" || courseStatus === "COMPLETED");
    return nameMatch;
  });

  const rows = filteredCourses.map(c => [
    <div>
      <div style={{ fontWeight: 700 }}>{c.title}</div>
      <div style={{ fontSize: 11, color: T.muted }}>{c.durationHours} hrs · {c.department || "—"}</div>
    </div>,
    c.teacher?.name || "—",
    <div>
      {c.batches && c.batches.length > 0 ? c.batches.map(b => (
        <div key={b.id} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
          <span style={{ fontSize: 11, background: `${T.accent}18`, color: T.accent, borderRadius: 50, padding: "2px 8px", fontWeight: 700 }}>🏫 {b.name}</span>
          <Badge type={statusType(b.status)}>{b.status}</Badge>
        </div>
      )) : <span style={{ fontSize: 11, color: T.muted }}>No batch assigned</span>}
    </div>,
    <Badge type={statusType(c.effectiveStatus || c.status)}>{c.effectiveStatus || c.status || "DRAFT"}</Badge>,
    <div style={{ display: "flex", gap: 6 }}>
      <Btn size="xs" variant="ghost"    onClick={() => openEdit(c)}>✏️ Edit</Btn>
      <Btn size="xs" variant="primary"  onClick={() => openEnroll(c)}>👥 Enroll</Btn>
      <Btn size="xs" variant="danger"   onClick={() => handleDelete(c.id)}>🗑</Btn>
    </div>,
  ]);

  return (
    <div className="fade-up">
      <PageHeader title="Course Management"
        subtitle="Create courses, assign to batches — status auto-calculated from batch dates"
        actions={[<Btn variant="primary" onClick={() => setModal(true)}>+ Create Course</Btn>]} />
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 260, position: "relative", marginBottom: 20 }}>
            <input
              type="text"
              placeholder="Search courses by name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                background: T.bg3,
                border: `1.5px solid ${T.border}`,
                borderRadius: 30,
                padding: "8px 16px 8px 36px",
                fontSize: 13,
                color: T.text,
                outline: "none",
                boxSizing: "border-box",
                height: 38
              }}
            />
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: T.muted }}>🔍</span>
          </div>
          <div style={{ width: 340 }}>
            <Tabs tabs={["All", "Active", "Draft", "Completed"]} active={statusFilter} onChange={setStatusFilter} />
          </div>
        </div>

        {loading
          ? <div style={{ padding: 32, textAlign: "center", color: T.muted }}>Loading…</div>
          : <Table columns={["Course", "Teacher", "Batch", "Status", "Actions"]}
              rows={rows.length ? rows : [["No courses matching filters", "", "", "", ""]]} />
        }
      </Card>

      {/* Create Course Modal */}
      <Modal open={modal} onClose={() => { setModal(false); setForm({ title: "", description: "", department: "", durationHours: "", teacherId: "", batchId: "" }); }} title="Create New Course">
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>
            Assign to Batch <span style={{ fontWeight: 400, textTransform: "none" }}>(optional — auto-sets status & dept)</span>
          </label>
          <select value={form.batchId} onChange={e => handleBatchSelect(e.target.value)}
            style={{ width: "100%", background: T.bg3, border: `1.5px solid ${T.border}`, borderRadius: 9, padding: "10px 14px", fontSize: 13, color: T.text, outline: "none" }}>
            <option value="">-- No batch (DRAFT) --</option>
            {allBatches.map(b => (
              <option key={b.id} value={String(b.id)}>
                {b.name} · {b.department || "—"} · {b.status} {b.course ? "(has course)" : ""}
              </option>
            ))}
          </select>
          {form.batchId && (() => {
            const batch = allBatches.find(b => String(b.id) === String(form.batchId));
            if (!batch) return null;
            const today = new Date();
            const start = batch.startDate ? new Date(batch.startDate) : null;
            const end   = batch.endDate   ? new Date(batch.endDate)   : null;
            let autoStatus = "DRAFT";
            if (start && end) {
              if (today >= start && today <= end) autoStatus = "ACTIVE";
              else if (today < start)              autoStatus = "DRAFT (Upcoming batch)";
              else                                 autoStatus = "INACTIVE (Past batch)";
            }
            return (
              <div style={{ marginTop: 8, padding: "8px 12px", background: `${T.accentG}10`, border: `1px solid ${T.accentG}30`, borderRadius: 8, fontSize: 12 }}>
                ✅ Auto status: <strong style={{ color: T.accentG }}>{autoStatus}</strong>
                {batch.department && <span> · Dept: <strong>{batch.department}</strong></span>}
                {batch.startDate  && <span> · Start: {batch.startDate}</span>}
                {batch.endDate    && <span> · End: {batch.endDate}</span>}
              </div>
            );
          })()}
        </div>
        <Input label="Course Name *" placeholder="e.g. Full Stack Development" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        <Input label="Duration (hours)" placeholder="e.g. 120" value={form.durationHours} onChange={e => setForm(f => ({ ...f, durationHours: e.target.value }))} />
        <Input label="Description" placeholder="Brief description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        <Select label="Department" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
          options={[{ value: "", label: "-- Same as batch --" }, ...depts.map(d => ({ value: d.name, label: d.name }))]} />
        <Select label="Assign Teacher" value={form.teacherId} onChange={e => setForm(f => ({ ...f, teacherId: e.target.value }))}
          options={[{ value: "", label: "-- Select Teacher --" }, ...teachers.map(t => ({ value: String(t.id), label: t.name }))]} />
        <div style={{ background: T.bg3, borderRadius: 9, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: T.muted }}>
          💡 Status is auto-calculated from batch dates: Active today = <strong>ACTIVE</strong>, Future = <strong>DRAFT</strong>, Past = <strong>INACTIVE</strong>
        </div>
        <Btn variant="primary" full size="lg" onClick={handleCreate} disabled={saving}>{saving ? "Creating…" : "Create Course →"}</Btn>
      </Modal>

      {/* Edit Course Modal */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)} title={`Edit Course — ${editModal?.title}`}>
        <Input label="Course Name *" value={editForm.title}
          onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Input label="Duration (hours)" type="number" value={editForm.durationHours}
            onChange={e => setEditForm(f => ({ ...f, durationHours: e.target.value }))} />
          <Select label="Assign Teacher"
            value={editForm.teacherId}
            onChange={e => setEditForm(f => ({ ...f, teacherId: e.target.value }))}
            options={[{ value: "", label: "-- Remove Teacher --" }, ...teachers.map(t => ({ value: String(t.id), label: `${t.name}` }))]} />
        </div>
        <Input label="Description" value={editForm.description}
          onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
        {/* Current teacher info */}
        {editModal?.teacher && (
          <div style={{ background: `${T.accentG}10`, border: `1px solid ${T.accentG}30`, borderRadius: 8, padding: "8px 14px", fontSize: 12, marginBottom: 8 }}>
            👨‍🏫 Current teacher: <strong>{editModal.teacher.name}</strong>
          </div>
        )}
        <Btn variant="primary" full onClick={handleEditSave} disabled={saving}>
          {saving ? "Saving…" : "Save Changes →"}
        </Btn>
      </Modal>

      {/* Direct Enrollment Modal */}
      <Modal open={!!enrollModal} onClose={() => setEnrollModal(null)} title={`Enroll Students — ${enrollModal?.title}`}>
        <p style={{ fontSize: 13, color: T.muted, marginBottom: 14 }}>
          Directly enrolled students access this course without needing a batch.
        </p>
        {enrolled.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.accentG, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>✅ Enrolled Students ({enrolled.length})</div>
            <div style={{ maxHeight: 150, overflowY: "auto", border: `1px solid ${T.border}`, borderRadius: 9 }}>
              {enrolled.map(s => (
                <div key={s.id} style={{ display: "flex", gap: 10, padding: "8px 14px", borderBottom: `1px solid rgba(45,33,96,.3)`, alignItems: "center" }}>
                  <Avatar name={s.name} size={26} color={T.accentG} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: T.muted }}>{s.userId} · {s.department || "—"}</div>
                  </div>
                  {directEnrolledIds.includes(s.id) ? (
                    <Btn size="xs" variant="danger" onClick={() => handleUnenroll(s.id)}>Remove</Btn>
                  ) : (
                    <span style={{ fontSize: 11, background: `${T.accent}18`, color: T.accent, borderRadius: 50, padding: "2px 8px", fontWeight: 700 }}>🏫 Batch</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
          Add Students ({selectedStudents.length} selected)
        </div>
        <div style={{ maxHeight: 250, overflowY: "auto", border: `1px solid ${T.border}`, borderRadius: 9, marginBottom: 14 }}>
          {unenrolled.length === 0
            ? <div style={{ padding: 16, textAlign: "center", color: T.muted, fontSize: 13 }}>All students already enrolled.</div>
            : unenrolled.map(s => {
                const checked = selectedStudents.includes(s.id);
                return (
                  <div key={s.id} onClick={() => toggleStudentSelect(s.id)}
                    style={{ display: "flex", gap: 12, padding: "10px 14px", cursor: "pointer", borderBottom: `1px solid rgba(45,33,96,.3)`,
                      background: checked ? `${T.primary}18` : "transparent", transition: "background .15s" }}>
                    <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${checked ? T.primary : T.border}`,
                      background: checked ? T.primary : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", flexShrink: 0 }}>
                      {checked && "✓"}
                    </div>
                    <Avatar name={s.name} size={26} color={T.accent} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: T.muted }}>{s.userId} · {s.department || "—"}</div>
                    </div>
                  </div>
                );
              })
          }
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Btn variant="ghost" onClick={() => setSelectedStudents(unenrolled.filter(s => s.department === enrollModal?.department).map(s => s.id))}>Select Same Dept</Btn>
          <Btn variant="primary" onClick={handleEnroll} disabled={saving || selectedStudents.length === 0}>
            {saving ? "Enrolling…" : `Enroll ${selectedStudents.length} Student(s) →`}
          </Btn>
        </div>
      </Modal>
    </div>
  );
};

// ─── BATCH MANAGEMENT ─────────────────────────────────────────────────────────
export const AdminBatches = () => {
  const [batches, setBatches]         = useState([]);
  const [depts, setDepts]             = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [allCourses, setAllCourses]   = useState([]);
  const [teachers, setTeachers]       = useState([]);
  const [loading, setLoading]         = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [enrollModal, setEnrollModal] = useState(null);
  const [courseModal, setCourseModal] = useState(null);
  const [subjectsModal, setSubjectsModal] = useState(null); // batch whose subjects we manage
  const [batchSubjects, setBatchSubjects]   = useState([]);  // courses in selected batch
  const [addSubjectId, setAddSubjectId]     = useState("");
  const [feeModal, setFeeModal]       = useState(null);
  const [form, setForm]         = useState({ name: "", department: "", startDate: "", endDate: "", classTeacherId: "" });
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedCourse, setSelectedCourse]     = useState("");
  const [feeForm, setFeeForm]   = useState({ amount: "", dueDate: "", description: "", feeType: "TUITION" });
  const [saving, setSaving]     = useState(false);
  const [viewStudentsModal, setViewStudentsModal] = useState(null);
  const [selectedCoursePerBatch, setSelectedCoursePerBatch] = useState({});
  const [editBatchModal, setEditBatchModal] = useState(null); // batch being edited
  const [editBatchForm, setEditBatchForm]   = useState({ name: "", department: "", startDate: "", endDate: "", classTeacherId: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const load = async () => {
    setLoading(true);
    try {
      const [b, d, s, c, t] = await Promise.all([
        getAllBatches().catch(e => { console.error("Batch load error:", e); return []; }),
        getAllDepartments().catch(e => { console.error("Dept load error:", e); return []; }),
        getAllStudents().catch(e => { console.error("Student load error:", e); return []; }),
        getAllCourses().catch(e => { console.error("Course load error:", e); return []; }),
        getAllTeachers().catch(e => { console.error("Teacher load error:", e); return []; })
      ]);
      setBatches(Array.isArray(b) ? b : (b?.data || b?.content || []));
      setDepts(Array.isArray(d) ? d.filter(x => x.active) : (d?.data || d?.content || []).filter(x => x.active));
      setAllStudents(Array.isArray(s) ? s : (s?.data || s?.content || []));
      setAllCourses(Array.isArray(c) ? c : (c?.data || c?.content || []));
      setTeachers(Array.isArray(t) ? t : (t?.data || t?.content || []));
    } catch (error) {
      console.error("General load error:", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);
  const getSelectedCourse = (batch) => {
    const selectedId = selectedCoursePerBatch[batch.id];
    const allBatchCourses = batch.courses || [];
    if (selectedId) return allBatchCourses.find(c => String(c.id) === String(selectedId)) || allBatchCourses[0] || null;
    return allBatchCourses[0] || null; // default to first course
  };

  const handleCreate = async () => {
    if (!form.name || !form.department || !form.startDate || !form.endDate) { alert("All fields are required."); return; }
    try {
      setSaving(true);
      await createBatch({
        name:           form.name,
        department:     form.department,
        startDate:      form.startDate,
        endDate:        form.endDate,
        classTeacherId: form.classTeacherId || null
      });
      setCreateModal(false);
      setForm({ name: "", department: "", startDate: "", endDate: "", classTeacherId: "" });
      load();
    } catch (err) { alert("Error: " + err.message); }
    finally { setSaving(false); }
  };

  const openEditBatch = (batch) => {
    setEditBatchModal(batch);
    setEditBatchForm({
      name:           batch.name || "",
      department:     batch.department || "",
      startDate:      batch.startDate || "",
      endDate:        batch.endDate || "",
      classTeacherId: batch.classTeacher?.id ? String(batch.classTeacher.id) : "",
    });
  };

  const handleEditBatchSave = async () => {
    if (!editBatchModal) return;
    if (!editBatchForm.name || !editBatchForm.department || !editBatchForm.startDate || !editBatchForm.endDate) {
      alert("All fields are required.");
      return;
    }
    try {
      setSaving(true);
      await updateBatch(editBatchModal.id, {
        name:           editBatchForm.name,
        department:     editBatchForm.department,
        startDate:      editBatchForm.startDate,
        endDate:        editBatchForm.endDate,
        classTeacherId: editBatchForm.classTeacherId || null,
      });
      setEditBatchModal(null);
      load();
    } catch (err) { alert("Error: " + err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirmAction("Delete this batch?")) return;
    await deleteBatch(id).catch(console.error);
    setBatches(b => b.filter(x => x.id !== id));
  };

  const openEnroll = (batch) => { setEnrollModal(batch); setSelectedStudents([]); };

  const openSubjects = async (batch) => {
    setSubjectsModal(batch);
    setAddSubjectId("");
    const courses = await getBatchCourses(batch.id).catch(() => []);
    setBatchSubjects(Array.isArray(courses) ? courses : []);
  };
  const handleAddSubject = async () => {
    if (!addSubjectId) { alert("Select a course to add."); return; }
    await addCourseToBatch(subjectsModal.id, Number(addSubjectId)).catch(e => { alert(e.message); return; });
    const updated = await getBatchCourses(subjectsModal.id).catch(() => []);
    setBatchSubjects(Array.isArray(updated) ? updated : []);
    setAddSubjectId("");
    load(); // refresh batch list to update subject count
  };
  const handleRemoveSubject = async (courseId) => {
    if (!window.confirm("Remove this subject from the batch?")) return;
    await removeCourseFromBatch(subjectsModal.id, courseId).catch(e => alert(e.message));
    setBatchSubjects(s => s.filter(x => x.id !== courseId));
    load();
  };
  const toggleStudent = (id) => setSelectedStudents(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const handleEnroll = async () => {
    if (selectedStudents.length === 0) { alert("Select at least one student."); return; }
    try {
      setSaving(true);
      const result = await addStudentsToBatch(enrollModal.id, selectedStudents);
      let msg = `✅ ${result?.added ?? 0} student(s) added to ${enrollModal.name}!`;
      if (result?.skipped > 0) {
        msg += `\n\n⚠️ ${result.skipped} skipped (already in an overlapping batch):`;
        if (result?.conflicts?.length) msg += "\n• " + result.conflicts.join("\n• ");
      }
      alert(msg);
      setEnrollModal(null); load();
    } catch (err) { alert("Error: " + err.message); }
    finally { setSaving(false); }
  };

  const openCourse = (batch) => { setCourseModal(batch); setSelectedCourse(batch.course?.id ? String(batch.course.id) : ""); };
  const handleAssignCourse = async () => {
    try {
      setSaving(true);
      await assignCourseToBatch(courseModal.id, selectedCourse ? Number(selectedCourse) : null);
      alert("Course assigned!"); setCourseModal(null); load();
    } catch (err) { alert("Error: " + err.message); }
    finally { setSaving(false); }
  };

  const openFee = (batch) => { setFeeModal(batch); setFeeForm({ amount: "", dueDate: "", description: "", feeType: "TUITION" }); };
  const handleGenerateFees = async () => {
    if (!feeForm.amount || !feeForm.dueDate) { alert("Amount and due date required."); return; }
    const studentCount = feeModal?.studentCount ?? feeModal?.students?.length ?? 0;
    if (studentCount === 0) { alert("No students in this batch yet. Add students first."); return; }
    try {
      setSaving(true);
      const result = await generateBatchFee(feeModal.id, {
        amount:      feeForm.amount,
        dueDate:     feeForm.dueDate,
        description: feeForm.description || `${feeModal.name} - ${feeForm.feeType}`,
        feeType:     feeForm.feeType,
      });
      alert(`✅ Fee generated for ${result?.studentsCharged ?? studentCount} students in ${feeModal.name}\nStudents notified automatically.`);
      setFeeModal(null);
    } catch (err) { alert("Error: " + err.message); }
    finally { setSaving(false); }
  };

  const getUnenrolledStudents = (batch) => {
    const enrolled = new Set((batch?.students || []).map(s => s.id));
    // Also filter out students already in ANY other batch (show a warning tag)
    return allStudents.filter(s => !enrolled.has(s.id));
  };

  const filteredBatches = batches.filter(b => {
    const nameMatch = b.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const batchStatus = (b.status || "UPCOMING").toUpperCase();
    if (statusFilter === "Active") return nameMatch && batchStatus === "ACTIVE";
    if (statusFilter === "Draft") return nameMatch && batchStatus === "UPCOMING";
    if (statusFilter === "Completed") return nameMatch && batchStatus === "COMPLETED";
    return nameMatch;
  });

  return (
    <div className="fade-up">
      <PageHeader title="Batch Management" subtitle="Create batches → Add students → Assign course → Generate fees"
        actions={[
          <Btn variant="ghost" onClick={() => syncBatchStatuses().then(() => load()).catch(console.error)}>🔄 Sync Status</Btn>,
          <Btn variant="danger" onClick={async () => {
            if (!confirmAction("This will remove all cross-department students from every batch. Continue?")) return;
            try {
              const result = await cleanupCrossDeptStudents();
              const removed = result?.totalRemoved ?? 0;
              if (removed === 0) {
                alert("✅ All batches are clean — no cross-department students found.");
              } else {
                const lines = (result?.batches || []).map(b =>
                  `• ${b.batchName} (${b.batchDept}): removed ${b.removed.join(", ")}`
                ).join("\n");
                alert(`🧹 Removed ${removed} cross-department student(s):\n\n${lines}`);
              }
              load();
            } catch (err) { alert("Error: " + err.message); }
          }}>🧹 Clean Cross-Dept</Btn>,
          <Btn variant="primary" onClick={() => setCreateModal(true)}>+ Create Batch</Btn>
        ]} />

      <Card hover={false} style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 260, position: "relative", marginBottom: 20 }}>
            <input
              type="text"
              placeholder="Search batches by name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                background: T.bg3,
                border: `1.5px solid ${T.border}`,
                borderRadius: 30,
                padding: "8px 16px 8px 36px",
                fontSize: 13,
                color: T.text,
                outline: "none",
                boxSizing: "border-box",
                height: 38
              }}
            />
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: T.muted }}>🔍</span>
          </div>
          <div style={{ width: 340 }}>
            <Tabs tabs={["All", "Active", "Draft", "Completed"]} active={statusFilter} onChange={setStatusFilter} />
          </div>
        </div>
      </Card>

      {loading
        ? <div style={{ padding: 32, textAlign: "center", color: T.muted }}>Loading…</div>
        : filteredBatches.length === 0
          ? <Card><div style={{ padding: 32, textAlign: "center", color: T.muted }}>No batches matching filters found.</div></Card>
          : <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
              {filteredBatches.map(b => {
                const studentCount   = b.studentCount ?? b.students?.length ?? 0;
                const batchCourses   = b.courses || [];
                const activeCourse   = getSelectedCourse(b);
                const selCourseId    = selectedCoursePerBatch[b.id] || (batchCourses[0]?.id ? String(batchCourses[0].id) : "");

                return (
                  <Card key={b.id} style={{ padding: 22 }}>

                    {/* ── Header ── */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                      <div>
                        <div style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 15 }}>{b.name}</div>
                        <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>🏢 {b.department}</div>
                        {b.classTeacher?.name && (
                          <div style={{ fontSize: 12, color: T.accent, fontWeight: 700, marginTop: 3 }}>👨‍💼 Head Teacher: {b.classTeacher.name}</div>
                        )}
                      </div>
                      <Badge type={b.status === "ACTIVE" ? "success" : b.status === "UPCOMING" ? "info" : "warning"}>
                        {b.status || "UPCOMING"}
                      </Badge>
                    </div>

                    {/* ── Course Dropdown ── */}
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 10, color: T.muted, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700, marginBottom: 5 }}>
                        📚 Subjects ({batchCourses.length})
                      </div>
                      {batchCourses.length === 0 ? (
                        <div style={{ background: T.bg3, borderRadius: 8, padding: "9px 12px", fontSize: 12, color: T.muted }}>
                          No subjects — add via 📚 Subjects button
                        </div>
                      ) : (
                        <select
                          value={selCourseId}
                          onChange={e => setSelectedCoursePerBatch(prev => ({ ...prev, [b.id]: e.target.value }))}
                          style={{ width: "100%", background: T.bg3, border: `1.5px solid ${T.border}`,
                            borderRadius: 8, padding: "8px 10px", fontSize: 12,
                            color: T.text, outline: "none", cursor: "pointer", fontWeight: 600 }}
                        >
                          {batchCourses.map(c => (
                            <option key={c.id} value={String(c.id)}>
                              {c.title}{c.teacher?.name ? ` — ${c.teacher.name}` : ""}
                            </option>
                          ))}
                        </select>
                      )}
                      {/* Selected course meta pills */}
                      {activeCourse && (
                        <div style={{ display: "flex", gap: 5, marginTop: 6, flexWrap: "wrap" }}>
                          <span style={{
                            fontSize: 10, borderRadius: 50, padding: "2px 8px", fontWeight: 700,
                            background: activeCourse.status === "ACTIVE" ? `${T.accentG}20` : activeCourse.status === "DRAFT" ? `${T.accentY}20` : `${T.muted}20`,
                            color:      activeCourse.status === "ACTIVE" ? T.accentG          : activeCourse.status === "DRAFT" ? T.accentY         : T.muted,
                          }}>
                            {activeCourse.status || "DRAFT"}
                          </span>
                          <span style={{ fontSize: 10, color: T.muted }}>⏱ {activeCourse.durationHours || 0} hrs</span>
                          {activeCourse.teacher?.name && (
                            <span style={{ fontSize: 10, color: T.muted }}>👨‍🏫 {activeCourse.teacher.name}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* ── Stats tiles ── */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                      {/* Students — clickable */}
                      <div
                        onClick={() => studentCount > 0 && setViewStudentsModal(b)}
                        style={{ background: T.bg3, borderRadius: 8, padding: "8px 10px",
                          cursor: studentCount > 0 ? "pointer" : "default",
                          border: `1px solid ${studentCount > 0 ? T.accentG + "40" : "transparent"}`,
                          transition: "border .2s, transform .15s" }}
                        onMouseEnter={e => { if (studentCount > 0) e.currentTarget.style.transform = "scale(1.04)"; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
                        title={studentCount > 0 ? "Click to view enrolled students" : "No students yet"}
                      >
                        <div style={{ fontSize: 10, color: T.muted, marginBottom: 2 }}>👥 Students</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: studentCount > 0 ? T.accentG : T.muted }}>
                          {studentCount}{studentCount > 0 && <span style={{ fontSize: 9, marginLeft: 3 }}>▶</span>}
                        </div>
                      </div>

                      {/* Start */}
                      <div style={{ background: T.bg3, borderRadius: 8, padding: "8px 10px" }}>
                        <div style={{ fontSize: 10, color: T.muted, marginBottom: 2 }}>📅 Start</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: T.muted }}>{b.startDate || "—"}</div>
                      </div>

                      {/* End */}
                      <div style={{ background: T.bg3, borderRadius: 8, padding: "8px 10px" }}>
                        <div style={{ fontSize: 10, color: T.muted, marginBottom: 2 }}>📅 End</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: T.muted }}>{b.endDate || "—"}</div>
                      </div>
                    </div>

                    {/* ── Action Buttons ── */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 6 }}>
                      <Btn size="xs" variant="primary" onClick={() => openEnroll(b)}>👥 Add Students</Btn>
                      <Btn size="xs" variant="ghost"   onClick={() => openSubjects(b)}>
                        📚 Subjects ({batchCourses.length})
                      </Btn>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 6 }}>
                      <Btn size="xs" variant="dark" onClick={() => {
                        setCourseModal(b);
                        setSelectedCourse(activeCourse ? String(activeCourse.id) : "");
                      }}>🔗 Legacy Course</Btn>
                      <Btn size="xs" variant="success" onClick={() => openFee(b)}
                        disabled={studentCount === 0} style={{ opacity: studentCount === 0 ? 0.5 : 1 }}>
                        💳 Fees
                      </Btn>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                      <Btn size="xs" variant="ghost" onClick={() => openEditBatch(b)}>✏️ Edit Batch</Btn>
                      <Btn size="xs" variant="danger" onClick={() => handleDelete(b.id)}>🗑 Delete</Btn>
                    </div>
                  </Card>
                );
              })}
            </div>
      }

      {/* Create Batch Modal */}
      <Modal open={createModal} onClose={() => { setCreateModal(false); setForm({ name: "", department: "", startDate: "", endDate: "", classTeacherId: "" }); }} title="Create New Batch">
        <p style={{ fontSize: 13, color: T.muted, marginBottom: 14 }}>After creating a batch: add students → assign a course → generate fees.</p>
        <Input label="Batch Name *" placeholder="e.g. CS-2026-Batch-A" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        <Select label="Department *" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
          options={[{ value: "", label: "-- Select Department --" }, ...depts.map(d => ({ value: d.name, label: d.name }))]} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Input label="Start Date *" type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
          <Input label="End Date *"   type="date" value={form.endDate}   onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
        </div>
        <Select label="Class Teacher (optional)" value={form.classTeacherId} onChange={e => setForm(f => ({ ...f, classTeacherId: e.target.value }))}
          options={[{ value: "", label: "-- Assign Class Teacher --" }, ...teachers.map(t => ({ value: String(t.id), label: `${t.name} (${t.department || "No Dept"})` }))]} />
        <Btn variant="primary" full size="lg" onClick={handleCreate} disabled={saving}>{saving ? "Creating…" : "Create Batch →"}</Btn>
      </Modal>

      {/* Edit Batch Modal */}
      <Modal open={!!editBatchModal} onClose={() => setEditBatchModal(null)} title={`Edit Batch — ${editBatchModal?.name}`}>
        <Input label="Batch Name *" value={editBatchForm.name} onChange={e => setEditBatchForm(f => ({ ...f, name: e.target.value }))} />
        <Select label="Department *" value={editBatchForm.department} onChange={e => setEditBatchForm(f => ({ ...f, department: e.target.value }))}
          options={[{ value: "", label: "-- Select Department --" }, ...depts.map(d => ({ value: d.name, label: d.name }))]} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Input label="Start Date *" type="date" value={editBatchForm.startDate} onChange={e => setEditBatchForm(f => ({ ...f, startDate: e.target.value }))} />
          <Input label="End Date *"   type="date" value={editBatchForm.endDate}   onChange={e => setEditBatchForm(f => ({ ...f, endDate: e.target.value }))} />
        </div>
        <Select label="Class Teacher (optional)" value={editBatchForm.classTeacherId} onChange={e => setEditBatchForm(f => ({ ...f, classTeacherId: e.target.value }))}
          options={[{ value: "", label: "-- Assign Class Teacher --" }, ...teachers.map(t => ({ value: String(t.id), label: `${t.name} (${t.department || "No Dept"})` }))]} />
        <Btn variant="primary" full size="lg" onClick={handleEditBatchSave} disabled={saving}>{saving ? "Saving…" : "Save Changes →"}</Btn>
      </Modal>

      {/* Enroll Students Modal */}
      <Modal open={!!enrollModal} onClose={() => setEnrollModal(null)} title={`Add Students → ${enrollModal?.name}`}>
        <p style={{ fontSize: 13, color: T.muted, marginBottom: 14 }}>
          Batch department: <strong>{enrollModal?.department}</strong> · Currently enrolled: <strong>{enrollModal?.studentCount ?? enrollModal?.students?.length ?? 0}</strong>
        </p>
        <div style={{ background: `${T.accent}15`, border: `1px solid ${T.accent}30`, borderRadius: 8, padding: "8px 12px", marginBottom: 14, fontSize: 12, color: T.accent }}>
          ⚠️ Only students from <strong>{enrollModal?.department}</strong> can be added to this batch. Students already in an overlapping batch are also excluded.
        </div>
        {(() => {
          const unenrolled = getUnenrolledStudents(enrollModal);
          // STRICT: only same-department students allowed
          const toShow = unenrolled.filter(s => s.department === enrollModal?.department);
          if (toShow.length === 0) return (
            <div style={{ padding: "24px 0", textAlign: "center", color: T.muted }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>🚫</div>
              <div>No eligible students from <strong>{enrollModal?.department}</strong>.</div>
              <div style={{ fontSize: 11, marginTop: 4 }}>Students must match the batch department and not be in an overlapping batch.</div>
            </div>
          );
          return (
            <>
              <div style={{ fontSize: 11, color: T.muted, marginBottom: 8 }}>{selectedStudents.length} selected · {toShow.length} eligible from {enrollModal?.department}</div>
              <div style={{ maxHeight: 300, overflowY: "auto", border: `1px solid ${T.border}`, borderRadius: 9, marginBottom: 14 }}>
                {toShow.map(s => {
                  const checked = selectedStudents.includes(s.id);
                  return (
                    <div key={s.id} onClick={() => toggleStudent(s.id)}
                      style={{ display: "flex", gap: 12, padding: "10px 14px", cursor: "pointer", borderBottom: `1px solid rgba(45,33,96,.3)`,
                        background: checked ? `${T.primary}18` : "transparent", transition: "background .15s" }}>
                      <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${checked ? T.primary : T.border}`,
                        background: checked ? T.primary : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", flexShrink: 0 }}>
                        {checked && "✓"}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</div>
                        <div style={{ fontSize: 11, color: T.muted }}>{s.userId} · {s.department}</div>
                      </div>
                      <span style={{ fontSize: 10, color: T.accentG, fontWeight: 700 }}>✓ Same dept</span>
                    </div>
                  );
                })}
              </div>
            </>
          );
        })()}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Btn variant="ghost" onClick={() => { const u = getUnenrolledStudents(enrollModal); setSelectedStudents(u.filter(s => s.department === enrollModal?.department).map(s => s.id)); }}>Select All</Btn>
          <Btn variant="primary" onClick={handleEnroll} disabled={saving || selectedStudents.length === 0}>{saving ? "Adding…" : `Add ${selectedStudents.length} Student(s) →`}</Btn>
        </div>
      </Modal>

      {/* Assign Course Modal */}
      <Modal open={!!courseModal} onClose={() => setCourseModal(null)} title={`Assign Course → ${courseModal?.name}`}>
        <p style={{ fontSize: 13, color: T.muted, marginBottom: 14 }}>Students in this batch will see the assigned course in their dashboard.</p>
        {courseModal?.course && (
          <div style={{ background: `${T.accentG}15`, border: `1px solid ${T.accentG}30`, borderRadius: 9, padding: "10px 14px", marginBottom: 14, fontSize: 13 }}>
            ✅ Current course: <strong>{courseModal.course.title}</strong>
          </div>
        )}
        <Select label="Select Course *" value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}
          options={[
            { value: "", label: "-- None (remove assignment) --" },
            ...allCourses
              .filter(c => !courseModal?.department || c.department === courseModal?.department || !c.department)
              .map(c => ({ value: String(c.id), label: `${c.title} (${c.department || "All"}) — ${c.teacher?.name || "No teacher"}` }))
          ]} />
        <Btn variant="primary" full onClick={handleAssignCourse} disabled={saving}>{saving ? "Saving…" : "Assign Course →"}</Btn>
      </Modal>

      {/* ── Manage Subjects Modal ── */}
      <Modal open={!!subjectsModal} onClose={() => { setSubjectsModal(null); setBatchSubjects([]); }}
        title={`📚 Subjects — ${subjectsModal?.name}`}>

        <div style={{ background: `${T.accent}10`, border: `1px solid ${T.accent}30`,
          borderRadius: 8, padding: "8px 14px", marginBottom: 14, fontSize: 12 }}>
          🏢 {subjectsModal?.department} · These are the subjects (courses) taught in this batch.
          Students in this batch will see all these subjects in their dashboard.
        </div>

        {/* Current subjects list */}
        {batchSubjects.length === 0 ? (
          <div style={{ textAlign: "center", color: T.muted, padding: "16px 0", fontSize: 13 }}>
            No subjects assigned yet. Add some below.
          </div>
        ) : (
          <div style={{ marginBottom: 16 }}>
            {batchSubjects.map(c => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10,
                padding: "8px 12px", background: T.bg3, borderRadius: 8, marginBottom: 6 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>📚 {c.title}</div>
                  <div style={{ fontSize: 11, color: T.muted }}>
                    {c.teacherName || c.teacher?.name ? `👨‍🏫 ${c.teacherName || c.teacher?.name}` : "No teacher"} · {c.status}
                  </div>
                </div>
                <button onClick={() => handleRemoveSubject(c.id)}
                  style={{ background: "#ef444420", color: "#ef4444", border: "none",
                    borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}>
                  ✕ Remove
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add subject */}
        <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 14 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: T.muted,
            textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 8 }}>
            Add Subject to Batch
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <select value={addSubjectId} onChange={e => setAddSubjectId(e.target.value)}
              style={{ flex: 1, background: T.bg3, border: `1.5px solid ${T.border}`,
                borderRadius: 9, padding: "9px 12px", fontSize: 13, color: T.text, outline: "none" }}>
              <option value="">-- Select a course --</option>
              {allCourses
                .filter(c => !subjectsModal?.department || c.department === subjectsModal?.department || !c.department)
                .filter(c => !batchSubjects.find(s => s.id === c.id))
                .map(c => (
                  <option key={c.id} value={String(c.id)}>
                    {c.title} {c.teacher?.name ? `— ${c.teacher.name}` : ""}
                  </option>
                ))}
            </select>
            <Btn variant="primary" onClick={handleAddSubject} disabled={!addSubjectId}>+ Add</Btn>
          </div>
        </div>
      </Modal>

      {/* Generate Fees Modal */}
      <Modal open={!!feeModal} onClose={() => setFeeModal(null)} title={`Generate Fees → ${feeModal?.name}`}>
        <div style={{ background: T.bg3, borderRadius: 9, padding: "10px 14px", marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: T.muted }}>Creates individual fee records for each student in this batch.</div>
          <div style={{ marginTop: 8, display: "flex", gap: 12, fontSize: 13 }}>
            <span>👥 <strong>{feeModal?.studentCount ?? feeModal?.students?.length ?? 0}</strong> students</span>
            <span>🏢 <strong>{feeModal?.department}</strong></span>
            {feeModal?.course && <span>📚 <strong>{feeModal.course.title}</strong></span>}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Input label="Amount (₹) *" type="number" placeholder="e.g. 15000" value={feeForm.amount} onChange={e => setFeeForm(f => ({ ...f, amount: e.target.value }))} />
          <Input label="Due Date *" type="date" value={feeForm.dueDate} onChange={e => setFeeForm(f => ({ ...f, dueDate: e.target.value }))} />
        </div>
        <Input label="Description" placeholder="e.g. Tuition Fee Q1" value={feeForm.description} onChange={e => setFeeForm(f => ({ ...f, description: e.target.value }))} />
        <Select label="Fee Type" value={feeForm.feeType} onChange={e => setFeeForm(f => ({ ...f, feeType: e.target.value }))}
          options={["TUITION", "EXAM", "LAB", "LIBRARY", "TRANSPORT", "MISCELLANEOUS"].map(o => ({ value: o, label: o }))} />
        {(() => {
          const sc = feeModal?.studentCount ?? feeModal?.students?.length ?? 0;
          return (
            <div style={{ background: `${T.accentY}15`, border: `1px solid ${T.accentY}30`, borderRadius: 9, padding: "10px 14px", marginBottom: 14, fontSize: 13 }}>
              💳 Will generate <strong>{sc}</strong> fee records of <strong>₹{feeForm.amount || "0"}</strong> each
              = <strong>₹{(sc * Number(feeForm.amount || 0)).toLocaleString("en-IN")}</strong> total
            </div>
          );
        })()}
        <Btn variant="primary" full size="lg" onClick={handleGenerateFees} disabled={saving || !feeForm.amount || !feeForm.dueDate}>
          {saving ? "Generating…" : `Generate Fees for ${feeModal?.studentCount ?? feeModal?.students?.length ?? 0} Students →`}
        </Btn>
      </Modal>

      {/* View Students in Batch Modal */}
      <Modal open={!!viewStudentsModal} onClose={() => setViewStudentsModal(null)}
        title={`Students in ${viewStudentsModal?.name}`}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: T.muted }}>
            🏢 {viewStudentsModal?.department} &nbsp;·&nbsp;
            <span style={{ color: T.accentG, fontWeight: 700 }}>
              {viewStudentsModal?.studentCount ?? viewStudentsModal?.students?.length ?? 0} enrolled
            </span>
          </div>
          <Badge type={viewStudentsModal?.status === "ACTIVE" ? "success" : viewStudentsModal?.status === "UPCOMING" ? "info" : "warning"}>
            {viewStudentsModal?.status}
          </Badge>
        </div>

        {/* Date range pill */}
        <div style={{ background: T.bg3, borderRadius: 8, padding: "8px 14px", fontSize: 12, color: T.muted, marginBottom: 14, display: "flex", gap: 16 }}>
          <span>📅 Start: <strong style={{ color: T.text }}>{viewStudentsModal?.startDate || "—"}</strong></span>
          <span>📅 End: <strong style={{ color: T.text }}>{viewStudentsModal?.endDate || "—"}</strong></span>
        </div>

        {/* Student list */}
        {(viewStudentsModal?.students?.length ?? 0) === 0 ? (
          <div style={{ padding: "32px 0", textAlign: "center", color: T.muted }}>No students enrolled yet.</div>
        ) : (
          <div style={{ maxHeight: 380, overflowY: "auto", border: `1px solid ${T.border}`, borderRadius: 10 }}>
            {viewStudentsModal.students.map((s, i) => (
              <div key={s.id} style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "11px 16px",
                borderBottom: i < viewStudentsModal.students.length - 1 ? `1px solid ${T.border}` : "none",
                background: i % 2 === 0 ? "transparent" : `${T.bg3}80`,
              }}>
                {/* Avatar circle */}
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 800, color: "#fff", flexShrink: 0,
                }}>
                  {s.name?.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
                    {s.userId} &nbsp;·&nbsp; {s.department || "No dept"}
                  </div>
                </div>
                <Badge type="success">Same dept</Badge>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16 }}>
          <Btn variant="primary" onClick={() => {
            const b = viewStudentsModal;
            setViewStudentsModal(null);
            setTimeout(() => openEnroll(b), 50);
          }}>
            👥 Add More Students
          </Btn>
          <Btn variant="ghost" onClick={() => setViewStudentsModal(null)}>Close</Btn>
        </div>
      </Modal>

    </div>
  );
};

// ─── TIMETABLE ────────────────────────────────────────────────────────────────
export const AdminTimetable = () => {
  const DAYS = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];
  const DAY_SHORT = { MONDAY:"Mon", TUESDAY:"Tue", WEDNESDAY:"Wed", THURSDAY:"Thu", FRIDAY:"Fri", SATURDAY:"Sat" };
  const COLORS = [T.primaryL, T.accent, T.accentG, T.accentY, T.accentR, "#a78bfa", "#34d399", "#fb923c"];

  const [slots, setSlots]       = useState([]);
  const [batches, setBatches]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editSlot, setEditSlot]   = useState(null); // slot being edited
  const [saving, setSaving]     = useState(false);
  const [filterBatch, setFilter] = useState("ALL");
  const [filterDept, setFilterDept] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm]         = useState({
    batchId: "", courseId: "", dayOfWeek: "MONDAY",
    startTime: "09:00", endTime: "11:00", room: ""
  });
  const [editForm, setEditForm] = useState({ dayOfWeek: "MONDAY", startTime: "09:00", endTime: "11:00", room: "" });
  const [error, setError]       = useState("");

  const load = () => {
    setLoading(true);
    Promise.all([getActiveTimetable(), getActiveBatchesForTT()])
      .then(([s, b]) => {
        setSlots(Array.isArray(s) ? s : []);
        setBatches(Array.isArray(b) ? b : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const selectedBatch = batches.find(b => String(b.id) === form.batchId);

  const handleCreate = async () => {
    setError("");
    if (!form.batchId)   { setError("Please select a batch."); return; }
    if (!form.courseId)  { setError("Please select a course."); return; }
    if (!form.dayOfWeek) { setError("Please select a day."); return; }
    if (!form.startTime || !form.endTime) { setError("Start and end time are required."); return; }
    // ❌ Prevent going backward (VERY IMPORTANT)
const lastEnd = getLastEndTime(form.dayOfWeek, form.batchId);

if (form.startTime < lastEnd ) {
  setError("❌ You must continue from last slot time only!");
  return;
}

// ❌ Prevent overlap (only within the same batch)
const isConflict = slots.some(s =>
  s.dayOfWeek === form.dayOfWeek &&
  form.startTime < s.endTime &&
  form.endTime > s.startTime &&
  s.batch?.id === Number(form.batchId)
);

if (isConflict) {
  setError("❌ Time slot already exists in this batch!");
  return;
}
    try {
      setSaving(true);
      const result = await createTimetableSlot({
        batchId:   Number(form.batchId),
        courseId:  Number(form.courseId),
        dayOfWeek: form.dayOfWeek,
        startTime: form.startTime + ":00",
        endTime:   form.endTime + ":00",
        room:      form.room || null,
      });
      showEmailWarnings(result?.emailWarnings);
      setModal(false);
      setForm(f => ({ ...f, dayOfWeek: "MONDAY", startTime: "09:00", endTime: "11:00", room: "" }));
      load();
    } catch (err) {
      setError(err.message || "Failed to create slot.");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this timetable slot?")) return;
    await deleteTimetableSlot(id).catch(console.error);
    setSlots(s => s.filter(x => x.id !== id));
  };

  const openEdit = (slot) => {
    setEditSlot(slot);
    setEditForm({
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime.slice(0, 5),
      endTime:   slot.endTime.slice(0, 5),
      room:      slot.room || "",
    });
    setError("");
    setEditModal(true);
  };

  const handleUpdate = async () => {
    setError("");
    if (!editForm.startTime || !editForm.endTime) { setError("Start and end time are required."); return; }
    try {
      setSaving(true);
      await updateTimetableSlot(editSlot.id, {
        dayOfWeek: editForm.dayOfWeek,
        startTime: editForm.startTime + ":00",
        endTime:   editForm.endTime + ":00",
        room:      editForm.room || null,
      });
      setEditModal(false);
      setEditSlot(null);
      load();
    } catch (err) {
      setError(err.message || "Failed to update slot.");
    } finally { setSaving(false); }
  };
  const getLastEndTime = (day, batchId) => {
  const daySlots = slots.filter(s => s.dayOfWeek === day && s.batch?.id === Number(batchId));

  if (daySlots.length === 0) return "08:00";

  const maxEnd = daySlots.reduce((max, s) =>
    s.endTime > max ? s.endTime : max,
    "00:00:00"
  );

  return maxEnd.slice(0, 5);
};

// 🔥 Auto end time (+1.5 hours)
const getAutoEndTime = (start) => {
  const [h, m] = start.split(":").map(Number);
  const d = new Date(0, 0, 0, h, m + 90);

  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

  // Build grid: unique time slots × days
  const filteredSlots = slots.filter(s => {
    if (filterBatch !== "ALL" && String(s.batch?.id) !== filterBatch) return false;
    if (filterDept !== "ALL" && s.batch?.department !== filterDept) return false;
    if (searchQuery && !s.batch?.name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });
  const uniqueDepartments = Array.from(new Set(batches.map(b => b.department).filter(Boolean)));
  const filteredBatchesForButtons = batches.filter(b => {
    const matchesDept = filterDept === "ALL" || b.department === filterDept;
    const matchesSearch = b.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const timeSlots = [...new Set(filteredSlots.map(s => s.startTime + "–" + s.endTime))].sort();
  const cellColor = (course) => COLORS[Math.abs((course?.id || 0) * 3) % COLORS.length];

  return (
    <div className="fade-up">
      <PageHeader title="Timetable Management"
        subtitle="Active batch schedules — auto-expires when batch ends"
        actions={[<Btn variant="primary" onClick={() => { setModal(true); setError(""); }}>+ Add Slot</Btn>]} />

      {/* Timetable Search & Department filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center", flexWrap: "wrap", background: T.bg3, padding: "12px 16px", borderRadius: 12 }}>
        <span style={{ fontSize: 13, color: T.text, fontWeight: 700, fontFamily: "Syne" }}>🔍 Find Timetable:</span>
        <input 
          type="text"
          placeholder="Search batch name..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: `1.5px solid ${T.border}`,
            background: T.bg2,
            color: T.text,
            fontSize: 12,
            minWidth: 200,
            outline: "none"
          }}
        />
        <select
          value={filterDept}
          onChange={e => { setFilterDept(e.target.value); setFilter("ALL"); }}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: `1.5px solid ${T.border}`,
            background: T.bg2,
            color: T.text,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            outline: "none"
          }}
        >
          <option value="ALL">All Departments</option>
          {uniqueDepartments.map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
      </div>

      {/* Batch filter buttons */}
      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: T.muted, fontWeight: 600 }}>Active Batches:</span>
        <button onClick={() => setFilter("ALL")}
          style={{ padding: "5px 14px", borderRadius: 50, cursor: "pointer", fontSize: 12, fontWeight: 600,
            border: `1.5px solid ${filterBatch === "ALL" ? T.primary : T.border}`,
            background: filterBatch === "ALL" ? `${T.primary}20` : "transparent",
            color: filterBatch === "ALL" ? T.primary : T.muted }}>
          All Filtered Slots ({filteredSlots.length})
        </button>
        {filteredBatchesForButtons.map(b => (
          <button key={b.id} onClick={() => setFilter(String(b.id))}
            style={{ padding: "5px 14px", borderRadius: 50, cursor: "pointer", fontSize: 12, fontWeight: 600,
              border: `1.5px solid ${filterBatch === String(b.id) ? T.accent : T.border}`,
              background: filterBatch === String(b.id) ? `${T.accent}20` : "transparent",
              color: filterBatch === String(b.id) ? T.accent : T.muted }}>
            {b.name}
          </button>
        ))}
      </div>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: "center", color: T.muted }}>Loading timetable…</div>
        ) : filteredSlots.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: T.muted }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>📅</div>
            <div style={{ fontFamily: "Syne", fontWeight: 700 }}>No timetable slots yet</div>
            <div style={{ fontSize: 13, marginTop: 6, marginBottom: 16 }}>
              Only active batches (started ≤ today) can have timetable slots.
            </div>
            <Btn variant="primary" onClick={() => setModal(true)}>+ Add Slot</Btn>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
              <thead>
                <tr>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 800,
                    color: T.muted, textTransform: "uppercase", letterSpacing: 1,
                    borderBottom: `1px solid ${T.border}`, background: T.bg3, width: 120 }}>TIME</th>
                  {DAYS.map(d => (
                    <th key={d} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11,
                      fontWeight: 800, color: T.muted, textTransform: "uppercase", letterSpacing: 1,
                      borderBottom: `1px solid ${T.border}`, background: T.bg3 }}>{DAY_SHORT[d]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((timeKey, ri) => (
                  <tr key={timeKey}>
                    <td style={{ padding: "10px 16px", fontSize: 12, fontWeight: 700,
                      color: T.primaryL, borderBottom: `1px solid rgba(45,33,96,.3)`,
                      background: T.bg3, whiteSpace: "nowrap" }}>
                      {timeKey.replace("–", " – ")}
                    </td>
                    {DAYS.map(day => {
                      const cell = filteredSlots.find(s =>
                        s.startTime + "–" + s.endTime === timeKey && s.dayOfWeek === day);
                      return (
                        <td key={day} style={{ padding: "10px 16px",
                          borderBottom: `1px solid rgba(45,33,96,.3)` }}>
                          {cell ? (
                            <div style={{ background: `${cellColor(cell.course)}12`,
                              border: `1px solid ${cellColor(cell.course)}35`,
                              borderRadius: 8, padding: "8px 10px", position: "relative" }}>
                              <div style={{ fontSize: 13, fontWeight: 700,
                                color: cellColor(cell.course), lineHeight: 1.3 }}>
                                {cell.course?.title}
                              </div>
                              <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
                                {cell.teacher?.name || "—"}
                              </div>
                              {cell.room && <div style={{ fontSize: 10, color: T.muted }}>🚪 {cell.room}</div>}
                              <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>
                                📦 {cell.batch?.name}
                              </div>
                              <div style={{ position: "absolute", top: 4, right: 4, display: "flex", gap: 2 }}>
                                <button onClick={e => { e.stopPropagation(); openEdit(cell); }}
                                  style={{ background: "transparent", border: "none",
                                    cursor: "pointer", color: T.accent, fontSize: 11,
                                    opacity: 0.7, padding: "2px 4px" }}
                                  title="Edit slot">✏️</button>
                                <button onClick={() => handleDelete(cell.id)}
                                  style={{ background: "transparent", border: "none",
                                    cursor: "pointer", color: T.muted, fontSize: 11,
                                    opacity: 0.5, padding: "2px 4px" }}
                                  title="Remove slot">✕</button>
                              </div>
                            </div>
                          ) :  (
  <button
    onClick={() => {
      const batchId = filterBatch !== "ALL" ? filterBatch : form.batchId;
      const start = batchId ? getLastEndTime(day, batchId) : "09:00";

      setForm(f => ({
        ...f,
        dayOfWeek: day,
        startTime: start,
        endTime: getAutoEndTime(start)
      }));

      setError("");
      setModal(true);
    }}
    style={{
      border: `1px dashed ${T.border}`,
      borderRadius: 8,
      padding: "6px 10px",
      background: "transparent",
      cursor: "pointer",
      color: T.muted,
      fontSize: 12
    }}
  >
    ➕ Add
  </button>
)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add Slot Modal */}
      <Modal open={modal} onClose={() => { setModal(false); setError(""); }}
        title="Add Timetable Slot">

        <div style={{ background: `${T.accentY}15`, border: `1px solid ${T.accentY}40`,
          borderRadius: 8, padding: "8px 14px", marginBottom: 14, fontSize: 12 }}>
          ⚠️ Only batches that have started (within last 2 days) and not yet ended are shown.
          Slots auto-disappear when the batch ends.
        </div>

        {error && (
          <div style={{ background: "#ef444415", border: "1px solid #ef444440",
            borderRadius: 8, padding: "8px 14px", marginBottom: 14, fontSize: 13, color: "#ef4444" }}>
            ⚠ {error}
          </div>
        )}

        {/* Batch selector */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: T.muted,
            textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>
            Active Batch *
          </label>
          <select value={form.batchId}
            onChange={e => setForm(f => ({ ...f, batchId: e.target.value, courseId: "" }))}
            style={{ width: "100%", background: T.bg3, border: `1.5px solid ${T.border}`,
              borderRadius: 9, padding: "10px 14px", fontSize: 13, color: T.text,
              outline: "none", boxSizing: "border-box" }}>
            <option value="">-- Select Active Batch --</option>
            {batches.map(b => (
              <option key={b.id} value={String(b.id)}>
                {b.name} · {b.department} · ends {b.endDate} · {b.studentCount} students
              </option>
            ))}
          </select>
          {batches.length === 0 && (
            <div style={{ fontSize: 11, color: T.accentY, marginTop: 6 }}>
              No active batches found. Batches must have started to add timetable slots.
            </div>
          )}
        </div>

        {/* Course/Subject dropdown — from batch's subjects */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: T.muted,
            textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>
            Subject / Course *
          </label>
          <select value={form.courseId}
            onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))}
            disabled={!selectedBatch}
            style={{ width: "100%", background: T.bg3, border: `1.5px solid ${T.border}`,
              borderRadius: 9, padding: "10px 14px", fontSize: 13,
              color: selectedBatch ? T.text : T.muted,
              outline: "none", boxSizing: "border-box" }}>
            <option value="">-- Select Subject --</option>
            {(selectedBatch?.courses || []).map(c => (
              <option key={c.id} value={String(c.id)}>
                {c.title}{c.teacherName ? ` — ${c.teacherName}` : ""}
              </option>
            ))}
          </select>
          {selectedBatch && (selectedBatch?.courses || []).length === 0 && (
            <div style={{ fontSize: 11, color: T.accentY, marginTop: 6 }}>
              ⚠️ No subjects added to this batch yet. Go to Batch Management → 📚 Subjects to add them first.
            </div>
          )}
        </div>

        {/* Day + Time row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: T.muted,
              textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Day *</label>
            <select value={form.dayOfWeek} onChange={e => setForm(f => ({ ...f, dayOfWeek: e.target.value }))}
              style={{ width: "100%", background: T.bg3, border: `1.5px solid ${T.border}`,
                borderRadius: 9, padding: "10px 14px", fontSize: 13, color: T.text,
                outline: "none", boxSizing: "border-box" }}>
              {DAYS.map(d => <option key={d} value={d}>{DAY_SHORT[d]}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: T.muted,
              textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Start *</label>
            <input type="time" value={form.startTime}
              onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
              style={{ width: "100%", background: T.bg3, border: `1.5px solid ${T.border}`,
                borderRadius: 9, padding: "10px 14px", fontSize: 13, color: T.text,
                outline: "none", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: T.muted,
              textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>End *</label>
            <input type="time" value={form.endTime}
              onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
              style={{ width: "100%", background: T.bg3, border: `1.5px solid ${T.border}`,
                borderRadius: 9, padding: "10px 14px", fontSize: 13, color: T.text,
                outline: "none", boxSizing: "border-box" }} />
          </div>
        </div>

        <Input label="Room / Location (optional)" placeholder="e.g. Room 201, Lab 3"
          value={form.room} onChange={e => setForm(f => ({ ...f, room: e.target.value }))} />

        <div style={{ background: `${T.accent}10`, border: `1px solid ${T.accent}30`,
          borderRadius: 8, padding: "8px 14px", marginBottom: 14, fontSize: 12 }}>
          📢 On save — notifications + emails sent to all students in this batch, their parents, and the teacher.
        </div>

        <Btn variant="primary" full size="lg" onClick={handleCreate} disabled={saving || !form.batchId || !form.courseId}>
          {saving ? "Creating..." : "Create Slot & Notify →"}
        </Btn>
      </Modal>

      {/* ── Edit Slot Modal ── */}
      <Modal open={editModal} onClose={() => { setEditModal(false); setEditSlot(null); setError(""); }}
        title="Edit Timetable Slot">

        {editSlot && (
          <div style={{ background: `${T.accent}10`, border: `1px solid ${T.accent}30`,
            borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13 }}>
            <div style={{ fontWeight: 700 }}>📚 {editSlot.course?.title}</div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>
              Batch: {editSlot.batch?.name} · Teacher: {editSlot.teacher?.name || "—"}
            </div>
          </div>
        )}

        {error && (
          <div style={{ background: "#ef444415", border: "1px solid #ef444440",
            borderRadius: 8, padding: "8px 14px", marginBottom: 14, fontSize: 13, color: "#ef4444" }}>
            ⚠ {error}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase",
              letterSpacing: 1, display: "block", marginBottom: 6 }}>Day *</label>
            <select value={editForm.dayOfWeek}
              onChange={e => setEditForm(f => ({ ...f, dayOfWeek: e.target.value }))}
              style={{ width: "100%", background: T.bg3, border: `1.5px solid ${T.border}`,
                borderRadius: 9, padding: "10px 14px", fontSize: 13, color: T.text,
                outline: "none", boxSizing: "border-box" }}>
              {["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"].map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase",
              letterSpacing: 1, display: "block", marginBottom: 6 }}>Start *</label>
            <input type="time" value={editForm.startTime}
              onChange={e => setEditForm(f => ({ ...f, startTime: e.target.value }))}
              style={{ width: "100%", background: T.bg3, border: `1.5px solid ${T.border}`,
                borderRadius: 9, padding: "10px 14px", fontSize: 13, color: T.text,
                outline: "none", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase",
              letterSpacing: 1, display: "block", marginBottom: 6 }}>End *</label>
            <input type="time" value={editForm.endTime}
              onChange={e => setEditForm(f => ({ ...f, endTime: e.target.value }))}
              style={{ width: "100%", background: T.bg3, border: `1.5px solid ${T.border}`,
                borderRadius: 9, padding: "10px 14px", fontSize: 13, color: T.text,
                outline: "none", boxSizing: "border-box" }} />
          </div>
        </div>

        <Input label="Room / Location (optional)" placeholder="e.g. Room 201, Lab 3"
          value={editForm.room} onChange={e => setEditForm(f => ({ ...f, room: e.target.value }))} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Btn variant="ghost" full onClick={() => { setEditModal(false); setEditSlot(null); }}>Cancel</Btn>
          <Btn variant="primary" full onClick={handleUpdate} disabled={saving}>
            {saving ? "Saving..." : "Save Changes →"}
          </Btn>
        </div>
      </Modal>
    </div>
  );
};

// ─── FEE MANAGEMENT ───────────────────────────────────────────────────────────
export const AdminFees = () => {
  const [fees, setFees]         = useState([]);
  const [students, setStudents] = useState([]);
  const [batches, setBatches]   = useState([]);
  const [courses, setCourses]   = useState([]);
  const [depts, setDepts]       = useState([]);
  const [modal, setModal]       = useState(false);
  const [filterDept, setFilterDept] = useState("");
  const [loading, setLoading]   = useState(false);
  const [page, setPage]         = useState(1);
  const [form, setForm] = useState({ studentId: "", amount: "", dueDate: "", description: "", feeType: "TUITION", department: "", batchId: "", courseId: "" });

  const totalBilled      = fees.reduce((s, f) => s + Number(f.amount || 0), 0);
  const totalCollected   = fees.filter(f => f.status === "PAID").reduce((s, f) => s + Number(f.paidAmount || f.amount || 0), 0);
  const totalOutstanding = totalBilled - totalCollected;
  const collectionRate   = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

  useEffect(() => {
    const loadFees = async () => {
      setLoading(true);
      try {
        const [f, s, b, c, d] = await Promise.all([
          getAllFees().catch(e => { console.error("Fee error:", e); return []; }),
          getAllStudents().catch(e => { console.error("Student error:", e); return []; }),
          getAllBatches().catch(e => { console.error("Batch error:", e); return []; }),
          getAllCourses().catch(e => { console.error("Course error:", e); return []; }),
          getAllDepartments().catch(e => { console.error("Dept error:", e); return []; })
        ]);
        setFees(Array.isArray(f) ? f : (f?.data || f?.content || []));
        setStudents(Array.isArray(s) ? s : (s?.data || s?.content || []));
        setBatches(Array.isArray(b) ? b : (b?.data || b?.content || []));
        setCourses(Array.isArray(c) ? c : (c?.data || c?.content || []));
        setDepts(Array.isArray(d) ? d.filter(x => x.active) : (d?.data || d?.content || []).filter(x => x.active));
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    loadFees();
  }, []);

  const handleCreate = async () => {
    if (!form.studentId || !form.amount || !form.dueDate) { alert("Student, amount and due date are required."); return; }
    try {
      const payload = {
        studentId:   Number(form.studentId),
        amount:      form.amount,
        dueDate:     form.dueDate,
        description: form.description,
        feeType:     form.feeType || "TUITION",
        department:  form.department  || undefined,
        batchId:     form.batchId  ? Number(form.batchId)  : undefined,
        courseId:    form.courseId ? Number(form.courseId) : undefined,
      };
      const created = await createFee(payload);
      showEmailWarnings(created?.emailWarnings);
      setFees(f => [...f, created?.fee || created]);
      setModal(false);
      setForm({ studentId: "", amount: "", dueDate: "", description: "", feeType: "TUITION", department: "", batchId: "", courseId: "" });
    } catch (err) { alert("Error: " + err.message); }
  };

  const handleMarkPaid = async (id) => {
    try { const updated = await markFeePaid(id); setFees(f => f.map(x => x.id === id ? updated : x)); }
    catch (err) { alert("Error: " + err.message); }
  };

  const displayedFees = filterDept ? fees.filter(f => f.department === filterDept || f.student?.department === filterDept) : fees;
  const pageSize = 15;
  const paginatedFees = displayedFees.slice((page - 1) * pageSize, page * pageSize);

  const feeRows = paginatedFees.map(f => [
    <div>
      <div style={{ fontWeight: 700, fontSize: 13 }}>{f.student?.name || "—"}</div>
      <div style={{ fontSize: 11, color: T.muted }}>{f.student?.userId || ""}</div>
    </div>,
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
      {f.department    && <span style={{ fontSize: 10, background: `${T.primaryL}18`, color: T.primaryL, borderRadius: 50, padding: "2px 8px", fontWeight: 700 }}>🏢 {f.department}</span>}
      {f.batch?.name   && <span style={{ fontSize: 10, background: `${T.accent}18`,   color: T.accent,   borderRadius: 50, padding: "2px 8px", fontWeight: 700 }}>🏫 {f.batch.name}</span>}
      {f.course?.title && <span style={{ fontSize: 10, background: `${T.accentG}18`, color: T.accentG, borderRadius: 50, padding: "2px 8px", fontWeight: 700 }}>📚 {f.course.title}</span>}
      {!f.department && !f.batch && !f.course && <span style={{ color: T.muted, fontSize: 11 }}>General</span>}
    </div>,
    <div>
      <div style={{ fontSize: 13 }}>{f.description || "—"}</div>
      <Badge type="muted">{f.feeType || "TUITION"}</Badge>
    </div>,
    `₹${Number(f.amount).toLocaleString("en-IN")}`,
    f.dueDate || "—",
    <Badge type={f.status === "PAID" ? "success" : f.status === "OVERDUE" ? "danger" : "warning"}>{f.status}</Badge>,
    f.status !== "PAID" ? <Btn size="xs" variant="primary" onClick={() => handleMarkPaid(f.id)}>Mark Paid</Btn> : <span style={{ fontSize: 12, color: T.accentG }}>✓ Paid</span>,
  ]);

  return (
    <div className="fade-up">
      <PageHeader title="Fee Setup & Management" subtitle="Assign fees by department, batch or course"
        actions={[<Btn variant="primary" onClick={() => setModal(true)}>+ Add Fee</Btn>]} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18, marginBottom: 24 }}>
        <StatCard icon="💰" label="Total Billed"    value={`₹${totalBilled.toLocaleString("en-IN")}`}      color={T.text}    />
        <StatCard icon="✅" label="Collected"        value={`₹${totalCollected.toLocaleString("en-IN")}`}   color={T.accentG} />
        <StatCard icon="⚠️" label="Outstanding"     value={`₹${totalOutstanding.toLocaleString("en-IN")}`} color={T.accentR} />
        <StatCard icon="📊" label="Collection Rate" value={`${collectionRate}%`}                            color={T.accent}  />
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center" }}>
        <span style={{ fontSize: 13, color: T.muted, fontWeight: 600 }}>Filter by dept:</span>
        <Btn size="xs" variant={!filterDept ? "primary" : "ghost"} onClick={() => { setFilterDept(""); setPage(1); }}>All</Btn>
        {depts.map(d => <Btn key={d.id} size="xs" variant={filterDept === d.name ? "primary" : "ghost"} onClick={() => { setFilterDept(d.name); setPage(1); }}>{d.name}</Btn>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        <Card>
          {loading ? <div style={{ padding: 32, textAlign: "center", color: T.muted }}>Loading…</div>
            : <Table columns={["Student", "Scope", "Description", "Amount", "Due Date", "Status", "Action"]}
                rows={feeRows.length ? feeRows : [["No fees", "", "", "", "", "", ""]]} />}
          {displayedFees.length > pageSize && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, padding: 14 }}>
              <Btn size="sm" variant="ghost" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</Btn>
              <span style={{ fontSize: 13, alignSelf: 'center', color: T.muted }}>Page {page} of {Math.ceil(displayedFees.length / pageSize)}</span>
              <Btn size="sm" variant="ghost" onClick={() => setPage(p => p * pageSize < displayedFees.length ? p + 1 : p)} disabled={page * pageSize >= displayedFees.length}>Next</Btn>
            </div>
          )}
        </Card>
        <Card style={{ padding: 24 }}>
          <div style={{ fontFamily: "Syne", fontWeight: 700, marginBottom: 16 }}>Fee Summary</div>
          {[["Total Billed", `₹${totalBilled.toLocaleString("en-IN")}`, T.text], ["Collected", `₹${totalCollected.toLocaleString("en-IN")}`, T.accentG], ["Outstanding", `₹${totalOutstanding.toLocaleString("en-IN")}`, T.accentR]].map(([l, v, c]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "8px 0", borderBottom: `1px solid rgba(45,33,96,.4)` }}>
              <span style={{ color: T.muted }}>{l}</span>
              <span style={{ fontFamily: "Syne", fontWeight: 800, color: c }}>{v}</span>
            </div>
          ))}
          <ProgressBar value={collectionRate} color={T.accentG} height={8} />
          <div style={{ fontSize: 11, color: T.muted, marginTop: 6 }}>Collection Rate: {collectionRate}%</div>
          {depts.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 13, marginBottom: 10 }}>By Department</div>
              {depts.map(d => {
                const dFees  = fees.filter(f => f.department === d.name || f.student?.department === d.name);
                const dTotal = dFees.reduce((s, f) => s + Number(f.amount || 0), 0);
                const dPaid  = dFees.filter(f => f.status === "PAID").reduce((s, f) => s + Number(f.paidAmount || f.amount || 0), 0);
                if (dTotal === 0) return null;
                return (
                  <div key={d.id} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: T.muted }}>{d.name}</span>
                      <span style={{ fontWeight: 700, color: T.accent }}>₹{dTotal.toLocaleString("en-IN")}</span>
                    </div>
                    <ProgressBar value={dTotal > 0 ? Math.round((dPaid / dTotal) * 100) : 0} color={T.primaryL} height={4} />
                  </div>
                );
              }).filter(Boolean)}
            </div>
          )}
        </Card>
      </div>
      <Modal open={modal} onClose={() => setModal(false)} title="Add Fee">
        <Select label="Student *" value={form.studentId} onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))}
          options={[{ value: "", label: "-- Select Student --" }, ...students.map(s => ({ value: String(s.id), label: `${s.name} (${s.department || "—"})` }))]} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Input label="Amount (₹) *" type="number" placeholder="e.g. 15000" value={form.amount}  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
          <Input label="Due Date *"   type="date"                              value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Input label="Description" placeholder="e.g. Tuition Q1" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <Select label="Fee Type" value={form.feeType} onChange={e => setForm(f => ({ ...f, feeType: e.target.value }))}
            options={["TUITION", "EXAM", "LAB", "LIBRARY", "TRANSPORT", "MISCELLANEOUS"].map(o => ({ value: o, label: o }))} />
        </div>
        <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 14, marginTop: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Link to (optional)</div>
          <Select label="Department" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
            options={[{ value: "", label: "-- None --" }, ...depts.map(d => ({ value: d.name, label: d.name }))]} />
          <Select label="Batch" value={form.batchId} onChange={e => setForm(f => ({ ...f, batchId: e.target.value }))}
            options={[{ value: "", label: "-- None --" }, ...batches.map(b => ({ value: String(b.id), label: `${b.name} (${b.department || "—"})` }))]} />
          <Select label="Course" value={form.courseId} onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))}
            options={[{ value: "", label: "-- None --" }, ...courses.map(c => ({ value: String(c.id), label: c.title }))]} />
        </div>
        <Btn variant="primary" full size="lg" onClick={handleCreate}>Save Fee →</Btn>
      </Modal>
    </div>
  );
};

// ─── PAYMENT TRACKING ─────────────────────────────────────────────────────────
export const AdminPayments = () => {
  const [fees, setFees]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage]       = useState(1);
  const pageSize = 15;
  useEffect(() => { setLoading(true); getAllFees().then(d => setFees(Array.isArray(d) ? d : [])).catch(console.error).finally(() => setLoading(false)); }, []);
  const paginatedFees = fees.slice((page - 1) * pageSize, page * pageSize);
  const rows = paginatedFees.map(f => [
    f.student?.name || "—", f.description || "Fee",
    `₹${Number(f.amount).toLocaleString("en-IN")}`,
    <Badge type={f.status === "PAID" ? "success" : f.status === "OVERDUE" ? "danger" : "warning"}>{f.status}</Badge>,
    f.paidDate || f.dueDate || "—",
    <Btn size="xs" variant="dark">Invoice</Btn>,
  ]);
  return (
    <div className="fade-up">
      <PageHeader title="Payment Tracking" actions={[<Btn variant="ghost">⬇ Export</Btn>]} />
      <Card>{loading ? <div style={{ padding: 32, textAlign: "center", color: T.muted }}>Loading…</div>
        : <Table columns={["Student", "Fee Type", "Amount", "Status", "Date", "Action"]} rows={rows.length ? rows : [["No payments", "", "", "", "", ""]]} />}
        {fees.length > pageSize && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, padding: 14 }}>
            <Btn size="sm" variant="ghost" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</Btn>
            <span style={{ fontSize: 13, alignSelf: 'center', color: T.muted }}>Page {page} of {Math.ceil(fees.length / pageSize)}</span>
            <Btn size="sm" variant="ghost" onClick={() => setPage(p => p * pageSize < fees.length ? p + 1 : p)} disabled={page * pageSize >= fees.length}>Next</Btn>
          </div>
        )}
      </Card>
    </div>
  );
};

// ─── REVENUE ANALYTICS ────────────────────────────────────────────────────────
export const AdminRevenue = () => {
  const [revData, setRevData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRevenueSummary()
      .then(d => setRevData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const fmtAmt = (val) => {
    const n = Number(val || 0);
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
    if (n >= 100000)   return `₹${(n / 100000).toFixed(2)}L`;
    return `₹${n.toLocaleString("en-IN")}`;
  };

  const collected    = Number(revData?.collected  ?? 0);
  const pending      = Number(revData?.pending    ?? 0);
  const total        = Number(revData?.total      ?? 0);
  const chartMap     = revData?.monthlyChart ?? {};
  const labels       = Object.keys(chartMap);
  const chartVals    = Object.values(chartMap).map(Number);
  const maxVal       = Math.max(...chartVals, 1);
  const normalised   = chartVals.map(v => Math.round((v / maxVal) * 100));
  const lastTwo      = chartVals.slice(-2);
  const momGrowth    = lastTwo.length === 2 && lastTwo[0] > 0
    ? Math.round(((lastTwo[1] - lastTwo[0]) / lastTwo[0]) * 100) : null;
  const collRate     = total > 0 ? Math.round((collected / total) * 100) : 0;

  return (
    <div className="fade-up">
      <PageHeader
        title="Revenue & Analytics"
        subtitle="Live financial data — filtered to your organization"
        actions={[<Btn variant="primary">⬇ Download PDF</Btn>]}
      />
      {loading ? (
        <div style={{ padding: 60, textAlign: "center", color: T.muted, fontSize: 15 }}>Loading revenue data…</div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18, marginBottom: 24 }}>
            <StatCard icon="✅" label="Collected (This Month)" value={fmtAmt(collected)} color={T.accentG} />
            <StatCard icon="⚠️" label="Outstanding"            value={fmtAmt(pending)}   color={T.accentY} />
            <StatCard icon="💰" label="Total Billed"           value={fmtAmt(total)}     color={T.text}    />
            <StatCard
              icon="📈" label="Collection Rate"
              value={`${collRate}%`}
              change={momGrowth !== null ? `${momGrowth >= 0 ? "↑" : "↓"} ${Math.abs(momGrowth)}% MoM` : ""}
              color={T.accent}
            />
          </div>

          <Card style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 15, marginBottom: 20 }}>
              Monthly Revenue Trend — Last 6 Months
            </div>
            {chartVals.every(v => v === 0) ? (
              <div style={{ padding: "32px 0", textAlign: "center", color: T.muted, fontSize: 13 }}>
                📊 No paid fee data yet for the last 6 months.
              </div>
            ) : (
              <>
                <MiniBarChart data={normalised.length ? normalised : [0]} color={T.primary} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: T.muted, marginTop: 6 }}>
                  {labels.map(m => <span key={m}>{m}</span>)}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
                  {chartVals.map((v, i) => (
                    <span key={i} style={{ fontSize: 10, color: T.accentG, fontWeight: 700, textAlign: "center", flex: 1 }}>
                      {v > 0 ? fmtAmt(v) : "—"}
                    </span>
                  ))}
                </div>
              </>
            )}
          </Card>

          <Card style={{ padding: 24 }}>
            <div style={{ fontFamily: "Syne", fontWeight: 700, marginBottom: 16, fontSize: 15 }}>Revenue Breakdown</div>
            {[
              ["✅ Collected",    collected, T.accentG],
              ["⚠️ Outstanding",  pending,   T.accentY],
              ["💰 Total Billed", total,     T.text],
            ].map(([label, val, color]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 13, color: T.muted }}>{label}</span>
                <span style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 15, color }}>{fmtAmt(val)}</span>
              </div>
            ))}
            <div style={{ marginTop: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                <span style={{ color: T.muted }}>Collection Rate</span>
                <span style={{ fontWeight: 700, color: T.accentG }}>{collRate}%</span>
              </div>
              <ProgressBar value={collRate} color={T.accentG} height={8} />
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

// ─── STAFF PERFORMANCE ────────────────────────────────────────────────────────
export const AdminStaff = () => {
  const [perf, setPerf]         = useState([]);
  const [loading, setLoading]   = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [selectedCalcTeacher, setSelectedCalcTeacher] = useState(null);
  const [reviews, setReviews]   = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [searchQ, setSearchQ]   = useState("");
  const [sortBy, setSortBy]     = useState("name"); // name | rating | reviews

  useEffect(() => {
    setLoading(true);
    getAdminTeachersPerformance()
      .then(d => {
        const arr = Array.isArray(d) ? d : (d?.data || d?.content || []);
        setPerf(arr);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const openCalculation = (teacher) => {
    setSelectedCalcTeacher(teacher);
  };

  const openReviews = (teacher) => {
    setSelectedTeacher(teacher);
    setReviewsLoading(true);
    getAdminTeacherReviews(teacher.teacherId)
      .then(d => setReviews(Array.isArray(d) ? d : (d?.data || d?.content || [])))
      .catch(console.error)
      .finally(() => setReviewsLoading(false));
  };

  const renderStars = (rating) => {
    const r = Math.round(rating || 0);
    return (
      <span style={{ fontSize: 14 }}>
        {[1,2,3,4,5].map(i => (
          <span key={i} style={{ color: i <= r ? "#f59e0b" : T.border }}>★</span>
        ))}
        <span style={{ marginLeft: 5, color: T.muted, fontSize: 12 }}>
          {rating ? rating.toFixed(1) : "0.0"}/5
        </span>
      </span>
    );
  };

  const filteredPerf = perf
    .filter(t => (t.teacherName || "").toLowerCase().includes(searchQ.toLowerCase()) ||
                 (t.department || "").toLowerCase().includes(searchQ.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "rating")     return (b.averageRating || 0) - (a.averageRating || 0);
      if (sortBy === "reviews")    return (b.totalReviews || 0) - (a.totalReviews || 0);
      if (sortBy === "completion") return (b.avgCompletion || 0) - (a.avgCompletion || 0);
      return (a.teacherName || "").localeCompare(b.teacherName || "");
    });

  const rows = filteredPerf.map(t => {
    const rating = t.averageRating || 0;
    const ratingPct = (rating / 5) * 100;
    const completion = t.avgCompletion ?? 0;
    return [
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <Avatar name={t.teacherName} size={28} color={T.accentG} />
        <div>
          <div style={{ fontWeight: 600, color: T.text }}>{t.teacherName}</div>
          <div style={{ fontSize: 11, color: T.muted }}>{t.teacherEmail}</div>
        </div>
      </div>,
      <Badge type="info">{t.department || "—"}</Badge>,
      <span style={{ fontWeight: 600 }}>{t.courseCount ?? "—"}</span>,
      <span style={{ fontWeight: 600 }}>{t.totalReviews ?? 0}</span>,
      renderStars(rating),
      /* Avg Completion column */
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 110 }}>
        <ProgressBar
          value={completion}
          color={completion >= 70 ? T.accentG : completion >= 40 ? T.accentY : "#ef4444"}
          height={6}
        />
        <span style={{ fontSize: 12, fontWeight: 600, color: completion >= 70 ? T.accentG : completion >= 40 ? T.accentY : "#ef4444", whiteSpace: "nowrap" }}>
          {completion}%
        </span>
      </div>,
      <div style={{ display: "flex", gap: 6 }}>
        <Btn variant="outline" style={{ fontSize: 11, padding: "4px 8px" }} onClick={() => openReviews(t)}>
          💬 Reviews
        </Btn>
        <Btn variant="primary" style={{ fontSize: 11, padding: "4px 8px" }} onClick={() => openCalculation(t)}>
          📊 Calculation
        </Btn>
      </div>,
    ];
  });

  return (
    <div className="fade-up">
      <PageHeader title="Staff Performance & Monitoring" />

      {/* Info Banner */}
      <div style={{
        background: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(168,85,247,0.08))",
        border: `1px solid rgba(99,102,241,0.25)`,
        borderRadius: 12, padding: "12px 20px", marginBottom: 20,
        display: "flex", alignItems: "center", gap: 12
      }}>
        <span style={{ fontSize: 22 }}>ℹ️</span>
        <div>
          <strong style={{ color: T.text }}>Who gives the ratings?</strong>
          <span style={{ color: T.muted, fontSize: 13, marginLeft: 8 }}>
            Performance ratings are submitted by <strong>students</strong> after they complete at least 50% of a course. Each review includes a 1–5 star rating and optional feedback.
          </span>
        </div>
      </div>

      {/* Summary Stats */}
      {perf.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 16, marginBottom: 20 }}>
          <StatCard
            label="Total Staff"
            value={perf.length}
            icon="👨‍🏫"
            color={T.accentB}
          />
          <StatCard
            label="Avg Org Rating"
            value={(perf.reduce((s, t) => s + (t.averageRating || 0), 0) / perf.length).toFixed(1) + " ⭐"}
            icon="⭐"
            color={T.accentY}
          />
          <StatCard
            label="Total Reviews"
            value={perf.reduce((s, t) => s + (t.totalReviews || 0), 0)}
            icon="📝"
            color={T.accentG}
          />
          <StatCard
            label="Avg Completion"
            value={Math.round(perf.reduce((s, t) => s + (t.avgCompletion || 0), 0) / perf.length) + "%"}
            icon="📊"
            color="#8b5cf6"
          />
          <StatCard
            label="Top Rated"
            value={perf.sort((a,b)=>(b.averageRating||0)-(a.averageRating||0))[0]?.teacherName?.split(" ")[0] || "—"}
            icon="🏆"
            color="#f59e0b"
          />
        </div>
      )}

      {/* Search & Sort */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
        <Input
          placeholder="🔍 Search by name or department…"
          value={searchQ}
          onChange={e => setSearchQ(e.target.value)}
          style={{ flex: 1, maxWidth: 320 }}
        />
        <Select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          options={[
            { label: "Sort: Name", value: "name" },
            { label: "Sort: Highest Rating", value: "rating" },
            { label: "Sort: Most Reviews", value: "reviews" },
            { label: "Sort: Highest Completion", value: "completion" },
          ]}
          style={{ minWidth: 210 }}
        />
      </div>

      <Card>
        {loading
          ? <div style={{ padding: 32, textAlign: "center", color: T.muted }}>Loading performance data…</div>
          : rows.length
            ? <Table
                columns={["Teacher", "Department", "Courses", "Student Reviews", "Avg Rating", "Avg Completion", "Actions"]}
                rows={rows}
              />
            : <div style={{ padding: 32, textAlign: "center", color: T.muted }}>
                {searchQ ? "No teachers match your search." : "No performance data available yet."}
              </div>
        }
      </Card>

      {/* Reviews Drill-Down Modal */}
      {selectedTeacher && (
        <Modal open={!!selectedTeacher} title={`Reviews for ${selectedTeacher.teacherName}`} onClose={() => { setSelectedTeacher(null); setReviews([]); }}>
          <div style={{ marginBottom: 16, display: "flex", gap: 16, alignItems: "center" }}>
            <Avatar name={selectedTeacher.teacherName} size={48} color={T.accentG} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 18, color: T.text }}>{selectedTeacher.teacherName}</div>
              <div style={{ color: T.muted, fontSize: 13 }}>{selectedTeacher.department}</div>
              <div style={{ marginTop: 4 }}>{renderStars(selectedTeacher.averageRating)} &nbsp;
                <span style={{ color: T.muted, fontSize: 12 }}>({selectedTeacher.totalReviews} review{selectedTeacher.totalReviews !== 1 ? "s" : ""})</span>
              </div>
            </div>
          </div>

          {reviewsLoading
            ? <div style={{ padding: 24, textAlign: "center", color: T.muted }}>Loading reviews…</div>
            : reviews.length === 0
              ? <div style={{ padding: 24, textAlign: "center", color: T.muted }}>
                  No reviews submitted yet. Students can rate this teacher after completing 50% of a course.
                </div>
              : <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 400, overflowY: "auto" }}>
                  {reviews.map((r, i) => (
                    <div key={r.id || i} style={{
                      background: T.surface2,
                      border: `1px solid ${T.border}`,
                      borderRadius: 10,
                      padding: "12px 16px",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Avatar name={r.studentName || "?"} size={24} color={T.accentB} />
                          <strong style={{ color: T.text, fontSize: 14 }}>{r.studentName || "Anonymous"}</strong>
                        </div>
                        <div>
                          {renderStars(r.rating)}
                          <span style={{ marginLeft: 8, fontSize: 11, color: T.muted }}>
                            {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}
                          </span>
                        </div>
                      </div>
                      {r.reviewText && (
                        <p style={{ margin: 0, color: T.textM, fontSize: 13, lineHeight: 1.5, fontStyle: "italic" }}>
                          "{r.reviewText}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
          }
        </Modal>
      )}

      {/* Calculation Breakdown Modal */}
      {selectedCalcTeacher && (
        <Modal open={!!selectedCalcTeacher} title={`Performance Calculation for ${selectedCalcTeacher.teacherName}`} onClose={() => setSelectedCalcTeacher(null)}>
          <div style={{ marginBottom: 20, display: "flex", gap: 16, alignItems: "center" }}>
            <Avatar name={selectedCalcTeacher.teacherName} size={48} color={T.accentG} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 18, color: T.text }}>{selectedCalcTeacher.teacherName}</div>
              <div style={{ color: T.muted, fontSize: 13 }}>{selectedCalcTeacher.teacherEmail}</div>
              <div style={{ color: T.muted, fontSize: 13, marginTop: 2 }}>{selectedCalcTeacher.department} • {selectedCalcTeacher.courseCount} Course(s)</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Assignment Submission Card */}
            <div style={{
              background: T.surface2,
              border: `1px solid ${T.border}`,
              borderRadius: 12,
              padding: 16,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontWeight: 600, color: T.text, display: "flex", alignItems: "center", gap: 6 }}>
                  📝 Assignment Completion
                </span>
                <span style={{ fontWeight: 700, color: T.accentB }}>{selectedCalcTeacher.assignScore ?? 0}%</span>
              </div>
              <ProgressBar value={selectedCalcTeacher.assignScore ?? 0} color={T.accentB} height={6} />
              <div style={{ fontSize: 12, color: T.muted, marginTop: 8 }}>
                Weighted at <strong>40%</strong> of the final rating (based on student assignment submission rates across all assigned courses).
              </div>
            </div>

            {/* Exam Grade Card */}
            <div style={{
              background: T.surface2,
              border: `1px solid ${T.border}`,
              borderRadius: 12,
              padding: 16,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontWeight: 600, color: T.text, display: "flex", alignItems: "center", gap: 6 }}>
                  ✍️ Exam Grades Avg
                </span>
                <span style={{ fontWeight: 700, color: T.accentY }}>{selectedCalcTeacher.examScore ?? 0}%</span>
              </div>
              <ProgressBar value={selectedCalcTeacher.examScore ?? 0} color={T.accentY} height={6} />
              <div style={{ fontSize: 12, color: T.muted, marginTop: 8 }}>
                Weighted at <strong>40%</strong> of the final rating (based on student grades in completed or evaluating exams).
              </div>
            </div>

            {/* Course Material Card */}
            <div style={{
              background: T.surface2,
              border: `1px solid ${T.border}`,
              borderRadius: 12,
              padding: 16,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontWeight: 600, color: T.text, display: "flex", alignItems: "center", gap: 6 }}>
                  📚 Course Material Coverage
                </span>
                <span style={{ fontWeight: 700, color: T.accentG }}>{selectedCalcTeacher.materialScore ?? 0}%</span>
              </div>
              <ProgressBar value={selectedCalcTeacher.materialScore ?? 0} color={T.accentG} height={6} />
              <div style={{ fontSize: 12, color: T.muted, marginTop: 8 }}>
                Weighted at <strong>20%</strong> of the final rating (based on the density of materials posted relative to course duration).
              </div>
            </div>

            {/* Weighted Calculation Info */}
            <div style={{
              background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(168,85,247,0.05))",
              border: `1px solid rgba(99,102,241,0.2)`,
              borderRadius: 12,
              padding: 16,
              textAlign: "center"
            }}>
              <div style={{ fontSize: 13, color: T.muted, marginBottom: 4 }}>Weighted Performance Formula</div>
              <div style={{ fontSize: 12, fontFamily: "monospace", color: T.text, marginBottom: 8 }}>
                (Assign × 0.40) + (Exams × 0.40) + (Materials × 0.20)
              </div>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 14, color: T.muted }}>Weighted Progress:</span>
                <span style={{ fontSize: 24, fontWeight: 800, color: (selectedCalcTeacher.avgCompletion ?? 0) >= 70 ? T.accentG : (selectedCalcTeacher.avgCompletion ?? 0) >= 40 ? T.accentY : "#ef4444" }}>
                  {selectedCalcTeacher.avgCompletion ?? 0}%
                </span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─── CERTIFICATIONS ───────────────────────────────────────────────────────────
export const AdminCertifications = () => {
  const [type, setType] = useState("STUDENT");
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [form, setForm] = useState({
    title: "",
    recipientId: "",
    bodyContent: "",
    issuedBy: "",
    date: new Date().toISOString().split("T")[0]
  });
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const certRef = useRef(null);

  useEffect(() => {
    Promise.all([getAllStudents(), getAllTeachers()])
      .then(([s, t]) => {
        setStudents(Array.isArray(s) ? s : (s?.data || s?.content || []));
        setTeachers(Array.isArray(t) ? t : (t?.data || t?.content || []));
      })
      .catch(console.error);
  }, []);

  const recipientOptions = type === "STUDENT"
    ? students.map(s => ({ label: s.name, value: s.id }))
    : teachers.map(t => ({ label: t.name, value: t.id }));

  const currentRecipientName = recipientOptions.find(o => o.value == form.recipientId)?.label || "[Recipient Name]";

  const handleIssue = async () => {
    if (!form.title || !form.recipientId || !form.bodyContent || !form.issuedBy) {
      alert("Please fill all fields.");
      return;
    }
    setLoading(true);
    try {
      // 1. Generate PDF
      const canvas = await html2canvas(certRef.current, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("landscape", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      
      // 2. Call API to notify and track
      await issueAdminCertificate({
        title: form.title,
        recipientType: type,
        recipientId: form.recipientId,
        bodyContent: form.bodyContent,
        issuedBy: form.issuedBy,
        date: form.date
      });

      // 3. Download
      pdf.save(`Certificate_${currentRecipientName.replace(/\s+/g, '_')}.pdf`);
      
      alert("Certificate Issued & Downloaded successfully!");
      setPreviewOpen(false);
      setForm({ ...form, title: "", recipientId: "", bodyContent: "" });
    } catch (error) {
      console.error(error);
      alert("Failed to issue certificate.");
    } finally {
      setLoading(false);
    }
  };

  const certificateTemplate = (
    <div 
      ref={certRef}
      style={{
        width: "800px",
        height: "560px",
        padding: "30px",
        background: "#fff",
        boxSizing: "border-box",
        position: "relative",
        fontFamily: "'Georgia', serif",
        textAlign: "center",
        border: "15px solid #1e1b4b",
        outline: "2px solid #eab308",
        outlineOffset: "-10px",
        margin: "0 auto",
        color: "#1f2937"
      }}
    >
      <div style={{ border: "2px solid #eab308", height: "100%", padding: "20px 30px", display: "flex", flexDirection: "column", justifyContent: "space-between", boxSizing: "border-box" }}>
        <div>
          <h1 style={{ fontSize: "36px", color: "#1e1b4b", textTransform: "uppercase", letterSpacing: "2px", margin: "10px 0 5px" }}>
            Certificate of Achievement
          </h1>
          <h3 style={{ fontSize: "20px", color: "#eab308", margin: "5px 0 15px" }}>
            {form.title || "[Certificate Title]"}
          </h3>
          <p style={{ fontSize: "15px", fontStyle: "italic", color: "#4b5563", margin: "5px 0" }}>This is to certify that</p>
          <h2 style={{ fontSize: "30px", borderBottom: "2px solid #cbd5e1", display: "inline-block", padding: "0 30px", margin: "10px 0 15px", color: "#1e1b4b" }}>
            {currentRecipientName}
          </h2>
          <p style={{ fontSize: "16px", color: "#4b5563", maxWidth: "600px", margin: "5px auto 10px", lineHeight: "1.5" }}>
            {form.bodyContent || "[Body Content]"}
          </p>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: "0 20px", marginTop: "10px" }}>
          <div style={{ textAlign: "center" }}>
            <p style={{ borderBottom: "1px solid #1e1b4b", width: "150px", paddingBottom: "5px", marginBottom: "5px", fontSize: "15px" }}>
              {new Date(form.date).toLocaleDateString()}
            </p>
            <p style={{ fontSize: "13px", color: "#64748b" }}>Date</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ borderBottom: "1px solid #1e1b4b", width: "180px", paddingBottom: "5px", marginBottom: "5px", fontSize: "16px", fontStyle: "italic" }}>
              {form.issuedBy || "[Issuer Name]"}
            </p>
            <p style={{ fontSize: "13px", color: "#64748b" }}>Authorized Signature</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fade-up">
      <PageHeader title="Issue Certificate" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Form Column */}
        <Card style={{ padding: "24px" }}>
          <h3 style={{ marginBottom: "20px", color: T.text, fontSize: "18px" }}>Certificate Details</h3>
          <Select 
            label="Recipient Type" 
            value={type} 
            onChange={e => { setType(e.target.value); setForm({ ...form, recipientId: "" }); }}
            options={[{label: "Student", value: "STUDENT"}, {label: "Teacher", value: "TEACHER"}]}
          />
          <div style={{ marginTop: "16px" }}>
            <Select 
              label="Recipient Name" 
              value={form.recipientId} 
              onChange={e => setForm({ ...form, recipientId: e.target.value })}
              options={[{label: "Select Recipient", value: ""}, ...recipientOptions]}
            />
          </div>
          <div style={{ marginTop: "16px" }}>
            <Input 
              label="Certificate Title" 
              placeholder="e.g. Best Teacher of the Year" 
              value={form.title} 
              onChange={e => setForm({ ...form, title: e.target.value })} 
              list="cert-suggestions"
            />
            <datalist id="cert-suggestions">
              <option value="Intercontinental Indoor Games" />
              <option value="Best Teacher of the Year" />
              <option value="Academic Excellence" />
              <option value="Sports Achievement" />
            </datalist>
          </div>
          <div style={{ marginTop: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", color: T.textM, marginBottom: "6px", fontWeight: "500" }}>Body Content</label>
            <textarea 
              style={{ width: "100%", padding: "12px", border: `1px solid ${T.border}`, borderRadius: "8px", minHeight: "100px", fontFamily: "inherit" }}
              placeholder="e.g. Has successfully completed the rigorous training..."
              value={form.bodyContent}
              onChange={e => setForm({ ...form, bodyContent: e.target.value })}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
            <Input type="date" label="Issue Date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            <Input label="Issued By" placeholder="e.g. Principal Smith" value={form.issuedBy} onChange={e => setForm({ ...form, issuedBy: e.target.value })} />
          </div>
          <Btn 
            variant="primary" 
            style={{ marginTop: "24px", width: "100%" }}
            onClick={() => setPreviewOpen(true)}
            disabled={!form.title || !form.recipientId || !form.bodyContent || !form.issuedBy}
          >
            Preview & Issue
          </Btn>
        </Card>

        {/* Small Preview Pane */}
        <Card style={{ padding: "24px", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
           <div style={{ transform: "scale(0.5)", transformOrigin: "center center" }}>
              {certificateTemplate}
           </div>
        </Card>
      </div>

      {previewOpen && (
        <Modal open={previewOpen} title="Certificate Preview" onClose={() => setPreviewOpen(false)}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px", overflowX: "auto", padding: "10px" }}>
            {certificateTemplate}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
            <Btn variant="outline" onClick={() => setPreviewOpen(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={handleIssue} disabled={loading}>
              {loading ? "Issuing..." : "Issue & Download PDF"}
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─── CONTACT QUERIES ──────────────────────────────────────────────────────────
export const AdminQueries = () => {
  const [messages, setMessages] = useState([]);
  const [orgs, setOrgs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("ALL");
  const [expanded, setExpanded] = useState(null); // expanded message id
  const [page, setPage]         = useState(1);

  useEffect(() => {
    Promise.all([
      getContactMessages(),
      getOrganizations()
    ])
      .then(([msgsData, orgsData]) => {
        setMessages(Array.isArray(msgsData) ? msgsData : []);
        setOrgs(Array.isArray(orgsData) ? orgsData : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleStatus = async (id, status) => {
    await updateContactStatus(id, status).catch(console.error);
    setMessages(m => m.map(x => x.id === id ? { ...x, status } : x));
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this message?")) return;
    await deleteContactMessage(id).catch(console.error);
    setMessages(m => m.filter(x => x.id !== id));
  };

  const statusColor = { NEW: T.accentY, PENDING: T.accent, RESOLVED: T.accentG };
  const statusBg    = { NEW: "#fef9c3", PENDING: "#eff6ff", RESOLVED: "#f0fdf4" };

  const orgMap = Object.fromEntries(orgs.map(o => [o.id, o.name]));

  // Filter by status tab
  const filtered = filter === "ALL" ? messages : messages.filter(m => m.status === filter);

  const counts = {
    NEW: messages.filter(m => m.status === "NEW").length,
    PENDING: messages.filter(m => m.status === "PENDING").length,
    RESOLVED: messages.filter(m => m.status === "RESOLVED").length
  };

  const pageSize = 15;
  const paginatedQueries = filtered.slice((page - 1) * pageSize, page * pageSize);

  const formatDate = (dt) => {
    if (!dt) return "—";
    const d = new Date(dt);
    return d.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="fade-up">
      <PageHeader title="Contact Form Queries"
        subtitle={`${counts.NEW} new · ${counts.PENDING} pending · ${counts.RESOLVED} resolved`} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { key: "ALL",      label: `All (${messages.length})` },
            { key: "NEW",      label: `🟡 New (${counts.NEW})` },
            { key: "PENDING",  label: `🔵 Pending (${counts.PENDING})` },
            { key: "RESOLVED", label: `🟢 Resolved (${counts.RESOLVED})` },
          ].map(f => (
            <button key={f.key} onClick={() => { setFilter(f.key); setPage(1); }}
              style={{ padding: "6px 16px", borderRadius: 50, cursor: "pointer",
                border: `1.5px solid ${filter === f.key ? T.primary : T.border}`,
                background: filter === f.key ? `${T.primary}20` : "transparent",
                color: filter === f.key ? T.primary : T.muted, fontWeight: 600, fontSize: 12 }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <Card>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: T.muted }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: T.muted }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
            <div style={{ fontFamily: "Syne", fontWeight: 700 }}>No messages yet</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>Contact form submissions will appear here.</div>
          </div>
        ) : (
          <div>
            {/* Table header */}
            <div style={{ display: "grid", gridTemplateColumns: "30px 1fr 180px 130px 140px 100px 80px",
              gap: 12, padding: "10px 14px", borderBottom: `1px solid ${T.border}`,
              fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.8 }}>
              <div>#</div><div>Sender</div><div>Subject</div><div>Phone</div>
              <div>Received</div><div>Status</div><div>Actions</div>
            </div>

            {paginatedQueries.map((msg, i) => (
              <div key={msg.id}>
                {/* Row */}
                <div onClick={() => setExpanded(expanded === msg.id ? null : msg.id)}
                  style={{ display: "grid", gridTemplateColumns: "30px 1fr 180px 130px 140px 100px 80px",
                    gap: 12, padding: "12px 14px",
                    borderBottom: `1px solid ${T.border}`,
                    background: expanded === msg.id ? `${T.primary}08` : "transparent",
                    cursor: "pointer", alignItems: "center", transition: "background .15s" }}>

                  <div style={{ fontSize: 12, color: T.muted }}>{i + 1}</div>

                  <div>
                    <div style={{ fontWeight: msg.status === "NEW" ? 700 : 500, fontSize: 13 }}>{msg.name}</div>
                    <div style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>{msg.email}</div>
                    {msg.organizationId && (
                      <div style={{ fontSize: 10, color: T.primary, fontWeight: 700, marginTop: 3 }}>
                        🏢 {orgMap[msg.organizationId] || `Org ID: ${msg.organizationId}`}
                      </div>
                    )}
                  </div>

                  <div style={{ fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {msg.subject || "General Enquiry"}
                  </div>

                  <div style={{ fontSize: 12, color: T.muted }}>{msg.phone}</div>

                  <div style={{ fontSize: 11, color: T.muted }}>{formatDate(msg.receivedAt)}</div>

                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 50,
                      padding: "3px 10px",
                      background: statusBg[msg.status] || T.bg3,
                      color: statusColor[msg.status] || T.muted }}>
                      {msg.status}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: 4 }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => handleDelete(msg.id)}
                      style={{ background: "#ef444420", color: "#ef4444", border: "none",
                        borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 12 }}>🗑</button>
                  </div>
                </div>

                {/* Expanded message + status controls */}
                {expanded === msg.id && (
                  <div style={{ padding: "14px 20px 18px", background: `${T.primary}06`,
                    borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 13, color: T.text, lineHeight: 1.7, marginBottom: 14,
                      background: T.bg3, borderRadius: 8, padding: "12px 16px" }}>
                      {msg.message || <span style={{ color: T.muted, fontStyle: "italic" }}>No message content</span>}
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, color: T.muted, alignSelf: "center" }}>Update status:</span>
                      {["NEW", "PENDING", "RESOLVED"].map(s => (
                        <button key={s} onClick={() => handleStatus(msg.id, s)}
                          style={{ padding: "5px 14px", borderRadius: 50, fontSize: 12, cursor: "pointer",
                            border: `1.5px solid ${statusColor[s]}`,
                            background: msg.status === s ? statusColor[s] + "30" : "transparent",
                            color: statusColor[s], fontWeight: 700 }}>
                          {s === "NEW" ? "🟡 New" : s === "PENDING" ? "🔵 Pending" : "🟢 Resolved"}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {filtered.length > pageSize && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, padding: 14 }}>
            <Btn size="sm" variant="ghost" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</Btn>
            <span style={{ fontSize: 13, alignSelf: 'center', color: T.muted }}>Page {page} of {Math.ceil(filtered.length / pageSize)}</span>
            <Btn size="sm" variant="ghost" onClick={() => setPage(p => p * pageSize < filtered.length ? p + 1 : p)} disabled={page * pageSize >= filtered.length}>Next</Btn>
          </div>
        )}
      </Card>
    </div>
  );
};

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
export const AdminNotifications = () => {
  const [notifs, setNotifs]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("ALL"); // ALL | UNREAD | INFO | WARNING | SUCCESS
  const [page, setPage]       = useState(1);

  useEffect(() => {
    getAdminNotifications()
      .then(d => setNotifs(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleMarkRead = async (id) => {
    await markAdminNotifRead(id).catch(console.error);
    setNotifs(n => n.map(x => x.id === id ? { ...x, read: true } : x));
  };

  const handleMarkAll = async () => {
    await markAdminNotifReadAll().catch(console.error);
    setNotifs(n => n.map(x => ({ ...x, read: true })));
  };

  const typeIcon  = { INFO: "ℹ️", WARNING: "⚠️", SUCCESS: "✅", ERROR: "❌" };
  const typeColor = { INFO: T.accent, WARNING: T.accentY, SUCCESS: T.accentG, ERROR: "#ef4444" };

  const filtered = notifs.filter(n => {
    if (filter === "UNREAD") return !n.read;
    if (filter === "ALL") return true;
    return n.type === filter;
  });
  const unreadCount = notifs.filter(n => !n.read).length;
  const pageSize = 15;
  const paginatedNotifs = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="fade-up">
      <PageHeader title="Notifications"
        subtitle={`${unreadCount} unread · ${notifs.length} total`}
        actions={[
          <Btn variant="ghost" size="sm" onClick={handleMarkAll} disabled={unreadCount === 0}>
            ✓ Mark All Read
          </Btn>
        ]} />

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { key: "ALL",     label: `All (${notifs.length})` },
          { key: "UNREAD",  label: `🔵 Unread (${unreadCount})` },
          { key: "INFO",    label: "ℹ️ Info" },
          { key: "WARNING", label: "⚠️ Warning" },
          { key: "SUCCESS", label: "✅ Success" },
        ].map(f => (
          <button key={f.key} onClick={() => { setFilter(f.key); setPage(1); }}
            style={{ padding: "6px 14px", borderRadius: 50, cursor: "pointer",
              border: `1.5px solid ${filter === f.key ? T.primary : T.border}`,
              background: filter === f.key ? `${T.primary}20` : "transparent",
              color: filter === f.key ? T.primary : T.muted,
              fontWeight: 600, fontSize: 12 }}>
            {f.label}
          </button>
        ))}
      </div>

      <Card>
        {loading ? (
          <div style={{ padding: 32, textAlign: "center", color: T.muted }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: T.muted }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🔔</div>
            <div style={{ fontFamily: "Syne", fontWeight: 700 }}>No notifications</div>
          </div>
        ) : paginatedNotifs.map((n, i) => (
          <div key={n.id}
            onClick={() => !n.read && handleMarkRead(n.id)}
            style={{ display: "flex", gap: 14, padding: "14px 0",
              borderBottom: i < filtered.length - 1 ? `1px solid rgba(45,33,96,.3)` : "none",
              alignItems: "flex-start", cursor: !n.read ? "pointer" : "default",
              background: !n.read ? `${T.primary}05` : "transparent",
              transition: "background .2s" }}>
            {/* Icon */}
            <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: `${typeColor[n.type] || T.primary}18`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
              {typeIcon[n.type] || "🔔"}
            </div>
            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: n.read ? 500 : 700,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {n.title}
              </div>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 3, lineHeight: 1.5 }}>
                {n.message}
              </div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 5 }}>
                {n.createdAt ? new Date(n.createdAt).toLocaleString("en-IN", {
                  day: "numeric", month: "short", year: "numeric",
                  hour: "2-digit", minute: "2-digit" }) : ""}
              </div>
            </div>
            {/* Unread dot */}
            {!n.read && (
              <div style={{ width: 10, height: 10, borderRadius: "50%",
                background: typeColor[n.type] || T.primaryL,
                flexShrink: 0, marginTop: 6 }} />
            )}
          </div>
        ))}
        {filtered.length > pageSize && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, padding: 14 }}>
            <Btn size="sm" variant="ghost" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</Btn>
            <span style={{ fontSize: 13, alignSelf: 'center', color: T.muted }}>Page {page} of {Math.ceil(filtered.length / pageSize)}</span>
            <Btn size="sm" variant="ghost" onClick={() => setPage(p => p * pageSize < filtered.length ? p + 1 : p)} disabled={page * pageSize >= filtered.length}>Next</Btn>
          </div>
        )}
      </Card>
    </div>
  );
};

// ─── ANNOUNCEMENTS ────────────────────────────────────────────────────────────
export const AdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [modal, setModal]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm]       = useState({ title: "", content: "", targetRole: "" });

  useEffect(() => { setLoading(true); getAllAnnouncements().then(d => setAnnouncements(Array.isArray(d) ? d : [])).catch(console.error).finally(() => setLoading(false)); }, []);

  const handleCreate = async () => {
    try {
      const created = await createAnnouncement({ title: form.title, content: form.content, targetRole: form.targetRole || null });
      setAnnouncements(a => [created, ...a]); setModal(false); setForm({ title: "", content: "", targetRole: "" });
    } catch (err) { alert("Error: " + err.message); }
  };

  const handleDelete = async (id) => {
    if (!confirmAction("Delete this announcement?")) return;
    await deleteAnnouncement(id).catch(console.error);
    setAnnouncements(a => a.filter(x => x.id !== id));
  };

  return (
    <div className="fade-up">
      <PageHeader title="Announcements" subtitle="Broadcast messages to students, teachers, or everyone"
        actions={[<Btn variant="primary" onClick={() => setModal(true)}>+ New Announcement</Btn>]} />
      <Card>
        {loading ? <div style={{ padding: 32, textAlign: "center", color: T.muted }}>Loading…</div>
          : announcements.length === 0
            ? <div style={{ padding: 32, textAlign: "center", color: T.muted }}>No announcements yet.</div>
            : announcements.map(a => (
              <div key={a.id} style={{ padding: "14px 0", borderBottom: `1px solid rgba(45,33,96,.4)`, display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{ width: 40, height: 40, background: `${T.primary}18`, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>📢</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{a.title}</div>
                  <div style={{ fontSize: 13, color: T.muted, margin: "4px 0" }}>{a.content}</div>
                  <div style={{ fontSize: 11, color: T.muted }}>By {a.authorName} · {a.targetRole ? <Badge type="info">{a.targetRole}</Badge> : <Badge type="success">Everyone</Badge>}</div>
                </div>
                <Btn size="xs" variant="danger" onClick={() => handleDelete(a.id)}>🗑</Btn>
              </div>
            ))
        }
      </Card>
      <Modal open={modal} onClose={() => setModal(false)} title="New Announcement">
        <Input label="Title *"   placeholder="Announcement title"  value={form.title}   onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        <Input label="Content *" placeholder="Write your message…" value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
        <Select label="Target Audience" value={form.targetRole} onChange={e => setForm(f => ({ ...f, targetRole: e.target.value }))}
          options={[{ value: "", label: "Everyone (Global)" }, { value: "STUDENT", label: "Students Only" }, { value: "TEACHER", label: "Teachers Only" }, { value: "PARENT", label: "Parents Only" }]} />
        <Btn variant="primary" full onClick={handleCreate}>Post Announcement →</Btn>
      </Modal>
    </div>
  );
};

// ─── SCHEDULE MEETINGS ────────────────────────────────────────────────────────
// ─── SCHEDULE MEETINGS ────────────────────────────────────────────────────────
export const AdminMeetings = () => {
  const authData = JSON.parse(localStorage.getItem("zenelait-auth") || "{}");
  const userRole = (authData.role || "ADMIN").toUpperCase();
  const userId = authData.id || 0;
  const isSuperAdmin = authData.superAdmin || false;

  const [meetings, setMeetings] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals & Forms
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [cancelId, setCancelId] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);

  // Tabs: LIST vs CALENDAR
  const [viewMode, setViewMode] = useState("LIST"); // LIST | CALENDAR
  // Meeting List tabs: UPCOMING | ONGOING | COMPLETED
  const [listTab, setListTab] = useState("UPCOMING");
  
  // Filters
  const [typeFilter, setTypeFilter] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");

  // Form State
  const [form, setForm] = useState({
    name: "",
    type: "ONLINE", // ONLINE, OPINION, OFFLINE
    description: "",
    recurringType: "ONCE",
    startDate: "",
    endDate: "",
    platformType: "ZOOM",
    joinLink: "",
    venue: "",
    coordinatorName: "",
    deadline: "",
    participants: [], // array of { id, type, name, email }
    questions: [], // array of { questionText, optionType, customOptions }
  });

  // Participant selector helpers
  const [selectedGroupType, setSelectedGroupType] = useState("ALL"); // ALL, ADMINS, TEACHERS
  const [searchTerm, setSearchTerm] = useState("");
  const [conflictWarnings, setConflictWarnings] = useState([]);

  // Attendance manual marker state
  const [attendanceForm, setAttendanceForm] = useState({}); // participantId -> boolean

  // Opinion Poll responses for current user (voting)
  const [pollAnswers, setPollAnswers] = useState({}); // questionId -> answerText

  // Calendar navigation state
  const [calendarDate, setCalendarDate] = useState(new Date());

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const data = await getMeetings();
      setMeetings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch meetings:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const [tList, aList] = await Promise.all([
        getAllTeachers().catch(() => []),
        getNonsuperAdmins().catch(() => []),
      ]);
      setTeachers(tList);
      setAdmins(aList);
    } catch (err) {
      console.error("Failed to fetch users for meeting invitation:", err);
    }
  };

  useEffect(() => {
    fetchMeetings();
    fetchUsers();
  }, []);

  // Conflict Detection Handler (Triggered when dates or participants change)
  useEffect(() => {
    if (form.type !== "ONLINE" && form.type !== "OFFLINE") {
      setConflictWarnings([]);
      return;
    }
    if (!form.startDate || !form.endDate || form.participants.length === 0) {
      setConflictWarnings([]);
      return;
    }

    const checkConflictsTimer = setTimeout(async () => {
      try {
        const warnings = await checkMeetingConflicts({
          startDate: form.startDate,
          endDate: form.endDate,
          participants: form.participants,
        });
        setConflictWarnings(warnings);
      } catch (err) {
        console.error("Conflict checking failed:", err);
      }
    }, 600);

    return () => clearTimeout(checkConflictsTimer);
  }, [form.startDate, form.endDate, form.participants, form.type]);

  const handleOpenCreate = () => {
    setEditId(null);
    setConflictWarnings([]);
    setForm({
      name: "",
      type: "ONLINE",
      description: "",
      recurringType: "ONCE",
      startDate: "",
      endDate: "",
      platformType: "ZOOM",
      joinLink: "",
      venue: "",
      coordinatorName: authData.name || "",
      deadline: "",
      participants: [],
      questions: [],
    });
    setFormOpen(true);
  };

  const handleOpenEdit = (m) => {
    setEditId(m.id);
    setConflictWarnings([]);
    setForm({
      name: m.name || "",
      type: m.type || "ONLINE",
      description: m.description || "",
      recurringType: m.recurringType || "ONCE",
      startDate: m.startDate ? m.startDate.substring(0, 16) : "",
      endDate: m.endDate ? m.endDate.substring(0, 16) : "",
      platformType: m.platformType || "ZOOM",
      joinLink: m.joinLink || "",
      venue: m.venue || "",
      coordinatorName: m.coordinatorName || "",
      deadline: m.deadline ? m.deadline.substring(0, 16) : "",
      participants: m.participants || [],
      questions: m.questions || [],
    });
    setFormOpen(true);
  };

  const handleAddQuestion = () => {
    setForm((f) => ({
      ...f,
      questions: [
        ...f.questions,
        { questionText: "", optionType: "YES_NO", customOptions: "" },
      ],
    }));
  };

  const handleRemoveQuestion = (idx) => {
    setForm((f) => ({
      ...f,
      questions: f.questions.filter((_, i) => i !== idx),
    }));
  };

  const handleQuestionChange = (idx, key, val) => {
    const updated = [...form.questions];
    updated[idx] = { ...updated[idx], [key]: val };
    setForm((f) => ({ ...f, questions: updated }));
  };

  const handleSelectParticipant = (user, type) => {
    const exists = form.participants.some(
      (p) => p.userId === user.id && p.type === type
    );
    if (exists) {
      setForm((f) => ({
        ...f,
        participants: f.participants.filter(
          (p) => !(p.userId === user.id && p.type === type)
        ),
      }));
    } else {
      setForm((f) => ({
        ...f,
        participants: [
          ...f.participants,
          {
            id: null, // assigned by backend
            userId: user.id,
            type: type,
            name: user.name,
            email: user.email,
          },
        ],
      }));
    }
  };

  const handleSelectBulkGroup = (groupType) => {
    let toAdd = [];
    if (groupType === "ADMINS_ONLY" || groupType === "ADMINS_TEACHERS") {
      admins.forEach((a) => {
        toAdd.push({ userId: a.id, type: "ADMIN", name: a.name, email: a.email });
      });
    }
    if (groupType === "TEACHERS_ONLY" || groupType === "ADMINS_TEACHERS") {
      teachers.forEach((t) => {
        toAdd.push({ userId: t.id, type: "TEACHER", name: t.name, email: t.email });
      });
    }

    // Merge without duplicates
    const combined = [...form.participants];
    toAdd.forEach((item) => {
      const exists = combined.some(
        (p) => p.userId === item.userId && p.type === item.type
      );
      if (!exists) {
        combined.push(item);
      }
    });

    setForm((f) => ({ ...f, participants: combined }));
  };

  const handleClearParticipants = () => {
    setForm((f) => ({ ...f, participants: [] }));
  };

  const handleSaveMeeting = async () => {
    if (!form.name.trim()) return alert("Meeting Name is required");
    if (form.participants.length === 0) return alert("Select at least one participant");

    if (form.type === "ONLINE" || form.type === "OFFLINE") {
      if (!form.startDate || !form.endDate) return alert("Start and End datetime are required");
      if (new Date(form.startDate) >= new Date(form.endDate)) return alert("Start time must be before end time");
      if (form.type === "ONLINE" && !form.joinLink.trim()) return alert("Join Link is required");
      if (form.type === "OFFLINE" && !form.venue.trim()) return alert("Venue location is required");
    } else if (form.type === "OPINION") {
      if (!form.deadline) return alert("Submission deadline is required");
      if (form.questions.length === 0) return alert("Add at least one query question");
      const emptyQ = form.questions.some((q) => !q.questionText.trim());
      if (emptyQ) return alert("Fill in the text for all query questions");
    }

    try {
      if (editId) {
        await updateMeeting(editId, form);
        alert("Meeting updated successfully!");
      } else {
        await createMeeting(form);
        alert("Meeting scheduled successfully & invitations sent!");
      }
      setFormOpen(false);
      fetchMeetings();
    } catch (err) {
      alert("Failed to save meeting: " + err.message);
    }
  };

  const handleCancelConfirm = async () => {
    try {
      await cancelMeeting(cancelId, cancelReason);
      alert("Meeting cancelled successfully.");
      setCancelId(null);
      setCancelReason("");
      fetchMeetings();
      if (selectedMeeting?.id === cancelId) {
        setDetailOpen(false);
      }
    } catch (err) {
      alert("Failed to cancel meeting: " + err.message);
    }
  };

  const handleDeleteMeeting = async (id) => {
    if (!window.confirm("ARE YOU ABSOLUTELY SURE? This will permanently delete the meeting from the database!")) return;
    try {
      await deleteMeeting(id);
      alert("Meeting deleted permanently.");
      fetchMeetings();
      setDetailOpen(false);
    } catch (err) {
      alert("Failed to delete meeting: " + err.message);
    }
  };

  const handleOpenDetails = (m) => {
    setSelectedMeeting(m);
    setDetailOpen(true);

    // Prep attendance form for marking
    const attMap = {};
    m.participants.forEach((p) => {
      attMap[p.id] = p.attended === true;
    });
    setAttendanceForm(attMap);

    // Reset poll answers if student/teacher voting
    setPollAnswers({});
  };

  const handleSaveAttendance = async () => {
    const payload = Object.keys(attendanceForm).map((pId) => ({
      participantId: Number(pId),
      attended: attendanceForm[pId],
    }));

    try {
      await markMeetingAttendance(selectedMeeting.id, payload);
      alert("Attendance updated successfully!");
      // Refresh current details
      const updated = await getMeetings();
      const match = updated.find((x) => x.id === selectedMeeting.id);
      if (match) setSelectedMeeting(match);
      fetchMeetings();
    } catch (err) {
      alert("Failed to save attendance: " + err.message);
    }
  };

  const handleSendAbsenteeFollowUp = async () => {
    try {
      await sendAbsenteeFollowUp(selectedMeeting.id);
      alert("Follow-up notifications successfully sent to absentees!");
    } catch (err) {
      alert("Failed to send absentee follow-up: " + err.message);
    }
  };

  const handleTeacherSelfCheckIn = async () => {
    try {
      await selfCheckInMeeting(selectedMeeting.id);
      alert("✅ Check-in success! You are marked as present.");
      const updated = await getMeetings();
      const match = updated.find((x) => x.id === selectedMeeting.id);
      if (match) setSelectedMeeting(match);
      fetchMeetings();
    } catch (err) {
      alert("Check-in failed: " + err.message);
    }
  };

  const handleVoteSubmit = async () => {
    const qs = selectedMeeting.questions || [];
    const responses = qs.map((q) => {
      const ans = pollAnswers[q.id];
      return {
        questionId: q.id,
        answer: ans || "",
      };
    });

    const missingVote = responses.some((r) => !r.answer.trim());
    if (missingVote) return alert("Please answer all questions before submitting.");

    try {
      await submitOpinionResponse(selectedMeeting.id, responses);
      alert("Your responses have been recorded. Thank you!");
      const updated = await getMeetings();
      const match = updated.find((x) => x.id === selectedMeeting.id);
      if (match) setSelectedMeeting(match);
      fetchMeetings();
    } catch (err) {
      alert("Failed to submit response: " + err.message);
    }
  };

  const exportAttendanceReport = (m) => {
    const header = "Name,Email,Role,AttendanceStatus,CheckInTime\n";
    const rows = m.participants
      .map(
        (p) =>
          `"${p.name}","${p.email}","${p.type}","${
            p.attended === null ? "PENDING" : p.attended ? "ATTENDED" : "ABSENT"
          }","${p.checkInTime || "—"}"`
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Meeting_Attendance_${m.name.replace(/\s+/g, "_")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Filtered lists logic
  const filteredMeetings = meetings.filter((m) => {
    if (typeFilter && m.type !== typeFilter) return false;
    if (listTab === "UPCOMING" && m.status !== "UPCOMING" && m.status !== "ONGOING") return false;
    if (listTab === "ONGOING" && m.status !== "ONGOING") return false;
    if (listTab === "COMPLETED" && m.status !== "COMPLETED" && m.status !== "CANCELLED") return false;

    if (groupFilter) {
      const hasGroup = m.participants.some((p) => p.type === groupFilter);
      if (!hasGroup) return false;
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!m.name.toLowerCase().includes(q) && !(m.description || "").toLowerCase().includes(q)) return false;
    }

    if (startDateFilter) {
      const mDate = m.startDate || m.deadline;
      if (mDate && mDate < startDateFilter) return false;
    }
    if (endDateFilter) {
      const mDate = m.startDate || m.deadline;
      if (mDate && mDate > endDateFilter) return false;
    }

    return true;
  });

  // Calendar calculations
  const changeMonth = (offset) => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + offset, 1));
  };

  const getCalendarDays = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Pad previous month days
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    // Present month days
    for (let d = 1; d <= totalDays; d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  };

  // Format Helper
  const fmtDT = (str) => {
    if (!str) return "—";
    return new Date(str).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // Metric calculation
  const metrics = {
    upcoming: meetings.filter((m) => m.status === "UPCOMING").length,
    ongoing: meetings.filter((m) => m.status === "ONGOING").length,
    completed: meetings.filter((m) => m.status === "COMPLETED").length,
    cancelled: meetings.filter((m) => m.status === "CANCELLED").length,
  };

  return (
    <div className="fade-up">
      <PageHeader
        title="Schedule Meetings"
        subtitle="Manage online classes, opinion ballot polls, & offline coordinate reviews."
        actions={[
          userRole === "ADMIN" && (
            <Btn key="create" variant="primary" onClick={handleOpenCreate}>
              + Schedule Meeting
            </Btn>
          ),
        ].filter(Boolean)}
      />

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        <Card style={{ borderLeft: "4px solid #8b5cf6", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ fontSize: 26 }}>📅</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{metrics.upcoming}</div>
            <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase" }}>Upcoming</div>
          </div>
        </Card>
        <Card style={{ borderLeft: "4px solid #10b981", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ fontSize: 26 }}>🟢</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{metrics.ongoing}</div>
            <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase" }}>Ongoing</div>
          </div>
        </Card>
        <Card style={{ borderLeft: "4px solid #3b82f6", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ fontSize: 26 }}>💼</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{metrics.completed}</div>
            <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase" }}>Completed</div>
          </div>
        </Card>
        <Card style={{ borderLeft: "4px solid #ef4444", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ fontSize: 26 }}>❌</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{metrics.cancelled}</div>
            <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase" }}>Cancelled</div>
          </div>
        </Card>
      </div>

      {/* Mode Selectors */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", gap: 8, background: T.bg3, padding: 4, borderRadius: 8, border: `1px solid ${T.border}` }}>
          <Btn size="sm" variant={viewMode === "LIST" ? "primary" : "ghost"} onClick={() => setViewMode("LIST")}>
            List View
          </Btn>
          <Btn size="sm" variant={viewMode === "CALENDAR" ? "primary" : "ghost"} onClick={() => setViewMode("CALENDAR")}>
            Calendar View
          </Btn>
        </div>

        {viewMode === "LIST" && (
          <div style={{ display: "flex", gap: 8, background: T.bg3, padding: 4, borderRadius: 8, border: `1px solid ${T.border}` }}>
            <Btn size="sm" variant={listTab === "UPCOMING" ? "primary" : "ghost"} onClick={() => setListTab("UPCOMING")}>
              Upcoming / Ongoing
            </Btn>
            <Btn size="sm" variant={listTab === "COMPLETED" ? "primary" : "ghost"} onClick={() => setListTab("COMPLETED")}>
              Completed / Cancelled
            </Btn>
          </div>
        )}
      </div>

      {/* Filter panel */}
      {viewMode === "LIST" && (
        <Card style={{ marginBottom: 20, padding: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
            <Select
              label="Meeting Type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              options={[
                { value: "", label: "All Types" },
                { value: "ONLINE", label: "Online Meetings" },
                { value: "OPINION", label: "Opinion Polls" },
                { value: "OFFLINE", label: "Offline Sessions" },
              ]}
            />
            <Select
              label="Audience Group"
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              options={[
                { value: "", label: "All Invited" },
                { value: "ADMIN", label: "Admins Invited" },
                { value: "TEACHER", label: "Teachers Invited" },
              ]}
            />
            <Input
              label="Search Agenda/Name"
              placeholder="Type keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Input
              label="From Date"
              type="date"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
            />
            <Input
              label="To Date"
              type="date"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
            />
          </div>
        </Card>
      )}

      {/* MAIN RENDER LIST */}
      {loading ? (
        <Card style={{ padding: 48, textAlign: "center", color: T.muted }}>Loading meetings data...</Card>
      ) : viewMode === "LIST" ? (
        filteredMeetings.length === 0 ? (
          <Card style={{ padding: 48, textAlign: "center", color: T.muted }}>
            <div style={{ fontSize: 42, marginBottom: 10 }}>📭</div>
            <div style={{ fontFamily: "Syne", fontWeight: 700 }}>No meetings scheduled in this tab</div>
          </Card>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            {filteredMeetings.map((m) => {
              const badgeType = m.status === "ONGOING" ? "success" : m.status === "UPCOMING" ? "info" : m.status === "CANCELLED" ? "danger" : "default";
              const typeIcon = m.type === "ONLINE" ? "📹" : m.type === "OFFLINE" ? "🏫" : "🗳️";
              const mDateStr = m.type === "OPINION" ? `Deadline: ${fmtDT(m.deadline)}` : `Starts: ${fmtDT(m.startDate)}`;

              return (
                <Card
                  key={m.id}
                  hover
                  style={{
                    padding: 16,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16,
                    borderLeft: `5px solid ${m.type === "ONLINE" ? "#a78bfa" : m.type === "OFFLINE" ? "#10b981" : "#f59e0b"}`,
                  }}
                >
                  <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: T.bg3, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                      {typeIcon}
                    </div>
                    <div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ fontWeight: 800, fontSize: 15, fontFamily: "Syne" }}>{m.name}</span>
                        <Badge type={badgeType}>{m.status}</Badge>
                        {m.recurringType && m.recurringType !== "ONCE" && <Badge type="warning">{m.recurringType}</Badge>}
                      </div>
                      <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>
                        {mDateStr} · 👥 {m.participants.length} invited
                      </div>
                      <div style={{ fontSize: 12, color: T.text, marginTop: 6, opacity: 0.8, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical" }}>
                        {m.description || "No agenda details provided."}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <Btn size="xs" variant="primary" onClick={() => handleOpenDetails(m)}>
                      Open Connect
                    </Btn>
                    {userRole === "ADMIN" && m.status === "UPCOMING" && (
                      <Btn size="xs" variant="ghost" onClick={() => handleOpenEdit(m)}>
                        Edit
                      </Btn>
                    )}
                    {userRole === "ADMIN" && (m.status === "UPCOMING" || m.status === "ONGOING") && (
                      <Btn size="xs" variant="danger" onClick={() => setCancelId(m.id)}>
                        Cancel
                      </Btn>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )
      ) : (
        /* CALENDAR VIEW */
        <Card style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <Btn size="sm" variant="ghost" onClick={() => changeMonth(-1)}>
              ◀ Previous
            </Btn>
            <h3 style={{ fontFamily: "Syne", fontSize: 18, fontWeight: 800, margin: 0 }}>
              {calendarDate.toLocaleString("en-US", { month: "long", year: "numeric" })}
            </h3>
            <Btn size="sm" variant="ghost" onClick={() => changeMonth(1)}>
              Next ▶
            </Btn>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, textAlign: "center", fontWeight: 700, fontSize: 12, textTransform: "uppercase", color: T.muted, marginBottom: 8 }}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} style={{ padding: "6px 0" }}>
                {day}
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, minHeight: 400 }}>
            {getCalendarDays().map((date, idx) => {
              if (!date) {
                return <div key={`empty-${idx}`} style={{ background: `${T.bg2}30`, borderRadius: 8 }} />;
              }

              const dStr = date.toISOString().split("T")[0];
              const dayMeetings = meetings.filter((m) => {
                const mDate = m.startDate || m.deadline;
                return mDate && mDate.split("T")[0] === dStr;
              });

              const isToday = new Date().toDateString() === date.toDateString();

              return (
                <div
                  key={dStr}
                  style={{
                    background: T.bg3,
                    border: `1.5px solid ${isToday ? T.primary : T.border}`,
                    borderRadius: 8,
                    padding: 6,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    minHeight: 80,
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: isToday ? T.primary : T.muted }}>
                    {date.getDate()}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 4 }}>
                    {dayMeetings.map((m) => {
                      const dotColor = m.type === "ONLINE" ? "#8b5cf6" : m.type === "OFFLINE" ? "#10b981" : "#f59e0b";
                      return (
                        <div
                          key={m.id}
                          onClick={() => handleOpenDetails(m)}
                          style={{
                            fontSize: 10,
                            padding: "2px 4px",
                            background: `${dotColor}20`,
                            color: dotColor,
                            borderRadius: 4,
                            cursor: "pointer",
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                            textOverflow: "ellipsis",
                            fontWeight: 700,
                          }}
                          title={m.name}
                        >
                          {m.name}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* SCHEDULE/EDIT MODAL */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editId ? "Edit Meeting Schedule" : "Schedule New Meeting"}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Input
            label="Meeting Name / Topic *"
            placeholder="e.g. Q2 Review Meeting"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Select
            label="Meeting Type *"
            value={form.type}
            disabled={!!editId} // lock type on edit
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            options={[
              { value: "ONLINE", label: "Online Class / Video Meeting" },
              { value: "OFFLINE", label: "Offline Coordinate Meeting" },
              { value: "OPINION", label: "Opinion Ballot / Ballot Poll" },
            ]}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>
            Agenda Description / Description
          </label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Provide agenda details for participants..."
            style={{
              width: "100%",
              background: T.bg3,
              border: "1.5px solid " + T.border,
              borderRadius: 9,
              padding: "10px 14px",
              fontSize: 13,
              color: T.text,
              outline: "none",
              resize: "none",
              fontFamily: "inherit",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Dynamic Fields by Type */}
        {form.type === "ONLINE" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <Select
              label="Platform *"
              value={form.platformType}
              onChange={(e) => setForm({ ...form, platformType: e.target.value })}
              options={[
                { value: "ZOOM", label: "Zoom Video" },
                { value: "MEET", label: "Google Meet" },
                { value: "TEAMS", label: "Microsoft Teams" },
                { value: "OTHER", label: "Other URL Platform" },
              ]}
            />
            <Input
              label="Platform Join Link *"
              placeholder="https://..."
              value={form.joinLink}
              onChange={(e) => setForm({ ...form, joinLink: e.target.value })}
            />
          </div>
        )}

        {form.type === "OFFLINE" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <Input
              label="Venue (Room / Building) *"
              placeholder="e.g. Conference Room B, Main Hall"
              value={form.venue}
              onChange={(e) => setForm({ ...form, venue: e.target.value })}
            />
            <Input
              label="Meeting Coordinator / Host Name *"
              placeholder="Host Name"
              value={form.coordinatorName}
              onChange={(e) => setForm({ ...form, coordinatorName: e.target.value })}
            />
          </div>
        )}

        {form.type !== "OPINION" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
            <Input
              label="Start Date & Time *"
              type="datetime-local"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
            <Input
              label="End Date & Time *"
              type="datetime-local"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
            <Select
              label="Recurring Pattern"
              value={form.recurringType}
              onChange={(e) => setForm({ ...form, recurringType: e.target.value })}
              options={[
                { value: "ONCE", label: "One-Time (Once)" },
                { value: "DAILY", label: "Daily Scheduled" },
                { value: "WEEKLY", label: "Weekly Scheduled" },
                { value: "MONTHLY", label: "Monthly Scheduled" },
              ]}
            />
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14, marginBottom: 14 }}>
            <Input
              label="Opinion Deadline Date & Time *"
              type="datetime-local"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            />
          </div>
        )}

        {/* OPINION POLL BUILDER */}
        {form.type === "OPINION" && (
          <Card style={{ marginBottom: 14, background: `${T.bg2}60`, border: `1px dashed ${T.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontWeight: 800, fontSize: 13 }}>Opinion Ballot Questions</div>
              <Btn size="xs" variant="primary" onClick={handleAddQuestion}>
                + Add Question
              </Btn>
            </div>

            {form.questions.map((q, idx) => (
              <div key={idx} style={{ display: "grid", gridTemplateColumns: "3fr 2fr 2fr auto", gap: 10, alignItems: "center", marginBottom: 10 }}>
                <Input
                  label="Question Text *"
                  placeholder="e.g. Do you agree with the new syllabus?"
                  value={q.questionText}
                  onChange={(e) => handleQuestionChange(idx, "questionText", e.target.value)}
                />
                <Select
                  label="Option Choices Type"
                  value={q.optionType}
                  onChange={(e) => handleQuestionChange(idx, "optionType", e.target.value)}
                  options={[
                    { value: "YES_NO", label: "Yes / No" },
                    { value: "YES_NO_OTHER", label: "Yes / No / Other text" },
                    { value: "CUSTOM", label: "Custom Text choices" },
                  ]}
                />
                {q.optionType === "CUSTOM" ? (
                  <Input
                    label="Custom choices (comma-split) *"
                    placeholder="e.g. Red, Blue, Green"
                    value={q.customOptions}
                    onChange={(e) => handleQuestionChange(idx, "customOptions", e.target.value)}
                  />
                ) : (
                  <div />
                )}
                <Btn size="xs" variant="danger" style={{ marginTop: 10 }} onClick={() => handleRemoveQuestion(idx)}>
                  🗑
                </Btn>
              </div>
            ))}
          </Card>
        )}

        {/* PARTICIPANTS LIST SELECTOR */}
        <Card style={{ marginBottom: 14, background: `${T.bg2}60` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontWeight: 800, fontSize: 13 }}>Invited Participants ({form.participants.length} selected)</div>
            <div style={{ display: "flex", gap: 6 }}>
              <Btn size="xs" variant="primary" onClick={() => handleSelectBulkGroup("ADMINS_ONLY")}>
                Invite Admins
              </Btn>
              <Btn size="xs" variant="primary" onClick={() => handleSelectBulkGroup("TEACHERS_ONLY")}>
                Invite Teachers
              </Btn>
              <Btn size="xs" variant="success" onClick={() => handleSelectBulkGroup("ADMINS_TEACHERS")}>
                Invite All Staff
              </Btn>
              <Btn size="xs" variant="ghost" onClick={handleClearParticipants}>
                Clear
              </Btn>
            </div>
          </div>

          {/* Search participant list */}
          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <Select
              value={selectedGroupType}
              onChange={(e) => setSelectedGroupType(e.target.value)}
              options={[
                { value: "ALL", label: "Filter: All Staff" },
                { value: "ADMINS", label: "Filter: Admins" },
                { value: "TEACHERS", label: "Filter: Teachers" },
              ]}
              style={{ width: 140 }}
            />
            <Input
              placeholder="Search user by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* User selector list scroll container */}
          <div style={{ maxHeight: 150, overflowY: "auto", border: `1px solid ${T.border}`, borderRadius: 8, padding: 6, background: T.bg3 }}>
            {/* Combine available lists */}
            {[
              ...(selectedGroupType === "ALL" || selectedGroupType === "ADMINS"
                ? admins.map((x) => ({ ...x, roleType: "ADMIN" }))
                : []),
              ...(selectedGroupType === "ALL" || selectedGroupType === "TEACHERS"
                ? teachers.map((x) => ({ ...x, roleType: "TEACHER" }))
                : []),
            ]
              .filter((u) => {
                if (!searchTerm) return true;
                const s = searchTerm.toLowerCase();
                return u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s);
              })
              .map((u) => {
                const isSelected = form.participants.some(
                  (p) => p.userId === u.id && p.type === u.roleType
                );
                return (
                  <div
                    key={`${u.roleType}-${u.id}`}
                    onClick={() => handleSelectParticipant(u, u.roleType)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "6px 10px",
                      borderRadius: 6,
                      cursor: "pointer",
                      background: isSelected ? `${T.primary}12` : "transparent",
                      marginBottom: 4,
                      transition: "all .1s",
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 700, fontSize: 13 }}>{u.name}</span>
                      <span style={{ fontSize: 11, color: T.muted, marginLeft: 8 }}>({u.email})</span>
                    </div>
                    <Badge type={u.roleType === "ADMIN" ? "info" : "warning"}>
                      {u.roleType} {isSelected ? "✓" : "+"}
                    </Badge>
                  </div>
                );
              })}
          </div>
        </Card>

        {/* CONFLICT DETECTION WARNINGS */}
        {conflictWarnings.length > 0 && (
          <div style={{ background: "#ef444415", border: "1px solid #ef444430", borderRadius: 8, padding: 12, marginBottom: 14 }}>
            <div style={{ color: "#ef4444", fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
              ⚠️ Schedule Overlap Conflicts Detected ({conflictWarnings.length}):
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: T.text, opacity: 0.9 }}>
              {conflictWarnings.map((w, idx) => (
                <li key={idx} style={{ marginBottom: 4 }}>
                  {w}
                </li>
              ))}
            </ul>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 6 }}>
              Note: You can still choose to save and schedule, overriding this warning.
            </div>
          </div>
        )}

        <div style={{ marginTop: 20 }}>
          <Btn variant="primary" full size="lg" onClick={handleSaveMeeting}>
            {editId ? "Update Meeting Details →" : "Schedule Meeting & Notify →"}
          </Btn>
        </div>
      </Modal>

      {/* MEETING DETAILS / CONNECT MODAL */}
      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title="ZenelaitLMS Connect Dashboard">
        {selectedMeeting && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 24 }}>{selectedMeeting.type === "ONLINE" ? "📹" : selectedMeeting.type === "OFFLINE" ? "🏫" : "🗳️"}</span>
                <div>
                  <h2 style={{ fontFamily: "Syne", fontSize: 20, fontWeight: 800, margin: 0 }}>{selectedMeeting.name}</h2>
                  <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
                    Type: {selectedMeeting.type} · Status: <span style={{ fontWeight: 700 }}>{selectedMeeting.status}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {userRole === "ADMIN" && selectedMeeting.status === "COMPLETED" && (
                  <Btn size="sm" variant="success" onClick={() => exportAttendanceReport(selectedMeeting)}>
                    Export Attendance CSV
                  </Btn>
                )}
                {userRole === "ADMIN" && isSuperAdmin && (
                  <Btn size="sm" variant="danger" onClick={() => handleDeleteMeeting(selectedMeeting.id)}>
                    Delete Permanent
                  </Btn>
                )}
              </div>
            </div>

            <Card style={{ marginBottom: 16, background: T.bg3 }}>
              {selectedMeeting.type === "ONLINE" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase" }}>Video Platform</div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{selectedMeeting.platformType}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase" }}>Platform Join Link</div>
                    <div>
                      <a href={selectedMeeting.joinLink} target="_blank" rel="noreferrer" style={{ color: T.primary, fontWeight: 700, textDecoration: "none" }}>
                        Click to Join Class Link
                      </a>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase" }}>Class Start Time</div>
                    <div style={{ fontWeight: 700 }}>{fmtDT(selectedMeeting.startDate)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase" }}>Class End Time</div>
                    <div style={{ fontWeight: 700 }}>{fmtDT(selectedMeeting.endDate)}</div>
                  </div>
                </div>
              )}

              {selectedMeeting.type === "OFFLINE" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase" }}>Venue Location</div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{selectedMeeting.venue}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase" }}>Meeting Host / Coordinator</div>
                    <div style={{ fontWeight: 700 }}>{selectedMeeting.coordinatorName}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase" }}>Schedules Start</div>
                    <div style={{ fontWeight: 700 }}>{fmtDT(selectedMeeting.startDate)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase" }}>Schedules End</div>
                    <div style={{ fontWeight: 700 }}>{fmtDT(selectedMeeting.endDate)}</div>
                  </div>
                </div>
              )}

              {selectedMeeting.type === "OPINION" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase" }}>Response Deadline</div>
                    <div style={{ fontWeight: 700, color: "#f59e0b" }}>{fmtDT(selectedMeeting.deadline)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase" }}>Voter Turnout</div>
                    <div style={{ fontWeight: 700 }}>
                      {selectedMeeting.responses.length} / {selectedMeeting.participants.length} Voted
                    </div>
                  </div>
                </div>
              )}

              {selectedMeeting.description && (
                <div style={{ marginTop: 12, borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
                  <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", marginBottom: 4 }}>Agenda Description</div>
                  <div style={{ fontSize: 13, color: T.text, whiteSpace: "pre-wrap" }}>{selectedMeeting.description}</div>
                </div>
              )}
            </Card>

            {/* ACTIONABLE COMPONENTS FOR ATTENDANCE AND POLLS */}

            {/* 1. ATTENDANCE SECTION (Online & Offline Completed or Ongoing) */}
            {(selectedMeeting.type === "ONLINE" || selectedMeeting.type === "OFFLINE") && (
              <div>
                <h3 style={{ fontFamily: "Syne", fontSize: 15, fontWeight: 800, marginBottom: 10 }}>
                  Attendance Monitoring &amp; Check-In
                </h3>

                {/* Self Check-in button for Teacher if they are in participants */}
                {userRole === "TEACHER" &&
                  selectedMeeting.participants.some(
                    (p) => p.userId === userId && p.type === "TEACHER"
                  ) && (
                    <Card style={{ background: `${T.primary}08`, border: `1px dashed ${T.primary}40`, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>Self Check-In Attendance</div>
                        <div style={{ fontSize: 11, color: T.muted }}>Click check-in to confirm your attendance.</div>
                      </div>
                      <Btn
                        variant="primary"
                        onClick={handleTeacherSelfCheckIn}
                        disabled={
                          selectedMeeting.participants.find(
                            (p) => p.userId === userId && p.type === "TEACHER"
                          )?.attended === true
                        }
                      >
                        {selectedMeeting.participants.find(
                          (p) => p.userId === userId && p.type === "TEACHER"
                        )?.attended === true
                          ? "✓ Checked In"
                          : "Self Check-In Now"}
                      </Btn>
                    </Card>
                  )}

                {/* Manual Marking Table for Admin */}
                {userRole === "ADMIN" ? (
                  <Card style={{ background: `${T.bg2}30` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <div style={{ fontSize: 12, color: T.muted }}>Mark participant present or absent manually:</div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <Btn size="xs" variant="success" onClick={handleSaveAttendance}>
                          Save Attendance Report
                        </Btn>
                        <Btn size="xs" variant="danger" onClick={handleSendAbsenteeFollowUp}>
                          Notify Absentees
                        </Btn>
                      </div>
                    </div>

                    <div style={{ maxHeight: 200, overflowY: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                        <thead>
                          <tr style={{ borderBottom: `1px solid ${T.border}`, textAlign: "left" }}>
                            <th style={{ padding: "6px 8px" }}>Participant</th>
                            <th style={{ padding: "6px 8px" }}>Role</th>
                            <th style={{ padding: "6px 8px" }}>Checked In Time</th>
                            <th style={{ padding: "6px 8px", textAlign: "right" }}>Attendance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedMeeting.participants.map((p) => (
                            <tr key={p.id} style={{ borderBottom: `1px dashed ${T.border}` }}>
                              <td style={{ padding: "6px 8px" }}>
                                <strong>{p.name}</strong>
                                <div style={{ fontSize: 10, color: T.muted }}>{p.email}</div>
                              </td>
                              <td style={{ padding: "6px 8px" }}>{p.type}</td>
                              <td style={{ padding: "6px 8px" }}>{p.checkInTime ? fmtDT(p.checkInTime) : "—"}</td>
                              <td style={{ padding: "6px 8px", textAlign: "right" }}>
                                <input
                                  type="checkbox"
                                  checked={!!attendanceForm[p.id]}
                                  onChange={(e) =>
                                    setAttendanceForm({
                                      ...attendanceForm,
                                      [p.id]: e.target.checked,
                                    })
                                  }
                                />
                                <span style={{ marginLeft: 6 }}>{attendanceForm[p.id] ? "Present" : "Absent"}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                ) : (
                  /* Display Table for Teachers */
                  <Card>
                    <div style={{ maxHeight: 200, overflowY: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                        <thead>
                          <tr style={{ borderBottom: `1px solid ${T.border}`, textAlign: "left" }}>
                            <th style={{ padding: "6px 8px" }}>Participant</th>
                            <th style={{ padding: "6px 8px" }}>Role</th>
                            <th style={{ padding: "6px 8px", textAlign: "right" }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedMeeting.participants.map((p) => (
                            <tr key={p.id} style={{ borderBottom: `1px dashed ${T.border}` }}>
                              <td style={{ padding: "6px 8px" }}>{p.name}</td>
                              <td style={{ padding: "6px 8px" }}>{p.type}</td>
                              <td style={{ padding: "6px 8px", textAlign: "right" }}>
                                <Badge type={p.attended === null ? "default" : p.attended ? "success" : "danger"}>
                                  {p.attended === null ? "Pending" : p.attended ? "Attended" : "Absent"}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* 2. OPINION POLL RESPONSE OR TALLY SECTION */}
            {selectedMeeting.type === "OPINION" && (
              <div>
                <h3 style={{ fontFamily: "Syne", fontSize: 15, fontWeight: 800, marginBottom: 10 }}>
                  Opinion Poll Ballot Questions
                </h3>

                {/* Submit Vote panel if user is invited and hasn't voted, and poll is active */}
                {selectedMeeting.participants.some(
                  (p) => p.userId === userId && p.type === userRole
                ) &&
                !selectedMeeting.responses.some((r) => r.userId === userId) &&
                (selectedMeeting.status === "UPCOMING" || selectedMeeting.status === "ONGOING") ? (
                  <Card style={{ border: `1px dashed ${T.accent}`, background: `${T.accent}05`, padding: 16 }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: T.accent, marginBottom: 12 }}>
                      🗳️ Submit Your Opinion Responses:
                    </div>

                    {selectedMeeting.questions.map((q) => {
                      const hasOther = q.optionType === "YES_NO_OTHER";
                      const customOpts = q.customOptions ? q.customOptions.split(",") : [];

                      return (
                        <div key={q.id} style={{ marginBottom: 14 }}>
                          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>{q.questionText}</div>

                          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                            {q.optionType === "YES_NO" || q.optionType === "YES_NO_OTHER" ? (
                              <>
                                {["Yes", "No"].map((opt) => (
                                  <label key={opt} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                                    <input
                                      type="radio"
                                      name={`question-${q.id}`}
                                      value={opt}
                                      checked={pollAnswers[q.id] === opt}
                                      onChange={() => setPollAnswers({ ...pollAnswers, [q.id]: opt })}
                                    />
                                    {opt}
                                  </label>
                                ))}
                                {hasOther && (
                                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                                      <input
                                        type="radio"
                                        name={`question-${q.id}`}
                                        value="Other"
                                        checked={pollAnswers[q.id]?.startsWith("Other: ")}
                                        onChange={() => setPollAnswers({ ...pollAnswers, [q.id]: "Other: " })}
                                      />
                                      Other
                                    </label>
                                    {pollAnswers[q.id]?.startsWith("Other: ") && (
                                      <input
                                        type="text"
                                        placeholder="Type option detail..."
                                        style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 4, padding: "3px 6px", color: T.text, fontSize: 11 }}
                                        onChange={(e) =>
                                          setPollAnswers({ ...pollAnswers, [q.id]: `Other: ${e.target.value}` })
                                        }
                                      />
                                    )}
                                  </div>
                                )}
                              </>
                            ) : (
                              customOpts.map((opt) => (
                                <label key={opt} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                                  <input
                                    type="radio"
                                    name={`question-${q.id}`}
                                    value={opt.trim()}
                                    checked={pollAnswers[q.id] === opt.trim()}
                                    onChange={() => setPollAnswers({ ...pollAnswers, [q.id]: opt.trim() })}
                                  />
                                  {opt.trim()}
                                </label>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}

                    <Btn variant="primary" size="sm" style={{ marginTop: 10 }} onClick={handleVoteSubmit}>
                      Submit Opinion Answers
                    </Btn>
                  </Card>
                ) : (
                  /* Voted banner */
                  selectedMeeting.responses.some((r) => r.userId === userId) && (
                    <div style={{ background: `${T.accentG}15`, border: `1px solid ${T.accentG}40`, padding: "8px 12px", borderRadius: 8, fontSize: 12, color: T.accentG, fontWeight: 700, marginBottom: 12 }}>
                      ✓ You have already submitted your response to this opinion ballot poll.
                    </div>
                  )
                )}

                {/* TALLY STATISTICS & WHO VOTED WHAT FOR ADMINS (OR FOR GENERAL VIEWS IF COMPLETED) */}
                {(userRole === "ADMIN" || selectedMeeting.status === "COMPLETED") && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <div style={{ fontWeight: 800, fontSize: 13, textTransform: "uppercase", color: T.muted }}>
                        Ballot Query Poll Results
                      </div>
                    </div>

                    {selectedMeeting.questions.map((q) => {
                      const questionResponses = selectedMeeting.responses.filter((r) => r.questionId === q.id);
                      // Tally responses
                      const tally = {};
                      questionResponses.forEach((res) => {
                        let ansKey = res.answer;
                        if (ansKey.startsWith("Other:")) {
                          ansKey = "Other Text Detail";
                        }
                        tally[ansKey] = (tally[ansKey] || 0) + 1;
                      });

                      return (
                        <Card key={q.id} style={{ marginBottom: 12, padding: 12, background: T.bg3 }}>
                          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>{q.questionText}</div>
                          {questionResponses.length === 0 ? (
                            <div style={{ fontSize: 12, color: T.muted }}>No responses submitted yet.</div>
                          ) : (
                            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                              {Object.keys(tally).map((k) => (
                                <Badge key={k} type="info">
                                  {k}: {tally[k]} votes ({Math.round((tally[k] / questionResponses.length) * 100)}%)
                                </Badge>
                              ))}
                            </div>
                          )}
                        </Card>
                      );
                    })}

                    {/* Breakdown table showing user response audit for ADMINS */}
                    {userRole === "ADMIN" && (
                      <Card style={{ padding: 12, background: `${T.bg2}30`, marginTop: 12 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, marginBottom: 8 }}>
                          Individual Response Audit Trail:
                        </div>
                        <div style={{ maxHeight: 150, overflowY: "auto" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                            <thead>
                              <tr style={{ borderBottom: `1px solid ${T.border}`, textAlign: "left" }}>
                                <th style={{ padding: "4px" }}>Voter Name</th>
                                <th style={{ padding: "4px" }}>Query Question</th>
                                <th style={{ padding: "4px" }}>Vote Value</th>
                                <th style={{ padding: "4px", textAlign: "right" }}>Submitted At</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedMeeting.responses.map((res) => {
                                const qObj = selectedMeeting.questions.find((x) => x.id === res.questionId);
                                const pObj = selectedMeeting.participants.find((x) => x.userId === res.userId);
                                return (
                                  <tr key={res.id} style={{ borderBottom: `1px dashed ${T.border}` }}>
                                    <td style={{ padding: "4px" }}>{pObj ? pObj.name : `User ID ${res.userId}`}</td>
                                    <td style={{ padding: "4px" }}>{qObj ? qObj.questionText.substring(0, 30) + "..." : "—"}</td>
                                    <td style={{ padding: "4px" }}>{res.answer}</td>
                                    <td style={{ padding: "4px", textAlign: "right" }}>{fmtDT(res.respondedAt)}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* CANCELLATION MODAL */}
      <Modal open={cancelId !== null} onClose={() => setCancelId(null)} title="Cancel Meeting Notification">
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>
            Reason for Cancellation *
          </label>
          <textarea
            rows={3}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Type reason for cancellation. All invited participants will be notified via email & in-app alerts..."
            style={{
              width: "100%",
              background: T.bg3,
              border: "1.5px solid " + T.border,
              borderRadius: 9,
              padding: "10px 14px",
              fontSize: 13,
              color: T.text,
              outline: "none",
              resize: "none",
              fontFamily: "inherit",
              boxSizing: "border-box",
            }}
          />
        </div>
        <Btn variant="danger" full onClick={handleCancelConfirm} disabled={!cancelReason.trim()}>
          Confirm Cancel Meeting &amp; Notify →
        </Btn>
      </Modal>
    </div>
  );
};

// ─── ADMIN ENROLLMENT REQUESTS ────────────────────────────────────────────────
export const AdminEnrollments = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await getAdminEnrollmentRequests();
      setRequests(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id) => {
    if (!confirmAction("Are you sure you want to approve this enrollment?")) return;
    setProcessingId(id);
    try {
      await approveEnrollmentRequest(id);
      alert("✅ Enrollment approved successfully!");
      fetchRequests();
    } catch (err) {
      console.error(err);
      alert(err.message || "Approval failed.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id) => {
    if (!confirmAction("Are you sure you want to reject this enrollment?")) return;
    setProcessingId(id);
    try {
      await rejectEnrollmentRequest(id);
      alert("❌ Enrollment request rejected.");
      fetchRequests();
    } catch (err) {
      console.error(err);
      alert(err.message || "Rejection failed.");
    } finally {
      setProcessingId(null);
    }
  };

  const columns = ["Student Info", "Course Info", "Status", "Requested At", "Actions"];
  const rows = requests.map(r => [
    <div>
      <div style={{ fontWeight: 700 }}>{r.studentName || "Student"}</div>
      <div style={{ fontSize: 11, color: T.muted }}>{r.studentEmail}</div>
    </div>,
    <div>
      <div style={{ fontWeight: 700 }}>{r.courseTitle}</div>
      <div style={{ fontSize: 11, color: T.muted }}>Batch: {r.batchName || "N/A"}</div>
    </div>,
    <Badge type={r.status === "APPROVED" ? "success" : r.status === "PENDING" ? "warning" : "danger"}>
      {r.status}
    </Badge>,
    r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN") : "—",
    r.status === "PENDING" ? (
      <div style={{ display: "flex", gap: 8 }}>
        <Btn 
          size="xs" 
          variant="success" 
          onClick={() => handleApprove(r.id)}
          disabled={processingId === r.id}
        >
          ✓ Approve
        </Btn>
        <Btn 
          size="xs" 
          variant="danger" 
          onClick={() => handleReject(r.id)}
          disabled={processingId === r.id}
        >
          ✗ Reject
        </Btn>
      </div>
    ) : "—"
  ]);

  return (
    <div className="fade-up">
      <PageHeader title="Enrollment Requests" subtitle="Review and approve student enrollment requests"
        actions={[<Btn size="sm" variant="ghost" onClick={fetchRequests}>🔄 Refresh</Btn>]} />
      <Card>
        {loading ? (
          <div style={{ padding: 32, textAlign: "center", color: T.muted }}>Loading requests…</div>
        ) : requests.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: T.muted }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>📥</div>
            <div style={{ fontFamily: "Syne", fontWeight: 700 }}>No enrollment requests found</div>
          </div>
        ) : (
          <Table columns={columns} rows={rows} />
        )}
      </Card>
    </div>
  );
};

// ─── ADMIN TEACHER RATINGS & PERFORMANCE ──────────────────────────────────────
export const AdminTeacherRatings = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const fetchPerformance = async () => {
    try {
      setLoading(true);
      const res = await getAdminTeachersPerformance();
      setTeachers(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, []);

  const handleViewReviews = async (teacher) => {
    setSelectedTeacher(teacher);
    setReviewsLoading(true);
    try {
      const res = await getAdminTeacherReviews(teacher.teacherId);
      setReviews(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const columns = ["Teacher Name", "Average Rating", "Total Reviews", "Action"];
  const rows = teachers.map(t => [
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <Avatar name={t.teacherName} size={32} />
      <div>
        <div style={{ fontWeight: 700 }}>{t.teacherName}</div>
        <div style={{ fontSize: 11, color: T.muted }}>{t.teacherEmail}</div>
      </div>
    </div>,
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ color: "#ffc107", fontSize: 18 }}>★</span>
      <span style={{ fontWeight: 700 }}>{t.averageRating ? Number(t.averageRating).toFixed(1) : "N/A"}</span>
    </div>,
    <span style={{ fontWeight: 600 }}>{t.totalReviews} reviews</span>,
    <Btn size="xs" variant="primary" onClick={() => handleViewReviews(t)}>
      🔎 View Reviews
    </Btn>
  ]);

  return (
    <div className="fade-up">
      <PageHeader title="Teacher Ratings & Performance" subtitle="Monitor average ratings and student feedback"
        actions={[<Btn size="sm" variant="ghost" onClick={fetchPerformance}>🔄 Refresh</Btn>]} />
      <Card>
        {loading ? (
          <div style={{ padding: 32, textAlign: "center", color: T.muted }}>Loading performance metrics…</div>
        ) : teachers.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: T.muted }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>⭐</div>
            <div style={{ fontFamily: "Syne", fontWeight: 700 }}>No teacher rating reviews yet</div>
          </div>
        ) : (
          <Table columns={columns} rows={rows} />
        )}
      </Card>

      {selectedTeacher && (
        <Modal open={true} onClose={() => setSelectedTeacher(null)} title={`⭐ Reviews for ${selectedTeacher.teacherName}`}>
          {reviewsLoading ? (
            <div style={{ padding: 20, textAlign: "center", color: T.muted }}>Loading feedback...</div>
          ) : reviews.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: T.muted }}>No detailed reviews found for this teacher.</div>
          ) : (
            <div style={{ display: "grid", gap: 12, padding: "10px 0" }}>
              {reviews.map(r => (
                <Card key={r.id} style={{ padding: 14, background: T.bg3 }} hover={false}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{r.studentName || "Anonymous"}</div>
                    <div style={{ display: "flex", gap: 2 }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <span key={star} style={{ color: star <= r.rating ? "#ffc107" : T.muted, fontSize: 14 }}>★</span>
                      ))}
                    </div>
                  </div>
                  {r.courseTitle && (
                    <div style={{ fontSize: 10, color: T.muted, marginBottom: 6 }}>Course: {r.courseTitle}</div>
                  )}
                  <div style={{ fontSize: 12, color: T.text, lineHeight: 1.4 }}>{r.reviewText || "No comment left."}</div>
                  <div style={{ fontSize: 10, color: T.muted, marginTop: 6, textAlign: "right" }}>
                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN") : ""}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};

// ─── ADMIN SUBSCRIPTION PLAN ──────────────────────────────────────────────────
export const AdminSubscription = ({ onNav }) => {
  const [activePlan, setActivePlan] = useState(null);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const authData = JSON.parse(localStorage.getItem("zenelait-auth") || "{}");
  const isSuperAdmin = authData.superAdmin === true;

  const loadData = async () => {
    setLoading(true);
    try {
      const [sub, pkgs] = await Promise.all([
        adminGetActiveSubscription(),
        adminGetPackages(),
      ]);
      setActivePlan(sub);
      setPackages(Array.isArray(pkgs) ? pkgs : []);
    } catch (err) {
      console.error("Failed to load subscription data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      loadData();
    }
  }, []);

  if (!isSuperAdmin) {
    return (
      <div style={{ padding: 28 }}>
        <Card style={{ padding: 24, textAlign: "center", border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
          <div style={{ fontFamily: "Syne", fontSize: 18, fontWeight: 800, color: T.accentR }}>Access Denied</div>
          <p style={{ color: T.muted, fontSize: 13, marginTop: 8 }}>
            Only the organization Super Admin has access to subscription details and plan management.
          </p>
        </Card>
      </div>
    );
  }

  const handleSubscribe = async (packageId, packageName, price) => {
    const isActivePkg = activePlan?.status === "ACTIVE" && activePlan.subscriptionPackage?.id === packageId;
    const confirmMsg = isActivePkg
      ? `Are you sure you want to renew/extend your subscription to "${packageName}" for ₹${price.toLocaleString("en-IN")}?`
      : `Are you sure you want to subscribe to "${packageName}" for ₹${price.toLocaleString("en-IN")}?`;

    if (!confirmAction(confirmMsg)) return;
    setSubmitting(true);
    try {
      await initiatePayment(
        price,
        authData.name,
        authData.email,
        async (verification) => {
          try {
            await adminSubscribe(packageId);
            alert("✅ Payment successful! Subscription updated successfully!");
            setShowUpgradeModal(false);
            loadData();
          } catch (err) {
            alert("Error updating subscription: " + err.message);
          } finally {
            setSubmitting(false);
          }
        },
        (error) => {
          alert(`Payment failed: ${error.message}`);
          setSubmitting(false);
        }
      );
    } catch (err) {
      alert("Error: " + err.message);
      setSubmitting(false);
    }
  };

  const getDaysLeft = (endDate) => {
    if (!endDate) return 0;
    const diff = new Date(endDate) - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const daysLeft = activePlan && activePlan.status === "ACTIVE" ? getDaysLeft(activePlan.endDate) : 0;
  const isExpiringSoon = daysLeft <= 10 && daysLeft > 0;

  return (
    <div className="fade-up">
      <PageHeader title="Subscription Management" subtitle="Manage your organization's subscription plan and packages" />

      {loading ? (
        <Card style={{ padding: 48, textAlign: "center", color: T.muted }}>Loading plan details...</Card>
      ) : (
        <>
          {/* Current Active Plan Banner */}
          <Card style={{
            padding: 24,
            marginBottom: 28,
            background: activePlan && activePlan.status === "ACTIVE"
              ? `linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(6,182,212,0.15) 100%)`
              : `linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(245,158,11,0.15) 100%)`,
            border: activePlan && activePlan.status === "ACTIVE"
              ? `1px solid rgba(124,58,237,0.3)`
              : `1px solid rgba(239,68,68,0.3)`,
            borderRadius: 16
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", flexWrap: "wrap", gap: 16 }}>
              <div>
                <Badge type={activePlan && activePlan.status === "ACTIVE" ? "success" : "danger"} style={{ marginBottom: 12 }}>
                  {activePlan && activePlan.status === "ACTIVE" ? "ACTIVE PLAN" : "NO ACTIVE PLAN / EXPIRED"}
                </Badge>
                <h3 style={{ fontFamily: "Syne", fontSize: 22, fontWeight: 800, margin: "0 0 6px", color: "#fff" }}>
                  {activePlan?.subscriptionPackage?.name || "No Subscription"}
                </h3>
                <p style={{ color: T.muted, fontSize: 13, margin: "0 0 16px" }}>
                  {activePlan?.subscriptionPackage?.description || "Your organization is currently not subscribed to any plan."}
                </p>
                {activePlan && (
                  <>
                    <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                      <div>
                        <div style={{ fontSize: 11, color: T.muted }}>Start Date</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>
                          {new Date(activePlan.startDate).toLocaleDateString("en-IN")}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: T.muted }}>Expiry Date</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: activePlan.status === "ACTIVE" && daysLeft <= 3 ? T.accentR : T.text }}>
                          {new Date(activePlan.endDate).toLocaleDateString("en-IN")}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: T.muted }}>Billing Type</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, textTransform: "capitalize" }}>
                          {activePlan.subscriptionPackage?.packageType?.toLowerCase() || "—"}
                        </div>
                      </div>
                    </div>
                    {activePlan.subscriptionPackage?.packageType === "MONTHLY" && (
                      <div style={{ marginTop: 16 }}>
                        <Btn
                          variant="primary"
                          size="sm"
                          onClick={() => setShowUpgradeModal(true)}
                        >
                          🚀 Upgrade Plan
                        </Btn>
                      </div>
                    )}
                  </>
                )}
              </div>

              {activePlan && activePlan.status === "ACTIVE" && (
                <div style={{ textAlign: "right", minWidth: 150 }}>
                  <div style={{ fontSize: 32, fontWeight: 900, fontFamily: "Syne", color: isExpiringSoon ? T.accentR : T.accentG }}>
                    {daysLeft}
                  </div>
                  <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.5 }}>
                    Days Remaining
                  </div>
                  {isExpiringSoon && (
                    <div style={{
                      marginTop: 8,
                      padding: "4px 10px",
                      background: "rgba(239,68,68,0.15)",
                      border: `1px solid ${T.accentR}40`,
                      borderRadius: 6,
                      fontSize: 11,
                      color: T.accentR,
                      fontWeight: 600
                    }}>
                      ⚠️ Expiring soon! Renew now.
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Pricing Grid */}
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontFamily: "Syne", fontSize: 16, fontWeight: 800, marginBottom: 6, color: "#fff" }}>Available Subscription Plans</h4>
            <p style={{ color: T.muted, fontSize: 13, margin: "0 0 20px" }}>Choose a plan that fits your organization's size and needs</p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
              {packages.map(pkg => {
                const isActivePkg = activePlan?.status === "ACTIVE" && activePlan.subscriptionPackage?.id === pkg.id;
                return (
                  <Card key={pkg.id} style={{
                    padding: 24,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    background: isActivePkg ? `${T.primary}08` : T.card,
                    border: isActivePkg ? `2.5px solid ${T.primary}` : `1px solid ${T.border}`,
                    borderRadius: 14,
                    position: "relative"
                  }}>
                    {isActivePkg && (
                      <span style={{
                        position: "absolute",
                        top: -12,
                        right: 20,
                        background: T.primary,
                        color: "#fff",
                        fontSize: 10,
                        fontWeight: 800,
                        padding: "3px 12px",
                        borderRadius: 50,
                        letterSpacing: 0.5
                      }}>CURRENT PLAN</span>
                    )}

                    <div>
                      <h4 style={{ fontFamily: "Syne", fontSize: 16, fontWeight: 800, margin: "0 0 4px", color: "#fff" }}>{pkg.name}</h4>
                      <div style={{ fontSize: 24, fontWeight: 900, color: T.accentY, margin: "12px 0 6px" }}>
                        ₹{pkg.price.toLocaleString("en-IN")}
                        <span style={{ fontSize: 13, fontWeight: 500, color: T.muted }}>
                          /{pkg.packageType === "YEARLY" ? "year" : "month"}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: T.muted, lineHeight: 1.5, margin: "10px 0 20px" }}>
                        {pkg.description || "Access to all features. Managed completely through Zenelait LMS."}
                      </p>
                      <div style={{ borderTop: `1px solid ${T.border}`, padding: "14px 0", fontSize: 12, color: T.text }}>
                        ✔️ Full platform access<br/>
                        ✔️ {pkg.durationDays} days validity<br/>
                        ✔️ In-app & email warnings
                      </div>
                    </div>

                    <Btn
                      variant={isActivePkg ? "ghost" : "primary"}
                      full
                      disabled={submitting}
                      onClick={() => handleSubscribe(pkg.id, pkg.name, pkg.price)}
                      style={{ marginTop: 18 }}
                    >
                      {isActivePkg 
                        ? (submitting ? "Processing..." : "Renew Plan →")
                        : (activePlan && activePlan.status === "ACTIVE" && pkg.packageType === "YEARLY" && activePlan.subscriptionPackage?.packageType === "MONTHLY")
                          ? "Upgrade Plan →"
                          : submitting 
                            ? "Processing..." 
                            : "Subscribe Now →"
                      }
                    </Btn>
                  </Card>
                );
              })}

              {packages.length === 0 && (
                <div style={{ gridColumn: "1/-1" }}>
                  <Card style={{ padding: 32, textAlign: "center", color: T.muted }}>
                    No packages created by platform administrators yet.
                  </Card>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {showUpgradeModal && (
        <Modal open={true} onClose={() => setShowUpgradeModal(false)} title="🚀 Upgrade to Yearly Plan">
          <div style={{ padding: "10px 0" }}>
            <p style={{ fontSize: 13, color: T.muted, marginBottom: 20 }}>
              Upgrade your active plan to a yearly billing cycle. Yearly plans offer uninterrupted service and cost-efficiency.
            </p>
            {packages.filter(pkg => pkg.packageType === "YEARLY" && pkg.active).length === 0 ? (
              <div style={{ textAlign: "center", padding: 20, color: T.muted, fontSize: 13 }}>
                No yearly subscription plans are currently available for your organization. Please contact the platform administrator.
              </div>
            ) : (
              <div style={{ display: "grid", gap: 16 }}>
                {packages.filter(pkg => pkg.packageType === "YEARLY" && pkg.active).map(pkg => (
                  <Card key={pkg.id} style={{ padding: 18, border: `1px solid ${T.border}`, background: T.bg3 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 10 }}>
                      <div>
                        <h4 style={{ fontFamily: "Syne", fontSize: 15, fontWeight: 800, margin: 0, color: "#fff" }}>{pkg.name}</h4>
                        <p style={{ fontSize: 12, color: T.muted, margin: "4px 0 0" }}>{pkg.description || "Uninterrupted platform access."}</p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: T.accentY }}>₹{pkg.price.toLocaleString("en-IN")}</div>
                        <div style={{ fontSize: 11, color: T.muted }}>/year</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: T.muted, marginBottom: 14 }}>
                      Validity: {pkg.durationDays} Days · Full Access Toggles
                    </div>
                    <Btn
                      variant="primary"
                      full
                      disabled={submitting}
                      onClick={() => {
                        handleSubscribe(pkg.id, pkg.name, pkg.price);
                      }}
                    >
                      {submitting ? "Processing..." : "Pay & Upgrade Now →"}
                    </Btn>
                  </Card>
                ))}
              </div>
            )}
            <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
              <Btn variant="ghost" onClick={() => setShowUpgradeModal(false)}>Close</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export const AdminLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);
  
  const [newDate, setNewDate] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [workingDaysData, setWorkingDaysData] = useState(null);
  const [loadingWorkingDays, setLoadingWorkingDays] = useState(false);

  useEffect(() => {
    loadLeavesAndBatches();
  }, []);

  const loadLeavesAndBatches = async () => {
    setLoading(true);
    try {
      const [leavesList, batchesList] = await Promise.all([
        getAdminLeaves().catch(() => []),
        getAllBatches().catch(() => [])
      ]);
      setLeaves(Array.isArray(leavesList) ? leavesList : []);
      setBatches(Array.isArray(batchesList) ? batchesList : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedBatch) {
      getBatchCourses(selectedBatch)
        .then(res => setCourses(Array.isArray(res) ? res : []))
        .catch(console.error);
    } else {
      setCourses([]);
      setSelectedCourse("");
      setWorkingDaysData(null);
    }
  }, [selectedBatch]);

  useEffect(() => {
    if (selectedBatch && selectedCourse) {
      setLoadingWorkingDays(true);
      getCourseWorkingDays(selectedBatch, selectedCourse)
        .then(res => setWorkingDaysData(res))
        .catch(err => {
          console.error(err);
          setWorkingDaysData(null);
        })
        .finally(() => setLoadingWorkingDays(false));
    } else {
      setWorkingDaysData(null);
    }
  }, [selectedBatch, selectedCourse]);

  const handleAddLeave = async () => {
    if (!newDate) {
      alert("Please select a date.");
      return;
    }
    const day = new Date(newDate).getDay();
    if (day === 0) {
      alert("Sunday is already a holiday. You cannot assign leave on a Sunday.");
      return;
    }
    try {
      setSaving(true);
      await createAdminLeave({ date: newDate, description: newDesc });
      alert("Leave day assigned successfully!");
      setNewDate("");
      setNewDesc("");
      loadLeavesAndBatches();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLeave = async (id) => {
    if (!window.confirm("Are you sure you want to delete this leave day?")) return;
    try {
      await deleteAdminLeave(id);
      alert("Leave day deleted successfully.");
      loadLeavesAndBatches();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  return (
    <div className="fade-up">
      <PageHeader title="Leaves & Working Days" subtitle="Manage organizational holidays and calculate course calendars" />
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }} className="lms-responsive-grid-2">
        {/* Assign Leaves Card */}
        <Card style={{ padding: 24 }}>
          <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Assign Leave Day</div>
          <Input 
            type="date" 
            label="Date *" 
            value={newDate} 
            onChange={e => setNewDate(e.target.value)} 
          />
          <Input 
            label="Description (e.g. Diwali Holiday) *" 
            value={newDesc} 
            onChange={e => setNewDesc(e.target.value)} 
            placeholder="Holiday description"
          />
          <Btn variant="primary" size="lg" full onClick={handleAddLeave} disabled={saving}>
            {saving ? "Assigning..." : "Assign Leave Day"}
          </Btn>
        </Card>

        {/* Existing Leaves List */}
        <Card style={{ padding: 24 }}>
          <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Assigned Leaves</div>
          {loading ? (
            <div style={{ textAlign: "center", color: T.muted, padding: 20 }}>Loading leaves...</div>
          ) : leaves.length === 0 ? (
            <div style={{ textAlign: "center", color: T.muted, padding: 20 }}>No leaves assigned.</div>
          ) : (
            <div style={{ maxHeight: 220, overflowY: "auto" }}>
              <Table 
                columns={["Date", "Description", "Actions"]} 
                rows={leaves.map(l => [
                  <strong>{l.date}</strong>,
                  l.description || "Holiday",
                  <Btn size="xs" variant="danger" onClick={() => handleDeleteLeave(l.id)}>🗑</Btn>
                ])}
              />
            </div>
          )}
        </Card>
      </div>

      {/* Course Working Days Calculator Card */}
      <Card style={{ padding: 24 }}>
        <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Course Working Days Calculator</div>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }} className="lms-responsive-grid-2">
          <Select 
            label="Select Batch"
            value={selectedBatch}
            onChange={e => setSelectedBatch(e.target.value)}
            options={[{ value: "", label: "-- Choose Batch --" }, ...batches.map(b => ({ value: b.id, label: `${b.name} (${b.status})` }))]}
          />
          <Select 
            label="Select Course"
            value={selectedCourse}
            onChange={e => setSelectedCourse(e.target.value)}
            options={[{ value: "", label: "-- Choose Course --" }, ...courses.map(c => ({ value: c.id, label: c.title }))]}
            disabled={!selectedBatch}
          />
        </div>

        {loadingWorkingDays ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: 24 }}>⏳</div>
            <div style={{ color: T.muted, marginTop: 10 }}>Calculating working days calendar...</div>
          </div>
        ) : workingDaysData ? (
          <div className="fade-up">
            {/* Stats Summary */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }} className="lms-responsive-grid-4">
              <div style={{ background: T.bg3, padding: 14, borderRadius: 10, textAlign: "center" }}>
                <div style={{ fontSize: 11, color: T.muted }}>Total Required Hours</div>
                <div style={{ fontFamily: "Syne", fontSize: 20, fontWeight: 800, color: T.primaryL }}>{workingDaysData.durationHoursLimit}h</div>
              </div>
              <div style={{ background: T.bg3, padding: 14, borderRadius: 10, textAlign: "center" }}>
                <div style={{ fontSize: 11, color: T.muted }}>Calculated Total Hours</div>
                <div style={{ fontFamily: "Syne", fontSize: 20, fontWeight: 800, color: T.accentG }}>{workingDaysData.totalCalculatedHours}h</div>
              </div>
              <div style={{ background: T.bg3, padding: 14, borderRadius: 10, textAlign: "center" }}>
                <div style={{ fontSize: 11, color: T.muted }}>Total Working Days</div>
                <div style={{ fontFamily: "Syne", fontSize: 20, fontWeight: 800, color: T.accentG }}>{workingDaysData.totalWorkingDays} days</div>
              </div>
              <div style={{ background: T.bg3, padding: 14, borderRadius: 10, textAlign: "center" }}>
                <div style={{ fontSize: 11, color: T.muted }}>Total Leave Days</div>
                <div style={{ fontFamily: "Syne", fontSize: 20, fontWeight: 800, color: T.accentY }}>{workingDaysData.totalLeaveDays} days</div>
              </div>
            </div>

            {/* Tabular Calendar View */}
            <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Calendar Progression Table</div>
            <Table 
              columns={["#", "Date", "Day of Week", "Status", "Duration / Reason", "Accumulated Hours"]}
              rows={workingDaysData.schedule.map((row, idx) => [
                idx + 1,
                <strong>{row.date}</strong>,
                row.dayOfWeek,
                <Badge type={row.status === "WORKING" ? "success" : "warning"}>{row.status}</Badge>,
                row.reason + (row.hours > 0 ? ` (${row.hours}h)` : ""),
                `${row.accumulatedHours}h`
              ])}
            />
          </div>
        ) : (
          selectedBatch && selectedCourse && (
            <div style={{ textAlign: "center", color: T.muted, padding: 20 }}>
              No scheduled classes found in timetable for this course/batch. Please schedule timetable slots first.
            </div>
          )
        )}
      </Card>
    </div>
  );
};

// ─── ADMIN PAGES WRAPPER ──────────────────────────────────────────────────────
const ADMIN_PAGES = {
  overview:       { comp: AdminOverview       },
  profile:        { comp: AdminProfile        },
  subscription:   { comp: AdminSubscription   },
  departments:    { comp: AdminDepartments    },
  users:          { comp: AdminUsers          },
  courses:        { comp: AdminCourses        },
  batches:        { comp: AdminBatches        },
  leaves:         { comp: AdminLeaves         },
  timetable:      { comp: AdminTimetable      },
  fees:           { comp: AdminFees           },
  payments:       { comp: AdminPayments       },
  revenue:        { comp: AdminRevenue        },
  staff:          { comp: AdminStaff          },
  certifications: { comp: AdminCertifications },
  queries:        { comp: AdminQueries        },
  notifications:  { comp: AdminNotifications  },
  announcements:  { comp: AdminAnnouncements  },
  meetings:       { comp: AdminMeetings       },
  enrollments:    { comp: AdminEnrollments    },
  ratings:        { comp: AdminTeacherRatings },
};

const AdminDashboard = ({ onLogout }) => {
  const [page, setPage] = useState("overview");
  const [showSubscriptionAlert, setShowSubscriptionAlert] = useState(false);
  const [expiringSub, setExpiringSub] = useState(null);

  useEffect(() => {
    const checkSub = async () => {
      const authData = JSON.parse(localStorage.getItem("zenelait-auth") || "{}");
      if (authData.superAdmin === true) {
        try {
          const sub = await adminGetActiveSubscription();
          if (sub && sub.status === "ACTIVE") {
            const diff = new Date(sub.endDate) - new Date();
            const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
            if (daysLeft <= 1) {
              setExpiringSub(sub);
              setShowSubscriptionAlert(true);
            }
          }
        } catch (err) {
          console.error("Error checking subscription on load", err);
        }
      }
    };
    checkSub();
  }, []);

  useEffect(() => {
    const authData = JSON.parse(localStorage.getItem("zenelait-auth") || "{}");
    const isSuperAdmin = authData.superAdmin === true;
    if (page === "revenue" && !isSuperAdmin) {
      setPage("overview");
      return;
    }

    const requiredFeatures = {
      timetable: "TIMETABLE",
      fees: "FEES",
      payments: "FEES",
      revenue: "FEES",
      certifications: "CERTIFICATES",
      meetings: "MEETINGS"
    };
    const req = requiredFeatures[page];
    if (req) {
      try {
        const raw = localStorage.getItem("zenelait-features");
        const enabled = raw ? JSON.parse(raw) : [];
        if (!enabled.includes(req)) {
          setPage("overview");
        }
      } catch {
        setPage("overview");
      }
    }
  }, [page]);

  const { comp: Comp } = ADMIN_PAGES[page] || ADMIN_PAGES.overview;
  return (
    <DashLayout role="admin" page={page} onNav={setPage} onLogout={onLogout}>
      <Comp onNav={setPage} />

      {showSubscriptionAlert && expiringSub && (
        <Modal open={true} onClose={() => setShowSubscriptionAlert(false)} title="⚠️ Subscription Expiration Alert">
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
            <h3 style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 16, color: T.accentR, marginBottom: 12 }}>
              YOUR SUBSCRIPTION EXPIRES TOMORROW!
            </h3>
            <p style={{ fontSize: 13, color: T.text, lineHeight: 1.5, marginBottom: 20 }}>
              The subscription plan <strong>{expiringSub.subscriptionPackage?.name}</strong> for your organization will expire tomorrow. Please renew immediately to prevent disruption of services.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn variant="primary" full onClick={() => { setShowSubscriptionAlert(false); setPage("subscription"); }}>
                Renew Plan Now →
              </Btn>
              <Btn variant="ghost" onClick={() => setShowSubscriptionAlert(false)}>
                Dismiss
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </DashLayout>
  );
};

export default AdminDashboard;
