import { createContext, useContext, useState, useEffect } from "react";
import { getParentProfile } from "../api/auth";

const ParentProfileContext = createContext(null);

// Cache key is per parent email so different parents never share cached data
const getCacheKey = () => {
  try {
    const raw = localStorage.getItem("zenelait-auth");
    const email = raw ? (JSON.parse(raw).email || "unknown") : "unknown";
    return `zenelait-parent-profile-${email}`;
  } catch { return "zenelait-parent-profile-unknown"; }
};

const readCache = () => {
  try {
    const val = localStorage.getItem(getCacheKey());
    return val ? JSON.parse(val) : null;
  } catch { return null; }
};

const writeCache = (profile) => {
  try {
    if (profile) localStorage.setItem(getCacheKey(), JSON.stringify(profile));
  } catch { /* storage full — ignore */ }
};

export const ParentProfileProvider = ({ children }) => {
  // Instantly load from localStorage cache — prevents 0% flash while DB fetches
  const [profile, setProfileState] = useState(readCache);
  const [loading, setLoading]      = useState(true);

  const setProfile = (p) => {
    setProfileState(p);
    writeCache(p);
  };

  // Always fetch fresh from DB on every mount (login / page reload)
  useEffect(() => {
    getParentProfile()
      .then(p => setProfile(p))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Update specific fields instantly in both state and cache
  const updateProfileField = (fields) => {
    setProfileState(prev => {
      const updated = prev ? { ...prev, ...fields } : fields;
      writeCache(updated);
      return updated;
    });
  };

  // Force re-fetch from DB (call after save if needed)
  const refreshProfile = async () => {
    try { const p = await getParentProfile(); setProfile(p); }
    catch (err) { console.error(err); }
  };

  return (
    <ParentProfileContext.Provider value={{
      profile, setProfile, loading, refreshProfile, updateProfileField,
    }}>
      {children}
    </ParentProfileContext.Provider>
  );
};

export const useParentProfile = () => useContext(ParentProfileContext);
