// src/components/Layout/index.jsx
import { T, ROLE_COLORS, ROLE_NAMES } from "../../assets/styles/theme";
import { Avatar } from "../UI";
import { AiAgent } from "./AiAgent";
import { useAdminProfile }   from "../../context/AdminProfileContext";
import { useStudentProfile } from "../../context/StudentProfileContext";
import { useTeacherProfile } from "../../context/TeacherProfileContext";
import { useParentProfile }  from "../../context/ParentProfileContext";
import { useState, useEffect } from "react";
// ── Safe context hooks — only call when provider is actually mounted ───────────
const useSafeStudentProfile = () => {
  try { return useStudentProfile(); } catch { return null; }
};
const useSafeAdminProfile = () => {
  try { return useAdminProfile(); } catch { return null; }
};
const useSafeTeacherProfile = () => {
  try { return useTeacherProfile(); } catch { return null; }
};
const useSafeParentProfile = () => {
  try { return useParentProfile(); } catch { return null; }
};

// Read name from the JWT auth payload stored at login
const getAuthName = () => {
  try {
    const raw = localStorage.getItem("zenelait-auth");
    return raw ? (JSON.parse(raw).name || "") : "";
  } catch { return ""; }
};

// Returns { name, photo } for any role using the right context or auth token
const useRoleProfile = (role) => {
  const adminCtx   = useSafeAdminProfile();
  const studentCtx = useSafeStudentProfile();
  const teacherCtx = useSafeTeacherProfile();
  const parentCtx  = useSafeParentProfile();

  if (role === "admin") {
    return {
      name:  adminCtx?.profileName  || getAuthName(),
      photo: adminCtx?.profilePhoto || null,
    };
  }
  if (role === "student") {
    const p = studentCtx?.profile;
    return {
      name:  p?.name          || getAuthName(),
      photo: p?.profilePicUrl || null,
    };
  }
  if (role === "teacher") {
    const p = teacherCtx?.profile;
    return {
      name:  p?.name          || getAuthName(),
      photo: p?.profilePicUrl || null,
    };
  }
  if (role === "parent") {
    const p = parentCtx?.profile;
    return {
      name:  p?.name          || getAuthName(),
      photo: p?.profilePicUrl || null,
    };
  }
  // Fallback: read from auth token
  return { name: getAuthName(), photo: null };
};

export const SIDEBARS = {
  superadmin: [
    { section: "Core" },
    { key: "overview",   icon: "⚡",  label: "Super Dashboard"    },
    { key: "admins",     icon: "🛡️",  label: "Manage Admins"      },
    { key: "system",     icon: "⚙️",  label: "System Config"      },
    { section: "Analytics" },
    { key: "analytics",  icon: "📊",  label: "Platform Analytics" },
    { key: "revenue",    icon: "💰",  label: "Revenue Overview"   },
    { section: "Settings" },
    { key: "settings",   icon: "🔧",  label: "Global Settings"    },
    { key: "logs",       icon: "📋",  label: "Audit Logs"         },
  ],
  admin: [
    { section: "Main" },
    { key: "overview",       icon: "📊",  label: "Dashboard"          },
    { key: "profile",        icon: "👤",  label: "My Profile"         },
    { key: "subscription",   icon: "💎",  label: "Subscription Plan"  },
    { section: "System Control" },
    { key: "users",          icon: "👥",  label: "Manage Users"       },
    { key: "departments",    icon: "🏢",  label: "Departments"        },
    { key: "courses",        icon: "📚",  label: "Course Management"  },
    { key: "batches",        icon: "🏫",  label: "Batch Management"   },
    { key: "timetable",      icon: "📅",  label: "Timetable"          },
    { section: "Finance" },
    { key: "fees",           icon: "💳",  label: "Fee Setup & Manage" },
    { key: "payments",       icon: "💰",  label: "Payment Tracking"   },
    { key: "revenue",        icon: "📈",  label: "Revenue Analytics"  },
    { section: "Administration" },
    { key: "enrollments",    icon: "📥",  label: "Enrollment Requests" },
    { key: "ratings",        icon: "⭐",  label: "Teacher Ratings" },
    { key: "staff",          icon: "👨‍💼",  label: "Staff Performance"  },
    { key: "certifications", icon: "🎓",  label: "Certifications"     },
    { key: "queries",        icon: "📩",  label: "Contact Queries",  badge: 4 },
    { key: "notifications",  icon: "🔔",  label: "Notifications",    badge: 7 },
    { key: "meetings",       icon: "📹",  label: "Schedule Meetings"  },
  ],
  student: [
    { section: "Main" },
    { key: "overview",      icon: "📊",  label: "Dashboard"              },
    { key: "profile",       icon: "👤",  label: "My Profile"             },
    { key: "announcements", icon: "📢",  label: "Announcements"          },
    { section: "Learning" },
    { key: "courses",       icon: "📚",  label: "My Courses"             },
    { key: "learning",      icon: "🎥",  label: "Learning Board"         },
    { key: "timetable",     icon: "📅",  label: "Schedules"              },
    { key: "tasks",         icon: "📝",  label: "Tasks & Assignments", badge: 3 },
    { key: "assessments",   icon: "⚡",  label: "Online Assessments" },
    { section: "Community" },
    { key: "forum",         icon: "💬",  label: "Course Forums"          },
    { section: "Growth" },
    { key: "performance",   icon: "📈",  label: "Performance"            },
    { key: "certificates",  icon: "🎓",  label: "Certificates"           },
    { key: "fees",          icon: "💳",  label: "Fees & Payments"        },
    { key: "notifications", icon: "🔔",  label: "Notifications",     badge: 5 },
  ],
  teacher: [
    { section: "Main" },
    { key: "overview",       icon: "📊",  label: "Dashboard"       },
    { key: "profile",        icon: "👤",  label: "My Profile"      },
    { section: "Teaching" },
    { key: "courses",        icon: "📚",  label: "My Courses"      },
    { key: "liveclasses",    icon: "🎥",  label: "Live Classes"    },
    { key: "attendance",     icon: "✅",  label: "Attendance"      },
    { key: "grading",        icon: "📝",  label: "Grading & Exams" },
    { key: "timetable",      icon: "📅",  label: "Timetable"       },
    { section: "Community" },
    { key: "forum",          icon: "💬",  label: "Course Forums"   },
    { section: "More" },
    { key: "performance",    icon: "⭐",  label: "My Performance"  },
    { key: "messages",       icon: "💬",  label: "Messages"        },
    { key: "announcements",  icon: "📢",  label: "Announcements"   },
    { key: "certifications", icon: "🎓",  label: "Certifications"  },
    { key: "notifications",  icon: "🔔",  label: "Notifications", badge: 2 },
    { key: "meetings",       icon: "📹",  label: "Meetings"        },
  ],
  parent: [
    { section: "Main" },
    { key: "overview",      icon: "📊",  label: "Dashboard"            },
    { key: "profile",       icon: "👤",  label: "My Profile"           },
    { section: "Children" },
    { key: "children",      icon: "👶",  label: "Child Profiles"       },
    { key: "tracking",      icon: "📈",  label: "Course & Attendance"  },
    { key: "results",       icon: "📝",  label: "Assignments & Results"},
    { section: "More" },
    { key: "fees",          icon: "💳",  label: "Fees & Payments"      },
    { key: "timetable",     icon: "📅",  label: "Child's Timetable"    },
    { key: "messages",      icon: "💬",  label: "Message Teacher"      },
    { key: "notifications", icon: "🔔",  label: "Notifications",   badge: 3 },
  ],
};

