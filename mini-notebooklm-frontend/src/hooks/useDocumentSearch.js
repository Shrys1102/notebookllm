import { useCallback, useEffect, useMemo, useState } from "react";
import { useResearch } from "../context/ResearchContext.jsx";

function escapeRegExp(value = "") {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Real document search over available text content.
 *
 * - findMatches(text, query) → [{ start, end, text }]
 * - Returns 0 matches for empty queries (never fake results).
 * - Active match cycles forward/backward; scrolling is handled by the caller.
 */
export function findMatches(text = "", query = "") {
  const q = (query || "").trim();
  if (!q || !text) return [];
  const regex = new RegExp(escapeRegExp(q), "gi");
  const matches = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.push({ start: match.index, end: match.index + match[0].length, text: match[0] });
    // Guard against zero-length matches (should not happen with non-empty q).
    if (match[0].length === 0) regex.lastIndex += 1;
  }
  return matches;
}

export default function useDocumentSearch(text = "") {
  const { recordSearch } = useResearch();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const matches = useMemo(() => findMatches(text, query), [text, query]);
  const matchCount = matches.length;

  const goToMatch = useCallback(
    (index) => {
      if (!matches.length) return;
      const idx = ((index % matches.length) + matches.length) % matches.length;
      setActiveIndex(idx);
    },
    [matches.length]
  );

  const nextMatch = useCallback(() => goToMatch(activeIndex + 1), [activeIndex, goToMatch]);
  const prevMatch = useCallback(() => goToMatch(activeIndex - 1), [activeIndex, goToMatch]);

  const changeQuery = useCallback(
    (value) => {
      setQuery(value);
      setActiveIndex(0);
    },
    []
  );

  // Record searches in research history (debounced by change frequency).
  useEffect(() => {
    if (!query || !query.trim()) return;
    const timer = window.setTimeout(() => recordSearch(query), 800);
    return () => window.clearTimeout(timer);
  }, [query, recordSearch]);

  return {
    query,
    changeQuery,
    matches,
    matchCount,
    activeIndex,
    setActiveIndex,
    nextMatch,
    prevMatch,
    goToMatch,
    reset: () => changeQuery(""),
  };
}