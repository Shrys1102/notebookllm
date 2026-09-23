import { useEffect, useMemo, useRef } from "react";
import { FileText, SearchX, Sparkles } from "lucide-react";
import { formatBytes } from "../../utils/formatters.js";
import HighlightLayer from "./HighlightLayer.jsx";

/**
 * Real plaintext reading surface.
 *
 * Content comes from the backend only when a citation/excerpt is available —
 * the API does not expose full file text. When no content exists an honest
 * unavailable state is shown instead of placeholder text.
 */
export default function TextViewer({ file, citation, zoom = 100, fitWidth = false, search = null }) {
  const fileName = citation?.fileName || file?.file_name || "Document.txt";
  const sizeFormatted = file?.size_bytes ? formatBytes(file.size_bytes) : null;
  const excerpt = citation?.excerpt || citation?.preview || null;
  const contentRef = useRef(null);

  // Split into paragraphs while tracking exact global offsets so search-match
  // ranges map to each paragraph without inventing positions.
  const paragraphs = useMemo(() => {
    if (!excerpt) return [];
    const parts = [];
    const regex = /\n{2,}/g;
    let cursor = 0;
    let match;
    while ((match = regex.exec(excerpt)) !== null) {
      parts.push({ text: excerpt.slice(cursor, match.index), start: cursor });
      cursor = match.index + match[0].length;
    }
    parts.push({ text: excerpt.slice(cursor), start: cursor });
    return parts.filter((p) => p.text.trim()).map((p, i) => ({ ...p, id: i }));
  }, [excerpt]);

  const paragraphRanges = useMemo(() => {
    const ranges = search?.matches?.length ? search.matches.map((m) => ({ start: m.start, end: m.end })) : [];
    if (!ranges.length) return {};
    const map = {};
    for (const para of paragraphs) {
      const local = ranges
        .filter((r) => r.start >= para.start && r.end <= para.start + para.text.length)
        .map((r) => ({ start: r.start - para.start, end: r.end - para.start }));
      if (local.length) map[para.id] = local;
    }
    return map;
  }, [paragraphs, search]);

  // Scroll the active search match into view (marks render in global text order).
  useEffect(() => {
    if (!search || search.activeIndex === null || search.activeIndex === undefined || !contentRef.current) return;
    const marks = contentRef.current.querySelectorAll("mark.docSearchHighlight");
    const el = marks[search.activeIndex];
    if (el) el.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [search?.activeIndex, search?.matches?.length]);

  if (!excerpt) {
    return (
      <div className="textViewerContainer" style={{ zoom: `${zoom / 100}` }}>
        <div className="docContentUnavailable">
          <div className="docContentUnavailableIcon">
            <SearchX size={22} />
          </div>
          <h3>No document content available</h3>
          <p>
            The backend API does not expose the full text of <strong>{fileName}</strong> to the browser.
            The file is indexed and searchable — ask Aura a question or open this document from a
            citation to see the retrieved passages here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="textViewerContainer" style={{ zoom: `${zoom / 100}` }}>
      <div className={`textViewerPaper ${fitWidth ? "fitWidth" : ""}`}>
        <div className="textViewerHeader">
          <div className="textViewerDocInfo">
            <FileText size={16} className="textMuted" />
            <strong className="textViewerDocTitle">{fileName}</strong>
            {sizeFormatted && <span className="textViewerDocSize">({sizeFormatted})</span>}
          </div>
          <span className="textViewerStatus">Plaintext Corpus</span>
        </div>

        <div className="textViewerChunkBanner">
          <div className="textViewerChunkLabel">
            <Sparkles size={13} className="textPrimary" />
            <span>Retrieved Passage{citation?.chunkId !== null && citation?.chunkId !== undefined ? ` (Chunk #${citation.chunkId + 1})` : ""}</span>
          </div>
          <span className="textViewerChunkBadge">Real Content from Retrieval</span>
        </div>

        <div className="textViewerContentBlock" ref={contentRef}>
          {paragraphs.map((para) => (
            <p key={para.id} className="textViewerParagraph">
              <HighlightLayer
                text={para.text}
                ranges={paragraphRanges[para.id] || []}
                className="docSearchHighlight"
              />
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}