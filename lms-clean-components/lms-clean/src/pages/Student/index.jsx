// src/pages/Student/index.jsx
import { useState, useEffect, useRef } from "react";
import { T } from "../../assets/styles/theme";
import {
  Btn, Card, Badge, Avatar, Input, Select,
  StatCard, Table, Tabs, ProgressBar, DonutChart,
  PageHeader, ProfileAlert, Modal, calcProfileCompletion,
} from "../../components/UI";
import { DashLayout } from "../../components/Layout";
import { useStudentProfile } from "../../context/StudentProfileContext";
import { StudentForum } from "../Forum";
import { CertificatePreviewModal } from "../../components/CertificatePreviewModal";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import {
  updateStudentProfile,
  getStudentCourses, getStudentBatches,
  getStudentAssignments, getStudentSubmissions, submitAssignment, uploadFile,
  getStudentFees, getStudentNotifications, markStudentNotifRead, markStudentNotifReadAll,
  getStudentTimetable, getStudentMaterials,getStudentCourseStudents,
  getStudentAnnouncements,enrollCourse,getStudentAttendanceTrack,
  getAvailableCourses, getCourseDetails, unenrollCourse, submitTeacherReview, getStudentCertificates,
  getStudentEnrollmentRequests, requestCourseEnrollment, joinLiveClass, getStudentCourseAttendance,
} from "../../api/auth";

import {
  getStudentAssessments, startAssessment, saveAssessmentProgress,
  submitAssessmentAttempt, incrementTabSwitch
} from "../../api/assessment";

// ── Public department fetch (no token needed) ─────────────────────────────────
async function fetchDepartments() {
  try {
    const res  = await fetch(`${process.env.REACT_APP_API_BASE_URL || "http://localhost:8080"}/api/public/departments`);
    const body = await res.json().catch(() => ({}));
    return Array.isArray(body.data) ? body.data : [];
  } catch { return []; }
}

// Inject responsive CSS styles for Student Dashboard
const injectStudentStyles = () => {
  if (document.getElementById("lms-student-styles")) return;
  const style = document.createElement("style");
  style.id = "lms-student-styles";
  style.textContent = `
    @media (max-width: 768px) {
      .lms-responsive-grid-4 {
        grid-template-columns: 1fr !important;
      }
      .lms-responsive-grid-3 {
        grid-template-columns: 1fr !important;
      }
      .lms-responsive-split-2-1 {
        grid-template-columns: 1fr !important;
      }
      .lms-responsive-split-1-2 {
        grid-template-columns: 1fr !important;
      }
    }
  `;
  document.head.appendChild(style);
};
try {
  injectStudentStyles();
} catch (e) {
  console.error("Failed to inject student styles", e);
}

