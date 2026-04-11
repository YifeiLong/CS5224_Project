import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchCurrentUser, logoutUser } from '../services/api';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [solarData, setSolarData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // isPro is always derived from the user record returned by the backend
  // so it persists correctly across logout/login cycles
  const isPro = currentUser?.isPro || false;

  // On app load — rehydrate session from stored JWT
  // Calls GET /auth/me to get the user's current profile + isPro status from DB
  useEffect(() => {
    const token = localStorage.getItem('solar_token');
    if (token) {
      fetchCurrentUser()
        .then(user => { if (user) setCurrentUser(user); })
        .catch(() => localStorage.removeItem('solar_token')) // token expired/invalid
        .finally(() => setAuthLoading(false));
    } else {
      setAuthLoading(false);
    }
  }, []);

  const logout = async () => {
    await logoutUser(); // removes token from localStorage + optional server invalidation
    setCurrentUser(null);
  };

  const upgradeToPro = () => {
    // Called after Stripe payment confirmed
    // Updates the local user object so UI reflects Pro immediately
    // The source of truth is the backend DB — refreshed on next login via isPro field
    setCurrentUser(prev => prev ? { ...prev, isPro: true } : prev);
  };

  return (
    <UserContext.Provider value={{
      isPro,
      solarData,
      setSolarData,
      currentUser,
      setCurrentUser,  // used by LoginModal after successful register/login
      logout,
      upgradeToPro,
      authLoading,     // use this to show a loading spinner on app load if needed
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);