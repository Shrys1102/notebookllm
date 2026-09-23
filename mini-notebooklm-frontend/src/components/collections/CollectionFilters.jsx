import { Search, X, ArrowUpDown } from "lucide-react";

const SORT_OPTIONS = [
  { value: "updated", label: "Recently updated" },
  { value: "created", label: "Recently created" },
  { value: "name", label: "Alphabetical" },
];

/**
 * Library-level collection controls: live search plus a quiet sort menu.
 * No filter engine beyond this — the grid stays browsable.
 */
export default function CollectionFilters({ query, onQueryChange, sort, onSortChange, count }) {
  return (
    <div className="collectionFilters">
      <div className="collectionFilterSearch">
        <Search size={12} className="collectionFilterSearchIcon" />
        <input
          type="text"
          className="collectionFilterInput"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search collections…"
          aria-label="Search collections"
        />
        {query && (
          <button
            type="button"
            className="collectionFilterClear"
            onClick={() => onQueryChange("")}
            aria-label="Clear collection search"
          >
            <X size={11} />
          </button>
        )}
      </div>
      <div className="collectionFilterSort">
        <ArrowUpDown size={12} className="collectionFilterSortIcon" />
        <select
          className="collectionFilterSelect"
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          aria-label="Sort collections"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <span className="collectionFilterCount">{count}</span>
      </div>
    </div>
  );
}