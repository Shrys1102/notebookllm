import { useEffect } from "react";
import { X, Layers, Database, Calendar, HardDrive, Trash2, CheckCircle, Sparkles, BookOpen, ExternalLink, FolderOpen } from "lucide-react";
import Button from "../ui/Button.jsx";
import CollectionPicker from "../research/CollectionPicker.jsx";
import { useResearch } from "../../context/ResearchContext.jsx";
import { formatBytes, formatDate, getFileExtension } from "../../utils/formatters.js";

export default function SourcePreview({
  file,
  isOpen,
  onClose,
  isSelected,
  onSelectScope,
  onOpenViewer,
  onDelete,
}) {
  const research = useResearch();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !file) return null;

  const ext = getFileExtension(file.file_name).toUpperCase().replace(".", "");

  const memberCollections = research.collections.filter((c) => c.members.sources.includes(file.file_name));
  const memberCollectionIds = memberCollections.map((c) => c.id);

  const toggleCollection = (collectionId) => {
    if (memberCollectionIds.includes(collectionId)) research.removeFromCollection(collectionId, "sources", file.file_name);
    else research.addToCollection(collectionId, "sources", file.file_name);
  };

  return (
    <div className="sourcePreviewOverlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Source Details">
      <div className="sourcePreviewModal" onClick={(e) => e.stopPropagation()}>
        <div className="sourcePreviewHeader">
          <div className="sourcePreviewTitleBlock">
            <div className="sourcePreviewIconBadge">
              <BookOpen size={18} />
            </div>
            <div>
              <strong className="sourcePreviewTitle">{file.file_name}</strong>
              <div className="sourcePreviewSub">
                <span>{ext || "DOCUMENT"}</span>
                <span>·</span>
                <span>{formatBytes(file.size_bytes)}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="sourcePreviewCloseBtn"
            onClick={onClose}
            aria-label="Close preview dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div className="sourcePreviewBody">
          <div className="sourceMetaGrid">
            <div className="sourceMetaBox">
              <div className="sourceMetaLabel">
                <Database size={13} />
                <span>Vector Index</span>
              </div>
              <strong className="textSuccess flex items-center gap-1">
                <CheckCircle size={14} /> Ready & Embedded
              </strong>
            </div>

            <div className="sourceMetaBox">
              <div className="sourceMetaLabel">
                <HardDrive size={13} />
                <span>Source Size</span>
              </div>
              <strong>{formatBytes(file.size_bytes)}</strong>
            </div>

            <div className="sourceMetaBox">
              <div className="sourceMetaLabel">
                <Calendar size={13} />
                <span>Indexed Date</span>
              </div>
              <strong>{formatDate(file.uploaded_at)}</strong>
            </div>

            <div className="sourceMetaBox">
              <div className="sourceMetaLabel">
                <Layers size={13} />
                <span>Research Scope</span>
              </div>
              <strong>{isSelected ? "Currently Active" : "In Corpus Pool"}</strong>
            </div>
          </div>

          <div className="sourceCollectionRow">
            <span className="sourceCollectionLabel">
              <FolderOpen size={12} />
              Organize:
            </span>
            <CollectionPicker value={memberCollectionIds} onToggle={toggleCollection} align="right" />
          </div>

          <div className="sourceCitationArchitectureCard">
            <div className="citationCardHeader">
              <Sparkles size={15} className="textPrimary" />
              <strong>Source Intelligence Surface</strong>
            </div>
            <p className="citationCardText">
              This document is indexed into ChromaDB vector collections. All questions submitted
              will query semantic embeddings across its chunked paragraphs to ground AI responses in verified evidence.
            </p>
            <div className="citationFutureNotice">
              <span>Ready for granular section lookup & citations</span>
            </div>
          </div>

          {onOpenViewer && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                onOpenViewer({
                  fileName: file.file_name,
                  file: file,
                });
                onClose();
              }}
              className="w-full"
            >
              <ExternalLink size={14} />
              <span>Open in Document Intelligence Viewer</span>
            </Button>
          )}
        </div>

        <div className="sourcePreviewFooter">
          <Button
            variant={isSelected ? "secondary" : "primary"}
            size="sm"
            onClick={() => {
              onSelectScope?.(isSelected ? null : file);
              onClose();
            }}
          >
            <Layers size={14} />
            <span>{isSelected ? "Switch to All Documents" : "Scope AI to This Source"}</span>
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              if (window.confirm(`Are you sure you want to delete ${file.file_name}?`)) {
                onDelete?.(file.file_name);
                onClose();
              }
            }}
          >
            <Trash2 size={14} />
            <span>Delete Source</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
