import { useState } from "react";
import { Check, Copy, ExternalLink, Bookmark, BookmarkCheck } from "lucide-react";
import { useResearch } from "../../context/ResearchContext.jsx";
import { normalizeCitation } from "../../utils/documentModel.js";
import { getFileExtension } from "../../utils/formatters.js";

function DocBadge(fileName = "") {
  const ext = getFileExtension(fileName).toLowerCase();
  if (ext === ".pdf") return <span className="docTypeIcon pdf">PDF</span>;
  if (ext === ".pptx") return <span className="docTypeIcon pptx">PPT</span>;
  if (ext === ".docx") return <span className="docTypeIcon docx">DOC</span>;
  return <span className="docTypeIcon txt">TXT</span>;
}

/**
 * First-class evidence reference. Renders only fields that exist.
 * Actions: copy excerpt · save evidence · open in document viewer.
 */
export default function EvidenceReference({
  target,
  sourceIndex,
  className = "",
  onOpenViewer,
}) {
  const research = useResearch();
  const [copied, setCopied] = useState(false);

  const citation = normalizeCitation(target);
  const excerpt = citation.excerpt || "";
  const chunkNumber = citation.chunkId !== null && citation.chunkId !== undefined
    ? citation.chunkId + 1
    : citation.chunkIndex !== undefined && citation.chunkIndex !== null && citation.chunkIndex !== -1
      ? citation.chunkIndex + 1
      : null;

  const saved = research.isEvidenceSaved(citation);

  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(excerpt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — do nothing
    }
  };

  const handleSave = (e) => {
    e.stopPropagation();
    research.saveEvidence(citation);
  };

  const handleOpen = (e) => {
    e.stopPropagation();
    if (onOpenViewer) onOpenViewer(citation);
    else research.openDocumentViewer(citation);
  };

  return (
    <div
      className={`evidenceReference ${className}`}
      role="button"
      tabIndex={0}
      aria-label={`Evidence ${sourceIndex !== undefined ? `[${sourceIndex + 1}] ` : ""}from ${citation.fileName}`}
      onClick={handleOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleOpen(e);
        }
      }}
    >
      <div className="evidenceReferenceHeader">
        <div className="evidenceReferenceDocInfo">
          {sourceIndex !== undefined && <span className="sourceNumberBadge">[{sourceIndex + 1}]</span>}
          {DocBadge(citation.fileName)}
          <span className="evidenceReferenceDocName" title={citation.fileName}>
            {citation.fileName || "Source Document"}
          </span>
        </div>
        <div className="evidenceReferenceMeta">
          {chunkNumber && <span className="sourceChunkBadge">Chunk #{chunkNumber}</span>}
          {citation.pageNumber && <span className="sourceChunkBadge">p.{citation.pageNumber}</span>}
          {citation.section && <span className="sourceChunkBadge" title={citation.section}>{citation.section}</span>}
        </div>
      </div>

      {excerpt && (
        <div className="evidenceReferenceExcerpt">
          <blockquote className="sourceExcerptQuote">"{excerpt}"</blockquote>
        </div>
      )}

      <div className="evidenceReferenceActions">
        <button
          type="button"
          className="evidenceRefAction"
          onClick={handleCopy}
          disabled={!excerpt}
          title={excerpt ? "Copy excerpt" : "No excerpt available"}
          aria-label={`Copy excerpt ${sourceIndex !== undefined ? sourceIndex + 1 : ""}`}
        >
          {copied ? <Check size={12} className="textSuccess" /> : <Copy size={12} />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
        <button
          type="button"
          className={`evidenceRefAction ${saved ? "saved" : ""}`}
          onClick={handleSave}
          disabled={!excerpt}
          title={saved ? "Evidence already saved" : "Save evidence to research library"}
          aria-label="Save evidence"
        >
          {saved ? <BookmarkCheck size={12} /> : <Bookmark size={12} />}
          <span>{saved ? "Saved" : "Save"}</span>
        </button>
        <span className="evidenceRefOpenLink">
          <ExternalLink size={11} />
          Open
        </span>
      </div>
    </div>
  );
}