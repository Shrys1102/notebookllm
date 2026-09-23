import { ExternalLink, FileText } from "lucide-react";
import { useResearch } from "../../context/ResearchContext.jsx";
import { normalizeCitation } from "../../utils/documentModel.js";

/**
 * Reusable citation chip.
 *
 * Renders what is actually known about a source:
 *   [1] paper.pdf · p.3   or   [1] paper.pdf · c.2
 * Fields are optional — absent metadata is simply not rendered.
 */
export default function Citation({ target, sourceIndex, className = "", label }) {
  const { openDocumentViewer } = useResearch();
  if (!target) return null;

  const citation = normalizeCitation(target);
  const fileName = citation.fileName || "Source Document";
  const chunkNumber = citation.chunkId !== null && citation.chunkId !== undefined
    ? citation.chunkId + 1
    : citation.chunkIndex !== undefined && citation.chunkIndex !== null && citation.chunkIndex !== -1
      ? citation.chunkIndex + 1
      : null;

  const handleClick = (e) => {
    e.stopPropagation();
    openDocumentViewer({ ...target, sourceIndex });
  };

  return (
    <button
      type="button"
      className={`citationTargetBadge ${className}`}
      onClick={handleClick}
      title={`Open ${fileName} in Document Intelligence Viewer`}
      aria-label={`Open citation ${sourceIndex !== undefined ? `[${sourceIndex + 1}]` : ""} from ${fileName}`}
    >
      <span className="citationNumber">
        {sourceIndex !== undefined ? `[${sourceIndex + 1}]` : <FileText size={11} />}
      </span>
      <span className="citationDocName">{label || fileName}</span>
      {citation.pageNumber && <span className="citationPageInfo">p.{citation.pageNumber}</span>}
      {!citation.pageNumber && chunkNumber && <span className="citationPageInfo">c.{chunkNumber}</span>}
      <ExternalLink size={10} className="citationLinkIcon" />
    </button>
  );
}