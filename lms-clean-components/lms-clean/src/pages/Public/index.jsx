import { useState, useEffect } from "react";
import { T } from "../../assets/styles/theme";
import { Btn, Badge, Avatar } from "../../components/UI";
import { submitContactMessage, getOrganizations } from "../../api/auth";

// ─── TILT CARD COMPONENT FOR 360 MOVABLE MOUSE HOVER ───────────────────────────
const TiltCard = ({ children, className, style = {}, ...props }) => {
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const box = card.getBoundingClientRect();
    const x = e.clientX - box.left - box.width / 2;
    const y = e.clientY - box.top - box.height / 2;
    // Map position to tilt rotation degrees (max 15 degrees tilt)
    const rotateX = -(y / (box.height / 2)) * 15;
    const rotateY = (x / (box.width / 2)) * 15;
    setCoords({ x: rotateX, y: rotateY });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setCoords({ x: 0, y: 0 });
  };

  const tiltStyle = isHovered
    ? {
      transform: `perspective(1000px) rotateX(${coords.x.toFixed(2)}deg) rotateY(${coords.y.toFixed(2)}deg) translateY(-8px) translateZ(10px)`,
      borderColor: T.accent + "80",
      boxShadow: `0 24px 50px rgba(6, 182, 212, 0.25)`,
      transition: "transform 0.05s ease, border-color 0.4s ease, box-shadow 0.4s ease",
    }
    : {
      transform: "perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0) translateZ(0)",
      transition: "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.5s, box-shadow 0.5s",
    };

  return (
    <div
      className={className}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: 14,
        padding: 20,
        transformStyle: "preserve-3d",
        ...style,
        ...tiltStyle,
      }}
      {...props}
    >
      <div style={{ transform: "translateZ(20px)", transformStyle: "preserve-3d" }}>
        {children}
      </div>
    </div>
  );
};

// ─── SVG ICONS ────────────────────────────────────────────────────────────────
const Icons = {
  course: (color) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  analytics: (color) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  assessment: (color) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  chat: (color) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  video: (color) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  ),
  cert: (color) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  code: (color) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  database: (color) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
    </svg>
  ),
  mobile: (color) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  ),
  shield: (color) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  palette: (color) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 14.7255 3.09032 17.1962 4.85857 19C5.02102 19.1624 5.09337 19.3926 5.04838 19.6171C4.93188 20.1983 4.87 20.7963 4.87 21.4C4.87 21.7314 5.13863 22 5.47 22H12Z" />
    </svg>
  ),
  cloud: (color) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
    </svg>
  ),
  trophy: (color) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
      <path d="M12 2a7 7 0 0 0-7 7v5a7 7 0 0 0 14 0V9a7 7 0 0 0-7-7z" />
    </svg>
  ),
  medal: (color) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="7" />
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </svg>
  ),
  lightbulb: (color) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M15.09 14c.18-.19.37-.4.53-.62a6 6 0 0 0-7.24-9.3 6 6 0 0 0-2.3 8.3c.42.58.82 1.17 1.22 1.76v.86c0 .55.45 1 1 1h5.8a1 1 0 0 0 1-.98v-.88c0-.04 0-.08.01-.12z" />
    </svg>
  ),
  star: (color) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  rocket: (color) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.25-2.5 3.5-2.5 3.5s2.25-1 3.5-2.5" />
      <path d="M12 2C6.5 2 2 6.5 2 12c0 2 .5 3.5 1.5 4.5L8 12.5" />
      <path d="M22 2s-4.5.5-7.5 3.5L11.5 8l3.5 3.5 2.5-3C20.5 5.5 22 2 22 2z" />
      <path d="M9 15l-1.5-.5c-3-1-5-3.5-5-3.5s2.5 1 5.5 2l1 2z" />
    </svg>
  ),
  briefcase: (color) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
  target: (color) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  )
};

// ─── NAVBAR ───────────────────────────────────────────────────────────────────
const NAV_LINKS =
  [
    //"Home",
    // "About", "Academics", "Achievements", "Members", "Gallery",
    // "Contact"
  ];

