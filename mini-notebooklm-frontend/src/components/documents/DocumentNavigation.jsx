import { useState } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, RotateCcw, Info } from "lucide-react";

/**
 * Document navigation.
 *
 * Page controls appear ONLY when real page information exists (totalPages > 0).
 * Without page metadata, an honest "no page metadata" label is shown instead of
 * fake page buttons. Zoom / fit-width controls always apply (they scale the
 * actual content area).
 */
export default function DocumentNavigation({
  currentPage = 1,
  totalPages = null,
  onPageChange,
  zoom = 100,
  onZoomChange,
  fitWidth = false,
  onToggleFitWidth,
  currentChunk = null,
  totalChunks = null,
}) {
  const [pageInput, setPageInput] = useState(String(currentPage));

  const hasPageInfo = totalPages !== null && totalPages > 0;
  const hasChunkInfo = totalChunks !== null && totalChunks > 0;

  const goToPage = (page) => {
    const clamped = Math.max(1, Math.min(page, hasPageInfo ? totalPages : page));
    onPageChange?.(clamped);
    setPageInput(String(clamped));
  };

  const handlePageSubmit = (e) => {
    e.preventDefault();
    const value = parseInt(pageInput, 10);
    if (Number.isNaN(value)) {
      setPageInput(String(currentPage));
      return;
    }
    goToPage(value);
  };

  return (
    <div className="docNavToolbar" role="toolbar" aria-label="Document Navigation">
      <div className="docNavPageGroup">
        {hasPageInfo ? (
          <>
            <button
              type="button"
              className="docNavBtn"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              aria-label="Previous Page"
              title="Previous Page"
            >
              <ChevronLeft size={16} />
            </button>

            <form className="docNavPageInputForm" onSubmit={handlePageSubmit} aria-label="Jump to page">
              <input
                className="docNavPageInput"
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                onBlur={() => setPageInput(String(currentPage))}
                inputMode="numeric"
                aria-label="Current page"
                title="Jump to page (Enter)"
              />
              <span className="docNavPageTotal">/ {totalPages}</span>
            </form>

            <button
              type="button"
              className="docNavBtn"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              aria-label="Next Page"
              title="Next Page"
            >
              <ChevronRight size={16} />
            </button>
          </>
        ) : hasChunkInfo ? (
          <span className="docNavNoPages" title="Chunk-level navigation (page metadata not provided by backend)">
            <Info size={12} />
            Chunk {currentChunk !== null ? currentChunk + 1 : 1} of {totalChunks}
          </span>
        ) : (
          <span className="docNavNoPages" title="The backend does not provide page or chunk metadata for this document">
            <Info size={12} />
            No page metadata
          </span>
        )}
      </div>

      <div className="docNavDivider" />

      <div className="docNavZoomGroup">
        <button
          type="button"
          className="docNavBtn"
          onClick={() => onZoomChange?.(Math.max(zoom - 15, 60))}
          disabled={zoom <= 60}
          aria-label="Zoom Out"
          title="Zoom Out"
        >
          <ZoomOut size={14} />
        </button>

        <span className="docNavZoomLevel" title="Current zoom">{zoom}%</span>

        <button
          type="button"
          className="docNavBtn"
          onClick={() => onZoomChange?.(Math.min(zoom + 15, 200))}
          disabled={zoom >= 200}
          aria-label="Zoom In"
          title="Zoom In"
        >
          <ZoomIn size={14} />
        </button>

        <button
          type="button"
          className={`docNavBtn ${fitWidth ? "active" : ""}`}
          onClick={() => onToggleFitWidth?.(!fitWidth)}
          title={fitWidth ? "Exit fit-width" : "Fit width"}
          aria-label="Fit width"
          aria-pressed={fitWidth}
        >
          <Maximize2 size={13} />
        </button>

        <button
          type="button"
          className="docNavBtn"
          onClick={() => {
            onZoomChange?.(100);
            onToggleFitWidth?.(false);
          }}
          title="Reset zoom (100%)"
          aria-label="Reset zoom"
        >
          <RotateCcw size={13} />
        </button>
      </div>
    </div>
  );
}