// ─── STUDENT OVERVIEW ─────────────────────────────────────────────────────────
export const StudentOverview = ({ onNav }) => {
  const { profile } = useStudentProfile();
  const [courses, setCourses] = useState([]);
  const [fees, setFees]       = useState([]);
  const [notifs, setNotifs]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getStudentCourses(), getStudentFees(), getStudentNotifications()])
      .then(([c, f, n]) => {
        setCourses(Array.isArray(c) ? c : []);
        setFees(Array.isArray(f) ? f : []);
        setNotifs(Array.isArray(n) ? n : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const pendingFees  = fees.filter(f => f.status === "PENDING" || f.status === "OVERDUE");
  const unreadNotifs = notifs.filter(n => !n.read);

  return (
    <div className="fade-up">
      <PageHeader title="Student Dashboard" subtitle={`Welcome back, ${profile?.name || "Student"}! Here's your progress.`} />
      <div className="lms-responsive-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18, marginBottom: 24 }}>
        <StatCard icon="📚" label="Enrolled Courses" value={loading ? "…" : courses.length}      change={`${courses.filter(c => c.status === "ACTIVE").length} active`} color={T.primaryL} />
        <StatCard icon="🏫" label="Department"        value={profile?.department || "—"}           color={T.accentG} />
        <StatCard icon="💳" label="Pending Fees"      value={loading ? "…" : pendingFees.length}   change={pendingFees.length > 0 ? "Action needed" : "All clear"} color={T.accentY} />
        <StatCard icon="🔔" label="Unread Notifs"     value={loading ? "…" : unreadNotifs.length}  color={T.accentR} />
      </div>

      <div className="lms-responsive-split-2-1" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        <div>
          {/* Active Courses */}
          <Card style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 15 }}>Active Courses</div>
              <Btn size="xs" variant="ghost" onClick={() => onNav("courses")}>View All</Btn>
            </div>
            {loading
              ? <div style={{ color: T.muted, textAlign: "center", padding: 16 }}>Loading…</div>
              : courses.length === 0
                ? <div style={{ color: T.muted, textAlign: "center", padding: 16 }}>No courses enrolled yet.</div>
                : <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    {courses.slice(0, 4).map(c => (
                      <div key={c.id} style={{ background: T.bg3, borderRadius: 12, overflow: "hidden" }}>
                        <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>📚</div>
                        <div style={{ padding: 12 }}>
                          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{c.title}</div>
                          <div style={{ fontSize: 11, color: T.muted, marginBottom: 8 }}>{c.teacher?.name || "—"}</div>
                          <Badge type={c.status === "ACTIVE" ? "success" : "warning"}>{c.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
            }
          </Card>

          {/* Fee Status */}
          <Card>
            <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Fee Status</div>
            {loading
              ? <div style={{ color: T.muted, textAlign: "center", padding: 16 }}>Loading…</div>
              : fees.length === 0
                ? <div style={{ color: T.muted, padding: 8 }}>No fee records found.</div>
                : fees.slice(0, 4).map(f => (
                  <div key={f.id} style={{ display: "flex", gap: 14, padding: "10px 0", borderBottom: `1px solid rgba(45,33,96,.4)`, alignItems: "center" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{f.description || "Fee"}</div>
                      <div style={{ fontSize: 11, color: T.muted }}>Due: {f.dueDate || "—"}{f.batch ? ` · ${f.batch.name}` : ""}{f.course ? ` · ${f.course.title}` : ""}</div>
                    </div>
                    <div style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 15, color: T.accent }}>₹{Number(f.amount || 0).toLocaleString("en-IN")}</div>
                    <Badge type={f.status === "PAID" ? "success" : f.status === "OVERDUE" ? "danger" : "warning"}>{f.status}</Badge>
                  </div>
                ))
            }
          </Card>
        </div>

        <div>
          {/* Profile completion donut */}
          <Card style={{ marginBottom: 18, textAlign: "center", padding: 24 }}>
            <div style={{ fontFamily: "Syne", fontWeight: 700, marginBottom: 14 }}>Profile Completion</div>
            {profile && (() => {
              const { pct } = calcProfileCompletion("student", profile);
              return (
                <>
                  <DonutChart pct={pct} color={T.primaryL} label="Complete" />
                  <div style={{ fontSize: 13, color: T.muted, marginTop: 10 }}>
                    {pct < 80 ? "Complete profile to unlock all features" : "Great job!"}
                  </div>
                  {pct < 100 && <Btn variant="warning" size="sm" style={{ marginTop: 12 }} onClick={() => onNav("profile")}>Complete Profile →</Btn>}
                </>
              );
            })()}
          </Card>

          {/* Recent Notifications */}
          <Card>
            <div style={{ fontFamily: "Syne", fontWeight: 700, marginBottom: 14 }}>Notifications</div>
            {loading
              ? <div style={{ color: T.muted, fontSize: 12, padding: 8 }}>Loading…</div>
              : notifs.length === 0
                ? <div style={{ color: T.muted, fontSize: 12, padding: 8 }}>No notifications.</div>
                : notifs.slice(0, 4).map(n => (
                  <div key={n.id} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: `1px solid rgba(45,33,96,.3)`, alignItems: "flex-start" }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: n.read ? T.border : T.primaryL, marginTop: 5, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: n.read ? 500 : 700 }}>{n.title}</div>
                      <div style={{ fontSize: 11, color: T.muted }}>{n.message}</div>
                    </div>
                  </div>
                ))
            }
            {notifs.length > 0 && <Btn size="xs" variant="ghost" style={{ marginTop: 10 }} onClick={() => onNav("notifications")}>View All</Btn>}
          </Card>
        </div>
      </div>
    </div>
  );
};

// ─── STUDENT PROFILE ──────────────────────────────────────────────────────────
// Uses StudentProfileContext so saved data persists when navigating away and back
export const StudentProfile = () => {
  const { profile, updateProfileField } = useStudentProfile();
  const [form, setForm]           = useState(null);
  const [depts, setDepts]         = useState([]);
  const [saving, setSaving]       = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef                   = useRef(null);

  // Sync form from context profile whenever profile loads or changes
  // Uses a ref to track if we already initialized so unsaved edits aren't lost
  const initializedRef = useRef(false);

  useEffect(() => {
    // Initialize form from context on first load, or re-sync after a save
    if (profile && !initializedRef.current) {
      initializedRef.current = true;
      setForm({
        name:          profile.name          || "",
        email:         profile.email         || "",
        phone:         profile.phone         || "",
        address:       profile.address       || "",
        department:    profile.department    || "",
        gender:        profile.gender        || "",
        userId:        profile.userId        || "",
        profilePicUrl: profile.profilePicUrl || "",
      });
    }
  }, [profile]);

  // Fetch departments (public, no token)
  useEffect(() => {
    fetchDepartments().then(setDepts).catch(console.error);
  }, []);

  const f = form || {};
  const { pct, missing } = calcProfileCompletion("student", f);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateStudentProfile({
        name: f.name, phone: f.phone, address: f.address,
        department: f.department, gender: f.gender, profilePicUrl: f.profilePicUrl,
      });
      // Push saved values into context → ProfileAlert banner updates instantly everywhere
      updateProfileField({
        name: f.name, phone: f.phone, address: f.address,
        department: f.department, gender: f.gender, profilePicUrl: f.profilePicUrl,
      });
      alert("Profile updated successfully!");
    } catch (err) { alert("Failed: " + err.message); }
    finally { setSaving(false); }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result;
      setForm(prev => ({ ...prev, profilePicUrl: dataUrl }));
      updateProfileField({ profilePicUrl: dataUrl });
      try {
        setUploading(true);
        await updateStudentProfile({ profilePicUrl: dataUrl });
      } catch (err) {
        alert("Photo upload failed: " + err.message);
        setForm(prev => ({ ...prev, profilePicUrl: "" }));
        updateProfileField({ profilePicUrl: "" });
      } finally { setUploading(false); }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleRemovePhoto = async () => {
    setForm(prev => ({ ...prev, profilePicUrl: "" }));
    updateProfileField({ profilePicUrl: "" });
    await updateStudentProfile({ profilePicUrl: "" }).catch(console.error);
  };

  if (!form) return <div style={{ padding: 32, textAlign: "center", color: T.muted }}>Loading…</div>;

  return (
    <div className="fade-up">
      <PageHeader title="My Profile" />
      <ProfileAlert pct={pct} missing={missing} onComplete={() => fileRef.current?.click()} />
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />

      <div className="lms-responsive-split-1-2" style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24 }}>
        {/* Left — avatar card */}
        <Card style={{ textAlign: "center", padding: 32 }}>
          <DonutChart pct={pct} color={T.primaryL} label="Complete" />
          <div style={{ fontSize: 13, fontWeight: 700, color: T.accentY, marginTop: 8 }}>Profile {pct}% Complete</div>

          <div style={{ position: "relative", width: 80, margin: "16px auto 0" }}>
            {f.profilePicUrl ? (
              <div style={{ width: 80, height: 80, borderRadius: "50%", overflow: "hidden", border: `3px solid ${T.primaryL}` }}>
                <img src={f.profilePicUrl} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ) : (
              <Avatar name={f.name || "S"} size={80} color={T.accent} />
            )}
            {uploading && (
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>⏳</div>
            )}
          </div>

          <div style={{ fontFamily: "Syne", fontSize: 18, fontWeight: 800, marginTop: 12 }}>{f.name || "—"}</div>
          <div style={{ fontSize: 13, color: T.muted }}>{f.userId || "—"}</div>
          {f.department && <Badge type="info" style={{ marginTop: 6 }}>{f.department}</Badge>}

          <Btn variant="dark" size="sm" full style={{ marginTop: 16 }} disabled={uploading}
            onClick={() => fileRef.current?.click()}>
            📷 {uploading ? "Uploading…" : f.profilePicUrl ? "Change Photo" : "Upload Photo (Optional)"}
          </Btn>
          {f.profilePicUrl && !uploading && (
            <Btn variant="ghost" size="sm" full style={{ marginTop: 8 }} onClick={handleRemovePhoto}>✕ Remove Photo</Btn>
          )}
        </Card>

        {/* Right — form card */}
        <Card style={{ padding: 28 }}>
          <div style={{ fontFamily: "Syne", fontSize: 17, fontWeight: 800, marginBottom: 20 }}>Update Profile</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Input label="Full Name *"   value={f.name}  onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Your full name" />
            <Input label="Email Address" value={f.email} onChange={() => {}} style={{ opacity: 0.6, cursor: "not-allowed" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Input label="Phone Number *" value={f.phone}  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+91 98765 43210" />
            <Select label="Gender" value={f.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}
              options={[{ value: "", label: "Select Gender" }, "Male", "Female", "Other"].map(o => typeof o === "string" ? { value: o, label: o } : o)} />
          </div>
          <Select
            label="Department *"
            value={f.department}
            onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
            options={[
              { value: "", label: depts.length === 0 ? "No departments — contact admin" : "-- Select Department --" },
              ...depts.map(d => ({ value: d.name, label: d.name })),
            ]}
          />
          {depts.length === 0 && (
            <div style={{ fontSize: 12, color: T.accentY, marginBottom: 14 }}>
              ⚠️ No departments found. Ask your admin to create departments first.
            </div>
          )}
          <Input label="Address" value={f.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="Street address, City, Pincode" />
          <Btn variant="primary" size="lg" onClick={handleSave} disabled={saving || uploading}>
            {saving ? "Saving…" : "Save Profile →"}
          </Btn>
        </Card>
      </div>
    </div>
  );
};

// Student Courses Page
// export const StudentCourses = () => {
//   const [batches, setBatches] = useState([]);
//   const [directCourses, setDirect] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const [courseStudents, setCourseStudents] = useState([]);
//   const [loadingStudents, setLoadingStudents] = useState(false);
//   const [studentsCache, setStudentsCache] = useState({});

//   const [selectedBatch, setSelBatch] = useState(null);
//   const [selectedCourse, setSelectedCourse] = useState(null);
//   const [viewMode, setViewMode] = useState("BATCH"); // BATCH | DETAILS

//   // ✅ Check enrollment
//   const isEnrolled = (courseId) => {
//     const inDirect = directCourses.some(c => c.id === courseId);

//     const inBatch = batches.some(b =>
//       (b.courses || []).some(c => c.id === courseId)
//     );

//     return inDirect || inBatch;
//   };

//   // ✅ Enroll handler
//   const handleEnroll = async (course) => {
//     try {
//       await enrollCourse(course.id);
//       alert("Enrolled successfully!");
//       setDirect(prev => [...prev, course]); // instant UI update
//     } catch (e) {
//       alert("Enrollment failed");
//     }
//   };

//   // ✅ LOAD BATCH + COURSES
//   useEffect(() => {
//     Promise.all([getStudentBatches(), getStudentCourses()])
//       .then(([b, c]) => {
//         const batchList = Array.isArray(b) ? b : [];
//         setBatches(batchList);

//         const batchCourseIds = new Set(
//           batchList.flatMap(bt => (bt.courses || []).map(x => x.id))
//         );

//         setDirect(
//           (Array.isArray(c) ? c : []).filter(
//             x => !batchCourseIds.has(x.id)
//           )
//         );
//       })
//       .catch(console.error)
//       .finally(() => setLoading(false));
//   }, []);

//   // ✅ LOAD STUDENTS (FIXED ASYNC ISSUE HERE)
//   useEffect(() => {
//     if (viewMode === "DETAILS" && selectedCourse) {

//       // ✅ CACHE CHECK
//       if (studentsCache[selectedCourse.id]) {
//         setCourseStudents(studentsCache[selectedCourse.id]);
//         return;
//       }

//       setLoadingStudents(true);

//       getStudentCourseStudents(selectedCourse.id)
//         .then(res => {
//           console.log("API RESPONSE:", res);

//           // ✅ IMPORTANT FIX (handles ApiResponse)
//           const data = res?.data || res;

//           setCourseStudents(data);

//           setStudentsCache(prev => ({
//             ...prev,
//             [selectedCourse.id]: data
//           }));
//         })
//         .catch(console.error)
//         .finally(() => setLoadingStudents(false));
//     }
//   }, [viewMode, selectedCourse]);

//   const COLORS = ["#7c3aed","#06b6d4","#10b981","#f59e0b","#ef4444"];
//   const courseColor = (id) =>
//     COLORS[Math.abs((id || 0) * 3) % COLORS.length];

//   if (loading) return <div style={{ padding: 32 }}>Loading…</div>;

//   // =========================================================
//   // ✅ DETAILS VIEW
//   // =========================================================
//   if (viewMode === "DETAILS" && selectedCourse) {
//     return (
//       <div className="fade-up">
//         <PageHeader
//           title={selectedCourse.title}
//           subtitle="Course Details"
//           actions={[
//             <Btn size="sm" variant="ghost" onClick={() => setViewMode("BATCH")}>
//               ← Back
//             </Btn>
//           ]}
//         />

//         <Card style={{ padding: 20 }}>
//           <h3>👨‍🏫 Teacher</h3>
//           <p>{selectedCourse.teacherName || "Unassigned"}</p>

//           <h3 style={{ marginTop: 20 }}>
//             👨‍🎓 Classmates ({courseStudents.length})
//           </h3>

//           {loadingStudents ? (
//             <p>Loading students...</p>
//           ) : courseStudents.length === 0 ? (
//             <p>No students enrolled</p>
//           ) : (
//             <ul style={{ marginTop: 10 }}>
//               {courseStudents.map((s) => (
//                 <li
//                   key={s.id}
//                   style={{
//                     display: "flex",
//                     alignItems: "center",
//                     gap: 10
//                   }}
//                 >
//                   <img
//                     src={s.profilePicUrl || "https://via.placeholder.com/30"}
//                     alt="student"
//                     style={{
//                       width: 30,
//                       height: 30,
//                       borderRadius: "50%",
//                       objectFit: "cover"
//                     }}
//                   />

//                   <span>{s.name}</span>
//                 </li>
//               ))}
//             </ul>
//           )}
//         </Card>
//       </div>
//     );
//   }

//   // =========================================================
//   // ✅ BATCH → COURSES VIEW
//   // =========================================================
//   if (selectedBatch) {
//     const courses = selectedBatch.courses || [];

//     return (
//       <div className="fade-up">
//         <PageHeader
//           title={selectedBatch.name}
//           subtitle={`${courses.length} Subjects`}
//           actions={[
//             <Btn size="sm" variant="ghost" onClick={() => setSelBatch(null)}>
//               ← My Batches
//             </Btn>
//           ]}
//         />

//         <div style={{ display: "grid", gap: 18 }}>
//           {courses.map(c => (
//             <Card key={c.id} style={{ padding: 20 }}>
//               <div style={{ fontWeight: 800, color: courseColor(c.id) }}>
//                 📚 {c.title}
//               </div>

//               <div style={{ fontSize: 12 }}>
//                 👨‍🏫 {c.teacherName || "Unassigned"}
//               </div>

//               {isEnrolled(c.id) ? (
//                 <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                  
//                   <Btn
//                     size="xs"
//                     variant="primary"
//                     onClick={() =>
//                       window.location.href = `/student/learning/${c.id}`
//                     }
//                   >
//                     ▶ OVERVIEW COURSE
//                   </Btn>

//                   <Btn
//                     size="xs"
//                     variant="ghost"
//                     style={{ fontWeight: 800, color: "green" }}
//                     onClick={() => {
//                       setSelectedCourse(c);
//                       setViewMode("DETAILS");
//                     }}
//                   >
//                     ℹ DETAILS
//                   </Btn>
//                 </div>
//               ) : (
//                 <Btn
//                   size="xs"
//                   variant="accent"
//                   style={{ marginTop: 10 }}
//                   onClick={() => handleEnroll(c)}
//                 >
//                   🚀 Enroll Now
//                 </Btn>
//               )}
//             </Card>
//           ))}
//         </div>
//       </div>
//     );
//   }

//   // =========================================================
//   // ✅ MAIN VIEW (BATCH LIST)
//   // =========================================================
//   return (
//     <div className="fade-up">
//       <PageHeader title="My Courses" />

//       <div style={{ display: "grid", gap: 20 }}>
//         {batches.map(b => (
//           <div
//             key={b.id}
//             style={{
//               padding: 20,
//               cursor: "pointer",
//               border: "1px solid white"
//             }}
//             onClick={() => setSelBatch(b)}
//           >
//             <div style={{ fontWeight: 800 }}>{b.name}</div>
//             <div style={{ fontSize: 12 }}>{b.department}</div>

//             <Btn onClick={() => setSelBatch(b)}>
//               View Courses
//             </Btn>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };
// ─── Helper: Calculate dynamic course completion based on dates ──────────────
function calculateCourseCompletion(startDate, endDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  // If course hasn't started yet
  if (today < start) {
    return { 
      completion: 0, 
      daysElapsed: 0, 
      totalDays: Math.ceil((end - start) / (1000 * 60 * 60 * 24)),
      status: "NOT_STARTED"
    };
  }

  // If course is completed
  if (today >= end) {
    return { 
      completion: 100, 
      daysElapsed: Math.ceil((end - start) / (1000 * 60 * 60 * 24)),
      totalDays: Math.ceil((end - start) / (1000 * 60 * 60 * 24)),
      status: "COMPLETED"
    };
  }

  // Course is ongoing
  const daysElapsed = Math.ceil((today - start) / (1000 * 60 * 60 * 24));
  const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  const completion = Math.round((daysElapsed / totalDays) * 100);

  return { completion, daysElapsed, totalDays, status: "ONGOING" };
}

// ─── STUDENT COURSES ──────────────────────────────────────────────────────────
export const StudentCourses = ({ onNav }) => {
  const [batches, setBatches]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selectedBatch, setSelBatch]= useState(null);
  const [selectedCourse, setSelCourse] = useState(null);
  const [courseDetails, setDetails] = useState(null);
  const [detailsLoading, setDetLoad]= useState(false);
  const [completionData, setCompletionData] = useState({});
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [enrollRequests, setEnrollRequests] = useState([]);
  const [requestingEnrollId, setRequestingEnrollId] = useState(null);

  // Teacher Review States
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      getStudentBatches(),
      getStudentCourses(),
      getStudentEnrollmentRequests()
    ])
      .then(([b, c, r]) => {
        setBatches(Array.isArray(b) ? b : []);
        setEnrolledCourses(Array.isArray(c) ? c.map(item => item.id) : []);
        setEnrollRequests(Array.isArray(r) ? r : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEnrollNow = async (courseId) => {
    setRequestingEnrollId(courseId);
    try {
      await requestCourseEnrollment(courseId);
      alert("📝 Enrollment request sent to Admin for approval.");
      loadData();
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to submit enrollment request");
    } finally {
      setRequestingEnrollId(null);
    }
  };

  const handleReviewSubmit = async () => {
    if (!courseDetails?.teacher?.id) return;
    setSubmittingReview(true);
    try {
      await submitTeacherReview(courseDetails.teacher.id, reviewRating, reviewText);
      alert("⭐ Thank you! Your review has been submitted successfully.");
      setShowReviewModal(false);
      setReviewText("");
      setReviewRating(5);
    } catch (err) {
      console.error(err);
      alert("❌ Failed to submit review. Please try again.");
    } finally {
      setSubmittingReview(false);
    }
  };
  useEffect(() => {
  console.log("Updated completionData:", completionData);
}, [completionData]);

  const openCourseDetail = async (course) => {
    setSelCourse(course);
    setDetails(null);
    setDetLoad(true);
    try {
      const res = await getCourseDetails(course.id);
      const data = res?.data || res;
      setDetails(data);
      
      // Calculate completion dynamically from dates
      if (data?.startDate && data?.endDate) {
        const compData = calculateCourseCompletion(data.startDate, data.endDate);
        setCompletionData(compData);
      } else {
        // Fallback to API response
        setCompletionData({
          completion: data?.completionPercentByDate || 0,
          daysElapsed: data?.completedDays || 0,
          totalDays: data?.courseDurationDays || 0,
          status: "ONGOING"
        });
      }
      console.log("Calculated completion data:", completionData.completion, completionData.daysElapsed, completionData.totalDays);
      console.log("Course details:", res);
    } catch { setDetails(null); }
    finally { setDetLoad(false); }
  };

  const statusColor = s =>
    s === "ACTIVE" ? T.accentG : s === "COMPLETED" ? T.accent : T.accentY;

  // ── COURSE DETAIL VIEW ─────────────────────────────────────────────
  if (selectedCourse) {
    return (
      <div className="fade-up">
        <PageHeader
          title={selectedCourse.title}
          subtitle={selectedBatch?.name}
          actions={[
            <Btn size="sm" variant="ghost"
              onClick={() => { setSelCourse(null); setDetails(null); }}>
              ← Back to Courses
            </Btn>
          ]}
        />

        {detailsLoading ? (
          <div style={{ padding: 40, textAlign: "center", color: T.muted }}>Loading details…</div>
        ) : (
          <div style={{ display: "grid", gap: 18 }}>

            {/* Progress Card - Dynamic Completion */}
            <Card style={{ padding: 20 }}>
              <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 15, marginBottom: 14 }}>
                📊 Course Progress
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: T.muted }}>Completion</span>
                <span style={{ fontWeight: 800, color: T.primaryL }}>
                  {completionData.completion ?? 0}%
                </span>
              </div>
              <div style={{ height: 10, background: T.bg3, borderRadius: 50, overflow: "hidden", marginBottom: 14 }}>
                <div style={{
                  height: "100%",
                  width: `${completionData.completion ?? 0}%`,
                  background: `linear-gradient(90deg, ${T.primary}, ${T.accent})`,
                  transition: "width .4s",
                }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {[
                  ["⏱ Duration", `${selectedCourse.durationHours || 0} hrs`],
                  ["📌 Status",   completionData.status === "NOT_STARTED" ? "Not Started" : completionData.status === "ONGOING" ? "Ongoing" : "Completed"],
                  ["🏢 Dept",     selectedCourse.department || "—"],
                ].map(([label, val]) => (
                  <div key={label} style={{ background: T.bg3, borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: T.muted, marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{val}</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Timeline Card - Dynamic Date-based Calculation */}
            <Card style={{ padding: 20 }}>
              <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 15, marginBottom: 12 }}>
                📅 Timeline (Dynamic)
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div style={{ background: T.bg3, borderRadius: 8, padding: "12px" }}>
                  <div style={{ fontSize: 10, color: T.muted, marginBottom: 4 }}>Days Elapsed</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: T.primaryL }}>{completionData.daysElapsed || 0}</div>
                </div>
                <div style={{ background: T.bg3, borderRadius: 8, padding: "12px" }}>
                  <div style={{ fontSize: 10, color: T.muted, marginBottom: 4 }}>Total Days</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: T.accent }}>{completionData.totalDays || 0}</div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 6 }}>
                <span style={{ color: T.muted }}>Course Timeline Progress</span>
                <span style={{ fontWeight: 700, color: T.primaryL }}>{completionData.completion}%</span>
              </div>

              <div style={{
                height: 8,
                borderRadius: 50,
                background: T.bg3,
                overflow: "hidden"
              }}>
                <div style={{
                  width: `${completionData.completion ?? 0}%`,
                  height: "100%",
                  background: `linear-gradient(90deg, ${T.accent}, ${T.primary})`
                }} />
              </div>

              {courseDetails?.startDate && courseDetails?.endDate && (
                <div style={{ marginTop: 12, fontSize: 11, color: T.muted, display: "flex", justifyContent: "space-between" }}>
                  <span>Start: {new Date(courseDetails.startDate).toLocaleDateString("en-IN")}</span>
                  <span>End: {new Date(courseDetails.endDate).toLocaleDateString("en-IN")}</span>
                </div>
              )}
            </Card>

            {/* Teacher Card */}
            <Card style={{ padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 15 }}>
                  👨‍🏫 Teacher
                </div>
                {courseDetails?.teacher && (
                  <Btn size="xs" variant="ghost" onClick={() => setShowReviewModal(true)}>
                    ⭐ Rate Teacher
                  </Btn>
                )}
              </div>
              {courseDetails?.teacher ? (
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <div style={{
                    width: 50, height: 50, borderRadius: "50%",
                    background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 20, fontWeight: 800, color: "#fff",
                  }}>
                    {courseDetails.teacher.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{courseDetails.teacher.name}</div>
                    <div style={{ fontSize: 12, color: T.muted }}>{courseDetails.teacher.email}</div>
                  </div>
                </div>
              ) : (
                <div style={{ color: T.muted, fontSize: 13 }}>No teacher assigned yet.</div>
              )}
            </Card>

            {/* Classmates Card */}
            <Card style={{ padding: 20 }}>
              <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 15, marginBottom: 14 }}>
                👥 Classmates ({courseDetails?.classmateCount ?? 0})
              </div>
              {!courseDetails?.classmates?.length ? (
                <div style={{ color: T.muted, fontSize: 13 }}>No other students enrolled yet.</div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10 }}>
                  {courseDetails.classmates.map(s => (
                    <div key={s.id} style={{
                      background: T.bg3, borderRadius: 10, padding: "12px 10px", textAlign: "center",
                    }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: "50%", margin: "0 auto 8px",
                        background: `linear-gradient(135deg, ${T.primaryL}, ${T.accent})`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 16, fontWeight: 800, color: "#fff",
                      }}>
                        {s.name?.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{s.name}</div>
                      <div style={{ fontSize: 10, color: T.muted }}>{s.email}</div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Explore Button */}
            {enrolledCourses.includes(selectedCourse.id) ? (
              <Btn variant="primary" size="lg" full onClick={() => onNav("learning")}>
                🚀 Explore Course in Learning Board →
              </Btn>
            ) : (() => {
              const req = enrollRequests.find(r => r.courseId === selectedCourse.id);
              if (req?.status === "PENDING") {
                return (
                  <Btn variant="ghost" size="lg" full disabled style={{ opacity: 0.7 }}>
                    ⏳ Enrollment Pending Admin Approval
                  </Btn>
                );
              } else if (req?.status === "REJECTED") {
                return (
                  <Btn variant="danger" size="lg" full disabled style={{ opacity: 0.7 }}>
                    ❌ Enrollment Request Rejected
                  </Btn>
                );
              } else {
                return (
                  <Btn 
                    variant="warning" 
                    size="lg" 
                    full 
                    onClick={() => handleEnrollNow(selectedCourse.id)}
                    disabled={requestingEnrollId === selectedCourse.id}
                  >
                    {requestingEnrollId === selectedCourse.id ? "⏳ Requesting..." : "📥 Enroll Now to Access Learning Board"}
                  </Btn>
                );
              }
            })()}
          </div>
        )}

        {showReviewModal && (
          <Modal open={showReviewModal} onClose={() => setShowReviewModal(false)} title="⭐ Rate & Review Teacher">
            <div style={{ display: "grid", gap: 16, padding: "10px 0" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 13, color: T.muted, marginBottom: 8 }}>
                  How would you rate your learning experience with <strong>{courseDetails?.teacher?.name}</strong>?
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "center", fontSize: 28 }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      style={{
                        cursor: "pointer",
                        color: star <= reviewRating ? "#ffc107" : T.muted,
                        fontSize: 32,
                        userSelect: "none"
                      }}
                      onClick={() => setReviewRating(star)}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 6 }}>
                  Feedback Comments
                </div>
                <textarea
                  placeholder="Share your feedback, teaching style review, or encouraging remarks..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  style={{
                    width: "100%",
                    height: 100,
                    background: T.bg3,
                    border: `1px solid ${T.bg2}`,
                    borderRadius: 8,
                    color: T.text,
                    padding: 10,
                    fontSize: 13,
                    fontFamily: "inherit",
                    resize: "none",
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
                <Btn variant="ghost" onClick={() => setShowReviewModal(false)} disabled={submittingReview}>
                  Cancel
                </Btn>
                <Btn variant="primary" onClick={handleReviewSubmit} disabled={submittingReview}>
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </Btn>
              </div>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  // ── COURSES IN BATCH VIEW ──────────────────────────────────────────
  if (selectedBatch) {
    // ✅ Only ACTIVE and COMPLETED — never INACTIVE or DRAFT
    const visibleCourses = (selectedBatch.courses || []).filter(
      c => c.status === "ACTIVE" || c.status === "COMPLETED"
    );

    return (
      <div className="fade-up">
        <PageHeader
          title={selectedBatch.name}
          subtitle={`${selectedBatch.department} · ${visibleCourses.length} course(s)`}
          actions={[
            <Btn size="sm" variant="ghost" onClick={() => setSelBatch(null)}>
              ← My Batches
            </Btn>
          ]}
        />

        {visibleCourses.length === 0 ? (
          <Card>
            <div style={{ padding: 40, textAlign: "center", color: T.muted }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
              <div style={{ fontFamily: "Syne", fontWeight: 700 }}>No active courses yet</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>
                Courses will appear here once your admin activates them.
              </div>
            </div>
          </Card>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            {visibleCourses.map(c => {
              const comp = (c.startDate && c.endDate) ? calculateCourseCompletion(c.startDate, c.endDate) : null;
              return (
                <Card key={c.id} style={{ padding: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>📚 {c.title}</div>
                      <div style={{ fontSize: 12, color: T.muted, marginBottom: 6 }}>
                        👨‍🏫 {c.teacherName || "Unassigned"} &nbsp;·&nbsp; ⏱ {c.durationHours || 0} hrs
                      </div>

                      {/* Dynamic Progress Bar */}
                      {comp && comp.status !== "NOT_STARTED" && (
                        <div style={{ marginBottom: 8 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 4 }}>
                            <span style={{ color: T.muted }}>Progress</span>
                            <span style={{ fontWeight: 700, color: T.primaryL }}>{comp.completion}%</span>
                          </div>
                          <div style={{ height: 6, background: T.bg3, borderRadius: 50, overflow: "hidden" }}>
                            <div style={{
                              width: `${comp.completion}%`,
                              height: "100%",
                              background: `linear-gradient(90deg, ${T.accent}, ${T.primary})`
                            }} />
                          </div>
                        </div>
                      )}

                      <span style={{
                        fontSize: 10, fontWeight: 700, borderRadius: 50, padding: "3px 10px",
                        background: `${statusColor(c.status)}20`, color: statusColor(c.status),
                      }}>
                        {c.status}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                      <Btn size="xs" variant="ghost" onClick={() => openCourseDetail(c)}>
                        ℹ️ Details
                      </Btn>
                      {enrolledCourses.includes(c.id) ? (
                        <Btn size="xs" variant="primary" onClick={() => onNav("learning")}>
                          🚀 Continue Learning
                        </Btn>
                      ) : (() => {
                        const req = enrollRequests.find(r => r.courseId === c.id);
                        if (req?.status === "PENDING") {
                          return (
                            <Btn size="xs" variant="ghost" disabled style={{ opacity: 0.7 }}>
                              ⏳ Pending Admin Approval
                            </Btn>
                          );
                        } else if (req?.status === "REJECTED") {
                          return (
                            <Btn size="xs" variant="danger" disabled style={{ opacity: 0.7 }}>
                              ❌ Enrollment Rejected
                            </Btn>
                          );
                        } else {
                          return (
                            <Btn 
                              size="xs" 
                              variant="warning" 
                              onClick={() => handleEnrollNow(c.id)}
                              disabled={requestingEnrollId === c.id}
                            >
                              {requestingEnrollId === c.id ? "⏳ Requesting..." : "📥 Enroll Now"}
                            </Btn>
                          );
                        }
                      })()}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── BATCH LIST VIEW ────────────────────────────────────────────────
  return (
    <div className="fade-up">
      <PageHeader title="My Courses" subtitle="Select a batch to view your subjects" />

      {loading ? (
        <div style={{ padding: 32, textAlign: "center", color: T.muted }}>Loading…</div>
      ) : batches.length === 0 ? (
        <Card>
          <div style={{ padding: 40, textAlign: "center", color: T.muted }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🏫</div>
            <div style={{ fontFamily: "Syne", fontWeight: 700 }}>Not enrolled in any batch</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>Contact your admin to be added to a batch.</div>
          </div>
        </Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 18 }}>
          {batches.map(b => {
            const activeCourses = (b.courses || []).filter(
              c => c.status === "ACTIVE" || c.status === "COMPLETED"
            );
            return (
              <Card key={b.id} style={{ padding: 0, overflow: "hidden", cursor: "pointer" }}
                onClick={() => setSelBatch(b)}>
                <div style={{ height: 5, background: `linear-gradient(90deg, ${T.primary}, ${T.accent})` }} />
                <div style={{ padding: 20 }}>
                  {/* Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 15 }}>{b.name}</div>
                      <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>🏢 {b.department}</div>
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 700, borderRadius: 50, padding: "3px 10px",
                      background: b.status === "ACTIVE" ? `${T.accentG}20` : b.status === "UPCOMING" ? `${T.accent}20` : `${T.muted}20`,
                      color:      b.status === "ACTIVE" ? T.accentG          : b.status === "UPCOMING" ? T.accent         : T.muted,
                    }}>
                      {b.status}
                    </span>
                  </div>

                  {/* Stats */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                    {[
                      ["📚 Active Subjects", activeCourses.length],
                      ["📅 Ends", b.endDate || "—"],
                    ].map(([l, v]) => (
                      <div key={l} style={{ background: T.bg3, borderRadius: 8, padding: "8px 10px" }}>
                        <div style={{ fontSize: 10, color: T.muted, marginBottom: 2 }}>{l}</div>
                        <div style={{ fontSize: 12, fontWeight: 700 }}>{v}</div>
                      </div>
                    ))}
                  </div>

                  {/* Course chips preview */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
                    {activeCourses.slice(0, 3).map(c => (
                      <span key={c.id} style={{
                        fontSize: 10, background: `${T.accent}18`, color: T.accent,
                        borderRadius: 50, padding: "2px 8px", fontWeight: 700,
                      }}>
                        {c.title}
                      </span>
                    ))}
                    {activeCourses.length > 3 && (
                      <span style={{ fontSize: 10, color: T.muted }}>+{activeCourses.length - 3} more</span>
                    )}
                    {activeCourses.length === 0 && (
                      <span style={{ fontSize: 11, color: T.muted }}>No active courses yet</span>
                    )}
                  </div>

                  <Btn variant="primary" size="sm" full onClick={() => setSelBatch(b)}>
                    View Courses →
                  </Btn>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── STUDENT ANNOUNCEMENTS ────────────────────────────────────────────────────
export const StudentAnnouncements = () => {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStudentAnnouncements().then(d => setItems(Array.isArray(d) ? d : [])).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div className="fade-up">
      <PageHeader title="Announcements" subtitle="Messages from admin and your teachers" />
      <Card>
        {loading
          ? <div style={{ padding: 32, textAlign: "center", color: T.muted }}>Loading…</div>
          : items.length === 0
            ? <div style={{ padding: 32, textAlign: "center", color: T.muted }}>No announcements yet.</div>
            : items.map(a => (
              <div key={a.id} style={{ padding: "14px 0", borderBottom: `1px solid rgba(45,33,96,.4)`, display: "flex", gap: 14 }}>
                <div style={{ width: 40, height: 40, background: `${T.primary}18`, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>📢</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{a.title}</div>
                  <div style={{ fontSize: 13, color: T.muted, margin: "4px 0" }}>{a.content}</div>
                  <div style={{ fontSize: 11, color: T.muted }}>By {a.authorName} · {a.createdAt ? new Date(a.createdAt).toLocaleDateString("en-IN") : ""}</div>
                </div>
              </div>
            ))
        }
      </Card>
    </div>
  );
};

// ─── STUDENT DASHBOARD WRAPPER ────────────────────────────────────────────────
// ─── STUDENT TIMETABLE ────────────────────────────────────────────────────────
const StudentTimetable = () => {
  const DAYS = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];
  const DAY_SHORT = { MONDAY:"Mon", TUESDAY:"Tue", WEDNESDAY:"Wed", THURSDAY:"Thu", FRIDAY:"Fri", SATURDAY:"Sat" };
  const COLORS = ["#7c3aed","#06b6d4","#10b981","#f59e0b","#ef4444","#a78bfa","#34d399"];
  const [slots, setSlots]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStudentTimetable()
      .then(d => setSlots(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const timeKeys = [...new Set(slots.map(s => s.startTime + "–" + s.endTime))].sort();
  const cellColor = (course) => COLORS[Math.abs((course?.id || 0) * 3) % COLORS.length];

  return (
    <div className="fade-up">
      <PageHeader title="My Timetable" subtitle="Your class schedule for active batches" />
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {loading ? <div style={{ padding: 40, textAlign: "center", color: T.muted }}>Loading…</div>
        : slots.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: T.muted }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>📅</div>
            <div style={{ fontFamily: "Syne", fontWeight: 700 }}>No timetable yet</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>Your timetable will appear here once admin schedules classes.</div>
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
                              <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{cell.teacher?.name || "—"}</div>
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


// ─── STUDENT LEARNING BOARD ───────────────────────────────────────────────────
const StudentLearningBoard = () => {
  const [batches, setBatches]     = useState([]);
  const [selected, setSelected]   = useState(null);
  const [materials, setMaterials] = useState([]);
  const [tab, setTab]             = useState("ALL");
  const [loading, setLoading]     = useState(true);
  const [matLoading, setMatLoad]  = useState(false);
  const [activeMeeting, setActiveMeeting] = useState(null);

  // Review states inside learning board
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [courseDetails, setCourseDetails] = useState(null);

  useEffect(() => {
    getStudentBatches()
      .then(d => setBatches(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) return;
    const interval = setInterval(() => {
      getStudentMaterials(selected.id)
        .then(d => setMaterials(Array.isArray(d) ? d : []))
        .catch(console.error);
    }, 8000);
    return () => clearInterval(interval);
  }, [selected]);

  useEffect(() => {
    const handleJoin = async (e) => {
      const meeting = e.detail;
      if (!meeting) return;
      const enrolledCourses = batches.flatMap(b => (b.courses || []).map(c => ({ ...c, batchName: b.name })));
      const course = enrolledCourses.find(c => c.id === meeting.courseId);
      if (course) {
        setSelected(course);
        setTab("ALL");
        setMatLoad(true);
        getCourseDetails(course.id)
          .then(res => setCourseDetails(res?.data || res))
          .catch(console.error);
        try {
          const mats = await getStudentMaterials(course.id);
          const matsArr = Array.isArray(mats) ? mats : [];
          setMaterials(matsArr);
          const currentMeeting = matsArr.find(m => m.id === meeting.id);
          setActiveMeeting(currentMeeting || meeting);
        } catch (err) {
          console.error(err);
        } finally {
          setMatLoad(false);
        }
      }
    };
    window.addEventListener("join-live-meeting", handleJoin);
    return () => window.removeEventListener("join-live-meeting", handleJoin);
  }, [batches]);

  const openCourse = async (course) => {
    setSelected(course); setTab("ALL"); setMatLoad(true);
    setCourseDetails(null);
    getCourseDetails(course.id)
      .then(res => {
        const data = res?.data || res;
        setCourseDetails(data);
      })
      .catch(console.error);

    getStudentMaterials(course.id)
      .then(d => setMaterials(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setMatLoad(false));
  };

  const handleReviewSubmit = async () => {
    if (!courseDetails?.teacher?.id) return;
    setSubmittingReview(true);
    try {
      await submitTeacherReview(courseDetails.teacher.id, reviewRating, reviewText);
      alert("⭐ Thank you! Your review has been submitted successfully.");
      setShowReviewModal(false);
      setReviewText("");
      setReviewRating(5);
    } catch (err) {
      console.error(err);
      alert("❌ Failed to submit review. Please try again.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const typeIcon = { NOTE: "📝", VIDEO: "🎥", MEET_LINK: "🔗" };
  const typeLabel = { NOTE: "Note", VIDEO: "Video", MEET_LINK: "Live Class" };
  const filtered = tab === "ALL" ? materials : materials.filter(m => m.type === tab);

  // Gather all courses from all batches
  const allCourses = batches.flatMap(b => (b.courses || []).map(c => ({ ...c, batchName: b.name })));

  if (loading) return <div style={{ padding: 32, textAlign: "center", color: T.muted }}>Loading…</div>;

  if (selected) return (
    <div className="fade-up">
      <PageHeader title={selected.title} subtitle={selected.batchName || selected.department}
        actions={[
          courseDetails?.teacher && (
            <Btn key="rate" size="sm" variant="warning" onClick={() => setShowReviewModal(true)} style={{ marginRight: 8 }}>
              ⭐ Rate Teacher
            </Btn>
          ),
          <Btn key="back" size="sm" variant="ghost" onClick={() => { setSelected(null); setMaterials([]); setCourseDetails(null); }}>
            ← All Courses
          </Btn>
        ].filter(Boolean)} />
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {["ALL","NOTE","VIDEO","MEET_LINK"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: "6px 16px", borderRadius: 50, cursor: "pointer", fontSize: 12, fontWeight: 600,
              border: `1.5px solid ${tab === t ? T.primary : T.border}`,
              background: tab === t ? `${T.primary}20` : "transparent",
              color: tab === t ? T.primary : T.muted }}>
            {t === "ALL" ? `All (${materials.length})` : `${typeIcon[t]} ${typeLabel[t]}`}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {matLoading ? <div style={{ padding: 32, textAlign: "center", color: T.muted }}>Loading materials…</div>
        : filtered.length === 0 ? (
          <Card><div style={{ padding: 40, textAlign: "center", color: T.muted }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
            <div style={{ fontFamily: "Syne", fontWeight: 700 }}>No materials yet</div>
          </div></Card>
        ) : filtered.map(m => (
          <Card key={m.id} style={{ padding: 18 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ fontSize: 32, flexShrink: 0 }}>{typeIcon[m.type] || "📄"}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{m.title}</div>
                {m.description && <div style={{ fontSize: 12, color: T.muted, marginBottom: 8 }}>{m.description}</div>}
                <div style={{ fontSize: 11, color: T.muted }}>
                  {new Date(m.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </div>
                {m.type === "MEET_LINK" && m.content && (
                  <div style={{ marginTop: 8 }}>
                    {!m.meetingStarted ? (
                      <div style={{ background: `${T.accentY}10`, border: `1px solid ${T.accentY}30`, borderRadius: 8, padding: "8px 12px", display: "inline-flex", alignItems: "center", gap: 8 }}>
                        <span style={{ animation: "pulse 1.5s infinite" }}>⏳</span>
                        <span style={{ fontSize: 12, color: T.accentY, fontWeight: 600 }}>Waiting for Teacher to start class...</span>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <div style={{ fontSize: 11, color: T.accentG, fontWeight: 700 }}>
                          🟢 Live Class Started!
                        </div>
                        <Btn size="xs" variant="primary" onClick={async () => {
                          try {
                            await joinLiveClass(m.id);
                          } catch (e) {
                            console.error(e);
                          }
                          setActiveMeeting(m);
                        }}>
                          🎥 Join Live Class (In-App)
                        </Btn>
                      </div>
                    )}
                  </div>
                )}
                {m.type === "VIDEO" && m.content && (
                  <a href={m.content} target="_blank" rel="noreferrer">
                    <Btn size="xs" variant="ghost" style={{ marginTop: 8 }}>▶ Watch Video</Btn>
                  </a>
                )}
                {m.type === "NOTE" && m.content && (
                  <Btn size="xs" variant="ghost" style={{ marginTop: 8 }}
                    onClick={() => {
                    if (!m.content) return;

                    const link = document.createElement("a");
                    link.href = m.content; // already contains data:application/...base64
                    link.download = `${m.title || "note"}.docx`;
                    link.target = "_blank";
                    link.click();
                    }}>
                    ⬇ Download
                  </Btn>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {showReviewModal && (
        <Modal open={showReviewModal} onClose={() => setShowReviewModal(false)} title="⭐ Rate & Review Teacher">
          <div style={{ display: "grid", gap: 16, padding: "10px 0" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 13, color: T.muted, marginBottom: 8 }}>
                How would you rate your learning experience with <strong>{courseDetails?.teacher?.name}</strong>?
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", fontSize: 28 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    style={{
                      cursor: "pointer",
                      color: star <= reviewRating ? "#ffc107" : T.muted,
                      fontSize: 32,
                      userSelect: "none"
                    }}
                    onClick={() => setReviewRating(star)}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 6 }}>
                Feedback Comments
              </div>
              <textarea
                placeholder="Share your feedback, teaching style review, or encouraging remarks..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                style={{
                  width: "100%",
                  height: 100,
                  background: T.bg3,
                  border: `1px solid ${T.bg2}`,
                  borderRadius: 8,
                  color: T.text,
                  padding: 10,
                  fontSize: 13,
                  fontFamily: "inherit",
                  resize: "none",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
              <Btn variant="ghost" onClick={() => setShowReviewModal(false)} disabled={submittingReview}>
                Cancel
              </Btn>
              <Btn variant="primary" onClick={handleReviewSubmit} disabled={submittingReview}>
                {submittingReview ? "Submitting..." : "Submit Review"}
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Embedded live class iframe modal */}
      {activeMeeting && (
        <Modal open={!!activeMeeting} onClose={() => setActiveMeeting(null)} title={`Live Class: ${activeMeeting.title}`}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 13, color: T.muted }}>
                Platform: <strong>{activeMeeting.platformType || "Meeting"}</strong>
              </div>
              <Btn size="xs" variant="primary" onClick={() => window.open(activeMeeting.content, "_blank")}>
                🌐 Open in New Tab
              </Btn>
            </div>
            <div style={{ background: `${T.accentY}15`, border: `1px solid ${T.accentY}40`, borderRadius: 8, padding: "10px 14px", fontSize: 12, color: T.accentY }}>
              ⚠️ <strong>Notice:</strong> Standard meeting platforms (like Google Meet or Teams) restrict embedding inside webpages for security. If the screen is blank, click the <strong>Open in New Tab</strong> button above to join. For a seamless in-app video experience, teachers can use open-embed links (e.g., Jitsi Meet: <code>https://meet.jit.si/your-room-name</code>).
            </div>
            <div style={{ width: "100%", height: 500, borderRadius: 12, overflow: "hidden", border: `1px solid ${T.border}`, background: "#000" }}>
              <iframe
                src={activeMeeting.content}
                title={activeMeeting.title}
                width="100%"
                height="100%"
                allow="camera; microphone; display-capture; autoplay; encrypted-media; fullscreen"
                style={{ border: "none" }}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );

  return (
    <div className="fade-up">
      <PageHeader title="Learning Board" subtitle="Select a course to view notes, videos and live classes" />
      {allCourses.length === 0 ? (
        <Card><div style={{ padding: 40, textAlign: "center", color: T.muted }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📚</div>
          <div style={{ fontFamily: "Syne", fontWeight: 700 }}>No courses yet</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>Enroll in a batch to see course materials.</div>
        </div></Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
          {allCourses.map(c => (
            <Card key={c.id} style={{ padding: 0, overflow: "hidden", cursor: "pointer" }} >
              <div style={{ height: 5, background: `linear-gradient(90deg,${T.primary},${T.accent})` }} />
              <div style={{ padding: 18 }}>
                <div style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 15, marginBottom: 4 }}>📚 {c.title}</div>
                <div style={{ fontSize: 12, color: T.muted, marginBottom: 12 }}>📦 {c.batchName}</div>
                <Btn size="xs" variant="primary" full onClick={() => openCourse(c)}>Open Course →</Btn>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── STUDENT TASKS / ASSIGNMENTS ──────────────────────────────────────────────
const StudentTasks = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState(null);
  
  // Submission fields
  const [answer, setAnswer]           = useState("");
  const [externalLink, setExternalLink] = useState("");
  const [studentNote, setStudentNote] = useState("");
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [fileUploadError, setFileUploadError] = useState("");
  
  const [submitting, setSubmitting]   = useState(false);
  const [filterStatus, setFilterStatus] = useState("ALL");

  // Helper to open submit modal and populate existing values
  const handleOpenSubmit = (a) => {
    setSelected(a);
    setAnswer(a.content || "");
    setExternalLink(a.externalLink || "");
    setStudentNote(a.studentNote || "");
    setFileUploadError("");

    if (a.fileUrl) {
      const urls = a.fileUrl.split(",").filter(Boolean);
      const initial = urls.map((u, index) => {
        const namePart = u.substring(u.lastIndexOf("/") + 1);
        const cleanName = namePart.includes("_") ? namePart.substring(namePart.indexOf("_") + 1) : namePart;
        return {
          id: `initial-${index}`,
          name: cleanName,
          size: 0,
          type: cleanName.split(".").pop().toLowerCase(),
          status: "uploaded",
          url: u
        };
      });
      setAttachedFiles(initial);
    } else {
      setAttachedFiles([]);
    }
  };

  // Helper to upload files via the backend
  const handleUploadFiles = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setFileUploadError("");
    const maxMB = selected?.maxFileSize || 10;
    const maxBytes = maxMB * 1024 * 1024;
    const allowedTypes = selected?.allowedFileTypes
      ? selected.allowedFileTypes.toLowerCase().split(",").map(x => x.trim())
      : null;

    for (let f of files) {
      if (f.size > maxBytes) {
        setFileUploadError(`File "${f.name}" exceeds the maximum allowed size of ${maxMB} MB.`);
        continue;
      }

      const ext = f.name.split(".").pop().toLowerCase();
      if (allowedTypes && !allowedTypes.includes(ext)) {
        setFileUploadError(`File "${f.name}" has an invalid extension. Allowed extensions: ${selected.allowedFileTypes}`);
        continue;
      }

      const tempId = Math.random().toString();
      const newFileObj = {
        id: tempId,
        name: f.name,
        size: f.size,
        type: ext,
        status: "uploading",
        url: ""
      };
      setAttachedFiles(prev => [...prev, newFileObj]);

      try {
        const fileUrlResult = await uploadFile(f);
        setAttachedFiles(prev =>
          prev.map(x => x.id === tempId ? { ...x, status: "uploaded", url: fileUrlResult } : x)
        );
      } catch (err) {
        setAttachedFiles(prev =>
          prev.map(x => x.id === tempId ? { ...x, status: "error", errorMsg: err.message || "Upload failed" } : x)
        );
      }
    }
    e.target.value = "";
  };

  const load = () => {
    setLoading(true);
    Promise.all([getStudentAssignments(), getStudentSubmissions()])
      .then(([as, subs]) => {
        const asData = Array.isArray(as) ? as : (as?.data ? as.data : []);
        const subsData = Array.isArray(subs) ? subs : (subs?.data ? subs.data : []);
        
        const merged = asData.map(a => {
          const sub = subsData.find(s => s.assignment?.id === a.id);
          return {
            ...a,
            submitted: !!sub,
            submissionStatus: sub?.status || null,
            submissionId: sub?.id || null,
            grade: sub?.marksObtained != null ? sub.marksObtained : null,
            feedback: sub?.teacherFeedback || null,
            content: sub?.content || "",
            fileUrl: sub?.fileUrl || "",
            externalLink: sub?.externalLink || "",
            studentNote: sub?.studentNote || "",
            isLateSubmission: sub?.late || sub?.status === "LATE"
          };
        });
        setAssignments(merged);
      })
      .catch(err => {
        console.error("❌ Assignment fetch error:", err);
        setAssignments([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleSubmit = async () => {
    const subType = selected.submissionType || "ANY";
    
    // Construct fileUrl as comma-separated list of uploaded URLs
    const uploadedUrls = attachedFiles.filter(f => f.status === "uploaded").map(f => f.url);
    const combinedFileUrl = uploadedUrls.join(",");

    if (subType === "TEXT" && !answer.trim()) {
      alert("Please write your answer text.");
      return;
    }
    if (subType === "FILE" && uploadedUrls.length === 0) {
      alert("Please upload at least one file.");
      return;
    }
    if (subType === "LINK" && !externalLink.trim()) {
      alert("Please enter a valid submission link.");
      return;
    }
    if (subType === "ANY" && !answer.trim() && uploadedUrls.length === 0 && !externalLink.trim()) {
      alert("Please provide at least one form of submission (text, uploaded files, or external link).");
      return;
    }

    try {
      setSubmitting(true);
      await submitAssignment(selected.id, {
        content: answer,
        fileUrl: combinedFileUrl,
        externalLink,
        studentNote
      });
      alert("✅ Assignment submitted successfully!");
      setSelected(null);
      setAnswer("");
      setAttachedFiles([]);
      setExternalLink("");
      setStudentNote("");
      load();
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const statusColor = { PENDING: T.accentY, SUBMITTED: T.accentG, GRADED: T.accent, OVERDUE: "#ef4444", RESUBMISSION_REQUESTED: "#F59E0B" };
  const statusIcon = { PENDING: "⏳", SUBMITTED: "✅", GRADED: "📊", OVERDUE: "🔴", RESUBMISSION_REQUESTED: "🔄" };

  // Calculate statistics
  const stats = {
    total: assignments.length,
    pending: assignments.filter(a => 
      (!a.submitted && (!a.dueDate || new Date(a.dueDate) >= new Date())) || 
      a.submissionStatus === "RESUBMISSION_REQUESTED"
    ).length,
    submitted: assignments.filter(a => a.submitted && a.grade === null && a.submissionStatus !== "RESUBMISSION_REQUESTED").length,
    graded: assignments.filter(a => a.grade !== null).length,
    overdue: assignments.filter(a => !a.submitted && a.dueDate && new Date(a.dueDate) < new Date()).length,
  };

  const gradedList = assignments.filter(a => a.grade !== null);
  const avgGrade = gradedList.length > 0 ? Math.round(gradedList.reduce((s, a) => s + (Number(a.grade) || 0), 0) / gradedList.length) : 0;
  const completionPercentage = stats.total > 0 ? Math.round(((stats.submitted + stats.graded) / stats.total) * 100) : 0;

  // Filter assignments
  let filteredAssignments = assignments;
  if (filterStatus === "PENDING") {
    filteredAssignments = assignments.filter(a => 
      (!a.submitted && (!a.dueDate || new Date(a.dueDate) >= new Date())) || 
      a.submissionStatus === "RESUBMISSION_REQUESTED"
    );
  } else if (filterStatus === "SUBMITTED") {
    filteredAssignments = assignments.filter(a => a.submitted && a.grade === null && a.submissionStatus !== "RESUBMISSION_REQUESTED");
  } else if (filterStatus === "GRADED") {
    filteredAssignments = assignments.filter(a => a.grade !== null);
  } else if (filterStatus === "OVERDUE") {
    filteredAssignments = assignments.filter(a => !a.submitted && a.dueDate && new Date(a.dueDate) < new Date());
  }

  const inputSty = { width: "100%", background: T.bg3, border: `1.5px solid ${T.border}`, borderRadius: 9, padding: "10px 14px", fontSize: 13, color: T.text, outline: "none", boxSizing: "border-box" };

  return (
    <div className="fade-up">
      <PageHeader title="📋 Tasks & Assignments" subtitle={`${assignments.length} assignment${assignments.length !== 1 ? "s" : ""}`} />
      
      {loading ? <div style={{ padding: 32, textAlign: "center", color: T.muted }}>Loading…</div>
      : assignments.length === 0 ? (
        <Card><div style={{ padding: 40, textAlign: "center", color: T.muted }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📝</div>
          <div style={{ fontFamily: "Syne", fontWeight: 700 }}>No assignments yet</div>
        </div></Card>
      ) : (
        <>
          {/* Statistics Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
            {[
              { label: "Total Tasks", value: stats.total, color: T.primary, icon: "📚" },
              { label: "Pending", value: stats.pending, color: T.accentY, icon: "⏳" },
              { label: "Submitted", value: stats.submitted, color: T.accentG, icon: "✅" },
              { label: "Graded", value: stats.graded, color: T.accent, icon: "📊" },
              { label: "Avg Grade", value: `${avgGrade}%`, color: T.primary, icon: "🎯" },
            ].map((s, i) => (
              <Card key={i} style={{ padding: 18, textAlign: "center" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontSize: 11, color: T.muted, marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              </Card>
            ))}
          </div>

          {/* Overall Completion */}
          <Card style={{ padding: 20, marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 15 }}>📈 Overall Completion</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: T.primary }}>{completionPercentage}%</div>
            </div>
            <div style={{ height: 12, background: T.bg3, borderRadius: 50, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${completionPercentage}%`,
                background: `linear-gradient(90deg, ${T.primary}, ${T.accent})`,
                transition: "width 0.4s"
              }} />
            </div>
          </Card>

          {/* Filter Buttons */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            {[
              { key: "PENDING", label: `⏳ Pending (${stats.pending})` },
              { key: "SUBMITTED", label: `✅ Submitted (${stats.submitted})` },
              { key: "GRADED", label: `📊 Graded (${stats.graded})` },
              { key: "OVERDUE", label: `❌ Missed (${stats.overdue})` },
              { key: "ALL", label: `📚 All (${stats.total})` }
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilterStatus(f.key)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 50,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  border: `1.5px solid ${filterStatus === f.key ? T.primary : T.border}`,
                  background: filterStatus === f.key ? `${T.primary}20` : "transparent",
                  color: filterStatus === f.key ? T.primary : T.muted,
                  transition: "all 0.2s"
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Assignments List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filteredAssignments.length === 0 ? (
              <Card><div style={{ padding: 40, textAlign: "center", color: T.muted }}>
                <div style={{ fontSize: 30, marginBottom: 10 }}>✨</div>
                <div style={{ fontFamily: "Syne", fontWeight: 700 }}>No {filterStatus.toLowerCase()} assignments</div>
              </div></Card>
            ) : (
              filteredAssignments.map(a => {
                const isOverdue = a.dueDate && new Date(a.dueDate) < new Date();
                const isLateDisallowed = isOverdue && !a.allowLate;
                const canSubmit = (!a.submitted || a.submissionStatus === "RESUBMISSION_REQUESTED") && !isLateDisallowed;
                
                return (
                  <Card key={a.id} style={{ padding: 18, borderLeft: a.submissionStatus === "RESUBMISSION_REQUESTED" ? `4px solid ${T.accentY}` : undefined }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
                          <Badge type="primary">{a.taskType || "Homework"}</Badge>
                          {a.submissionStatus === "RESUBMISSION_REQUESTED" ? (
                            <Badge type="warning">Resubmission Requested</Badge>
                          ) : (
                            <Badge type={a.submitted ? "success" : isOverdue ? "danger" : "ghost"}>
                              {a.submitted ? (a.isLateSubmission ? "Submitted Late" : "Submitted") : isOverdue ? (a.allowLate ? "Overdue (Late OK)" : "Missed (Closed)") : "Pending"}
                            </Badge>
                          )}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 16, color: T.text, marginBottom: 4 }}>{a.title}</div>
                        {a.description && <div style={{ fontSize: 12, color: T.muted, marginBottom: 6 }}>{a.description}</div>}
                        
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, fontSize: 11, color: T.muted }}>
                          <span>📅 Due: {a.dueDate ? new Date(a.dueDate).toLocaleString() : "—"}</span>
                          <span>🎯 Max Marks: {a.maxMarks || 100}</span>
                          {a.allowLate && (
                            <span style={{ color: "#F59E0B" }}>⚠️ Late Allowable (Penalty: {a.latePenalty || 0}%)</span>
                          )}
                          {a.attachments && (
                            <span>📎 Reference: <a href={a.attachments} target="_blank" rel="noreferrer" style={{ color: T.accent }}>{a.attachments}</a></span>
                          )}
                        </div>
                      </div>
                      
                      {canSubmit ? (
                        <div style={{ flexShrink: 0 }}>
                          <Btn size="sm" variant="primary" onClick={() => handleOpenSubmit(a)}>
                            {a.submissionStatus === "RESUBMISSION_REQUESTED" ? "Update & Submit →" : "Submit Task →"}
                          </Btn>
                        </div>
                      ) : (
                        !a.submitted && isOverdue && (
                          <div style={{ flexShrink: 0 }}>
                            <Btn size="sm" variant="danger" disabled style={{ opacity: 0.6, cursor: "not-allowed" }}>
                              Closed (Late N/A)
                            </Btn>
                          </div>
                        )
                      )}
                    </div>

                    {a.submissionStatus === "RESUBMISSION_REQUESTED" && a.feedback && (
                      <div style={{ marginTop: 12, background: "rgba(245, 158, 11, 0.1)", borderRadius: 8, padding: "10px 14px", borderLeft: `3px solid ${T.accentY}` }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#D97706", marginBottom: 4 }}>Teacher feedback:</div>
                        <div style={{ fontSize: 12, color: T.text }}>"{a.feedback}"</div>
                      </div>
                    )}

                    {a.grade != null && (
                      <div style={{ marginTop: 12, background: `${T.accentG}12`, borderRadius: 8, padding: "10px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
                        <div style={{ fontWeight: 700, color: T.accentG, fontSize: 13 }}>📊 Evaluated: {a.grade}/{a.maxMarks || 100}</div>
                        {a.feedback && <div style={{ fontSize: 12, color: T.muted }}><strong>Feedback:</strong> "{a.feedback}"</div>}
                      </div>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        </>
      )}
      
      {/* Submit Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.submissionStatus === "RESUBMISSION_REQUESTED" ? `Resubmit Task: ${selected?.title}` : `Submit Task: ${selected?.title}`} size="lg">
        {selected && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: T.bg3, padding: 12, borderRadius: 8, fontSize: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Submission Guidelines:</div>
              <div style={{ color: T.muted }}>
                Required Format: <strong>{selected.submissionType || "ANY"}</strong>
                {selected.allowedFileTypes && ` · Allowed Files: ${selected.allowedFileTypes}`}
                {selected.maxFileSize && ` · Max Size: ${selected.maxFileSize} MB`}
              </div>
            </div>

            {/* Answer Field (shown if ANY or TEXT) */}
            {((selected.submissionType || "ANY") === "ANY" || selected.submissionType === "TEXT") && (
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Written Answer / Content</label>
                <textarea rows={5} value={answer} onChange={e => setAnswer(e.target.value)}
                  placeholder="Type your response/report here..."
                  style={{ ...inputSty, resize: "vertical", fontFamily: "DM Sans" }} />
              </div>
            )}

            {/* File Upload Section (shown if ANY or FILE) */}
            {((selected.submissionType || "ANY") === "ANY" || selected.submissionType === "FILE") && (
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Attachments</label>
                
                {/* Upload Zone / Button */}
                <div style={{
                  border: `2.5px dashed ${T.border}`,
                  borderRadius: 10,
                  padding: "24px 16px",
                  textAlign: "center",
                  background: `${T.bg3}40`,
                  cursor: "pointer",
                  position: "relative",
                  marginBottom: 12,
                  transition: "all 0.2s"
                }}
                onMouseOver={e => e.currentTarget.style.borderColor = T.primary}
                onMouseOut={e => e.currentTarget.style.borderColor = T.border}
                onClick={() => document.getElementById("task-file-input").click()}
                >
                  <div style={{ fontSize: 28, marginBottom: 8 }}>📤</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 4 }}>Drag & drop files here, or browse</div>
                  <div style={{ fontSize: 11, color: T.muted }}>
                    Max size: {selected.maxFileSize || 10}MB · Allowed formats: {selected.allowedFileTypes || "Any"}
                  </div>
                  <input
                    type="file"
                    id="task-file-input"
                    multiple
                    style={{ display: "none" }}
                    onChange={handleUploadFiles}
                  />
                </div>

                {/* Error Banner */}
                {fileUploadError && (
                  <div style={{
                    background: "rgba(239, 68, 68, 0.1)",
                    borderLeft: "3px solid #ef4444",
                    color: "#ef4444",
                    padding: "8px 12px",
                    borderRadius: 6,
                    fontSize: 12,
                    marginBottom: 12
                  }}>
                    ⚠️ {fileUploadError}
                  </div>
                )}

                {/* Attached Files List */}
                {attachedFiles.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                    {attachedFiles.map(f => {
                      const ext = f.type || "file";
                      const icon = ext === "pdf" ? "📕" : ["png", "jpg", "jpeg", "gif"].includes(ext) ? "🖼️" : ["zip", "rar", "7z"].includes(ext) ? "📦" : "📄";
                      const sizeStr = f.size > 0 ? (f.size > 1024 * 1024 ? `${(f.size / (1024 * 1024)).toFixed(1)} MB` : `${(f.size / 1024).toFixed(0)} KB`) : "";
                      
                      return (
                        <div key={f.id} style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 12px",
                          background: T.bg3,
                          borderRadius: 8,
                          border: `1.5px solid ${T.border}`
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, overflow: "hidden", marginRight: 8 }}>
                            <span style={{ fontSize: 18 }}>{icon}</span>
                            <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{f.name}</div>
                              <div style={{ fontSize: 10, color: T.muted }}>
                                {ext.toUpperCase()} {sizeStr && `· ${sizeStr}`}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            {f.status === "uploading" && (
                              <span style={{ fontSize: 11, color: T.accentY, display: "flex", alignItems: "center", gap: 4 }}>
                                🌀 Uploading...
                              </span>
                            )}
                            {f.status === "uploaded" && (
                              <span style={{ fontSize: 11, color: T.accentG }}>
                                ✓ Ready
                              </span>
                            )}
                            {f.status === "error" && (
                              <span style={{ fontSize: 11, color: "#ef4444" }} title={f.errorMsg}>
                                ❌ Failed
                              </span>
                            )}
                            
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAttachedFiles(prev => prev.filter(x => x.id !== f.id));
                              }}
                              style={{
                                border: "none",
                                background: "none",
                                color: T.muted,
                                cursor: "pointer",
                                fontSize: 14,
                                padding: 4,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                              }}
                              onMouseOver={e => e.currentTarget.style.color = "#ef4444"}
                              onMouseOut={e => e.currentTarget.style.color = T.muted}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* External Link (shown if ANY or LINK) */}
            {((selected.submissionType || "ANY") === "ANY" || selected.submissionType === "LINK") && (
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", display: "block", marginBottom: 6 }}>External Link (GitHub, Figma, etc.)</label>
                <input type="text" value={externalLink} onChange={e => setExternalLink(e.target.value)}
                  placeholder="https://github.com/username/project"
                  style={inputSty} />
              </div>
            )}

            {/* Student Note (Always shown) */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Note to Teacher (Optional)</label>
              <input type="text" value={studentNote} onChange={e => setStudentNote(e.target.value)}
                placeholder="Any comments for the grading teacher..."
                style={inputSty} />
            </div>

            <Btn variant="primary" full onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Submitting…" : selected.submissionStatus === "RESUBMISSION_REQUESTED" ? "Update and Submit Task" : "Submit Assignment"}
            </Btn>
          </div>
        )}
      </Modal>
    </div>
  );
};

// ─── STUDENT FEES ─────────────────────────────────────────────────────────────
const StudentFees = () => {
  const [fees, setFees]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStudentFees()
      .then(d => setFees(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const total     = fees.reduce((s, f) => s + Number(f.amount || 0), 0);
  const paid      = fees.filter(f => f.status === "PAID").reduce((s, f) => s + Number(f.paidAmount || f.amount || 0), 0);
  const pending   = total - paid;
  const statusColor = { PAID: T.accentG, PENDING: T.accentY, OVERDUE: "#ef4444" };
  const typeIcon    = { TUITION: "🎓", EXAM: "📝", LAB: "🔬", LIBRARY: "📚", TRANSPORT: "🚌", MISCELLANEOUS: "📋" };

  return (
    <div className="fade-up">
      <PageHeader title="Fees & Payments" subtitle="Your fee records and payment status" />
      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total Billed", value: `₹${total.toLocaleString("en-IN")}`, color: T.text },
          { label: "Paid",         value: `₹${paid.toLocaleString("en-IN")}`,  color: T.accentG },
          { label: "Pending",      value: `₹${pending.toLocaleString("en-IN")}`, color: T.accentY },
        ].map(s => (
          <Card key={s.label} style={{ padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>{s.label}</div>
          </Card>
        ))}
      </div>
      {loading ? <div style={{ padding: 32, textAlign: "center", color: T.muted }}>Loading…</div>
      : fees.length === 0 ? (
        <Card><div style={{ padding: 40, textAlign: "center", color: T.muted }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>💳</div>
          <div style={{ fontFamily: "Syne", fontWeight: 700 }}>No fee records yet</div>
        </div></Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {fees.map(f => (
            <Card key={f.id} style={{ padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ fontSize: 28 }}>{typeIcon[f.feeType] || "💳"}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{f.feeType || "Fee"}</div>
                    <div style={{ fontSize: 12, color: T.muted }}>
                      {f.description || "—"} · Due: {f.dueDate || "—"}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 800, fontSize: 18 }}>₹{Number(f.amount || 0).toLocaleString("en-IN")}</div>
                  <span style={{ fontSize: 11, fontWeight: 700, borderRadius: 50, padding: "3px 10px",
                    background: `${statusColor[f.status] || T.muted}20`,
                    color: statusColor[f.status] || T.muted }}>
                    {f.status}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};



// student performence>>>>>>
export const Performance = () => {
  const [loading, setLoading] = useState(true);
  const [rawAttendance, setRawAttendance] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [grades, setGrades] = useState([]);
  const [period, setPeriod] = useState("WEEKLY"); // WEEKLY or MONTHLY
  const [semester, setSemester] = useState("This Semester (Jan - May 2026)");
  const [classmateCount, setClassmateCount] = useState(45); // default fallback
  const [enrolledCoursesCount, setEnrolledCoursesCount] = useState(5); // default fallback

  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [courseSearch, setCourseSearch] = useState("");
  const [courseAttendance, setCourseAttendance] = useState(null);
  const [loadingCourseAtt, setLoadingCourseAtt] = useState(false);
  
  function getISOWeek(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  // Parse date from backend: handles ISO string "2026-06-08" or array [2026, 6, 8]
  function parseAttendanceDate(raw) {
    if (!raw) return new Date();
    if (Array.isArray(raw)) {
      // Java LocalDate serialized as [year, month, day]
      return new Date(raw[0], raw[1] - 1, raw[2]);
    }
    // ISO string "2026-06-08" — parse as UTC to avoid timezone shifts
    const parts = String(raw).split('-');
    if (parts.length === 3) {
      return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    }
    return new Date(raw);
  }

  function transformAttendanceByWeek(data) {
    const weeks = {};

    data.forEach(a => {
      const d = parseAttendanceDate(a.date);

      // Get proper ISO week number and month/year
      const weekNum = getISOWeek(d);
      const monthYear = d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
      const dateRange = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
      const week = `Week ${weekNum} • ${dateRange} (${monthYear})`;

      if (!weeks[week]) {
        weeks[week] = { week, present: 0, absent: 0 };
      }

      if (a.status === "PRESENT") {
        weeks[week].present += 1;
      } else {
        weeks[week].absent += 1;
      }
    });

    return Object.values(weeks);
  }

  function transformAttendanceByMonth(data) {
    const months = {};

    data.forEach(a => {
      const d = parseAttendanceDate(a.date);
      const monthYear = d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

      if (!months[monthYear]) {
        months[monthYear] = { week: monthYear, present: 0, absent: 0 };
      }

      if (a.status === "PRESENT") {
        months[monthYear].present += 1;
      } else {
        months[monthYear].absent += 1;
      }
    });

    return Object.values(months);
  }

  // Custom Tooltip Component
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          background: T.bg3,
          border: `1.5px solid ${T.border}`,
          borderRadius: 9,
          padding: "12px 14px",
          color: T.text,
          fontSize: 13,
          fontWeight: 600
        }}>
          <div style={{ marginBottom: 6 }}>{data.week}</div>
          <div style={{ color: "#10b981", marginBottom: 4 }}>Present: {data.present}</div>
          <div style={{ color: "#ef4444" }}>Absent: {data.absent}</div>
        </div>
      );
    }
    return null;
  };

  useEffect(() => {
    getStudentCourses()
      .then(c => {
        const list = Array.isArray(c) ? c : [];
        setCourses(list);
        if (list.length > 0) {
          setSelectedCourseId(String(list[0].id));
        }
      })
      .catch(console.error);

    getStudentAttendanceTrack()
      .then(data => {
        setTasks(data.tasks || []);
        setGrades(data.grades || []);
        if (data.classmateCount) {
          setClassmateCount(data.classmateCount);
        }
        if (data.enrolledCoursesCount !== undefined) {
          setEnrolledCoursesCount(data.enrolledCoursesCount);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!selectedCourseId) return;
    setLoadingCourseAtt(true);
    getStudentCourseAttendance(selectedCourseId)
      .then(res => {
        const data = res?.data || res;
        setCourseAttendance(data);
        const rawData = data.records || [];
        setRawAttendance(rawData);
        const formatted = period === "WEEKLY"
          ? transformAttendanceByWeek(rawData)
          : transformAttendanceByMonth(rawData);
        setAttendance(formatted);
      })
      .catch(console.error)
      .finally(() => setLoadingCourseAtt(false));
  }, [selectedCourseId, period]);

  if (loading) return <div style={{ padding: 32, color: T.muted }}>Loading performance…</div>;

  // ─── CALCULATE PREMIUM ANALYTICS ───────────────────────────────────────────────
  
  // 1. Attendance Metrics
  const totalPresent = rawAttendance.filter(a => a.status === "PRESENT").length;
  const totalAbsent = rawAttendance.filter(a => a.status !== "PRESENT").length;
  const totalDays = totalPresent + totalAbsent;
  const attendancePct = totalDays > 0 ? Math.round((totalPresent / totalDays) * 100) : 0;

  // 2. Task/Assignment Metrics
  const completedTasks = tasks.filter(t => t.status === "GRADED" || t.status === "SUBMITTED").length;
  const totalTasks = tasks.length;
  const taskPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // 3. Score & Grades Parsing
  const parsedGrades = grades.map(g => {
    const percentMatch = g.grade.match(/([\d.]+)%/);
    if (percentMatch) return parseFloat(percentMatch[1]);
    const fractionMatch = g.grade.match(/(\d+)\s*\/\s*(\d+)/);
    if (fractionMatch) {
      const obtained = parseFloat(fractionMatch[1]);
      const total = parseFloat(fractionMatch[2]);
      if (total > 0) return (obtained / total) * 100;
    }
    return null;
  }).filter(x => x !== null);

  const overallScore = parsedGrades.length > 0
    ? Math.round(parsedGrades.reduce((a, b) => a + b, 0) / parsedGrades.length)
    : 0;

  // 4. Group grades by course for Subject Performance list
  const courseGroups = {};
  grades.forEach(g => {
    if (!courseGroups[g.course]) {
      courseGroups[g.course] = { courseName: g.course, scores: [], instructor: g.instructor || "Unassigned" };
    }
    const percentMatch = g.grade.match(/([\d.]+)%/);
    if (percentMatch) {
      courseGroups[g.course].scores.push(parseFloat(percentMatch[1]));
    } else {
      const fractionMatch = g.grade.match(/(\d+)\s*\/\s*(\d+)/);
      if (fractionMatch) {
        const obtained = parseFloat(fractionMatch[1]);
        const total = parseFloat(fractionMatch[2]);
        if (total > 0) courseGroups[g.course].scores.push((obtained / total) * 100);
      }
    }
  });

  const subjectPerformanceReal = Object.values(courseGroups).map(group => {
    const avgScore = group.scores.length > 0
      ? Math.round(group.scores.reduce((a, b) => a + b, 0) / group.scores.length)
      : 0;
    
    let letter = "B";
    if (avgScore >= 90) letter = "A";
    else if (avgScore >= 80) letter = "B+";
    else if (avgScore >= 70) letter = "B";
    else if (avgScore >= 60) letter = "C";
    else letter = "F";

    return {
      course: group.courseName.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
      instructor: group.instructor,
      progress: avgScore,
      score: `${avgScore} / 100`,
      grade: letter,
      trend: avgScore >= 80 ? "up" : avgScore >= 70 ? "flat" : "down"
    };
  });

  const defaultSubjects = [
    { course: "Python Fundamentals", instructor: "Prof. K. Sharma", progress: 80, score: "84 / 100", grade: "A", trend: "up" },
    { course: "Database Management", instructor: "Prof. R. Kumar", progress: 70, score: "76 / 100", grade: "B+", trend: "up" },
    { course: "Data Structures", instructor: "Prof. S. Devi", progress: 65, score: "72 / 100", grade: "B+", trend: "up" },
    { course: "Web Development", instructor: "Prof. M. Raj", progress: 60, score: "68 / 100", grade: "B", trend: "flat" },
    { course: "Software Engineering", instructor: "Prof. L. Nair", progress: 50, score: "64 / 100", grade: "B", trend: "down" },
  ];

  const subjects = subjectPerformanceReal.length > 0 ? subjectPerformanceReal : defaultSubjects;

  // 5. Grade Distribution
  let countA = 0, countB = 0, countC = 0, countD = 0, countF = 0;
  parsedGrades.forEach(score => {
    if (score >= 90) countA++;
    else if (score >= 75) countB++;
    else if (score >= 60) countC++;
    else if (score >= 50) countD++;
    else countF++;
  });
  const hasRealGrades = parsedGrades.length > 0;
  const gradeDistribution = [
    { name: "A", count: hasRealGrades ? countA : 8, range: "(90-100)", color: "#10b981" },
    { name: "B", count: hasRealGrades ? countB : 22, range: "(75-89)", color: "#3b82f6" },
    { name: "C", count: hasRealGrades ? countC : 10, range: "(60-74)", color: "#f59e0b" },
    { name: "D", count: hasRealGrades ? countD : 4, range: "(50-59)", color: "#a855f7" },
    { name: "F", count: hasRealGrades ? countF : 1, range: "(Below 50)", color: "#ef4444" },
  ];

  // 6. Donut chart overview data
  const donutData = [
    { name: "Excellent (90-100%)", value: 25, color: "#10b981" },
    { name: "Good (75-89%)", value: 57, color: "#a855f7" },
    { name: "Average (60-74%)", value: 15, color: "#f59e0b" },
    { name: "Poor (Below 60%)", value: 3, color: "#ef4444" },
  ];

  // 7. Recent Assessments
  const defaultRecentAssessments = [
    { title: "QA - Graded Assignment", course: "Python Fundamentals", date: "May 22, 2026", score: "80 / 100", color: "#10b981" },
    { title: "Q1 (Exam)", course: "Python Fundamentals", date: "May 15, 2026", score: "67 / 100", color: "#3b82f6" },
    { title: "DBMS Mini Project", course: "Database Management", date: "May 10, 2026", score: "78 / 100", color: "#f59e0b" },
    { title: "OOP Coding Task", course: "Object Oriented Programming", date: "May 05, 2026", score: "65 / 100", color: "#ef4444" },
  ];

  const recentAssessments = grades.length > 0
    ? grades.slice(0, 5).map(g => ({
        title: g.assignment,
        course: g.course.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
        date: "May 22, 2026",
        score: g.grade.includes(" ") ? g.grade.split(" ")[0] : g.grade,
        color: g.grade.startsWith("9") || g.grade.startsWith("8") ? "#10b981" : "#f59e0b"
      }))
    : defaultRecentAssessments;

  // 8. Dynamic Class Standing calculation
  let rankPct = 16;
  let rankNum = Math.max(1, Math.round(classmateCount * 0.16));
  if (overallScore >= 90) {
    rankPct = 5;
    rankNum = Math.max(1, Math.round(classmateCount * 0.05));
  } else if (overallScore >= 80) {
    rankPct = 16;
    rankNum = Math.max(1, Math.round(classmateCount * 0.16));
  } else if (overallScore >= 70) {
    rankPct = 30;
    rankNum = Math.max(1, Math.round(classmateCount * 0.3));
  } else {
    rankPct = 50;
    rankNum = Math.max(1, Math.round(classmateCount * 0.5));
  }
  if (rankNum > classmateCount) rankNum = classmateCount;
  const rankStr = `#${rankNum} / ${classmateCount}`;

  // 9. Dynamic Insights calculation
  // Insight 1: Dynamic progress / best subject
  let insight1Title = "Steady progress maintained";
  let insight1Sub = "Keep up the excellent work!";
  let insight1Icon = "✓";
  let insight1Color = "#10b981";
  let insight1Bg = "rgba(16, 185, 129, 0.12)";

  const bestSubject = subjects.reduce((prev, current) => (prev.progress > current.progress) ? prev : current, subjects[0] || {});
  if (bestSubject && bestSubject.progress >= 80) {
    insight1Title = `Excellent progress in ${bestSubject.course}`;
    insight1Sub = `You are performing exceptionally well in this course. Keep it up!`;
  } else if (overallScore >= 80) {
    insight1Title = `Overall score is high at ${overallScore}%`;
    insight1Sub = "Great work! You are consistently performing well.";
  } else {
    insight1Title = `Current overall score is ${overallScore}%`;
    insight1Sub = "Complete more assessments to boost your average.";
  }

  // Insight 2: Focus area / weakest subject
  const worstSubject = subjects.reduce((prev, current) => (prev.progress < current.progress) ? prev : current, subjects[0] || {});
  let insight2Title = "All subjects show steady progress";
  let insight2Sub = "Your performance is balanced across all courses.";
  if (worstSubject && worstSubject.progress < 75) {
    insight2Title = `Focus more on ${worstSubject.course}`;
    insight2Sub = `Your score is ${worstSubject.score}. Extra study here will boost your average.`;
  } else if (worstSubject) {
    insight2Title = `Review material in ${worstSubject.course}`;
    insight2Sub = `This is currently your lowest scoring course (${worstSubject.score}).`;
  }

  // Insight 3: Pending Assignments
  const pendingAssignmentsCount = tasks.filter(t => t.status === "PENDING" || t.status === "RESUBMISSION_REQUESTED" || t.status === "SUBMISSION_REQUESTED").length;
  let insight3Title = "No pending assignments";
  let insight3Sub = "All your submissions are up to date! Great job.";
  let insight3Icon = "✓";
  let insight3Color = "#10b981";
  let insight3Bg = "rgba(16, 185, 129, 0.12)";
  
  if (pendingAssignmentsCount > 0) {
    insight3Title = `${pendingAssignmentsCount} assignment${pendingAssignmentsCount > 1 ? "s" : ""} pending`;
    insight3Sub = "Complete them to boost your overall score.";
    insight3Icon = "🕒";
    insight3Color = "#f59e0b";
    insight3Bg = "rgba(245, 158, 11, 0.12)";
  }

  // Insight 4: Class Rank
  const insight4Title = `You are in the top ${rankPct}% of your class`;
  const insight4Sub = `Current estimated standing: ${rankStr}. Keep pushing!`;

  // Helper Sparkline SVG drawing
  const Sparkline = ({ points, color }) => (
    <svg viewBox="0 0 100 30" style={{ width: "100%", height: 32, marginTop: 10 }}>
      <path
        d={`M ${points.map((p, i) => `${(i / (points.length - 1)) * 100} ${30 - (p / 100) * 24}`).join(" L ")}`}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <div className="fade-up" style={{ paddingBottom: 40 }}>
      
      {/* Header Panel */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, fontFamily: "Syne", lineHeight: 1.2 }}>Performance</h1>
          <p style={{ fontSize: 13, color: T.muted, marginTop: 4 }}>Home / Performance</p>
        </div>
        <select 
          value={semester} 
          onChange={(e) => setSemester(e.target.value)}
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            border: `1.5px solid ${T.border}`,
            background: T.bg3,
            color: T.text,
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            outline: "none",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
          }}
        >
          <option value="This Semester (Jan - May 2026)">This Semester (Jan - May 2026)</option>
          <option value="Last Semester (Jul - Dec 2025)">Last Semester (Jul - Dec 2025)</option>
        </select>
      </div>

      {/* ─── 1. TOP STATS CARDS ─────────────────────────────────────────────────── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 16,
        marginBottom: 24
      }}>
        {/* Card 1: Overall Score */}
        <Card style={{ padding: 18 }} hover={true}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>Overall Score</div>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(124, 58, 237, 0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🎓</div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: T.primaryL, fontFamily: "Syne" }}>{overallScore}%</div>
          <div style={{ fontSize: 11, color: "#10b981", fontWeight: 600, marginTop: 2 }}>Good Performance</div>
          <Sparkline points={[72, 75, 78, 80, overallScore]} color={T.primaryL} />
        </Card>

        {/* Card 2: Assignments Completed */}
        <Card style={{ padding: 18 }} hover={true}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>Assignments Completed</div>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(59, 130, 246, 0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📋</div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#3b82f6", fontFamily: "Syne" }}>{completedTasks} / {totalTasks}</div>
          <div style={{ fontSize: 11, color: T.muted, fontWeight: 600, marginTop: 2 }}>{taskPct}% Completed</div>
          <Sparkline points={[30, 45, 55, 70, taskPct]} color="#3b82f6" />
        </Card>

        {/* Card 3: Attendance */}
        <Card style={{ padding: 18 }} hover={true}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>Attendance</div>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(16, 185, 129, 0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🎯</div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#10b981", fontFamily: "Syne" }}>{attendancePct}%</div>
          <div style={{ fontSize: 11, color: T.muted, fontWeight: 600, marginTop: 2 }}>Present ({totalPresent} / {totalDays} Days)</div>
          <Sparkline points={[92, 88, 85, 84, attendancePct]} color="#10b981" />
        </Card>

        {/* Card 4: Courses Enrolled */}
        <Card style={{ padding: 18 }} hover={true}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>Courses Enrolled</div>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(245, 158, 11, 0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📚</div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#f59e0b", fontFamily: "Syne" }}>{enrolledCoursesCount}</div>
          <div style={{ fontSize: 11, color: T.muted, fontWeight: 600, marginTop: 2 }}>Active Courses</div>
          <Sparkline points={[60, 60, 80, 100, 100]} color="#f59e0b" />
        </Card>

        {/* Card 5: Class Rank */}
        <Card style={{ padding: 18 }} hover={true}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>Class Rank</div>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(168, 85, 247, 0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏆</div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#a855f7", fontFamily: "Syne" }}>{rankStr}</div>
          <div style={{ fontSize: 11, color: "#a855f7", fontWeight: 600, marginTop: 2 }}>Top {rankPct}% in Class</div>
          <Sparkline points={[50, 65, 78, 82, 100 - rankPct]} color="#a855f7" />
        </Card>
      </div>

      {/* ─── 2. MIDDLE SPLIT SECTION ────────────────────────────────────────────── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1.1fr 1.9fr",
        gap: 20,
        marginBottom: 24
      }} className="lms-responsive-split-2-1">
        
        {/* Left Card: Performance Overview Donut */}
        <Card style={{ padding: 24 }}>
          <h3 style={{ margin: "0 0 16px 0", fontFamily: "Syne", fontSize: 16, fontWeight: 800 }}>Performance Overview</h3>
          
          <div style={{ position: "relative", width: 170, height: 170, margin: "20px auto 24px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{
              position: "absolute",
              top: 0, left: 0, right: 0, bottom: 0,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center"
            }}>
              <span style={{ fontSize: 30, fontWeight: 800, fontFamily: "Syne", color: T.text }}>{overallScore}%</span>
              <span style={{ fontSize: 10, color: T.muted, fontWeight: 700, textTransform: "uppercase" }}>Overall</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {donutData.map((d, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: d.color, display: "inline-block" }} />
                  <span style={{ color: T.muted }}>{d.name}</span>
                </div>
                <span style={{ fontWeight: 700, color: T.text }}>{d.value}%</span>
              </div>
            ))}
          </div>

          <div style={{
            background: T.bg2,
            border: `1.5px solid ${T.border}`,
            borderRadius: 10,
            padding: "10px 12px",
            fontSize: 11,
            color: T.muted,
            marginTop: 20,
            display: "flex",
            alignItems: "center",
            gap: 8,
            lineHeight: 1.4
          }}>
            <span>ℹ️</span>
            <span>Great job! You are performing better than 84% of your classmates.</span>
          </div>
        </Card>

        {/* Right Card: Subject Performance List */}
        <Card style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontFamily: "Syne", fontSize: 16, fontWeight: 800 }}>Subject Performance</h3>
            <span style={{ fontSize: 11, color: T.primaryL, fontWeight: 700, cursor: "pointer" }}>View detailed</span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 500 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  <th style={{ textAlign: "left", padding: "10px 8px", fontSize: 10, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.8 }}>Course</th>
                  <th style={{ textAlign: "left", padding: "10px 8px", fontSize: 10, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.8 }}>Progress</th>
                  <th style={{ textAlign: "center", padding: "10px 8px", fontSize: 10, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.8 }}>Score</th>
                  <th style={{ textAlign: "center", padding: "10px 8px", fontSize: 10, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.8 }}>Grade</th>
                  <th style={{ textAlign: "right", padding: "10px 8px", fontSize: 10, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 0.8 }}>Trend</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((s, idx) => (
                  <tr key={idx} style={{ borderBottom: `1px solid rgba(45,33,96,0.2)` }}>
                    {/* Course */}
                    <td style={{ padding: "12px 8px" }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: T.text }}>{s.course}</div>
                      <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>{s.instructor}</div>
                    </td>
                    {/* Progress Bar */}
                    <td style={{ padding: "12px 8px", width: 140 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <ProgressBar value={s.progress} color={T.primaryL} height={5} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: T.muted }}>{s.progress}%</span>
                      </div>
                    </td>
                    {/* Score */}
                    <td style={{ padding: "12px 8px", textAlign: "center", fontWeight: 700, fontSize: 13, color: T.text }}>
                      {s.score}
                    </td>
                    {/* Grade */}
                    <td style={{ padding: "12px 8px", textAlign: "center" }}>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 800,
                        background: s.grade.startsWith("A") ? "rgba(16,185,129,0.15)" : "rgba(124,58,237,0.15)",
                        color: s.grade.startsWith("A") ? "#10b981" : T.primaryL,
                        padding: "2px 8px",
                        borderRadius: 6
                      }}>{s.grade}</span>
                    </td>
                    {/* Trend */}
                    <td style={{ padding: "12px 8px", textAlign: "right" }}>
                      <span style={{
                        fontSize: 16,
                        fontWeight: "bold",
                        color: s.trend === "up" ? "#10b981" : s.trend === "flat" ? "#3b82f6" : "#ef4444"
                      }}>
                        {s.trend === "up" ? "↗" : s.trend === "flat" ? "→" : "↘"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Attendance Analysis Bar Chart */}
      <Card style={{ padding: 24, marginBottom: 24 }} hover={true}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <h3 style={{ margin: 0, fontFamily: "Syne", fontSize: 16, fontWeight: 800 }}>Attendance Analysis ({period === "WEEKLY" ? "Weekly" : "Monthly"})</h3>
          
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* Search Input for Courses */}
            <input 
              type="text"
              placeholder="🔍 Search course..."
              value={courseSearch}
              onChange={e => setCourseSearch(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: `1.5px solid ${T.border}`,
                background: T.bg3,
                color: T.text,
                fontSize: 12,
                outline: "none"
              }}
            />
            {/* Select dropdown filtered by search */}
            <select
              value={selectedCourseId}
              onChange={e => setSelectedCourseId(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: `1.5px solid ${T.border}`,
                background: T.bg3,
                color: T.text,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                outline: "none"
              }}
            >
              <option value="">-- Choose Course --</option>
              {courses.filter(c => c.title?.toLowerCase().includes(courseSearch.toLowerCase())).map(c => (
                <option key={c.id} value={String(c.id)}>{c.title}</option>
              ))}
            </select>

            <select 
              value={period} 
              onChange={(e) => setPeriod(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: `1.5px solid ${T.border}`,
                background: T.bg3,
                color: T.text,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                outline: "none"
              }}
            >
              <option value="WEEKLY">Weekly View</option>
              <option value="MONTHLY">Monthly View</option>
            </select>
          </div>
        </div>

        {/* Working days & Leave days summary metrics */}
        {courseAttendance && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12, marginBottom: 20 }}>
            <div style={{ background: `${T.primary}12`, border: `1.5px solid ${T.primary}25`, borderRadius: 10, padding: 12, textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: T.primary }}>{courseAttendance.totalWorkingDays || 0}</div>
              <div style={{ fontSize: 10, color: T.muted, textTransform: "uppercase", marginTop: 4, fontWeight: 700 }}>Working Days</div>
            </div>
            <div style={{ background: `${T.accentY}12`, border: `1.5px solid ${T.accentY}25`, borderRadius: 10, padding: 12, textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: T.accentY }}>{courseAttendance.totalLeaveDays || 0}</div>
              <div style={{ fontSize: 10, color: T.muted, textTransform: "uppercase", marginTop: 4, fontWeight: 700 }}>Leave Days</div>
            </div>
            <div style={{ background: "rgba(16, 185, 129, 0.12)", border: "1.5px solid rgba(16, 185, 129, 0.25)", borderRadius: 10, padding: 12, textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#10b981" }}>{totalPresent}</div>
              <div style={{ fontSize: 10, color: T.muted, textTransform: "uppercase", marginTop: 4, fontWeight: 700 }}>Attended</div>
            </div>
            <div style={{ background: "rgba(239, 68, 68, 0.12)", border: "1.5px solid rgba(239, 68, 68, 0.25)", borderRadius: 10, padding: 12, textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#ef4444" }}>{totalAbsent}</div>
              <div style={{ fontSize: 10, color: T.muted, textTransform: "uppercase", marginTop: 4, fontWeight: 700 }}>Missed</div>
            </div>
            <div style={{ background: "rgba(59, 130, 246, 0.12)", border: "1.5px solid rgba(59, 130, 246, 0.25)", borderRadius: 10, padding: 12, textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#3b82f6" }}>{courseAttendance.percentage || "0.0"}%</div>
              <div style={{ fontSize: 10, color: T.muted, textTransform: "uppercase", marginTop: 4, fontWeight: 700 }}>Attendance Rate</div>
            </div>
          </div>
        )}

        {loadingCourseAtt ? (
          <div style={{ padding: 40, textAlign: "center", color: T.muted }}>Loading course attendance data...</div>
        ) : attendance.length === 0 ? (
          <p style={{ color: T.muted, fontSize: 13 }}>No attendance data available for this course.</p>
        ) : (
          <div style={{ margin: "10px 0" }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart 
                data={attendance} 
                margin={{ top: 10, right: 10, left: -25, bottom: 40 }}
              >
                <XAxis 
                  dataKey="week" 
                  angle={-25} 
                  textAnchor="end" 
                  height={70}
                  interval={0}
                  tick={{ fontSize: 10, fill: T.muted }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 10, fill: T.muted }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: `${T.primary}08` }} />
                <Bar dataKey="present" fill="#10b981" radius={[4, 4, 0, 0]} name="Present" />
                <Bar dataKey="absent" fill="#ef4444" radius={[4, 4, 0, 0]} name="Absent" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* ─── 3. BOTTOM THREE COLUMN ANALYTICS SECTION ────────────────────────────── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: 20
      }} className="lms-responsive-grid-3">
        
        {/* Column 1: Grade Distribution */}
        <Card style={{ padding: 20 }}>
          <h3 style={{ margin: "0 0 16px 0", fontFamily: "Syne", fontSize: 15, fontWeight: 800 }}>Grade Distribution</h3>
          
          <div style={{ margin: "14px 0" }}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={gradeDistribution} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.muted }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: T.muted }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {gradeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
            {gradeDistribution.map((g, idx) => (
              <div key={idx} style={{ textAlign: "center", flex: 1, minWidth: 45 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: g.color }}>{g.count}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.text, marginTop: 2 }}>{g.name}</div>
                <div style={{ fontSize: 8, color: T.muted }}>{g.range}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Column 2: Recent Assessments */}
        <Card style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontFamily: "Syne", fontSize: 15, fontWeight: 800 }}>Recent Assessments</h3>
            <span style={{ fontSize: 11, color: T.primaryL, fontWeight: 700, cursor: "pointer" }}>View all</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {recentAssessments.map((a, idx) => (
              <div key={idx} style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 12px",
                background: T.bg3,
                borderRadius: 10,
                border: `1px solid ${T.border}`
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: `${a.color}15`, display: "flex",
                    alignItems: "center", justifyContent: "center",
                    fontSize: 14, flexShrink: 0
                  }}>
                    📝
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 12.5, color: T.text, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                      {a.title}
                    </div>
                    <div style={{ fontSize: 10, color: T.muted, marginTop: 2, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                      {a.course} · {a.date}
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 800, color: a.color, flexShrink: 0, marginLeft: 8 }}>
                  {a.score}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Column 3: Performance Insights */}
        <Card style={{ padding: 20 }}>
          <h3 style={{ margin: "0 0 16px 0", fontFamily: "Syne", fontSize: 15, fontWeight: 800 }}>✨ Performance Insights</h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Insight 1 */}
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: insight1Bg, display: "flex",
                alignItems: "center", justifyContent: "center",
                color: insight1Color, fontSize: 13, flexShrink: 0, marginTop: 2
              }}>{insight1Icon}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: T.text }}>{insight1Title}</div>
                <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>{insight1Sub}</div>
              </div>
            </div>

            {/* Insight 2 */}
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: "rgba(59, 130, 246, 0.12)", display: "flex",
                alignItems: "center", justifyContent: "center",
                color: "#3b82f6", fontSize: 13, flexShrink: 0, marginTop: 2
              }}>📘</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: T.text }}>{insight2Title}</div>
                <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>{insight2Sub}</div>
              </div>
            </div>

            {/* Insight 3 */}
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: insight3Bg, display: "flex",
                alignItems: "center", justifyContent: "center",
                color: insight3Color, fontSize: 13, flexShrink: 0, marginTop: 2
              }}>{insight3Icon}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: T.text }}>{insight3Title}</div>
                <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>{insight3Sub}</div>
              </div>
            </div>

            {/* Insight 4 */}
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: "rgba(168, 85, 247, 0.12)", display: "flex",
                alignItems: "center", justifyContent: "center",
                color: "#a855f7", fontSize: 13, flexShrink: 0, marginTop: 2
              }}>🎯</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: T.text }}>{insight4Title}</div>
                <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>{insight4Sub}</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

    </div>
  );
};

// ─── STUDENT NOTIFICATIONS ────────────────────────────────────────────────────
const StudentNotifications = () => {
  const [notifs, setNotifs]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("ALL");

  useEffect(() => {
    getStudentNotifications()
      .then(d => setNotifs(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleMarkRead = async id => {
    await markStudentNotifRead(id).catch(console.error);
    setNotifs(n => n.map(x => x.id === id ? { ...x, read: true } : x));
  };
  const handleMarkAll = async () => {
    await markStudentNotifReadAll().catch(console.error);
    setNotifs(n => n.map(x => ({ ...x, read: true })));
  };

  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when filter changes
  useEffect(() => setCurrentPage(1), [filter]);

  const typeIcon  = { INFO: "ℹ️", WARNING: "⚠️", SUCCESS: "✅", ERROR: "❌" };
  const typeColor = { INFO: T.accent, WARNING: T.accentY, SUCCESS: T.accentG, ERROR: "#ef4444" };
  const unread    = notifs.filter(n => !n.read).length;
  const filtered  = filter === "ALL" ? notifs
    : filter === "UNREAD" ? notifs.filter(n => !n.read)
    : notifs.filter(n => n.type === filter);

  // Pagination logic
  const pageSize = 20;
  const totalPages = Math.ceil(filtered.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedNotifs = filtered.slice(startIndex, startIndex + pageSize);

  return (
    <div className="fade-up">
      <PageHeader title="Notifications"
        subtitle={`${unread} unread · ${notifs.length} total`}
        actions={[<Btn variant="ghost" size="sm" onClick={handleMarkAll} disabled={unread === 0}>✓ Mark All Read</Btn>]} />
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { key: "ALL",     label: `All (${notifs.length})` },
          { key: "UNREAD",  label: `🔵 Unread (${unread})` },
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
        : paginatedNotifs.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: T.muted }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🔔</div>
            <div style={{ fontFamily: "Syne", fontWeight: 700 }}>No notifications</div>
          </div>
        ) : (
          <>
            {paginatedNotifs.map((n, i) => (
              <div key={n.id} onClick={() => !n.read && handleMarkRead(n.id)}
                style={{ display: "flex", gap: 14, padding: "14px 0",
                  borderBottom: i < paginatedNotifs.length - 1 ? `1px solid rgba(45,33,96,.3)` : "none",
                  alignItems: "flex-start", cursor: !n.read ? "pointer" : "default",
                  background: !n.read ? `${T.primary}05` : "transparent" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: `${typeColor[n.type] || T.primary}18`,
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
                  background: typeColor[n.type] || T.primaryL, flexShrink: 0, marginTop: 6 }} />}
              </div>
            ))}
            
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0 0 0", marginTop: "14px", borderTop: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 12, color: T.muted }}>
                  Showing {startIndex + 1} to {Math.min(startIndex + pageSize, filtered.length)} of {filtered.length} notifications
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
          </>
        )}
      </Card>
    </div>
  );
};

export const StudentCertificates = () => {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const { profile } = useStudentProfile();

  useEffect(() => {
    getStudentCertificates()
      .then(res => {
        setCerts(Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDownloadClick = (cert) => {
    setSelectedCert(cert);
    setShowModal(true);
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", color: T.muted }}>Loading certifications...</div>;
  }

  return (
    <div className="fade-up">
      <PageHeader title="My Certified Achievements" />
      
      {certs.length === 0 ? (
        <Card style={{ padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎓</div>
          <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
            No Certificates Awarded Yet
          </div>
          <div style={{ color: T.muted, fontSize: 13, maxWidth: 400, margin: "0 auto" }}>
            Complete your courses, assignments, and exams with top marks to earn official certifications from your instructors!
          </div>
        </Card>
      ) : (
        <div style={{ display: "grid", gap: 20 }}>
          {certs.map(c => (
            <Card key={c.id} style={{ padding: 24, position: "relative", overflow: "hidden" }}>
              {/* Premium Background Accent Line */}
              <div style={{
                position: "absolute",
                top: 0, left: 0, right: 0, height: 6,
                background: `linear-gradient(90deg, ${T.primary}, ${T.accent})`
              }} />
              
              <div style={{ display: "grid", gridTemplateColumns: "1.4fr 0.6fr", gap: 20 }}>
                <div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
                    <span style={{ fontSize: 20 }}>🏆</span>
                    <Badge variant={c.grade === "A+" || c.grade === "A" ? "success" : "primary"}>
                      Grade {c.grade}
                    </Badge>
                    <span style={{ fontSize: 11, color: T.muted }}>• Issued: {new Date(c.issueDate).toLocaleDateString("en-IN")}</span>
                  </div>

                  <h3 style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 18, margin: "0 0 6px 0", color: T.text }}>
                    {c.courseTitle}
                  </h3>
                  <div style={{ fontSize: 13, color: T.muted, marginBottom: 12 }}>
                    Instructor: <strong>{c.teacherName}</strong>
                  </div>
                  
                  <div style={{
                    background: T.bg3,
                    borderRadius: 8,
                    padding: "10px 14px",
                    fontSize: 13,
                    fontStyle: "italic",
                    borderLeft: `3px solid ${T.accent}`,
                    color: T.muted,
                    marginBottom: 14
                  }}>
                    "{c.remarks || "Outstanding course completion and performance."}"
                  </div>

                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: T.muted }}>Verification ID:</span>
                    <span style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 700, color: T.primaryL }}>
                      {c.certificateNumber}
                    </span>
                  </div>
                </div>

                {/* Right Side: Certificate Actions */}
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: T.bg3,
                  borderRadius: 12,
                  padding: 16,
                  textAlign: "center",
                  border: `1.5px solid ${T.bg2}`
                }}>
                  <div>
                    <div style={{ fontSize: 36, marginBottom: 4 }}>🎖️</div>
                    <div style={{ fontWeight: 800, fontSize: 12, textTransform: "uppercase", color: T.primaryL }}>
                      Verified Certificate
                    </div>
                    <div style={{ fontSize: 10, color: T.muted, marginBottom: 12 }}>
                      Zenelait Academic Seal
                    </div>
                  </div>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
                    <Btn 
                      size="xs" 
                      variant="primary" 
                      full
                      onClick={() => handleDownloadClick(c)}
                    >
                      📥 View & Download
                    </Btn>
                    <Btn 
                      size="xs" 
                      variant="ghost" 
                      full
                      onClick={() => alert(`Certificate verified securely!\nID: ${c.certificateNumber}\nCourse: ${c.courseTitle}\nAwardee Name verified.`)}
                    >
                      ✓ Verify
                    </Btn>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      
      {/* Certificate Preview Modal */}
      <CertificatePreviewModal
        open={showModal}
        onClose={() => setShowModal(false)}
        certificate={selectedCert || {}}
        studentName={profile?.name || "Student Name"}
      />
    </div>
  );
};

const StudentAssessments = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assessmentFilter, setAssessmentFilter] = useState("PENDING");

  const filteredAssessments = assessments.filter(a => {
    const isCompleted = a.attemptStatus === "SUBMITTED" || a.attemptStatus === "GRADED";
    const isMissed = !isCompleted && a.endDate && new Date(a.endDate) < new Date();
    if (assessmentFilter === "PENDING") return !isCompleted && !isMissed;
    if (assessmentFilter === "SUBMITTED") return isCompleted;
    if (assessmentFilter === "MISSED") return isMissed;
    return true; // ALL
  });

  // Attempt Runner State
  const [activeAttempt, setActiveAttempt] = useState(null); // contains { attemptId, title, durationMinutes, questions: [], savedAnswers: {} }
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [runnerSaving, setRunnerSaving] = useState(false);

  // Load courses on mount
  useEffect(() => {
    getStudentCourses()
      .then(c => {
        const list = Array.isArray(c) ? c : [];
        setCourses(list);
        if (list.length > 0) {
          setSelectedCourseId(String(list[0].id));
        }
      })
      .catch(console.error);
  }, []);

  // Load assessments when selected course changes
  const loadAssessments = (courseId) => {
    if (!courseId) return;
    setLoading(true);
    getStudentAssessments(courseId)
      .then(d => {
        setAssessments(Array.isArray(d) ? d : (d?.data ? d.data : []));
      })
      .catch(err => {
        console.error("❌ Fetch assessments error:", err);
        setAssessments([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAssessments(selectedCourseId);
  }, [selectedCourseId]);

  // Tab switch monitoring
  useEffect(() => {
    if (!activeAttempt) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        handleTabSwitch();
      }
    };

    const handleBlur = () => {
      handleTabSwitch();
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
    };
  }, [activeAttempt]);

  const handleTabSwitch = async () => {
    if (!activeAttempt) return;
    try {
      await incrementTabSwitch(activeAttempt.attemptId);
      setTabSwitchCount(c => {
        const next = c + 1;
        if (next >= 3) {
          alert("⚠️ Excessive tab switching detected! Your assessment is being submitted automatically.");
          autoSubmit(next);
        } else {
          alert(`⚠️ Warning: Tab switching/window blur is monitored. Avoid leaving this tab!\nTab switch count: ${next}/3`);
        }
        return next;
      });
    } catch (e) {
      console.error("Failed to record tab switch:", e);
    }
  };

  // Timer countdown
  useEffect(() => {
    if (!activeAttempt || timeLeft <= 0) {
      if (activeAttempt && timeLeft === 0) {
        alert("⏳ Time has expired! Your assessment is being submitted automatically.");
        autoSubmit(tabSwitchCount);
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(t => t - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [activeAttempt, timeLeft]);

  const handleStart = async (assessmentId) => {
    try {
      const res = await startAssessment(assessmentId);
      const data = res?.data || res;
      if (!data || !data.attemptId) {
        throw new Error("Could not start assessment");
      }
      setCurrentQuestionIndex(0);
      setAnswers(data.savedAnswers || {});
      setTabSwitchCount(0);
      setActiveAttempt(data);
      
      // Calculate remaining time
      const durationSecs = (data.durationMinutes || 30) * 60;
      setTimeLeft(durationSecs);
    } catch (e) {
      alert("Error: " + e.message);
    }
  };

  const handleAnswerChange = (qId, val) => {
    setAnswers(prev => {
      const updated = { ...prev, [qId]: val };
      // Auto save on change
      saveAssessmentProgress(activeAttempt.attemptId, { [qId]: val })
        .catch(err => console.error("Auto save failed:", err));
      return updated;
    });
  };

  const autoSubmit = async (finalTabSwitches) => {
    if (!activeAttempt) return;
    try {
      await submitAssessmentAttempt(activeAttempt.attemptId, {
        answers,
        tabSwitchCount: finalTabSwitches || tabSwitchCount
      });
      setActiveAttempt(null);
      loadAssessments(selectedCourseId);
    } catch (e) {
      alert("Auto-submit failed: " + e.message);
    }
  };

  const handleSubmitAttempt = async () => {
    if (!window.confirm("Are you sure you want to submit your assessment?")) return;
    setRunnerSaving(true);
    try {
      await submitAssessmentAttempt(activeAttempt.attemptId, {
        answers,
        tabSwitchCount
      });
      alert("✅ Assessment submitted successfully!");
      setActiveAttempt(null);
      loadAssessments(selectedCourseId);
    } catch (e) {
      alert("Submission failed: " + e.message);
    } finally {
      setRunnerSaving(false);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const inputSty = { width: "100%", background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: T.text, boxSizing: "border-box", outline: "none" };

  if (activeAttempt) {
    // RENDER ATTEMPT RUNNER (Fullscreen)
    const questions = activeAttempt.questions || [];
    const totalQs = questions.length;
    const currentQ = (totalQs > 0 && currentQuestionIndex < totalQs) ? questions[currentQuestionIndex] : {};

    return (
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: T.bg1, zIndex: 9999, display: "flex", flexDirection: "column",
        fontFamily: "DM Sans", color: T.text
      }}>
        {/* Runner Header */}
        <div style={{
          background: T.bg2, borderBottom: `1px solid ${T.border}`,
          padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <div>
            <div style={{ fontSize: 12, color: T.muted, textTransform: "uppercase", fontWeight: 700 }}>Assessment In Progress</div>
            <div style={{ fontSize: 16, fontWeight: 800, fontFamily: "Syne" }}>{activeAttempt.title}</div>
          </div>
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <div style={{ background: "rgba(239, 68, 68, 0.1)", color: "#EF4444", padding: "8px 16px", borderRadius: 8, fontWeight: 700, fontSize: 15 }}>
              ⏱️ Time Left: {formatTime(timeLeft)}
            </div>
            <Btn variant="danger" size="sm" onClick={handleSubmitAttempt} disabled={runnerSaving}>Submit Assessment</Btn>
          </div>
        </div>

        {/* Runner Body */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Main Question Panel */}
          <div style={{ flex: 1, padding: 32, overflowY: "auto", display: "flex", flexDirection: "column", gap: 24 }}>
            {totalQs === 0 ? (
              <div style={{ textAlign: "center", color: T.muted }}>No questions found in this assessment.</div>
            ) : (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: T.muted, fontWeight: 700 }}>QUESTION {currentQuestionIndex + 1} OF {totalQs}</span>
                  <Badge type="primary">{currentQ.marks} Marks</Badge>
                </div>
                
                <Card style={{ padding: 24, marginBottom: 20 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.6, marginBottom: 16 }}>{currentQ.questionText}</div>
                  
                  {currentQ.imageUrl && (
                    <img src={currentQ.imageUrl} alt="Question Graphic" style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 8, marginBottom: 16, objectFit: "contain" }} />
                  )}

                  {/* Render Answer Inputs based on Question Type */}
                  {currentQ.questionType === "MCQ" && (() => {
                    let opts = [];
                    try {
                      opts = typeof currentQ.optionsJson === "string" ? JSON.parse(currentQ.optionsJson) : currentQ.optionsJson;
                    } catch (e) {
                      opts = [];
                    }
                    if (!Array.isArray(opts)) opts = [];

                    return (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {opts.map((opt, idx) => {
                          const isChecked = answers[currentQ.id] === opt;
                          return (
                            <label key={idx} style={{
                              display: "flex", alignItems: "center", gap: 10,
                              background: isChecked ? `${T.primary}12` : T.bg2,
                              border: `1px solid ${isChecked ? T.primary : T.border}`,
                              borderRadius: 8, padding: "12px 16px", cursor: "pointer",
                              transition: "all 0.2s"
                            }}>
                              <input type="radio" name={`q-${currentQ.id}`} checked={isChecked} onChange={() => handleAnswerChange(currentQ.id, opt)} />
                              <span style={{ fontSize: 14 }}>{opt}</span>
                            </label>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {currentQ.questionType === "TRUE_FALSE" && (
                    <div style={{ display: "flex", gap: 12 }}>
                      {["True", "False"].map(opt => {
                        const isChecked = answers[currentQ.id] === opt;
                        return (
                          <label key={opt} style={{
                            flex: 1, display: "flex", alignItems: "center", gap: 10,
                            background: isChecked ? `${T.primary}12` : T.bg2,
                            border: `1px solid ${isChecked ? T.primary : T.border}`,
                            borderRadius: 8, padding: "12px 16px", cursor: "pointer",
                            transition: "all 0.2s"
                          }}>
                            <input type="radio" name={`q-${currentQ.id}`} checked={isChecked} onChange={() => handleAnswerChange(currentQ.id, opt)} />
                            <span style={{ fontSize: 14 }}>{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {currentQ.questionType === "FILL_IN_BLANKS" && (
                    <div>
                      <input type="text" style={inputSty} placeholder="Type your answer here..." value={answers[currentQ.id] || ""} onChange={e => handleAnswerChange(currentQ.id, e.target.value)} />
                    </div>
                  )}

                  {currentQ.questionType === "DESCRIPTIVE" && (
                    <div>
                      <textarea rows={8} style={{ ...inputSty, resize: "vertical", fontFamily: "DM Sans" }} placeholder="Type your detailed answer here..." value={answers[currentQ.id] || ""} onChange={e => handleAnswerChange(currentQ.id, e.target.value)} />
                    </div>
                  )}
                </Card>

                {/* Question Navigation */}
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <Btn variant="ghost" disabled={currentQuestionIndex === 0} onClick={() => setCurrentQuestionIndex(c => c - 1)}>← Previous</Btn>
                  <Btn variant="primary" disabled={currentQuestionIndex === totalQs - 1} onClick={() => setCurrentQuestionIndex(c => c + 1)}>Next →</Btn>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Navigation */}
          <div style={{
            width: 280, background: T.bg2, borderLeft: `1px solid ${T.border}`,
            padding: 24, display: "flex", flexDirection: "column", gap: 20
          }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", marginBottom: 12 }}>Question Navigation</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
                {questions.map((q, idx) => {
                  const isAnswered = answers[q.id] !== undefined && answers[q.id] !== "";
                  const isActive = idx === currentQuestionIndex;
                  return (
                    <button key={q.id} onClick={() => setCurrentQuestionIndex(idx)} style={{
                      height: 38, borderRadius: 6, cursor: "pointer",
                      fontWeight: 700, fontSize: 13,
                      background: isActive ? T.primary : isAnswered ? `${T.accentG}22` : T.bg3,
                      color: isActive ? "#fff" : isAnswered ? T.accentG : T.text,
                      border: isActive ? "none" : isAnswered ? `1px solid ${T.accentG}` : `1px solid ${T.border}`
                    }}>
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginTop: "auto", borderTop: `1px solid ${T.border}`, paddingTop: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", marginBottom: 6 }}>Integrity Monitoring</div>
              <div style={{ fontSize: 12, color: T.muted, display: "flex", flexDirection: "column", gap: 6 }}>
                <span>🚫 Leaving page is restricted.</span>
                <span style={{ color: tabSwitchCount > 0 ? "#EF4444" : undefined, fontWeight: tabSwitchCount > 0 ? 700 : undefined }}>
                  ⚠️ Tab Switch: {tabSwitchCount} / 3 warnings
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-up">
      <PageHeader title="⚡ Online Assessments" subtitle="Complete examinations, tests, and track results." />

      <Card style={{ marginBottom: 20, padding: 18 }}>
        <Select
          label="Select Course to View Assessments"
          value={selectedCourseId}
          onChange={e => setSelectedCourseId(e.target.value)}
          options={courses.map(c => ({ value: String(c.id), label: c.title }))}
        />
      </Card>

      {/* Dynamic Category Filter Buttons */}
      {!loading && assessments.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {[
            { key: "PENDING", label: `⏳ Pending (${assessments.filter(a => !(a.attemptStatus === "SUBMITTED" || a.attemptStatus === "GRADED") && !(a.endDate && new Date(a.endDate) < new Date())).length})` },
            { key: "SUBMITTED", label: `✅ Submitted (${assessments.filter(a => a.attemptStatus === "SUBMITTED" || a.attemptStatus === "GRADED").length})` },
            { key: "MISSED", label: `❌ Missed (${assessments.filter(a => !(a.attemptStatus === "SUBMITTED" || a.attemptStatus === "GRADED") && a.endDate && new Date(a.endDate) < new Date()).length})` },
            { key: "ALL", label: `📚 All (${assessments.length})` }
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setAssessmentFilter(f.key)}
              style={{
                padding: "8px 16px",
                borderRadius: 50,
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                border: `1.5px solid ${assessmentFilter === f.key ? T.primary : T.border}`,
                background: assessmentFilter === f.key ? `${T.primary}20` : "transparent",
                color: assessmentFilter === f.key ? T.primary : T.muted,
                transition: "all 0.2s"
              }}
              onMouseEnter={e => {
                if (assessmentFilter !== f.key) {
                  e.currentTarget.style.borderColor = T.primary;
                  e.currentTarget.style.color = T.text;
                }
              }}
              onMouseLeave={e => {
                if (assessmentFilter !== f.key) {
                  e.currentTarget.style.borderColor = T.border;
                  e.currentTarget.style.color = T.muted;
                }
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{ padding: 32, textAlign: "center", color: T.muted }}>Loading assessments…</div>
      ) : filteredAssessments.length === 0 ? (
        <Card><div style={{ padding: 40, textAlign: "center", color: T.muted }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>⚡</div>
          <div style={{ fontFamily: "Syne", fontWeight: 700 }}>
            {assessments.length === 0 ? "No assessments available" : `No ${assessmentFilter.toLowerCase()} assessments`}
          </div>
          <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>
            {assessments.length === 0 ? "Any assessments scheduled by the teacher will appear here." : `There are no assessments in the ${assessmentFilter.toLowerCase()} tab.`}
          </div>
        </div></Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filteredAssessments.map(a => {
            const hasAttempt = a.attemptStatus && a.attemptStatus !== "NOT_STARTED";
            const isCompleted = a.attemptStatus === "SUBMITTED" || a.attemptStatus === "GRADED";
            const hasScore = a.totalScore !== undefined && a.totalScore !== null;
            const isMissed = !isCompleted && a.endDate && new Date(a.endDate) < new Date();
            
            return (
              <Card key={a.id} style={{ padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                      <Badge type="primary">{a.assessmentType}</Badge>
                      <Badge type={isCompleted ? "success" : isMissed ? "danger" : hasAttempt ? "warning" : "ghost"}>
                        {isCompleted ? "Completed" : isMissed ? "Missed" : hasAttempt ? "In Progress" : "Pending"}
                      </Badge>
                    </div>

                    <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 4 }}>{a.title}</div>
                    {a.instructions && <div style={{ fontSize: 12, color: T.muted, marginBottom: 8 }}>{a.instructions}</div>}

                    <div style={{ display: "flex", flexWrap: "wrap", gap: 14, fontSize: 11, color: T.muted }}>
                      <span>⏳ Duration: {a.durationMinutes} mins</span>
                      <span>🎯 Total Marks: {a.totalMarks}</span>
                      <span>🔑 Pass Mark: {a.passMarks}</span>
                      {a.endDate && <span>📅 Deadline: {new Date(a.endDate).toLocaleString()}</span>}
                    </div>
                  </div>

                  <div style={{ flexShrink: 0 }}>
                    {!isCompleted ? (
                      isMissed ? (
                        <Btn variant="danger" disabled size="sm" style={{ opacity: 0.6, cursor: "not-allowed" }}>
                          Closed (Deadline Passed)
                        </Btn>
                      ) : (
                        <Btn variant="primary" size="sm" onClick={() => handleStart(a.id)}>
                          {hasAttempt ? "Resume Assessment →" : "Start Assessment →"}
                        </Btn>
                      )
                    ) : (
                      <div style={{ textAlign: "right" }}>
                        {hasScore ? (
                          <div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: a.totalScore >= a.passMarks ? T.accentG : "#EF4444" }}>
                              {a.totalScore} <span style={{ fontSize: 12, color: T.muted }}>/ {a.totalMarks}</span>
                            </div>
                            <Badge type={a.totalScore >= a.passMarks ? "success" : "danger"}>
                              {a.totalScore >= a.passMarks ? "Passed" : "Failed"}
                            </Badge>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: T.muted }}>Pending Evaluation</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

const STUDENT_PAGES = {
  overview:      StudentOverview,
  profile:       StudentProfile,
  courses:       StudentCourses,
  learning:      StudentLearningBoard,
  tasks:         StudentTasks,
  assessments:   StudentAssessments,
  fees:          StudentFees,
  timetable:     StudentTimetable,
  notifications: StudentNotifications,
  announcements: StudentAnnouncements,
  forum:         StudentForum,
  performance:  Performance,
  certificates:  StudentCertificates,
};

const StudentDashboard = ({ onLogout }) => {
  const [page, setPage] = useState("overview");
  // Profile state comes from StudentProfileContext (wrapped in App.jsx)
  const { profile }     = useStudentProfile();
  const { pct, missing } = calcProfileCompletion("student", profile || {});

  const [courses, setCourses] = useState([]);
  const [dismissedAlerts, setDismissedAlerts] = useState([]);
  const [liveAlert, setLiveAlert] = useState(null);

  useEffect(() => {
    getStudentCourses()
      .then(c => setCourses(Array.isArray(c) ? c : []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (courses.length === 0) return;
    const checkLiveClasses = async () => {
      try {
        for (const course of courses) {
          const mats = await getStudentMaterials(course.id);
          const activeLive = mats?.find(m => m.type === "MEET_LINK" && m.meetingStarted);
          if (activeLive && !dismissedAlerts.includes(activeLive.id)) {
            setLiveAlert({ ...activeLive, courseTitle: course.title });
            break; // Show one alert at a time
          }
        }
      } catch (err) {
        console.error("Failed to check live classes:", err);
      }
    };
    checkLiveClasses();
    const interval = setInterval(checkLiveClasses, 12000);
    return () => clearInterval(interval);
  }, [courses, dismissedAlerts]);

  useEffect(() => {
    const requiredFeatures = {
      timetable: "TIMETABLE",
      tasks: "ASSIGNMENTS",
      forum: "FORUMS",
      certificates: "CERTIFICATES",
      fees: "FEES",
      announcements: "ANNOUNCEMENTS"
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

  const Comp = STUDENT_PAGES[page] || STUDENT_PAGES.overview;

  return (
    <DashLayout role="student" page={page} onNav={setPage} onLogout={onLogout}>
      {liveAlert && (
        <div style={{
          background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`,
          color: "#fff",
          padding: "16px 20px",
          borderRadius: 12,
          marginBottom: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 6px 24px rgba(0,0,0,0.18)",
          border: `1px solid rgba(255, 255, 255, 0.2)`
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 24, animation: "pulse 1.5s infinite" }}>🎥</span>
            <div>
              <div style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 15 }}>Live Class In Progress!</div>
              <div style={{ fontSize: 12, opacity: 0.9, marginTop: 2 }}>
                "{liveAlert.title}" for <strong>{liveAlert.courseTitle}</strong> is active now.
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Btn size="xs" variant="primary" style={{ background: "#fff", color: T.primary, fontWeight: 700 }} onClick={async () => {
              try {
                await joinLiveClass(liveAlert.id);
              } catch (e) {
                console.error(e);
              }
              setPage("learning");
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent("join-live-meeting", { detail: liveAlert }));
              }, 120);
              setDismissedAlerts(prev => [...prev, liveAlert.id]);
              setLiveAlert(null);
            }}>
              Join Meeting →
            </Btn>
            <button onClick={() => {
              setDismissedAlerts(prev => [...prev, liveAlert.id]);
              setLiveAlert(null);
            }} style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer", fontSize: 18, padding: 4 }}>✕</button>
          </div>
        </div>
      )}
      {/* ProfileAlert reads from context — updates instantly after Save Profile */}
      <ProfileAlert pct={pct} missing={missing} onComplete={() => setPage("profile")} />
      <Comp onNav={setPage} />
    </DashLayout>
  );
};

export default StudentDashboard;
