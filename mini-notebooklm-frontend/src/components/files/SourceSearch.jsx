import { Search, X } from "lucide-react";

export default function SourceSearch({ query, onQueryChange, matchCount, totalCount }) {
  return (
    <div className="sourceSearchWrapper" role="search">
      <Search size={13} className="sourceSearchIcon" aria-hidden="true" />
      <input
        type="text"
        className="sourceSearchInput"
        placeholder="Filter sources by title..."
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        aria-label="Filter research sources"
      />
      {query ? (
        <button
          type="button"
          className="sourceSearchClear"
          onClick={() => onQueryChange("")}
          aria-label="Clear filter"
          title="Clear search filter"
        >
          <X size={12} />
        </button>
      ) : (
        <span className="sourceSearchCount" aria-live="polite">
          {totalCount}
        </span>
      )}
    </div>
  );
}
