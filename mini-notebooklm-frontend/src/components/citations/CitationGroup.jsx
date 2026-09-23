import Citation from "./Citation.jsx";

/**
 * Renders a compact row of citation chips for a set of sources.
 * Shows nothing when there are no sources (no fake citations).
 */
export default function CitationGroup({ sources = [], className = "", compact = false }) {
  const list = Array.isArray(sources) ? sources.filter(Boolean) : [];
  if (!list.length) return null;

  return (
    <div className={`citationGroup ${compact ? "compact" : ""} ${className}`} aria-label="Cited sources">
      {list.map((source, index) => (
        <Citation key={`${source.source}-${source.chunk_index ?? source.chunkId ?? index}-${index}`} target={source} sourceIndex={index} />
      ))}
    </div>
  );
}