// ─── PROFILE AVATAR ───────────────────────────────────────────────────────────
const ProfileAvatar = ({ role, color, size = 36 }) => {
  const { name, photo } = useRoleProfile(role);
  if (photo) {
    return (
      <div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden",
        flexShrink: 0, border: `2px solid ${color}` }}>
        <img src={photo} alt="Profile"
          style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    );
  }
  return <Avatar name={name || "?"} color={color} size={size} />;
};

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
const KEY_FEATURE_MAP = {
  timetable: "TIMETABLE",
  fees: "FEES",
  payments: "FEES",
  revenue: "FEES",
  announcements: "ANNOUNCEMENTS",
  attendance: "ATTENDANCE",
  tracking: "ATTENDANCE",
  tasks: "ASSIGNMENTS",
  grading: "ASSIGNMENTS",
  results: "ASSIGNMENTS",
  forum: "FORUMS",
  meetings: "MEETINGS",
  certifications: "CERTIFICATES",
  certificates: "CERTIFICATES"
};

export const Sidebar = ({ role, active, onNav, onLogout, isMobile, open, setOpen }) => {
  const items = SIDEBARS[role] || [];
  const color = ROLE_COLORS[role];
  const { name } = useRoleProfile(role);

  const enabledFeatures = (() => {
    try {
      const raw = localStorage.getItem("zenelait-features");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  })();

  const filteredItems = [];
  let currentSection = null;

  const authData = (() => {
    try {
      const raw = localStorage.getItem("zenelait-auth");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();
  const isSuperAdmin = authData?.superAdmin === true;

  items.forEach(item => {
    if (item.section) {
      currentSection = item;
    } else {
      if (item.key === "subscription" && !isSuperAdmin) {
        return;
      }
      const requiredFeature = KEY_FEATURE_MAP[item.key];
      if (requiredFeature && !enabledFeatures.includes(requiredFeature)) {
        return;
      }
      if (currentSection) {
        filteredItems.push(currentSection);
        currentSection = null;
      }
      filteredItems.push(item);
    }
  });

  return (
    <aside
  style={{
    width: 240,
    background: T.bg2,
    borderRight: `1px solid ${T.border}`,
    display: "flex",
    flexDirection: "column",
    position: "fixed",
    top: 0,
    bottom: 0,
    left: 0,
    zIndex: 200,
    overflowY: "auto",

    /* ✅ MOBILE SLIDE */
    transform: isMobile
      ? (open ? "translateX(0)" : "translateX(-100%)")
      : "translateX(0)",
    transition: "transform 0.3s ease",
  }}
>
      {/* Logo */}
      <div style={{ padding: "18px 20px 14px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10,
          fontFamily: "Syne", fontSize: 17, fontWeight: 900 }}>
          <div style={{ width: 34, height: 34,
            background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`,
            borderRadius: 9, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 16 }}>🎓</div>
          <span>Zenelait<span style={{ color: T.accent }}>LMS</span></span>
        </div>
      </div>
      {/* User Info */}
      <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}`,
        display: "flex", alignItems: "center", gap: 12 }}>
        <ProfileAvatar role={role} color={color} size={36} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.3 }}>{name || "…"}</div>
          <div style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>{ROLE_NAMES[role]}</div>
        </div>
      </div>
      {/* Navigation */}
      <nav style={{ flex: 1, padding: "10px 0" }}>
        {filteredItems.map((item, i) => item.section ? (
          <div key={i} style={{ padding: "8px 20px 4px", fontSize: 9, fontWeight: 800,
            color: T.muted, textTransform: "uppercase", letterSpacing: 1.4 }}>
            {item.section}
          </div>
        ) : (
          <div key={item.key} onClick={() => onNav(item.key)}
            style={{
              display: "flex", alignItems: "center", gap: 12, padding: "9px 20px",
              cursor: "pointer", transition: "all .2s",
              borderLeft: active === item.key ? `3px solid ${color}` : "3px solid transparent",
              background:  active === item.key ? `${color}15` : "transparent",
              color:       active === item.key ? color : T.muted,
              fontWeight:  active === item.key ? 700 : 500, fontSize: 13,
            }}
            onMouseEnter={e => { if (active !== item.key) {
              e.currentTarget.style.background = `${color}08`;
              e.currentTarget.style.color = T.text;
            }}}
            onMouseLeave={e => { if (active !== item.key) {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = T.muted;
            }}}
          >
            <span style={{ fontSize: 15 }}>{item.icon}</span>
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.badge && (
              <span style={{ background: T.accentR, color: "#fff", borderRadius: 50,
                fontSize: 10, fontWeight: 800, padding: "1px 7px" }}>
                {item.badge}
              </span>
            )}
          </div>
        ))}
      </nav>
      {/* Logout */}
      <div style={{ padding: "14px 20px", borderTop: `1px solid ${T.border}` }}>
        <button onClick={onLogout}
          style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13,
            color: T.muted, background: "none", border: "none",
            cursor: "pointer", transition: "color .2s" }}
          onMouseEnter={e => e.currentTarget.style.color = T.accentR}
          onMouseLeave={e => e.currentTarget.style.color = T.muted}
        >🚪 Logout</button>
      </div>
    </aside>
  );
};

