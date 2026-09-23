import { useMemo, useState } from "react";
import {
  Lightbulb,
  Search,
  X,
  FileText,
  Pencil,
  Trash2,
  Download,
  Check,
  Copy,
  ExternalLink,
} from "lucide-react";
import { useResearch } from "../../context/ResearchContext.jsx";
import Button from "../ui/Button.jsx";
import CollectionPicker from "./CollectionPicker.jsx";
import { formatDate } from "../../utils/formatters.js";

function insightToMarkdown(insight) {
  const lines = [`# ${insight.title}`, ""];
  if (insight.sourceReferences?.length) {
    lines.push("**Sources**");
    for (const ref of insight.sourceReferences) {
      if (!ref.fileName) continue;
      const loc = [ref.pageNumber ? `p.${ref.pageNumber}` : null, ref.chunkId !== null && ref.chunkId !== undefined ? `chunk ${ref.chunkId + 1}` : null].filter(Boolean).join(", ");
      lines.push(`- ${ref.fileName}${loc ? ` (${loc})` : ""}`);
    }
    lines.push("");
  }
  lines.push(insight.body || "", "", `_Insight saved ${formatDate(insight.createdAt)}_`);
  return lines.join("\n");
}

export default function InsightLibrary({ onOpenDocument }) {
  const research = useResearch();
  const { insights, updateInsight, deleteInsight, addToCollection, removeFromCollection } = research;
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [editingId, setEditingId] = useState(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  const sourcesPresent = useMemo(() => {
    const set = new Set();
    for (const i of insights) for (const ref of i.sourceReferences || []) if (ref.fileName) set.add(ref.fileName);
    return [...set];
  }, [insights]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return insights.filter((i) => {
      const matchesQuery =
        !q ||
        i.title.toLowerCase().includes(q) ||
        (i.body || "").toLowerCase().includes(q) ||
        (i.sourceReferences || []).some((r) => r.fileName?.toLowerCase().includes(q));
      const matchesSource = sourceFilter === "ALL" || (i.sourceReferences || []).some((r) => r.fileName === sourceFilter);
      return matchesQuery && matchesSource;
    });
  }, [insights, query, sourceFilter]);

  const startEdit = (insight) => {
    setEditingId(insight.id);
    setDraftTitle(insight.title);
    setDraftBody(insight.body);
  };

  const saveEdit = () => {
    if (!editingId) return;
    updateInsight(editingId, { title: draftTitle.trim() || "Untitled insight", body: draftBody });
    setEditingId(null);
  };

  const downloadInsight = (insight) => {
    const blob = new Blob([insightToMarkdown(insight)], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${insight.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase().slice(0, 60) || "insight"}.md`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const copyInsight = async (insight) => {
    try {
      await navigator.clipboard.writeText(`${insight.title}\n\n${insight.body || ""}`);
      setCopiedId(insight.id);
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore
    }
  };

  const toggleCollection = (insightId, collectionId) => {
    const insight = insights.find((i) => i.id === insightId);
    if (!insight) return;
    if (insight.collectionIds.includes(collectionId)) removeFromCollection(collectionId, "insights", insightId);
    else addToCollection(collectionId, "insights", insightId);
  };

  return (
    <div className="insightLibrary" aria-label="Saved insights">
      <div className="researchSectionHeader">
        <div className="researchSectionTitle">
          <Lightbulb size={14} />
          <span>Insights</span>
          <span className="researchCountBadge">{insights.length}</span>
        </div>
      </div>

      {insights.length > 0 && (
        <div className="insightControls">
          <div className="insightSearchWrapper">
            <Search size={12} className="insightSearchIcon" />
            <input
              type="text"
              className="insightSearchInput"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search insights..."
              aria-label="Search insights"
            />
            {query && (
              <button type="button" className="insightSearchClear" onClick={() => setQuery("")} aria-label="Clear search">
                <X size={11} />
              </button>
            )}
          </div>
          {sourcesPresent.length > 1 && (
            <select
              className="insightFilterSelect"
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              aria-label="Filter insights by source"
            >
              <option value="ALL">All sources</option>
              {sourcesPresent.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}
        </div>
      )}

      {insights.length === 0 ? (
        <div className="researchEmptyState">
          <Lightbulb size={22} className="textMuted" />
          <strong>No saved insights yet</strong>
          <p>
            Save an AI answer, an evidence passage, or a note as an insight to capture the ideas that
            matter for your research. Insights keep the actual content plus their source references.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="researchEmptyState">
          <Search size={20} className="textMuted" />
          <strong>No insights match</strong>
          <p>Try a different search term or clear the source filter.</p>
        </div>
      ) : (
        <div className="insightList">
          {filtered.map((insight) => {
            const editing = editingId === insight.id;
            return (
              <article key={insight.id} className="insightCard">
                <div className="insightCardHeader">
                  {editing ? (
                    <input
                      className="insightEditTitle"
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                      placeholder="Insight title"
                      aria-label="Insight title"
                      autoFocus
                    />
                  ) : (
                    <strong className="insightCardTitle">{insight.title}</strong>
                  )}
                  <div className="insightCardActions">
                    <button type="button" className="iconButton small" onClick={() => copyInsight(insight)} title="Copy insight" aria-label="Copy insight">
                      {copiedId === insight.id ? <Check size={12} className="textSuccess" /> : <Copy size={12} />}
                    </button>
                    <button type="button" className="iconButton small" onClick={() => downloadInsight(insight)} title="Download as Markdown" aria-label="Download insight as Markdown">
                      <Download size={12} />
                    </button>
                    {editing ? (
                      <>
                        <button type="button" className="iconButton small" onClick={saveEdit} title="Save insight" aria-label="Save insight">
                          <Check size={12} className="textSuccess" />
                        </button>
                        <button type="button" className="iconButton small" onClick={() => setEditingId(null)} title="Cancel" aria-label="Cancel edit">
                          <X size={12} />
                        </button>
                      </>
                    ) : (
                      <button type="button" className="iconButton small" onClick={() => startEdit(insight)} title="Edit insight" aria-label="Edit insight">
                        <Pencil size={12} />
                      </button>
                    )}
                    <button type="button" className="iconButton small deleteBtn" onClick={() => deleteInsight(insight.id)} title="Delete insight" aria-label="Delete insight">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {editing ? (
                  <textarea
                    className="insightEditBody"
                    value={draftBody}
                    onChange={(e) => setDraftBody(e.target.value)}
                    placeholder="Insight body"
                    aria-label="Insight body"
                    rows={4}
                  />
                ) : (
                  insight.body && <p className="insightCardBody">{insight.body}</p>
                )}

                {insight.sourceReferences?.length > 0 && (
                  <div className="insightSourceRefs">
                    {insight.sourceReferences.map((ref, idx) => {
                      if (!ref.fileName) return null;
                      return (
                        <button
                          key={`${ref.fileName}-${idx}`}
                          type="button"
                          className="insightSourceChip"
                          onClick={() =>
                            onOpenDocument?.({
                              fileName: ref.fileName,
                              chunkId: ref.chunkId,
                              chunk_index: ref.chunkIndex,
                              excerpt: ref.excerpt,
                              pageNumber: ref.pageNumber,
                            })
                          }
                          title={`Open ${ref.fileName}`}
                        >
                          <FileText size={10} />
                          <span>{ref.fileName}</span>
                          {ref.pageNumber && <em>p.{ref.pageNumber}</em>}
                          {ref.chunkId !== null && ref.chunkId !== undefined && <em>c.{ref.chunkId + 1}</em>}
                          <ExternalLink size={9} />
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="insightCardFooter">
                  <CollectionPicker value={insight.collectionIds || []} onToggle={(cid) => toggleCollection(insight.id, cid)} />
                  <span className="insightCardDate">{formatDate(insight.updatedAt)}</span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="researchLocalNotice">
        <Lightbulb size={11} />
        <span>Insights are stored locally in your browser and are not synced to the server.</span>
      </div>
    </div>
  );
}