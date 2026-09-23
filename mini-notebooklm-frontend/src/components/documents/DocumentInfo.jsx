import { Layers, X, Info } from "lucide-react";
import { normalizeFile } from "../../utils/documentModel.js";
import { formatBytes, formatDate } from "../../utils/formatters.js";

/**
 * Reusable metadata display. Only renders fields that exist on the
 * normalized file model — never fabricated page counts or chunk counts.
 */
export default function DocumentInfo({ file, onClose }) {
  const doc = normalizeFile(file || {});
  const fileName = doc.fileName || "Document";

  const rows = [
    { label: "Filename", value: fileName },
    { label: "Format", value: doc.extension?.replace(".", "").toUpperCase() || "Unknown" },
    { label: "Type", value: doc.mimeType || "application/octet-stream" },
    doc.sizeBytes ? { label: "Size", value: formatBytes(doc.sizeBytes) } : null,
    doc.uploadedAt ? { label: "Uploaded", value: formatDate(doc.uploadedAt) } : null,
    doc.pageCount ? { label: "Pages", value: String(doc.pageCount) } : null,
    doc.chunkCount ? { label: "Indexed chunks", value: String(doc.chunkCount) } : null,
    doc.documentId ? { label: "Document ID", value: String(doc.documentId) } : null,
  ].filter(Boolean);

  const hasFutureMetadata = !doc.pageCount && !doc.chunkCount && !doc.documentId;

  return (
    <div className="docInfoOverlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Document information">
      <div className="docInfoPanel" onClick={(e) => e.stopPropagation()}>
        <div className="docInfoHeader">
          <div className="docInfoTitle">
            <Info size={15} />
            <span>Document Information</span>
          </div>
          <button type="button" className="iconButton small" onClick={onClose} aria-label="Close document information">
            <X size={14} />
          </button>
        </div>

        <div className="docInfoIconRow">
          <div className="docTypeIcon lg">{doc.extension?.replace(".", "").toUpperCase().slice(0, 4) || "DOC"}</div>
          <div>
            <strong className="docInfoFileName">{fileName}</strong>
            <span className="docInfoStatus">Ready · Vector indexed</span>
          </div>
        </div>

        <dl className="docInfoRows">
          {rows.map((row) => (
            <div key={row.label} className="docInfoRow">
              <dt>{row.label}</dt>
              <dd title={row.value}>{row.value}</dd>
            </div>
          ))}
        </dl>

        {hasFutureMetadata && (
          <div className="docInfoFutureNote">
            <Layers size={12} />
            <span>Page count, sections, and highlight coordinates will appear here when the backend provides them.</span>
          </div>
        )}
      </div>
    </div>
  );
}