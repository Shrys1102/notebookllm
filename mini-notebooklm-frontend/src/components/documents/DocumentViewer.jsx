import { useCallback, useEffect, useMemo, useRef } from "react";
import DocumentViewerHeader from "./DocumentViewerHeader.jsx";
import DocumentTabs from "./DocumentTabs.jsx";
import DocumentNavigation from "./DocumentNavigation.jsx";
import DocumentSearch from "./DocumentSearch.jsx";
import DocumentContent from "./DocumentContent.jsx";
import EvidencePanel from "./EvidencePanel.jsx";
import DocumentError from "./DocumentError.jsx";
import DocumentInfo from "./DocumentInfo.jsx";
import { useResearch, VIEWER_STATUS } from "../../context/ResearchContext.jsx";
import useDocumentSearch from "../../hooks/useDocumentSearch.js";
import useKeyboardShortcuts from "../../hooks/useKeyboardShortcuts.js";
import { normalizeFile } from "../../utils/documentModel.js";

/**
 * Document Intelligence viewer — a coherent workspace state:
 *
 *   CLOSED → OPENING → LOADING → READY | ERROR | UNSUPPORTED
 *
 * No scattered booleans; every phase of the state machine is explicit.
 * Includes: document tabs, focus mode, resizable evidence split, real
 * in-document search, honest error/unsupported states, and an info panel.
 */
