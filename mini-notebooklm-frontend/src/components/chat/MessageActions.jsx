import { useState } from "react";
import { Check, Copy, RotateCw, NotebookPen, Lightbulb } from "lucide-react";
import { useResearch } from "../../context/ResearchContext.jsx";

export default function MessageActions({ content, onRegenerate, isAssistant, isError, sources = [] }) {
  const research = useResearch();
  const [copied, setCopied] = useState(false);
  const [noted, setNoted] = useState(false);
  const [insightSaved, setInsightSaved] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const sourceList = [...new Set((sources || []).map((s) => s.source).filter(Boolean))];

  const handleSaveToNotes = () => {
    if (!content) return;
    research.createNote({
      title: `AI answer — ${sourceList[0] ? `from ${sourceList[0]}` : "research conversation"}`,
      body: content,
      sourceFileName: sourceList.length === 1 ? sourceList[0] : null,
      excerpt: sourceList.length > 1 ? `Grounded in: ${sourceList.join(", ")}` : null,
    });
    research.openResearchPanel("notes");
    setNoted(true);
    window.setTimeout(() => setNoted(false), 2000);
  };

  const handleSaveAsInsight = () => {
    if (!content) return;
    // Preserve the actual answer plus the real source references from this
    // response. The original assistant message is never modified.
    const sourceReferences = (sources || [])
      .map((s) => ({
        fileName: s.source || null,
        chunkId: s.chunk_id ?? s.chunk_index ?? null,
        excerpt: s.text || s.excerpt || null,
        section: s.section || null,
      }))
      .filter((r) => r.fileName);
    research.createInsight({
      title: `Insight — ${sourceList[0] ? `from ${sourceList[0]}` : "AI answer"}`,
      body: content,
      sourceReferences,
    });
    research.openResearchPanel("insights");
    setInsightSaved(true);
    window.setTimeout(() => setInsightSaved(false), 2000);
  };

  return (
    <div className="messageActionToolbar" role="toolbar" aria-label="Message actions">
      {!isError && (
        <button
          type="button"
          className={`messageActionButton ${copied ? "copied" : ""}`}
          onClick={handleCopy}
          aria-label={copied ? "Copied markdown" : "Copy answer markdown"}
          title="Copy markdown"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      )}

      {isAssistant && !isError && (
        <button
          type="button"
          className={`messageActionButton ${noted ? "noted" : ""}`}
          onClick={handleSaveToNotes}
          aria-label="Save answer to notes"
          title="Save this answer to your research notes (local)"
        >
          {noted ? <Check size={13} /> : <NotebookPen size={13} />}
          <span>{noted ? "Saved to Notes" : "Save to Notes"}</span>
        </button>
      )}

      {isAssistant && !isError && (
        <button
          type="button"
          className={`messageActionButton ${insightSaved ? "saved" : ""}`}
          onClick={handleSaveAsInsight}
          aria-label="Save answer as insight"
          title="Save this answer as an insight with its source references (local)"
        >
          {insightSaved ? <Check size={13} /> : <Lightbulb size={13} />}
          <span>{insightSaved ? "Saved as Insight" : "Save as Insight"}</span>
        </button>
      )}

      {isAssistant && onRegenerate && (
        <button
          type="button"
          className="messageActionButton"
          onClick={onRegenerate}
          aria-label="Regenerate response"
          title="Regenerate response with same prompt"
        >
          <RotateCw size={13} />
          <span>{isError ? "Retry" : "Regenerate"}</span>
        </button>
      )}
    </div>
  );
}