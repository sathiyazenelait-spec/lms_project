import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, LineChart, Line, ScatterChart, Scatter, AreaChart, Area } from "recharts";

import { T } from "../../assets/styles/theme";
import { Btn, Card, Badge, Avatar, Input, Select, StatCard, Table, Tabs, ProgressBar, DonutChart, PageHeader, ProfileAlert, Modal, calcProfileCompletion } from "../../components/UI";
import { DashLayout } from "../../components/Layout";
import { ParentWalletDashboard } from "../../components/ParentWalletDashboard";
import { TeacherForum } from "../Forum";
import { AdminMeetings } from "../Admin";
import { useTeacherProfile } from "../../context/TeacherProfileContext";
import { useParentProfile } from "../../context/ParentProfileContext";
import {
  getTeacherProfile, updateTeacherProfile,
  getTeacherCourses, getTeacherAssignments,
  getSubmissionsForAssignment, gradeSubmission,
  markAttendance, getAttendanceForDate, downloadMonthlyAttendancePdf,
  createTeacherAnnouncement, getTeacherNotifications,
  markTeacherNotifRead, markTeacherNotifReadAll,
  getActiveDepartments, getActiveDepartmentsByOrg, getTeacherStudents, createTeacherCourse, getTeacherColleagues, getTeacherDeptStudents, getTeacherBatches, assignCourseToBatch,
  getParentProfile, updateParentProfile,
  getMyChildren, linkChild,
  getChildFees, getChildDashboardDetails,
  getParentNotifications,
  markParentNotifRead, markParentNotifReadAll,createAssignment,deleteAssignment,
  bulkExtendAssignmentDeadline, sendTaskReminder, requestResubmission,
  getTaskTemplates, createTaskTemplate, deleteTaskTemplate,
  getTeacherMaterials, uploadMaterial, toggleMaterialVisibility, deleteMaterial,
  startLiveClass, getLiveClassAttendance,
  getTeacherTimetableData, getParentTimetable,getCourseStudents,getTeacherCourseStudents,getCourseAttendance,
  searchParentsForChat, getTeacherConversations, getTeacherChatMessages, sendTeacherMessage,
  searchTeachersForChat, getParentConversations, getParentChatMessages, sendParentMessage,
  getTeacherExams, createExam, startExam, endExam, postponeExam, cancelExam,
  deleteExam, getExamResults, saveExamEvaluation, finishExamEvaluation, getTeacherPerformanceReviews, getIssuedCertificates, issueCertificate,
} from "../../api/auth";

import {
  getTeacherAssessments, createAssessment, updateAssessment, deleteAssessment,
  getAssessmentQuestions, addAssessmentQuestion, updateAssessmentQuestion, deleteAssessmentQuestion,
  getAssessmentSubmissions, gradeAssessmentAnswer, publishAssessmentResults,
  getAssignmentTemplates, createAssignmentTemplate, getBulkSubmissions,
  getChildAssessments, getQuestionBank
} from "../../api/assessment";

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

// Inject responsive CSS styles for Teacher Dashboard
const injectTeacherStyles = () => {
  if (document.getElementById("lms-teacher-styles")) return;
  const style = document.createElement("style");
  style.id = "lms-teacher-styles";
  style.textContent = `
    @media (max-width: 768px) {
      .lms-responsive-grid-4 {
        grid-template-columns: 1fr !important;
      }
      .lms-responsive-grid-3 {
        grid-template-columns: 1fr !important;
      }
      .lms-responsive-grid-2 {
        grid-template-columns: 1fr !important;
      }
      .lms-responsive-split-2-1 {
        grid-template-columns: 1fr !important;
      }
      .lms-responsive-split-1-2 {
        grid-template-columns: 1fr !important;
      }
      .hide-mobile {
        display: none !important;
      }
      .lms-cert-table th, .lms-cert-table td {
        padding: 8px 6px !important;
        font-size: 11px !important;
      }
    }
  `;
  document.head.appendChild(style);
};
try {
  injectTeacherStyles();
} catch (e) {
  console.error("Failed to inject teacher styles", e);
}

// ════════════════════════════════════════════════════════════════════════════════
// TEACHER PAGES
// ════════════════════════════════════════════════════════════════════════════════

const formatTime = (timeStr) => {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1] || "00";
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
};

