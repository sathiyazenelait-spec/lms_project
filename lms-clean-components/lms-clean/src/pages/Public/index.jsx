import { useState,useEffect  } from "react";
import { T } from "../../assets/styles/theme";
import { Btn, Card, Badge, Avatar, Input } from "../../components/UI";
import { submitContactMessage, getOrganizations } from "../../api/auth";

// ─── NAVBAR ───────────────────────────────────────────────────────────────────
const NAV_LINKS = ["Home", "About", "Academics", "Achievements", "Members", "Gallery", "Contact"];

const PublicNav = ({ current, onNavigate, onGoToLogin }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          height: 66,
          background: "rgba(6,4,15,.92)",
          backdropFilter: "blur(20px)",
          borderBottom: `1px solid ${T.border}`,
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontFamily: "Syne",
            fontSize: 18,
            fontWeight: 900,
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`,
              borderRadius: 9,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
            }}
          >
            🎓
          </div>
          <span>
            Zenelait<span style={{ color: T.accent }}>InfoTech</span>
          </span>
        </div>

        {/* Desktop Menu */}
        <div
          className="desktop-menu"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 26,
          }}
        >
          {NAV_LINKS.map((l) => (
            <button
              key={l}
              onClick={() => onNavigate(l.toLowerCase())}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 500,
                color: current === l.toLowerCase() ? T.accent : T.white,
              }}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Desktop Login Button */}
        <button
          className="desktop-login"
          onClick={onGoToLogin}
          style={{
            background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`,
            border: "none",
            color: "#fff",
            padding: "10px 20px",
            borderRadius: 50,
            fontWeight: 800,
            fontSize: 13,
            cursor: "pointer",
            animation: "pulse 2s infinite",
          }}
        >
          🚀 Login
        </button>

        {/* Mobile Hamburger */}
        <div
          className="mobile-menu-icon"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            display: "none",
            fontSize: 22,
            cursor: "pointer",
            color: "#fff",
          }}
        >
          ☰
        </div>
      </nav>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div
          style={{
            position: "fixed",
            top: 66,
            left: 0,
            right: 0,
            background: "rgba(10,10,20,0.98)",
            backdropFilter: "blur(20px)",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            zIndex: 999,
          }}
        >
          {NAV_LINKS.map((l) => (
            <button
              key={l}
              onClick={() => {
                onNavigate(l.toLowerCase());
                setMenuOpen(false);
              }}
              style={{
                background: "none",
                border: "none",
                textAlign: "left",
                fontSize: 15,
                color: current === l.toLowerCase() ? T.accent : "#fff",
                cursor: "pointer",
              }}
            >
              {l}
            </button>
          ))}

          <button
            onClick={() => {
              onGoToLogin();
              setMenuOpen(false);
            }}
            style={{
              marginTop: 10,
              background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`,
              border: "none",
              color: "#fff",
              padding: "10px",
              borderRadius: 30,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            🚀 Login / Register
          </button>
        </div>
      )}

      {/* Responsive CSS */}
      <style>
        {`
          @media (max-width: 768px) {
            .desktop-menu,
            .desktop-login {
              display: none !important;
            }

            .mobile-menu-icon {
              display: block !important;
            }
          }
        `}
      </style>
    </>
  );
};



// ─── FOOTER ───────────────────────────────────────────────────────────────────
const PublicFooter = () => {
  const [isMobile, setIsMobile] =useState(window.innerWidth < 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return (
    <footer style={{ background: T.bg2, borderTop: `1px solid ${T.border}`, padding: isMobile ? "40px 24px 24px" : "50px 60px 28px", marginTop: 60 }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr 1fr" : "2fr 1fr 1fr 1fr",
        gap: isMobile ? 28 : 36,
        maxWidth: 1100,
        margin: "0 auto"
      }}>
        {/* Brand block — full width on mobile */}
        <div style={{ gridColumn: isMobile ? "1 / -1" : "auto" }}>
          <div style={{ fontFamily: "Syne", fontSize: 18, fontWeight: 900, marginBottom: 12 }}>
            Zenelait<span style={{ color: T.accent }}>InfoTech</span>
          </div>
          <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.7, maxWidth: 240 }}>
            Enterprise-grade Learning Management System for modern educational institutions.
          </p>
        </div>

        {[
          { h: "Platform", l: ["Students", "Teachers", "Parents", "Admin"] },
          { h: "Company", l: ["About Us", "Team", "Awards", "Blog"] },
          { h: "Legal", l: ["Privacy Policy", "Terms", "Cookies"] },
        ].map(col => (
          <div key={col.h}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.2, color: T.muted, marginBottom: 14 }}>
              {col.h}
            </div>
            {col.l.map(l => (
              <div key={l}
                style={{ fontSize: 13, color: T.muted, marginBottom: 8, cursor: "pointer", transition: "color .2s" }}
                onMouseEnter={e => e.target.style.color = T.accent}
                onMouseLeave={e => e.target.style.color = T.muted}
              >{l}</div>
            ))}
          </div>
        ))}
      </div>

      <div style={{ textAlign: "center", fontSize: 12, color: T.muted, borderTop: `1px solid ${T.border}`, paddingTop: 24, marginTop: 36 }}>
        © 2025 Zenelait InfoTech. All rights reserved. Powered by Zenelait LMS v2.0
      </div>
    </footer>
  );
};

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
export const Home = ({ onLogin }) => (
  <div>
    {/* HERO */}
    <section style={{ minHeight: "90vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", background: `radial-gradient(ellipse 80% 80% at 50% -10%, rgba(124,58,237,.28) 0%, transparent 70%), radial-gradient(ellipse 60% 60% at 80% 80%, rgba(6,182,212,.12) 0%, transparent 60%)` }}>
      <div style={{ textAlign: "center", maxWidth: 780, padding: "0 20px", animation: "fadeUp .8s ease" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(124,58,237,.15)", border: `1px solid rgba(124,58,237,.3)`, borderRadius: 50, padding: "6px 18px", fontSize: 12, fontWeight: 700, color: T.primaryL, marginBottom: 28 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.accent, animation: "pulse 1.5s infinite", display: "inline-block" }} />
          Enterprise Learning Management System
        </div>
        <h1 style={{fontFamily: "" , fontSize: "clamp(38px,6vw,72px)", fontWeight: 900, lineHeight: 1.08, marginBottom: 20 ,background: `linear-gradient(135deg, ${T.text}, ${T.primaryL} 50%, ${T.accent})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Transform Education<br />with Zenelait InfoTech
        </h1>
        <p style={{ fontSize: 17, color: T.muted, maxWidth: 520, margin: "0 auto 36px", lineHeight: 1.7 }}>
          A comprehensive AI-powered platform for students, teachers, parents & administrators.
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <Btn variant="primary" size="xl" onClick={onLogin}>Get Started →</Btn>
          <Btn variant="ghost" size="xl">Watch Demo ▶</Btn>
        </div>
        <div style={{ display: "flex", gap: 48, justifyContent: "center", marginTop: 60, flexWrap: "wrap" }}>
          {[["12K+", "Active Students"], ["450+", "Courses"], ["98%", "Satisfaction"], ["85+", "Expert Teachers"]].map(([n, l]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "Syne", fontSize: 36, fontWeight: 900, background: `linear-gradient(135deg, ${T.accent}, ${T.primaryL})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{n}</div>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* FEATURES */}
    <section style={{ padding: "80px 60px", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 52 }}>
        <Badge type="primary">Platform Features</Badge>
        <h2 style={{ fontFamily: "Syne", fontSize: 38, fontWeight: 800, margin: "12px 0" }}>Everything You Need to Succeed</h2>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: 22 }}>
        {[
          { icon: "📚", title: "Smart Course Management", desc: "Upload lectures, notes, assignments and videos with real-time progress tracking.", color: T.primaryL },
          { icon: "📊", title: "Real-Time Analytics", desc: "Comprehensive dashboards for all user roles with downloadable PDF reports.", color: T.accent },
          { icon: "🎯", title: "Exam & Assessment", desc: "Schedule exams, grade assignments, and auto-generate performance reports.", color: T.accentR },
          { icon: "💬", title: "Direct Communication", desc: "Students, teachers and parents communicate through integrated messaging.", color: T.accentY },
          { icon: "🎥", title: "Live Classes", desc: "Schedule and conduct live sessions via Zoom/Meet with attendance tracking.", color: T.accent },
          { icon: "🏆", title: "Certifications", desc: "Issue, manage and track digital certificates for course completions.", color: T.accentG },
        ].map(f => (
          <Card key={f.title} style={{ padding: 26 }}>
            <div style={{ width: 52, height: 52, borderRadius: 13, background: `${f.color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, marginBottom: 16 }}>{f.icon}</div>
            <h3 style={{ fontSize: 16, fontWeight: 800, fontFamily: "Syne", marginBottom: 8 }}>{f.title}</h3>
            <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.6 }}>{f.desc}</p>
          </Card>
        ))}
      </div>
    </section>

    {/* STATS BANNER */}
    <div style={{ margin: "0 60px 80px", background: `linear-gradient(135deg, ${T.primaryD}, ${T.bg2})`, borderRadius: 22, padding: "56px 66px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 32, textAlign: "center" }}>
        {[["12,000+", "Students Enrolled"], ["450+", "Courses Available"], ["85+", "Expert Instructors"], ["98%", "Satisfaction Rate"], ["5,000+", "Certifications Issued"]].map(([n, l]) => (
          <div key={l}>
            <div style={{width: "250px",fontFamily: "Syne", fontSize: 42, fontWeight: 900, background: "linear-gradient(135deg,#fff,#06B6D4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{n}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.65)", marginTop: 4 }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─── ABOUT PAGE ───────────────────────────────────────────────────────────────
export const About = () => (
  <div style={{ padding: "60px 60px 80px", maxWidth: 1200, margin: "0 auto" }}>
    <div style={{ textAlign: "center", marginBottom: 52 }}>
      <Badge type="primary">About Us</Badge>
      <h2 style={{ fontFamily: "Syne", fontSize: 40, fontWeight: 800, margin: "12px 0" }}>About Zenelait InfoTech</h2>
      <p style={{ fontSize: 15, color: T.muted }}>Pioneering digital education since 2018</p>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
      <Card style={{ padding: 32 }}>
        <h3 style={{ fontFamily: "Syne", fontSize: 22, fontWeight: 800, marginBottom: 16 }}>🎯 Our Mission</h3>
        <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.8 }}>Zenelait InfoTech Academy is dedicated to delivering world-class education through technology. We believe every student deserves access to quality learning.</p>
        {["Accredited online programs", "Industry-aligned curriculum", "Placement assistance program", "24/7 learning support"].map(i => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 12 }}>
            <span style={{ width: 22, height: 22, borderRadius: 5, background: `${T.accentG}18`, display: "flex", alignItems: "center", justifyContent: "center", color: T.accentG, fontSize: 12, flexShrink: 0 }}>✓</span>
            <span style={{ fontSize: 13 }}>{i}</span>
          </div>
        ))}
      </Card>
      <Card style={{ padding: 32 }}>
        <h3 style={{ fontFamily: "Syne", fontSize: 22, fontWeight: 800, marginBottom: 16 }}>🌟 Our Vision</h3>
        <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.8 }}>To become India's most trusted EdTech platform, connecting learners and educators through cutting-edge technology and compassionate education.</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 22 }}>
          {[["2018", "Founded"], ["15+", "Departments"], ["200+", "Staff Members"], ["50+", "Awards Won"]].map(([v, l]) => (
            <div key={l} style={{ background: T.bg3, borderRadius: 10, padding: 14, textAlign: "center" }}>
              <div style={{ fontFamily: "Syne", fontSize: 26, fontWeight: 900, color: T.accent }}>{v}</div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  </div>
);

// ─── ACADEMICS PAGE ───────────────────────────────────────────────────────────
export const Academics = () => (
  <div style={{ padding: "60px 60px 80px", maxWidth: 1200, margin: "0 auto" }}>
    <div style={{ textAlign: "center", marginBottom: 52 }}>
      <Badge type="primary">Academics</Badge>
      <h2 style={{ fontFamily: "Syne", fontSize: 38, fontWeight: 800, margin: "12px 0" }}>Our Course Programs</h2>
      <p style={{ fontSize: 15, color: T.muted }}>Explore 450+ courses across 15+ departments</p>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 22 }}>
      {[
        { icon: "💻", title: "Full Stack Web Development", hrs: 120, enrolled: 1240, price: "₹12,000", badge: "info" },
        { icon: "📊", title: "Data Science & Machine Learning", hrs: 160, enrolled: 980, price: "₹15,000", badge: "success" },
        { icon: "📱", title: "Mobile App Development", hrs: 100, enrolled: 760, price: "₹10,000", badge: "primary" },
        { icon: "🔐", title: "Cyber Security Fundamentals", hrs: 90, enrolled: 620, price: "₹11,000", badge: "danger" },
        { icon: "🎨", title: "UI/UX Design Masterclass", hrs: 80, enrolled: 540, price: "₹8,000", badge: "warning" },
        { icon: "☁️", title: "Cloud Computing & DevOps", hrs: 140, enrolled: 890, price: "₹13,000", badge: "info" },
      ].map(c => (
        <Card key={c.title} style={{ overflow: "hidden", padding: 0 }}>
          <div style={{ height: 120, background: `linear-gradient(135deg, ${T.bg3}, ${T.card2})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 52 }}>{c.icon}</div>
          <div style={{ padding: 18 }}>
            <h4 style={{ fontWeight: 800, fontSize: 15, fontFamily: "Syne", marginBottom: 8 }}>{c.title}</h4>
            <div style={{ display: "flex", gap: 14, fontSize: 12, color: T.muted, marginBottom: 12 }}>
              <span>⏱ {c.hrs} hrs</span><span>👥 {c.enrolled.toLocaleString()} enrolled</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Badge type={c.badge}>Enroll Now</Badge>
              <span style={{ fontWeight: 800, color: T.accent, fontSize: 15 }}>{c.price}</span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  </div>
);

// ─── ACHIEVEMENTS PAGE ────────────────────────────────────────────────────────
export const Achievements = () => (
  <div style={{ padding: "60px 60px 80px", maxWidth: 1200, margin: "0 auto" }}>
    <div style={{ textAlign: "center", marginBottom: 52 }}>
      <Badge type="warning">Achievements</Badge>
      <h2 style={{ fontFamily: "Syne", fontSize: 38, fontWeight: 800, margin: "12px 0" }}>Our Pride & Glory</h2>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 22 }}>
      {[
        { icon: "🏆", title: "Best EdTech Platform 2024", sub: "National Education Technology Awards" },
        { icon: "🥇", title: "Top 10 EdTech Companies", sub: "India EdTech Summit 2023" },
        { icon: "⭐", title: "Excellence in Innovation", sub: "Tamil Nadu IT Excellence Award" },
        { icon: "🎖️", title: "ISO 9001:2015 Certified", sub: "Quality Management System" },
        { icon: "🌟", title: "5000+ Certifications", sub: "Industry-recognized certificates issued" },
        { icon: "💡", title: "Best Learning Innovation", sub: "NASSCOM EdTech Excellence 2024" },
      ].map(a => (
        <Card key={a.title} style={{ textAlign: "center", padding: 32 }}>
          <div style={{ fontSize: 52, marginBottom: 14 }}>{a.icon}</div>
          <h3 style={{ fontSize: 17, fontWeight: 800, fontFamily: "Syne", marginBottom: 6 }}>{a.title}</h3>
          <p style={{ fontSize: 13, color: T.muted }}>{a.sub}</p>
        </Card>
      ))}
    </div>
  </div>
);

// ─── MEMBERS PAGE ─────────────────────────────────────────────────────────────
export const Members = () => (
  <div style={{ padding: "60px 60px 80px", maxWidth: 1200, margin: "0 auto" }}>
    <div style={{ textAlign: "center", marginBottom: 52 }}>
      <Badge type="info">Our Team</Badge>
      <h2 style={{ fontFamily: "Syne", fontSize: 38, fontWeight: 800, margin: "12px 0" }}>Academy Members</h2>
    </div>
    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: T.accent }}>Leadership</h3>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 20, marginBottom: 36 }}>
      {[
        { n: "Zenelait Head", r: "Administrator Head", d: "HQ" },
        { n: "Dr. Vijay Kumar", r: "Academic Director", d: "Administration" },
        { n: "Mrs. Meena Raj", r: "Dean of Students", d: "Student Affairs" },
        { n: "Mr. Suresh Nair", r: "Technical Director", d: "IT & Systems" },
      ].map(m => (
        <Card key={m.n} style={{ textAlign: "center", padding: 24 }}>
          <Avatar name={m.n} size={72} color={T.primary} />
          <div style={{ fontWeight: 800, fontSize: 15, fontFamily: "Syne", marginTop: 14 }}>{m.n}</div>
          <div style={{ fontSize: 12, color: T.accent, fontWeight: 700, marginTop: 4 }}>{m.r}</div>
          <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{m.d}</div>
        </Card>
      ))}
    </div>
    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: T.primaryL }}>Faculty</h3>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 20 }}>
      {[
        { n: "Prof. Priya Sharma", r: "Senior Lecturer", d: "Computer Science" },
        { n: "Dr. Anand Raj", r: "Associate Professor", d: "Data Science" },
        { n: "Ms. Kavitha Nair", r: "Lecturer", d: "UI/UX Design" },
        { n: "Mr. Ravi Shankar", r: "Senior Lecturer", d: "Cyber Security" },
        { n: "Dr. Deepa Menon", r: "Professor", d: "Cloud Computing" },
        { n: "Mr. Naveen Kumar", r: "Lecturer", d: "Mobile Dev" },
      ].map(m => (
        <Card key={m.n} style={{ textAlign: "center", padding: 22 }}>
          <Avatar name={m.n} size={60} color={T.accentG} />
          <div style={{ fontWeight: 800, fontSize: 14, fontFamily: "Syne", marginTop: 12 }}>{m.n}</div>
          <div style={{ fontSize: 12, color: T.primaryL, fontWeight: 700, marginTop: 3 }}>{m.r}</div>
          <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{m.d}</div>
        </Card>
      ))}
    </div>
  </div>
);

// ─── GALLERY PAGE ─────────────────────────────────────────────────────────────
export const Gallery = () => (
  <div style={{ padding: "60px 60px 80px", maxWidth: 1200, margin: "0 auto" }}>
    <div style={{ textAlign: "center", marginBottom: 52 }}>
      <Badge type="success">Gallery</Badge>
      <h2 style={{ fontFamily: "Syne", fontSize: 38, fontWeight: 800, margin: "12px 0" }}>Life at Zenelait InfoTech</h2>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
      {["🎓", "💻", "🏆", "🎉", "📚", "🤝", "🎯", "🚀", "✨", "🌟", "🎨", "📱"].map((emoji, i) => (
        <div key={i}
          style={{ aspectRatio: "4/3", background: `linear-gradient(135deg, ${T.card}, ${T.card2})`, borderRadius: 14, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 52, cursor: "pointer", transition: "all .3s" }}
          onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.04)"; e.currentTarget.style.borderColor = T.primary; }}
          onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.borderColor = T.border; }}
        >{emoji}</div>
      ))}
    </div>
  </div>
);

// ─── CONTACT PAGE ─────────────────────────────────────────────────────────────
// Contact form data is stored in DB and shown in Admin → Contact Queries page
export const Contact = () => {
  const [orgs, setOrgs] = useState([]);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    organizationId: "",
  });

  useEffect(() => {
    getOrganizations()
      .then((data) => {
        // filter or list all active organizations
        setOrgs(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error("Failed to load organizations:", err));
  }, []);

  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.organizationId) e.organizationId = "Organization is required";
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!form.email.includes("@")) e.email = "Enter a valid email address";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    else if (form.phone.replace(/\D/g, "").length < 10)
      e.phone = "Enter a valid phone number";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSend = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      await submitContactMessage(form);
      setSent(true);
    } catch (err) {
      alert("Failed to send message: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field) => ({
    width: "100%",
    background: T.bg3,
    border: `1.5px solid ${errors[field] ? "#ef4444" : T.border}`,
    borderRadius: 9,
    padding: "10px 14px",
    fontSize: 13,
    color: T.text,
    outline: "none",
    fontFamily: "DM Sans",
    boxSizing: "border-box",
  });

  const errTxt = (field) =>
    errors[field] ? (
      <div style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>
        ⚠ {errors[field]}
      </div>
    ) : null;

  return (
    <div className="contact-container">
      {/* Header */}
      <div className="contact-header">
        <Badge type="info">Contact</Badge>
        <h2>Get In Touch</h2>
        <p>
          We're here to help. Messages are stored and reviewed by our admin team.
        </p>
      </div>

      {/* Content */}
      <div className="contact-grid">
        {/* Left Info */}
        <div>
          {[
            {
              icon: "📍",
              label: "Address",
              val: "Zenelait InfoTech, Anna Salai, Chennai, Tamil Nadu - 600002",
            },
            { icon: "📞", label: "Phone", val: "+91 98765 43210" },
            { icon: "✉️", label: "Email", val: "info@zenelaitinfotech.com" },
            {
              icon: "🕐",
              label: "Office Hours",
              val: "Mon–Sat: 9:00 AM – 6:00 PM",
            },
          ].map((c) => (
            <div key={c.label} className="contact-info-item">
              <div className="contact-icon">{c.icon}</div>
              <div>
                <div className="contact-label">{c.label}</div>
                <div className="contact-value">{c.val}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Form */}
        <Card className="contact-card">
          <h3>Send a Message</h3>

          {!sent ? (
            <>
              <div className="field">
                <label>Organization *</label>
                <select
                  value={form.organizationId}
                  onChange={f("organizationId")}
                  style={inputStyle("organizationId")}
                >
                  <option value="" style={{ background: T.bg3, color: T.text }}>-- Select Organization --</option>
                  {orgs.map((org) => (
                    <option key={org.id} value={org.id} style={{ background: T.bg3, color: T.text }}>
                      {org.name}
                    </option>
                  ))}
                </select>
                {errTxt("organizationId")}
              </div>

              <div className="field">
                <label>Your Name *</label>
                <input
                  value={form.name}
                  onChange={f("name")}
                  placeholder="Enter your full name"
                  style={inputStyle("name")}
                />
                {errTxt("name")}
              </div>

              <div className="field">
                <label>Email Address *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={f("email")}
                  placeholder="your@email.com"
                  style={inputStyle("email")}
                />
                {errTxt("email")}
              </div>

              <div className="field">
                <label>Phone Number *</label>
                <input
                  value={form.phone}
                  onChange={f("phone")}
                  placeholder="+91 98765 43210"
                  style={inputStyle("phone")}
                />
                {errTxt("phone")}
              </div>

              <div className="field">
                <label>Subject</label>
                <input
                  value={form.subject}
                  onChange={f("subject")}
                  placeholder="What is this regarding?"
                  style={inputStyle("subject")}
                />
              </div>

              <div className="field">
                <label>Message</label>
                <textarea
                  rows={4}
                  value={form.message}
                  onChange={f("message")}
                  placeholder="Write your message here..."
                  style={{ ...inputStyle("message"), resize: "vertical" }}
                />
              </div>

              <Btn full onClick={handleSend} disabled={loading}>
                {loading ? "Sending..." : "Send Message →"}
              </Btn>
            </>
          ) : (
            <div className="success-box">
              <div className="success-icon">✅</div>
              <h3>Message Sent!</h3>
              <p>
                Your query has been stored. Our admin team will respond within 24
                hours.
              </p>
              <Btn
                onClick={() => {
                  setSent(false);
                  setForm({
                    name: "",
                    email: "",
                    phone: "",
                    subject: "",
                    message: "",
                  });
                }}
              >
                Send Another
              </Btn>
            </div>
          )}
        </Card>
      </div>

      {/* Responsive CSS */}
      <style>{`
        .contact-container {
          padding: 60px;
          max-width: 1100px;
          margin: auto;
        }

        .contact-header {
          text-align: center;
          margin-bottom: 50px;
        }

        .contact-header h2 {
          font-size: 38px;
          font-family: Syne;
          font-weight: 800;
          margin: 12px 0;
        }

        .contact-header p {
          font-size: 15px;
          color: ${T.muted};
        }

        .contact-grid {
          display: grid;
          grid-template-columns: 1fr 1.4fr;
          gap: 36px;
        }

        .contact-info-item {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
        }

        .contact-icon {
          width: 44px;
          height: 44px;
          background: ${T.primary}18;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .contact-label {
          font-weight: 700;
          font-size: 14px;
        }

        .contact-value {
          font-size: 13px;
          color: ${T.muted};
        }

        .contact-card {
          padding: 28px;
        }

        .field {
          margin-bottom: 14px;
        }

        .field label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          display: block;
          margin-bottom: 6px;
          color: ${T.muted};
        }

        .success-box {
          text-align: center;
          padding: 30px 0;
        }

        /* 📱 Mobile */
        @media (max-width: 768px) {
          .contact-container {
            padding: 30px 16px;
          }

          .contact-grid {
            grid-template-columns: 1fr;
          }

          .contact-header h2 {
            font-size: 28px;
          }

          .contact-card {
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
};

// ─── PUBLIC WEBSITE WRAPPER ───────────────────────────────────────────────────
// Combines: Navbar + page content + Footer
const PAGE_COMPONENTS = { home: Home, about: About, academics: Academics, achievements: Achievements, members: Members, gallery: Gallery, contact: Contact };

const PublicWebsite = ({ onGoToLogin }) => {
  const [pubPage, setPubPage] = useState("home");
  const PageComp = PAGE_COMPONENTS[pubPage] || Home;
  return (
    <div>
      <PublicNav current={pubPage} onNavigate={setPubPage} onGoToLogin={onGoToLogin} />
      <div style={{ paddingTop: 66 }}>
        <PageComp onLogin={onGoToLogin} />
      </div>
      <PublicFooter />
    </div>
  );
};

export default PublicWebsite;
