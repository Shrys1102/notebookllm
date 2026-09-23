import { useState } from "react";
import { Check, Info, Trash2, Eye, FileText } from "lucide-react";
import { formatBytes, formatDate, getFileExtension } from "../../utils/formatters.js";

function getFormatBadge(fileName) {
  const ext = getFileExtension(fileName).toLowerCase();
  if (ext === ".pdf") return <span className="docTypeIcon pdf">PDF</span>;
  if (ext === ".pptx") return <span className="docTypeIcon pptx">PPT</span>;
  if (ext === ".docx") return <span className="docTypeIcon docx">DOC</span>;
  return <span className="docTypeIcon txt">TXT</span>;
}

export default function SourceItem({
  file,
  isSelected,
  onSelect,
  onOpenPreview,
  onDelete,
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await onDelete(file.file_name);
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePreview = (e) => {
    e.stopPropagation();
    onOpenPreview?.(file);
  };

  return (
    <div
      className={`sourceRowItem ${isSelected ? "selected" : ""}`}
      onClick={() => onSelect(file)}
      role="button"
      tabIndex={0}
      aria-selected={isSelected}
      aria-label={`Source ${file.file_name}, ${formatBytes(file.size_bytes)}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(file);
        }
      }}
    >
      <div className="sourceRowLeft">
        {getFormatBadge(file.file_name)}
        <div className="sourceRowMeta">
          <strong className="sourceRowTitle" title={file.file_name}>
            {file.file_name}
          </strong>
          <div className="sourceRowSub">
            <span>{formatBytes(file.size_bytes)}</span>
            <span className="sourceDotDivider">·</span>
            <span>{formatDate(file.uploaded_at)}</span>
          </div>
        </div>
      </div>

      <div className="sourceRowRight">
        <span className="sourceStatusBadge ready" title="Indexed and ready for retrieval">
          READY
        </span>

        {isSelected && (
          <span className="sourceSelectedCheck" title="Active research scope" aria-label="Active research scope">
            <Check size={14} />
          </span>
        )}

        <div className="sourceActionButtons">
          <button
            type="button"
            className="sourceActionBtn"
            onClick={handlePreview}
            title="Inspect source details & preview"
            aria-label={`Preview ${file.file_name}`}
          >
            <Eye size={13} />
          </button>
          <button
            type="button"
            className="sourceActionBtn deleteBtn"
            onClick={handleDelete}
            disabled={isDeleting}
            title={`Delete ${file.file_name}`}
            aria-label={`Delete ${file.file_name}`}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
