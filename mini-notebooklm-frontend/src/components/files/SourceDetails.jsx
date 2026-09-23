import { Database, FileText, HardDrive, Calendar, Trash2, Layers, Sparkles, Map, AudioLines, ExternalLink } from "lucide-react";
import Button from "../ui/Button.jsx";
import { formatBytes, formatDate, getFileExtension } from "../../utils/formatters.js";

export default function SourceDetails({
  file,
  isSelected,
  onSelectScope,
  onOpenPreview,
  onOpenViewer,
  onDelete,
}) {
  if (!file) return null;

  const ext = getFileExtension(file.file_name).toUpperCase().replace(".", "");

  return (
    <div className="sourceDetailsCard" aria-label={`Details for ${file.file_name}`}>
      <div className="sourceDetailsHeader">
        <div className="sourceDetailsIcon">
          <FileText size={16} />
        </div>
        <div className="sourceDetailsTitleBlock">
          <strong className="sourceDetailsName" title={file.file_name}>
            {file.file_name}
          </strong>
          <span className="sourceDetailsFormat">
            {ext} · {formatBytes(file.size_bytes)}
          </span>
        </div>
      </div>

      <div className="sourceDetailsStats">
        <div className="sourceDetailStat">
          <Database size={12} className="textSuccess" />
          <span>Status: <strong>Indexed (Ready)</strong></span>
        </div>
        <div className="sourceDetailStat">
          <Calendar size={12} />
          <span>Uploaded: <strong>{formatDate(file.uploaded_at)}</strong></span>
        </div>
      </div>

      <div className="sourceDetailsActions">
        <Button
          variant={isSelected ? "secondary" : "primary"}
          size="sm"
          onClick={() => onSelectScope?.(isSelected ? null : file)}
          className="w-full"
        >
          <Layers size={13} />
          <span>{isSelected ? "Scoped (Click to reset)" : "Scope AI to this Source"}</span>
        </Button>

        {onOpenViewer && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onOpenViewer({ fileName: file.file_name, file })}
            className="w-full"
          >
            <ExternalLink size={13} />
            <span>Open in Document Viewer</span>
          </Button>
        )}

        {onOpenPreview && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenPreview(file)}
            className="w-full textMuted"
          >
            <span>Inspect Metadata</span>
          </Button>
        )}
      </div>
    </div>
  );
}
