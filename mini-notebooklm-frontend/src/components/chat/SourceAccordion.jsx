import { useState } from "react";
import { ChevronDown, ChevronUp, Quote } from "lucide-react";
import EvidenceReference from "../citations/EvidenceReference.jsx";
import { normalizeCitation } from "../../utils/documentModel.js";

/**
 * Grounded-sources accordion for AI answers.
 * Built on the reusable citation architecture (EvidenceReference) so every
 * card supports: copy excerpt · save evidence · open in document viewer.
 */
export default function SourceAccordion({ sources = [], onOpenViewer }) {
  const [expanded, setExpanded] = useState(false);

  const list = Array.isArray(sources) ? sources.filter(Boolean) : [];
  if (!list.length) return null;

  const uniqueFiles = [...new Set(list.map((s) => normalizeCitation(s).fileName).filter(Boolean))];

  return (
    <div className="sourcesContainer" aria-label="Grounded research sources">
      <button
        type="button"
        className={`sourcesToggle ${expanded ? "expanded" : ""}`}
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-controls="grounded-sources-grid"
      >
        <div className="sourcesToggleLeft">
          <Quote size={13} className="sourcesIcon" />
          <span className="sourcesLabel">
            Grounded in <strong>{list.length} excerpt{list.length !== 1 ? "s" : ""}</strong> from{" "}
            <span className="sourceDocList">{uniqueFiles.join(", ")}</span>
          </span>
        </div>
        <div className="sourcesToggleRight">
          <span className="sourcesToggleActionText">{expanded ? "Hide evidence" : "View evidence"}</span>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {expanded && (
        <div id="grounded-sources-grid" className="sourcesGrid">
          {list.map((source, index) => (
            <EvidenceReference
              key={`${source.source}-${source.chunk_index ?? source.chunkId ?? index}-${index}`}
              target={source}
              sourceIndex={index}
              onOpenViewer={onOpenViewer}
            />
          ))}
        </div>
      )}
    </div>
  );
}