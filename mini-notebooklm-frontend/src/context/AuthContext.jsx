import { createContext, useContext, useState } from "react";
import { AUTH_STORAGE_KEY } from "../utils/constants.js";
import { api } from "../services/api.js";

const AuthContext = createContext(null);

function getAuthErrorMessage(err, fallback) {
  if (err.response?.data?.detail) return err.response.data.detail;
  if (err.code === "ECONNABORTED") return "Backend request timed out. Check whether the API server is running.";
  if (err.message === "Network Error") return "Cannot reach backend API. Start server on http://localhost:5000.";
  return fallback;
}

function shouldFallbackToLocalAuth(err) {
  return err?.response?.status === 404;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem(AUTH_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const register = async (username, password) => {
    try {
      const data = await api.register({ username, password });
      const userData = { username: data.username };
      setUser(userData);
      sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
      return { success: true };
    } catch (err) {
      if (shouldFallbackToLocalAuth(err)) {
        const userData = { username: username.trim() };
        setUser(userData);
        sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
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
      sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
      return { success: true };
    } catch (err) {
      if (shouldFallbackToLocalAuth(err)) {
        const userData = { username: username.trim() };
        setUser(userData);
        sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
        return { success: true };
      }
      const msg = getAuthErrorMessage(err, "Login failed.");
      return { success: false, error: msg };
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
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
