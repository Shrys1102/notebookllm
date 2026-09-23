import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  X,
  FileText,
  Quote,
  NotebookPen,
  Lightbulb,
  ExternalLink,
  FolderOpen,
  MessageCircleQuestion,
  Check,
  History,
} from "lucide-react";
import { useResearch } from "../../context/ResearchContext.jsx";
import { runActivityRestore } from "../../utils/timelineRestore.js";
import { activityMeta } from "../timeline/activityMeta.js";

const SCOPES = [
  { id: "all", label: "All", icon: Search },
  { id: "sources", label: "Sources", icon: FileText },
  { id: "questions", label: "Questions", icon: MessageCircleQuestion },
  { id: "evidence", label: "Evidence", icon: Quote },
  { id: "notes", label: "Notes", icon: NotebookPen },
  { id: "insights", label: "Insights", icon: Lightbulb },
  { id: "collections", label: "Collections", icon: FolderOpen },
  { id: "activity", label: "Activity", icon: History },
];

const GROUP_ORDER = ["sources", "questions", "evidence", "notes", "insights", "collections", "activity"];
const GROUP_LABELS = {
  sources: "Sources",
  questions: "Questions",
  evidence: "Saved Evidence",
  notes: "Notes",
  insights: "Insights",
  collections: "Collections",
  activity: "Timeline Activity",
};
const GROUP_ICONS = {
  sources: FileText,
  questions: MessageCircleQuestion,
  evidence: Quote,
  notes: NotebookPen,
  insights: Lightbulb,
  collections: FolderOpen,
  activity: History,
};

/**
 * Unified research search — one query box across sources, questions, saved
 * evidence, notes, insights, and collections. Only searches data that
 * actually exists locally; no fabricated results. Results are grouped by
 * object type, keyboard-navigable (↑/↓/Enter), and navigate to the actual
 * object (documents, evidence, or the collection workspace).
 */
