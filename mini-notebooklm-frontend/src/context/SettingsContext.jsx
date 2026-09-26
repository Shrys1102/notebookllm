import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_API_BASE_URL, SETTINGS_STORAGE_KEY } from "../utils/constants.js";
import { getApiBaseUrl, setApiBaseUrl } from "../services/api.js";

const SettingsContext = createContext(null);

// In production the build-time env URL is authoritative; in dev it is
// undefined and we rely on the api.js default / localStorage fallback.
const ENV_API_URL = import.meta.env.VITE_API_BASE_URL || "";

const defaultSettings = {
  apiBaseUrl: ENV_API_URL || DEFAULT_API_BASE_URL,
  theme: "light",
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || "{}");
      // Production: env URL always wins over stale stored values.
      // Dev: honour stored URL if present, else fall back to default.
      const resolvedApiBaseUrl = ENV_API_URL || stored.apiBaseUrl || defaultSettings.apiBaseUrl;
      return { ...defaultSettings, ...stored, apiBaseUrl: resolvedApiBaseUrl };
    } catch {
      return defaultSettings;
    }
  });

  useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    setApiBaseUrl(settings.apiBaseUrl);
    document.documentElement.dataset.theme = settings.theme;
  }, [settings]);

  const value = useMemo(
    () => ({
      settings,
      updateSettings: (patch) => setSettings((current) => ({ ...current, ...patch })),
      resetSettings: () => setSettings(defaultSettings),
    }),
    [settings]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used inside SettingsProvider");
  return context;
}
