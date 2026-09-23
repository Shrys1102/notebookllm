import { useMemo } from "react";
import { FileText, Database, Sparkles, HelpCircle } from "lucide-react";
import { formatBytes } from "../../utils/formatters.js";
import HighlightLayer from "./HighlightLayer.jsx";

const FORMAT_NOTES = {
  docx: {
    title: "DOCX structured rendering is in preparation",
    detail: "A structured document renderer for Word files will land with a future backend content API. Today the document's text is indexed and searchable through Aura.",
  },
  pptx: {
    title: "PPTX slide rendering is in preparation",
    detail: "A slide renderer for PowerPoint files will land with a future backend content API. Today the document's text is indexed and searchable through Aura.",
  },
};

/**
 * Honest unsupported/preview-unavailable state for formats without a renderer
 * (DOCX / PPTX). Shows the real retrieved passage when a citation exists.
 */
export default function UnsupportedDocument({ file, citation, zoom = 100, search = null }) {
  const fileName = citation?.fileName || file?.file_name || "Document";
  const ext = (citation?.kind || "") || (file?.file_name || "").split(".").pop()?.toLowerCase() || "doc";
  const sizeFormatted = file?.size_bytes ? formatBytes(file.size_bytes) : null;
  const excerpt = citation?.excerpt || citation?.preview || null;
  const notes = FORMAT_NOTES[ext] || {
    title: `Rendering for ${ext.toUpperCase()} is not implemented`,
    detail: "This format is indexed and searchable through Aura, but a browser renderer is not available yet.",
  };

  const matchRanges = useMemo(() => {
    if (!search?.matches?.length) return [];
    return search.matches.map((m) => ({ start: m.start, end: m.end, className: "docSearchHighlight" }));
  }, [search]);

  return (
    <div className="unsupportedDocContainer" style={{ zoom: `${zoom / 100}` }}>
      <div className="unsupportedDocCard">
        <div className="unsupportedDocIconBadge">
          <FileText size={26} />
        </div>
        <h3 className="unsupportedDocTitle">{fileName}</h3>
        <p className="unsupportedDocSub">
          {ext.toUpperCase()} File · {sizeFormatted || "Vector Ingested"}
        </p>

        <div className="unsupportedDocMetaList">
          <div className="unsupportedDocMetaItem">
            <Database size={13} className="textSuccess" />
            <span>Indexed for semantic search: <strong>Yes</strong></span>
          </div>
          <div className="unsupportedDocMetaItem">
            <Sparkles size={13} className="textPrimary" />
            <span>Browser renderer: <strong>Not available in this build</strong></span>
          </div>
        </div>

        {excerpt && (
          <div className="unsupportedDocExcerptBox">
            <strong className="unsupportedDocExcerptTitle">
              Retrieved Passage{citation?.chunkId !== null && citation?.chunkId !== undefined ? ` (Chunk #${citation.chunkId + 1})` : ""}:
            </strong>
            <blockquote className="unsupportedDocExcerptQuote">
              <HighlightLayer text={excerpt} ranges={matchRanges} />
            </blockquote>
          </div>
        )}

        <div className="unsupportedDocRoadmapNote">
          <HelpCircle size={14} className="textMuted" />
          <span>{notes.detail}</span>
        </div>
      </div>
    </div>
  );
}