import { Search, ChevronUp, ChevronDown, X, SearchX } from "lucide-react";

/**
 * Document search. Real match counts come from the caller's search engine;
 * when no content exists the bar is disabled with an honest reason.
 */
export default function DocumentSearch({
  searchQuery,
  onSearchChange,
  matchCount = 0,
  currentMatchIndex = 0,
  onPrevMatch,
  onNextMatch,
  onClose,
  disabled = false,
  disabledReason = "Search is unavailable — no document content is exposed by the API for this file.",
}) {
  return (
    <div className={`docSearchBar ${disabled ? "disabled" : ""}`} role="search">
      <div className="docSearchInputWrapper">
        <Search size={14} className="docSearchIcon" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (e.shiftKey) onPrevMatch?.();
              else onNextMatch?.();
            } else if (e.key === "Escape") {
              onClose?.();
            }
          }}
          placeholder={disabled ? "Search unavailable" : "Find in document..."}
          className="docSearchInput"
          autoFocus
          disabled={disabled}
          aria-label="Search inside document"
        />
        {searchQuery && !disabled && (
          <button
            type="button"
            className="docSearchClearBtn"
            onClick={() => onSearchChange("")}
            aria-label="Clear search"
          >
            <X size={13} />
          </button>
        )}
      </div>

      <div className="docSearchResultsMeta" aria-live="polite">
        {disabled ? (
          <span className="docSearchUnavailableText">
            <SearchX size={12} />
            Unavailable
          </span>
        ) : searchQuery ? (
          matchCount > 0 ? (
            <span className="docSearchMatchText">
              {currentMatchIndex + 1} of {matchCount}
            </span>
          ) : (
            <span className="docSearchNoMatchText">No matches</span>
          )
        ) : (
          <span className="docSearchHintText">Press Enter to cycle</span>
        )}
      </div>

      <div className="docSearchActionBtns">
        <button
          type="button"
          className="docSearchNavBtn"
          onClick={onPrevMatch}
          disabled={disabled || matchCount === 0}
          title="Previous match (Shift+Enter)"
          aria-label="Previous match"
        >
          <ChevronUp size={14} />
        </button>
        <button
          type="button"
          className="docSearchNavBtn"
          onClick={onNextMatch}
          disabled={disabled || matchCount === 0}
          title="Next match (Enter)"
          aria-label="Next match"
        >
          <ChevronDown size={14} />
        </button>
        <button type="button" className="docSearchCloseBtn" onClick={onClose} title="Close search" aria-label="Close search">
          <X size={14} />
        </button>
      </div>

      {disabled && <div className="docSearchDisabledHint">{disabledReason}</div>}
    </div>
  );
}