export default function DocumentViewer({ files = [], isScoped = false, onToggleScope }) {
  const research = useResearch();
  const {
    viewerStatus,
    viewerOpen,
    viewerError,
    openTargets,
    activeTargetId,
    activeCitation,
    activateTab,
    closeTab,
    closeViewer,
    markViewerResolved,
    markViewerLoading,
    markViewerError,
    zoom,
    setZoom,
    fitWidth,
    setFitWidth,
    searchOpen,
    setSearchOpen,
    infoOpen,
    setInfoOpen,
    evidenceWidth,
    setEvidenceWidth,
    focusMode,
    setFocusMode,
    evidenceOpen,
    setEvidenceOpen,
    toggleBookmark,
    isBookmarked,
  } = research;

  const overlayRef = useRef(null);
  const restoreFocusRef = useRef(null);

  // Resolve the file record for the active citation.
  const resolvedFile = useMemo(() => {
    if (!activeCitation) return null;
    if (activeCitation.file) return normalizeFile(activeCitation.file);
    return normalizeFile(files.find((f) => f.file_name === activeCitation.fileName) || {});
  }, [activeCitation, files]);

  // OPENING → LOADING → READY / ERROR resolution pass.
  // The OPENING branch only advances the machine to LOADING; the LOADING
  // branch performs the actual (sync today, async in the future) resolution.
  useEffect(() => {
    if (viewerStatus === VIEWER_STATUS.OPENING) {
      markViewerLoading();
      return undefined;
    }
    if (viewerStatus !== VIEWER_STATUS.LOADING) return undefined;
    const timer = window.setTimeout(() => {
      if (!activeCitation || !activeCitation.fileName) {
        markViewerError({ title: "No document selected", message: "This citation does not reference a document." });
        return;
      }
      if (resolvedFile?.fileName) {
        markViewerResolved(resolvedFile);
      } else {
        markViewerError({
          title: "Document unavailable",
          message: `"${activeCitation.fileName}" was not found in your source library. It may have been deleted. Re-upload it to keep working with this document.`,
        });
      }
    }, 60);
    return () => window.clearTimeout(timer);
  }, [viewerStatus, activeCitation, resolvedFile, markViewerLoading, markViewerResolved, markViewerError]);

  // Focus management: save trigger, trap Tab, restore on close.
  useEffect(() => {
    if (!viewerOpen) return undefined;
    restoreFocusRef.current = document.activeElement;
    overlayRef.current?.focus?.();

    const trap = (e) => {
      if (e.key !== "Tab") return;
      const overlay = overlayRef.current;
      if (!overlay) return;
      const focusables = overlay.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => {
      document.removeEventListener("keydown", trap);
      restoreFocusRef.current?.focus?.();
    };
  }, [viewerOpen]);

  // Keyboard: Esc hierarchy, Ctrl+F, Alt+E evidence, Alt+F focus.
  const bindings = useMemo(() => {
    const list = [];
    if (viewerOpen) {
      list.push({
        keys: "escape",
        description: "Close search / exit focus / close viewer",
        onKeyDown: () => {
          if (searchOpen) setSearchOpen(false);
          else if (focusMode) setFocusMode(false);
          else closeViewer();
        },
      });
      list.push({
        keys: "ctrl+f",
        description: "Toggle search",
        onKeyDown: () => setSearchOpen((v) => !v),
      });
      list.push({
        keys: "alt+e",
        description: "Toggle evidence panel",
        onKeyDown: () => setEvidenceOpen((v) => !v),
      });
      list.push({
        keys: "alt+f",
        description: "Toggle focus mode",
        onKeyDown: () => setFocusMode((v) => !v),
      });
    }
    return list;
  }, [viewerOpen, searchOpen, focusMode, setSearchOpen, setFocusMode, setEvidenceOpen, closeViewer]);

  useKeyboardShortcuts(bindings, true);

  // Real in-document search over the available text content.
  const contentText = activeCitation?.excerpt || activeCitation?.preview || "";
  const searchEngine = useDocumentSearch(contentText);
  const searchDisabled = !contentText.trim();

  // Reset search when switching documents.
  useEffect(() => {
    searchEngine.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTargetId]);

  useEffect(() => {
    if (!viewerOpen) setFocusMode(false);
  }, [viewerOpen, setFocusMode]);

  const retry = useCallback(() => {
    if (activeTargetId) activateTab(activeTargetId);
  }, [activeTargetId, activateTab]);

  // Evidence pane resize (pointer drag on the divider).
  const startResize = useCallback(
    (e) => {
      e.preventDefault();
      const overlay = overlayRef.current;
      if (!overlay) return;
      const onMove = (ev) => {
        const right = overlay.getBoundingClientRect().right;
        const width = Math.max(280, Math.min(620, right - ev.clientX));
        setEvidenceWidth(width);
      };
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [setEvidenceWidth]
  );

  if (!viewerOpen) return null;

  const hasEvidence = Boolean(activeCitation?.excerpt || activeCitation?.preview);
  const isLoading = viewerStatus === VIEWER_STATUS.OPENING || viewerStatus === VIEWER_STATUS.LOADING;
  const fileName = activeCitation?.fileName || resolvedFile?.fileName || "Document";

  return (
    <div
      className={`docViewerOverlay ${focusMode ? "focusMode" : ""} ${isLoading ? "loading" : ""} ${viewerStatus === VIEWER_STATUS.ERROR ? "error" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Document Intelligence Viewer"
      ref={overlayRef}
      tabIndex={-1}
    >
      <div className="docViewerContainer">
        <DocumentViewerHeader
          file={resolvedFile}
          citation={activeCitation}
          isScoped={isScoped}
          onToggleScope={onToggleScope}
          isSearchOpen={searchOpen}
          onToggleSearch={() => setSearchOpen((v) => !v)}
          isEvidencePanelOpen={evidenceOpen}
          hasEvidence={hasEvidence}
          onToggleEvidencePanel={() => setEvidenceOpen((v) => !v)}
          focusMode={focusMode}
          onToggleFocusMode={() => setFocusMode((v) => !v)}
          isBookmarked={isBookmarked(fileName)}
          onToggleBookmark={() =>
            toggleBookmark({
              fileName,
              extension: resolvedFile?.extension || null,
              sizeBytes: resolvedFile?.sizeBytes ?? null,
            })
          }
          onOpenInfo={() => setInfoOpen(true)}
          onClose={closeViewer}
        />

        {!focusMode && (
          <DocumentTabs tabs={openTargets} activeId={activeTargetId} onActivate={activateTab} onCloseTab={closeTab} />
        )}

        {searchOpen && (
          <DocumentSearch
            searchQuery={searchEngine.query}
            onSearchChange={searchEngine.changeQuery}
            matchCount={searchEngine.matchCount}
            currentMatchIndex={searchEngine.activeIndex}
            onPrevMatch={searchEngine.prevMatch}
            onNextMatch={searchEngine.nextMatch}
            onClose={() => setSearchOpen(false)}
            disabled={searchDisabled}
          />
        )}

        <div className="docViewerBody">
          <div className="docViewerMainArea">
            {isLoading ? (
              <div className="docViewerLoadingState" role="status" aria-live="polite">
                <div className="docViewerLoadingSpinner" />
                <span>Opening {fileName}…</span>
              </div>
            ) : viewerStatus === VIEWER_STATUS.ERROR ? (
              <DocumentError
                title={viewerError?.title || "Document unavailable"}
                message={viewerError?.message || "This document could not be opened."}
                onRetry={retry}
                onClose={closeViewer}
              />
            ) : (
              <DocumentContent
                file={resolvedFile}
                citation={activeCitation}
                zoom={zoom}
                fitWidth={fitWidth}
                search={searchEngine}
              />
            )}

            {!isLoading && viewerStatus !== VIEWER_STATUS.ERROR && (
              <div className="docViewerNavWrapper">
                <DocumentNavigation
                  currentPage={research.currentPage}
                  totalPages={activeCitation?.pageCount ?? null}
                  onPageChange={research.setCurrentPage}
                  zoom={zoom}
                  onZoomChange={setZoom}
                  fitWidth={fitWidth}
                  onToggleFitWidth={setFitWidth}
                  currentChunk={activeCitation?.chunkId ?? null}
                  totalChunks={activeCitation?.chunkCount ?? null}
                />
              </div>
            )}
          </div>

          {evidenceOpen && hasEvidence && viewerStatus === VIEWER_STATUS.READY && (
            <aside className="docViewerEvidenceSidebar" style={{ width: `${evidenceWidth}px` }}>
              <div className="docViewerResizeHandle" onPointerDown={startResize} role="separator" aria-orientation="vertical" aria-label="Resize evidence panel" />
              <EvidencePanel
                citationTarget={activeCitation}
                onScopeToSource={onToggleScope}
                isScoped={isScoped}
                onClose={() => setEvidenceOpen(false)}
              />
            </aside>
          )}
        </div>

        {focusMode && (
          <button type="button" className="docFocusExitBar" onClick={() => setFocusMode(false)}>
            <span>Focus mode</span>
            <kbd>Esc</kbd> to exit
          </button>
        )}
      </div>

      {infoOpen && <DocumentInfo file={resolvedFile} onClose={() => setInfoOpen(false)} />}
    </div>
  );
}