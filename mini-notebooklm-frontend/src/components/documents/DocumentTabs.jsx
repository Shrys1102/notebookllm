import { X, FileText } from "lucide-react";
import { getFileExtension } from "../../utils/formatters.js";

function TabIcon(fileName = "") {
  const ext = getFileExtension(fileName).toLowerCase();
  if (ext === ".pdf") return <span className="docTypeIcon pdf small">PDF</span>;
  if (ext === ".pptx") return <span className="docTypeIcon pptx small">PPT</span>;
  if (ext === ".docx") return <span className="docTypeIcon docx small">DOC</span>;
  return <span className="docTypeIcon txt small">TXT</span>;
}

/**
 * Lightweight workspace-level document tabs. Switching tabs preserves each
 * document's citation/evidence context — no full browser-like tab manager.
 */
export default function DocumentTabs({ tabs = [], activeId, onActivate, onCloseTab }) {
  if (!tabs.length) return null;

  return (
    <div className="docTabsBar" role="tablist" aria-label="Open research documents">
      {tabs.map((tab) => {
        const fileName = tab.citation?.fileName || "Document";
        const isActive = tab.id === activeId;
        return (
          <div
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            className={`docTab ${isActive ? "active" : ""}`}
            tabIndex={0}
            onClick={() => onActivate?.(tab.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onActivate?.(tab.id);
              }
            }}
            title={fileName}
          >
            {TabIcon(fileName)}
            <span className="docTabName">{fileName}</span>
            {tab.citation?.excerpt && <span className="docTabEvidenceDot" title="Has attached evidence" />}
            <button
              type="button"
              className="docTabClose"
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab?.(tab.id);
              }}
              aria-label={`Close ${fileName}`}
              title={`Close ${fileName}`}
            >
              <X size={11} />
            </button>
          </div>
        );
      })}
    </div>
  );
}