export const TeacherOverview = () => {
  const [profile, setProfile] = useState(null);
  const [courses, setCourses] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [studentsCount, setStudentsCount] = useState(0);
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getTeacherProfile().catch(() => null),
      getTeacherCourses().catch(() => []),
      getTeacherPerformanceReviews().catch(() => null),
      getTeacherStudents().catch(() => []),
      getTeacherTimetableData().catch(() => []),
    ])
      .then(([p, c, perf, s, t]) => {
        if (p) setProfile(p);
        setCourses(Array.isArray(c) ? c : []);
        if (perf) setPerformance(perf?.data || perf);
        setStudentsCount(Array.isArray(s) ? s.length : 0);
        const tList = t?.data || t;
        setTimetable(Array.isArray(tList) ? tList : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const avg = performance?.averageRating != null ? Number(performance.averageRating).toFixed(1) : "0.0";
  const count = performance?.totalReviews || 0;

  // For course listing, map real courses.
  const displayedCourses = courses;

  const totalPending = courses.reduce((acc, c) => acc + (c.pending || 0), 0);

  const todayDay = new Date().toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
  const todaySchedule = timetable
    .filter(slot => slot.dayOfWeek === todayDay)
    .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));

  return (
    <div className="fade-up">
      <PageHeader 
        title="Teacher Dashboard" 
        subtitle={`Welcome, ${profile?.name || "Teacher"}! Here's your teaching overview.`} 
      />
      <div className="lms-responsive-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18, marginBottom: 24 }}>
        <StatCard icon="👨‍🎓" label="Total Students" value={loading ? "…" : String(studentsCount)} change={`Across ${courses.length} courses`} color={T.accent} />
        <StatCard icon="📚" label="Active Courses" value={loading ? "…" : String(courses.length)} change="Live schedule" color={T.primaryL} />
        <StatCard icon="📝" label="Pending Grading" value={loading ? "…" : String(totalPending)} change="Assignments to grade" color={T.accentY} />
        <StatCard icon="⭐" label="My Rating" value={loading ? "…" : `${avg} / 5`} change="By students" color={T.accentG} />
      </div>
      <div className="lms-responsive-split-2-1" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        <div>
          <Card style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 15, marginBottom: 16 }}>My Courses</div>
            {displayedCourses.length === 0 ? (
              <div style={{ padding: "24px 8px", textAlign: "center", color: T.muted, fontSize: 13 }}>
                No courses assigned yet.
              </div>
            ) : (
              displayedCourses.map((c, i) => (
                <div key={c.id || i} style={{ background: T.bg3, borderRadius: 12, padding: 16, marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 14 }}>{c.title}</div>
                      <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{c.department || "CS Department"}</div>
                    </div>
                    <Badge type="success">Active</Badge>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                    {[
                      ["Students", c.students !== undefined ? c.students : 0, T.accent],
                      ["Avg Progress", `${c.progress !== undefined ? c.progress : 0}%`, T.primaryL],
                      ["Pending", c.pending !== undefined ? c.pending : 0, T.accentY]
                    ].map(([l, v, co]) => (
                      <div key={l} style={{ background: T.card, borderRadius: 8, padding: 10, textAlign: "center" }}>
                        <div style={{ fontFamily: "Syne", fontSize: 18, fontWeight: 800, color: co }}>{v}</div>
                        <div style={{ fontSize: 11, color: T.muted }}>{l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </Card>
          <Card>
            <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Recent Submissions</div>
            <Table columns={["Student", "Assignment", "Submitted", "Action"]} rows={[
              [<div style={{ display: "flex", gap: 8, alignItems: "center" }}><Avatar name="Ananya Reddy" size={26} />Ananya R</div>, "EDA Analysis", "2 hrs ago", <Btn size="xs" variant="primary">Grade</Btn>],
              [<div style={{ display: "flex", gap: 8, alignItems: "center" }}><Avatar name="Rahul Mehta" size={26} />Rahul M</div>, "JS Quiz", "5 hrs ago", <Btn size="xs" variant="primary">Grade</Btn>],
            ]} />
          </Card>
        </div>
        <div>
          <Card style={{ marginBottom: 18 }}>
            <div style={{ fontFamily: "Syne", fontWeight: 700, marginBottom: 14 }}>Today's Schedule</div>
            {todaySchedule.length === 0 ? (
              <div style={{ padding: "30px 10px", textAlign: "center", color: T.muted, fontSize: 13 }}>
                ☕ No classes scheduled for today!
              </div>
            ) : (
              todaySchedule.map((s, idx) => {
                const colors = [T.primary, T.accent, T.accentY];
                const color = colors[idx % colors.length];
                const studentCount = s.batch?.studentCount || s.course?.studentCount || 0;
                const details = `${studentCount} student${studentCount === 1 ? "" : "s"}${s.room ? ` · Room ${s.room}` : ""}`;
                return (
                  <div key={s.id || idx} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: `1px solid rgba(45,33,96,.3)`, alignItems: "center" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: color, minWidth: 72 }}>{formatTime(s.startTime)}</div>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{s.course?.title || "Class"}</div>
                      <div style={{ fontSize: 11, color: T.muted }}>{details}</div>
                    </div>
                  </div>
                );
              })
            )}
          </Card>
          <Card>
            <div style={{ fontFamily: "Syne", fontWeight: 700, marginBottom: 14 }}>Student Ratings</div>
            <div style={{ textAlign: "center", padding: "10px 0" }}>
              <div style={{ fontFamily: "Syne", fontSize: 52, fontWeight: 900, color: T.accentY }}>
                {avg}
              </div>
              <div style={{ fontSize: 22, color: T.accentY }}>
                {"★".repeat(Math.round(avg)) + "☆".repeat(5 - Math.round(avg))}
              </div>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 6 }}>
                Based on {count} student reviews
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

// ── DYNAMIC: Profile fetches real data + department dropdown from DB ───────────
export const TeacherProfile = () => {
  const { profile, updateProfileField } = useTeacherProfile();
  const [form, setForm]           = useState(null);
  const [depts, setDepts]         = useState([]);
  const [saving, setSaving]       = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef                   = React.useRef(null);
  const initializedRef            = React.useRef(false);

  useEffect(() => {
    if (profile && !initializedRef.current) {
      initializedRef.current = true;
      setForm({
        name:          profile.name          || "",
        email:         profile.email         || "",
        phone:         profile.phone         || "",
        address:       profile.address       || "",
        department:    profile.department    || "",
        qualification: profile.qualification || "",
        gender:        profile.gender        || "",
        userId:        profile.userId        || "",
        profilePicUrl: profile.profilePicUrl || "",
      });
    }
  }, [profile]);

  useEffect(() => {
    getActiveDepartments().then(setDepts).catch(console.error);
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateTeacherProfile({
        name: form.name,
        phone: form.phone,
        address: form.address,
        department: form.department,
        qualification: form.qualification,
        gender: form.gender,
        profilePicUrl: form.profilePicUrl
      });
      updateProfileField({
        name: form.name,
        phone: form.phone,
        address: form.address,
        department: form.department,
        qualification: form.qualification,
        gender: form.gender,
        profilePicUrl: form.profilePicUrl
      });
      alert("Profile updated successfully!");
    } catch (err) {
      alert("Failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result;
      setForm(prev => ({ ...prev, profilePicUrl: dataUrl }));
      updateProfileField({ profilePicUrl: dataUrl });
      try {
        setUploading(true);
        await updateTeacherProfile({ profilePicUrl: dataUrl });
      } catch (err) {
        alert("Photo upload failed: " + err.message);
        setForm(prev => ({ ...prev, profilePicUrl: "" }));
        updateProfileField({ profilePicUrl: "" });
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleRemovePhoto = async () => {
    setForm(prev => ({ ...prev, profilePicUrl: "" }));
    updateProfileField({ profilePicUrl: "" });
    await updateTeacherProfile({ profilePicUrl: "" }).catch(console.error);
  };

  if (!form) return <div style={{ padding: 32, textAlign: "center", color: T.muted }}>Loading…</div>;

  const { pct, missing } = calcProfileCompletion("teacher", form);

  return (
    <div className="fade-up">
      <PageHeader title="My Profile" />
      <ProfileAlert pct={pct} missing={missing} onComplete={() => fileRef.current?.click()} />
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />

      <div className="lms-responsive-split-1-2" style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24 }}>
        <Card style={{ textAlign: "center", padding: 32 }}>
          <DonutChart pct={pct} color={T.accentG} label="Complete" />
          <div style={{ fontSize: 13, fontWeight: 700, color: T.accentG, marginTop: 8 }}>Profile {pct}% Complete</div>

          <div style={{ position: "relative", width: 80, margin: "16px auto 0" }}>
            {form.profilePicUrl ? (
              <div style={{ width: 80, height: 80, borderRadius: "50%", overflow: "hidden", border: `3px solid ${T.accentG}` }}>
                <img src={form.profilePicUrl} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ) : (
              <Avatar name={form.name || "T"} size={80} color={T.accentG} />
            )}
            {uploading && (
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>⏳</div>
            )}
          </div>

          <div style={{ fontFamily: "Syne", fontSize: 18, fontWeight: 800, marginTop: 12 }}>{form.name || "—"}</div>
          <div style={{ fontSize: 13, color: T.muted }}>{form.userId || "—"}</div>
          {form.department && <Badge type="success" style={{ marginTop: 6 }}>{form.department}</Badge>}

          <Btn variant="dark" size="sm" full style={{ marginTop: 16 }} disabled={uploading}
            onClick={() => fileRef.current?.click()}>
            📷 {uploading ? "Uploading…" : form.profilePicUrl ? "Change Photo" : "Upload Photo (Optional)"}
          </Btn>
          {form.profilePicUrl && !uploading && (
            <Btn variant="ghost" size="sm" full style={{ marginTop: 8 }} onClick={handleRemovePhoto}>✕ Remove Photo</Btn>
          )}
        </Card>
        <Card style={{ padding: 28 }}>
          <div style={{ fontFamily: "Syne", fontSize: 17, fontWeight: 800, marginBottom: 20 }}>Update Profile</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Input label="Full Name *"     value={form.name}          onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" />
            <Input label="Email"           value={form.email}         onChange={() => {}} style={{ opacity: 0.6, cursor: "not-allowed" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Input label="Mobile Number *" value={form.phone}         onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" />
            <Input label="Qualification *" value={form.qualification} onChange={e => setForm(f => ({ ...f, qualification: e.target.value }))} placeholder="e.g. M.Tech, PhD" />
          </div>
          <Select label="Department *" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
            options={[{ value: "", label: "-- Select Department --" }, ...depts.map(d => ({ value: d.name, label: d.name }))]} />
          <Select label="Gender" value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
            options={[{ value: "", label: "Select" }, "Male", "Female", "Other"].map(o => typeof o === "string" ? { value: o, label: o } : o)} />
          <Input label="Address *" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Street address" />
          <Btn variant="success" size="lg" onClick={handleSave} disabled={saving || uploading}>{saving ? "Saving…" : "Save Profile →"}</Btn>
        </Card>
      </div>
    </div>
  );
};

// ── DYNAMIC: Courses fetched from DB ──────────────────────────────────────────
export const TeacherCourses = () => {
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses]         = useState([]);
  const [myDept, setMyDept]           = useState(""); // logged-in teacher's own department
  const [selectedDept, setSelectedDept] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [modal, setModal]             = useState(false);
  const [saving, setSaving]           = useState(false);
  const [deptTab, setDeptTab]         = useState("courses");
  const [colleagues, setColleagues]   = useState([]);
  const [deptStudents, setDeptStudents] = useState([]);
  const [deptDataLoaded, setDeptDataLoaded] = useState(false);
  const [deptBatches, setDeptBatches]   = useState([]);
  const [form, setForm] = useState({ title: "", description: "", durationHours: "", batchId: "" });

  useEffect(() => {
    getTeacherProfile()
      .then(p => {
        setMyDept(p?.department || "");
        if (p?.organizationId) {
          Promise.all([
            getActiveDepartmentsByOrg(p.organizationId),
            getTeacherCourses()
          ])
            .then(([d, c]) => {
              setDepartments(Array.isArray(d) ? d : []);
              setCourses(Array.isArray(c) ? c : []);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
        } else {
          getTeacherCourses()
            .then(c => setCourses(Array.isArray(c) ? c : []))
            .catch(console.error)
            .finally(() => setLoading(false));
        }
      })
      .catch(console.error);
  }, []);

  // Fetch teacher's OWN department batches once — used in Create Course modal
  useEffect(() => {
    getTeacherBatches()
      .then(d => setDeptBatches(Array.isArray(d) ? d : []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedDept || deptDataLoaded) return;
    Promise.all([getTeacherColleagues(selectedDept), getTeacherDeptStudents(selectedDept)])
      .then(([col, stu]) => {
        setColleagues(Array.isArray(col) ? col : []);
        setDeptStudents(Array.isArray(stu) ? stu : []);
        setDeptDataLoaded(true);
      }).catch(console.error);
  }, [selectedDept, deptDataLoaded]);

  const reload = () => {
    getTeacherProfile()
      .then(p => {
        if (p?.organizationId) {
          Promise.all([
            getActiveDepartmentsByOrg(p.organizationId),
            getTeacherCourses()
          ])
            .then(([d, c]) => {
              setDepartments(Array.isArray(d) ? d : []);
              setCourses(Array.isArray(c) ? c : []);
            })
            .catch(console.error);
        } else {
          getTeacherCourses()
            .then(c => setCourses(Array.isArray(c) ? c : []))
            .catch(console.error);
        }
      })
      .catch(console.error);
  };

  const openDept = (name) => { setSelectedDept(name); setDeptTab("courses"); setDeptDataLoaded(false); };

  const handleCreateCourse = async () => {
    if (!form.title.trim()) { alert("Course title is required."); return; }
    if (!selectedDept)      { alert("No department selected."); return; }
    if (!form.batchId)      { alert("Please select a batch — students are enrolled through batches."); return; }
    try {
      setSaving(true);
      const result = await createTeacherCourse({
        title:        form.title,
        description:  form.description,
        durationHours: form.durationHours ? Number(form.durationHours) : 0,
        batchId:      Number(form.batchId),
      });
      showEmailWarnings(result?.emailWarnings);
      setModal(false);
      setForm({ title: "", description: "", durationHours: "", batchId: "" });
      reload();
      setDeptDataLoaded(false);
    } catch (err) { alert("Error: " + err.message); }
    finally { setSaving(false); }
  };

  const deptCourses = selectedDept ? courses.filter(c => c.department === selectedDept) : [];
  const statusColor = { ACTIVE: T.accentG, DRAFT: T.accentY, INACTIVE: T.muted, COMPLETED: T.muted };
  // Own dept = full edit access; other depts = read-only
  const isOwnDept = selectedDept && myDept && selectedDept === myDept;

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: T.muted }}>Loading...</div>;

  // --- Department list view ---
  if (!selectedDept) return (
    <div className="fade-up">
      <PageHeader title="My Courses" subtitle="Select a department to view your assigned courses" />
      {departments.length === 0 ? (
        <Card><div style={{ padding: 40, textAlign: "center", color: T.muted }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🏢</div>
          <div style={{ fontFamily: "Syne", fontWeight: 700 }}>No departments available</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>Ask your admin to create departments first.</div>
        </div></Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
          {departments.map(dept => {
            const count = courses.filter(c => c.department === dept.name).length;
            return (
              <Card key={dept.id} style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ height: 5, background: "linear-gradient(90deg," + T.primary + "," + T.accent + ")" }} />
                <div style={{ padding: 22 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14,
                      background: "linear-gradient(135deg," + T.primary + "30," + T.accent + "20)",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>
                      🏢
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 16 }}>{dept.name}</div>
                        {dept.name === myDept && (
                          <span style={{ fontSize: 10, background: T.accentG + "20", color: T.accentG,
                            borderRadius: 50, padding: "2px 8px", fontWeight: 700 }}>✏️ Your Dept</span>
                        )}
                      </div>
                      {dept.description && <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{dept.description}</div>}
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                    <div style={{ background: T.bg3, borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: count > 0 ? T.accentG : T.muted }}>{count}</div>
                      <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>Assigned Courses</div>
                    </div>
                    <div style={{ background: T.bg3, borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                      <div style={{ fontSize: 22 }}>{dept.active ? "✅" : "⏸"}</div>
                      <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{dept.active ? "Active" : "Inactive"}</div>
                    </div>
                  </div>
                  <Btn variant="primary" full onClick={() => openDept(dept.name)}>Open Department →</Btn>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );

  // --- Department inner view with tabs ---
  return (
    <div className="fade-up">
      <PageHeader title={selectedDept}
        subtitle={isOwnDept ? "Your Department — Full Access" : "Read-Only View"}
        actions={[<Btn size="sm" variant="ghost" onClick={() => { setSelectedDept(null); setDeptDataLoaded(false); }}>← All Departments</Btn>]} />

      {/* Read-only notice for other depts */}
      {!isOwnDept && (
        <div style={{ background: T.accentY + "15", border: "1px solid " + T.accentY + "40",
          borderRadius: 10, padding: "10px 16px", marginBottom: 16, fontSize: 13,
          display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>👁</span>
          <span>You are viewing <strong>{selectedDept}</strong> in read-only mode.
          Switch to <strong>{myDept || "your department"}</strong> to add courses and mark attendance.</span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
        {[
          { key: "courses",    label: "📚 Courses (" + deptCourses.length + ")" },
          { key: "students",   label: "👥 Students (" + deptStudents.length + ")" },
          { key: "colleagues", label: "🎓 Colleagues (" + colleagues.length + ")" },
          // Attendance tab only for own department
          ...(isOwnDept ? [{ key: "attendance", label: "✅ Attendance" }] : []),
        ].map(t => (
          <button key={t.key} onClick={() => setDeptTab(t.key)}
            style={{ padding: "8px 20px", borderRadius: 50,
              border: "1.5px solid " + (deptTab === t.key ? T.primary : T.border),
              background: deptTab === t.key ? T.primary + "20" : "transparent",
              color: deptTab === t.key ? T.primary : T.muted,
              fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{t.label}</button>
        ))}
        {/* Add Course button only for own department */}
        {deptTab === "courses" && isOwnDept && (
          <Btn variant="primary" style={{ marginLeft: "auto" }} onClick={() => setModal(true)}>+ Add Course</Btn>
        )}
      </div>

      {/* COURSES TAB */}
      {deptTab === "courses" && (deptCourses.length === 0 ? (
        <Card><div style={{ padding: 40, textAlign: "center", color: T.muted }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
          <div style={{ fontFamily: "Syne", fontWeight: 700 }}>No courses assigned in {selectedDept} yet</div>
          {isOwnDept ? (
            <>
              <div style={{ fontSize: 13, marginTop: 6, marginBottom: 16 }}>Ask your admin to assign a course, or create one.</div>
              <Btn variant="primary" onClick={() => setModal(true)}>+ Create Course</Btn>
            </>
          ) : (
            <div style={{ fontSize: 13, marginTop: 6 }}>No courses have been created in this department yet.</div>
          )}
        </div></Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 18 }}>
          {deptCourses.map(c => (
            <Card key={c.id} style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ height: 5, background: "linear-gradient(90deg," + (statusColor[c.status] || T.primary) + "," + T.accent + ")" }} />
              <div style={{ padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 15,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📚 {c.title}</div>
                    <div style={{ fontSize: 12, color: T.muted, marginTop: 3 }}>⏱ {c.durationHours || 0}h</div>
                  </div>
                  <span style={{ fontSize: 11, background: (statusColor[c.status] || T.primary) + "18",
                    color: statusColor[c.status] || T.primary, borderRadius: 50,
                    padding: "3px 10px", fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>
                    {c.status || "DRAFT"}
                  </span>
                </div>
                {c.description && (
                  <div style={{ fontSize: 12, color: T.muted, marginBottom: 12, overflow: "hidden",
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                    {c.description}
                  </div>
                )}
                {isOwnDept ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <Btn size="xs" variant="primary" full
                      onClick={() => window.dispatchEvent(new CustomEvent("teacher-nav", { detail: "liveclasses" }))}>
                      📤 Upload Material
                    </Btn>
                    <Btn size="xs" variant="ghost" full
                      onClick={() => window.dispatchEvent(new CustomEvent("teacher-nav", { detail: "grading" }))}>
                      📝 Grading
                    </Btn>
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: T.muted, textAlign: "center",
                    background: T.bg3, borderRadius: 8, padding: "6px 0" }}>
                    👁 Read-only
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      ))}

      {/* STUDENTS TAB */}
      {deptTab === "students" && (deptStudents.length === 0 ? (
        <Card><div style={{ padding: 40, textAlign: "center", color: T.muted }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
          <div style={{ fontFamily: "Syne", fontWeight: 700 }}>No students in {selectedDept} yet</div>
        </div></Card>
      ) : (
        <div>
          <div style={{ fontSize: 12, color: T.muted, marginBottom: 14 }}>
            {deptStudents.length} student{deptStudents.length !== 1 ? "s" : ""} enrolled in {selectedDept}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
            {deptStudents.map(s => (
              <Card key={s.id} style={{ padding: 16 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ width: 42, height: 42, borderRadius: "50%",
                    background: "linear-gradient(135deg," + T.primary + "," + T.accent + ")",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                    {s.name?.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{s.userId}</div>
                    <div style={{ fontSize: 11, color: T.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.email}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* COLLEAGUES TAB */}
      {deptTab === "colleagues" && (colleagues.length === 0 ? (
        <Card><div style={{ padding: 40, textAlign: "center", color: T.muted }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>👨‍🏫</div>
          <div style={{ fontFamily: "Syne", fontWeight: 700 }}>No other teachers in {selectedDept} yet</div>
        </div></Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
          {colleagues.map(t => (
            <Card key={t.id} style={{ padding: 16 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 42, height: 42, borderRadius: "50%",
                  background: "linear-gradient(135deg," + T.accent + "," + T.primaryL + ")",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                  {t.name?.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{t.userId}</div>
                  <div style={{ fontSize: 11, color: T.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.email}</div>
                </div>
                <span style={{ fontSize: 10, background: (t.active ? T.accentG : T.muted) + "18",
                  color: t.active ? T.accentG : T.muted, borderRadius: 50, padding: "2px 8px", fontWeight: 700, flexShrink: 0 }}>
                  {t.active ? "Active" : "Inactive"}
                </span>
              </div>
            </Card>
          ))}
        </div>
      ))}

      {/* ATTENDANCE TAB */}
      {deptTab === "attendance" && (
        <Card>
          <div style={{ padding: 40, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Mark Attendance</div>
            <div style={{ fontSize: 13, color: T.muted, marginBottom: 24 }}>
              Select a course and date to mark attendance for your {selectedDept} students.
            </div>
            <Btn variant="primary" size="lg"
              onClick={() => window.dispatchEvent(new CustomEvent("teacher-nav", { detail: "attendance" }))}>
              Open Attendance Page →
            </Btn>
          </div>
        </Card>
      )}

      {/* Create Course Modal — only for own department */}
      {isOwnDept && <Modal open={modal}
        onClose={() => { setModal(false); setForm({ title: "", description: "", durationHours: "", batchId: "" }); }}
        title={"Create Course in " + selectedDept}>
        <div style={{ background: T.primary + "10", border: "1px solid " + T.primary + "30",
          borderRadius: 8, padding: "8px 14px", marginBottom: 14, fontSize: 12 }}>
          🏢 Department: <strong>{selectedDept}</strong>
          <span style={{ marginLeft: 10, color: T.muted }}>
            · Batches shown are from <strong>your department ({myDept})</strong> only
          </span>
        </div>

        {/* Batch selector — only teacher's own dept batches */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase",
            letterSpacing: 1, display: "block", marginBottom: 6 }}>
            Assign to Batch * <span style={{ fontWeight: 400, textTransform: "none", color: T.accentG }}>(your {myDept} batches only)</span>
          </label>
          <select value={form.batchId} onChange={e => setForm(f => ({ ...f, batchId: e.target.value }))}
            style={{ width: "100%", background: T.bg3, border: "1.5px solid " + (form.batchId ? T.accentG : T.border),
              borderRadius: 9, padding: "10px 14px", fontSize: 13, color: T.text,
              outline: "none", boxSizing: "border-box" }}>
            <option value="">-- Select Batch --</option>
            {deptBatches.map(b => (
              <option key={b.id} value={String(b.id)}>
                {b.name} · {b.status} · {b.studentCount} students
                {b.course ? " (has: " + b.course.title + ")" : " (no course yet)"}
              </option>
            ))}
          </select>
          {deptBatches.length === 0 && (
            <div style={{ fontSize: 11, color: T.accentY, marginTop: 6 }}>
              ⚠️ No batches found in your department ({myDept}). Ask admin to create a batch first.
            </div>
          )}
          {form.batchId && (() => {
            const b = deptBatches.find(x => String(x.id) === form.batchId);
            if (!b) return null;
            return (
              <div style={{ marginTop: 8, background: T.accentG + "10", border: "1px solid " + T.accentG + "30",
                borderRadius: 8, padding: "8px 12px", fontSize: 12 }}>
                ✅ <strong>{b.studentCount} students</strong> in this batch will see the course
                {b.course && <span style={{ color: T.accentY }}> · ⚠️ Replaces: {b.course.title}</span>}
              </div>
            );
          })()}
        </div>

        <Input label="Course Title *" placeholder="e.g. Python Fundamentals"
          value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        <Input label="Duration (hours)" type="number" placeholder="e.g. 40"
          value={form.durationHours} onChange={e => setForm(f => ({ ...f, durationHours: e.target.value }))} />
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase",
            letterSpacing: 1, display: "block", marginBottom: 6 }}>Description</label>
          <textarea rows={3} value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="What will students learn..."
            style={{ width: "100%", background: T.bg3, border: "1.5px solid " + T.border,
              borderRadius: 9, padding: "10px 14px", fontSize: 13, color: T.text,
              outline: "none", resize: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
        </div>
        <Btn variant="primary" full size="lg" onClick={handleCreateCourse} disabled={saving || !form.batchId}>
          {saving ? "Creating..." : "Create & Assign to Batch →"}
        </Btn>
      </Modal>}
    </div>
  );
};

export const TeacherLiveClasses = () => {
  const [courses, setCourses]       = useState([]);
  const [selected, setSelected]     = useState(null);
  const [materials, setMaterials]   = useState([]);
  const [tab, setTab]               = useState("ALL");
  const [modal, setModal]           = useState(false);
  const [saving, setSaving]         = useState(false);
  const [loading, setLoading]       = useState(false);
  const [fileInfo, setFileInfo]     = useState(null); // { name, size, base64, mimeType }
  const fileRef                     = React.useRef();
  const [attendanceModal, setAttendanceModal] = useState(null);
  const [attendanceData, setAttendanceData]   = useState(null);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [form, setForm] = useState({
    type: "NOTE", title: "", description: "", content: "", scheduledAt: "",
    joinType: "EXTERNAL", platformType: "MEET"
  });

  useEffect(() => {
    getTeacherCourses()
      .then(d => setCourses(Array.isArray(d) ? d : []))
      .catch(console.error);
  }, []);

  const loadMaterials = (course) => {
    setLoading(true);
    getTeacherMaterials(course.id)
      .then(d => setMaterials(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const openCourse = (course) => {
    setSelected(course);
    setTab("ALL");
    loadMaterials(course);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const maxMB = 50;
    if (file.size > maxMB * 1024 * 1024) {
      alert(`File too large. Maximum size is ${maxMB}MB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFileInfo({ name: file.name, size: file.size, base64: reader.result, mimeType: file.type });
      setForm(f => ({ ...f, content: reader.result }));
      // Auto-fill title from filename if empty
      setForm(f => ({ ...f, content: reader.result, title: f.title || file.name.replace(/\.[^/.]+$/, "") }));
    };
    reader.readAsDataURL(file);
  };

  const resetModal = () => {
    setModal(false);
    setForm({ type: "NOTE", title: "", description: "", content: "", scheduledAt: "", joinType: "EXTERNAL", platformType: "MEET" });
    setFileInfo(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const openAttendance = async (material) => {
    setAttendanceModal(material);
    setLoadingAttendance(true);
    setAttendanceData(null);
    try {
      const data = await getLiveClassAttendance(material.id);
      setAttendanceData(data);
    } catch (err) {
      alert("Failed to fetch attendance: " + err.message);
    } finally {
      setLoadingAttendance(false);
    }
  };

  const handleUpload = async () => {
    if (!form.title.trim()) { alert("Title is required."); return; }
    if (form.type === "NOTE" && !form.content) { alert("Please select a document to upload."); return; }
    if (form.type !== "NOTE" && !form.content.trim()) { alert("Content / URL is required."); return; }
    try {
      setSaving(true);
      const result = await uploadMaterial({ ...form, courseId: selected.id });
      showEmailWarnings(result?.emailWarnings);
      resetModal();
      loadMaterials(selected);
    } catch (err) { alert("Error: " + err.message); }
    finally { setSaving(false); }
  };

  const handleToggle = async (id) => {
    await toggleMaterialVisibility(id).catch(console.error);
    loadMaterials(selected);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this material?")) return;
    await deleteMaterial(id).catch(console.error);
    loadMaterials(selected);
  };

  const typeIcon  = { NOTE: "📝", VIDEO: "🎥", LIVE: "🔗" };
  const typeColor = { NOTE: T.accent, VIDEO: T.primaryL, LIVE: T.accentG };
  const typeLabel = { NOTE: "Written Note", VIDEO: "Video", LIVE: "Live Class Link" };

  const filtered = tab === "ALL" ? materials : materials.filter(m =>
    tab === "LIVE" ? m.type === "MEET_LINK" : m.type === tab
  );

  // ── Course list view ───────────────────────────────────────────────────────
  if (!selected) return (
    <div className="fade-up">
      <PageHeader title="Learning Board" subtitle="Select a course to manage its materials" />
      {courses.length === 0 ? (
        <Card><div style={{ padding: 40, textAlign: "center", color: T.muted }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
          <div style={{ fontFamily: "Syne", fontWeight: 700 }}>No courses assigned yet.</div>
        </div></Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 18 }}>
          {courses.map(c => (
            <Card key={c.id} style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ height: 5, background: `linear-gradient(90deg, ${T.primary}, ${T.accent})` }} />
              <div style={{ padding: 20 }}>
                <div style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 15, marginBottom: 6 }}>{c.title}</div>
                <div style={{ fontSize: 12, color: T.muted, marginBottom: 12 }}>
                  🏢 {c.department || "—"} · ⏱ {c.durationHours || 0}h
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {["📝 Notes", "🎥 Videos", "🔗 Live"].map(lbl => (
                    <span key={lbl} style={{ fontSize: 11, background: T.bg3, borderRadius: 6,
                      padding: "3px 8px", color: T.muted }}>{lbl}</span>
                  ))}
                </div>
                <Btn size="xs" variant="primary" full style={{ marginTop: 12 }} onClick={() => openCourse(c)}>
                  Open Course Board →
                </Btn>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // ── Course board view ──────────────────────────────────────────────────────
  return (
    <div className="fade-up">
      <PageHeader
        title={selected.title}
        subtitle="Learning Board — manage notes, videos & live class links"
        actions={[
          <Btn size="sm" variant="ghost" onClick={() => setSelected(null)}>← All Courses</Btn>,
          <Btn variant="primary" onClick={() => setModal(true)}>+ Upload Material</Btn>,
        ]}
      />

      {/* Tab filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { key: "ALL",   label: `All (${materials.length})` },
          { key: "NOTE",  label: `📝 Notes (${materials.filter(m => m.type === "NOTE").length})` },
          { key: "VIDEO", label: `🎥 Videos (${materials.filter(m => m.type === "VIDEO").length})` },
          { key: "LIVE",  label: `🔗 Live Classes (${materials.filter(m => m.type === "MEET_LINK").length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding: "7px 16px", borderRadius: 50,
              border: `1.5px solid ${tab === t.key ? T.primary : T.border}`,
              background: tab === t.key ? `${T.primary}20` : "transparent",
              color: tab === t.key ? T.primary : T.muted,
              fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Materials */}
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: T.muted }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <Card><div style={{ padding: 32, textAlign: "center", color: T.muted }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
          <div>No {tab === "ALL" ? "materials" : tab.toLowerCase() + "s"} uploaded yet.</div>
          <Btn size="sm" variant="primary" style={{ marginTop: 12 }} onClick={() => { setForm(f => ({ ...f, type: tab === "LIVE" ? "MEET_LINK" : tab === "ALL" ? "NOTE" : tab })); setModal(true); }}>
            + Upload Now
          </Btn>
        </div></Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {filtered.map(m => {
            const displayType = m.type === "MEET_LINK" ? "LIVE" : m.type;
            return (
              <Card key={m.id} style={{ padding: 0, overflow: "hidden", opacity: m.visible ? 1 : 0.55 }}>
                <div style={{ height: 4, background: `linear-gradient(90deg, ${typeColor[displayType]}, ${T.primary})` }} />
                <div style={{ padding: 16 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${typeColor[displayType]}20`,
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                      {typeIcon[displayType]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 14, fontFamily: "Syne",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.title}</div>
                      <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{new Date(m.createdAt).toLocaleDateString("en-IN")}</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end", flexShrink: 0 }}>
                      <Badge type={displayType === "NOTE" ? "info" : displayType === "VIDEO" ? "warning" : "success"}>
                        {displayType === "NOTE" ? "📝 Note" : displayType === "VIDEO" ? "🎥 Video" : "🔗 Live"}
                      </Badge>
                      {!m.visible && <Badge type="warning">Hidden</Badge>}
                    </div>
                  </div>

                  {m.description && <div style={{ fontSize: 12, color: T.muted, marginBottom: 8 }}>{m.description}</div>}

                  {m.type === "NOTE" && (() => {
                    // Detect if content is a base64 file or plain text
                    const isFile = m.content?.startsWith("data:");
                    if (isFile) {
                      const mimeMatch = m.content.match(/^data:([^;]+);/);
                      const mime = mimeMatch?.[1] || "";
                      const ext = mime.includes("pdf") ? "pdf" : mime.includes("word") ? "docx" :
                                  mime.includes("sheet") ? "xlsx" : mime.includes("presentation") ? "pptx" : "txt";
                      const icon = mime.includes("pdf") ? "📕" : mime.includes("word") ? "📘" :
                                   mime.includes("sheet") ? "📗" : mime.includes("presentation") ? "📙" : "📄";
                      return (
                        <div style={{ background: `${T.accent}10`, border: `1px solid ${T.accent}30`,
                          borderRadius: 8, padding: "10px 12px", display: "flex", alignItems: "center",
                          gap: 10, marginBottom: 8 }}>
                          <span style={{ fontSize: 24 }}>{icon}</span>
                          <div style={{ flex: 1, fontSize: 12, color: T.muted }}>Document · {ext.toUpperCase()}</div>
                          <a href={m.content} download={`${m.title}.${ext}`}
                            style={{ fontSize: 11, background: T.accent, color: "#fff",
                              borderRadius: 6, padding: "4px 10px", textDecoration: "none", fontWeight: 700 }}>
                            ⬇ Download
                          </a>
                        </div>
                      );
                    }
                    return (
                      <div style={{ background: T.bg3, borderRadius: 8, padding: "8px 12px", fontSize: 12,
                        maxHeight: 70, overflow: "hidden", whiteSpace: "pre-wrap", color: T.text, marginBottom: 8 }}>
                        {m.content?.substring(0, 150)}{m.content?.length > 150 ? "…" : ""}
                      </div>
                    );
                  })()}
                  {m.type === "VIDEO" && (
                    <a href={m.content} target="_blank" rel="noreferrer"
                      style={{ display: "flex", alignItems: "center", gap: 8, background: T.bg3,
                        borderRadius: 8, padding: "8px 12px", fontSize: 12, color: T.primaryL,
                        textDecoration: "none", marginBottom: 8 }}>
                      <span style={{ flexShrink: 0 }}>🎥</span>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {m.content}
                      </span>
                    </a>
                  )}
                  {m.type === "MEET_LINK" && (
                    <div style={{ background: `${T.accentG}10`, border: `1px solid ${T.accentG}30`,
                      borderRadius: 8, padding: "10px 12px", marginBottom: 8 }}>
                      {m.scheduledAt && (
                        <div style={{ fontSize: 11, color: T.muted, marginBottom: 6 }}>
                          📅 {new Date(m.scheduledAt).toLocaleString("en-IN", {
                            weekday: "short", day: "numeric", month: "short",
                            hour: "2-digit", minute: "2-digit" })}
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: T.muted, marginBottom: 6 }}>
                        ⚙️ Mode: <strong>{m.joinType === "EMBEDDED" ? "Embedded Iframe" : "External Link"}</strong>
                        {m.platformType && ` | Platform: ${m.platformType}`}
                      </div>
                      {m.meetingStarted && m.meetingStartedAt && (
                        <div style={{ fontSize: 11, color: T.accentG, fontWeight: 700, marginBottom: 6 }}>
                          🟢 Class started at {new Date(m.meetingStartedAt).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                      <a href={m.content} target="_blank" rel="noreferrer"
                        style={{ display: "flex", alignItems: "center", gap: 6,
                          fontSize: 12, color: T.accentG, fontWeight: 700, textDecoration: "none" }}>
                        <span style={{ flexShrink: 0 }}>🔗</span>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {m.content}
                        </span>
                      </a>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Btn size="xs" variant="ghost" onClick={() => handleToggle(m.id)}>
                      {m.visible ? "🙈 Hide" : "👁 Show"}
                    </Btn>
                    {m.type === "MEET_LINK" && (
                      <>
                        <Btn size="xs" variant="primary" onClick={async () => {
                          try {
                            await startLiveClass(m.id);
                            alert("Live class started successfully! Notifications have been sent to enrolled students.");
                            loadMaterials(selected);
                          } catch (err) {
                            alert("Failed to start live class: " + err.message);
                          }
                        }}>
                          🚀 {m.meetingStarted ? "Restart Class" : "Start Class"}
                        </Btn>
                        <Btn size="xs" variant="secondary" onClick={() => openAttendance(m)}>
                          📊 Attendance
                        </Btn>
                      </>
                    )}
                    <Btn size="xs" variant="danger" onClick={() => handleDelete(m.id)}>🗑</Btn>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      <Modal open={modal} onClose={resetModal} title={`Upload to ${selected.title}`}>
        {/* Type buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
          {(["NOTE", "VIDEO", "MEET_LINK"]).map(t => {
            const dt = t === "MEET_LINK" ? "LIVE" : t;
            return (
              <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                style={{ padding: "12px 0", borderRadius: 10,
                  border: `2px solid ${form.type === t ? typeColor[dt] : T.border}`,
                  background: form.type === t ? `${typeColor[dt]}18` : T.bg3,
                  color: form.type === t ? typeColor[dt] : T.muted,
                  fontWeight: 700, fontSize: 12, cursor: "pointer", textAlign: "center" }}>
                <div style={{ fontSize: 20 }}>{typeIcon[dt]}</div>
                {typeLabel[t]}
              </button>
            );
          })}
        </div>

        <Input label="Title *"
          placeholder={form.type === "NOTE" ? "e.g. Chapter 3 — Arrays & Loops" :
            form.type === "VIDEO" ? "e.g. Lecture 5 — Recursion" : "e.g. Week 3 Live Session"}
          value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />

        <Input label="Description (optional)"
          placeholder="Brief description for students"
          value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />

        {form.type === "NOTE" && (
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase",
              letterSpacing: 1, display: "block", marginBottom: 8 }}>Upload Document *</label>

            {/* Hidden file input */}
            <input ref={fileRef} type="file"
              accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx"
              style={{ display: "none" }}
              onChange={handleFileChange} />

            {/* Drop zone / picker */}
            {!fileInfo ? (
              <div onClick={() => fileRef.current?.click()}
                style={{ border: `2px dashed ${T.border}`, borderRadius: 12, padding: "28px 20px",
                  textAlign: "center", cursor: "pointer", background: T.bg3,
                  transition: "border-color .2s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = T.primary}
                onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📄</div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Click to select a document</div>
                <div style={{ fontSize: 12, color: T.muted }}>PDF, Word, PowerPoint, Excel, TXT · Max 50MB</div>
              </div>
            ) : (
              /* File selected — show preview */
              <div style={{ background: `${T.accentG}10`, border: `1.5px solid ${T.accentG}40`,
                borderRadius: 12, padding: "14px 16px", display: "flex", gap: 14, alignItems: "center" }}>
                <div style={{ fontSize: 32 }}>
                  {fileInfo.mimeType?.includes("pdf") ? "📕" :
                   fileInfo.mimeType?.includes("word") || fileInfo.name?.endsWith(".docx") ? "📘" :
                   fileInfo.mimeType?.includes("sheet") || fileInfo.name?.endsWith(".xlsx") ? "📗" :
                   fileInfo.mimeType?.includes("presentation") || fileInfo.name?.endsWith(".pptx") ? "📙" : "📄"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{fileInfo.name}</div>
                  <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
                    {(fileInfo.size / 1024).toFixed(1)} KB · Ready to upload
                  </div>
                </div>
                <button onClick={() => { setFileInfo(null); setForm(f => ({ ...f, content: "" })); if (fileRef.current) fileRef.current.value = ""; }}
                  style={{ background: "transparent", border: "none", cursor: "pointer", color: T.muted, fontSize: 18 }}>✕</button>
              </div>
            )}
          </div>
        )}

        {form.type === "VIDEO" && (
          <Input label="Video URL * (YouTube / Google Drive / any link)"
            placeholder="https://youtube.com/watch?v=..."
            value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
        )}

        {form.type === "MEET_LINK" && (
          <>
            <Select label="Platform"
              value={form.platformType}
              onChange={e => setForm(f => ({ ...f, platformType: e.target.value }))}
              options={[{ value: "MEET", label: "Google Meet" }, { value: "ZOOM", label: "Zoom" }, { value: "TEAMS", label: "Microsoft Teams" }, { value: "OTHER", label: "Other" }]} />
            <Select label="Join Type"
              value={form.joinType}
              onChange={e => setForm(f => ({ ...f, joinType: e.target.value }))}
              options={[{ value: "EXTERNAL", label: "External Link" }, { value: "EMBEDDED", label: "Embedded Iframe (Join in App)" }]} />
            <Input label="Meeting Link *"
              placeholder="https://meet.google.com/abc-defg-hij"
              value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
            <Input label="Scheduled Date & Time" type="datetime-local"
              value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} />
          </>
        )}

        <Btn variant="primary" full size="lg" onClick={handleUpload} disabled={saving}>
          {saving ? "Uploading…" : `Upload ${typeLabel[form.type]} →`}
        </Btn>
      </Modal>

      {/* Attendance Modal */}
      <Modal open={!!attendanceModal} onClose={() => setAttendanceModal(null)} title={`Attendance: ${attendanceModal?.title}`}>
        {loadingAttendance ? (
          <div style={{ padding: 30, textAlign: "center", color: T.muted }}>Loading attendance records...</div>
        ) : !attendanceData ? (
          <div style={{ padding: 30, textAlign: "center", color: T.muted }}>No data loaded.</div>
        ) : (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
              <Card style={{ padding: 12, textAlign: "center", background: T.bg3 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: T.primary }}>{attendanceData.totalEnrolled}</div>
                <div style={{ fontSize: 10, color: T.muted, textTransform: "uppercase" }}>Enrolled</div>
              </Card>
              <Card style={{ padding: 12, textAlign: "center", background: `${T.accentG}10` }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: T.accentG }}>{attendanceData.attendedCount}</div>
                <div style={{ fontSize: 10, color: T.muted, textTransform: "uppercase" }}>Attended</div>
              </Card>
              <Card style={{ padding: 12, textAlign: "center", background: `${T.danger}10` }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: T.danger }}>{attendanceData.missedCount}</div>
                <div style={{ fontSize: 10, color: T.muted, textTransform: "uppercase" }}>Missed</div>
              </Card>
            </div>

            <div style={{ maxHeight: 300, overflowY: "auto", border: `1px solid ${T.border}`, borderRadius: 8 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: T.bg3, borderBottom: `1px solid ${T.border}`, textAlign: "left" }}>
                    <th style={{ padding: 10 }}>Student</th>
                    <th style={{ padding: 10 }}>Email</th>
                    <th style={{ padding: 10 }}>Status</th>
                    <th style={{ padding: 10 }}>Joined At</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceData.students?.map(s => (
                    <tr key={s.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: 10, fontWeight: 600 }}>{s.name} ({s.userId})</td>
                      <td style={{ padding: 10, color: T.muted }}>{s.email}</td>
                      <td style={{ padding: 10 }}>
                        <Badge type={s.attended ? "success" : "danger"}>
                          {s.attended ? "Attended" : "Missed"}
                        </Badge>
                      </td>
                      <td style={{ padding: 10, color: T.muted }}>
                        {s.joinedAt ? new Date(s.joinedAt).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' }) : "—"}
                      </td>
                    </tr>
                  ))}
                  {(!attendanceData.students || attendanceData.students.length === 0) && (
                    <tr>
                      <td colSpan="4" style={{ padding: 20, textAlign: "center", color: T.muted }}>No enrolled students in this course.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
export const TeacherAttendanceMonthlyReport = ({
  courseId, setCourseId, courses, students, allAttendance, selectedMonth, setSelectedMonth
}) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!courseId) {
      alert("Please select a course first.");
      return;
    }
    try {
      setDownloading(true);
      await downloadMonthlyAttendancePdf(courseId, selectedMonth);
    } catch (err) {
      alert("Failed to download PDF: " + err.message);
    } finally {
      setDownloading(false);
    }
  };

  const monthRecords = allAttendance.filter(a => a.date && a.date.startsWith(selectedMonth));

  return (
    <div className="fade-up">
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 16 }}>
            Monthly Attendance Report Filters
          </div>
          {courseId && (
            <Btn variant="primary" onClick={handleDownload} disabled={downloading}>
              {downloading ? "Generating PDF..." : "📥 Download PDF Report"}
            </Btn>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Select
            label="Course *"
            value={courseId}
            onChange={e => setCourseId(e.target.value)}
            options={[
              { value: "", label: "-- Select Course --" },
              ...courses.map(c => ({
                value: String(c.id),
                label: c.title
              }))
            ]}
          />

          <Input
            label="Filter Month *"
            type="month"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
          />
        </div>
      </Card>

      {!courseId ? (
        <Card style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: T.text, marginBottom: 6 }}>No Course Selected</div>
          <div style={{ color: T.muted, fontSize: 13 }}>Please select a course above to view the monthly report.</div>
        </Card>
      ) : students.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>👥</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: T.text, marginBottom: 6 }}>No Students Enrolled</div>
          <div style={{ color: T.muted, fontSize: 13 }}>There are no students enrolled in this course/batch.</div>
        </Card>
      ) : (
        <Card>
          <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 15, marginBottom: 14, color: T.text }}>
            Monthly Attendance Summary Table ({selectedMonth})
          </div>
          <Table
            columns={["S.No", "Student Name", "Present Days", "Late Days", "Absent Days", "Attendance Rate"]}
            rows={students.map((s, idx) => {
              const studentRecords = monthRecords.filter(a => a.studentId === s.id);
              const total = studentRecords.length;
              const present = studentRecords.filter(a => a.status === "PRESENT").length;
              const late = studentRecords.filter(a => a.status === "LATE").length;
              const absent = studentRecords.filter(a => a.status === "ABSENT").length;
              
              const attendedCount = present + late;
              const rate = total > 0 ? Math.round((attendedCount / total) * 100) : 0;

              return [
                idx + 1,
                <strong>{s.name} ({s.userId})</strong>,
                <span style={{ color: T.accentG, fontWeight: 700 }}>{present}</span>,
                <span style={{ color: T.accentY, fontWeight: 700 }}>{late}</span>,
                <span style={{ color: T.accentR, fontWeight: 700 }}>{absent}</span>,
                <Badge type={rate >= 75 ? "success" : rate >= 50 ? "warning" : "danger"}>
                  {rate}% ({attendedCount}/{total})
                </Badge>
              ];
            })}
          />
        </Card>
      )}
    </div>
  );
};

//dynamic attendence 
export const TeacherAttendance = () => {
  const [courses, setCourses]     = useState([]);
  const [courseId, setCourseId]   = useState("");
  const [date, setDate]           = useState(new Date().toISOString().slice(0, 10));
  const [students, setStudents]   = useState([]);
  const [statusMap, setStatusMap] = useState({});
  const [saving, setSaving]       = useState(false);
  const [allAttendance, setAllAttendance] = useState([]);
  const [subTab, setSubTab]       = useState("Mark Attendance");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  // ✅ Load only courses initially
  useEffect(() => {
    getTeacherCourses()
      .then(data => setCourses(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  // ✅ Load students when course is selected
  useEffect(() => {
    if (!courseId) return;

    getTeacherCourseStudents(courseId)  // ✅ use teacher-specific API
      .then(data => {
        setStudents(Array.isArray(data) ? data : []);
        setStatusMap({});
      })
      .catch(console.error);
  }, [courseId]);

  useEffect(() => {
    if (!courseId) return;

    getCourseAttendance(courseId)
      .then(records => {
        setAllAttendance(Array.isArray(records) ? records : []);
      })
      .catch(console.error);
  }, [courseId]);

  // ✅ Load attendance for selected date + course
  useEffect(() => {
    if (!courseId || !date) return;

    getAttendanceForDate(courseId, date)
      .then(records => {
        const map = {};
        if (Array.isArray(records)) {
          records.forEach(r => {
            map[r.student?.id] = r.status;
          });
        }
        setStatusMap(map);
      })
      .catch(console.error);
  }, [courseId, date]);

  // ✅ Save attendance
  const handleSave = async () => {
    if (!courseId) {
      alert("Select a course first.");
      return;
    }

    try {
      setSaving(true);

      await markAttendance({
        courseId: Number(courseId),
        date,
        entries: students.map(s => ({
          studentId: s.id,
          status: statusMap[s.id] || "PRESENT"
        }))
      });

      alert("Attendance saved successfully!");
      // Reload overall attendance for charts
      getCourseAttendance(courseId)
        .then(records => setAllAttendance(Array.isArray(records) ? records : []))
        .catch(console.error);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ─── CALCULATE CHART DATA ───
  // 1. Pie Chart data: overall attendance distribution
  const statusCounts = { PRESENT: 0, ABSENT: 0, LATE: 0 };
  allAttendance.forEach(a => {
    if (statusCounts[a.status] !== undefined) {
      statusCounts[a.status]++;
    }
  });
  const pieData = [
    { name: "Present", value: statusCounts.PRESENT, color: T.accentG },
    { name: "Absent", value: statusCounts.ABSENT, color: T.accentR },
    { name: "Late", value: statusCounts.LATE, color: T.accentY }
  ].filter(d => d.value > 0);

  // 2. Line Chart data: daily attendance rate over time
  const dateMap = {};
  allAttendance.forEach(a => {
    if (!dateMap[a.date]) {
      dateMap[a.date] = { date: a.date, presentCount: 0, totalCount: 0 };
    }
    dateMap[a.date].totalCount++;
    if (a.status === "PRESENT" || a.status === "LATE") {
      dateMap[a.date].presentCount++;
    }
  });
  const lineData = Object.values(dateMap)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(d => ({
      date: d.date,
      rate: Math.round((d.presentCount / d.totalCount) * 100)
    }));

  // 3. Histogram: Distribution of student attendance percentage ranges
  const studentPercentages = students.map(s => {
    const studentRecords = allAttendance.filter(a => a.studentId === s.id);
    const total = studentRecords.length;
    const presentCount = studentRecords.filter(a => a.status === "PRESENT" || a.status === "LATE").length;
    return total > 0 ? Math.round((presentCount / total) * 100) : 0;
  });
  const bins = { "0-50%": 0, "50-75%": 0, "75-90%": 0, "90-100%": 0 };
  studentPercentages.forEach(pct => {
    if (pct <= 50) bins["0-50%"]++;
    else if (pct <= 75) bins["50-75%"]++;
    else if (pct <= 90) bins["75-90%"]++;
    else bins["90-100%"]++;
  });
  const histogramData = Object.keys(bins).map(bin => ({
    range: bin,
    count: bins[bin]
  }));

  // 4. Bar Chart: Individual Student Attendance Rates
  const barData = students.map(s => {
    const studentRecords = allAttendance.filter(a => a.studentId === s.id);
    const total = studentRecords.length;
    const presentCount = studentRecords.filter(a => a.status === "PRESENT" || a.status === "LATE").length;
    const pct = total > 0 ? Math.round((presentCount / total) * 100) : 0;
    return {
      name: s.name,
      percentage: pct
    };
  });

  // 5. Scatter Plot: Total Classes vs Attended Classes (to show correlation)
  const scatterData = students.map(s => {
    const studentRecords = allAttendance.filter(a => a.studentId === s.id);
    const total = studentRecords.length;
    const presentCount = studentRecords.filter(a => a.status === "PRESENT" || a.status === "LATE").length;
    return {
      total,
      attended: presentCount,
      name: s.name
    };
  });

  return (
    <div className="fade-up">
      <PageHeader title="Attendance Monitor" />

      <Tabs tabs={["Mark Attendance", "Attendance Analytics", "Monthly Report"]} active={subTab} onChange={setSubTab} />

      {subTab === "Mark Attendance" ? (
        <>
          <Card style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontFamily: "Syne", fontWeight: 700 }}>
                Mark Attendance
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <Btn
                  size="sm"
                  variant="success"
                  onClick={() => {
                    const m = {};
                    students.forEach(s => { m[s.id] = "PRESENT"; });
                    setStatusMap(m);
                  }}
                >
                  Mark All Present
                </Btn>

                <Btn
                  size="sm"
                  variant="ghost"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Saving…" : "Save Attendance"}
                </Btn>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Select
                label="Course *"
                value={courseId}
                onChange={e => setCourseId(e.target.value)}
                options={[
                  { value: "", label: "-- Select Course --" },
                  ...courses.map(c => ({
                    value: String(c.id),
                    label: c.title
                  }))
                ]}
              />

              <Input
                label="Date *"
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>
          </Card>

          <Card>
            {students.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", color: T.muted }}>
                No students found for this course.
              </div>
            ) : (
              <Table
                columns={["Student", "ID", "Status", "Overall %", "Mark"]}
                rows={students.map(s => {
                  // Filter all records for this student
                  const studentRecords = allAttendance.filter(a => a.studentId === s.id);
                  const total = studentRecords.length;
                  const presentCount = studentRecords.filter(a => a.status === "PRESENT").length;
                  const percentage = total > 0 ? Math.round((presentCount / total) * 100) : 0;

                  return [
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <Avatar name={s.name} size={28} />
                      {s.name}
                    </div>,
                    s.userId || `STU-${s.id}`,
                    <Badge
                      type={
                        statusMap[s.id] === "ABSENT"
                          ? "danger"
                          : statusMap[s.id] === "LATE"
                          ? "warning"
                          : "success"
                      }
                    >
                      {statusMap[s.id] || "Present"}
                    </Badge>,
                    `${percentage}%`, // ✅ show calculated percentage
                    <select
                      value={statusMap[s.id] || "PRESENT"}
                      onChange={e =>
                        setStatusMap(m => ({ ...m, [s.id]: e.target.value }))
                      }
                      style={{
                        background: T.bg3,
                        border: `1px solid ${T.border}`,
                        borderRadius: 6,
                        color: T.text,
                        padding: "4px 8px",
                        fontSize: 12
                      }}
                    >
                      <option value="PRESENT">Present</option>
                      <option value="ABSENT">Absent</option>
                      <option value="LATE">Late</option>
                    </select>
                  ];
                })}
              />
            )}
          </Card>
        </>
      ) : subTab === "Monthly Report" ? (
        <TeacherAttendanceMonthlyReport 
          courseId={courseId} 
          setCourseId={setCourseId} 
          courses={courses} 
          students={students} 
          allAttendance={allAttendance} 
          selectedMonth={selectedMonth} 
          setSelectedMonth={setSelectedMonth} 
        />
      ) : (
        // ─── ATTENDANCE ANALYTICS DASHBOARD ───
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {!courseId ? (
            <Card style={{ textAlign: "center", padding: 40 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: T.text, marginBottom: 6 }}>No Course Selected</div>
              <div style={{ color: T.muted, fontSize: 13 }}>Please select a course in the "Mark Attendance" tab to view analytics.</div>
            </Card>
          ) : allAttendance.length === 0 ? (
            <Card style={{ textAlign: "center", padding: 40 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📅</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: T.text, marginBottom: 6 }}>No Attendance Data</div>
              <div style={{ color: T.muted, fontSize: 13 }}>No attendance records have been registered for this course yet.</div>
            </Card>
          ) : (
            <>
              {/* Stats Cards Row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                <StatCard
                  icon="👥"
                  label="Total Students"
                  value={students.length}
                  color={T.accent}
                />
                <StatCard
                  icon="📊"
                  label="Average Attendance"
                  value={`${studentPercentages.length > 0 ? Math.round(studentPercentages.reduce((a, b) => a + b, 0) / studentPercentages.length) : 0}%`}
                  color={T.accentG}
                />
                <StatCard
                  icon="📝"
                  label="Total Classes Held"
                  value={Object.keys(dateMap).length}
                  color={T.primaryL}
                />
              </div>

              {/* Chart Grid Row 1 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {/* 1. Pie Chart */}
                <Card>
                  <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 15, marginBottom: 16, color: T.text }}>Overall Attendance Breakdown</div>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: T.bg3, borderColor: T.border, borderRadius: 8, color: T.text }} />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 11, color: T.text }} />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>

                {/* 2. Line Chart */}
                <Card>
                  <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 15, marginBottom: 16, color: T.text }}>Daily Attendance Rate Trend</div>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={lineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} opacity={0.3} />
                      <XAxis dataKey="date" stroke={T.muted} fontSize={11} />
                      <YAxis stroke={T.muted} fontSize={11} domain={[0, 100]} unit="%" />
                      <Tooltip contentStyle={{ background: T.bg3, borderColor: T.border, borderRadius: 8, color: T.text }} />
                      <Line type="monotone" dataKey="rate" stroke={T.accent} strokeWidth={3} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              </div>

              {/* Chart Grid Row 2 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {/* 3. Histogram */}
                <Card>
                  <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 15, marginBottom: 16, color: T.text }}>Student Performance Distribution (Histogram)</div>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={histogramData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} opacity={0.3} />
                      <XAxis dataKey="range" stroke={T.muted} fontSize={11} />
                      <YAxis stroke={T.muted} fontSize={11} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: T.bg3, borderColor: T.border, borderRadius: 8, color: T.text }} />
                      <Bar dataKey="count" fill={T.primaryL} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                {/* 4. Bar Chart */}
                <Card>
                  <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 15, marginBottom: 16, color: T.text }}>Student Attendance Percentages</div>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} opacity={0.3} />
                      <XAxis dataKey="name" stroke={T.muted} fontSize={10} tick={{ fill: T.text }} />
                      <YAxis stroke={T.muted} fontSize={11} domain={[0, 100]} unit="%" />
                      <Tooltip contentStyle={{ background: T.bg3, borderColor: T.border, borderRadius: 8, color: T.text }} />
                      <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                        {barData.map((entry, idx) => {
                          const color = entry.percentage >= 75 ? T.accentG : T.accentR;
                          return <Cell key={`cell-${idx}`} fill={color} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </div>

              {/* Chart Row 3 (Scatter Plot) */}
              <Card>
                <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 15, marginBottom: 16, color: T.text }}>Attended vs. Total Classes (Scatter Plot)</div>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} opacity={0.3} />
                    <XAxis type="number" dataKey="total" name="Total Classes" stroke={T.muted} fontSize={11} label={{ value: 'Total Classes', position: 'insideBottom', offset: -5, fill: T.muted }} />
                    <YAxis type="number" dataKey="attended" name="Attended Classes" stroke={T.muted} fontSize={11} label={{ value: 'Attended Classes', angle: -90, position: 'insideLeft', fill: T.muted }} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ background: T.bg3, borderColor: T.border, borderRadius: 8, color: T.text }} />
                    <Scatter name="Students" data={scatterData} fill={T.accent}>
                      {scatterData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={T.accent} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ── TEACHER GRADING — Full Exam Evaluation Dashboard ──────────────────────────
export const TeacherGrading = () => {
  const [courses, setCourses]         = useState([]);
  const [selectedCourse, setSelCourse]= useState(null);
  const [loadingCourses, setLoading]  = useState(false);
  const [innerTab, setInnerTab]       = useState("exam");

  useEffect(() => {
    setLoading(true);
    getTeacherCourses()
      .then(d => setCourses(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (!selectedCourse) {
    return (
      <div className="fade-up">
        <PageHeader title="Exam & Grading" subtitle="Select a course to manage exams, tasks and grades" />
        {loadingCourses ? (
          <Card><div style={{ textAlign:"center", padding:40, color:T.muted }}>Loading courses…</div></Card>
        ) : courses.length === 0 ? (
          <Card><div style={{ textAlign:"center", padding:40, color:T.muted }}>
            <div style={{ fontSize:40, marginBottom:10 }}>📭</div>
            <div>No courses assigned yet.</div>
          </div></Card>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:18 }}>
            {courses.map(c => (
              <Card key={c.id} hover style={{ padding:0, overflow:"hidden" }}>
                <div onClick={() => { setSelCourse(c); setInnerTab("exam"); }}
                  style={{ cursor:"pointer", display:"flex", flexDirection:"column", height:"100%" }}>
                  <div style={{ height:5, background:`linear-gradient(90deg,${T.primary},${T.accent})` }} />
                  <div style={{ padding:22, flex:1 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                      <div>
                        <div style={{ fontFamily:"Syne", fontWeight:800, fontSize:15, marginBottom:4 }}>📚 {c.title}</div>
                        <div style={{ fontSize:12, color:T.muted }}>{c.department} · {c.batchName || "—"}</div>
                      </div>
                      <span style={{ fontSize:11, background:T.primary+"18", color:T.primary,
                        borderRadius:50, padding:"3px 10px", fontWeight:700 }}>{c.status || "ACTIVE"}</span>
                    </div>
                    {c.description && (
                      <div style={{ fontSize:12, color:T.muted, marginBottom:14,
                        overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
                        {c.description}
                      </div>
                    )}
                    <Btn variant="primary" full size="sm">📝 Open Exam &amp; Grading →</Btn>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fade-up">
      {/* Top bar with Back + course info */}
      <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:22, flexWrap:"wrap" }}>
        <button onClick={() => setSelCourse(null)}
          style={{ background:T.bg3, border:`1px solid ${T.border}`, borderRadius:8, padding:"7px 14px",
            cursor:"pointer", color:T.muted, fontSize:13, display:"flex", alignItems:"center", gap:6 }}>
          ← Back to Dashboard
        </button>
        <div style={{ fontFamily:"Syne", fontWeight:800, fontSize:18 }}>📚 {selectedCourse.title}</div>
        <span style={{ fontSize:12, color:T.muted }}>· {selectedCourse.department} · {selectedCourse.batchName || ""}</span>
      </div>

      {/* Menu tabs: Exam | Assessments | Tasks | Grade */}
      <div style={{ display:"flex", gap:4, marginBottom:22, background:T.bg3, borderRadius:12,
        padding:5, width:"fit-content", border:`1px solid ${T.border}` }}>
        {[["exam","📝 Exam"],["assessment","⚡ Assessments"],["task","📋 Tasks"],["grade","⭐ Grade"]].map(([k,l]) => (
          <button key={k} onClick={() => setInnerTab(k)}
            style={{ padding:"9px 22px", borderRadius:9, fontSize:13, fontWeight:700, cursor:"pointer",
              border:"none", background: innerTab===k ? T.primary : "transparent",
              color: innerTab===k ? "#fff" : T.muted, transition:"all .2s" }}>
            {l}
          </button>
        ))}
      </div>

      {innerTab === "exam"  && <ExamSection  course={selectedCourse} />}
      {innerTab === "assessment" && <AssessmentSection course={selectedCourse} />}
      {innerTab === "task"  && <TaskSection  course={selectedCourse} />}
      {innerTab === "grade" && <GradeSection course={selectedCourse} />}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// EXAM SECTION
// ══════════════════════════════════════════════════════════════════════════════
const STATUS_ORDER = ["UPCOMING","CURRENT","POSTPONED","RESCHEDULED","EVALUATING","COMPLETED","CANCELLED"];
const STATUS_META  = {
  UPCOMING:    { icon:"📅", color:"#8B5CF6", label:"Upcoming"    },
  CURRENT:     { icon:"🚀", color:"#10B981", label:"Current"     },
  POSTPONED:   { icon:"⏸",  color:"#F59E0B", label:"Postponed"  },
  RESCHEDULED: { icon:"🔁", color:"#06B6D4", label:"Rescheduled"},
  EVALUATING:  { icon:"📊", color:"#F97316", label:"Evaluating" },
  COMPLETED:   { icon:"✅", color:"#10B981", label:"Completed"  },
  CANCELLED:   { icon:"❌", color:"#EF4444", label:"Cancelled"  },
};
const EXAM_TYPES = ["MIDTERM","FINAL","UNIT_TEST","PRACTICAL","QUIZ","OTHER"];

const ExamSection = ({ course }) => {
  const [exams, setExams]               = useState([]);
  const [loading, setLoading]           = useState(false);
  const [tab, setTab]                   = useState("UPCOMING");
  const [showCreate, setShowCreate]     = useState(false);
  const [showPostpone, setShowPostpone] = useState(null);
  const [showCancel, setShowCancel]     = useState(null);
  const [showStart, setShowStart]       = useState(null);
  const [showEvaluate, setShowEvaluate] = useState(null);
  const [timers, setTimers]             = useState({});
  const timerRef                        = React.useRef({});

  const loadExams = () => {
    setLoading(true);
    getTeacherExams(course.id)
      .then(d => setExams(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadExams();
    return () => Object.values(timerRef.current).forEach(clearInterval);
  }, [course.id]);

  const byStatus = (status) => exams.filter(e => {
    if (status === "POSTPONED")
      return e.status === "POSTPONED" && (!e.postponedTo || new Date(e.postponedTo) > new Date());
    return e.status === status;
  });

  const startLocalTimer = (exam) => {
    if (timerRef.current[exam.id]) return;
    const endTime = exam.startedAt
      ? new Date(exam.startedAt).getTime() + exam.durationMinutes * 60000
      : Date.now() + exam.durationMinutes * 60000;
    const tick = () => {
      const left = Math.max(0, Math.round((endTime - Date.now()) / 1000));
      setTimers(t => ({ ...t, [exam.id]: left }));
      if (left === 0) {
        clearInterval(timerRef.current[exam.id]);
        delete timerRef.current[exam.id];
        endExam(exam.id).then(() => loadExams()).catch(console.error);
      }
    };
    tick();
    timerRef.current[exam.id] = setInterval(tick, 1000);
  };

  useEffect(() => {
    exams.filter(e => e.status === "CURRENT").forEach(startLocalTimer);
  }, [exams]);

  const fmtTimer = (secs) => {
    if (secs == null) return "--:--";
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`
      : `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  };
  const fmtDT = (str) => str
    ? new Date(str).toLocaleString("en-IN", { dateStyle:"short", timeStyle:"short" }) : "—";

  return (
    <div>
      {/* Tab bar + Create button */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
        marginBottom:16, flexWrap:"wrap", gap:10 }}>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {STATUS_ORDER
            .filter(s => s !== "CANCELLED" || byStatus("CANCELLED").length > 0)
            .map(s => {
              const meta = STATUS_META[s]; const cnt = byStatus(s).length;
              return (
                <button key={s} onClick={() => setTab(s)}
                  style={{ padding:"7px 14px", borderRadius:20, fontSize:12, fontWeight:700,
                    cursor:"pointer", border:`1px solid ${tab===s ? meta.color : T.border}`,
                    background: tab===s ? meta.color+"18" : "transparent",
                    color: tab===s ? meta.color : T.muted }}>
                  {meta.icon} {meta.label} {cnt > 0 && `(${cnt})`}
                </button>
              );
          })}
        </div>
        <Btn variant="primary" size="sm" onClick={() => setShowCreate(true)}>+ Create Exam</Btn>
      </div>

      {loading && <Card><div style={{ padding:30, textAlign:"center", color:T.muted }}>Loading…</div></Card>}

      {!loading && byStatus(tab).length === 0 && (
        <Card><div style={{ padding:40, textAlign:"center", color:T.muted }}>
          <div style={{ fontSize:36, marginBottom:10 }}>{STATUS_META[tab]?.icon}</div>
          <div>No {STATUS_META[tab]?.label} exams.</div>
        </div></Card>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        {byStatus(tab).map(exam => (
          <ExamCard key={exam.id} exam={exam} timers={timers} fmtTimer={fmtTimer} fmtDT={fmtDT}
            onPostpone={() => setShowPostpone(exam)}
            onCancel={() => setShowCancel(exam)}
            onDelete={async () => {
              if (!window.confirm("Permanently delete this exam? Students & parents will be notified.")) return;
              await deleteExam(exam.id); loadExams();
            }}
            onStart={() => setShowStart(exam)}
            onEvaluate={() => setShowEvaluate(exam)}
            onStartRescheduled={() => setShowStart(exam)}
            onCancelRescheduled={() => setShowCancel(exam)}
          />
        ))}
      </div>

      {/* ── Modals ── */}
      {showCreate && (
        <CreateExamModal course={course} onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); loadExams(); setTab("UPCOMING"); }} />
      )}

      <Modal open={!!showPostpone} onClose={() => setShowPostpone(null)} title="Postpone Exam">
        {showPostpone && <PostponeForm exam={showPostpone}
          onSubmit={async (dt) => {
            await postponeExam(showPostpone.id, { postponedTo: dt });
            setShowPostpone(null); loadExams(); setTab("POSTPONED");
          }} />}
      </Modal>

      <Modal open={!!showCancel} onClose={() => setShowCancel(null)} title="Cancel Exam">
        {showCancel && <CancelForm exam={showCancel}
          onSubmit={async (reason) => {
            await cancelExam(showCancel.id, { reason });
            setShowCancel(null); loadExams(); setTab("CANCELLED");
          }} />}
      </Modal>

      <Modal open={!!showStart} onClose={() => setShowStart(null)} title="Start Exam Instantly">
        {showStart && <StartExamForm exam={showStart}
          onSubmit={async (qpUrl) => {
            await startExam(showStart.id, { questionPaperUrl: qpUrl || null });
            setShowStart(null); loadExams(); setTab("CURRENT");
          }} />}
      </Modal>

      {showEvaluate && (
        <EvaluateExamModal exam={showEvaluate} course={course}
          onClose={() => setShowEvaluate(null)}
          onSaved={() => {}}
          onFinished={() => { setShowEvaluate(null); loadExams(); setTab("COMPLETED"); }} />
      )}
    </div>
  );
};

// ── Single Exam Card ──────────────────────────────────────────────────────────
const ExamCard = ({ exam, timers, fmtTimer, fmtDT,
  onPostpone, onCancel, onDelete, onStart, onEvaluate,
  onStartRescheduled, onCancelRescheduled }) => {

  const meta       = STATUS_META[exam.status] || STATUS_META["UPCOMING"];
  const secsLeft   = timers[exam.id];
  const isCritical = secsLeft != null && secsLeft < 300;

  // Invited students = those NOT unrecommended
  const invitedStudents = (exam.students || []).filter(s => !s.unrecommended);

  return (
    <Card style={{ padding:0, overflow:"hidden", border:`1px solid ${meta.color}28` }}>
      <div style={{ height:4, background:`linear-gradient(90deg,${meta.color},${T.accent})` }} />
      <div style={{ padding:"18px 22px" }}>

        {/* Header row */}
        <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6, flexWrap:"wrap" }}>
              <div style={{ fontFamily:"Syne", fontWeight:800, fontSize:15 }}>{exam.title}</div>
              <span style={{ fontSize:11, background:meta.color+"18", color:meta.color,
                borderRadius:50, padding:"2px 10px", fontWeight:700 }}>
                {meta.icon} {meta.label}
              </span>
              <span style={{ fontSize:11, background:T.bg3, color:T.muted,
                borderRadius:50, padding:"2px 10px" }}>{exam.examType?.replace("_"," ")}</span>
            </div>

            <div style={{ display:"flex", gap:20, fontSize:12, color:T.muted, flexWrap:"wrap" }}>
              {exam.scheduledAt && <span>📅 {fmtDT(exam.scheduledAt)}</span>}
              {exam.postponedTo && <span style={{ color:"#F59E0B" }}>⏸ Postponed → {fmtDT(exam.postponedTo)}</span>}
              <span>⏱ {exam.durationMinutes} min</span>
              <span>📊 Max: {exam.maxMarks} | Pass: {exam.passMarks}</span>
              {exam.batchName && <span>👥 {exam.batchName}</span>}
              {exam.levelUpScore  && <span>🔼 Level-up: {exam.levelUpScore}</span>}
              {exam.cleanupScore  && <span>🔻 Cleanup: {exam.cleanupScore}</span>}
            </div>

            {exam.cancellationReason && (
              <div style={{ marginTop:8, fontSize:12, color:"#EF4444", background:"#EF444412",
                borderRadius:6, padding:"6px 12px" }}>
                ❌ Reason: {exam.cancellationReason}
              </div>
            )}

            {/* Invited student list — show for UPCOMING, RESCHEDULED */}
            {(exam.status === "UPCOMING" || exam.status === "RESCHEDULED") && invitedStudents.length > 0 && (
              <div style={{ marginTop:10 }}>
                <div style={{ fontSize:11, fontWeight:700, color:T.muted, marginBottom:5 }}>
                  👤 INVITED STUDENTS ({invitedStudents.length})
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {invitedStudents.map(s => (
                    <span key={s.studentId}
                      style={{ fontSize:11, background:T.bg3, border:`1px solid ${T.border}`,
                        borderRadius:50, padding:"3px 10px", color:T.text }}>
                      {s.studentName}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Unrecommended students badge */}
            {exam.students?.filter(s => s.unrecommended).length > 0 && (
              <div style={{ marginTop:8, fontSize:11, color:"#F59E0B", fontWeight:600 }}>
                ⚠ {exam.students.filter(s => s.unrecommended).length} student(s) marked as Not Recommended
              </div>
            )}
          </div>

          {/* Timer for CURRENT */}
          {exam.status === "CURRENT" && (
            <div style={{ textAlign:"center", flexShrink:0,
              background: isCritical ? "#EF444415" : "#10B98115",
              border:`2px solid ${isCritical ? "#EF4444" : "#10B981"}`,
              borderRadius:12, padding:"10px 18px", minWidth:90 }}>
              <div style={{ fontSize:11, color:T.muted, fontWeight:700, marginBottom:2 }}>TIME LEFT</div>
              <div style={{ fontSize:22, fontWeight:900, fontFamily:"Syne",
                color: isCritical ? "#EF4444" : "#10B981" }}>
                {fmtTimer(secsLeft)}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display:"flex", gap:8, marginTop:14, flexWrap:"wrap" }}>
          {exam.status === "UPCOMING" && (<>
            <Btn size="xs" variant="primary"  onClick={onStart}>🚀 Start Instantly</Btn>
            <Btn size="xs" variant="ghost"    onClick={onPostpone}>⏸ Postpone</Btn>
            <Btn size="xs" variant="ghost"    onClick={onCancel}>❌ Cancel</Btn>
            <Btn size="xs" variant="danger"   onClick={onDelete}>🗑 Delete</Btn>
          </>)}
          {exam.status === "POSTPONED" && (
            <Btn size="xs" variant="danger" onClick={onDelete}>🗑 Delete Exam</Btn>
          )}
          {exam.status === "CURRENT" && (
            <Btn size="xs" variant="primary" onClick={onEvaluate}>📊 Open Evaluator</Btn>
          )}
          {exam.status === "EVALUATING" && (
            <Btn size="xs" variant="primary" onClick={onEvaluate}>📊 Evaluate Students</Btn>
          )}
          {exam.status === "RESCHEDULED" && (<>
            <Btn size="xs" variant="primary" onClick={onStartRescheduled}>🚀 Start Instantly</Btn>
            <Btn size="xs" variant="ghost"   onClick={onCancelRescheduled}>❌ Cancel</Btn>
          </>)}
          {exam.status === "COMPLETED" && (
            <Btn size="xs" variant="ghost" onClick={onEvaluate}>👁 View Results</Btn>
          )}
        </div>
      </div>
    </Card>
  );
};

// ── Question Paper Input: file browse + URL fallback ─────────────────────────
const QuestionPaperInput = ({ value, onChange }) => {
  const fileRef = React.useRef();
  const [uploading, setUploading] = React.useState(false);
  const [fileName, setFileName]   = React.useState("");

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setFileName(file.name);
    // Convert to base64 data URL so it can be stored/emailed
    const reader = new FileReader();
    reader.onload = (ev) => {
      onChange(ev.target.result);   // pass base64 data URL up
      setUploading(false);
    };
    reader.onerror = () => setUploading(false);
    reader.readAsDataURL(file);
  };

  const handleClear = () => {
    onChange("");
    setFileName("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const isFile = value && value.startsWith("data:");
  const isUrl  = value && !value.startsWith("data:");

  return (
    <div>
      {/* Hidden file input */}
      <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        style={{ display:"none" }} onChange={handleFile} />

      {/* Browse button + URL input row */}
      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
        <button type="button"
          onClick={() => fileRef.current?.click()}
          style={{ flexShrink:0, padding:"9px 14px", background:T.bg3,
            border:`1.5px solid ${T.border}`, borderRadius:8, cursor:"pointer",
            color:T.text, fontSize:12, fontWeight:700, display:"flex",
            alignItems:"center", gap:6, whiteSpace:"nowrap",
            transition:"all .2s" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.color = T.primary; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border;  e.currentTarget.style.color = T.text; }}>
          📎 Browse Device
        </button>
        <input
          value={isFile ? "" : (value || "")}
          onChange={e => { setFileName(""); onChange(e.target.value); }}
          placeholder="— or paste a URL (Google Drive, etc.)"
          disabled={isFile}
          style={{ flex:1, background:T.bg3, border:`1px solid ${T.border}`,
            borderRadius:8, padding:"9px 12px", fontSize:13, color:T.text,
            boxSizing:"border-box", outline:"none",
            opacity: isFile ? 0.5 : 1 }} />
        {value && (
          <button type="button" onClick={handleClear}
            style={{ flexShrink:0, background:"none", border:"none",
              cursor:"pointer", color:"#EF4444", fontSize:18, lineHeight:1 }}
            title="Clear">✕</button>
        )}
      </div>

      {/* Status indicator */}
      {uploading && (
        <div style={{ marginTop:6, fontSize:12, color:T.muted }}>⏳ Reading file…</div>
      )}
      {isFile && fileName && !uploading && (
        <div style={{ marginTop:6, fontSize:12, color:"#10B981",
          display:"flex", alignItems:"center", gap:6 }}>
          ✅ File selected: <strong>{fileName}</strong>
          <span style={{ color:T.muted }}>(will be sent as attachment)</span>
        </div>
      )}
      {isUrl && (
        <div style={{ marginTop:6, fontSize:12, color:T.muted }}>
          🔗 URL: <span style={{ color:T.primary }}>{value.length > 60 ? value.slice(0,60)+"…" : value}</span>
        </div>
      )}
    </div>
  );
};

// ── Create Exam Modal ─────────────────────────────────────────────────────────
// ── Shared form field wrapper (defined outside to prevent focus loss on re-render) ──
const examInputSty = {
  width:"100%", background:T.bg3, border:`1px solid ${T.border}`,
  borderRadius:8, padding:"9px 12px", fontSize:13, color:T.text,
  boxSizing:"border-box", outline:"none",
};
const F = ({ label, children, note }) => (
  <div style={{ marginBottom:16 }}>
    <div style={{ fontSize:11, fontWeight:700, color:T.muted, marginBottom:5,
      textTransform:"uppercase", letterSpacing:0.8 }}>
      {label}{note && <span style={{ fontSize:10, fontWeight:400, marginLeft:6, color:T.muted }}>{note}</span>}
    </div>
    {children}
  </div>
);

const CreateExamModal = ({ course, onClose, onCreated }) => {
  const [students, setStudents]     = useState([]);
  const [form, setForm]             = useState({
    title:"", examType:"MIDTERM", scheduledAt:"",
    durationMinutes:60, maxMarks:100, passMarks:40,
    levelUpScore:"", cleanupScore:"", questionPaperUrl:"",
    studentMode:"ALL",   // "ALL" | "NO_RECOMMEND"
  });
  const [unrecommended, setUnrec]   = useState(new Set());
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");

  useEffect(() => {
    getTeacherCourseStudents(course.id)
      .then(d => setStudents(Array.isArray(d) ? d : []))
      .catch(console.error);
  }, [course.id]);

  const toggleUnrec = (id) => setUnrec(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const handleSubmit = async () => {
    if (!form.title.trim())    { setError("Exam title is required."); return; }
    if (!form.scheduledAt)     { setError("Schedule date & time is required."); return; }
    if (new Date(form.scheduledAt) < new Date()) { setError("Schedule must be current time or in the future."); return; }
    if (Number(form.durationMinutes) < 1) { setError("Duration must be at least 1 minute."); return; }
    setSaving(true); setError("");
    try {
      await createExam({
        courseId:               course.id,
        title:                  form.title,
        examType:               form.examType,
        scheduledAt:            form.scheduledAt,
        durationMinutes:        Number(form.durationMinutes),
        maxMarks:               Number(form.maxMarks),
        passMarks:              Number(form.passMarks),
        levelUpScore:           form.levelUpScore  ? Number(form.levelUpScore)  : null,
        cleanupScore:           form.cleanupScore  ? Number(form.cleanupScore)  : null,
        questionPaperUrl:       form.questionPaperUrl || null,
        studentMode:            form.studentMode === "ALL" ? "ALL" : "SELECTED",
        unrecommendedStudentIds: [...unrecommended],
      });
      onCreated();
    } catch(e) { setError(e.message); }
    finally { setSaving(false); }
  };



  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.75)", zIndex:9999,
      display:"flex", alignItems:"flex-start", justifyContent:"center",
      overflowY:"auto", padding:"30px 16px", backdropFilter:"blur(6px)" }}
      onClick={onClose}>
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:20, padding:32,
        width:"100%", maxWidth:660, position:"relative" }} onClick={e => e.stopPropagation()}>

        <button onClick={onClose}
          style={{ position:"absolute", top:14, right:14, width:30, height:30,
            border:`1px solid ${T.border}`, borderRadius:"50%", background:T.bg3,
            cursor:"pointer", color:T.muted, fontSize:16 }}>✕</button>

        <h3 style={{ fontFamily:"Syne", fontSize:20, fontWeight:800, marginBottom:22 }}>📝 Create Exam</h3>

        {/* Auto-filled read-only info */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:22 }}>
          {[["Department", course.department||"—"],["Course", course.title],["Batch", course.batchName||"—"]].map(([l,v]) => (
            <div key={l} style={{ background:T.bg3, borderRadius:8, padding:"8px 12px",
              border:`1px solid ${T.border}` }}>
              <div style={{ fontSize:10, color:T.muted, fontWeight:700 }}>{l}</div>
              <div style={{ fontSize:13, fontWeight:700, marginTop:3, color:T.primary }}>{v}</div>
            </div>
          ))}
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>

          <div style={{ gridColumn:"1/-1" }}>
            <F label="Exam Title">
              <input style={examInputSty} placeholder="e.g. Mid-Term Examination 2026"
                value={form.title} onChange={e => setForm(f => ({ ...f, title:e.target.value }))} />
            </F>
          </div>

          <F label="Exam Type">
            <select style={examInputSty} value={form.examType}
              onChange={e => setForm(f => ({ ...f, examType:e.target.value }))}>
              {EXAM_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g," ")}</option>)}
            </select>
          </F>

          <F label="Schedule Date & Time" note="(current time or future)">
            <input type="datetime-local" style={examInputSty} value={form.scheduledAt}
              onChange={e => setForm(f => ({ ...f, scheduledAt:e.target.value }))} />
          </F>

          <F label="Duration (minutes)">
            <input type="number" style={examInputSty} min={1} value={form.durationMinutes}
              onChange={e => setForm(f => ({ ...f, durationMinutes:e.target.value }))} />
          </F>

          <F label="Marks Obtainable (Max Marks)">
            <input type="number" style={examInputSty} min={1} value={form.maxMarks}
              onChange={e => setForm(f => ({ ...f, maxMarks:e.target.value }))} />
          </F>

          <F label="Pass Marks (Min to Clear)">
            <input type="number" style={examInputSty} min={0} value={form.passMarks}
              onChange={e => setForm(f => ({ ...f, passMarks:e.target.value }))} />
          </F>

          <F label="Level-Up Score" note="(optional)">
            <input type="number" style={examInputSty} placeholder="e.g. 80" value={form.levelUpScore}
              onChange={e => setForm(f => ({ ...f, levelUpScore:e.target.value }))} />
          </F>

          <F label="Cleanup Score" note="(optional — fail threshold)">
            <input type="number" style={examInputSty} placeholder="e.g. 35" value={form.cleanupScore}
              onChange={e => setForm(f => ({ ...f, cleanupScore:e.target.value }))} />
          </F>

          <div style={{ gridColumn:"1/-1" }}>
            <F label="Question Paper" note="(optional — browse file or paste URL)">
              <QuestionPaperInput
                value={form.questionPaperUrl}
                onChange={url => setForm(f => ({ ...f, questionPaperUrl: url }))}
              />
            </F>
          </div>

          {/* ── Student Selection: two input boxes ── */}
          <div style={{ gridColumn:"1/-1" }}>
            <F label="Student Selection">
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
                {/* Input 1: mode dropdown */}
                <div>
                  <div style={{ fontSize:11, color:T.muted, fontWeight:700, marginBottom:5 }}>INVITE MODE</div>
                  <select style={examInputSty} value={form.studentMode}
                    onChange={e => {
                      setForm(f => ({ ...f, studentMode:e.target.value }));
                      if (e.target.value === "ALL") setUnrec(new Set());
                    }}>
                    <option value="ALL">All Students</option>
                    <option value="NO_RECOMMEND">No Recommend These Students</option>
                  </select>
                </div>
                {/* Input 2: search/label — disabled when ALL */}
                <div>
                  <div style={{ fontSize:11, color:T.muted, fontWeight:700, marginBottom:5 }}>
                    NOT RECOMMENDED COUNT
                  </div>
                  <input style={{ ...examInputSty, opacity: form.studentMode==="ALL" ? 0.5 : 1 }}
                    disabled value={
                      form.studentMode === "ALL"
                        ? "All students invited (none excluded)"
                        : unrecommended.size > 0
                          ? `${unrecommended.size} student(s) marked as Not Recommended`
                          : "Select students below to exclude…"
                    } />
                </div>
              </div>

              {/* Checkbox list — only when NO_RECOMMEND */}
              {form.studentMode === "NO_RECOMMEND" && (
                <div>
                  <div style={{ fontSize:12, color:"#F59E0B", background:"#F59E0B12",
                    borderRadius:8, padding:"8px 12px", marginBottom:10 }}>
                    ⚠ Students checked below will receive a special notification that they are <strong>unable to attend</strong> this exam,
                    and their parents will be notified via email.
                  </div>
                  <div style={{ maxHeight:200, overflowY:"auto", border:`1px solid ${T.border}`,
                    borderRadius:8, padding:8 }}>
                    {students.length === 0 && (
                      <div style={{ color:T.muted, fontSize:13, padding:8 }}>No students enrolled in this course.</div>
                    )}
                    {students.map(s => (
                      <label key={s.id}
                        style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 10px",
                          borderRadius:6, cursor:"pointer",
                          background: unrecommended.has(s.id) ? "#F59E0B12" : "transparent" }}>
                        <input type="checkbox" checked={unrecommended.has(s.id)}
                          onChange={() => toggleUnrec(s.id)} />
                        <Avatar name={s.name} size={24} />
                        <span style={{ fontSize:13, fontWeight: unrecommended.has(s.id) ? 700 : 400 }}>
                          {s.name}
                        </span>
                        <span style={{ fontSize:11, color:T.muted }}>{s.userId}</span>
                        {unrecommended.has(s.id) && (
                          <Badge type="warning" style={{ marginLeft:"auto" }}>Not Recommended</Badge>
                        )}
                      </label>
                    ))}
                  </div>
                  <div style={{ marginTop:8, fontSize:12, color:T.muted }}>
                    All <strong>other</strong> enrolled students will receive an invitation notification and email.
                  </div>
                </div>
              )}

              {form.studentMode === "ALL" && (
                <div style={{ fontSize:12, color:"#10B981", background:"#10B98112",
                  borderRadius:8, padding:"8px 12px" }}>
                  ✅ All {students.length} enrolled students will be invited. Each will receive a notification
                  and their parent will receive an email with exam details.
                </div>
              )}
            </F>
          </div>
        </div>

        {/* Notification summary */}
        <div style={{ background:T.bg3, borderRadius:10, padding:"12px 16px", marginBottom:16,
          fontSize:12, color:T.muted, border:`1px solid ${T.border}` }}>
          <div style={{ fontWeight:700, color:T.text, marginBottom:6 }}>📣 Notifications that will be sent:</div>
          <div>• Students: "You are invited for this exam — {form.title || "(title)"}. Be ready for scheduled time."</div>
          {form.studentMode === "NO_RECOMMEND" && unrecommended.size > 0 && (
            <div>• Not-recommended students: "You are unable to attend this exam. Please consider or contact your teacher."</div>
          )}
          <div>• Parents: Email with exam schedule, duration, and marks information.</div>
          <div>• Administrator: Notified that exam was created by you for {course.batchName || "batch"} — {course.title}.</div>
        </div>

        {error && (
          <div style={{ color:"#EF4444", fontSize:13, marginBottom:12, padding:"8px 12px",
            background:"#EF444412", borderRadius:8 }}>⚠ {error}</div>
        )}

        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={handleSubmit}>{saving ? "Creating…" : "Create Exam"}</Btn>
        </div>
      </div>
    </div>
  );
};

// ── Postpone Form ─────────────────────────────────────────────────────────────
const PostponeForm = ({ exam, onSubmit }) => {
  const [dt, setDt]         = useState("");
  const [saving, setSaving] = useState(false);
  return (
    <div>
      <div style={{ fontSize:14, color:T.muted, marginBottom:16 }}>
        Current schedule: <strong style={{ color:T.text }}>
          {exam.scheduledAt ? new Date(exam.scheduledAt).toLocaleString("en-IN") : "—"}
        </strong>
      </div>
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:11, fontWeight:700, color:T.muted, marginBottom:5 }}>NEW POSTPONE DATE & TIME</div>
        <input type="datetime-local" value={dt} onChange={e => setDt(e.target.value)}
          style={{ width:"100%", background:T.bg3, border:`1px solid ${T.border}`, borderRadius:8,
            padding:"9px 12px", fontSize:13, color:T.text, boxSizing:"border-box", outline:"none" }} />
      </div>
      <div style={{ fontSize:12, color:"#F59E0B", background:"#F59E0B12", borderRadius:8,
        padding:"10px 14px", marginBottom:16 }}>
        ⏸ Students, parents (via email), and administrators will be notified of this postponement.
      </div>
      <div style={{ display:"flex", justifyContent:"flex-end" }}>
        <Btn variant="primary" onClick={async () => {
          if (!dt) { alert("Please select a new date."); return; }
          if (new Date(dt) <= new Date()) { alert("Postpone date must be in the future."); return; }
          setSaving(true); await onSubmit(dt); setSaving(false);
        }}>{saving ? "Saving…" : "Postpone Exam"}</Btn>
      </div>
    </div>
  );
};

// ── Cancel Form ───────────────────────────────────────────────────────────────
const CancelForm = ({ exam, onSubmit }) => {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  return (
    <div>
      <div style={{ fontSize:14, color:T.muted, marginBottom:16 }}>
        Cancelling: <strong style={{ color:T.text }}>{exam.title}</strong>
      </div>
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:11, fontWeight:700, color:T.muted, marginBottom:5 }}>
          REASON FOR CANCELLATION <span style={{ fontWeight:400 }}>(required)</span>
        </div>
        <textarea value={reason} onChange={e => setReason(e.target.value)} rows={4}
          placeholder="Explain why this exam is being cancelled…"
          style={{ width:"100%", background:T.bg3, border:`1px solid ${T.border}`, borderRadius:8,
            padding:"9px 12px", fontSize:13, color:T.text, boxSizing:"border-box",
            outline:"none", resize:"vertical", fontFamily:"inherit" }} />
      </div>
      <div style={{ fontSize:12, color:"#EF4444", background:"#EF444412", borderRadius:8,
        padding:"10px 14px", marginBottom:16 }}>
        ❌ Students will receive a cancellation notification with your reason.
        Parents will receive an email with the cancellation reason.
      </div>
      <div style={{ display:"flex", justifyContent:"flex-end" }}>
        <Btn variant="danger" onClick={async () => {
          if (!reason.trim()) { alert("Please provide a reason for cancellation."); return; }
          setSaving(true); await onSubmit(reason); setSaving(false);
        }}>{saving ? "Cancelling…" : "Cancel Exam"}</Btn>
      </div>
    </div>
  );
};

// ── Start Exam Form ───────────────────────────────────────────────────────────
const StartExamForm = ({ exam, onSubmit }) => {
  const [qpUrl, setQpUrl]   = useState(exam.questionPaperUrl || "");
  const [saving, setSaving] = useState(false);
  return (
    <div>
      <div style={{ fontSize:14, color:T.muted, marginBottom:16 }}>
        Starting: <strong style={{ color:T.text }}>{exam.title}</strong>
        &nbsp;·&nbsp; Duration: <strong>{exam.durationMinutes} min</strong>
      </div>
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:11, fontWeight:700, color:T.muted, marginBottom:5 }}>
          QUESTION PAPER <span style={{ fontWeight:400 }}>(optional — browse file or paste URL, emailed to students & parents)</span>
        </div>
        <QuestionPaperInput value={qpUrl} onChange={setQpUrl} />
      </div>
      <div style={{ fontSize:12, color:"#10B981", background:"#10B98115",
        borderRadius:8, padding:"10px 14px", marginBottom:16 }}>
        🚀 The exam countdown timer starts immediately after you click Start.
        Students, parents (via email), and admin will be notified that the exam has started.
      </div>
      <div style={{ display:"flex", justifyContent:"flex-end" }}>
        <Btn variant="primary" onClick={async () => {
          setSaving(true); await onSubmit(qpUrl); setSaving(false);
        }}>{saving ? "Starting…" : "Start Exam Now"}</Btn>
      </div>
    </div>
  );
};

// ── Evaluate Exam Modal ───────────────────────────────────────────────────────
const EvaluateExamModal = ({ exam, course, onClose, onSaved, onFinished }) => {
  const [students, setStudents]     = useState([]);
  const [results, setResults]       = useState({});
  const [saving, setSaving]         = useState(false);
  const [finishing, setFinishing]   = useState(false);
  const maxMarks  = exam.maxMarks  || 100;
  const passMarks = exam.passMarks || 40;

  useEffect(() => {
    // Load students enrolled in this exam (non-unrecommended)
    getTeacherCourseStudents(course.id).then(d => {
      const enrolled = Array.isArray(d) ? d : [];
      setStudents(enrolled);
      setResults(prev => {
        const next = { ...prev };
        enrolled.forEach(s => {
          if (!next[s.id]) next[s.id] = { marks:"", grade:"", attended:true, cleared:false };
        });
        return next;
      });
    }).catch(console.error);

    // Load existing saved results
    getExamResults(exam.id).then(rows => {
      if (!Array.isArray(rows)) return;
      setResults(prev => {
        const next = { ...prev };
        rows.forEach(r => {
          next[r.studentId] = {
            marks:    r.marksObtained != null ? String(r.marksObtained) : "",
            grade:    r.grade || "",
            attended: r.attended,
            cleared:  r.cleared,
          };
        });
        return next;
      });
    }).catch(console.error);
  }, [exam.id, course.id]);

  const autoGrade = (marks) => {
    const pct = (Number(marks) / maxMarks) * 100;
    if (pct >= 90) return "A+";
    if (pct >= 75) return "A";
    if (pct >= 60) return "B+";
    if (pct >= 50) return "B";
    if (pct >= 40) return "C";
    return "F";
  };

  const setField = (studentId, field, value) => {
    setResults(prev => {
      const row = { ...prev[studentId], [field]: value };
      if (field === "marks" && value !== "") {
        row.grade   = autoGrade(value);
        row.cleared = Number(value) >= passMarks;
      }
      if (field === "attended" && !value) {
        row.cleared = false;
        row.marks   = "";
        row.grade   = "—";
      }
      return { ...prev, [studentId]: row };
    });
  };

  const buildPayload = () => ({
    results: students.map(s => {
      const r = results[s.id] || {};
      return {
        studentId:     s.id,
        marksObtained: r.marks !== "" ? Number(r.marks) : null,
        grade:         r.grade || null,
        attended:      r.attended !== false,
        cleared:       !!r.cleared,
      };
    })
  });

  const handleSave = async () => {
    setSaving(true);
    try { await saveExamEvaluation(exam.id, buildPayload()); onSaved(); alert("Progress saved!"); }
    catch(e) { alert("Error saving: " + e.message); }
    finally { setSaving(false); }
  };

  const handleFinish = async () => {
    const ungraded = students.filter(s => {
      const r = results[s.id] || {};
      return r.attended !== false && r.marks === "";
    });
    if (ungraded.length > 0) {
      if (!window.confirm(`${ungraded.length} students have no marks entered. Mark them as absent or enter marks. Continue anyway?`)) return;
    }
    if (!window.confirm(
      "Finish evaluation? This will:\n• Mark exam as COMPLETED\n• Notify all students & parents (via email) with results\n• Notify administrator\n• Auto-create a Rescheduled exam for students who didn't clear"
    )) return;
    setFinishing(true);
    try { await finishExamEvaluation(exam.id, buildPayload()); onFinished(); }
    catch(e) { alert("Error finishing: " + e.message); }
    finally { setFinishing(false); }
  };

  const isReadOnly = exam.status === "COMPLETED";
  const clearedCount  = Object.values(results).filter(r => r.cleared).length;
  const failedCount   = Object.values(results).filter(r => !r.cleared && r.attended !== false).length;
  const absentCount   = Object.values(results).filter(r => r.attended === false).length;

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.78)", zIndex:9999,
      display:"flex", alignItems:"flex-start", justifyContent:"center",
      overflowY:"auto", padding:"30px 12px", backdropFilter:"blur(6px)" }}>
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:20, padding:28,
        width:"100%", maxWidth:950, position:"relative" }}>

        <button onClick={onClose}
          style={{ position:"absolute", top:14, right:14, width:30, height:30,
            border:`1px solid ${T.border}`, borderRadius:"50%", background:T.bg3,
            cursor:"pointer", color:T.muted, fontSize:16 }}>✕</button>

        <h3 style={{ fontFamily:"Syne", fontSize:20, fontWeight:800, marginBottom:6 }}>
          📊 Evaluate: {exam.title}
        </h3>
        <div style={{ fontSize:12, color:T.muted, marginBottom:16 }}>
          Max: {maxMarks} pts · Pass: {passMarks} pts · {students.length} students
          {isReadOnly && <span style={{ marginLeft:12, color:"#10B981", fontWeight:700 }}> · READ-ONLY (Completed)</span>}
        </div>

        {/* Summary chips */}
        <div style={{ display:"flex", gap:12, marginBottom:16, flexWrap:"wrap" }}>
          {[
            ["✅ Cleared", clearedCount, "#10B981"],
            ["❌ Not Cleared", failedCount, "#EF4444"],
            ["🚫 Absent", absentCount, "#F59E0B"],
          ].map(([l,v,c]) => (
            <div key={l} style={{ padding:"6px 14px", borderRadius:50, fontSize:12, fontWeight:700,
              background:c+"18", color:c, border:`1px solid ${c}30` }}>
              {l}: {v}
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead>
              <tr style={{ background:T.bg3 }}>
                {["#","Student","ID","Attendance","Marks /"+maxMarks,"Grade","Cleared"].map(h => (
                  <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontSize:11,
                    fontWeight:700, color:T.muted, whiteSpace:"nowrap",
                    borderBottom:`1px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => {
                const r   = results[s.id] || {};
                const bg  = r.attended === false ? "#EF444408"
                          : r.cleared ? "#10B98108" : "transparent";
                return (
                  <tr key={s.id} style={{ background:bg, borderBottom:`1px solid ${T.border}22` }}>
                    <td style={{ padding:"10px 14px", color:T.muted }}>{i+1}</td>
                    <td style={{ padding:"10px 14px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <Avatar name={s.name} size={26} />
                        <span style={{ fontWeight:600 }}>{s.name}</span>
                      </div>
                    </td>
                    <td style={{ padding:"10px 14px", color:T.muted, fontSize:11 }}>{s.userId}</td>

                    {/* Attendance */}
                    <td style={{ padding:"10px 14px" }}>
                      <select disabled={isReadOnly}
                        value={r.attended === false ? "false" : "true"}
                        onChange={e => setField(s.id, "attended", e.target.value === "true")}
                        style={{ background:T.bg3, border:`1px solid ${T.border}`, borderRadius:6,
                          padding:"5px 8px", fontSize:12, fontWeight:700, cursor: isReadOnly ? "default" : "pointer",
                          color: r.attended === false ? "#EF4444" : "#10B981" }}>
                        <option value="true">✅ Present</option>
                        <option value="false">❌ Absent</option>
                      </select>
                    </td>

                    {/* Marks */}
                    <td style={{ padding:"10px 14px" }}>
                      <input type="number" min={0} max={maxMarks}
                        disabled={isReadOnly || r.attended === false}
                        value={r.marks ?? ""}
                        onChange={e => setField(s.id, "marks", e.target.value)}
                        placeholder={r.attended === false ? "Absent" : "Enter marks"}
                        style={{ width:90, background:T.bg3, border:`1px solid ${T.border}`,
                          borderRadius:6, padding:"5px 8px", fontSize:13, color:T.text, fontWeight:700,
                          opacity: r.attended === false ? 0.4 : 1 }} />
                    </td>

                    {/* Grade */}
                    <td style={{ padding:"10px 14px" }}>
                      <input disabled={isReadOnly} value={r.grade || ""}
                        onChange={e => setField(s.id, "grade", e.target.value)}
                        style={{ width:54, background:T.bg3, border:`1px solid ${T.border}`,
                          borderRadius:6, padding:"5px 8px", fontSize:13, fontWeight:800,
                          color: r.grade === "F" ? "#EF4444"
                               : r.grade?.startsWith("A") ? "#10B981"
                               : T.text }} />
                    </td>

                    {/* Cleared */}
                    <td style={{ padding:"10px 14px" }}>
                      <select disabled={isReadOnly}
                        value={r.cleared ? "true" : "false"}
                        onChange={e => setField(s.id, "cleared", e.target.value === "true")}
                        style={{ background: r.cleared ? "#10B98118" : "#EF444418",
                          border:`1px solid ${r.cleared ? "#10B981" : "#EF4444"}`,
                          borderRadius:6, padding:"5px 8px", fontSize:12, fontWeight:700,
                          color: r.cleared ? "#10B981" : "#EF4444",
                          cursor: isReadOnly ? "default" : "pointer" }}>
                        <option value="true">✅ Cleared</option>
                        <option value="false">❌ Not Cleared</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Finish warning */}
        {!isReadOnly && failedCount > 0 && (
          <div style={{ marginTop:14, fontSize:12, color:"#06B6D4", background:"#06B6D412",
            borderRadius:8, padding:"10px 14px" }}>
            🔁 On Finish: A <strong>Rescheduled Exam</strong> will be auto-created for the {failedCount} student(s) who didn't clear.
            Those students and their parents will be notified separately.
          </div>
        )}

        {!isReadOnly && (
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:20,
            paddingTop:16, borderTop:`1px solid ${T.border}` }}>
            <Btn variant="ghost" onClick={handleSave}>{saving ? "Saving…" : "💾 Save Progress"}</Btn>
            <Btn variant="primary" onClick={handleFinish}>{finishing ? "Finishing…" : "✅ Finish & Notify"}</Btn>
          </div>
        )}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// TASK SECTION (assignments for this course)
// ══════════════════════════════════════════════════════════════════════════════
const TaskSection = ({ course }) => {
  const [assignments, setAssigns] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [showCreate, setCreate]   = useState(false);
  
  // Templates state
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  const initialForm = {
    title: "",
    description: "",
    dueDate: "",
    maxMarks: 100,
    taskType: "Homework",
    attachments: "",
    submissionType: "ANY",
    allowedFileTypes: "pdf,doc,docx,jpg,png",
    maxFileSize: 10,
    allowLate: true,
    lateDeadline: "",
    latePenalty: 10,
    status: "PUBLISHED"
  };
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  // Extend Deadline state
  const [extendId, setExtendId] = useState(null);
  const [newDueDate, setNewDueDate] = useState("");

  const load = () => {
    setLoading(true);
    getTeacherAssignments()
      .then(d => setAssigns((Array.isArray(d) ? d : []).filter(a => a.course?.id === course.id || a.courseId === course.id)))
      .catch(console.error).finally(() => setLoading(false));

    getTaskTemplates()
      .then(t => setTemplates(Array.isArray(t) ? t : []))
      .catch(console.error);
  };

  useEffect(load, [course.id]);

  const handleCreate = async () => {
    if (!form.title.trim()) { alert("Title required"); return; }
    setSaving(true);
    try {
      await createAssignment({
        courseId: course.id,
        ...form,
        maxMarks: Number(form.maxMarks),
        maxFileSize: form.maxFileSize ? Number(form.maxFileSize) : null,
        latePenalty: form.latePenalty ? Number(form.latePenalty) : 0,
      });
      setCreate(false);
      setForm(initialForm);
      load();
      alert("Assignment created successfully!");
    } catch(e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const handleSaveAsTemplate = async () => {
    if (!form.title.trim()) { alert("Title is required to save template"); return; }
    try {
      await createTaskTemplate({
        title: form.title,
        description: form.description,
        taskType: form.taskType,
        maxMarks: Number(form.maxMarks),
        submissionType: form.submissionType
      });
      alert("Template saved!");
      getTaskTemplates().then(t => setTemplates(Array.isArray(t) ? t : []));
    } catch (e) {
      alert("Failed to save template: " + e.message);
    }
  };

  const handleApplyTemplate = (tplId) => {
    setSelectedTemplateId(tplId);
    if (!tplId) return;
    const tpl = templates.find(t => String(t.id) === tplId);
    if (tpl) {
      setForm(f => ({
        ...f,
        title: tpl.title || "",
        description: tpl.description || "",
        taskType: tpl.taskType || "Homework",
        maxMarks: tpl.maxMarks || 100,
        submissionType: tpl.submissionType || "ANY"
      }));
    }
  };

  const handleExtend = async () => {
    if (!newDueDate) { alert("Please select a new due date"); return; }
    try {
      await bulkExtendAssignmentDeadline(extendId, newDueDate);
      alert("Deadline extended!");
      setExtendId(null);
      setNewDueDate("");
      load();
    } catch (e) {
      alert("Failed to extend deadline: " + e.message);
    }
  };

  const handleSendReminder = async (id) => {
    try {
      await sendTaskReminder(id);
      alert("🔔 Reminder notifications sent to all students who have not submitted!");
    } catch (e) {
      alert("Failed to send reminders: " + e.message);
    }
  };

  const inputSty = { width:"100%", background:T.bg3, border:`1px solid ${T.border}`, borderRadius:8, padding:"9px 12px", fontSize:13, color:T.text, boxSizing:"border-box", outline:"none" };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16, alignItems:"center" }}>
        <div>
          <h2 style={{ fontFamily:"Syne", fontWeight:800, fontSize:18, margin:0 }}>📋 Assignments — {course.title}</h2>
          <p style={{ fontSize:12, color:T.muted, margin:"4px 0 0 0" }}>Create rich assignments with allowed file types, late penalties, and templates.</p>
        </div>
        <Btn size="sm" variant="primary" onClick={() => setCreate(true)}>+ New Task</Btn>
      </div>

      {loading ? <Card><div style={{ padding:30, textAlign:"center", color:T.muted }}>Loading…</div></Card>
        : assignments.length === 0 ? (
          <Card><div style={{ padding:40, textAlign:"center", color:T.muted }}>
            <div style={{ fontSize:36, marginBottom:10 }}>📋</div>
            <div>No assignments yet. Create one above.</div>
          </div></Card>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {assignments.map(a => (
              <Card key={a.id} style={{ padding:"16px 20px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                      <Badge type={a.status === "PUBLISHED" ? "success" : "ghost"}>{a.status}</Badge>
                      <Badge type="primary">{a.taskType || "Homework"}</Badge>
                      <span style={{ fontSize:12, color:T.muted }}>Submission: {a.submissionType || "ANY"}</span>
                    </div>
                    <div style={{ fontWeight:700, fontSize:15, color: T.text, marginBottom:4 }}>📋 {a.title}</div>
                    {a.description && <div style={{ fontSize:12, color:T.muted, marginBottom:6 }}>{a.description}</div>}
                    
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 14, fontSize:12, color:T.muted }}>
                      <span>Due: {a.dueDate ? new Date(a.dueDate).toLocaleString("en-IN", { dateStyle:"medium", timeStyle:"short" }) : "—"}</span>
                      <span>Max Marks: {a.maxMarks}</span>
                      {a.allowLate && (
                        <span style={{ color: "#F59E0B" }}>Late Penalty: {a.latePenalty || 0}%</span>
                      )}
                      {a.attachments && (
                        <span>📎 Link: <a href={a.attachments} target="_blank" rel="noreferrer" style={{ color: T.accent }}>{a.attachments}</a></span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 6 }}>
                    <Btn size="xs" variant="ghost" onClick={() => handleSendReminder(a.id)}>🔔 Remind</Btn>
                    <Btn size="xs" variant="ghost" onClick={() => { setExtendId(a.id); setNewDueDate(a.dueDate ? a.dueDate.substring(0, 16) : ""); }}>⏰ Extend</Btn>
                    <Btn size="xs" variant="danger" onClick={async () => {
                      if (!window.confirm("Delete this assignment?")) return;
                      await deleteAssignment(a.id); load();
                    }}>🗑</Btn>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      }

      {/* Bulk Extend Modal */}
      <Modal open={extendId !== null} onClose={() => setExtendId(null)} title="Extend Assignment Deadline">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 5, display: "block" }}>NEW DUE DATE</label>
            <input type="datetime-local" style={inputSty} value={newDueDate} onChange={e => setNewDueDate(e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn variant="ghost" onClick={() => setExtendId(null)}>Cancel</Btn>
            <Btn variant="primary" onClick={handleExtend}>Extend Deadline</Btn>
          </div>
        </div>
      </Modal>

      <Modal open={showCreate} onClose={() => setCreate(false)} title="Create Assignment" size="lg">
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ background: T.bg3, padding: 12, borderRadius: 8, display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize:10, fontWeight:700, color:T.muted, display:"block", marginBottom:4 }}>LOAD TEMPLATE</label>
              <select style={inputSty} value={selectedTemplateId} onChange={e => handleApplyTemplate(e.target.value)}>
                <option value="">— Choose Template —</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.title} ({t.taskType})</option>
                ))}
              </select>
            </div>
            <Btn size="sm" variant="ghost" style={{ marginTop: 16 }} onClick={handleSaveAsTemplate}>Save Form as Template</Btn>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:T.muted, marginBottom:5 }}>TITLE</div>
              <input type="text" style={inputSty} placeholder="Assignment Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:T.muted, marginBottom:5 }}>TASK TYPE</div>
              <select style={inputSty} value={form.taskType} onChange={e => setForm({ ...form, taskType: e.target.value })}>
                <option value="Homework">Homework</option>
                <option value="Project">Project</option>
                <option value="Lab">Lab Experiment</option>
                <option value="Essay">Essay Writing</option>
                <option value="Quiz">Quiz Assignment</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <div style={{ fontSize:11, fontWeight:700, color:T.muted, marginBottom:5 }}>DESCRIPTION</div>
            <textarea style={{ ...inputSty, height: 60, resize: "none" }} placeholder="Optional instructions..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:T.muted, marginBottom:5 }}>DUE DATE</div>
              <input type="datetime-local" style={inputSty} value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
            </div>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:T.muted, marginBottom:5 }}>MAX MARKS</div>
              <input type="number" style={inputSty} value={form.maxMarks} onChange={e => setForm({ ...form, maxMarks: Number(e.target.value) })} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:T.muted, marginBottom:5 }}>SUBMISSION FORMAT</div>
              <select style={inputSty} value={form.submissionType} onChange={e => setForm({ ...form, submissionType: e.target.value })}>
                <option value="ANY">Any Submission Type</option>
                <option value="TEXT">Text Only</option>
                <option value="FILE">File Upload Only</option>
                <option value="LINK">External Link Only</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:T.muted, marginBottom:5 }}>ALLOWED FILE EXTENSIONS (COMMA-SEPARATED)</div>
              <input type="text" style={inputSty} placeholder="pdf,docx,jpg" value={form.allowedFileTypes} onChange={e => setForm({ ...form, allowedFileTypes: e.target.value })} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:T.muted, marginBottom:5 }}>MAX FILE SIZE (MB)</div>
              <input type="number" style={inputSty} value={form.maxFileSize} onChange={e => setForm({ ...form, maxFileSize: Number(e.target.value) })} />
            </div>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:T.muted, marginBottom:5 }}>EXTERNAL REFERENCE LINK</div>
              <input type="text" style={inputSty} placeholder="https://youtube.com/..." value={form.attachments} onChange={e => setForm({ ...form, attachments: e.target.value })} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 18 }}>
              <input type="checkbox" checked={form.allowLate} onChange={e => setForm({ ...form, allowLate: e.target.checked })} />
              <span style={{ fontSize: 12 }}>Allow Late Submission</span>
            </div>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:T.muted, marginBottom:5 }}>LATE DUE DEADLINE</div>
              <input type="datetime-local" style={inputSty} disabled={!form.allowLate} value={form.lateDeadline} onChange={e => setForm({ ...form, lateDeadline: e.target.value })} />
            </div>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:T.muted, marginBottom:5 }}>LATE PENALTY (DEDUCTION %)</div>
              <input type="number" style={inputSty} disabled={!form.allowLate} value={form.latePenalty} onChange={e => setForm({ ...form, latePenalty: Number(e.target.value) })} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:T.muted, marginBottom:5 }}>STATUS</div>
              <select style={inputSty} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="PUBLISHED">Published (Notify Students)</option>
                <option value="DRAFT">Draft (Save &amp; Hide)</option>
              </select>
            </div>
          </div>

          <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop: 10 }}>
            <Btn variant="ghost" onClick={() => setCreate(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={handleCreate}>{saving ? "Creating…" : "Create Task"}</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// GRADE SECTION (submissions for this course's assignments)
// ══════════════════════════════════════════════════════════════════════════════
const GradeSection = ({ course }) => {
  const [assignments, setAssigns]   = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [submissions, setSubs]      = useState([]);
  const [grading, setGrading]       = useState({});
  const [saving, setSaving]         = useState({});
  const [saved, setSaved]           = useState({});
  const [editMode, setEditMode]     = useState({});
  const [viewSub, setViewSub]       = useState(null);
  const [subsLoading, setSubsLoad]  = useState(false);
  const [filterStatus, setFilter]   = useState("ALL");

  useEffect(() => {
    getTeacherAssignments()
      .then(d => setAssigns((Array.isArray(d) ? d : []).filter(a => a.course?.id === course.id || a.courseId === course.id)))
      .catch(console.error);
  }, [course.id]);

  const loadSubs = async (id) => {
    setSelectedId(id); setSubs([]); setGrading({}); setSaved({}); setEditMode({});
    if (!id) return;
    setSubsLoad(true);
    try { setSubs(Array.isArray(await getSubmissionsForAssignment(id)) ? await getSubmissionsForAssignment(id) : []); }
    catch(err) { console.error(err); }
    finally { setSubsLoad(false); }
  };

  const handleGrade = async (subId, maxMarks) => {
    const { marks, feedback } = grading[subId] || {};
    const m = Number(marks);
    if (!marks && marks !== 0) { alert("Enter a score."); return; }
    if (m < 0 || m > (maxMarks||100)) { alert(`Score must be 0–${maxMarks||100}`); return; }
    setSaving(v => ({ ...v, [subId]:true }));
    try {
      await gradeSubmission(subId, { marks:m, feedback:feedback||"" });
      setSubs(s => s.map(x => x.id===subId ? { ...x, status:"GRADED", marksObtained:m, teacherFeedback:feedback||"" } : x));
      setSaved(v => ({ ...v, [subId]:true }));
      setEditMode(v => ({ ...v, [subId]:false }));
      setTimeout(() => setSaved(v => ({ ...v, [subId]:false })), 2500);
    } catch(e) { alert("Error: " + e.message); }
    finally { setSaving(v => ({ ...v, [subId]:false })); }
  };

  const handleRequestResubmission = async (subId) => {
    const fb = prompt("Enter instructions/reason for resubmission request:");
    if (fb === null) return;
    try {
      await requestResubmission(subId, fb || "Teacher requested resubmission. Please update and submit again.");
      alert("Resubmission requested successfully!");
      loadSubs(selectedId);
    } catch (e) {
      alert("Failed to request resubmission: " + e.message);
    }
  };

  const selAsgn     = assignments.find(a => String(a.id) === selectedId);
  const maxMarks    = selAsgn?.maxMarks || 100;
  const total       = submissions.length;
  const graded      = submissions.filter(s => s.status==="GRADED").length;
  const gradeBand   = (m, max) => {
    const p = (m/max)*100;
    if (p>=90) return { label:"A+", color:"#10B981" };
    if (p>=75) return { label:"A",  color:"#34D399" };
    if (p>=60) return { label:"B",  color:"#F59E0B" };
    if (p>=45) return { label:"C",  color:"#F97316" };
    return { label:"F", color:"#EF4444" };
  };
  const filtered = submissions.filter(s =>
    filterStatus==="ALL" || (filterStatus==="GRADED" ? s.status==="GRADED" : s.status!=="GRADED")
  );

  return (
    <div>
      <Card style={{ marginBottom:16 }}>
        <Select label="Select Assignment to Grade" value={selectedId} onChange={e => loadSubs(e.target.value)}
          options={[{ value:"", label:"— Choose assignment —" }, ...assignments.map(a => ({ value:String(a.id), label:`${a.title} · Max:${a.maxMarks||100}` }))]} />
      </Card>

      {selectedId && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:16 }}>
          <StatCard icon="📋" label="Total"   value={total}  color={T.primaryL} />
          <StatCard icon="⏳" label="Pending" value={total-graded} color={T.accentY} />
          <StatCard icon="✅" label="Graded"  value={graded} color={T.accentG} />
          <StatCard icon="📊" label="Progress" value={total?`${Math.round(graded/total*100)}%`:"—"} color={T.accent} />
        </div>
      )}

      {selectedId && total > 0 && (
        <div style={{ display:"flex", gap:6, marginBottom:14 }}>
          {["ALL","PENDING","GRADED"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding:"6px 14px", borderRadius:20, fontSize:12, fontWeight:700, cursor:"pointer",
                border:`1px solid ${filterStatus===f ? T.primary : T.border}`,
                background: filterStatus===f ? T.primary : "transparent",
                color: filterStatus===f ? "#fff" : T.muted }}>
              {f==="ALL" ? `All (${total})` : f==="PENDING" ? `Pending (${total-graded})` : `Graded (${graded})`}
            </button>
          ))}
        </div>
      )}

      <Card>
        <div style={{ fontFamily:"Syne", fontWeight:700, marginBottom:16 }}>
          {!selectedId ? "Select an assignment above to begin grading" : subsLoading ? "Loading…" : `Submissions (${filtered.length})`}
        </div>
        {!selectedId ? (
          <div style={{ padding:"32px 0", textAlign:"center", color:T.muted }}>
            <div style={{ fontSize:40, marginBottom:10 }}>⭐</div>
            <div>Choose an assignment from above to start grading.</div>
          </div>
        ) : subsLoading ? <div style={{ padding:24, textAlign:"center", color:T.muted }}>Loading…</div>
        : filtered.length === 0 ? <div style={{ padding:24, textAlign:"center", color:T.muted }}>No submissions {filterStatus!=="ALL" ? "matching filter" : "yet"}.</div>
        : (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {filtered.map(s => {
              const isGraded  = s.status==="GRADED" && !editMode[s.id];
              const g         = grading[s.id] || {};
              const band      = isGraded ? gradeBand(s.marksObtained, maxMarks) : null;
              
              // Calculate late indicator
              const isLate = s.late || s.status === "LATE";
              const penaltyDeduction = isLate ? (selAsgn?.latePenalty || 0) : 0;
              const suggestedMax = isLate ? maxMarks * (1 - penaltyDeduction / 100) : maxMarks;

              return (
                <div key={s.id} style={{ background:T.bg3, border:`1px solid ${isGraded?"rgba(16,185,129,.2)":T.border}`,
                  borderRadius:12, padding:"16px 18px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom: !isGraded?14:0 }}>
                    <Avatar name={s.student?.name||"S"} size={34} />
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{ fontWeight:700, fontSize:13 }}>{s.student?.name||"—"}</div>
                        {isLate && <Badge type="danger">LATE (-{penaltyDeduction}%)</Badge>}
                        {s.status === "RESUBMISSION_REQUESTED" && <Badge type="warning">Resubmission Requested</Badge>}
                      </div>
                      <div style={{ fontSize:11, color:T.muted }}>
                        {s.student?.userId} · {s.submittedAt ? new Date(s.submittedAt).toLocaleString("en-IN",{dateStyle:"short",timeStyle:"short"}) : "—"}
                      </div>
                    </div>
                    {isGraded && band && (
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{ textAlign:"right" }}>
                          <div style={{ fontSize:20, fontWeight:900, color:band.color }}>{s.marksObtained}<span style={{ fontSize:11, color:T.muted }}>/{maxMarks}</span></div>
                        </div>
                        <div style={{ width:36, height:36, borderRadius:"50%", background:band.color+"22",
                          border:`2px solid ${band.color}`, display:"flex", alignItems:"center", justifyContent:"center",
                          fontWeight:900, fontSize:12, color:band.color }}>{band.label}</div>
                      </div>
                    )}
                    <div style={{ display:"flex", gap:6 }}>
                      <Btn size="xs" variant="ghost" onClick={() => setViewSub(s)}>👁 View</Btn>
                      {isGraded && <Btn size="xs" variant="ghost" onClick={() => {
                        setGrading(gv => ({ ...gv, [s.id]: { marks:s.marksObtained??"", feedback:s.teacherFeedback??"" } }));
                        setEditMode(v => ({ ...v, [s.id]:true }));
                      }}>✏️ Re-grade</Btn>}
                      {s.status !== "RESUBMISSION_REQUESTED" && (
                        <Btn size="xs" variant="ghost" onClick={() => handleRequestResubmission(s.id)}>🔄 Request Resubmit</Btn>
                      )}
                    </div>
                  </div>
                  {!isGraded && (
                    <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop: 10 }}>
                      {isLate && (
                        <div style={{ fontSize:12, color:"#EF4444", background:"rgba(239,68,68,0.1)", padding:"6px 12px", borderRadius:6 }}>
                          ⚠️ Late Submission. Due to late penalty ({penaltyDeduction}%), maximum suggested score is {suggestedMax.toFixed(0)} / {maxMarks}.
                        </div>
                      )}
                      <div style={{ display:"grid", gridTemplateColumns:"110px 1fr auto", gap:10, alignItems:"flex-end" }}>
                        <div>
                          <div style={{ fontSize:10, color:T.muted, marginBottom:4, fontWeight:700 }}>SCORE /{maxMarks}</div>
                          <input type="number" min={0} max={maxMarks} placeholder={`0–${maxMarks}`}
                            value={g.marks??""} onChange={e => setGrading(gv => ({ ...gv, [s.id]:{ ...gv[s.id], marks:e.target.value } }))}
                            style={{ width:"100%", background:T.bg2, border:`1px solid ${T.border}`, borderRadius:7,
                              padding:"7px 10px", fontSize:14, color:T.text, fontWeight:700, boxSizing:"border-box", outline:"none" }} />
                        </div>
                        <div>
                          <div style={{ fontSize:10, color:T.muted, marginBottom:4, fontWeight:700 }}>FEEDBACK</div>
                          <input placeholder="Feedback for student…" value={g.feedback??""}
                            onChange={e => setGrading(gv => ({ ...gv, [s.id]:{ ...gv[s.id], feedback:e.target.value } }))}
                            style={{ width:"100%", background:T.bg2, border:`1px solid ${T.border}`, borderRadius:7,
                              padding:"7px 10px", fontSize:13, color:T.text, boxSizing:"border-box", outline:"none" }} />
                        </div>
                        <Btn variant={saved[s.id]?"success":"primary"} size="sm"
                          onClick={() => handleGrade(s.id, maxMarks)} style={{ whiteSpace:"nowrap", minWidth:100 }}>
                          {saving[s.id] ? "Saving…" : saved[s.id] ? "✓ Saved!" : "Save Grade"}
                        </Btn>
                      </div>
                    </div>
                  )}
                  {isGraded && s.teacherFeedback && (
                    <div style={{ marginTop:10, fontSize:12, color:T.muted, background:T.bg2,
                      borderRadius:6, padding:"6px 12px", borderLeft:`3px solid ${T.accentG}` }}>
                      💬 {s.teacherFeedback}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Modal open={!!viewSub} onClose={() => setViewSub(null)} title={`Submission — ${viewSub?.student?.name||""}`}>
        {viewSub && (
          <div>
            <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
              <Badge type="primary">{viewSub.assignment?.title||"—"}</Badge>
              {viewSub.status==="GRADED" && <Badge type="success">Graded: {viewSub.marksObtained}/{maxMarks}</Badge>}
            </div>
            {viewSub.studentNote && (
              <div style={{ background: T.bg2, padding: 10, borderRadius: 8, fontSize: 12, marginBottom: 10 }}>
                <strong>Student Note:</strong> {viewSub.studentNote}
              </div>
            )}
            <div style={{ background:T.bg3, borderRadius:10, padding:18, fontSize:13, lineHeight:1.75,
              maxHeight:360, overflowY:"auto", border:`1px solid ${T.border}`, whiteSpace:"pre-wrap" }}>
              {viewSub.content||"No text content."}
            </div>
            {viewSub.fileUrl && (
              <div style={{ marginTop: 12 }}>
                <strong style={{ fontSize: 12, color: T.muted, display: "block", marginBottom: 4 }}>Attached files:</strong>
                {viewSub.fileUrl.split(",").filter(Boolean).map((u, i) => {
                  const namePart = u.substring(u.lastIndexOf("/") + 1);
                  const cleanName = namePart.includes("_") ? namePart.substring(namePart.indexOf("_") + 1) : namePart;
                  // Handle absolute or relative URLs
                  const fileLink = u.startsWith("/") ? `http://localhost:8080${u}` : u;
                  return (
                    <a key={i} href={fileLink} target="_blank" rel="noreferrer"
                      style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, color: T.accent, fontSize: 13, textDecoration: "underline" }}
                      onMouseOver={e => e.currentTarget.style.color = T.primary}
                      onMouseOut={e => e.currentTarget.style.color = T.accent}>
                      📎 {cleanName}
                    </a>
                  );
                })}
              </div>
            )}
            {viewSub.externalLink && <a href={viewSub.externalLink} target="_blank" rel="noreferrer"
              style={{ display:"block", marginTop:10, color:T.accent, fontSize:13 }}>🔗 External submission link</a>}
          </div>
        )}
      </Modal>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// ASSESSMENT SECTION
// ══════════════════════════════════════════════════════════════════════════════
function AssessmentSection({ course }) {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [currentAssessment, setCurrentAssessment] = useState(null);
  
  // Wizard state
  const [wizardStep, setWizardStep] = useState(1);
  const [detailsForm, setDetailsForm] = useState({
    title: "",
    assessmentType: "MCQ",
    totalMarks: 100,
    passMarks: 40,
    durationMinutes: 60,
    instructions: "",
    startDate: "",
    endDate: "",
    showResultImmediately: true,
    tabSwitchLimit: 3
  });

  // Question Form State
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [questionForm, setQuestionForm] = useState({
    questionText: "",
    questionType: "MCQ",
    options: ["", "", "", ""],
    correctAnswer: "",
    marks: 10,
    difficulty: "EASY"
  });

  // Question list for selected/created assessment
  const [questions, setQuestions] = useState([]);
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);

  // Submissions State
  const [submissions, setSubmissions] = useState([]);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showGradingModal, setShowGradingModal] = useState(false);
  const [gradesInput, setGradesInput] = useState({});

  // Question Bank
  const [bankQuestions, setBankQuestions] = useState([]);
  const [bankSearch, setBankSearch] = useState("");
  const [showBankImport, setShowBankImport] = useState(false);

  useEffect(() => {
    loadAssessments();
  }, [course.id]);

  const loadAssessments = async () => {
    setLoading(true);
    try {
      const res = await getTeacherAssessments(course.id);
      setAssessments(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssessment = async () => {
    if (!detailsForm.title.trim()) { alert("Title is required"); return; }
    try {
      const payload = {
        ...detailsForm,
        courseId: course.id,
        status: "DRAFT"
      };
      const res = await createAssessment(payload);
      setCurrentAssessment(res);
      setWizardStep(2);
      loadAssessments();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleUpdateAssessmentStatus = async (assessment, status) => {
    try {
      await updateAssessment(assessment.id, { ...assessment, status });
      loadAssessments();
      alert(`Assessment is now ${status}`);
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleLoadQuestions = async (assessment) => {
    setCurrentAssessment(assessment);
    try {
      const res = await getAssessmentQuestions(assessment.id);
      setQuestions(Array.isArray(res) ? res : []);
      setShowQuestionsModal(true);
    } catch (err) {
      alert("Error loading questions: " + err.message);
    }
  };

  const handleAddQuestion = async () => {
    if (!questionForm.questionText.trim()) { alert("Question text required"); return; }
    try {
      let optionsJson = null;
      if (questionForm.questionType === "MCQ") {
        optionsJson = JSON.stringify(questionForm.options.filter(o => o.trim() !== ""));
      } else if (questionForm.questionType === "TRUE_FALSE") {
        optionsJson = JSON.stringify(["True", "False"]);
      }
      
      const payload = {
        questionText: questionForm.questionText,
        questionType: questionForm.questionType,
        optionsJson,
        correctAnswer: questionForm.correctAnswer,
        marks: Number(questionForm.marks),
        difficulty: questionForm.difficulty
      };
      
      await addAssessmentQuestion(currentAssessment.id, payload);
      const updated = await getAssessmentQuestions(currentAssessment.id);
      setQuestions(Array.isArray(updated) ? updated : []);
      setShowAddQuestion(false);
      setQuestionForm({
        questionText: "",
        questionType: "MCQ",
        options: ["", "", "", ""],
        correctAnswer: "",
        marks: 10,
        difficulty: "EASY"
      });
      alert("Question added!");
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleDeleteQuestion = async (qId) => {
    if (!window.confirm("Delete this question?")) return;
    try {
      await deleteAssessmentQuestion(currentAssessment.id, qId);
      const updated = await getAssessmentQuestions(currentAssessment.id);
      setQuestions(Array.isArray(updated) ? updated : []);
    } catch (err) {
      alert("Error deleting question: " + err.message);
    }
  };

  const handleViewSubmissions = async (assessment) => {
    setCurrentAssessment(assessment);
    try {
      const res = await getAssessmentSubmissions(assessment.id);
      setSubmissions(Array.isArray(res) ? res : []);
      setShowSubmissionsModal(true);
    } catch (err) {
      alert("Error loading submissions: " + err.message);
    }
  };

  const handleOpenGrading = (attempt) => {
    setSelectedSubmission(attempt);
    const init = {};
    if (attempt.answers) {
      attempt.answers.forEach(ans => {
        init[ans.id] = {
          score: ans.marksObtained !== null ? ans.marksObtained : "",
          feedback: ans.teacherFeedback || ""
        };
      });
    }
    setGradesInput(init);
    setShowGradingModal(true);
  };

  const handleSaveGrade = async (answerId) => {
    const data = gradesInput[answerId];
    if (!data || data.score === "") { alert("Enter a grade score"); return; }
    try {
      await gradeAssessmentAnswer(selectedSubmission.id, answerId, {
        marksObtained: Number(data.score),
        teacherFeedback: data.feedback
      });
      alert("Grade saved successfully!");
      const updatedSubs = await getAssessmentSubmissions(currentAssessment.id);
      setSubmissions(Array.isArray(updatedSubs) ? updatedSubs : []);
      const refreshed = updatedSubs.find(s => s.id === selectedSubmission.id);
      if (refreshed) {
        setSelectedSubmission(refreshed);
      }
    } catch (err) {
      alert("Error saving grade: " + err.message);
    }
  };

  const handlePublishResults = async (assessmentId) => {
    if (!window.confirm("Publish results for this assessment? This will notify students and parents.")) return;
    try {
      await publishAssessmentResults(assessmentId);
      alert("Results published successfully!");
      loadAssessments();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleLoadQuestionBank = async () => {
    try {
      const data = await getQuestionBank(course.id);
      setBankQuestions(Array.isArray(data) ? data : []);
      setShowBankImport(true);
    } catch (err) {
      alert("Error loading question bank: " + err.message);
    }
  };

  const handleImportQuestion = async (bankQ) => {
    try {
      const payload = {
        questionText: bankQ.questionText,
        questionType: bankQ.questionType,
        optionsJson: bankQ.optionsJson,
        correctAnswer: bankQ.correctAnswer,
        marks: bankQ.marks,
        difficulty: bankQ.difficulty
      };
      await addAssessmentQuestion(currentAssessment.id, payload);
      const updated = await getAssessmentQuestions(currentAssessment.id);
      setQuestions(Array.isArray(updated) ? updated : []);
      alert("Imported successfully!");
    } catch (err) {
      alert("Error importing: " + err.message);
    }
  };

  const inputSty = {
    width: "100%",
    background: T.bg3,
    border: `1px solid ${T.border}`,
    borderRadius: 8,
    padding: "9px 12px",
    fontSize: 13,
    color: T.text,
    boxSizing: "border-box",
    outline: "none"
  };

  const analyticsData = (() => {
    const scores = submissions
      .filter(s => s.status === "GRADED")
      .map(s => s.totalScore || 0);

    if (scores.length === 0) return [];
    
    const brackets = {
      "0-39 (F)": 0,
      "40-59 (C)": 0,
      "60-79 (B)": 0,
      "80-100 (A)": 0
    };

    scores.forEach(s => {
      if (s < 40) brackets["0-39 (F)"]++;
      else if (s < 60) brackets["40-59 (C)"]++;
      else if (s < 80) brackets["60-79 (B)"]++;
      else brackets["80-100 (A)"]++;
    });

    return Object.entries(brackets).map(([range, count]) => ({
      range,
      count
    }));
  })();

  const stats = (() => {
    const scores = submissions
      .filter(s => s.status === "GRADED")
      .map(s => s.totalScore || 0);
    if (scores.length === 0) return { avg: 0, max: 0, min: 0, passRate: 0 };
    const sum = scores.reduce((a, b) => a + b, 0);
    const avg = sum / scores.length;
    const max = Math.max(...scores);
    const min = Math.min(...scores);
    const passMarks = currentAssessment?.passMarks || 40;
    const passed = scores.filter(s => s >= passMarks).length;
    const passRate = (passed / scores.length) * 100;
    return { avg, max, min, passRate };
  })();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 20, margin: 0 }}>⚡ Assessments</h2>
          <p style={{ fontSize: 12, color: T.muted, margin: "4px 0 0 0" }}>Create and manage MCQ, descriptive, or mixed assessments with anti-cheat &amp; auto-grading</p>
        </div>
        <Btn variant="primary" onClick={() => {
          setWizardStep(1);
          setShowCreate(true);
        }}>+ Create Assessment</Btn>
      </div>

      {loading ? (
        <Card><div style={{ textAlign: "center", padding: 30, color: T.muted }}>Loading assessments...</div></Card>
      ) : assessments.length === 0 ? (
        <Card style={{ padding: 40, textAlign: "center", color: T.muted }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>⚡</div>
          <div>No assessments created yet for this course. Click "+ Create Assessment" to start.</div>
        </Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {assessments.map(a => (
            <Card key={a.id} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <Badge type={a.status === "PUBLISHED" ? "success" : "ghost"}>{a.status}</Badge>
                  <span style={{ fontSize: 11, color: T.muted }}>{a.assessmentType}</span>
                </div>
                <h4 style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 15, margin: 0, color: T.text }}>{a.title}</h4>
                <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 12, color: T.muted }}>
                  <span>⏱ {a.durationMinutes} mins</span>
                  <span>🎯 Pass: {a.passMarks}/{a.totalMarks}</span>
                </div>
                {a.startDate && (
                  <div style={{ fontSize: 11, color: T.muted, marginTop: 6 }}>
                    📅 {new Date(a.startDate).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })} - {new Date(a.endDate).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: "auto" }}>
                <Btn size="xs" variant="ghost" onClick={() => handleLoadQuestions(a)}>❓ Questions</Btn>
                <Btn size="xs" variant="ghost" onClick={() => handleViewSubmissions(a)}>👁 Submissions</Btn>
                {a.status === "DRAFT" ? (
                  <Btn size="xs" variant="primary" onClick={() => handleUpdateAssessmentStatus(a, "PUBLISHED")}>🚀 Publish</Btn>
                ) : (
                  <>
                    {!a.resultsPublished && (
                      <Btn size="xs" variant="success" onClick={() => handlePublishResults(a.id)}>📢 Publish Scores</Btn>
                    )}
                    <Btn size="xs" variant="ghost" onClick={() => handleUpdateAssessmentStatus(a, "DRAFT")}>Revert to Draft</Btn>
                  </>
                )}
                <Btn size="xs" variant="danger" onClick={async () => {
                  if (window.confirm("Delete this assessment?")) {
                    await deleteAssessment(a.id);
                    loadAssessments();
                  }
                }}>🗑</Btn>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create New Assessment" size="lg">
        {wizardStep === 1 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 4, display: "block" }}>TITLE</label>
                <input type="text" style={inputSty} value={detailsForm.title} onChange={e => setDetailsForm({ ...detailsForm, title: e.target.value })} placeholder="e.g. Unit 1 Quiz" />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 4, display: "block" }}>TYPE</label>
                <select style={inputSty} value={detailsForm.assessmentType} onChange={e => setDetailsForm({ ...detailsForm, assessmentType: e.target.value })}>
                  <option value="MCQ">MCQ (Auto-graded)</option>
                  <option value="TRUE_FALSE">True / False (Auto-graded)</option>
                  <option value="FILL_IN_BLANKS">Fill in the Blanks (Auto-graded)</option>
                  <option value="DESCRIPTIVE">Descriptive (Manual Grading)</option>
                  <option value="MIXED">Mixed (Hybrid Auto &amp; Manual)</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 4, display: "block" }}>TOTAL MARKS</label>
                <input type="number" style={inputSty} value={detailsForm.totalMarks} onChange={e => setDetailsForm({ ...detailsForm, totalMarks: Number(e.target.value) })} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 4, display: "block" }}>PASS MARKS</label>
                <input type="number" style={inputSty} value={detailsForm.passMarks} onChange={e => setDetailsForm({ ...detailsForm, passMarks: Number(e.target.value) })} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 4, display: "block" }}>DURATION (MINUTES)</label>
                <input type="number" style={inputSty} value={detailsForm.durationMinutes} onChange={e => setDetailsForm({ ...detailsForm, durationMinutes: Number(e.target.value) })} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 4, display: "block" }}>START DATE/TIME</label>
                <input type="datetime-local" style={inputSty} value={detailsForm.startDate} onChange={e => setDetailsForm({ ...detailsForm, startDate: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 4, display: "block" }}>END DATE/TIME</label>
                <input type="datetime-local" style={inputSty} value={detailsForm.endDate} onChange={e => setDetailsForm({ ...detailsForm, endDate: e.target.value })} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 4, display: "block" }}>INSTRUCTIONS</label>
              <textarea style={{ ...inputSty, height: 80, resize: "none" }} value={detailsForm.instructions} onChange={e => setDetailsForm({ ...detailsForm, instructions: e.target.value })} placeholder="Enter assessment guidelines..." />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 18 }}>
                <input type="checkbox" checked={detailsForm.showResultImmediately} onChange={e => setDetailsForm({ ...detailsForm, showResultImmediately: e.target.checked })} />
                <span style={{ fontSize: 12, color: T.text }}>Show Results Immediately</span>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 4, display: "block" }}>TAB SWITCH LIMIT (ANTI-CHEAT)</label>
                <input type="number" style={inputSty} value={detailsForm.tabSwitchLimit} onChange={e => setDetailsForm({ ...detailsForm, tabSwitchLimit: Number(e.target.value) })} />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
              <Btn variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Btn>
              <Btn variant="primary" onClick={handleCreateAssessment}>Next: Add Questions →</Btn>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: T.bg3, padding: 12, borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: 12, color: T.muted }}>ASSESSMENT</span>
                <div style={{ fontWeight: 700 }}>{currentAssessment?.title}</div>
              </div>
              <Btn variant="ghost" size="sm" onClick={handleLoadQuestionBank}>📚 Import from Question Bank</Btn>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {questions.map((q, idx) => (
                <div key={q.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: T.bg2, borderRadius: 8, border: `1px solid ${T.border}` }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 12, marginRight: 8 }}>Q{idx + 1}.</span>
                    <span style={{ fontSize: 13 }}>{q.questionText}</span>
                    <span style={{ fontSize: 11, color: T.muted, marginLeft: 10 }}>({q.questionType} · {q.marks} Marks)</span>
                  </div>
                  <Btn size="xs" variant="danger" onClick={() => handleDeleteQuestion(q.id)}>🗑</Btn>
                </div>
              ))}
            </div>

            <Btn variant="ghost" onClick={() => setShowAddQuestion(true)}>+ Add Question manually</Btn>

            {showAddQuestion && (
              <Card style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10, border: `1px dashed ${T.primary}` }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, marginBottom: 4, display: "block" }}>QUESTION TEXT</label>
                  <input type="text" style={inputSty} value={questionForm.questionText} onChange={e => setQuestionForm({ ...questionForm, questionText: e.target.value })} placeholder="Enter question..." />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 4 }}>TYPE</label>
                    <select style={inputSty} value={questionForm.questionType} onChange={e => setQuestionForm({ ...questionForm, questionType: e.target.value })}>
                      <option value="MCQ">Multiple Choice (MCQ)</option>
                      <option value="TRUE_FALSE">True / False</option>
                      <option value="FILL_IN_BLANKS">Fill in the Blanks</option>
                      <option value="DESCRIPTIVE">Descriptive</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 4 }}>MARKS</label>
                    <input type="number" style={inputSty} value={questionForm.marks} onChange={e => setQuestionForm({ ...questionForm, marks: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 4 }}>DIFFICULTY</label>
                    <select style={inputSty} value={questionForm.difficulty} onChange={e => setQuestionForm({ ...questionForm, difficulty: e.target.value })}>
                      <option value="EASY">Easy</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HARD">Hard</option>
                    </select>
                  </div>
                </div>

                {questionForm.questionType === "MCQ" && (
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 4 }}>MCQ OPTIONS</label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {questionForm.options.map((opt, i) => (
                        <input key={i} type="text" style={inputSty} value={opt} onChange={e => {
                          const copy = [...questionForm.options];
                          copy[i] = e.target.value;
                          setQuestionForm({ ...questionForm, options: copy });
                        }} placeholder={`Option ${i + 1}`} />
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 4 }}>CORRECT ANSWER</label>
                  <input type="text" style={inputSty} value={questionForm.correctAnswer} onChange={e => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })} placeholder="Enter correct answer value..." />
                </div>

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 6 }}>
                  <Btn variant="ghost" size="sm" onClick={() => setShowAddQuestion(false)}>Cancel</Btn>
                  <Btn variant="primary" size="sm" onClick={handleAddQuestion}>Save Question</Btn>
                </div>
              </Card>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
              <Btn variant="primary" onClick={() => {
                setShowCreate(false);
                loadAssessments();
              }}>Finish Wizard &amp; Save Draft</Btn>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={showBankImport} onClose={() => setShowBankImport(false)} title="Import from Question Bank">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input type="text" style={inputSty} placeholder="Search by topic/subject..." value={bankSearch} onChange={e => setBankSearch(e.target.value)} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 300, overflowY: "auto" }}>
            {bankQuestions
              .filter(q => q.questionText.toLowerCase().includes(bankSearch.toLowerCase()))
              .map(q => (
                <div key={q.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 10, background: T.bg3, borderRadius: 8, border: `1px solid ${T.border}` }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{q.questionText}</div>
                    <div style={{ fontSize: 11, color: T.muted }}>Type: {q.questionType} · Difficulty: {q.difficulty}</div>
                  </div>
                  <Btn size="xs" variant="primary" onClick={() => handleImportQuestion(q)}>Import</Btn>
                </div>
              ))}
          </div>
        </div>
      </Modal>

      <Modal open={showQuestionsModal} onClose={() => setShowQuestionsModal(false)} title="Manage Questions" size="lg">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontWeight: 700 }}>Assessment: {currentAssessment?.title}</div>
            <Btn size="sm" variant="primary" onClick={handleLoadQuestionBank}>📚 Import from Bank</Btn>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 300, overflowY: "auto" }}>
            {questions.map((q, idx) => (
              <div key={q.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: T.bg2, borderRadius: 8 }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 12 }}>Q{idx + 1}.</span> {q.questionText}
                  <span style={{ fontSize: 11, color: T.muted, marginLeft: 8 }}>({q.questionType} · {q.marks} Marks)</span>
                </div>
                <Btn size="xs" variant="danger" onClick={() => handleDeleteQuestion(q.id)}>🗑</Btn>
              </div>
            ))}
          </div>

          <Btn variant="ghost" onClick={() => {
            setQuestionForm({
              questionText: "",
              questionType: "MCQ",
              options: ["", "", "", ""],
              correctAnswer: "",
              marks: 10,
              difficulty: "EASY"
            });
            setShowAddQuestion(true);
          }}>+ Add Question manually</Btn>

          {showAddQuestion && (
            <Card style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <input type="text" style={inputSty} value={questionForm.questionText} onChange={e => setQuestionForm({ ...questionForm, questionText: e.target.value })} placeholder="Question text..." />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <select style={inputSty} value={questionForm.questionType} onChange={e => setQuestionForm({ ...questionForm, questionType: e.target.value })}>
                  <option value="MCQ">MCQ</option>
                  <option value="TRUE_FALSE">True / False</option>
                  <option value="FILL_IN_BLANKS">Fill in the Blanks</option>
                  <option value="DESCRIPTIVE">Descriptive</option>
                </select>
                <input type="number" style={inputSty} value={questionForm.marks} onChange={e => setQuestionForm({ ...questionForm, marks: Number(e.target.value) })} />
                <select style={inputSty} value={questionForm.difficulty} onChange={e => setQuestionForm({ ...questionForm, difficulty: e.target.value })}>
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>
              {questionForm.questionType === "MCQ" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {questionForm.options.map((opt, i) => (
                    <input key={i} type="text" style={inputSty} value={opt} onChange={e => {
                      const copy = [...questionForm.options];
                      copy[i] = e.target.value;
                      setQuestionForm({ ...questionForm, options: copy });
                    }} placeholder={`Option ${i + 1}`} />
                  ))}
                </div>
              )}
              <input type="text" style={inputSty} value={questionForm.correctAnswer} onChange={e => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })} placeholder="Correct answer..." />
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <Btn size="sm" variant="ghost" onClick={() => setShowAddQuestion(false)}>Cancel</Btn>
                <Btn size="sm" variant="primary" onClick={handleAddQuestion}>Add</Btn>
              </div>
            </Card>
          )}
        </div>
      </Modal>

      <Modal open={showSubmissionsModal} onClose={() => setShowSubmissionsModal(false)} title="Assessment Submissions" size="xl">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {submissions.filter(s => s.status === "GRADED").length > 0 && (
            <Card style={{ padding: 18, background: T.bg3, border: `1px solid ${T.border}` }}>
              <div style={{ fontFamily: "Syne", fontWeight: 700, marginBottom: 12 }}>📈 Performance Analytics</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 20 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ background: T.bg2, padding: 10, borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: T.muted }}>AVERAGE SCORE</div>
                    <div style={{ fontSize: 18, fontWeight: 800 }}>{stats.avg.toFixed(1)}</div>
                  </div>
                  <div style={{ background: T.bg2, padding: 10, borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: T.muted }}>HIGHEST / LOWEST</div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{stats.max} / {stats.min}</div>
                  </div>
                  <div style={{ background: T.bg2, padding: 10, borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: T.muted }}>PASS RATE</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: T.accentG }}>{stats.passRate.toFixed(1)}%</div>
                  </div>
                </div>
                <div style={{ height: 160 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="range" stroke={T.muted} fontSize={10} />
                      <YAxis stroke={T.muted} fontSize={10} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: T.bg3, border: `1px solid ${T.border}` }} />
                      <Bar dataKey="count" fill={T.primary}>
                        {analyticsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.range.includes("F") ? "#EF4444" : T.primary} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Card>
          )}

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ padding: "10px 14px", fontSize: 11, fontWeight: 800, color: T.muted, textTransform: "uppercase", borderBottom: `1px solid ${T.border}`, textAlign: "left" }}>Student</th>
                <th style={{ padding: "10px 14px", fontSize: 11, fontWeight: 800, color: T.muted, textTransform: "uppercase", borderBottom: `1px solid ${T.border}`, textAlign: "left" }}>Status</th>
                <th style={{ padding: "10px 14px", fontSize: 11, fontWeight: 800, color: T.muted, textTransform: "uppercase", borderBottom: `1px solid ${T.border}`, textAlign: "left" }}>Score</th>
                <th style={{ padding: "10px 14px", fontSize: 11, fontWeight: 800, color: T.muted, textTransform: "uppercase", borderBottom: `1px solid ${T.border}`, textAlign: "left" }}>Started At</th>
                <th style={{ padding: "10px 14px", fontSize: 11, fontWeight: 800, color: T.muted, textTransform: "uppercase", borderBottom: `1px solid ${T.border}`, textAlign: "left" }}>Submitted At</th>
                <th style={{ padding: "10px 14px", fontSize: 11, fontWeight: 800, color: T.muted, textTransform: "uppercase", borderBottom: `1px solid ${T.border}`, textAlign: "left" }}>Tab Switches</th>
                <th style={{ padding: "10px 14px", fontSize: 11, fontWeight: 800, color: T.muted, textTransform: "uppercase", borderBottom: `1px solid ${T.border}`, textAlign: "left" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map(s => (
                <tr key={s.id}>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ fontWeight: 700 }}>{s.studentName}</div>
                    <div style={{ fontSize: 11, color: T.muted }}>{s.studentEmail}</div>
                  </td>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${T.border}` }}><Badge type={s.status === "GRADED" ? "success" : s.status === "SUBMITTED" ? "primary" : "ghost"}>{s.status}</Badge></td>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${T.border}` }}><span style={{ fontWeight: 700 }}>{s.totalScore !== null ? `${s.totalScore} / ${currentAssessment?.totalMarks}` : "—"}</span></td>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${T.border}` }}><span style={{ fontSize: 11 }}>{s.startedAt ? new Date(s.startedAt).toLocaleString("en-IN", { timeStyle: "short", dateStyle: "short" }) : "—"}</span></td>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${T.border}` }}><span style={{ fontSize: 11 }}>{s.submittedAt ? new Date(s.submittedAt).toLocaleString("en-IN", { timeStyle: "short", dateStyle: "short" }) : "—"}</span></td>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${T.border}` }}>
                    <span style={{ color: s.tabSwitchCount > (currentAssessment?.tabSwitchLimit || 99) ? "#EF4444" : T.text, fontWeight: 700 }}>
                      ⚠️ {s.tabSwitchCount || 0}
                    </span>
                  </td>
                  <td style={{ padding: "10px 14px", borderBottom: `1px solid ${T.border}` }}>
                    <Btn size="xs" variant="primary" onClick={() => handleOpenGrading(s)}>Evaluate</Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      <Modal open={showGradingModal} onClose={() => setShowGradingModal(false)} title={`Evaluation: ${selectedSubmission?.studentName}`} size="xl">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", background: T.bg3, padding: 12, borderRadius: 8 }}>
            <div>
              <span style={{ fontSize: 11, color: T.muted }}>STUDENT</span>
              <div style={{ fontWeight: 700 }}>{selectedSubmission?.studentName}</div>
            </div>
            <div>
              <span style={{ fontSize: 11, color: T.muted }}>TAB VIOLATIONS</span>
              <div style={{ fontWeight: 700, color: selectedSubmission?.tabSwitchCount > (currentAssessment?.tabSwitchLimit || 99) ? "#EF4444" : T.text }}>
                {selectedSubmission?.tabSwitchCount || 0} / {currentAssessment?.tabSwitchLimit} limit
              </div>
            </div>
            <div>
              <span style={{ fontSize: 11, color: T.muted }}>TOTAL SCORE</span>
              <div style={{ fontWeight: 900, fontSize: 16 }}>
                {(selectedSubmission && selectedSubmission.totalScore !== null) ? selectedSubmission.totalScore : "—"} / {currentAssessment?.totalMarks}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16, maxHeight: 400, overflowY: "auto" }}>
            {selectedSubmission?.answers?.map((ans, idx) => {
              const q = ans.question;
              const gInput = gradesInput[ans.id] || { score: "", feedback: "" };
              
              return (
                <Card key={ans.id} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div>
                      <span style={{ fontWeight: 700 }}>Q{idx + 1}. {q.questionText}</span>
                      <span style={{ fontSize: 11, color: T.muted, marginLeft: 10 }}>({q.questionType} · {q.marks} Marks)</span>
                    </div>
                    {ans.marksObtained !== null && (
                      <Badge type="success">Score: {ans.marksObtained} / {q.marks}</Badge>
                    )}
                  </div>

                  <div style={{ background: T.bg2, padding: 10, borderRadius: 8, fontSize: 13 }}>
                    <div style={{ color: T.muted, marginBottom: 4, fontSize: 11 }}>STUDENT RESPONSE:</div>
                    <div style={{ fontWeight: 700 }}>{ans.studentAnswer || "No response."}</div>
                  </div>

                  <div style={{ display: "flex", gap: 20, fontSize: 12, color: T.muted }}>
                    <span>Correct Answer: <strong style={{ color: T.accentG }}>{q.correctAnswer}</strong></span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "120px 1fr auto", gap: 12, alignItems: "flex-end", marginTop: 8 }}>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 4 }}>MARKS (max {q.marks})</label>
                      <input type="number" style={inputSty} value={gInput.score} onChange={e => setGradesInput({
                        ...gradesInput,
                        [ans.id]: { ...gInput, score: e.target.value }
                      })} placeholder={`0 - ${q.marks}`} />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 4 }}>TEACHER FEEDBACK</label>
                      <input type="text" style={inputSty} value={gInput.feedback} onChange={e => setGradesInput({
                        ...gradesInput,
                        [ans.id]: { ...gInput, feedback: e.target.value }
                      })} placeholder="Add remarks..." />
                    </div>
                    <Btn size="sm" variant="primary" onClick={() => handleSaveGrade(ans.id)}>Save Grade</Btn>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export const TeacherPerformance = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTeacherPerformanceReviews()
      .then(res => {
        setData(res?.data || res);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", color: T.muted }}>Loading evaluation metrics...</div>;
  }

  const avg = data?.averageRating != null ? Number(data.averageRating).toFixed(1) : "0.0";
  const count = data?.totalReviews || 0;
  const reviews = data?.reviews || [];

  return (
    <div className="fade-up">
      <PageHeader title="My Performance Evaluation" />
      <div className="lms-responsive-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18, marginBottom: 24 }}>
        <StatCard icon="⭐" label="Student Rating" value={`${avg} / 5`} color={T.accentY} />
        <StatCard icon="💬" label="Total Reviews" value={String(count)} color={T.accentG} />
        <StatCard icon="📚" label="Rating Level" value={avg >= 4.5 ? "Excellent" : avg >= 4.0 ? "Good" : avg >= 3.0 ? "Satisfactory" : "Needs Improvement"} color={T.primaryL} />
        <StatCard icon="✅" label="Verified Reviews" value={`${count} Students`} color={T.accent} />
      </div>
      <Card>
        <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 16, marginBottom: 16 }}>
          Student Feedback ({count} feedback)
        </div>
        {reviews.length === 0 ? (
          <div style={{ color: T.muted, textAlign: "center", padding: "20px 0", fontSize: 13 }}>
            No reviews or student feedback submitted yet.
          </div>
        ) : (
          reviews.map(f => (
            <div key={f.id} style={{ background: T.bg3, borderRadius: 12, padding: 16, marginBottom: 12 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
                <Avatar name={f.studentName} size={32} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{f.studentName}</div>
                  <div style={{ color: "#ffc107", fontSize: 14 }}>
                    {"★".repeat(f.rating) + "☆".repeat(5 - f.rating)}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 13, color: T.muted, fontStyle: "italic" }}>
                "{f.reviewText || "No feedback comments left."}"
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
};

export const TeacherMessages = () => {
  const [conversations, setConversations] = useState([]);
  const [activeParent,  setActiveParent]  = useState(null); // { parentId, parentName, parentEmail }
  const [messages,      setMessages]      = useState([]);
  const [draft,         setDraft]         = useState("");
  const [sending,       setSending]       = useState(false);
  const [searchQ,       setSearchQ]       = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching,     setSearching]     = useState(false);
  const [confirmParent, setConfirmParent] = useState(null); // parent to confirm start
  const [loadingMsgs,   setLoadingMsgs]   = useState(false);
  const bottomRef = React.useRef(null);
  const pollRef   = React.useRef(null);

  // Load existing conversations on mount
  useEffect(() => {
    getTeacherConversations().then(d => setConversations(Array.isArray(d) ? d : [])).catch(console.error);
  }, []);

  // Load messages when active parent changes, then poll
  useEffect(() => {
    if (!activeParent) return;
    loadMessages(activeParent.parentId);
    pollRef.current = setInterval(() => loadMessages(activeParent.parentId), 5000);
    return () => clearInterval(pollRef.current);
  }, [activeParent]);

  // Scroll to bottom when messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMessages = (parentId) => {
    setLoadingMsgs(true);
    getTeacherChatMessages(parentId)
      .then(d => setMessages(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoadingMsgs(false));
  };

  const openConversation = (conv) => {
    setActiveParent({ parentId: conv.parentId, parentName: conv.parentName, parentEmail: conv.parentEmail });
    setMessages([]);
  };

  // Search parents as teacher types
  useEffect(() => {
    if (!searchQ.trim()) { setSearchResults([]); return; }
    const t = setTimeout(() => {
      setSearching(true);
      searchParentsForChat(searchQ)
        .then(d => setSearchResults(Array.isArray(d) ? d : []))
        .catch(console.error)
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(t);
  }, [searchQ]);

  const handleStartConversation = () => {
    if (!confirmParent) return;
    const already = conversations.find(c => c.parentId === confirmParent.id);
    if (!already) {
      setConversations(prev => [...prev, {
        parentId: confirmParent.id,
        parentName: confirmParent.name,
        parentEmail: confirmParent.email,
        unread: 0,
      }]);
    }
    setActiveParent({ parentId: confirmParent.id, parentName: confirmParent.name, parentEmail: confirmParent.email });
    setMessages([]);
    setConfirmParent(null);
    setSearchQ("");
    setSearchResults([]);
  };

  const handleSend = async () => {
    if (!draft.trim() || !activeParent) return;
    setSending(true);
    try {
      await sendTeacherMessage(activeParent.parentId, draft.trim());
      setDraft("");
      loadMessages(activeParent.parentId);
    } catch (err) { alert("Error: " + err.message); }
    finally { setSending(false); }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="fade-up">
      <PageHeader title="Messages" subtitle="Direct communication with parents" />
      <div className="lms-responsive-split-2-1" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, alignItems: "start" }}>

        {/* ── Chat Panel ── */}
        <Card style={{ padding: 0, overflow: "hidden" }}>
          {!activeParent ? (
            <div style={{ padding: 48, textAlign: "center", color: T.muted }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>💬</div>
              <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 16, marginBottom: 6 }}>No conversation selected</div>
              <div style={{ fontSize: 13 }}>Search for a parent on the right or click a conversation to start chatting.</div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 12, background: T.bg3 }}>
                <Avatar name={activeParent.parentName} size={36} color={T.accent} />
                <div>
                  <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 14 }}>{activeParent.parentName}</div>
                  <div style={{ fontSize: 11, color: T.muted }}>Parent · {activeParent.parentEmail || ""}</div>
                </div>
              </div>

              {/* Messages */}
              <div style={{ padding: 16, minHeight: 280, maxHeight: 380, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
                {loadingMsgs && messages.length === 0 ? (
                  <div style={{ textAlign: "center", color: T.muted, padding: 24, fontSize: 13 }}>Loading…</div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: "center", color: T.muted, padding: 24, fontSize: 13 }}>No messages yet. Say hello! 👋</div>
                ) : messages.map(msg => {
                  const isMe = msg.senderRole === "TEACHER";
                  return (
                    <div key={msg.id} style={{ display: "flex", gap: 8, justifyContent: isMe ? "flex-end" : "flex-start", alignItems: "flex-end" }}>
                      {!isMe && <Avatar name={activeParent.parentName} size={28} color={T.accent} />}
                      <div style={{ maxWidth: "70%" }}>
                        <div style={{
                          background: isMe ? T.primary : T.card2 || T.bg3,
                          borderRadius: isMe ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                          padding: "10px 14px", fontSize: 13, lineHeight: 1.5,
                          color: isMe ? "#fff" : T.text,
                        }}>{msg.content}</div>
                        <div style={{ fontSize: 10, color: T.muted, marginTop: 3, textAlign: isMe ? "right" : "left" }}>
                          {msg.sentAt ? new Date(msg.sentAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : ""}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div style={{ padding: "12px 16px", borderTop: `1px solid ${T.border}`, display: "flex", gap: 10 }}>
                <input
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message… (Enter to send)"
                  style={{ flex: 1, background: T.bg3, border: `1.5px solid ${T.border}`, borderRadius: 9, padding: "10px 14px", fontSize: 13, color: T.text, outline: "none", fontFamily: "DM Sans" }}
                />
                <Btn variant="primary" onClick={handleSend} disabled={sending || !draft.trim()}>
                  {sending ? "…" : "Send"}
                </Btn>
              </div>
            </>
          )}
        </Card>

        {/* ── Right: Search + Conversations ── */}
        <Card>
          {/* Search box */}
          <div style={{ fontFamily: "Syne", fontWeight: 700, marginBottom: 12, fontSize: 14 }}>🔍 Search Parent</div>
          <div style={{ position: "relative", marginBottom: 16 }}>
            <input
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="Search by parent name…"
              style={{ width: "100%", background: T.bg3, border: `1.5px solid ${T.border}`, borderRadius: 9, padding: "9px 14px", fontSize: 13, color: T.text, outline: "none", fontFamily: "DM Sans", boxSizing: "border-box" }}
            />
            {/* Dropdown results */}
            {(searchResults.length > 0 || searching) && searchQ.trim() && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: T.card, border: `1.5px solid ${T.border}`, borderRadius: 10, zIndex: 99, marginTop: 4, boxShadow: "0 8px 32px rgba(0,0,0,.4)", overflow: "hidden" }}>
                {searching && searchResults.length === 0 ? (
                  <div style={{ padding: "10px 14px", fontSize: 12, color: T.muted }}>Searching…</div>
                ) : searchResults.map(p => (
                  <div key={p.id}
                    onClick={() => { setConfirmParent(p); setSearchQ(""); setSearchResults([]); }}
                    style={{ padding: "10px 14px", display: "flex", gap: 10, alignItems: "center", cursor: "pointer", borderBottom: `1px solid ${T.border}` }}
                    onMouseEnter={e => e.currentTarget.style.background = T.bg3}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <Avatar name={p.name} size={28} color={T.accent} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: T.muted }}>{p.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Conversations list */}
          <div style={{ fontFamily: "Syne", fontWeight: 700, marginBottom: 10, fontSize: 13 }}>Conversations</div>
          {conversations.length === 0 ? (
            <div style={{ color: T.muted, fontSize: 12, textAlign: "center", padding: "16px 0" }}>No conversations yet.<br />Search for a parent above to start.</div>
          ) : conversations.map(c => (
            <div key={c.parentId}
              onClick={() => openConversation(c)}
              style={{ display: "flex", gap: 10, alignItems: "center", background: activeParent?.parentId === c.parentId ? `${T.primary}18` : T.bg3, border: `1.5px solid ${activeParent?.parentId === c.parentId ? T.primary : "transparent"}`, borderRadius: 9, padding: 10, marginBottom: 8, cursor: "pointer", transition: "all .15s" }}>
              <Avatar name={c.parentName} size={34} color={T.accent} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.parentName}</div>
                <div style={{ fontSize: 11, color: T.muted }}>Parent</div>
              </div>
              {c.unread > 0 && (
                <div style={{ minWidth: 18, height: 18, borderRadius: 9, background: T.accentR, color: "#fff", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>{c.unread}</div>
              )}
            </div>
          ))}
        </Card>
      </div>

      {/* ── Confirm Start Conversation Modal ── */}
      {confirmParent && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: T.card, borderRadius: 16, padding: 28, width: 340, boxShadow: "0 20px 60px rgba(0,0,0,.5)" }}>
            <div style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 17, marginBottom: 8 }}>Start Conversation?</div>
            <div style={{ display: "flex", gap: 12, alignItems: "center", background: T.bg3, borderRadius: 10, padding: 12, marginBottom: 20 }}>
              <Avatar name={confirmParent.name} size={40} color={T.accent} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{confirmParent.name}</div>
                <div style={{ fontSize: 12, color: T.muted }}>{confirmParent.email}</div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: T.muted, marginBottom: 20 }}>
              This will open a one-on-one chat thread with this parent.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn variant="ghost" full onClick={() => setConfirmParent(null)}>Cancel</Btn>
              <Btn variant="primary" full onClick={handleStartConversation}>OK, Start Chat →</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── DYNAMIC: Posts real announcement to DB ────────────────────────────────────
export const TeacherAnnouncements = () => {
  const [form, setForm]       = useState({ title: "", content: "", courseId: "" });
  const [courses, setCourses] = useState([]);
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTeacherCourses()
      .then(d => {
        setCourses(Array.isArray(d) ? d : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handlePost = async () => {
    if (!form.title.trim() || !form.content.trim()) { alert("Title and message are required."); return; }
    try {
      setPosting(true);
      const payload = {
        title: form.title,
        content: form.content,
        courseId: form.courseId ? Number(form.courseId) : null,
      };
      await createTeacherAnnouncement(payload);
      alert("Announcement posted!");
      setForm({ title: "", content: "", courseId: "" });
    }
    catch (err) {
      alert("Error: " + err.message);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="fade-up">
      <PageHeader title="Announcements" />
      <Card>
        <div style={{ fontFamily: "Syne", fontWeight: 700, marginBottom: 16 }}>Post New Announcement</div>
        {loading ? (
          <div style={{ fontSize: 13, color: T.muted, marginBottom: 14 }}>Loading audience options...</div>
        ) : (
          <Select 
            label="Target Audience (Course)" 
            value={form.courseId} 
            onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))}
            options={[
              { value: "", label: "📢 All My Students (Global)" },
              ...courses.map(c => ({ value: String(c.id), label: `📚 Course: ${c.title}` }))
            ]} 
          />
        )}
        <Input label="Title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Announcement title" />
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Message *</label>
          <textarea rows={3} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            placeholder="Write your announcement message here..."
            style={{ width: "100%", background: T.bg3, border: `1.5px solid ${T.border}`, borderRadius: 9, padding: "10px 14px", fontSize: 13, color: T.text, outline: "none", resize: "vertical", fontFamily: "DM Sans" }} />
        </div>
        <Btn variant="success" full size="lg" onClick={handlePost} disabled={posting || loading}>
          {posting ? "Posting…" : "Post & Notify →"}
        </Btn>
      </Card>
    </div>
  );
};

export const TeacherCertifications = () => {
  const [certs, setCerts] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [grade, setGrade] = useState("A");
  const [remarks, setRemarks] = useState("Outstanding Performance");
  const [submitting, setSubmitting] = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      getIssuedCertificates(),
      getTeacherStudents(),
      getTeacherCourses()
    ])
      .then(([certsRes, studentsRes, coursesRes]) => {
        setCerts(Array.isArray(certsRes?.data) ? certsRes.data : Array.isArray(certsRes) ? certsRes : []);
        setStudents(Array.isArray(studentsRes?.data) ? studentsRes.data : Array.isArray(studentsRes) ? studentsRes : []);
        setCourses(Array.isArray(coursesRes?.data) ? coursesRes.data : Array.isArray(coursesRes) ? coursesRes : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleIssue = async () => {
    if (!selectedStudent || !selectedCourse) {
      alert("⚠️ Please select both a student and a course.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await issueCertificate({
        studentId: Number(selectedStudent),
        courseId: Number(selectedCourse),
        grade,
        remarks
      });
      alert(`🎉 Certificate issued successfully!\nNumber: ${res?.data?.certificateNumber || res?.certificateNumber}`);
      
      // Reset form and reload
      setSelectedStudent("");
      setSelectedCourse("");
      setGrade("A");
      setRemarks("Outstanding Performance");
      loadData();
    } catch (err) {
      console.error(err);
      alert("❌ Failed to issue certificate. Note: A certificate can only be issued once per student per course.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fade-up">
      <PageHeader title="Certifications Management" />
      
      <div className="lms-responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 20, marginBottom: 24 }}>
        {/* Left Side: Issued Certificates List */}
        <Card style={{ padding: 24 }}>
          <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 16, marginBottom: 16 }}>
            🎓 Issued Certificates ({certs.length})
          </div>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: T.muted }}>Loading certifications...</div>
          ) : certs.length === 0 ? (
            <div style={{ color: T.muted, textAlign: "center", padding: "40px 0", fontSize: 13 }}>
              No certificates have been issued yet. Use the form on the right to award your first certificate!
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="lms-cert-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.bg2}` }}>
                    <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, color: T.muted }}>Student</th>
                    <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, color: T.muted }}>Course</th>
                    <th className="hide-mobile" style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, color: T.muted }}>Cert Number</th>
                    <th style={{ padding: "8px 12px", textAlign: "center", fontSize: 11, color: T.muted }}>Grade</th>
                    <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, color: T.muted }}>Issue Date</th>
                  </tr>
                </thead>
                <tbody>
                  {certs.map(c => (
                    <tr key={c.id} style={{ borderBottom: `1.5px solid ${T.bg2}` }}>
                      <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 700 }}>{c.studentName}</td>
                      <td style={{ padding: "10px 12px", fontSize: 12, color: T.muted }}>{c.courseTitle}</td>
                      <td className="hide-mobile" style={{ padding: "10px 12px", fontSize: 11, fontFamily: "monospace", color: T.primaryL }}>{c.certificateNumber}</td>
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>
                        <Badge variant={c.grade === "A+" || c.grade === "A" ? "success" : "primary"}>
                          {c.grade}
                        </Badge>
                      </td>
                      <td style={{ padding: "10px 12px", fontSize: 12, color: T.muted }}>
                        {new Date(c.issueDate).toLocaleDateString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Right Side: Issue Form */}
        <Card style={{ padding: 24 }}>
          <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 16, marginBottom: 16 }}>
            🏆 Award New Certificate
          </div>
          
          <div style={{ display: "grid", gap: 14 }}>
            <Select
              label="Select Student"
              value={selectedStudent}
              onChange={e => setSelectedStudent(e.target.value)}
              options={[
                { value: "", label: "Choose a student..." },
                ...students.map(s => ({ value: String(s.id), label: `${s.name} (${s.email})` }))
              ]}
            />

            <Select
              label="Select Course"
              value={selectedCourse}
              onChange={e => setSelectedCourse(e.target.value)}
              options={[
                { value: "", label: "Choose a course..." },
                ...courses.map(c => ({ value: String(c.id), label: c.title }))
              ]}
            />

            <Select
              label="Grade Awarded"
              value={grade}
              onChange={e => setGrade(e.target.value)}
              options={["A+", "A", "B+", "B", "C", "D"].map(g => ({ value: g, label: `Grade ${g}` }))}
            />

            <Input
              label="Remarks / Achievements"
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="e.g. Outstanding performance, top class project"
            />

            <Btn
              variant="primary"
              full
              size="lg"
              onClick={handleIssue}
              disabled={submitting}
              style={{ marginTop: 8 }}
            >
              {submitting ? "Issuing Certificate..." : "🎓 Issue Certificate →"}
            </Btn>
          </div>
        </Card>
      </div>
    </div>
  );
};

