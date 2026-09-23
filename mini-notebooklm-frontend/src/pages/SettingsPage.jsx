import { ArrowLeft, Moon, RotateCcw, Sun, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useSettings } from "../context/SettingsContext.jsx";
import { SHORTCUT_CATALOG } from "../hooks/useKeyboardShortcuts.js";
import { AUTH_STORAGE_KEY, CHAT_DRAFT_KEY, SESSION_STORAGE_KEY, SETTINGS_STORAGE_KEY } from "../utils/constants.js";

export default function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const { signOut } = useAuth();

  const clearSavedData = () => {
    [AUTH_STORAGE_KEY, CHAT_DRAFT_KEY, SESSION_STORAGE_KEY, SETTINGS_STORAGE_KEY, "mini-notebooklm:api-base-url"].forEach((key) =>
      localStorage.removeItem(key)
    );
    signOut();
  };

  return (
    <main className="settingsPage">
      <div className="settingsTop">
        <Link to="/" className="backLink"><ArrowLeft size={17} /> Dashboard</Link>
        <h1>Settings</h1>
      </div>

      <div className="settingsGrid">
        <Card title="Backend">
          <label className="field">
            API base URL
            <input value={settings.apiBaseUrl} onChange={(event) => updateSettings({ apiBaseUrl: event.target.value })} />
          </label>
          <p className="muted">Default: http://localhost:5000</p>
        </Card>

        <Card title="Appearance">
          <div className="segmented">
            <button className={settings.theme === "light" ? "active" : ""} onClick={() => updateSettings({ theme: "light" })}>
              <Sun size={16} /> Light
            </button>
            <button className={settings.theme === "dark" ? "active" : ""} onClick={() => updateSettings({ theme: "dark" })}>
              <Moon size={16} /> Dark
            </button>
          </div>
        </Card>

        <Card title="Local data">
          <div className="settingsActions">
            <Button variant="secondary" onClick={resetSettings}><RotateCcw size={16} /> Reset settings</Button>
            <Button variant="danger" onClick={clearSavedData}><Trash2 size={16} /> Clear saved data</Button>
          </div>
          <p className="muted">
            Notes, saved evidence, bookmarks, and recent documents are stored locally in your browser
            (namespaced per user) and are not synced to the server.
          </p>
        </Card>

        <Card title="Keyboard shortcuts">
          <div className="shortcutList">
            {SHORTCUT_CATALOG.map((item) => (
              <div key={item.keys + item.description} className="shortcutRow">
                <kbd className="shortcutKeys">{item.keys}</kbd>
                <span className="shortcutDesc">{item.description}</span>
              </div>
            ))}
          </div>
          <p className="muted">Shortcuts do not fire while typing in inputs, except Escape and modifier combos.</p>
        </Card>
      </div>
    </main>
  );
}