const PublicNav = ({ current, onNavigate, onGoToLogin }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("zenelait-theme") || "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("zenelait-theme", theme);
    window.dispatchEvent(new CustomEvent("zenelait-theme-changed", { detail: theme }));
  }, [theme]);

  useEffect(() => {
    const handleThemeChange = (e) => {
      setTheme(e.detail);
    };
    window.addEventListener("zenelait-theme-changed", handleThemeChange);
    return () => window.removeEventListener("zenelait-theme-changed", handleThemeChange);
  }, []);

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
          padding: "0 24px",
          height: 70,
          background: T.headerBg,
          backdropFilter: "blur(24px)",
          borderBottom: `1px solid ${T.border}`,
          boxShadow: "0 4px 30px rgba(0,0,0,0.4)"
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginLeft: 150,
            fontFamily: "Syne",
            fontSize: 20,
            fontWeight: 900,
            cursor: "pointer"
          }}
          onClick={() => onNavigate("home")}
        >
          <img src="zenlogo.png" alt="image" height={60} width={80} />
        </div>

        {/* Desktop Menu */}
        <div
          className="desktop-menu"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 28,
          }}
        >
          {NAV_LINKS.map((l) => {
            const isActive = current === l.toLowerCase();
            return (
              <button
                key={l}
                onClick={() => onNavigate(l.toLowerCase())}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  color: isActive ? T.accent : T.text,
                  position: "relative",
                  padding: "6px 2px",
                  transition: "color 0.3s ease",
                  textTransform: "uppercase",
                  letterSpacing: "0.8px"
                }}
              >
                {l}
                {isActive && (
                  <span style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: `linear-gradient(90deg, ${T.primary}, ${T.accent})`,
                    borderRadius: 2
                  }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Actions Container */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* Theme Toggle Button */}
          <div
            onClick={() => setTheme(prev => prev === "bright" ? "dark" : "bright")}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: T.bg3,
              border: `1px solid ${T.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: 15,
              transition: "all 0.3s ease",
              color: T.text
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = T.accent}
            onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
            title={theme === "bright" ? "Switch to Dark Theme" : "Switch to Bright Theme"}
          >
            {theme === "bright" ? "☀️" : "🌙"}
          </div>

          {/* Desktop Login Button */}
          <button
            className="desktop-login"
            onClick={onGoToLogin}
            style={{
              background: `linear-gradient(135deg, ${T.primary}, ${T.primaryL})`,
              border: "none",
              color: "#fff",
              padding: "10px 24px",
              borderRadius: 50,
              fontWeight: 800,
              fontSize: 13,
              cursor: "pointer",
              boxShadow: `0 4px 14px ${T.primary}40`,
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = `0 6px 20px ${T.primary}60`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = `0 4px 14px ${T.primary}40`;
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
              fontSize: 24,
              cursor: "pointer",
              color: T.text,
            }}
          >
            ☰
          </div>
        </div>
      </nav>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div
          style={{
            position: "fixed",
            top: 70,
            left: 0,
            right: 0,
            background: T.dropdownBg,
            backdropFilter: "blur(24px)",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: 18,
            zIndex: 999,
            borderBottom: `1px solid ${T.border}`
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
                fontSize: 16,
                fontWeight: 600,
                color: current === l.toLowerCase() ? T.accent : T.text,
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
              marginTop: 12,
              background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`,
              border: "none",
              color: "#fff",
              padding: "12px",
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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return (
    <footer style={{ background: T.bg2, borderTop: `1px solid ${T.border}`, padding: isMobile ? "48px 24px 24px" : "60px 60px 32px", marginTop: 80, position: "relative", zIndex: 5 }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr 1fr" : "2fr 1fr 1fr 1fr",
        gap: isMobile ? 32 : 40,
        maxWidth: 1200,
        margin: "0 auto"
      }}>
        {/* Brand block — full width on mobile */}
        <div style={{ gridColumn: isMobile ? "1 / -1" : "auto" }}>
          <div style={{ fontFamily: "Syne", fontSize: 20, fontWeight: 900, marginBottom: 16 }}>
            <img src="logo.png" alt="image" height={60} width={130} style={{ borderRadius: 10 }} />
          </div>
          <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.8, maxWidth: 280 }}>
            Enterprise-grade Learning Management System powering interactive education globally.
          </p>
        </div>

        {[
          { h: "Platform", l: ["Students", "Teachers", "Parents", "Admin"] },
          { h: "Company", l: ["About Us", "Team", "Awards", "Blog"] },
          { h: "Legal", l: ["Privacy Policy", "Terms", "Cookies"] },
        ].map(col => (
          <div key={col.h}>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.5, color: T.muted, marginBottom: 18 }}>
              {col.h}
            </div>
            {col.l.map(l => (
              <div key={l}
                style={{ fontSize: 13, color: T.muted, marginBottom: 10, cursor: "pointer", transition: "color .2s" }}
                onMouseEnter={e => e.target.style.color = T.accent}
                onMouseLeave={e => e.target.style.color = T.muted}
              >{l}</div>
            ))}
          </div>
        ))}
      </div>

      <div style={{ textAlign: "center", fontSize: 12, color: T.muted, borderTop: `1px solid ${T.border}`, paddingTop: 28, marginTop: 44 }}>
        © 2026 Zenelait InfoTech. All rights reserved. Powered by Zenelait LMS v2.1
      </div>
    </footer>
  );
};

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
export const Home = ({ onLogin }) => (
  <div className="animated-fade-in" style={{ position: "relative" }}>
    {/* HERO */}
    <section style={{ minHeight: "92vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", background: `radial-gradient(ellipse 80% 80% at 50% -10%, rgba(124,58,237,.22) 0%, transparent 75%), radial-gradient(ellipse 60% 60% at 85% 85%, rgba(6,182,212,.1) 0%, transparent 60%)` }}>
      {/* Dynamic Animated background nodes */}
      <div className="lms-glow-orb purple" style={{ top: "15%", left: "8%" }} />
      <div className="lms-glow-orb cyan" style={{ bottom: "20%", right: "10%" }} />

      <div style={{ textAlign: "center", maxWidth: 900, padding: "0 24px", position: "relative", zIndex: 2 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(124,58,237,.12)", border: `1px solid rgba(124,58,237,.25)`, borderRadius: 50, padding: "8px 20px", fontSize: 12, fontWeight: 700, color: T.primaryL, marginBottom: 32, animation: "bounce 2s infinite" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: T.accent, animation: "pulseDot 1.5s infinite", display: "inline-block" }} />
          Enterprise Learning Management System
        </div>

        <h1 className="lms-text-animated-gradient" style={{ fontSize: "clamp(38px,6.5vw,74px)", fontWeight: 900, lineHeight: 1.1, marginBottom: 28, letterSpacing: "-1.5px" }}>
          Transform Education with<br /> ZenelaitInfoTech
        </h1>

        <p style={{ fontSize: 18, color: T.muted, maxWidth: 580, margin: "0 auto 40px", lineHeight: 1.75, textAlign: "center" }}>
          An all-in-one AI-integrated learning network supporting smart workflows for students, teachers, parents, and administrative staff.
        </p>

        <div style={{ display: "flex", gap: 18, justifyContent: "center", flexWrap: "wrap" }}>
          <Btn variant="primary" size="xl" onClick={onLogin} style={{ transform: "scale(1)", transition: "transform .2s" }} onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>Get Started →</Btn>
          <Btn variant="ghost" size="xl" style={{ transform: "scale(1)", transition: "transform .2s" }} onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>Watch Demo ▶</Btn>
        </div>

        <div style={{ display: "flex", gap: 48, justifyContent: "center", marginTop: 70, flexWrap: "wrap" }}>
          {[["12K+", "Active Students"], ["450+", "Courses"], ["98%", "Satisfaction"], ["85+", "Expert Teachers"]].map(([n, l]) => (
            <div key={l} style={{ textAlign: "center" }} className="lms-float">
              <div style={{ fontFamily: "Syne", fontSize: 38, fontWeight: 900, background: `linear-gradient(135deg, ${T.accent}, ${T.primaryL})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{n}</div>
              <div style={{ fontSize: 13, color: T.muted, marginTop: 4, fontWeight: 500 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
    <About />
    <Achievements />

    {/* FEATURES */}
    <section style={{ padding: "100px 24px", maxWidth: 1200, margin: "0 auto", position: "relative" }}>
      <div style={{ textAlign: "center", marginBottom: 60 }}>
        <Badge type="primary">Platform Features</Badge>
        <h2 style={{ fontFamily: "Syne", fontSize: 40, fontWeight: 800, margin: "14px 0", letterSpacing: "-0.5px" }}>Everything You Need to Succeed</h2>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
        {[
          { icon: Icons.course, title: "LMS Software", desc: "Seamlessly organize lectures, assets, files, exams, and record logs with auto-save support.", color: T.primaryL },
          { icon: Icons.analytics, title: "Billing Softwares", desc: "Create invoices, track payments, and manage your billing process effortlessly.", color: T.accent },
          { icon: Icons.assessment, title: "ERP Softwares", desc: "Streamline administrative tasks and enhance school management efficiency.", color: T.accentR },
          { icon: Icons.chat, title: "CRM Applications", desc: "Foster engagement through interactive discussions,forums, messages", color: T.accentY },
          { icon: Icons.video, title: "Riding Customized Applications", desc: "Built to deliver scalable performance and flexible configuration for any business model.", color: T.accent },
          { icon: Icons.cert, title: "Ecommerce Platform", desc: "Empower businesses to showcase products, manage inventory, and drive sales with ease.", color: T.accentG },
        ].map((f, idx) => (
          <TiltCard key={idx} className="interactive-card" style={{ padding: 30, background: T.bg2 }}>
            <div className="feature-icon-box" style={{ width: 54, height: 54, borderRadius: 14, background: `${f.color}16`, display: "flex", alignItems: "center", justifyContent: "center", color: f.color, marginBottom: 20 }}>
              {f.icon(f.color)}
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, fontFamily: "Syne", marginBottom: 10 }}>{f.title}</h3>
            <p style={{ fontSize: 13.5, color: T.muted, lineHeight: 1.7 }}>{f.desc}</p>
          </TiltCard>
        ))}
      </div>
    </section>
    <Gallery />

    {/* STATS BANNER */}
    <div style={{ margin: "0 24px 100px" }} className="stats-banner-wrap">
      <div className="stats-banner" style={{ padding: "64px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 36, textAlign: "center", position: "relative", zIndex: 2 }}>
          {[["12,000+", "Students Enrolled"], ["450+", "Courses Available"], ["85+", "Expert Instructors"], ["98%", "Satisfaction Rate"], ["5,000+", "Certifications Issued"]].map(([n, l], idx) => (
            <div key={idx} className="lms-float" style={{ animationDelay: `${idx * 0.2}s` }}>
              <div style={{ fontFamily: "sans-serif", fontSize: 26, fontWeight: 900, background: "linear-gradient(135deg,#fff,#06B6D4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{n}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.7)", marginTop: 6, fontWeight: 500 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// ─── GET IN TOUCH (ULTRA SUPER ADMIN DIRECT QUERY) ───────────────────────────
export const GetInTouch = () => {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "Get In Touch Inquiry",
    message: "",
  });

  const handleChange = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const validate = () => {
    const e = {};
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
      const payload = {
        ...form,
        isForUltraSuperAdmin: true
      };
      const response = await submitContactMessage(payload);
      setSent(true);

      const phoneNum = response.ultraSuperAdminPhone || "919876543210";
      const formattedPhone = phoneNum.replace(/[^\d]/g, "");
      const whatsappText = `Hello, I'm reaching out from Zenelait InfoTech.\n\n*Name:* ${form.name}\n*Email:* ${form.email}\n*Phone:* ${form.phone}\n*Subject:* ${form.subject}\n*Message:* ${form.message}`;
      const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(whatsappText)}`;

      window.open(whatsappUrl, "_blank");
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
    borderRadius: 10,
    padding: "12px 16px",
    fontSize: 13.5,
    color: T.text,
    outline: "none",
    fontFamily: "DM Sans",
    boxSizing: "border-box",
    transition: "border-color 0.3s ease"
  });

  const errTxt = (field) =>
    errors[field] ? (
      <div style={{ fontSize: 11, color: "#ef4444", marginTop: 6, fontWeight: 600 }}>
        ⚠ {errors[field]}
      </div>
    ) : null;

  return (
    <section style={{ padding: "80px 24px 100px", maxWidth: 900, margin: "0 auto", position: "relative" }}>
      <div style={{ textAlign: "center", marginBottom: 50 }}>
        <Badge type="info">Get In Touch</Badge>
        <h2 style={{ fontFamily: "Syne", fontSize: 36, fontWeight: 800, margin: "14px 0", letterSpacing: "-0.5px" }}>Direct line to Ultra Super Admin</h2>
        <p style={{ fontSize: 15, color: T.muted }}>
          Have a question or request? Submit below to reach the Platform Ultra Super Admin directly.
        </p>
      </div>

      <TiltCard style={{ padding: 36, background: T.bg2, maxWidth: 650, margin: "0 auto" }}>
        {!sent ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 6, color: T.muted, letterSpacing: "0.8px" }}>Your Name *</label>
                <input value={form.name} onChange={handleChange("name")} placeholder="Full Name" style={inputStyle("name")} />
                {errTxt("name")}
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 6, color: T.muted, letterSpacing: "0.8px" }}>Email Address *</label>
                <input type="email" value={form.email} onChange={handleChange("email")} placeholder="your@email.com" style={inputStyle("email")} />
                {errTxt("email")}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 6, color: T.muted, letterSpacing: "0.8px" }}>Phone Number *</label>
                <input value={form.phone} onChange={handleChange("phone")} placeholder="+91 98765 43210" style={inputStyle("phone")} />
                {errTxt("phone")}
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 6, color: T.muted, letterSpacing: "0.8px" }}>Subject</label>
                <input value={form.subject} onChange={handleChange("subject")} placeholder="Regarding..." style={inputStyle("subject")} />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 6, color: T.muted, letterSpacing: "0.8px" }}>Message</label>
              <textarea rows={4} value={form.message} onChange={handleChange("message")} placeholder="Write your message here..." style={{ ...inputStyle("message"), resize: "vertical" }} />
            </div>

            <Btn full onClick={handleSend} disabled={loading}>
              {loading ? "Sending..." : "Submit Inquiry & Open WhatsApp →"}
            </Btn>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 44, color: T.accentG, marginBottom: 16 }}>✓</div>
            <h3 style={{ fontFamily: "Syne", fontWeight: 800, color: "#fff", marginBottom: 8 }}>Inquiry Processed!</h3>
            <p style={{ color: T.muted, fontSize: 14, marginBottom: 20 }}>
              Your inquiry has been stored. You should have also been redirected to WhatsApp to chat directly.
            </p>
            <Btn onClick={() => {
              setForm({ name: "", email: "", phone: "", subject: "Get In Touch Inquiry", message: "" });
              setSent(false);
            }}>
              Send Another
            </Btn>
          </div>
        )}
      </TiltCard>
    </section>
  );
};

// ─── ABOUT PAGE ───────────────────────────────────────────────────────────────
export const About = () => (
  <div className="about-page animated-fade-in" style={{ position: "relative" }}>
    <div className="lms-glow-orb purple" style={{ top: "10%", right: "5%" }} />
    <div style={{ textAlign: "center", marginBottom: 56 }}>
      <Badge type="primary">About Us</Badge>
      <h2 className="about-heading">About Zenelait InfoTech</h2>
      <p style={{ fontSize: 15, color: T.muted, marginTop: 10 }}>Pioneering digital education ecosystems since 2018</p>
    </div>

    <div className="about-grid">
      {/* Mission Card */}
      <TiltCard className="interactive-card" style={{ padding: 0, overflow: "hidden", background: T.bg2 }}>
        <div style={{ background: `linear-gradient(135deg, ${T.primary}18, ${T.accentG}10)`, padding: "26px 30px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 16 }}>
          <div className="lms-float" style={{ color: T.accentG }}>{Icons.target(T.accentG)}</div>
          <h3 style={{ fontFamily: "Syne", fontSize: 22, fontWeight: 800, margin: 0 }}>Our Mission</h3>
        </div>
        <div style={{ padding: "30px" }}>
          <p style={{ fontSize: 14.5, color: T.muted, lineHeight: 1.85, marginBottom: 24, textAlign: "justify" }}>
            Zenelait InfoTech Academy is dedicated to delivering world-class education through robust software environments.
            We believe every student deserves seamless entry into tech learning spaces regardless of geographical borders.
          </p>
          {["Accredited modern portfolios", "Industry-aligned practical code projects", "Dedicated workspace placements", "24/7 online feedback cycles"].map((item, idx) => (
            <div key={idx} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 14 }}>
              <span style={{
                width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                background: `${T.accentG}18`, border: `1px solid ${T.accentG}30`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: T.accentG, fontSize: 12, marginTop: 1, fontWeight: "bold"
              }}>✓</span>
              <span style={{ fontSize: 14, color: T.text, lineHeight: 1.5 }}>{item}</span>
            </div>
          ))}
        </div>
      </TiltCard>

      {/* Vision Card */}
      <TiltCard className="interactive-card" style={{ padding: 0, overflow: "hidden", background: T.bg2 }}>
        <div style={{ background: `linear-gradient(135deg, ${T.accent}18, ${T.primary}10)`, padding: "26px 30px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 16 }}>
          <div className="lms-float" style={{ color: T.accent }}>{Icons.star(T.accent)}</div>
          <h3 style={{ fontFamily: "Syne", fontSize: 22, fontWeight: 800, margin: 0 }}>Our Vision</h3>
        </div>
        <div style={{ padding: "30px" }}>
          <p style={{ fontSize: 14.5, color: T.muted, lineHeight: 1.85, marginBottom: 26, textAlign: "justify" }}>
            To build India's most scalable, secure, and intuitive EdTech environment, seamlessly bridging the gap between student aspirations, parental visibility, and classroom productivity.
          </p>
          <div className="about-stats-grid">
            {[["2022", "Founded"], ["15+", "Departments"], ["30+", "Staff Members"], ["20+", "Awards Won"]].map(([v, l], idx) => (
              <div key={idx} className="lms-float" style={{
                background: T.bg3, borderRadius: 12, padding: "20px 10px",
                textAlign: "center", border: `1px solid ${T.border}`,
                animationDelay: `${idx * 0.15}s`
              }}>
                <div style={{ fontFamily: "Syne", fontSize: 30, fontWeight: 900, color: T.accent, lineHeight: 1.1 }}>{v}</div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 6, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </TiltCard>
    </div>

    {/* Responsive styles */}
    <style>{`
      .about-page {
        padding: 80px 24px 100px;
        max-width: 1200px;
        margin: 0 auto;
      }
      .about-heading {
        font-family: Syne;
        font-size: 42px;
        font-weight: 800;
        margin: 14px 0 0;
      }
      .about-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 30px;
      }
      .about-stats-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }
      @media (max-width: 768px) {
        .about-page {
          padding: 40px 16px 80px;
        }
        .about-heading {
          font-size: 32px !important;
        }
        .about-grid {
          grid-template-columns: 1fr !important;
          gap: 24px;
        }
      }
    `}</style>
  </div>
);

// ─── ACADEMICS PAGE ───────────────────────────────────────────────────────────
export const Academics = () => (
  <div style={{ padding: "80px 24px 100px", maxWidth: 1200, margin: "0 auto", position: "relative" }}>
    <div className="lms-glow-orb cyan" style={{ top: "15%", left: "5%" }} />
    <div style={{ textAlign: "center", marginBottom: 60, position: "relative", zIndex: 2 }}>
      <Badge type="primary">Academics</Badge>
      <h2 style={{ fontFamily: "Syne", fontSize: 40, fontWeight: 800, margin: "14px 0", letterSpacing: "-0.5px" }}>Our Core Tech Curriculum</h2>
      <p style={{ fontSize: 16, color: T.muted }}>Comprehensive, industry-aligned training paths crafted for career advancement</p>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 26, position: "relative", zIndex: 2 }}>
      {[
        { icon: Icons.code, title: "Full Stack Web Development", hrs: 120, enrolled: 1240, price: "₹12,000", badge: "info", color: T.accent },
        { icon: Icons.analytics, title: "Data Science & Machine Learning", hrs: 160, enrolled: 980, price: "₹15,000", badge: "success", color: T.accentG },
        { icon: Icons.mobile, title: "Mobile App Development", hrs: 100, enrolled: 760, price: "₹10,000", badge: "primary", color: T.primaryL },
        { icon: Icons.shield, title: "Cyber Security Fundamentals", hrs: 90, enrolled: 620, price: "₹11,000", badge: "danger", color: T.accentR },
        { icon: Icons.palette, title: "UI/UX Design Masterclass", hrs: 80, enrolled: 540, price: "₹8,000", badge: "warning", color: T.accentY },
        { icon: Icons.cloud, title: "Cloud Computing & DevOps", hrs: 140, enrolled: 890, price: "₹13,000", badge: "info", color: T.accent },
      ].map((c, idx) => (
        <TiltCard key={idx} className="interactive-card" style={{ overflow: "hidden", padding: 0, background: T.bg2 }}>
          <div style={{ height: 130, background: `linear-gradient(135deg, ${T.bg3}, ${T.card2})`, display: "flex", alignItems: "center", justifyContent: "center", color: c.color }}>
            <div className="lms-float" style={{ transform: "scale(1.3)", animationDelay: `${idx * 0.1}s` }}>
              {c.icon(c.color)}
            </div>
          </div>
          <div style={{ padding: 22 }}>
            <h4 style={{ fontWeight: 800, fontSize: 16, fontFamily: "Syne", marginBottom: 10 }}>{c.title}</h4>
            <div style={{ display: "flex", gap: 16, fontSize: 12, color: T.muted, marginBottom: 16 }}>
              <span>⏱ {c.hrs} Hours</span>
              <span>👥 {c.enrolled.toLocaleString()} Students</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Badge type={c.badge}>ACTIVE PATH</Badge>
              <span style={{ fontWeight: 800, color: T.accent, fontSize: 16 }}>{c.price}</span>
            </div>
          </div>
        </TiltCard>
      ))}
    </div>
  </div>
);

// ─── ACHIEVEMENTS PAGE ────────────────────────────────────────────────────────
export const Achievements = () => (
  <div style={{ padding: "80px 24px 100px", maxWidth: 1200, margin: "0 auto", position: "relative" }}>
    <div className="lms-glow-orb purple" style={{ bottom: "10%", left: "5%" }} />
    <div style={{ textAlign: "center", marginBottom: 60 }}>
      <Badge type="warning">Achievements</Badge>
      <h2 style={{ fontFamily: "Syne", fontSize: 40, fontWeight: 800, margin: "14px 0", letterSpacing: "-0.5px" }}>Our Milestones & Recognition</h2>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 26 }}>
      {[
        { icon: Icons.trophy, title: "Best EdTech Platform 2026", sub: "National Software & Learning Technology Summit", color: T.accentY },
        { icon: Icons.medal, title: "Top 10 Learning Ecosystems", sub: "Global EdTech Enterprise Alliance", color: T.accent },
        { icon: Icons.lightbulb, title: "Excellence in LMS Innovation", sub: "NASSCOM Digital Infrastructure Award", color: T.accentG },
        { icon: Icons.shield, title: "ISO 9001:2015 Certified", sub: "Premium Systems & Data Infrastructure", color: T.primaryL },
        { icon: Icons.cert, title: "5000+ Verified Credentials", sub: "Industry-recognized achievements distributed", color: T.accent },
        { icon: Icons.rocket, title: "Next-Gen EdTech Accelerator", sub: "Pioneering interactive student portals", color: T.accentR },
      ].map((a, idx) => (
        <TiltCard key={idx} className="interactive-card" style={{ textAlign: "center", padding: 36, background: T.bg2 }}>
          <div style={{ color: a.color, display: "flex", justifyContent: "center", marginBottom: 20 }} className="lms-float">
            {a.icon(a.color)}
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 800, fontFamily: "Syne", marginBottom: 8 }}>{a.title}</h3>
          <p style={{ fontSize: 13.5, color: T.muted, lineHeight: 1.5 }}>{a.sub}</p>
        </TiltCard>
      ))}
    </div>
  </div>
);

// ─── MEMBERS PAGE ─────────────────────────────────────────────────────────────
export const Members = () => (
  <div className="animated-fade-in" style={{ padding: "80px 24px 100px", maxWidth: 1200, margin: "0 auto", position: "relative" }}>
    <div className="lms-glow-orb purple" style={{ top: "15%", right: "8%" }} />
    <div style={{ textAlign: "center", marginBottom: 60 }}>
      <Badge type="info">Our Team</Badge>
      <h2 style={{ fontFamily: "Syne", fontSize: 40, fontWeight: 800, margin: "14px 0", letterSpacing: "-0.5px" }}>Zenelait InfoTech Team</h2>
      <p style={{ fontSize: 16, color: T.muted, maxWidth: 640, margin: "0 auto" }}>Meet the systems architects, UI designers, and engineering leaders shaping next-generation EdTech platforms.</p>
    </div>

    <h3 style={{ fontSize: 19, fontWeight: 800, marginBottom: 24, color: T.accent, fontFamily: "Syne", textTransform: "uppercase", letterSpacing: "1px" }}>Leadership</h3>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 24, marginBottom: 54 }}>
      {[
        { n: "Praveen", r: "Chief Executive Officer (CEO)", d: "Executive Strategy & Growth", icon: Icons.rocket },
        { n: "Firdous", r: "General Manager", d: "Operations & Business Strategy", icon: Icons.briefcase },
      ].map((m, idx) => (
        <TiltCard key={idx} className="member-card" style={{ textAlign: "center", padding: 32, position: "relative", background: T.bg2 }}>
          <div style={{ position: "absolute", top: 16, right: 16, color: T.accent }}>
            {m.icon(T.accent)}
          </div>
          <Avatar name={m.n} size={84} color={T.primary} />
          <div style={{ fontWeight: 800, fontSize: 18, fontFamily: "Syne", marginTop: 18 }}>{m.n}</div>
          <div style={{ fontSize: 13, color: T.accent, fontWeight: 700, marginTop: 8 }}>{m.r}</div>
          <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>{m.d}</div>
        </TiltCard>
      ))}
    </div>

    <h3 style={{ fontSize: 19, fontWeight: 800, marginBottom: 24, color: T.primaryL, fontFamily: "Syne", textTransform: "uppercase", letterSpacing: "1px" }}>Engineering & Operations</h3>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 24 }}>
      {[
        { n: "Sathiyaseelan", r: "Software Engineer", d: "Backend Systems & Database Design" },
        { n: "Sanjay", r: "Lead Frontend Engineer", d: "UI/UX & Interactive Design" },
        { n: "Vignesh", r: "DevOps Architect", d: "Cloud Deployments & Security" },
        { n: "Abirami", r: "HR Manager", d: "Talent Acquisition & Relations" },
        { n: "annamalai", r: "software developer intern", d: "System Automation & Testing" },
      ].map((m, idx) => (
        <TiltCard key={idx} className="member-card" style={{ textAlign: "center", padding: 26, background: T.bg2 }}>
          <Avatar name={m.n} size={68} color={T.accentG} />
          <div style={{ fontWeight: 800, fontSize: 16, fontFamily: "Syne", marginTop: 16 }}>{m.n}</div>
          <div style={{ fontSize: 12, color: T.primaryL, fontWeight: 700, marginTop: 6 }}>{m.r}</div>
          <div style={{ fontSize: 11.5, color: T.muted, marginTop: 4 }}>{m.d}</div>
        </TiltCard>
      ))}
    </div>
  </div>
);

// ─── GALLERY PAGE ─────────────────────────────────────────────────────────────
export const Gallery = () => {
  const images = [
    { src: "/images/gallery1.png", title: "Zenelait HQ", desc: "Our collaborative workspace infrastructure." },
    { src: "/images/gallery2.png", title: "Team Collaborations", desc: "Interactive alignments and architecture design." },
    { src: "/images/gallery3.png", title: "Dev Engineering", desc: "Writing optimized software components." },
    { src: "/images/portfolio1.png", title: "", desc: "Sustaining responsive APIs under heavy loads." },
  ];

  return (
    <div className="animated-fade-in" style={{ padding: "80px 24px 100px", maxWidth: 1200, margin: "0 auto", position: "relative" }}>
      <div className="lms-glow-orb cyan" style={{ top: "10%", left: "5%" }} />
      <div style={{ textAlign: "center", marginBottom: 60, position: "relative", zIndex: 2 }}>
        <Badge type="success">Gallery</Badge>
        <h2 style={{ fontFamily: "Syne", fontSize: 40, fontWeight: 800, margin: "14px 0", letterSpacing: "-0.5px" }}>Life at Zenelait InfoTech</h2>
        <p style={{ fontSize: 16, color: T.muted, maxWidth: 600, margin: "0 auto" }}>Take a glance inside our engineering environments, design workspaces, and infrastructure layouts.</p>
      </div>
      <div className="gallery-grid" style={{ position: "relative", zIndex: 2 }}>
        {images.map((img, i) => (
          <TiltCard key={i} className="gallery-card" style={{ padding: 0, overflow: "hidden" }}>
            <img src={img.src} alt={img.title} className="gallery-img" />
            <div className="gallery-overlay">
              <div className="gallery-title">{img.title}</div>
              <div className="gallery-desc">{img.desc}</div>
            </div>
          </TiltCard>
        ))}
      </div>
    </div>
  );
};

// ─── CONTACT PAGE ─────────────────────────────────────────────────────────────
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
    borderRadius: 10,
    padding: "12px 16px",
    fontSize: 13.5,
    color: T.text,
    outline: "none",
    fontFamily: "DM Sans",
    boxSizing: "border-box",
    transition: "border-color 0.3s ease"
  });

  const errTxt = (field) =>
    errors[field] ? (
      <div style={{ fontSize: 11, color: "#ef4444", marginTop: 6, fontWeight: 600 }}>
        ⚠ {errors[field]}
      </div>
    ) : null;

  return (
    <div className="contact-container">
      <div className="contact-header">
        <Badge type="info">Contact</Badge>
        <h2>Get In Touch</h2>
        <p>
          Need assistance? Send us a message and our administration team will follow up promptly.
        </p>
      </div>

      <div className="contact-grid">
        {/* Left Info */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            {
              icon: Icons.target(T.accent),
              label: "Address",
              val: "Zenelait InfoTech, Anna Salai, Chennai, Tamil Nadu - 600002",
            },
            { icon: Icons.mobile(T.accent), label: "Phone", val: "+91 98765 43210" },
            { icon: Icons.chat(T.accent), label: "Email", val: "info@zenelaitinfotech.com" },
            {
              icon: Icons.briefcase(T.accent),
              label: "Office Hours",
              val: "Mon–Sat: 9:00 AM – 6:00 PM",
            },
          ].map((c, idx) => (
            <div key={idx} className="contact-info-item">
              <div className="contact-icon">{c.icon}</div>
              <div>
                <div className="contact-label">{c.label}</div>
                <div className="contact-value">{c.val}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Form */}
        <TiltCard className="contact-card" style={{ padding: 32, background: T.bg2 }}>
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
              <div className="success-icon" style={{ fontSize: 44, color: T.accentG, marginBottom: 16 }}>✓</div>
              <h3>Message Sent!</h3>
              <p style={{ color: T.muted, fontSize: 14, marginBottom: 20 }}>
                Your query has been recorded. Our administrative desk will respond shortly.
              </p>
              <Btn
                onClick={() => {
                  setForm({
                    name: "",
                    email: "",
                    phone: "",
                    subject: "",
                    message: "",
                    organizationId: "",
                  });
                  setSent(false);
                }}
              >
                Send Another
              </Btn>
            </div>
          )}
        </TiltCard>
      </div>

      <style>{`
        .contact-container {
          padding: 80px 24px;
          max-width: 1100px;
          margin: auto;
          position: relative;
        }

        .contact-header {
          text-align: center;
          margin-bottom: 50px;
        }

        .contact-header h2 {
          font-size: 40px;
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
          align-items: center;
          padding: 16px 20px;
          background: ${T.bg2};
          border: 1px solid ${T.border};
          border-radius: 12px;
          transition: all 0.3s ease;
        }
        .contact-info-item:hover {
          transform: translateX(6px);
          border-color: ${T.accent}50;
        }

        .contact-icon {
          width: 44px;
          height: 44px;
          background: ${T.accent}16;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .contact-label {
          font-weight: 700;
          font-size: 14px;
          color: ${T.text};
        }

        .contact-value {
          font-size: 13px;
          color: ${T.muted};
          margin-top: 2px;
        }

        .field {
          margin-bottom: 16px;
        }

        .field label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          display: block;
          margin-bottom: 6px;
          color: ${T.muted};
          letter-spacing: 0.8px;
        }

        .success-box {
          text-align: center;
          padding: 30px 0;
        }

        @media (max-width: 768px) {
          .contact-container {
            padding: 40px 16px;
          }

          .contact-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

// ─── PUBLIC WEBSITE WRAPPER ───────────────────────────────────────────────────
const PAGE_COMPONENTS = { home: Home, about: About, academics: Academics, achievements: Achievements, members: Members, gallery: Gallery, contact: Contact };

const PublicWebsite = ({ onGoToLogin }) => {
  const [pubPage, setPubPage] = useState("home");
  const [showContactDrawer, setShowContactDrawer] = useState(false);
  const PageComp = PAGE_COMPONENTS[pubPage] || Home;

  return (
    <div style={{ background: T.bg, color: T.text, minHeight: "100vh", position: "relative", overflowX: "hidden" }}>
      <PublicNav current={pubPage} onNavigate={setPubPage} onGoToLogin={onGoToLogin} />
      <div style={{ paddingTop: 70 }}>
        <PageComp onLogin={onGoToLogin} />
      </div>
      <PublicFooter />

      {/* Floating Highlight Contact Button */}
      {pubPage === "home" && (
        <button
          onClick={() => setShowContactDrawer(true)}
          className="floating-contact-btn"
          style={{
            position: "fixed",
            right: 0,
            top: "40%",
            transform: "translateY(-50%)",
            background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`,
            border: "none",
            borderLeft: `2.5px solid ${T.accent}`,
            color: "#fff",
            padding: "18px 12px",
            borderTopLeftRadius: 16,
            borderBottomLeftRadius: 16,
            cursor: "pointer",
            boxShadow: "0 8px 30px rgba(124, 58, 237, 0.4)",
            zIndex: 1100,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            writingMode: "vertical-rl",
            textTransform: "uppercase",
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: "1.5px",
            transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
          }}
        >
          <span style={{ fontSize: 16, writingMode: "horizontal-tb", marginBottom: 4 }}>💬</span>
          Get In Touch
        </button>
      )}

      {/* Slide-out Contact Drawer Backdrop */}
      {showContactDrawer && (
        <div
          onClick={() => setShowContactDrawer(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(6, 4, 15, 0.65)",
            backdropFilter: "blur(6px)",
            zIndex: 2000,
            animation: "fadeIn 0.3s ease"
          }}
        />
      )}

      {/* Contact Drawer Panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "100%",
          maxWidth: 540,
          background: "rgba(10, 8, 22, 0.96)",
          backdropFilter: "blur(30px)",
          borderLeft: `1px solid ${T.border}`,
          boxShadow: "-10px 0 40px rgba(0,0,0,0.6)",
          zIndex: 2100,
          transform: showContactDrawer ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto"
        }}
      >
        {/* Drawer Header */}
        <div style={{ padding: "22px 30px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>💬</span>
            <span style={{ fontFamily: "Syne", fontSize: 18, fontWeight: 900, color: "#fff" }}>Get In Touch</span>
          </div>
          <button
            onClick={() => setShowContactDrawer(false)}
            style={{
              background: "rgba(255,255,255,.05)",
              border: `1px solid ${T.border}`,
              color: T.muted,
              width: 32,
              height: 32,
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s"
            }}
            onMouseEnter={e => e.currentTarget.style.color = "#fff"}
            onMouseLeave={e => e.currentTarget.style.color = T.muted}
          >
            ✕
          </button>
        </div>

        {/* Drawer Content */}
        <div style={{ flex: 1, padding: "12px 10px 40px" }}>
          <GetInTouch />
        </div>
      </div>

      <style>{`
        /* --- Ambient Blurs --- */
        .lms-glow-orb {
          position: absolute;
          width: 320px;
          height: 320px;
          border-radius: 50%;
          filter: blur(120px);
          pointer-events: none;
          z-index: 1;
          opacity: 0.25;
          animation: driftOrb 12s infinite alternate ease-in-out;
        }
        .lms-glow-orb.purple {
          background: ${T.primary};
        }
        .lms-glow-orb.cyan {
          background: ${T.accent};
          animation-delay: -6s;
        }

        @keyframes driftOrb {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(40px, -30px) scale(1.1); }
          100% { transform: translate(-20px, 40px) scale(0.9); }
        }

        /* --- General Animations --- */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes floatEffect {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        @keyframes floatEffectSlow {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-14px) rotate(2deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes pulseDot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.4; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }

        .animated-fade-in {
          animation: fadeIn 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .lms-float {
          animation: floatEffect 4.5s ease-in-out infinite;
          display: inline-block;
        }
        .lms-float-slow {
          animation: floatEffectSlow 6s ease-in-out infinite;
        }

        /* --- Hover Cards & Interactive Elements --- */
        .interactive-card {
          border: 1px solid ${T.border} !important;
        }
        .feature-icon-box {
          transition: transform 0.4s ease;
        }
        .interactive-card:hover .feature-icon-box {
          transform: scale(1.12) rotate(6deg) translateZ(30px);
        }

        /* --- Stats Animated Grid --- */
        .stats-banner {
          background: linear-gradient(135deg, ${T.primaryD}, ${T.bg2});
          border-radius: 24px;
          border: 1px solid rgba(124, 58, 237, 0.2);
          position: relative;
          overflow: hidden;
        }
        .stats-banner::before {
          content: "";
          position: absolute;
          top: -50%; left: -50%; width: 200%; height: 200%;
          background: radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 60%);
          animation: floatEffectSlow 15s linear infinite;
          pointer-events: none;
        }

        /* --- Gallery Premium Styles --- */
        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px;
        }
        .gallery-card {
          position: relative;
          aspect-ratio: 4/3;
          border-radius: 16px;
          border: 1px solid ${T.border};
          overflow: hidden;
          cursor: pointer;
          background: ${T.bg3};
        }
        .gallery-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .gallery-card:hover .gallery-img {
          transform: scale(1.12) translateZ(15px);
        }
        .gallery-overlay {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          background: linear-gradient(to top, rgba(6,4,15,0.96) 0%, rgba(6,4,15,0.5) 70%, transparent 100%);
          padding: 24px;
          color: #fff;
          opacity: 0;
          transform: translateY(12px) translateZ(25px);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          pointer-events: none;
        }
        .gallery-card:hover .gallery-overlay {
          opacity: 1;
          transform: translateY(0) translateZ(25px);
        }
        .gallery-title {
          font-family: Syne;
          font-size: 16px;
          font-weight: 800;
          margin-bottom: 6px;
        }
        .gallery-desc {
          font-size: 12px;
          color: ${T.muted};
          line-height: 1.5;
        }

        /* --- Team Members premium styles --- */
        .member-card {
          border: 1px solid ${T.border} !important;
        }

        /* --- Moving Animated Gradient Heading --- */
        .lms-text-animated-gradient {
          font-family: 'Playfair Display', serif;
          background: linear-gradient(120deg, ${T.white} 0%, ${T.accent} 25%, ${T.primaryL} 50%, ${T.accent} 75%, ${T.white} 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shineText 5s linear infinite, headingFloat 3.5s ease-in-out infinite alternate;
          display: inline-block;
        }

        @keyframes shineText {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }

        @keyframes headingFloat {
          0% { transform: translateY(0); }
          100% { transform: translateY(-8px); }
        }

        /* --- Floating Contact Button Blinking/Pulsing --- */
        @keyframes contactBlink {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(6, 182, 212, 0.6), 0 8px 30px rgba(124, 58, 237, 0.4);
            border-color: rgba(6, 182, 212, 0.6);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(6, 182, 212, 0), 0 8px 30px rgba(124, 58, 237, 0.55);
            border-color: rgba(6, 182, 212, 1);
            transform: translateY(-52%) scale(1.04);
          }
        }
        .floating-contact-btn {
          animation: contactBlink 2.2s infinite ease-in-out;
        }
        .floating-contact-btn:hover {
          background: linear-gradient(135deg, ${T.accent}, ${T.primary}) !important;
          padding-right: 18px !important;
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};

export default PublicWebsite;
