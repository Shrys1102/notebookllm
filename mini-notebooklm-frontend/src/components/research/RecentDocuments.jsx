import { History, ExternalLink, Trash2 } from "lucide-react";
import { useResearch } from "../../context/ResearchContext.jsx";
import Button from "../ui/Button.jsx";
import { formatDate, getFileExtension } from "../../utils/formatters.js";

function DocBadge(fileName = "") {
  const ext = getFileExtension(fileName).toLowerCase();
  if (ext === ".pdf") return <span className="docTypeIcon pdf">PDF</span>;
  if (ext === ".pptx") return <span className="docTypeIcon pptx">PPT</span>;
  if (ext === ".docx") return <span className="docTypeIcon docx">DOC</span>;
  return <span className="docTypeIcon txt">TXT</span>;
}

export default function RecentDocuments({ onOpenDocument, limit = 8 }) {
  const research = useResearch();
  const recent = research.recentDocuments.slice(0, limit);

  return (
    <div className="recentDocuments" aria-label="Recently opened documents">
      <div className="researchSectionHeader">
        <div className="researchSectionTitle">
          <History size={14} />
          <span>Recently Opened</span>
          <span className="researchCountBadge">{research.recentDocuments.length}</span>
        </div>
        {research.recentDocuments.length > 0 && (
          <Button variant="ghost" size="sm" onClick={research.clearHistory} title="Clear recent documents">
            <Trash2 size={12} />
            Clear
          </Button>
        )}
      </div>

      {recent.length === 0 ? (
        <div className="researchEmptyState">
          <History size={22} className="textMuted" />
          <strong>No recent documents</strong>
          <p>Open a source from the corpus or a chat citation and it will appear here for quick return.</p>
        </div>
      ) : (
        <div className="recentList">
          {recent.map((item) => (
            <button
              key={item.id}
              type="button"
              className="recentRow"
              onClick={() => onOpenDocument?.({ fileName: item.fileName, sizeBytes: item.sizeBytes, extension: item.extension, kind: item.kind })}
              title={`Open ${item.fileName}`}
            >
              {DocBadge(item.fileName)}
              <span className="recentName" title={item.fileName}>{item.fileName}</span>
              <span className="recentDate">{formatDate(item.openedAt)}</span>
              <ExternalLink size={11} className="recentOpenIcon" />
            </button>
          ))}
        </div>
      )}

      <div className="researchLocalNotice">
        <History size={11} />
        <span>Recent documents are tracked locally in your browser.</span>
      </div>
    </div>
  );
}