export default function ResearchSearch({ files = [], onOpenDocument }) {
  const research = useResearch();
  const {
    savedEvidence,
    notes,
    insights,
    collections,
    history,
    events,
    recordSearch,
    openResearchPanel,
    researchSearchRequest,
    researchSearchScope,
    setResearchSearchScope,
    openCollection,
  } = research;
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState(researchSearchScope || "all");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // When the palette / shortcut asks for search focus, open and focus.
  useEffect(() => {
    if (researchSearchRequest > 0) {
      window.setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [researchSearchRequest]);

  // Follow scope requests (palette: Search Questions / Notes / Insights).
  useEffect(() => {
    if (researchSearchScope && researchSearchScope !== scope) setScope(researchSearchScope);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [researchSearchScope]);

  const q = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!q) return { groups: [], flat: [], total: 0 };
    const hit = (text = "") => (text || "").toLowerCase().includes(q);
    const pick = (id) => scope === "all" || scope === id;

    const sources = pick("sources")
      ? (files || []).filter((f) => hit(f.file_name)).map((f) => ({ type: "sources", id: `source-${f.file_name}`, fileName: f.file_name, sizeBytes: f.size_bytes }))
      : [];

    const questions = pick("questions")
      ? (history.questions || [])
          .filter((question) => hit(question.text))
          .map((question) => ({ type: "questions", id: question.id, question, title: question.text }))
      : [];

    const evidence = pick("evidence")
      ? (savedEvidence || [])
          .filter((e) => hit(e.fileName) || hit(e.excerpt))
          .map((e) => ({ type: "evidence", id: e.id, fileName: e.fileName, excerpt: e.excerpt }))
      : [];

    const noteResults = pick("notes")
      ? (notes || [])
          .filter((n) => hit(n.title) || hit(n.body) || hit(n.sourceFileName))
          .map((n) => ({ type: "notes", id: n.id, title: n.title, sourceFileName: n.sourceFileName, excerpt: n.body }))
      : [];

    const insightResults = pick("insights")
      ? (insights || [])
          .filter((i) => hit(i.title) || hit(i.body) || (i.sourceReferences || []).some((r) => hit(r.fileName)))
          .map((i) => ({ type: "insights", id: i.id, title: i.title, sourceFileName: (i.sourceReferences || []).map((r) => r.fileName).filter(Boolean).join(", ") || null, excerpt: i.body }))
      : [];

    const collectionResults = pick("collections")
      ? (collections || [])
          .filter((c) => hit(c.name) || hit(c.description))
          .map((c) => ({ type: "collections", id: c.id, title: c.name }))
      : [];

    const activityResults = pick("activity")
      ? (events || [])
          .slice(0, 150)
          .filter((e) => hit(e.title) || hit(e.description) || hit(e.fileName))
          .map((e) => ({ type: "activity", id: e.id, activity: e, title: e.title, excerpt: e.description }))
      : [];

    const byType = { sources, questions, evidence, notes: noteResults, insights: insightResults, collections: collectionResults, activity: activityResults };
    const groups = GROUP_ORDER.filter((t) => byType[t].length > 0).map((t) => ({ type: t, items: byType[t] }));
    const flat = groups.flatMap((g) => g.items);
    return { groups, flat, total: flat.length };
  }, [q, scope, files, savedEvidence, notes, insights, collections, history, events]);

  useEffect(() => {
    setActiveIndex(0);
    listRef.current?.querySelector('[data-result-index="0"]')?.scrollIntoView({ block: "nearest" });
  }, [q, scope]);

  const runResult = (item) => {
    if (item.type === "sources") onOpenDocument?.({ fileName: item.fileName });
    else if (item.type === "evidence") onOpenDocument?.({ fileName: item.fileName, excerpt: item.excerpt });
    else if (item.type === "collections") openCollection(item.id);
    else if (item.type === "notes") openResearchPanel("notes");
    else if (item.type === "insights") openResearchPanel("insights");
    else if (item.type === "questions") openResearchPanel("overview");
    else if (item.type === "activity") runActivityRestore(item.activity, { onOpenDocument, openCollection, openResearchPanel });
  };

  const activityLabel = (item) => {
    const meta = activityMeta(item.activity?.type);
    return `${meta.label} — ${item.title}`;
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % Math.max(results.flat.length, 1));
      listRef.current?.querySelector(`[data-result-index="${Math.min(activeIndex + 1, results.flat.length - 1)}"]`)?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = (activeIndex - 1 + results.flat.length) % Math.max(results.flat.length, 1);
      setActiveIndex(next);
      listRef.current?.querySelector(`[data-result-index="${next}"]`)?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter" && results.flat[activeIndex]) {
      e.preventDefault();
      runResult(results.flat[activeIndex]);
    } else if (e.key === "Escape" && query) {
      e.preventDefault();
      setQuery("");
    }
  };

  const clear = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  return (
    <div className="researchSearchSurface" aria-label="Search research workspace">
      <div className="researchSearchBar">
        <Search size={13} className="researchSearchIcon" />
        <input
          ref={inputRef}
          type="text"
          className="researchSearchInput"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.trim()) recordSearch(e.target.value);
          }}
          onKeyDown={onKeyDown}
          placeholder="Search sources, questions, evidence, notes, insights…"
          aria-label="Search research workspace"
        />
        {query && (
          <button type="button" className="researchSearchClear" onClick={clear} aria-label="Clear search">
            <X size={12} />
          </button>
        )}
      </div>

      <div className="researchSearchScopes" role="group" aria-label="Search scope">
        {SCOPES.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              type="button"
              className={`researchSearchScope ${scope === s.id ? "active" : ""}`}
              onClick={() => setScope(s.id)}
              aria-pressed={scope === s.id}
            >
              <Icon size={10} />
              {s.label}
            </button>
          );
        })}
      </div>

      {!q ? (
        <div className="researchEmptyState">
          <Search size={20} className="textMuted" />
          <strong>Search your research workspace</strong>
          <p>One query across sources, questions, saved evidence, notes, insights, and collections. Results show their type so you can jump straight to the right place. Use ↑/↓ and Enter to navigate.</p>
        </div>
      ) : results.total === 0 ? (
        <div className="researchEmptyState">
          <Search size={20} className="textMuted" />
          <strong>No results for &ldquo;{query}&rdquo;</strong>
          <p>Try a different term, widen the scope, or check the Sources tab — document bodies are searchable inside the document viewer.</p>
        </div>
      ) : (
        <div className="researchSearchResults" ref={listRef}>
          {results.groups.map((group) => {
            const GroupIcon = GROUP_ICONS[group.type];
            return (
              <div key={group.type} className="researchSearchGroup">
                <span className="researchSearchGroupLabel"><GroupIcon size={10} /> {GROUP_LABELS[group.type]}</span>
                {group.items.map((item, i) => {
                  const flatIndex = results.flat.indexOf(item);
                  return (
                    <button
                      key={`${item.type}-${item.id}`}
                      type="button"
                      data-result-index={flatIndex}
                      className={`researchSearchResult ${activeIndex === flatIndex ? "active" : ""}`}
                      onClick={() => runResult(item)}
                      onMouseEnter={() => setActiveIndex(flatIndex)}
                    >
                      <GroupIcon size={12} className="researchSearchResultIcon" />
                      <span className="researchSearchResultBody">
                        <strong className="researchSearchResultTitle">
                          {item.type === "activity" ? activityLabel(item) : item.type === "sources" ? item.fileName : item.title || item.fileName}
                        </strong>
                        {item.type === "activity" && <em className="researchSearchResultSource">{activityMeta(item.activity?.type).label}</em>}
                        {item.type === "questions" && (
                          <em className={`researchSearchResultSource questionStatus ${item.question?.status}`}>
                            {item.question?.status || "asked"} {item.question?.scope ? `· ${item.question.scope}` : ""}
                          </em>
                        )}
                        {item.sourceFileName && !item.excerpt && <em className="researchSearchResultSource">{item.sourceFileName}</em>}
                        {item.type === "questions" && item.question?.saved && <Check size={10} className="researchSearchResultSaved" />}
                        {item.excerpt && <em className="researchSearchResultExcerpt">{String(item.excerpt).slice(0, 140)}</em>}
                      </span>
                      <ExternalLink size={10} className="researchSearchResultOpen" />
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      <div className="researchLocalNotice">
        <Search size={11} />
        <span>Search covers locally available research data; document bodies are searchable inside the viewer. ↑/↓ navigate results, Enter opens.</span>
      </div>
    </div>
  );
}