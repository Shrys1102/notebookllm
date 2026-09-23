import { useMemo } from "react";

/**
 * Highlight engine foundation.
 *
 * Concept:
 *   HighlightRange  →  DocumentRenderer  →  HighlightLayer
 *
 * Future backend metadata (characterOffsets / highlightRanges / boundingBoxes)
 * can plug straight into buildHighlightSegments. Today the layer renders:
 *   1. search match emphasis (real, computed from the actual text)
 *   2. active citation excerpt emphasis (real excerpt text)
 *
 * No fake coordinates are ever generated.
 */

/**
 * Build segments [{ text, isMatch }] from an array of ranges.
 * Ranges are { start, end, className? } — same shape future backend
 * character-offset metadata will use.
 */
export function buildHighlightSegments(text = "", ranges = []) {
  if (!text) return [{ text: "", isMatch: false }];
  if (!ranges || !ranges.length) return [{ text, isMatch: false }];

  const sorted = [...ranges]
    .filter((r) => typeof r.start === "number" && typeof r.end === "number" && r.start >= 0 && r.end > r.start)
    .sort((a, b) => a.start - b.start);

  const segments = [];
  let cursor = 0;
  for (const range of sorted) {
    if (range.start > cursor) segments.push({ text: text.slice(cursor, range.start), isMatch: false });
    segments.push({ text: text.slice(range.start, Math.min(range.end, text.length)), isMatch: true, className: range.className });
    cursor = Math.max(cursor, range.end);
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), isMatch: false });
  return segments.filter((s) => s.text.length > 0);
}

/**
 * Render segments as <mark>/<span> elements.
 * @param {Array<{start:number,end:number,className?:string}>} ranges
 */
export default function HighlightLayer({ text = "", ranges = [], className = "docSearchHighlight", renderText }) {
  const segments = useMemo(() => buildHighlightSegments(text, ranges), [text, ranges]);

  return (
    <>
      {segments.map((segment, i) =>
        segment.isMatch ? (
          <mark key={i} className={segment.className || className}>
            {renderText ? renderText(segment.text) : segment.text}
          </mark>
        ) : (
          <span key={i}>{segment.text}</span>
        )
      )}
    </>
  );
}