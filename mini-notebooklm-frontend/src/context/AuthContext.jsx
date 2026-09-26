import { createContext, useContext, useState } from "react";
import { DEMO_MODE, DEFAULT_API_BASE_URL } from "../utils/constants.js";
import { api } from "../services/api.js";
import {
  getSessionUser,
  setSessionUser,
  getPersistedUser,
  setPersistedUser,
  getDemoUser,
} from "../services/localStorage.js";

const AuthContext = createContext(null);

function getAuthErrorMessage(err, fallback) {
  if (err.response?.data?.detail) return err.response.data.detail;
  if (err.code === "ECONNABORTED") return "Backend request timed out. Check whether the API server is running.";
  if (err.message === "Network Error") return `Cannot reach backend API (${DEFAULT_API_BASE_URL}). Please check your connection and try again later.`;
  return fallback;
}

function shouldFallbackToLocalAuth(err) {
  return err?.response?.status === 404;
}

// Initialise the auth session.
//   - Demo mode: auto-provision a stable demo-user, persisted so it survives
//     browser restarts, and mirrored into the active tab session for API use.
//   - Normal mode: restore whatever was left in the active tab session.
function getInitialUser() {
  if (DEMO_MODE) {
    const demoUser = getPersistedUser() || getDemoUser();
    setSessionUser(demoUser);
    setPersistedUser(demoUser);
    return demoUser;
  }
  return getSessionUser();
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getInitialUser());

  const register = async (username, password) => {
    try {
      const data = await api.register({ username, password });
      const userData = { username: data.username };
      setUser(userData);
      setSessionUser(userData);
      return { success: true };
    } catch (err) {
      if (shouldFallbackToLocalAuth(err)) {
        const userData = { username: username.trim() };
        setUser(userData);
        setSessionUser(userData);
        return { success: true };
      }
      const msg = getAuthErrorMessage(err, "Registration failed.");
      return { success: false, error: msg };
    }
  };

  const login = async (username, password) => {
    try {
      const data = await api.login({ username, password });
      const userData = { username: data.username };
      setUser(userData);
      setSessionUser(userData);
      return { success: true };
    } catch (err) {
      if (shouldFallbackToLocalAuth(err)) {
        const userData = { username: username.trim() };
        setUser(userData);
        setSessionUser(userData);
        return { success: true };
      }
      const msg = getAuthErrorMessage(err, "Login failed.");
      return { success: false, error: msg };
    }
  };

  const logout = () => {
    if (DEMO_MODE) {
      // There is no signed-out state in demo mode; reset to the demo session
      // so the workspace stays live instead of falling back to the login page.
      const demoUser = getDemoUser();
      setUser(demoUser);
      setSessionUser(demoUser);
      setPersistedUser(demoUser);
      return;
    }
    setUser(null);
    setSessionUser(null);
    setPersistedUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, register, login, logout, signOut: logout, isLoading: false }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
