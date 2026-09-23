import { useMemo } from "react";
import { FileText, ShieldAlert, Sparkles, Info } from "lucide-react";
import { formatBytes } from "../../utils/formatters.js";
import HighlightLayer from "./HighlightLayer.jsx";

/**
 * PDF intelligence surface.
 *
 * The current backend does NOT expose original PDF files to the browser
 * (no content/download endpoint), so real page rendering is impossible today.
 * This state is honest about that and still shows real retrieved passages
 * when a citation exists. Page navigation will activate the moment the
 * backend serves PDF bytes (see DocumentNavigation — it already handles
 * real page metadata).
 */
export default function PdfViewer({ file, citation, zoom = 100, fitWidth = false, search = null }) {
  const fileName = citation?.fileName || file?.file_name || "Document.pdf";
  const sizeFormatted = file?.size_bytes ? formatBytes(file.size_bytes) : null;
  const excerpt = citation?.excerpt || citation?.preview || null;

  const matchRanges = useMemo(() => {
    if (!search?.matches?.length) return [];
    return search.matches.map((m) => ({ start: m.start, end: m.end, className: "docSearchHighlight" }));
  }, [search]);

  return (
    <div className="pdfViewerContainer" style={{ zoom: `${zoom / 100}` }}>
      <div className="pdfHonestState">
        <div className="pdfHonestIcon">
          <ShieldAlert size={24} />
        </div>
        <h3>PDF preview unavailable</h3>
        <p>
          The backend API does not expose the original PDF file to the browser, so page rendering
          is not possible in this build. The document <strong>{fileName}</strong>
          {sizeFormatted ? ` (${sizeFormatted})` : ""} is fully indexed: Aura searches its text and
          grounds answers in real retrieved passages.
        </p>
        <div className="pdfHonestNote">
          <Info size={13} />
          <span>Page navigation, zoom, and highlight coordinates will activate when the backend streams PDF content.</span>
        </div>
      </div>

      {excerpt ? (
        <div className="pdfCitedChunkCard">
          <div className="pdfCitedChunkHeader">
            <div className="pdfCitedLabel">
              <Sparkles size={14} className="textPrimary" />
              <span>Active Cited Passage{citation?.chunkId !== null && citation?.chunkId !== undefined ? ` (Chunk #${citation.chunkId + 1})` : ""}</span>
            </div>
            <span className="pdfHighlightBadge">Retrieved by retrieval engine</span>
          </div>
          <div className="pdfCitedPassageContent">
            <p className="pdfPassageText">
              <HighlightLayer text={excerpt} ranges={matchRanges} />
            </p>
          </div>
        </div>
      ) : (
        <div className="pdfNoCitationNote">
          <FileText size={14} />
          <span>Open this document from a chat citation to see the retrieved passage here.</span>
        </div>
      )}
    </div>
  );
}