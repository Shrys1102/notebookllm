import { useEffect, useRef, useState } from "react";
import {
  FileUp,
  FileText,
  Map,
  AudioLines,
  Search,
  MessageSquarePlus,
  Trash2,
  Settings,
  Sun,
  Moon,
  LogOut,
  X,
  Command,
  NotebookPen,
  Quote,
  BookmarkCheck,
  History,
  PanelLeft,
  PanelRight,
  Focus,
  PanelRightClose,
  Save,
  FileClock,
  Lightbulb,
  FolderOpen,
  FolderPlus,
  MessageCircleQuestion,
  LayoutDashboard,
  Plus,
  SearchCode,
  BookmarkPlus,
  CalendarClock,
  RotateCcw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useSettings } from "../../context/SettingsContext.jsx";
import { SHORTCUT_CATALOG } from "../../hooks/useKeyboardShortcuts.js";

export default function CommandPalette({
  isOpen,
  onClose,
  onTriggerUpload,
  onNewSession,
  onClearSession,
  onGenerateSummary,
  onGenerateConceptMap,
  onGenerateVoice,
  onOpenResearchPanel,
  onToggleSidebar,
  onToggleStudio,
  onToggleFocusMode,
  onToggleEvidence,
  onSaveLatestAnswer,
  onSaveLatestAnswerAsInsight,
  onFocusResearchSearch,
  onRequestCreateNote,
  onRequestCreateCollection,
  onAssignCurrentSource,
  onOpenCollection,
  onOpenRecentDocument,
  onOpenTimeline,
  viewerOpen = false,
  canSaveAnswer = false,
  hasRecentDocuments = false,
  recentDocument = null,
  currentSourceName = null,
  hasRecentCollection = false,
  recentCollection = null,
}) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { settings, updateSettings } = useSettings();

  const commands = [
    {
      id: "new-session",
      title: "New Research Session",
      category: "Chat",
      icon: MessageSquarePlus,
      action: () => {
        onNewSession?.();
        onClose();
      },
    },
    {
      id: "upload-doc",
      title: "Upload Documents",
      category: "Sources",
      icon: FileUp,
      action: () => {
        onTriggerUpload?.();
        onClose();
      },
    },
    {
      id: "toggle-sidebar",
      title: "Toggle Source Panel",
      category: "Workspace",
      icon: PanelLeft,
      shortcut: "Ctrl/⌘ B",
      action: () => {
        onToggleSidebar?.();
        onClose();
      },
    },
    {
      id: "toggle-studio",
      title: "Toggle Studio Panel",
      category: "Workspace",
      icon: PanelRight,
      shortcut: "Alt S",
      action: () => {
        onToggleStudio?.();
        onClose();
      },
    },
    {
      id: "toggle-focus",
      title: viewerOpen ? "Toggle Document Focus Mode" : "Open Last Document in Focus Mode",
      category: "Viewer",
      icon: Focus,
      shortcut: "Alt F",
      enabled: viewerOpen || hasRecentDocuments,
      action: () => {
        onToggleFocusMode?.();
        onClose();
      },
    },
    {
      id: "toggle-evidence",
      title: "Toggle Evidence Panel",
      category: "Viewer",
      icon: PanelRightClose,
      shortcut: "Alt E",
      enabled: viewerOpen,
      action: () => {
        onToggleEvidence?.();
        onClose();
      },
    },
    {
      id: "open-recent-document",
      title: recentDocument ? `Open Recent: ${recentDocument.fileName}` : "Open Most Recent Document",
      category: "Sources",
      icon: FileClock,
      enabled: hasRecentDocuments,
      action: () => {
        onOpenRecentDocument?.({ fileName: recentDocument.fileName });
        onClose();
      },
    },
    {
      id: "open-notes",
      title: "Open Research Notes",
      category: "Research",
      icon: NotebookPen,
      shortcut: "Alt R",
      action: () => {
        onOpenResearchPanel?.("notes");
        onClose();
      },
    },
    {
      id: "open-evidence",
      title: "Open Saved Evidence",
      category: "Research",
      icon: Quote,
      action: () => {
        onOpenResearchPanel?.("evidence");
        onClose();
      },
    },
    {
      id: "open-bookmarks",
      title: "Open Bookmarks",
      category: "Research",
      icon: BookmarkCheck,
      action: () => {
        onOpenResearchPanel?.("bookmarks");
        onClose();
      },
    },
    {
      id: "open-recent",
      title: "Open Recent Documents",
      category: "Research",
      icon: History,
      action: () => {
        onOpenResearchPanel?.("recent");
        onClose();
      },
    },
    {
      id: "open-insights",
      title: "Open Insights",
      category: "Research",
      icon: Lightbulb,
      action: () => {
        onOpenResearchPanel?.("insights");
        onClose();
      },
    },
    {
      id: "open-collections",
      title: "Open Collections",
      category: "Research",
      icon: FolderOpen,
      action: () => {
        onOpenResearchPanel?.("collections");
        onClose();
      },
    },
    {
      id: "open-overview",
      title: "Open Research Overview",
      category: "Research",
      icon: LayoutDashboard,
      action: () => {
        onOpenResearchPanel?.("overview");
        onClose();
      },
    },
    {
      id: "open-timeline",
      title: "Open Research Timeline",
      category: "Timeline",
      icon: History,
      action: () => {
        onOpenTimeline?.("all");
        onClose();
      },
    },
    {
      id: "view-today",
      title: "View Today's Research",
      category: "Timeline",
      icon: CalendarClock,
      action: () => {
        onOpenTimeline?.("today");
        onClose();
      },
    },
    {
      id: "reset-timeline-filter",
      title: "Reset Timeline Filter",
      category: "Timeline",
      icon: RotateCcw,
      action: () => {
        onOpenTimeline?.("all");
        onClose();
      },
    },
    {
      id: "create-note",
      title: "Create Note",
      category: "Research",
      icon: Plus,
      action: () => {
        onRequestCreateNote?.();
        onClose();
      },
    },
    {
      id: "new-collection",
      title: "New Collection",
      category: "Collections",
      icon: FolderPlus,
      action: () => {
        onRequestCreateCollection?.();
        onClose();
      },
    },
    {
      id: "search-research",
      title: "Search Research Workspace",
      category: "Research",
      icon: SearchCode,
      action: () => {
        onFocusResearchSearch?.("all");
        onClose();
      },
    },
    {
      id: "search-questions",
      title: "Search Questions",
      category: "Research",
      icon: MessageCircleQuestion,
      action: () => {
        onFocusResearchSearch?.("questions");
        onClose();
      },
    },
    {
      id: "search-notes",
      title: "Search Notes",
      category: "Research",
      icon: NotebookPen,
      action: () => {
        onFocusResearchSearch?.("notes");
        onClose();
      },
    },
    {
      id: "search-insights",
      title: "Search Insights",
      category: "Research",
      icon: Lightbulb,
      action: () => {
        onFocusResearchSearch?.("insights");
        onClose();
      },
    },
    {
      id: "assign-source-to-collection",
      title: currentSourceName ? `Add “${currentSourceName}” to a Collection` : "Add Open Source to a Collection",
      category: "Collections",
      icon: BookmarkPlus,
      enabled: Boolean(currentSourceName),
      action: () => {
        onAssignCurrentSource?.();
        onClose();
      },
    },
    {
      id: "open-recent-collection",
      title: recentCollection ? `Open Collection: ${recentCollection.name}` : "Open Most Recent Collection",
      category: "Collections",
      icon: FolderOpen,
      enabled: hasRecentCollection,
      action: () => {
        onOpenCollection?.(recentCollection.id);
        onClose();
      },
    },
    {
      id: "save-answer-as-insight",
      title: "Save Latest AI Answer as Insight",
      category: "Research",
      icon: Lightbulb,
      enabled: canSaveAnswer,
      action: () => {
        onSaveLatestAnswerAsInsight?.();
        onClose();
      },
    },
    {
      id: "save-answer",
      title: "Save Latest AI Answer to Notes",
      category: "Research",
      icon: Save,
      enabled: canSaveAnswer,
      action: () => {
        onSaveLatestAnswer?.();
        onClose();
      },
    },
    {
      id: "gen-summary",
      title: "Generate Document Summary",
      category: "Studio",
      icon: FileText,
      action: () => {
        onGenerateSummary?.();
        onClose();
      },
    },
    {
      id: "gen-concept-map",
      title: "Generate Concept Map (Mindmap)",
      category: "Studio",
      icon: Map,
      action: () => {
        onGenerateConceptMap?.();
        onClose();
      },
    },
    {
      id: "gen-voice",
      title: "Generate Audio Overview (Podcast)",
      category: "Studio",
      icon: AudioLines,
      action: () => {
        onGenerateVoice?.();
        onClose();
      },
    },
    {
      id: "toggle-theme",
      title: `Switch to ${settings.theme === "dark" ? "Light" : "Dark"} Mode`,
      category: "Appearance",
      icon: settings.theme === "dark" ? Sun : Moon,
      action: () => {
        updateSettings({ theme: settings.theme === "dark" ? "light" : "dark" });
        onClose();
      },
    },
    {
      id: "clear-memory",
      title: "Clear Session Memory",
      category: "Session",
      icon: Trash2,
      action: () => {
        onClearSession?.();
        onClose();
      },
    },
    {
      id: "open-settings",
      title: "Open Settings",
      category: "System",
      icon: Settings,
      action: () => {
        navigate("/settings");
        onClose();
      },
    },
    {
      id: "sign-out",
      title: "Sign Out",
      category: "Account",
      icon: LogOut,
      action: () => {
        signOut();
        onClose();
      },
    },
  ];

  const filtered = commands.filter(
    (cmd) =>
      cmd.enabled !== false &&
      (cmd.title.toLowerCase().includes(query.toLowerCase()) ||
        cmd.category.toLowerCase().includes(query.toLowerCase()))
  );

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      window.setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
      } else if (e.key === "Enter" && filtered[selectedIndex]) {
        e.preventDefault();
        filtered[selectedIndex].action();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="commandOverlay" onClick={onClose}>
      <div className="commandDialog" onClick={(e) => e.stopPropagation()}>
        <div className="commandInputWrapper">
          <Command size={18} className="commandInputIcon" />
          <input
            ref={inputRef}
            type="text"
            className="commandInput"
            placeholder="Type a command or search actions... (Esc to exit)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="commandCloseBtn" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="commandList">
          {filtered.length === 0 ? (
            <div className="commandEmpty">No commands found for &ldquo;{query}&rdquo;</div>
          ) : (
            filtered.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  className={`commandItem ${isSelected ? "selected" : ""}`}
                  onClick={() => cmd.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className="commandItemLeft">
                    <span className="commandItemIcon">
                      <Icon size={16} />
                    </span>
                    <span className="commandItemTitle">{cmd.title}</span>
                  </div>
                  <div className="commandItemRight">
                    {cmd.shortcut && <kbd className="commandItemShortcut">{cmd.shortcut}</kbd>}
                    <span className="commandItemBadge">{cmd.category}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="commandFooter">
          <span><kbd>↑</kbd> <kbd>↓</kbd> Navigate</span>
          <span><kbd>↵</kbd> Select</span>
          <span><kbd>Esc</kbd> Close</span>
          <span className="commandFooterSpacer" />
          <span className="commandFooterHint">{SHORTCUT_CATALOG.length} shortcuts · see Settings</span>
        </div>
      </div>
    </div>
  );
}