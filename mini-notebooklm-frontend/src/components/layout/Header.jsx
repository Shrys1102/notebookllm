import {
  BookOpenCheck,
  Command,
  Moon,
  Sun,
  Settings,
  LogOut,
  PanelLeft,
  PanelRight,
  Sparkles,
  Layers,
  Activity,
  ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useSettings } from "../../context/SettingsContext.jsx";
import Button from "../ui/Button.jsx";

export default function Header({
  sidebarOpen,
  onToggleSidebar,
  studioOpen,
  onToggleStudio,
  onOpenCommandPalette,
  selectedFile,
  onClearSelectedFile,
  fileCount = 0,
  health,
}) {
  const { user, signOut } = useAuth();
  const { settings, updateSettings } = useSettings();

  const toggleTheme = () => {
    updateSettings({ theme: settings.theme === "dark" ? "light" : "dark" });
  };

  const isOnline = health?.status === "ok";

  return (
    <header className="appHeader">
      <div className="appHeaderLeft">
        <button
          className={`iconButton toggleSidebarBtn ${sidebarOpen ? "active" : ""}`}
          onClick={onToggleSidebar}
          title={sidebarOpen ? "Collapse Sources (Ctrl+B)" : "Expand Sources (Ctrl+B)"}
          aria-label="Toggle Sidebar"
        >
          <PanelLeft size={18} />
        </button>

        <Link to="/" className="headerBrand">
          <span className="headerBrandIcon">
            <BookOpenCheck size={18} />
          </span>
          <span className="headerBrandText">
            <strong>Mini NotebookLM</strong>
            <span className="headerBrandBadge">Workspace</span>
          </span>
        </Link>

        <div className="headerBreadcrumb">
          <ChevronRight size={14} className="breadcrumbSeparator" />
          {selectedFile ? (
            <div className="activeCorpusPill filtered" onClick={onClearSelectedFile} title="Click to search all documents">
              <span className="pillDot active" />
              <span className="pillText">{selectedFile.file_name}</span>
              <span className="pillAction">Reset</span>
            </div>
          ) : (
            <div className="activeCorpusPill">
              <Layers size={13} />
              <span className="pillText">All Documents ({fileCount})</span>
            </div>
          )}
        </div>
      </div>

      <div className="appHeaderCenter">
        <button className="commandSearchTrigger" onClick={onOpenCommandPalette} type="button">
          <Command size={14} />
          <span>Quick actions & search...</span>
          <kbd className="commandKbd">Ctrl K</kbd>
        </button>
      </div>

      <div className="appHeaderRight">
        <div className={`healthIndicator ${isOnline ? "online" : "offline"}`} title={`Backend: ${health?.provider || "local"} (${isOnline ? "Online" : "Offline"})`}>
          <span className="pulseDot" />
          <span className="healthText">{health?.provider || "FastAPI RAG"}</span>
        </div>

        <button
          className="iconButton"
          onClick={toggleTheme}
          title={`Switch to ${settings.theme === "dark" ? "Light" : "Dark"} Mode`}
          aria-label="Toggle Theme"
        >
          {settings.theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        <Link to="/settings" className="iconButton" title="Workspace Settings" aria-label="Settings">
          <Settings size={17} />
        </Link>

        <button
          className={`iconButton toggleStudioBtn ${studioOpen ? "active" : ""}`}
          onClick={onToggleStudio}
          title={studioOpen ? "Collapse Studio Panel" : "Expand Studio Panel"}
          aria-label="Toggle Studio"
        >
          <PanelRight size={18} />
        </button>

        <div className="userProfileMenu">
          <div className="userAvatar" title={`Signed in as ${user?.username}`}>
            {user?.username?.charAt(0).toUpperCase() || "U"}
          </div>
          <button className="iconButton logoutBtn" onClick={signOut} title="Sign Out" aria-label="Sign out">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
