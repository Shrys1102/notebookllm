import {
  MessageSquarePlus,
  Trash2,
  Database,
  Layers,
  ChevronLeft,
  History,
  ExternalLink,
} from "lucide-react";
import Button from "../ui/Button.jsx";
import SourceLibrary from "../files/SourceLibrary.jsx";
import { useResearch } from "../../context/ResearchContext.jsx";
import { formatBytes, getFileExtension } from "../../utils/formatters.js";

function RecentBadge(fileName = "") {
  const ext = getFileExtension(fileName).toLowerCase();
  if (ext === ".pdf") return <span className="docTypeIcon pdf small">PDF</span>;
  if (ext === ".pptx") return <span className="docTypeIcon pptx small">PPT</span>;
  if (ext === ".docx") return <span className="docTypeIcon docx small">DOC</span>;
  return <span className="docTypeIcon txt small">TXT</span>;
}

export default function Sidebar({
  filesState,
  selectedFile,
  onSelectFile,
  chat,
  isOpen,
  onClose,
  onOpenViewer,
}) {
  const research = useResearch();
  const totalSizeBytes = (filesState.files || []).reduce((acc, f) => acc + (f.size_bytes || 0), 0);
  const recents = research.recentDocuments.slice(0, 5);

  return (
    <aside className={`sidebarPanel ${isOpen ? "open" : "collapsed"}`}>
      <div className="sidebarHeader">
        <div className="sidebarTitle">
          <Layers size={16} />
          <span>Research Corpus</span>
        </div>
        {onClose && (
          <button className="iconButton small closeSidebarMobile" onClick={onClose} aria-label="Close sidebar">
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      <div className="sidebarScroll">
        {recents.length > 0 && (
          <div className="sidebarRecentSection" aria-label="Recently opened documents">
            <div className="sidebarRecentHeader">
              <History size={12} />
              <span>Recently opened</span>
            </div>
            <div className="sidebarRecentList">
              {recents.map((recent) => (
                <button
                  key={recent.id}
                  type="button"
                  className="sidebarRecentItem"
                  onClick={() => onOpenViewer?.({ fileName: recent.fileName })}
                  title={`Open ${recent.fileName}`}
                >
                  {RecentBadge(recent.fileName)}
                  <span className="sidebarRecentName">{recent.fileName}</span>
                  <ExternalLink size={10} className="sidebarRecentIcon" />
                </button>
              ))}
            </div>
          </div>
        )}

        <SourceLibrary
          filesState={filesState}
          selectedFile={selectedFile}
          onSelectFile={onSelectFile}
          onOpenViewer={onOpenViewer}
        />
      </div>

      <div className="sidebarFooter">
        <div className="sidebarStats">
          <div className="statItem">
            <Database size={13} />
            <span>{(filesState.files || []).length} sources · {formatBytes(totalSizeBytes)}</span>
          </div>
        </div>

        <div className="sidebarActionGrid">
          <Button
            variant="secondary"
            size="sm"
            className="w-full sessionBtn"
            onClick={chat.startNewSession}
          >
            <MessageSquarePlus size={15} />
            New Session
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="w-full textMuted"
            onClick={chat.clearSession}
            title="Purge session memory"
          >
            <Trash2 size={14} />
            Clear Memory
          </Button>
        </div>
      </div>
    </aside>
  );
}