// ─── DASHBOARD HEADER ─────────────────────────────────────────────────────────
export const DashHeader = ({ role, page, onNav }) => {
  const color = ROLE_COLORS[role];
  const { name } = useRoleProfile(role);

  return (
    <header style={{ position: "fixed", top: 0, left: 240, right: 0, height: 60,
      background: "rgba(6,4,15,.9)", backdropFilter: "blur(20px)",
      borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center",
      justifyContent: "space-between", padding: "0 24px", zIndex: 100 }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 800, fontFamily: "Syne" }}>{page}</div>
        <div style={{ fontSize: 11, color: T.muted }}>Home / {page}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {["🔔", "🔍"].map((icon, i) => (
          <div key={i}
            style={{ width: 36, height: 36, borderRadius: 9, background: T.bg3,
              border: `1px solid ${T.border}`, display: "flex", alignItems: "center",
              justifyContent: "center", cursor: "pointer", fontSize: 15, transition: "all .2s" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = color}
            onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
          >{icon}</div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
          onClick={() => onNav("profile")}>
          <ProfileAvatar role={role} color={color} size={34} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{name || "…"}</div>
            <div style={{ fontSize: 10, color: T.muted }}>{ROLE_NAMES[role]}</div>
          </div>
        </div>
      </div>
    </header>
  );
};

// ─── DASHBOARD LAYOUT ─────────────────────────────────────────────────────────
export const DashLayout = ({ role, page, onNav, onLogout, children }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>

      {/* Sidebar */}
      <Sidebar
        role={role}
        active={page}
        onNav={(key) => {
          onNav(key);
          if (isMobile) setOpen(false);
        }}
        onLogout={onLogout}
        isMobile={isMobile}
        open={open}
        setOpen={setOpen}
      />

      {/* Header */}
      <DashHeader
        role={role}
        page={page}
        onNav={onNav}
        isMobile={isMobile}
        setOpen={setOpen}
      />

      {/* Main */}
      <main
        style={{
          marginLeft: isMobile ? 0 : 240,
          marginTop: 60,
          padding: isMobile ? 16 : 28,
          flex: 1,
        }}
      >
        {children}
      </main>

      {/* 🤖 Dynamic Role-based AI Agent Assistant */}
      <AiAgent role={role} />
    </div>
  );
};