// ── DYNAMIC: Real notifications from DB, fallback to static if empty ──────────
export const TeacherNotifications = () => {
  const [notifs, setNotifs]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("ALL");

  useEffect(() => {
    getTeacherNotifications()
      .then(d => setNotifs(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleMarkRead = async id => {
    await markTeacherNotifRead(id).catch(console.error);
    setNotifs(n => n.map(x => x.id === id ? { ...x, read: true } : x));
  };
  const handleMarkAll = async () => {
    await markTeacherNotifReadAll().catch(console.error);
    setNotifs(n => n.map(x => ({ ...x, read: true })));
  };

  const typeIcon  = { INFO: "ℹ️", WARNING: "⚠️", SUCCESS: "✅", ERROR: "❌" };
  const typeColor = { INFO: T.accent, WARNING: T.accentY, SUCCESS: T.accentG, ERROR: "#ef4444" };
  const unreadCount = notifs.filter(n => !n.read).length;
  const filtered = filter === "ALL" ? notifs
    : filter === "UNREAD" ? notifs.filter(n => !n.read)
    : notifs.filter(n => n.type === filter);

  return (
    <div className="fade-up">
      <PageHeader title="Notifications"
        subtitle={`${unreadCount} unread · ${notifs.length} total`}
        actions={[<Btn variant="ghost" size="sm" onClick={handleMarkAll} disabled={unreadCount === 0}>✓ Mark All Read</Btn>]} />

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { key: "ALL",     label: `All (${notifs.length})` },
          { key: "UNREAD",  label: `🔵 Unread (${unreadCount})` },
          { key: "INFO",    label: "ℹ️ Info" },
          { key: "WARNING", label: "⚠️ Alerts" },
          { key: "SUCCESS", label: "✅ Success" },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            style={{ padding: "6px 14px", borderRadius: 50, cursor: "pointer",
              border: `1.5px solid ${filter === f.key ? T.primary : T.border}`,
              background: filter === f.key ? `${T.primary}20` : "transparent",
              color: filter === f.key ? T.primary : T.muted, fontWeight: 600, fontSize: 12 }}>
            {f.label}
          </button>
        ))}
      </div>

      <Card>
        {loading ? <div style={{ padding: 32, textAlign: "center", color: T.muted }}>Loading…</div>
        : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: T.muted }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🔔</div>
            <div style={{ fontFamily: "Syne", fontWeight: 700 }}>No notifications yet</div>
          </div>
        ) : filtered.map((n, i) => (
          <div key={n.id} onClick={() => !n.read && handleMarkRead(n.id)}
            style={{ display: "flex", gap: 14, padding: "14px 0",
              borderBottom: i < filtered.length - 1 ? `1px solid rgba(45,33,96,.3)` : "none",
              alignItems: "flex-start", cursor: !n.read ? "pointer" : "default",
              background: !n.read ? `${T.primary}05` : "transparent" }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: `${typeColor[n.type] || T.accentG}18`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
              {typeIcon[n.type] || "🔔"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: n.read ? 500 : 700 }}>{n.title}</div>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 3, lineHeight: 1.5 }}>{n.message}</div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 5 }}>
                {n.createdAt ? new Date(n.createdAt).toLocaleString("en-IN", {
                  day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
              </div>
            </div>
            {!n.read && <div style={{ width: 10, height: 10, borderRadius: "50%",
              background: typeColor[n.type] || T.accentG, flexShrink: 0, marginTop: 6 }} />}
          </div>
        ))}
      </Card>
    </div>
  );
};

