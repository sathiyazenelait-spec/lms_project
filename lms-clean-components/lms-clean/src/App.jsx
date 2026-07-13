import { useEffect, useState, lazy, Suspense } from "react";
import GlobalStyle from "./assets/styles/GlobalStyle";
import styled, { keyframes } from "styled-components";

import { AdminProfileProvider } from "./context/AdminProfileContext";
import { StudentProfileProvider } from "./context/StudentProfileContext";
import { TeacherProfileProvider } from "./context/TeacherProfileContext";
import { ParentProfileProvider }  from "./context/ParentProfileContext";

// Lazy Loaded Components for Maximum Performance
const PublicWebsite = lazy(() => import("./pages/Public"));
const LoginPage = lazy(() => import("./pages/Auth/LoginPage"));
const StudentDashboard = lazy(() => import("./pages/Student"));
const AdminDashboard = lazy(() => import("./pages/Admin"));
const TeacherDashboard = lazy(() => import("./pages/TeacherParent").then(m => ({ default: m.TeacherDashboard })));
const ParentDashboard = lazy(() => import("./pages/TeacherParent").then(m => ({ default: m.ParentDashboard })));
const UltraSuperAdminDashboard = lazy(() => import("./pages/UltraSuperAdmin/Dashboard"));
const UltraSuperAdminLoginPage = lazy(() => import("./pages/UltraSuperAdmin/LoginPage"));

// Premium Loading Animation for "Dominating" UI Feel
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;
const pulse = keyframes`
  0% { transform: scale(0.95); opacity: 0.8; }
  50% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.8; }
`;

const PremiumLoader = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100vw;
  background: #0f172a;
  color: white;
  font-family: 'Inter', sans-serif;

  .spinner {
    width: 60px;
    height: 60px;
    border: 4px solid rgba(255, 255, 255, 0.1);
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: ${spin} 1s linear infinite;
    margin-bottom: 24px;
  }
  
  .brand {
    font-size: 1.5rem;
    font-weight: 800;
    letter-spacing: 2px;
    background: linear-gradient(90deg, #3b82f6, #8b5cf6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: ${pulse} 2s ease-in-out infinite;
  }
`;

const PageLoader = () => (
  <PremiumLoader>
    <div className="spinner"></div>
    <div className="brand">ZENELAIT LMS</div>
  </PremiumLoader>
);

const OverlayLoader = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(4.5px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000000;
  color: white;
  font-family: 'Inter', sans-serif;

  .spinner {
    width: 50px;
    height: 50px;
    border: 4.5px solid rgba(255, 255, 255, 0.1);
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: ${spin} 0.8s linear infinite;
    margin-bottom: 16px;
    box-shadow: 0 0 15px rgba(59, 130, 246, 0.3);
  }

  .text {
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 1.5px;
    color: #e2e8f0;
    text-transform: uppercase;
  }
`;

export default function App() {
  const [auth, setAuth] = useState(null);
  const [view, setView] = useState("public");
  const [featuresLoaded, setFeaturesLoaded] = useState(false);
  const [globalLoading, setGlobalLoading] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("zenelait-theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  useEffect(() => {
    const handleLoading = (e) => {
      setGlobalLoading(e.detail);
    };
    window.addEventListener("zenelait-loading", handleLoading);
    return () => window.removeEventListener("zenelait-loading", handleLoading);
  }, []);

  useEffect(() => {
    const path = window.location.pathname;
    if (path === "/ultra-super-admin") {
      setView("usa-login");
      setFeaturesLoaded(true);
      return;
    }
    const raw = localStorage.getItem("zenelait-auth");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setAuth(parsed);
        setView(roleToView(parsed.role));
      } catch {
        localStorage.removeItem("zenelait-auth");
        setFeaturesLoaded(true);
      }
    } else {
      setView("public");
      setFeaturesLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (auth?.organizationId) {
      setFeaturesLoaded(false);
      fetch(`${process.env.REACT_APP_API_BASE_URL || "http://localhost:8080"}/api/public/organizations/${auth.organizationId}/features`)
        .then(res => res.json())
        .then(body => {
          if (body.success && Array.isArray(body.data)) {
            const keys = body.data.map(f => f.featureKey);
            localStorage.setItem("zenelait-features", JSON.stringify(keys));
          } else {
            localStorage.removeItem("zenelait-features");
          }
          setFeaturesLoaded(true);
        })
        .catch(err => {
          console.error("Error loading features:", err);
          setFeaturesLoaded(true);
        });
    } else {
      localStorage.removeItem("zenelait-features");
      setFeaturesLoaded(true);
    }
  }, [auth]);

  const roleToView = (role) => {
    switch (role) {
      case "STUDENT":    return "student";
      case "TEACHER":    return "teacher";
      case "PARENT":     return "parent";
      case "ADMIN":      return "admin";
      case "SUPER_ADMIN":return "admin";
      case "ULTRA_SUPER_ADMIN":  return "usa";
      default:           return "public";
    }
  };

  const handleLoginSuccess = (authResponse) => {
    const auth = authResponse?.accessToken ? authResponse : (authResponse?.data ?? authResponse);
    setAuth(auth);
    localStorage.setItem("zenelait-auth", JSON.stringify(auth));
    setView(roleToView(auth.role));

    if (auth.role === "ULTRA_SUPER_ADMIN") {
      window.history.replaceState({}, "", "/");
    }
  };

  const handleLogout = () => {
    try {
      const raw = localStorage.getItem("zenelait-auth");
      if (raw) {
        const email = JSON.parse(raw).email || "unknown";
        localStorage.removeItem(`zenelait-profile-${email}`);
      }
    } catch { /* ignore */ }

    setAuth(null);
    localStorage.removeItem("zenelait-auth");
    localStorage.removeItem("zenelait-features");
    setView("login");
  };

  return (
    <>
      <GlobalStyle />
      {globalLoading && (
        <OverlayLoader>
          <div className="spinner"></div>
          <div className="text">Processing Request...</div>
        </OverlayLoader>
      )}

      <Suspense fallback={<PageLoader />}>
        {view === "public" && (
          <PublicWebsite onGoToLogin={() => setView("login")} />
        )}

        {view === "login" && (
          <LoginPage
            onLoginSuccess={handleLoginSuccess}
            onBack={() => setView("public")}
            onUltraAdminLogin={() => setView("usa-login")}
          />
        )}

        {view === "student" && (
          <StudentProfileProvider>
            <StudentDashboard onLogout={handleLogout} />
          </StudentProfileProvider>
        )}

        {view === "teacher" && (
          <TeacherProfileProvider>
            <TeacherDashboard onLogout={handleLogout} />
          </TeacherProfileProvider>
        )}

        {view === "admin" && (
          <AdminProfileProvider>
            <AdminDashboard onLogout={handleLogout} />
          </AdminProfileProvider>
        )}
        {view === "usa" && (
          <UltraSuperAdminDashboard auth={auth} onLogout={handleLogout} />
        )}

        {view === "usa-login" && (
          <UltraSuperAdminLoginPage
            onLoginSuccess={handleLoginSuccess}
            onBack={() => setView("login")}
          />
        )}

        {view === "parent" && (
          <ParentProfileProvider>
            <ParentDashboard onLogout={handleLogout} />
          </ParentProfileProvider>
        )}
      </Suspense>
    </>
  );
}