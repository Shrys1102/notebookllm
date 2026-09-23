import { getFileExtension } from "../../utils/formatters.js";

const FILTER_TYPES = ["ALL", "PDF", "DOCX", "PPTX", "TXT"];

export default function SourceFilters({ files = [], activeFilter, onSelectFilter }) {
  // Calculate counts for each file type
  const counts = {
    ALL: files.length,
    PDF: files.filter((f) => getFileExtension(f.file_name).toLowerCase() === ".pdf").length,
    DOCX: files.filter((f) => getFileExtension(f.file_name).toLowerCase() === ".docx").length,
    PPTX: files.filter((f) => getFileExtension(f.file_name).toLowerCase() === ".pptx").length,
    TXT: files.filter((f) => getFileExtension(f.file_name).toLowerCase() === ".txt").length,
  };

  return (
    <div className="sourceFilterBar" role="tablist" aria-label="Filter documents by format">
      {FILTER_TYPES.map((type) => {
        const count = counts[type] || 0;
        const isActive = activeFilter === type;

        return (
          <button
            key={type}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`sourceFilterPill ${isActive ? "active" : ""} ${count === 0 ? "disabled" : ""}`}
            onClick={() => onSelectFilter(type)}
            disabled={count === 0 && type !== "ALL"}
          >
            <span className="sourceFilterLabel">{type}</span>
            <span className="sourceFilterCount">{count}</span>
          </button>
        );
      })}
    </div>
  );
}
