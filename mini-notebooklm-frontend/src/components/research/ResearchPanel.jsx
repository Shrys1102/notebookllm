import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  NotebookPen,
  Quote,
  Lightbulb,
  FolderOpen,
  BookmarkCheck,
  History,
  Clock,
  Search,
  X,
} from "lucide-react";
import { useResearch, RESEARCH_TABS } from "../../context/ResearchContext.jsx";
import ResearchOverview from "./ResearchOverview.jsx";
import ResearchNotes from "./ResearchNotes.jsx";
import SavedEvidence from "./SavedEvidence.jsx";
import InsightLibrary from "./InsightLibrary.jsx";
import CollectionLibrary from "../collections/CollectionLibrary.jsx";
import Bookmarks from "./Bookmarks.jsx";
import RecentDocuments from "./RecentDocuments.jsx";
import ResearchSearch from "./ResearchSearch.jsx";
import ResearchTimeline from "../timeline/ResearchTimeline.jsx";

const TABS = [
  { id: RESEARCH_TABS.OVERVIEW, label: "Overview", icon: LayoutDashboard },
  { id: RESEARCH_TABS.NOTES, label: "Notes", icon: NotebookPen },
  { id: RESEARCH_TABS.EVIDENCE, label: "Evidence", icon: Quote },
  { id: RESEARCH_TABS.INSIGHTS, label: "Insights", icon: Lightbulb },
  { id: RESEARCH_TABS.COLLECTIONS, label: "Collections", icon: FolderOpen },
  { id: RESEARCH_TABS.BOOKMARKS, label: "Bookmarks", icon: BookmarkCheck },
  { id: RESEARCH_TABS.TIMELINE, label: "Timeline", icon: Clock },
  { id: RESEARCH_TABS.RECENT, label: "Recent", icon: History },
];

/**
 * Tabbed research surface: overview, notes, saved evidence, insights,
 * collections, bookmarks, recent documents — plus one search box that spans
 * all of them. All data is local-first (browser storage).
 *
 * The active tab is driven by ResearchContext.researchPanelTab so command
 * palette / shortcut actions land on the exact surface requested.
 */
export default function ResearchPanel({ onOpenDocument, files = [], fileCount = 0 }) {
  const research = useResearch();
  const [searchMode, setSearchMode] = useState(false);
  const activeTab = research.researchPanelTab || RESEARCH_TABS.OVERVIEW;

  // When a command/shortcut switches the requested surface, leave search mode
  // so the palette action visibly lands on the surface it asked for.
  useEffect(() => {
    setSearchMode(false);
  }, [research.researchPanelTab]);

  // The palette / shortcut "Search Research" request opens search mode here
  // (ResearchSearch then focuses its input once mounted).
  const lastSearchRequest = useRef(0);
  useEffect(() => {
    if (research.researchSearchRequest > lastSearchRequest.current) {
      lastSearchRequest.current = research.researchSearchRequest;
      setSearchMode(true);
    }
  }, [research.researchSearchRequest]);

  const selectTab = (tabId) => {
    research.setResearchPanelTab(tabId);
    setSearchMode(false);
  };

  const openDocument = (target) => {
    if (onOpenDocument) onOpenDocument(target);
  };

  return (
    <div className="researchPanel">
      <div className="researchPanelTopbar">
        <div className="researchPanelTabs" role="tablist" aria-label="Research surfaces">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={!searchMode && activeTab === t.id}
                className={`researchPanelTab ${!searchMode && activeTab === t.id ? "active" : ""}`}
                onClick={() => selectTab(t.id)}
              >
                <Icon size={12} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          className={`iconButton small researchSearchToggle ${searchMode ? "active" : ""}`}
          onClick={() => setSearchMode((v) => !v)}
          aria-label={searchMode ? "Close research search" : "Search research workspace"}
          title={searchMode ? "Close search" : "Search research workspace"}
        >
          {searchMode ? <X size={13} /> : <Search size={13} />}
        </button>
      </div>

      <div className="researchPanelBody">
        {searchMode ? (
          <ResearchSearch files={files} onOpenDocument={openDocument} />
        ) : (
          <>
            {activeTab === RESEARCH_TABS.OVERVIEW && <ResearchOverview fileCount={fileCount} onOpenDocument={openDocument} />}
            {activeTab === RESEARCH_TABS.NOTES && <ResearchNotes onOpenDocument={openDocument} />}
            {activeTab === RESEARCH_TABS.EVIDENCE && <SavedEvidence onOpenDocument={openDocument} />}
            {activeTab === RESEARCH_TABS.INSIGHTS && <InsightLibrary onOpenDocument={openDocument} />}
            {activeTab === RESEARCH_TABS.COLLECTIONS && <CollectionLibrary files={files} onOpenDocument={openDocument} />}
            {activeTab === RESEARCH_TABS.BOOKMARKS && <Bookmarks onOpenDocument={openDocument} />}
            {activeTab === RESEARCH_TABS.TIMELINE && <ResearchTimeline onOpenDocument={openDocument} />}
            {activeTab === RESEARCH_TABS.RECENT && <RecentDocuments onOpenDocument={openDocument} />}
          </>
        )}
      </div>
    </div>
  );
}