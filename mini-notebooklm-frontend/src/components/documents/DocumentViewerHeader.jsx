import { X, FileText, Search, PanelRightOpen, PanelRightClose, Layers, Check, Info, Focus, Bookmark, BookmarkCheck } from "lucide-react";
import Button from "../ui/Button.jsx";
import { formatBytes, getFileExtension } from "../../utils/formatters.js";

/**
 * Research-oriented document header.
 * Displays only what exists: file icon, name, type, size, citation context,
 * and the actions needed to work with the document.
 */
export default function DocumentViewerHeader({
  file,
  citation,
  isScoped,
  onToggleScope,
  isSearchOpen,
  onToggleSearch,
  isEvidencePanelOpen,
  hasEvidence,
  onToggleEvidencePanel,
  focusMode,
  onToggleFocusMode,
  isBookmarked,
  onToggleBookmark,
  onOpenInfo,
  onClose,
}) {
  const fileName = citation?.fileName || file?.file_name || "Document";
  const ext = getFileExtension(fileName).toUpperCase().replace(".", "") || "DOC";
  const sizeFormatted = file?.size_bytes ? formatBytes(file.size_bytes) : null;
  const chunkNumber = citation?.chunkId !== null && citation?.chunkId !== undefined
    ? citation.chunkId + 1
    : citation?.chunk_index !== undefined && citation?.chunk_index !== null && citation?.chunk_index !== -1
      ? citation.chunk_index + 1
      : null;

  return (
    <div className="docViewerHeader">
      <div className="docViewerHeaderLeft">
        <div className={`docTypeIcon ${ext.toLowerCase()}`}>{ext.slice(0, 4)}</div>
        <div className="docViewerTitleBlock">
          <div className="docViewerTitleRow">
            <h2 className="docViewerTitle" title={fileName}>
              {fileName}
            </h2>
            {chunkNumber && (
              <span className="citationReferenceBadge" title={`Citation chunk ${chunkNumber}`}>
                Chunk #{chunkNumber}
              </span>
            )}
            {citation?.pageNumber && <span className="citationReferenceBadge">Page {citation.pageNumber}</span>}
          </div>
          <div className="docViewerSubRow">
            <span>{ext} Document</span>
            {sizeFormatted && (
              <>
                <span className="docDotDivider">·</span>
                <span>{sizeFormatted}</span>
              </>
            )}
            <span className="docDotDivider">·</span>
            <span className="docViewerStatusReady">Vector Indexed</span>
          </div>
        </div>
      </div>

      <div className="docViewerHeaderRight">
        {!focusMode && onToggleScope && (
          <button
            type="button"
            className={`docScopeToggleBtn ${isScoped ? "scoped" : ""}`}
            onClick={onToggleScope}
            title={isScoped ? "Currently active research scope" : "Set as exclusive research scope"}
          >
            <Layers size={13} />
            <span>{isScoped ? "Active Scope" : "Scope AI"}</span>
            {isScoped && <Check size={12} />}
          </button>
        )}

        {!focusMode && (
          <button
            type="button"
            className={`docViewerActionBtn ${isSearchOpen ? "active" : ""}`}
            onClick={onToggleSearch}
            title="Search in document (Ctrl+F)"
            aria-label="Search inside document"
          >
            <Search size={15} />
          </button>
        )}

        <button
          type="button"
          className={`docViewerActionBtn ${focusMode ? "active" : ""}`}
          onClick={onToggleFocusMode}
          title={focusMode ? "Exit focus mode (Esc)" : "Enter focus mode (Alt+F)"}
          aria-label={focusMode ? "Exit focus mode" : "Enter focus mode"}
        >
          <Focus size={15} />
        </button>

        {!focusMode && (
          <button
            type="button"
            className={`docViewerActionBtn ${isBookmarked ? "active" : ""}`}
            onClick={onToggleBookmark}
            title={isBookmarked ? "Remove bookmark" : "Bookmark source"}
            aria-label={isBookmarked ? "Remove bookmark" : "Bookmark source"}
          >
            {isBookmarked ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
          </button>
        )}

        {!focusMode && (
          <button
            type="button"
            className="docViewerActionBtn"
            onClick={onOpenInfo}
            title="Document information"
            aria-label="Document information"
          >
            <Info size={15} />
          </button>
        )}

        {!focusMode && hasEvidence && (
          <button
            type="button"
            className={`docViewerActionBtn ${isEvidencePanelOpen ? "active" : ""}`}
            onClick={onToggleEvidencePanel}
            title={isEvidencePanelOpen ? "Hide cited evidence panel" : "Show cited evidence panel"}
            aria-label="Toggle evidence sidebar"
          >
            {isEvidencePanelOpen ? <PanelRightClose size={15} /> : <PanelRightOpen size={15} />}
          </button>
        )}

        <div className="docViewerHeaderDivider" />

        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="docViewerCloseBtn"
          aria-label="Close document viewer (Escape)"
          title="Close viewer (Esc)"
        >
          <X size={18} />
        </Button>
      </div>
    </div>
  );
}