// ─── TEACHER DASHBOARD WRAPPER ────────────────────────────────────────────────
const TeacherTimetable = () => {
  const DAYS = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];
  const DAY_SHORT = { MONDAY:"Mon", TUESDAY:"Tue", WEDNESDAY:"Wed", THURSDAY:"Thu", FRIDAY:"Fri", SATURDAY:"Sat" };
  const COLORS = ["#7c3aed","#06b6d4","#10b981","#f59e0b","#ef4444","#a78bfa","#34d399"];
  const [slots, setSlots]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTeacherTimetableData()
      .then(d => setSlots(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const timeKeys = [...new Set(slots.map(s => s.startTime + "–" + s.endTime))].sort();
  const cellColor = (course) => COLORS[Math.abs((course?.id || 0) * 3) % COLORS.length];

  return (
    <div className="fade-up">
      <PageHeader title="My Timetable" subtitle="Your teaching schedule for active batches" />
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {loading ? <div style={{ padding: 40, textAlign: "center", color: T.muted }}>Loading…</div>
        : slots.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: T.muted }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>📅</div>
            <div style={{ fontFamily: "Syne", fontWeight: 700 }}>No classes scheduled yet</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>Admin will add your teaching schedule here.</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
              <thead>
                <tr>
                  <th style={{ padding: "12px 16px", fontSize: 11, fontWeight: 800, color: T.muted,
                    textTransform: "uppercase", borderBottom: `1px solid ${T.border}`, background: T.bg3, textAlign: "left" }}>TIME</th>
                  {DAYS.map(d => (
                    <th key={d} style={{ padding: "12px 16px", fontSize: 11, fontWeight: 800, color: T.muted,
                      textTransform: "uppercase", borderBottom: `1px solid ${T.border}`, background: T.bg3, textAlign: "left" }}>{DAY_SHORT[d]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeKeys.map(tk => (
                  <tr key={tk}>
                    <td style={{ padding: "10px 16px", fontSize: 12, fontWeight: 700, color: T.primaryL,
                      borderBottom: `1px solid rgba(45,33,96,.3)`, background: T.bg3, whiteSpace: "nowrap" }}>
                      {tk.replace("–"," – ")}
                    </td>
                    {DAYS.map(day => {
                      const cell = slots.find(s => s.startTime + "–" + s.endTime === tk && s.dayOfWeek === day);
                      return (
                        <td key={day} style={{ padding: "10px 16px", borderBottom: `1px solid rgba(45,33,96,.3)` }}>
                          {cell ? (
                            <div style={{ background: `${cellColor(cell.course)}12`,
                              border: `1px solid ${cellColor(cell.course)}35`,
                              borderRadius: 8, padding: "8px 10px" }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: cellColor(cell.course) }}>{cell.course?.title}</div>
                              <div style={{ fontSize: 11, color: T.muted }}>📦 {cell.batch?.name}</div>
                              {cell.room && <div style={{ fontSize: 10, color: T.muted }}>🚪 {cell.room}</div>}
                            </div>
                          ) : <span style={{ color: T.muted }}>—</span>}
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
    </div>
  );
};

const TEACHER_PAGES = {
  overview:       { comp: TeacherOverview       },
  profile:        { comp: TeacherProfile        },
  courses:        { comp: TeacherCourses        },
  liveclasses:    { comp: TeacherLiveClasses    },
  attendance:     { comp: TeacherAttendance     },
  grading:        { comp: TeacherGrading        },
  performance:    { comp: TeacherPerformance    },
  messages:       { comp: TeacherMessages       },
  announcements:  { comp: TeacherAnnouncements  },
  certifications: { comp: TeacherCertifications },
  timetable:      { comp: TeacherTimetable      },
  notifications:  { comp: TeacherNotifications  },
  forum:          { comp: TeacherForum          },
  meetings:       { comp: AdminMeetings         },
};

export const TeacherDashboard = ({ onLogout }) => {
  const [page, setPage]         = useState("overview");
  const { profile }             = useTeacherProfile();

  // Allow child components to navigate via custom event
  useEffect(() => {
    const handler = (e) => setPage(e.detail);
    window.addEventListener("teacher-nav", handler);
    return () => window.removeEventListener("teacher-nav", handler);
  }, []);

  useEffect(() => {
    const requiredFeatures = {
      liveclasses: "MEETINGS",
      attendance: "ATTENDANCE",
      grading: "ASSIGNMENTS",
      announcements: "ANNOUNCEMENTS",
      certifications: "CERTIFICATES",
      timetable: "TIMETABLE",
      forum: "FORUMS",
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

  const { pct, missing } = calcProfileCompletion("teacher", profile || {});
  const { comp: Comp } = TEACHER_PAGES[page] || TEACHER_PAGES.overview;

  return (
    <DashLayout role="teacher" page={page} onNav={setPage} onLogout={onLogout}>
      <ProfileAlert pct={pct} missing={missing} onComplete={() => setPage("profile")} />
      <Comp onNav={setPage} />
    </DashLayout>
  );
};


// ════════════════════════════════════════════════════════════════════════════════
// PARENT PAGES
// ════════════════════════════════════════════════════════════════════════════════

// ── DYNAMIC: Real children + notifications ────────────────────────────────────
export const ParentOverview = ({ onNav }) => {
  const [profile, setProfile]   = useState(null);
  const [children, setChildren] = useState([]);
  const [notifs, setNotifs]     = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([getParentProfile(), getMyChildren(), getParentNotifications()])
      .then(([p, c, n]) => { setProfile(p); setChildren(Array.isArray(c) ? c : []); setNotifs(Array.isArray(n) ? n : []); })
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div className="fade-up">
      <PageHeader title="Parent Dashboard" subtitle={`Welcome, ${profile?.name || "Parent"}! Monitor your children's academic progress.`} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18, marginBottom: 24 }}>
        <StatCard icon="👶" label="Children"       value={loading ? "…" : children.length}                    change="Linked accounts" color={T.accentR} />
        <StatCard icon="📊" label="Avg Attendance" value="84%"                                                 change="↑ 2% this month" color={T.accentG} />
        <StatCard icon="💳" label="Fee Due"        value="₹4,500"                                             change="Due: 30 Mar"     color={T.accentY} />
        <StatCard icon="🔔" label="Notifications"  value={loading ? "…" : notifs.filter(n => !n.read).length} change="Unread"         color={T.primaryL} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <Card>
          <div style={{ fontFamily: "Syne", fontWeight: 700, marginBottom: 16 }}>Children Overview</div>
          {loading ? <div style={{ color: T.muted, textAlign: "center", padding: 16 }}>Loading…</div>
            : children.length === 0
              ? <div style={{ color: T.muted, textAlign: "center", padding: 16 }}>No children linked yet.<div style={{ marginTop: 10 }}><Btn variant="primary" size="sm" onClick={() => onNav("children")}>+ Link Child</Btn></div></div>
              : children.map(c => (
                <div key={c.id} style={{ background: T.bg3, borderRadius: 12, padding: 16, marginBottom: 12, display: "flex", gap: 14, alignItems: "center" }}>
                  <Avatar name={c.name} size={56} color={T.accentR} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, fontFamily: "Syne" }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{c.userId} · {c.department || "—"}</div>
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <Badge type={c.active ? "success" : "warning"}>{c.active ? "Active" : "Inactive"}</Badge>
                    </div>
                  </div>
                </div>
              ))
          }
        </Card>
        <div>
          <Card style={{ marginBottom: 18 }}>
            <div style={{ fontFamily: "Syne", fontWeight: 700, marginBottom: 14 }}>Fee Summary</div>
            {[["Tuition Q1", "✓ Paid", T.accentG], ["Exam Fee", "✓ Paid", T.accentG], ["Lab Fee Q2", "⚠ Due ₹4,500", T.accentR]].map(([l, v, c]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "8px 0", borderBottom: `1px solid rgba(45,33,96,.3)` }}>
                <span style={{ color: T.muted }}>{l}</span><span style={{ fontWeight: 700, color: c }}>{v}</span>
              </div>
            ))}
            <Btn variant="accent" size="sm" full style={{ marginTop: 12 }} onClick={() => onNav("fees")}>View Fees →</Btn>
          </Card>
        </div>
      </div>
    </div>
  );
};

// ── DYNAMIC: Profile fetched and saved to DB ──────────────────────────────────
export const ParentProfile = () => {
  const { profile, updateProfileField } = useParentProfile();
  const [form, setForm]           = useState(null);
  const [saving, setSaving]       = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef                   = React.useRef(null);
  const initializedRef            = React.useRef(false);

  useEffect(() => {
    if (profile && !initializedRef.current) {
      initializedRef.current = true;
      setForm({
        name:          profile.name          || "",
        email:         profile.email         || "",
        phone:         profile.phone         || "",
        address:       profile.address       || "",
        gender:        profile.gender        || "",
        userId:        profile.userId        || "",
        profilePicUrl: profile.profilePicUrl || "",
      });
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateParentProfile({
        name: form.name,
        phone: form.phone,
        address: form.address,
        gender: form.gender,
        profilePicUrl: form.profilePicUrl
      });
      updateProfileField({
        name: form.name,
        phone: form.phone,
        address: form.address,
        gender: form.gender,
        profilePicUrl: form.profilePicUrl
      });
      alert("Profile updated successfully!");
    } catch (err) {
      alert("Failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result;
      setForm(prev => ({ ...prev, profilePicUrl: dataUrl }));
      updateProfileField({ profilePicUrl: dataUrl });
      try {
        setUploading(true);
        await updateParentProfile({ profilePicUrl: dataUrl });
      } catch (err) {
        alert("Photo upload failed: " + err.message);
        setForm(prev => ({ ...prev, profilePicUrl: "" }));
        updateProfileField({ profilePicUrl: "" });
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleRemovePhoto = async () => {
    setForm(prev => ({ ...prev, profilePicUrl: "" }));
    updateProfileField({ profilePicUrl: "" });
    await updateParentProfile({ profilePicUrl: "" }).catch(console.error);
  };

  if (!form) return <div style={{ padding: 32, textAlign: "center", color: T.muted }}>Loading…</div>;

  const { pct, missing } = calcProfileCompletion("parent", form);

  return (
    <div className="fade-up">
      <PageHeader title="My Profile" />
      <ProfileAlert pct={pct} missing={missing} onComplete={() => fileRef.current?.click()} />
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />

      <div className="lms-responsive-split-1-2" style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24 }}>
        <Card style={{ textAlign: "center", padding: 32 }}>
          <DonutChart pct={pct} color={T.accentR} label="Complete" />
          <div style={{ fontSize: 13, fontWeight: 700, color: T.accentR, marginTop: 8 }}>Profile {pct}% Complete</div>

          <div style={{ position: "relative", width: 80, margin: "16px auto 0" }}>
            {form.profilePicUrl ? (
              <div style={{ width: 80, height: 80, borderRadius: "50%", overflow: "hidden", border: `3px solid ${T.accentR}` }}>
                <img src={form.profilePicUrl} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ) : (
              <Avatar name={form.name || "P"} size={80} color={T.accentR} />
            )}
            {uploading && (
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>⏳</div>
            )}
          </div>

          <div style={{ fontFamily: "Syne", fontSize: 18, fontWeight: 800, marginTop: 12 }}>{form.name || "—"}</div>
          <div style={{ fontSize: 13, color: T.muted }}>{form.userId || "—"}</div>

          <Btn variant="dark" size="sm" full style={{ marginTop: 16 }} disabled={uploading}
            onClick={() => fileRef.current?.click()}>
            📷 {uploading ? "Uploading…" : form.profilePicUrl ? "Change Photo" : "Upload Photo (Optional)"}
          </Btn>
          {form.profilePicUrl && !uploading && (
            <Btn variant="ghost" size="sm" full style={{ marginTop: 8 }} onClick={handleRemovePhoto}>✕ Remove Photo</Btn>
          )}
        </Card>
        <Card style={{ padding: 28 }}>
          <div style={{ fontFamily: "Syne", fontSize: 17, fontWeight: 800, marginBottom: 20 }}>Update Profile</div>
          <div className="lms-responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Input label="Full Name *"     value={form.name}    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <Input label="Email"           value={form.email}   onChange={() => {}} style={{ opacity: 0.6, cursor: "not-allowed" }} />
          </div>
          <div className="lms-responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Input label="Mobile Number *" value={form.phone}   onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" />
            <Select label="Gender" value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
              options={[{ value: "", label: "Select" }, "Male", "Female", "Other"].map(o => typeof o === "string" ? { value: o, label: o } : o)} />
          </div>
          <Input label="Address *" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Street address" />
          <Btn variant="danger" size="lg" onClick={handleSave} disabled={saving || uploading}>{saving ? "Saving…" : "Save Profile →"}</Btn>
        </Card>
      </div>
    </div>
  );
};

// ── DYNAMIC: Real children with Link Child modal ──────────────────────────────
export const ParentChildren = () => {
  const [children, setChildren] = useState([]);
  const [modal, setModal]       = useState(false);
  const [code, setCode]         = useState("");
  const [linking, setLinking]   = useState(false);
  const [loading, setLoading]   = useState(true);

  const load = () => { setLoading(true); getMyChildren().then(d => setChildren(Array.isArray(d) ? d : [])).catch(console.error).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const handleLink = async () => {
    if (!code.trim()) { alert("Enter the student code."); return; }
    try { setLinking(true); await linkChild(code.trim()); alert("Child linked!"); setModal(false); setCode(""); load(); }
    catch (err) { alert("Error: " + err.message); } finally { setLinking(false); }
  };

  return (
    <div className="fade-up">
      <PageHeader title="Child Profiles" actions={[<Btn variant="primary" onClick={() => setModal(true)}>+ Link Child</Btn>]} />
      {loading ? <div style={{ padding: 32, textAlign: "center", color: T.muted }}>Loading…</div>
        : children.length === 0
          ? <Card><div style={{ padding: 32, textAlign: "center", color: T.muted }}>No children linked yet.<br /><Btn variant="primary" size="sm" style={{ marginTop: 12 }} onClick={() => setModal(true)}>+ Link Child</Btn></div></Card>
          : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              {children.map(c => (
                <Card key={c.id} style={{ padding: 24 }}>
                  <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 20 }}>
                    <Avatar name={c.name} size={64} color={T.accentR} />
                    <div>
                      <div style={{ fontFamily: "Syne", fontSize: 20, fontWeight: 800 }}>{c.name}</div>
                      <div style={{ fontSize: 13, color: T.muted }}>{c.userId} · {c.email}</div>
                      {c.department && <Badge type="info">{c.department}</Badge>}
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {[["Status", c.active ? "Active" : "Inactive", c.active ? T.accentG : T.accentR], ["Phone", c.phone || "—", T.muted]].map(([l, v, co]) => (
                      <div key={l} style={{ background: T.bg3, borderRadius: 10, padding: 12, textAlign: "center" }}>
                        <div style={{ fontSize: 11, color: T.muted }}>{l}</div>
                        <div style={{ fontFamily: "Syne", fontSize: 16, fontWeight: 800, color: co, marginTop: 4 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )
      }
      <Modal open={modal} onClose={() => setModal(false)} title="Link a Child">
        <p style={{ fontSize: 13, color: T.muted, marginBottom: 16 }}>Ask your child for their Student ID (e.g. <strong>STU-2026-001</strong>) from their profile page.</p>
        <Input label="Student Code *" value={code} onChange={e => setCode(e.target.value)} placeholder="STU-2026-001" />
        <Btn variant="primary" full size="lg" onClick={handleLink} disabled={linking}>{linking ? "Linking…" : "Link Child →"}</Btn>
      </Modal>
    </div>
  );
};

// ── DYNAMIC: Real fees per child from DB ─────────────────────────────────────
export const ParentTracking = () => {
  const [children, setChildren] = useState([]);
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState("Overview");
  const [loading, setLoading] = useState(true);

  const [dashboardData, setDashboardData] = useState(null);
  const [dashLoading, setDashLoading] = useState(false);
  const [fees, setFees] = useState([]);
  const [feeLoading, setFeeLoading] = useState(false);

  useEffect(() => {
    getMyChildren()
      .then(d => {
        const kids = Array.isArray(d) ? d : [];
        setChildren(kids);
        if (kids.length > 0) setSelected(kids[0]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) return;
    setDashLoading(true);
    setFeeLoading(true);

    getChildDashboardDetails(selected.id)
      .then(d => {
        setDashboardData(d || null);
      })
      .catch(err => {
        console.error("Failed to load dashboard details", err);
        setDashboardData(null);
      })
      .finally(() => setDashLoading(false));

    getChildFees(selected.id)
      .then(d => setFees(Array.isArray(d) ? d : []))
      .catch(err => {
        console.error("Failed to load fees", err);
        setFees([]);
      })
      .finally(() => setFeeLoading(false));
  }, [selected]);

  if (loading) return <div style={{ padding: 32, textAlign: "center", color: T.muted }}>Loading children…</div>;
  if (children.length === 0) {
    return (
      <div className="fade-up">
        <PageHeader title="Course & Attendance Tracking" />
        <Card><div style={{ padding: 32, textAlign: "center", color: T.muted }}>No children linked yet.</div></Card>
      </div>
    );
  }

  // When data has loaded (dashLoading=false) but dashboardData is null → API error
  // We still render the full shell so users can see the tab structure and error message inline.

  // Fees values
  const total = fees.reduce((s, f) => s + Number(f.amount || 0), 0);
  const paid = fees.filter(f => f.status === "PAID").reduce((s, f) => s + Number(f.paidAmount || f.amount || 0), 0);
  const pending = total - paid;

  // Custom tooltips for recharts
  const BarTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: 12, borderRadius: 8, boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
          <div style={{ fontWeight: 800, marginBottom: 4, color: T.text, fontSize: 13 }}>{data.courseTitle}</div>
          <div style={{ fontSize: 12, color: T.accentG, fontWeight: 600 }}>Attendance: {data.percentage}%</div>
          <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>Present: {data.present} / Total: {data.total}</div>
        </div>
      );
    }
    return null;
  };

  const TimelineTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: 12, borderRadius: 8, boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
          <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>{data.date}</div>
          <div style={{ fontWeight: 800, color: T.text, fontSize: 13, marginBottom: 4 }}>{data.course}</div>
          <div style={{ fontSize: 12, color: data.status === "PRESENT" ? T.accentG : data.status === "LATE" ? T.accentY : T.accentR, fontWeight: 600 }}>
            Status: {data.status}
          </div>
          <div style={{ fontSize: 12, color: T.primaryL, marginTop: 2 }}>
            Cumulative Rate: {data.runningRate}%
          </div>
        </div>
      );
    }
    return null;
  };

  const ScatterTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, padding: 12, borderRadius: 8, boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
          <div style={{ fontWeight: 800, marginBottom: 4, color: T.text, fontSize: 13 }}>{data.course}</div>
          <div style={{ fontSize: 12, color: T.accent, fontWeight: 600 }}>Attendance: {data.attendance}%</div>
          <div style={{ fontSize: 12, color: T.primaryL, fontWeight: 600, marginTop: 2 }}>Avg Exam Grade: {data.grade}%</div>
        </div>
      );
    }
    return null;
  };

  // Extract variables safely
  const childInfo = dashboardData?.child || selected;
  const batches = dashboardData?.batches || [];
  const courses = dashboardData?.courses || [];
  const attendance = dashboardData?.attendance || {};
  const attendanceSummary = attendance.summary || { total: 0, present: 0, absent: 0, late: 0, percentage: 0 };
  const attendanceRecords = attendance.records || [];
  const courseMetrics = attendance.courseMetrics || [];
  const timeline = attendance.timeline || [];
  const correlation = attendance.correlation || [];

  const grades = dashboardData?.grades || {};
  const examResults = grades.results || [];
  const avgGradePct = grades.averagePercentage || 0;
  const totalExams = grades.totalExams || 0;
  const passedExams = grades.passedExams || 0;
  const passRate = totalExams > 0 ? ((passedExams * 100) / totalExams).toFixed(1) : "0.0";

  const currentExams = dashboardData?.currentExams || [];
  const upcomingExams = dashboardData?.upcomingExams || [];

  // Pie chart data prep
  const pieData = [
    { name: "Present", value: attendanceSummary.present || 0, color: T.accentG },
    { name: "Late", value: attendanceSummary.late || 0, color: T.accentY },
    { name: "Absent", value: attendanceSummary.absent || 0, color: T.accentR },
  ].filter(d => d.value > 0);

  return (
    <div className="fade-up">
      <PageHeader 
        title="Course & Attendance Tracking" 
        subtitle="Monitor academic progress, scheduling, attendance metrics, and grades analysis."
      />
      
      {/* Student Selector */}
      <div style={{ marginBottom: 20 }}>
        <Tabs 
          tabs={children.map(c => c.name)} 
          active={selected?.name} 
          onChange={name => {
            const nextChild = children.find(c => c.name === name);
            setSelected(nextChild);
          }} 
        />
      </div>

      {/* Module Sub-tabs */}
      <Tabs 
        tabs={["Overview", "Attendance Analytics", "Exams & Grades", "Fees"]} 
        active={tab} 
        onChange={setTab} 
      />

      {dashLoading ? (
        <div style={{ padding: 48, textAlign: "center", color: T.muted }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          <div style={{ fontSize: 16, marginBottom: 8, fontFamily: "Syne", fontWeight: 700 }}>Loading child details and analytics...</div>
          <div style={{ fontSize: 12 }}>Fetching courses, attendance, and exam data...</div>
        </div>
      ) : !dashboardData ? (
        <Card style={{ padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 16, marginBottom: 8, color: T.accentR }}>Unable to load data</div>
          <div style={{ fontSize: 13, color: T.muted, marginBottom: 16 }}>
            Could not retrieve academic details for <strong>{selected?.name}</strong>. Please try refreshing the page.
          </div>
          <Btn variant="primary" size="sm" onClick={() => { setDashLoading(true); getChildDashboardDetails(selected.id).then(d => setDashboardData(d || null)).catch(() => setDashboardData(null)).finally(() => setDashLoading(false)); }}>
            🔄 Retry
          </Btn>
        </Card>
      ) : (
        <>
          {/* ──────────────── TAB: OVERVIEW ──────────────── */}
          {tab === "Overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* Profile Details Card */}
              <Card style={{ padding: 24 }}>
                <div style={{ display: "flex", gap: 20, alignItems: "center", marginBottom: 24, borderBottom: `1px solid ${T.border}`, paddingBottom: 20 }}>
                  <Avatar name={childInfo.name} size={72} color={T.primary} />
                  <div>
                    <h2 style={{ fontFamily: "Syne", fontSize: 24, fontWeight: 800, color: T.text, margin: 0 }}>{childInfo.name}</h2>
                    <p style={{ fontSize: 14, color: T.muted, margin: "4px 0 0 0" }}>Student ID: <strong style={{ color: T.primaryL }}>{childInfo.userId}</strong></p>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                  {[
                    ["Email", childInfo.email || "—", T.text],
                    ["Phone", childInfo.phone || "—", T.text],
                    ["Enrolled Department", childInfo.department || "—", T.accent],
                    ["Status", childInfo.active ? "Active" : "Inactive", childInfo.active ? T.accentG : T.accentR],
                    ["Address", childInfo.address || "—", T.muted],
                  ].map(([label, val, color]) => (
                    <div key={label} style={{ background: T.bg3, borderRadius: 12, padding: 16 }}>
                      <div style={{ fontSize: 11, color: T.muted, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 700 }}>{label}</div>
                      <div style={{ fontWeight: 700, color: color, marginTop: 6, fontSize: 14, wordBreak: "break-all" }}>{val}</div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Batches and Courses Layout */}
              <div className="lms-responsive-split-1-2" style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24, alignItems: "start" }}>
                {/* Enrolled Batches */}
                <Card style={{ padding: 20 }}>
                  <h3 style={{ fontFamily: "Syne", fontSize: 18, fontWeight: 700, marginBottom: 16, borderBottom: `1px solid ${T.border}`, paddingBottom: 10 }}>Enrolled Batches</h3>
                  {batches.length === 0 ? (
                    <div style={{ color: T.muted, fontSize: 13, textAlign: "center", padding: "20px 0" }}>No batch enrollments found.</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {batches.map(b => (
                        <div key={b.id} style={{ background: T.bg3, padding: 14, borderRadius: 10, borderLeft: `4px solid ${b.status === "ACTIVE" ? T.accentG : T.primary}` }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{b.name}</div>
                          <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>Dept: {b.department || "N/A"}</div>
                          <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{b.startDate || "—"} to {b.endDate || "—"}</div>
                          <div style={{ marginTop: 8 }}>
                            <Badge type={b.status === "ACTIVE" ? "success" : b.status === "COMPLETED" ? "primary" : "warning"}>{b.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {/* Enrolled Courses */}
                <Card style={{ padding: 20 }}>
                  <h3 style={{ fontFamily: "Syne", fontSize: 18, fontWeight: 700, marginBottom: 16, borderBottom: `1px solid ${T.border}`, paddingBottom: 10 }}>Enrolled Courses</h3>
                  {courses.length === 0 ? (
                    <div style={{ color: T.muted, fontSize: 13, textAlign: "center", padding: "20px 0" }}>No enrolled courses found.</div>
                  ) : (
                    <div className="lms-responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      {courses.map(c => (
                        <div key={c.id} style={{ background: T.bg3, padding: 16, borderRadius: 12, display: "flex", flexDirection: "column", justifyContent: "space-between", border: `1px solid ${T.border}` }}>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: 15, color: T.text, marginBottom: 6 }}>{c.title}</div>
                            <div style={{ fontSize: 12, color: T.muted, marginBottom: 12, height: 36, overflow: "hidden", textOverflow: "ellipsis" }}>{c.description || "No description provided."}</div>
                          </div>
                          <div style={{ borderTop: `1px solid rgba(255,255,255,0.05)`, paddingTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                              <span style={{ color: T.muted }}>Dept:</span>
                              <span style={{ color: T.accent, fontWeight: 600 }}>{c.department || "N/A"}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                              <span style={{ color: T.muted }}>Teacher:</span>
                              <span style={{ color: T.primaryL, fontWeight: 600 }}>{c.teacherName}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                              <span style={{ color: T.muted }}>Duration:</span>
                              <span style={{ color: T.text }}>{c.durationHours ? `${c.durationHours} hours` : "N/A"}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          )}

          {/* ──────────────── TAB: ATTENDANCE ANALYTICS ──────────────── */}
          {tab === "Attendance Analytics" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* Stats overview cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
                <StatCard 
                  icon="📈" 
                  label="Attendance Rate" 
                  value={`${attendanceSummary.percentage}%`} 
                  color={attendanceSummary.percentage >= 75 ? T.accentG : attendanceSummary.percentage >= 50 ? T.accentY : T.accentR}
                  change={attendanceSummary.percentage >= 75 ? "Excellent standing" : "Below recommended 75%"}
                />
                <StatCard 
                  icon="📅" 
                  label="Total Sessions" 
                  value={attendanceSummary.total} 
                  color={T.primaryL}
                />
                <StatCard 
                  icon="✅" 
                  label="Sessions Present" 
                  value={attendanceSummary.present} 
                  color={T.accentG}
                />
                <StatCard 
                  icon="❌" 
                  label="Sessions Absent/Late" 
                  value={`${attendanceSummary.absent} Absent · ${attendanceSummary.late} Late`} 
                  color={T.accentR}
                />
              </div>

              {/* Charts grid */}
              {attendanceRecords.length === 0 ? (
                <Card style={{ padding: 40, textAlign: "center" }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>📊</div>
                  <div style={{ color: T.muted, fontSize: 14 }}>No attendance records found to plot charts. Attendances must be marked by the teacher first.</div>
                </Card>
              ) : (
                <>
                  <div className="lms-responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                    {/* Bar Chart: Course Attendance Rate */}
                    <Card style={{ padding: 20 }}>
                      <h4 style={{ fontFamily: "Syne", fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Course Attendance Rate (%)</h4>
                      <div style={{ height: 280 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={courseMetrics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                            <XAxis dataKey="courseTitle" tick={{ fill: T.muted, fontSize: 10 }} />
                            <YAxis domain={[0, 100]} tick={{ fill: T.muted, fontSize: 10 }} />
                            <Tooltip content={<BarTooltip />} />
                            <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                              {courseMetrics.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.percentage >= 75 ? T.primary : T.accent} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>

                    {/* Pie Chart: Status breakdown */}
                    <Card style={{ padding: 20 }}>
                      <h4 style={{ fontFamily: "Syne", fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Attendance Status Ratio</h4>
                      <div style={{ height: 280, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {pieData.length === 0 ? (
                          <div style={{ color: T.muted, fontSize: 12 }}>No presence data.</div>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={85}
                                paddingAngle={4}
                                dataKey="value"
                              >
                                {pieData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip />
                              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 11, color: T.text }} />
                            </PieChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </Card>

                    {/* Line Chart: Attendance Timeline */}
                    <Card style={{ padding: 20 }}>
                      <h4 style={{ fontFamily: "Syne", fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Session Consistency (100=Pres, 50=Late, 0=Abs)</h4>
                      <div style={{ height: 280 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                            <XAxis dataKey="date" tick={{ fill: T.muted, fontSize: 9 }} />
                            <YAxis ticks={[0, 50, 100]} tick={{ fill: T.muted, fontSize: 10 }} />
                            <Tooltip content={<TimelineTooltip />} />
                            <Line type="monotone" dataKey="statusValue" stroke={T.accent} strokeWidth={2.5} activeDot={{ r: 6 }} dot={{ fill: T.accent, strokeWidth: 1 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>

                    {/* Area Chart: Running Cumulative Rate */}
                    <Card style={{ padding: 20 }}>
                      <h4 style={{ fontFamily: "Syne", fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Cumulative Attendance Trend (%)</h4>
                      <div style={{ height: 280 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={T.primary} stopOpacity={0.4}/>
                                <stop offset="95%" stopColor={T.primary} stopOpacity={0.0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                            <XAxis dataKey="date" tick={{ fill: T.muted, fontSize: 9 }} />
                            <YAxis domain={[0, 100]} tick={{ fill: T.muted, fontSize: 10 }} />
                            <Tooltip content={<TimelineTooltip />} />
                            <Area type="monotone" dataKey="runningRate" stroke={T.primary} strokeWidth={2} fillOpacity={1} fill="url(#colorRate)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>
                  </div>

                  {/* Attendance Log Table */}
                  <Card style={{ padding: 20 }}>
                    <h3 style={{ fontFamily: "Syne", fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Attendance History Log</h3>
                    <Table 
                      columns={["Date", "Course", "Status", "Remarks"]}
                      rows={attendanceRecords.map(r => [
                        r.date || "—",
                        r.courseTitle || "—",
                        <Badge type={r.status === "PRESENT" ? "success" : r.status === "LATE" ? "warning" : "danger"}>{r.status}</Badge>,
                        r.remarks || <span style={{ color: T.muted, fontStyle: "italic" }}>None</span>
                      ])}
                    />
                  </Card>
                </>
              )}
            </div>
          )}

          {/* ──────────────── TAB: EXAMS & GRADES ──────────────── */}
          {tab === "Exams & Grades" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* Stats Row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
                <StatCard 
                  icon="🎯" 
                  label="Average Exam Score" 
                  value={`${avgGradePct}%`} 
                  color={T.accent}
                  change={avgGradePct >= 80 ? "Grade: Excellent" : avgGradePct >= 60 ? "Grade: Good" : "Needs Attention"}
                />
                <StatCard 
                  icon="📝" 
                  label="Total Exams Graded" 
                  value={totalExams} 
                  color={T.primaryL}
                />
                <StatCard 
                  icon="🏆" 
                  label="Exams Cleared" 
                  value={passedExams} 
                  color={T.accentG}
                />
                <StatCard 
                  icon="📊" 
                  label="Overall Pass Rate" 
                  value={`${passRate}%`} 
                  color={Number(passRate) >= 75 ? T.accentG : T.accentR}
                />
              </div>

              {/* Main row grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 24, alignItems: "start" }}>
                
                {/* Academic Correlation and Grades List */}
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  {/* Correlation Scatter Plot */}
                  <Card style={{ padding: 20 }}>
                    <h4 style={{ fontFamily: "Syne", fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Academic Correlation</h4>
                    <p style={{ fontSize: 12, color: T.muted, marginBottom: 20 }}>Comparing Course Attendance Rate (%) against Exam Grades (%) to track performance drivers.</p>
                    {correlation.length === 0 ? (
                      <div style={{ height: 280, display: "flex", alignItems: "center", justifyContent: "center", color: T.muted, fontSize: 13 }}>
                        No academic correlation data found (requires at least one graded exam in an enrolled course).
                      </div>
                    ) : (
                      <div style={{ height: 280 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                            <XAxis type="number" dataKey="attendance" name="Attendance Rate" unit="%" domain={[0, 100]} tick={{ fill: T.muted, fontSize: 10 }} />
                            <YAxis type="number" dataKey="grade" name="Average Grade" unit="%" domain={[0, 100]} tick={{ fill: T.muted, fontSize: 10 }} />
                            <Tooltip content={<ScatterTooltip />} />
                            <Scatter name="Courses" data={correlation} fill={T.primary} line={false} shape="circle">
                              {correlation.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.grade >= 75 ? T.accentG : entry.grade >= 50 ? T.primary : T.accentR} r={8} />
                              ))}
                            </Scatter>
                          </ScatterChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </Card>

                  {/* Detailed Exam Results Table */}
                  <Card style={{ padding: 20 }}>
                    <h3 style={{ fontFamily: "Syne", fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Graded Exam Results</h3>
                    <Table 
                      columns={["Exam Title", "Course/Batch", "Type", "Marks", "Result"]}
                      rows={examResults.map(er => [
                        er.examTitle || "—",
                        er.courseTitle || "—",
                        <Badge type="muted">{er.examType || "TEST"}</Badge>,
                        er.attended ? `${er.marksObtained} / ${er.maxMarks} (${Math.round(er.marksObtained * 100 / er.maxMarks)}%)` : `Absent (0 / ${er.maxMarks})`,
                        <Badge type={er.cleared ? "success" : !er.attended ? "warning" : "danger"}>
                          {!er.attended ? "ABSENT" : er.cleared ? "PASSED" : "FAILED"}
                        </Badge>
                      ])}
                    />
                  </Card>
                </div>

                {/* Schedules Column */}
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  {/* Current Active Exams */}
                  <Card style={{ padding: 20, background: currentExams.length > 0 ? `linear-gradient(135deg, rgba(124,58,237,0.1), ${T.card})` : T.card, border: currentExams.length > 0 ? `1px solid ${T.primary}` : `1px solid ${T.border}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                      <span style={{ fontSize: 20 }}>🔴</span>
                      <h3 style={{ fontFamily: "Syne", fontSize: 18, fontWeight: 800, margin: 0 }}>Ongoing / Current Exams</h3>
                    </div>
                    {currentExams.length === 0 ? (
                      <div style={{ color: T.muted, fontSize: 13, padding: "10px 0" }}>No exams are currently active.</div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        {currentExams.map(ce => (
                          <div key={ce.id} style={{ background: T.bg3, padding: 14, borderRadius: 10, borderLeft: `4px solid ${T.accentR}` }}>
                            <div style={{ fontWeight: 800, fontSize: 14, color: T.text }}>{ce.title}</div>
                            <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>Course: {ce.courseTitle}</div>
                            <div style={{ fontSize: 11, color: T.primaryL, marginTop: 4 }}>Started At: {ce.scheduledAt ? new Date(ce.scheduledAt).toLocaleString() : "—"}</div>
                            <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>Duration: {ce.durationMinutes} minutes</div>
                            <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                              <Badge type="danger">LIVE</Badge>
                              <Badge type="info">{ce.examType}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>

                  {/* Upcoming Exams Schedule */}
                  <Card style={{ padding: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                      <span style={{ fontSize: 20 }}>📅</span>
                      <h3 style={{ fontFamily: "Syne", fontSize: 18, fontWeight: 700, margin: 0 }}>Upcoming Exams (Next 3)</h3>
                    </div>
                    {upcomingExams.length === 0 ? (
                      <div style={{ color: T.muted, fontSize: 13, padding: "10px 0" }}>No upcoming exams scheduled.</div>
                    ) : (
                      <div style={{ position: "relative", paddingLeft: 12, display: "flex", flexDirection: "column", gap: 16 }}>
                        {/* Timeline vertical bar */}
                        <div style={{ position: "absolute", left: 0, top: 8, bottom: 8, width: 2, background: T.border }} />

                        {upcomingExams.map((ue, idx) => (
                          <div key={ue.id} style={{ position: "relative" }}>
                            {/* Dot on timeline */}
                            <div style={{ position: "absolute", left: -16, top: 6, width: 10, height: 10, borderRadius: "50%", background: T.primary, border: `2px solid ${T.card}` }} />
                            
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 13, color: T.text }}>{ue.title}</div>
                              <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>Course: {ue.courseTitle}</div>
                              <div style={{ fontSize: 11, color: T.accent, marginTop: 4 }}>Date: {ue.scheduledAt ? new Date(ue.scheduledAt).toLocaleString() : "—"}</div>
                              <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>Duration: {ue.durationMinutes} mins · Pass Marks: {ue.passMarks}/{ue.maxMarks}</div>
                              <div style={{ marginTop: 6 }}>
                                <Badge type="muted">{ue.examType}</Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </div>

              </div>
            </div>
          )}

          {/* ──────────────── TAB: FEES ──────────────── */}
          {tab === "Fees" && (
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
              <Card>
                {feeLoading ? (
                  <div style={{ padding: 24, textAlign: "center", color: T.muted }}>Loading fee records…</div>
                ) : fees.length === 0 ? (
                  <div style={{ padding: 24, textAlign: "center", color: T.muted }}>No fee records.</div>
                ) : (
                  <Table 
                    columns={["Description", "Amount", "Status", "Due Date"]}
                    rows={fees.map(f => [
                      f.description || "Fee", 
                      `₹${Number(f.amount).toLocaleString("en-IN")}`,
                      <Badge type={f.status === "PAID" ? "success" : f.status === "OVERDUE" ? "danger" : "warning"}>{f.status}</Badge>, 
                      f.dueDate || "—"
                    ])} 
                  />
                )}
              </Card>
              
              <Card style={{ padding: 24 }}>
                <div style={{ fontFamily: "Syne", fontWeight: 700, marginBottom: 14 }}>Payment Summary</div>
                {[
                  ["Total Paid", `₹${paid.toLocaleString("en-IN")}`, T.accentG], 
                  ["Outstanding", `₹${pending.toLocaleString("en-IN")}`, T.accentR], 
                  ["Total Fee", `₹${total.toLocaleString("en-IN")}`, T.text]
                ].map(([l, v, c]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "8px 0", borderBottom: `1px solid rgba(45,33,96,.4)` }}>
                    <span style={{ color: T.muted }}>{l}</span>
                    <span style={{ fontFamily: "Syne", fontWeight: 800, color: c }}>{v}</span>
                  </div>
                ))}
                {pending > 0 && <Btn variant="accent" full style={{ marginTop: 16 }}>💳 Pay Now →</Btn>}
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
};


export const ParentResults = () => {
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getMyChildren()
      .then(d => {
        const list = Array.isArray(d) ? d : [];
        setChildren(list);
        if (list.length > 0) {
          setSelectedChild(list[0]);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedChild) return;
    setLoading(true);
    getChildAssessments(selectedChild.id)
      .then(d => {
        setAttempts(Array.isArray(d) ? d : (d?.data ? d.data : []));
      })
      .catch(err => {
        console.error("❌ Failed to load child assessments:", err);
        setAttempts([]);
      })
      .finally(() => setLoading(false));
  }, [selectedChild]);

  return (
    <div className="fade-up">
      <PageHeader title="Child's Assessments & Grades" subtitle="Monitor assessment attempts, scores, and evaluations." />

      {children.length > 1 && (
        <Card style={{ marginBottom: 20, padding: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, textTransform: "uppercase", marginBottom: 8 }}>Select Child</div>
          <div style={{ display: "flex", gap: 8 }}>
            {children.map(c => (
              <Btn key={c.id} variant={selectedChild?.id === c.id ? "primary" : "ghost"} size="sm" onClick={() => setSelectedChild(c)}>
                {c.name}
              </Btn>
            ))}
          </div>
        </Card>
      )}

      <Card style={{ padding: 24 }}>
        <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 16, marginBottom: 16 }}>
          ⚡ Assessment Attempts — {selectedChild?.name || "Loading..."}
        </div>

        {loading ? (
          <div style={{ padding: 32, textAlign: "center", color: T.muted }}>Loading attempts…</div>
        ) : attempts.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: T.muted }}>
            No assessment attempts found for {selectedChild?.name || "this child"}.
          </div>
        ) : (
          <Table
            columns={["Assessment", "Type", "Score / Total", "Status", "Date"]}
            rows={attempts.map(att => {
              const hasScore = att.totalScore !== undefined && att.totalScore !== null;
              const passed = hasScore && att.totalScore >= att.passMarks;
              return [
                att.assessmentTitle || "Assessment",
                att.assessmentType || "Quiz",
                hasScore ? (
                  <strong style={{ color: passed ? T.accentG : "#EF4444" }}>
                    {att.totalScore} / {att.totalMarks}
                  </strong>
                ) : (
                  <span style={{ color: T.muted }}>—</span>
                ),
                <Badge type={att.status === "GRADED" ? (passed ? "success" : "danger") : att.status === "SUBMITTED" ? "primary" : "ghost"}>
                  {att.status === "GRADED" ? (passed ? "Passed" : "Failed") : att.status}
                </Badge>,
                att.submittedAt ? new Date(att.submittedAt).toLocaleDateString() : (att.startedAt ? new Date(att.startedAt).toLocaleDateString() : "—")
              ];
            })}
          />
        )}
      </Card>
    </div>
  );
};

// ── DYNAMIC: Real fees per child from DB ──────────────────────────────────────
export const ParentFees = () => {
  const [children, setChildren] = useState([]);
  const [selected, setSelected] = useState(null);
  const [fees, setFees]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState("Pending");

  useEffect(() => {
    getMyChildren()
      .then(d => { const kids = Array.isArray(d) ? d : []; setChildren(kids); if (kids.length > 0) setSelected(kids[0]); })
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) return;
    getChildFees(selected.id).then(d => setFees(Array.isArray(d) ? d : [])).catch(console.error);
  }, [selected]);

  const totalPaid   = fees.filter(f => f.status === "PAID").reduce((s, f) => s + Number(f.paidAmount || f.amount || 0), 0);
  const outstanding = fees.filter(f => f.status !== "PAID").reduce((s, f) => s + Number(f.amount || 0), 0);
  const total       = fees.reduce((s, f) => s + Number(f.amount || 0), 0);

  const pendingFees  = fees.filter(f => f.status === "PENDING" || f.status === "OVERDUE");
  const paidFees     = fees.filter(f => f.status === "PAID");
  const displayFees  = tab === "Pending" ? pendingFees : tab === "Paid" ? paidFees : fees;

  const feeIcon = t => ({ TUITION: "📚", EXAM: "📝", LAB: "🧪", LIBRARY: "📖", TRANSPORT: "🚌" }[t] || "💳");

  return (
    <div className="fade-up">
      <PageHeader title="Fees & Payments"
        subtitle={selected ? `${selected.name}'s fee records` : "Select a child to view fees"} />

      {/* Child selector */}
      {children.length > 1 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {children.map(c => (
            <Btn key={c.id} variant={selected?.id === c.id ? "primary" : "ghost"} size="sm"
              onClick={() => setSelected(c)}>{c.name}</Btn>
          ))}
        </div>
      )}

      {/* Outstanding alert */}
      {outstanding > 0 && (
        <div style={{ background: `${T.accentR}12`, border: `1px solid ${T.accentR}30`,
          borderRadius: 12, padding: "14px 20px", marginBottom: 20,
          display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{ fontSize: 28 }}>🔔</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: T.accentR }}>
              Payment Required — ₹{outstanding.toLocaleString("en-IN")} outstanding
            </div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>
              {pendingFees.length} fee{pendingFees.length !== 1 ? "s" : ""} pending for {selected?.name}.
              Contact the academy to make payment.
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "Syne", fontWeight: 900, fontSize: 22, color: T.accentR }}>
              ₹{outstanding.toLocaleString("en-IN")}
            </div>
            <div style={{ fontSize: 11, color: T.muted }}>Due now</div>
          </div>
        </div>
      )}

      {/* Summary stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18, marginBottom: 20 }}>
        <StatCard icon="💰" label="Total Billed"  value={`₹${total.toLocaleString("en-IN")}`}      color={T.text}    />
        <StatCard icon="✅" label="Paid"           value={`₹${totalPaid.toLocaleString("en-IN")}`}  color={T.accentG} />
        <StatCard icon="⚠️" label="Outstanding"   value={`₹${outstanding.toLocaleString("en-IN")}`} color={T.accentR} />
      </div>

      <Tabs tabs={[`Pending (${pendingFees.length})`, `Paid (${paidFees.length})`, "All"]}
        active={tab} onChange={setTab} />

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        <Card>
          {loading
            ? <div style={{ padding: 32, textAlign: "center", color: T.muted }}>Loading…</div>
            : displayFees.length === 0
              ? <div style={{ padding: 32, textAlign: "center", color: T.muted }}>
                  {tab === "Pending" ? "🎉 No pending fees! All payments are up to date." : "No fees found."}
                </div>
              : displayFees.map((f, i) => (
                <div key={f.id} style={{ padding: "14px 0", borderBottom: `1px solid rgba(45,33,96,.4)` }}>
                  <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                      background: f.status === "PAID" ? `${T.accentG}15` : f.status === "OVERDUE" ? `${T.accentR}15` : `${T.accentY}15`,
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                      {f.status === "PAID" ? "✅" : feeIcon(f.feeType)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{f.description || f.feeType || "Fee"}</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                        {f.batch ? (
                          <span style={{ fontSize: 10, background: `${T.primary}18`, color: T.primaryL,
                            borderRadius: 50, padding: "2px 8px", fontWeight: 700 }}>
                            🏫 Batch: {f.batch.name}
                          </span>
                        ) : (
                          <span style={{ fontSize: 10, background: `${T.accentY}18`, color: T.accentY,
                            borderRadius: 50, padding: "2px 8px", fontWeight: 700 }}>
                            💼 Variable
                          </span>
                        )}
                        {f.feeType && (
                          <span style={{ fontSize: 10, background: `${T.accent}15`, color: T.accent,
                            borderRadius: 50, padding: "2px 8px", fontWeight: 700 }}>
                            {f.feeType}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>
                        📅 Due: {f.dueDate || "—"}
                        {f.paidDate && <span style={{ color: T.accentG }}> · ✅ Paid: {f.paidDate}</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontFamily: "Syne", fontWeight: 900, fontSize: 16,
                        color: f.status === "PAID" ? T.accentG : f.status === "OVERDUE" ? T.accentR : T.accentY }}>
                        ₹{Number(f.amount).toLocaleString("en-IN")}
                      </div>
                      <Badge type={f.status === "PAID" ? "success" : f.status === "OVERDUE" ? "danger" : "warning"}>
                        {f.status}
                      </Badge>
                    </div>
                  </div>
                  {/* Payment action for unpaid */}
                  {f.status !== "PAID" && (
                    <div style={{ marginTop: 10, paddingLeft: 56, display: "flex", gap: 10, alignItems: "center" }}>
                      <div style={{ flex: 1, fontSize: 11, color: T.muted }}>
                        Contact the academy to process this payment.
                      </div>
                      <Btn size="xs" variant="accent">💳 Pay Now</Btn>
                    </div>
                  )}
                </div>
              ))
          }
        </Card>

        <Card style={{ padding: 24 }}>
          <div style={{ fontFamily: "Syne", fontWeight: 700, marginBottom: 14 }}>
            Payment Summary — {selected?.name}
          </div>
          {[["Total Billed", `₹${total.toLocaleString("en-IN")}`,      T.text],
            ["Paid",         `₹${totalPaid.toLocaleString("en-IN")}`,  T.accentG],
            ["Outstanding",  `₹${outstanding.toLocaleString("en-IN")}`, T.accentR]
          ].map(([l, v, c]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between",
              fontSize: 13, padding: "8px 0", borderBottom: `1px solid rgba(45,33,96,.4)` }}>
              <span style={{ color: T.muted }}>{l}</span>
              <span style={{ fontFamily: "Syne", fontWeight: 800, color: c }}>{v}</span>
            </div>
          ))}

          {total > 0 && (
            <div style={{ marginTop: 14 }}>
              <ProgressBar value={total > 0 ? Math.round((totalPaid / total) * 100) : 0}
                color={T.accentG} height={8} />
              <div style={{ fontSize: 11, color: T.muted, marginTop: 6 }}>
                Payment rate: {total > 0 ? Math.round((totalPaid / total) * 100) : 0}%
              </div>
            </div>
          )}

          {outstanding > 0 && (
            <div style={{ marginTop: 16 }}>
              <Btn variant="danger" full>
                💳 Pay ₹{outstanding.toLocaleString("en-IN")} Now
              </Btn>
              <div style={{ fontSize: 10, color: T.muted, textAlign: "center", marginTop: 8 }}>
                Contact academy to process payment
              </div>
            </div>
          )}

          {outstanding === 0 && paidFees.length > 0 && (
            <div style={{ marginTop: 16, background: `${T.accentG}12`, border: `1px solid ${T.accentG}30`,
              borderRadius: 9, padding: "12px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>🎉</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.accentG }}>All Paid!</div>
              <div style={{ fontSize: 11, color: T.muted }}>No outstanding fees.</div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export const ParentMessages = () => {
  const [conversations, setConversations] = useState([]);
  const [activeTeacher, setActiveTeacher] = useState(null); // { teacherId, teacherName, department }
  const [messages,      setMessages]      = useState([]);
  const [draft,         setDraft]         = useState("");
  const [sending,       setSending]       = useState(false);
  const [searchQ,       setSearchQ]       = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching,     setSearching]     = useState(false);
  const [confirmTeacher,setConfirmTeacher]= useState(null);
  const [loadingMsgs,   setLoadingMsgs]   = useState(false);
  const bottomRef = React.useRef(null);
  const pollRef   = React.useRef(null);

  // Load existing conversations
  useEffect(() => {
    getParentConversations().then(d => setConversations(Array.isArray(d) ? d : [])).catch(console.error);
  }, []);

  // Poll messages for active thread
  useEffect(() => {
    if (!activeTeacher) return;
    loadMessages(activeTeacher.teacherId);
    pollRef.current = setInterval(() => loadMessages(activeTeacher.teacherId), 5000);
    return () => clearInterval(pollRef.current);
  }, [activeTeacher]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMessages = (teacherId) => {
    setLoadingMsgs(true);
    getParentChatMessages(teacherId)
      .then(d => setMessages(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoadingMsgs(false));
  };

  const openConversation = (conv) => {
    setActiveTeacher({ teacherId: conv.teacherId, teacherName: conv.teacherName, department: conv.department });
    setMessages([]);
  };

  // Search teachers as parent types
  useEffect(() => {
    if (!searchQ.trim()) { setSearchResults([]); return; }
    const t = setTimeout(() => {
      setSearching(true);
      searchTeachersForChat(searchQ)
        .then(d => setSearchResults(Array.isArray(d) ? d : []))
        .catch(console.error)
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(t);
  }, [searchQ]);

  const handleStartConversation = () => {
    if (!confirmTeacher) return;
    const already = conversations.find(c => c.teacherId === confirmTeacher.id);
    if (!already) {
      setConversations(prev => [...prev, {
        teacherId:   confirmTeacher.id,
        teacherName: confirmTeacher.name,
        department:  confirmTeacher.department,
        unread: 0,
      }]);
    }
    setActiveTeacher({ teacherId: confirmTeacher.id, teacherName: confirmTeacher.name, department: confirmTeacher.department });
    setMessages([]);
    setConfirmTeacher(null);
    setSearchQ("");
    setSearchResults([]);
  };

  const handleSend = async () => {
    if (!draft.trim() || !activeTeacher) return;
    setSending(true);
    try {
      await sendParentMessage(activeTeacher.teacherId, draft.trim());
      setDraft("");
      loadMessages(activeTeacher.teacherId);
    } catch (err) { alert("Error: " + err.message); }
    finally { setSending(false); }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="fade-up">
      <PageHeader title="Message to Teacher" subtitle="One-on-one communication with teachers" />
      <div className="lms-responsive-split-2-1" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, alignItems: "start" }}>

        {/* ── Chat Panel ── */}
        <Card style={{ padding: 0, overflow: "hidden" }}>
          {!activeTeacher ? (
            <div style={{ padding: 48, textAlign: "center", color: T.muted }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>💬</div>
              <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 16, marginBottom: 6 }}>No conversation selected</div>
              <div style={{ fontSize: 13 }}>Search for a teacher on the right to start chatting.</div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 12, background: T.bg3 }}>
                <Avatar name={activeTeacher.teacherName} size={36} color={T.accentG} />
                <div>
                  <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 14 }}>{activeTeacher.teacherName}</div>
                  <div style={{ fontSize: 11, color: T.muted }}>{activeTeacher.department || "Teacher"}</div>
                </div>
              </div>

              {/* Messages */}
              <div style={{ padding: 16, minHeight: 280, maxHeight: 380, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
                {loadingMsgs && messages.length === 0 ? (
                  <div style={{ textAlign: "center", color: T.muted, padding: 24, fontSize: 13 }}>Loading…</div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: "center", color: T.muted, padding: 24, fontSize: 13 }}>No messages yet. Start the conversation! 👋</div>
                ) : messages.map(msg => {
                  const isMe = msg.senderRole === "PARENT";
                  return (
                    <div key={msg.id} style={{ display: "flex", gap: 8, justifyContent: isMe ? "flex-end" : "flex-start", alignItems: "flex-end" }}>
                      {!isMe && <Avatar name={activeTeacher.teacherName} size={28} color={T.accentG} />}
                      <div style={{ maxWidth: "70%" }}>
                        <div style={{
                          background: isMe ? T.primary : T.card2 || T.bg3,
                          borderRadius: isMe ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                          padding: "10px 14px", fontSize: 13, lineHeight: 1.5,
                          color: isMe ? "#fff" : T.text,
                        }}>{msg.content}</div>
                        <div style={{ fontSize: 10, color: T.muted, marginTop: 3, textAlign: isMe ? "right" : "left" }}>
                          {msg.sentAt ? new Date(msg.sentAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : ""}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div style={{ padding: "12px 16px", borderTop: `1px solid ${T.border}`, display: "flex", gap: 10 }}>
                <input
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message… (Enter to send)"
                  style={{ flex: 1, background: T.bg3, border: `1.5px solid ${T.border}`, borderRadius: 9, padding: "10px 14px", fontSize: 13, color: T.text, outline: "none", fontFamily: "DM Sans" }}
                />
                <Btn variant="primary" onClick={handleSend} disabled={sending || !draft.trim()}>
                  {sending ? "…" : "Send"}
                </Btn>
              </div>
            </>
          )}
        </Card>

        {/* ── Right: Search + Teachers list ── */}
        <Card>
          {/* Search box */}
          <div style={{ fontFamily: "Syne", fontWeight: 700, marginBottom: 12, fontSize: 14 }}>🔍 Search Teacher</div>
          <div style={{ position: "relative", marginBottom: 16 }}>
            <input
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="Search by name or department…"
              style={{ width: "100%", background: T.bg3, border: `1.5px solid ${T.border}`, borderRadius: 9, padding: "9px 14px", fontSize: 13, color: T.text, outline: "none", fontFamily: "DM Sans", boxSizing: "border-box" }}
            />
            {/* Dropdown results */}
            {(searchResults.length > 0 || searching) && searchQ.trim() && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: T.card, border: `1.5px solid ${T.border}`, borderRadius: 10, zIndex: 99, marginTop: 4, boxShadow: "0 8px 32px rgba(0,0,0,.4)", overflow: "hidden" }}>
                {searching && searchResults.length === 0 ? (
                  <div style={{ padding: "10px 14px", fontSize: 12, color: T.muted }}>Searching…</div>
                ) : searchResults.map(t => (
                  <div key={t.id}
                    onClick={() => { setConfirmTeacher(t); setSearchQ(""); setSearchResults([]); }}
                    style={{ padding: "10px 14px", display: "flex", gap: 10, alignItems: "center", cursor: "pointer", borderBottom: `1px solid ${T.border}` }}
                    onMouseEnter={e => e.currentTarget.style.background = T.bg3}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <Avatar name={t.name} size={28} color={T.accentG} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{t.name}</div>
                      <div style={{ fontSize: 11, color: T.muted }}>{t.department || "Teacher"}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Conversations list */}
          <div style={{ fontFamily: "Syne", fontWeight: 700, marginBottom: 10, fontSize: 13 }}>Teachers</div>
          {conversations.length === 0 ? (
            <div style={{ color: T.muted, fontSize: 12, textAlign: "center", padding: "16px 0" }}>No conversations yet.<br />Search for a teacher above to start.</div>
          ) : conversations.map(c => (
            <div key={c.teacherId}
              onClick={() => openConversation(c)}
              style={{ display: "flex", gap: 10, alignItems: "center", background: activeTeacher?.teacherId === c.teacherId ? `${T.accentG}18` : T.bg3, border: `1.5px solid ${activeTeacher?.teacherId === c.teacherId ? T.accentG : "transparent"}`, borderRadius: 9, padding: 10, marginBottom: 8, cursor: "pointer", transition: "all .15s" }}>
              <Avatar name={c.teacherName} size={34} color={T.accentG} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.teacherName}</div>
                <div style={{ fontSize: 11, color: T.muted }}>{c.department || "Teacher"}</div>
              </div>
              {c.unread > 0 && (
                <div style={{ minWidth: 18, height: 18, borderRadius: 9, background: T.accentR, color: "#fff", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>{c.unread}</div>
              )}
            </div>
          ))}
        </Card>
      </div>

      {/* ── Confirm Start Conversation Modal ── */}
      {confirmTeacher && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: T.card, borderRadius: 16, padding: 28, width: 340, boxShadow: "0 20px 60px rgba(0,0,0,.5)" }}>
            <div style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 17, marginBottom: 8 }}>Start Conversation?</div>
            <div style={{ display: "flex", gap: 12, alignItems: "center", background: T.bg3, borderRadius: 10, padding: 12, marginBottom: 20 }}>
              <Avatar name={confirmTeacher.name} size={40} color={T.accentG} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{confirmTeacher.name}</div>
                <div style={{ fontSize: 12, color: T.muted }}>{confirmTeacher.department || "Teacher"}</div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: T.muted, marginBottom: 20 }}>
              This will open a one-on-one chat thread with this teacher.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn variant="ghost" full onClick={() => setConfirmTeacher(null)}>Cancel</Btn>
              <Btn variant="primary" full onClick={handleStartConversation}>OK, Start Chat →</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── DYNAMIC: Real notifications, fallback to static if empty ──────────────────
export const ParentNotifications = () => {
  const [notifs, setNotifs]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("ALL");

  useEffect(() => {
    getParentNotifications()
      .then(d => setNotifs(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleMarkRead = async id => {
    await markParentNotifRead(id).catch(console.error);
    setNotifs(n => n.map(x => x.id === id ? { ...x, read: true } : x));
  };
  const handleMarkAll = async () => {
    await markParentNotifReadAll().catch(console.error);
    setNotifs(n => n.map(x => ({ ...x, read: true })));
  };

  const typeIcon  = { INFO: "ℹ️", WARNING: "⚠️", SUCCESS: "✅", ERROR: "❌" };
  const typeColor = { INFO: T.accent, WARNING: T.accentY, SUCCESS: T.accentG, ERROR: "#ef4444" };
  const unreadCount = notifs.filter(n => !n.read).length;
  const filtered = filter === "ALL" ? notifs
    : filter === "UNREAD" ? notifs.filter(n => !n.read)
    : notifs.filter(n => n.type === filter);

  return (
    <div className="fade-up">
      <PageHeader title="Notifications"
        subtitle={`${unreadCount} unread · ${notifs.length} total`}
        actions={[<Btn variant="ghost" size="sm" onClick={handleMarkAll} disabled={unreadCount === 0}>✓ Mark All Read</Btn>]} />

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { key: "ALL",     label: `All (${notifs.length})` },
          { key: "UNREAD",  label: `🔵 Unread (${unreadCount})` },
          { key: "WARNING", label: "💳 Fee Alerts" },
          { key: "INFO",    label: "ℹ️ Info" },
          { key: "SUCCESS", label: "✅ Success" },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            style={{ padding: "6px 14px", borderRadius: 50, cursor: "pointer",
              border: `1.5px solid ${filter === f.key ? T.primary : T.border}`,
              background: filter === f.key ? `${T.primary}20` : "transparent",
              color: filter === f.key ? T.primary : T.muted, fontWeight: 600, fontSize: 12 }}>
            {f.label}
          </button>
        ))}
      </div>

      <Card>
        {loading ? <div style={{ padding: 32, textAlign: "center", color: T.muted }}>Loading…</div>
        : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: T.muted }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🔔</div>
            <div style={{ fontFamily: "Syne", fontWeight: 700 }}>No notifications yet</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>Fee alerts and school updates will appear here.</div>
          </div>
        ) : filtered.map((n, i) => (
          <div key={n.id} onClick={() => !n.read && handleMarkRead(n.id)}
            style={{ display: "flex", gap: 14, padding: "14px 0",
              borderBottom: i < filtered.length - 1 ? `1px solid rgba(45,33,96,.3)` : "none",
              alignItems: "flex-start", cursor: !n.read ? "pointer" : "default",
              background: !n.read ? `${T.primary}05` : "transparent" }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: `${typeColor[n.type] || "#ef4444"}18`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
              {typeIcon[n.type] || "🔔"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: n.read ? 500 : 700 }}>{n.title}</div>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 3, lineHeight: 1.5 }}>{n.message}</div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 5 }}>
                {n.createdAt ? new Date(n.createdAt).toLocaleString("en-IN", {
                  day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
              </div>
            </div>
            {!n.read && <div style={{ width: 10, height: 10, borderRadius: "50%",
              background: typeColor[n.type] || "#ef4444", flexShrink: 0, marginTop: 6 }} />}
          </div>
        ))}
      </Card>
    </div>
  );
};

// ─── PARENT DASHBOARD WRAPPER ─────────────────────────────────────────────────
const ParentTimetable = () => {
  const DAYS = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];
  const DAY_SHORT = { MONDAY:"Mon", TUESDAY:"Tue", WEDNESDAY:"Wed", THURSDAY:"Thu", FRIDAY:"Fri", SATURDAY:"Sat" };
  const COLORS = ["#7c3aed","#06b6d4","#10b981","#f59e0b","#ef4444","#a78bfa","#34d399"];
  const [slots, setSlots]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getParentTimetable()
      .then(d => setSlots(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const timeKeys = [...new Set(slots.map(s => s.startTime + "–" + s.endTime))].sort();
  const cellColor = (course) => COLORS[Math.abs((course?.id || 0) * 3) % COLORS.length];

  return (
    <div className="fade-up">
      <PageHeader title="Children's Timetable" subtitle="Class schedules for your linked children" />
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {loading ? <div style={{ padding: 40, textAlign: "center", color: T.muted }}>Loading…</div>
        : slots.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: T.muted }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>📅</div>
            <div style={{ fontFamily: "Syne", fontWeight: 700 }}>No timetable available</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>Your child's class schedule will appear here.</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
              <thead>
                <tr>
                  <th style={{ padding: "12px 16px", fontSize: 11, fontWeight: 800, color: T.muted,
                    textTransform: "uppercase", borderBottom: `1px solid ${T.border}`, background: T.bg3, textAlign: "left" }}>TIME</th>
                  {DAYS.map(d => (
                    <th key={d} style={{ padding: "12px 16px", fontSize: 11, fontWeight: 800, color: T.muted,
                      textTransform: "uppercase", borderBottom: `1px solid ${T.border}`, background: T.bg3, textAlign: "left" }}>{DAY_SHORT[d]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeKeys.map(tk => (
                  <tr key={tk}>
                    <td style={{ padding: "10px 16px", fontSize: 12, fontWeight: 700, color: T.primaryL,
                      borderBottom: `1px solid rgba(45,33,96,.3)`, background: T.bg3, whiteSpace: "nowrap" }}>
                      {tk.replace("–"," – ")}
                    </td>
                    {DAYS.map(day => {
                      const cell = slots.find(s => s.startTime + "–" + s.endTime === tk && s.dayOfWeek === day);
                      return (
                        <td key={day} style={{ padding: "10px 16px", borderBottom: `1px solid rgba(45,33,96,.3)` }}>
                          {cell ? (
                            <div style={{ background: `${cellColor(cell.course)}12`,
                              border: `1px solid ${cellColor(cell.course)}35`,
                              borderRadius: 8, padding: "8px 10px" }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: cellColor(cell.course) }}>{cell.course?.title}</div>
                              <div style={{ fontSize: 11, color: T.muted }}>{cell.teacher?.name || "—"}</div>
                              {cell.room && <div style={{ fontSize: 10, color: T.muted }}>🚪 {cell.room}</div>}
                            </div>
                          ) : <span style={{ color: T.muted }}>—</span>}
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
    </div>
  );
};

const PARENT_PAGES = {
  overview:      { comp: ParentOverview      },
  profile:       { comp: ParentProfile       },
  children:      { comp: ParentChildren      },
  tracking:      { comp: ParentTracking      },
  results:       { comp: ParentResults       },
  fees:          { comp: ParentWalletDashboard },
  timetable:     { comp: ParentTimetable     },
  messages:      { comp: ParentMessages      },
  notifications: { comp: ParentNotifications },
};

export const ParentDashboard = ({ onLogout }) => {
  const [page, setPage]         = useState("overview");
  const { profile }             = useParentProfile();

  useEffect(() => {
    const requiredFeatures = {
      tracking: "ATTENDANCE",
      results: "ASSIGNMENTS",
      fees: "FEES",
      timetable: "TIMETABLE"
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

  const { pct, missing } = calcProfileCompletion("parent", profile || {});
  const { comp: Comp } = PARENT_PAGES[page] || PARENT_PAGES.overview;

  return (
    <DashLayout role="parent" page={page} onNav={setPage} onLogout={onLogout}>
      <ProfileAlert pct={pct} missing={missing} onComplete={() => setPage("profile")} />
      <Comp onNav={setPage} />
    </DashLayout>
  );
};
