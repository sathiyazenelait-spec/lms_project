// src/context/AdminProfileContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { getAdminProfile } from "../api/auth";

const AdminProfileContext = createContext(null);

export const AdminProfileProvider = ({ children }) => {
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profileName,  setProfileName]  = useState("");

  // Fetch once on mount so sidebar + header have data immediately
  useEffect(() => {
    getAdminProfile()
      .then(data => {
        if (data?.profilePicUrl) setProfilePhoto(data.profilePicUrl);
        if (data?.name)          setProfileName(data.name);
      })
      .catch(console.error);
  }, []);

  return (
    <AdminProfileContext.Provider value={{ profilePhoto, setProfilePhoto, profileName, setProfileName }}>
      {children}
    </AdminProfileContext.Provider>
  );
};

export const useAdminProfile = () => useContext(AdminProfileContext);
