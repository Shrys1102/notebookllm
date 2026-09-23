import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  FolderOpen,
  FileText,
  MessageCircleQuestion,
  Quote,
  NotebookPen,
  Lightbulb,
  X,
  ArrowLeft,
  Plus,
  ExternalLink,
  Pin,
  Link2,
  Sparkles,
} from "lucide-react";
import { useResearch } from "../../context/ResearchContext.jsx";
import { collectionAccentMeta } from "../../utils/researchModels.js";
import CollectionActions from "./CollectionActions.jsx";
import CollectionEmptyState from "./CollectionEmptyState.jsx";
import CollectionEditor from "./CollectionEditor.jsx";
import { formatDate } from "../../utils/formatters.js";

const MEMBER_TYPES = [
  { type: "sources", label: "Sources", icon: FileText, verb: "Link a source" },
  { type: "questions", label: "Questions", icon: MessageCircleQuestion, verb: "Link a question" },
  { type: "evidence", label: "Evidence", icon: Quote, verb: "Link evidence" },
  { type: "notes", label: "Notes", icon: NotebookPen, verb: "Link a note" },
  { type: "insights", label: "Insights", icon: Lightbulb, verb: "Link an insight" },
];

function memberLabel(type, entity) {
  if (type === "sources") return entity;
  if (type === "questions") return null; // rendered specially
  if (type === "evidence") {
    const chunk = entity.chunkId !== null && entity.chunkId !== undefined ? ` · chunk ${entity.chunkId + 1}` : "";
    return `${entity.fileName}${chunk}`;
  }
  return entity.title || "Untitled";
}

function memberSub(type, entity) {
  if (type === "notes") return entity.sourceFileName || null;
  if (type === "insights") {
    const refs = (entity.sourceReferences || []).map((r) => r.fileName).filter(Boolean);
    return refs.length ? refs.join(", ") : null;
  }
  return null;
}

/**
 * Collection detail — entering a collection feels like entering a research
 * workspace. Rendered in a portal above the three-pane dashboard: layered
 * hero, live object counts, and grouped member sections (Questions,
 * Insights, Sources, Notes, Evidence) with one-click linking/removal.
 * Relationships are stored as IDs only; nothing here deletes objects.
 */
export default function CollectionDetail({ files = [], onOpenDocument }) {
  const research = useResearch();
  const {
    openCollectionId,
    collections,
    closeCollection,
    notes,
    insights,
    savedEvidence,
    history,
    addToCollection,
    removeFromCollection,
    updateCollection,
    deleteCollection,
    setActiveCollection,
    activeCollectionId,
    openResearchPanel,
    toggleCollectionPinned,
    toggleQuestionSaved,
  } = research;

  const collection = collections.find((c) => c.id === openCollectionId) || null;
  const [adding, setAdding] = useState(null);
  const [editing, setEditing] = useState(false);
  const closeRef = useRef(null);
  const restoreFocusRef = useRef(null);

  useEffect(() => {
    if (openCollectionId) {
      restoreFocusRef.current = document.activeElement;
      window.setTimeout(() => closeRef.current?.focus(), 60);
    }
  }, [openCollectionId]);

  useEffect(() => {
    if (!openCollectionId) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") closeCollection();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      restoreFocusRef.current?.focus?.();
    };
  }, [openCollectionId, closeCollection]);

  const resolved = useMemo(() => {
    if (!collection) return null;
    const members = collection.members || {};
    const entityById = {
      questions: Object.fromEntries((history.questions || []).map((q) => [q.id, q])),
      evidence: Object.fromEntries(savedEvidence.map((e) => [e.id, e])),
      notes: Object.fromEntries(notes.map((n) => [n.id, n])),
      insights: Object.fromEntries(insights.map((i) => [i.id, i])),
    };
    const sourcesByFileName = Object.fromEntries((files || []).map((f) => [f.file_name, f]));
    const counts = {
      sources: (members.sources || []).length,
      questions: (members.questions || []).length,
      evidence: (members.evidence || []).length,
      notes: (members.notes || []).length,
      insights: (members.insights || []).length,
    };
    return { members, entityById, sourcesByFileName, counts };
  }, [collection, history, savedEvidence, notes, insights, files]);

  if (!collection || !resolved) return null;

  const accent = collectionAccentMeta(collection);
  const total = Object.values(resolved.counts).reduce((a, b) => a + b, 0);

  const openMember = (type, entity) => {
    if (type === "sources") onOpenDocument?.({ fileName: entity });
    else if (type === "evidence") onOpenDocument?.({ fileName: entity.fileName, chunkId: entity.chunkId, chunk_index: entity.chunkIndex, excerpt: entity.excerpt });
    else if (type === "notes") openResearchPanel("notes");
    else if (type === "insights") openResearchPanel("insights");
    else if (type === "questions") openResearchPanel("overview");
  };

  const toggleMember = (type, id) => {
    const ids = resolved.members[type] || [];
    if (ids.includes(id)) removeFromCollection(collection.id, type, id);
    else addToCollection(collection.id, type, id);
  };

  const saveEdit = (patch) => {
    updateCollection(collection.id, patch);
    setEditing(false);
  };

  const handleDelete = () => {
    deleteCollection(collection.id);
  };

  return createPortal(
    <div className={`collectionRoom accent-${accent.key}`}>
      <div className="collectionRoomCard">
        <span className="collectionRoomNoise" aria-hidden="true" />
        <span className="collectionRoomAccentLight" aria-hidden="true" />

        {/* ── Hero ─────────────────────────────────────────── */}
        <header className="collectionHero">
          <div className="collectionHeroTop">
            <button
              ref={closeRef}
              type="button"
              className="collectionBackBtn"
              onClick={closeCollection}
              aria-label="Close collection workspace"
              title="Close (Esc)"
            >
              <ArrowLeft size={15} />
              <span>Back to library</span>
            </button>
            <CollectionActions
              collection={collection}
              tone="hero"
              onTogglePin={() => toggleCollectionPinned(collection.id)}
              onEdit={() => setEditing(true)}
              onDelete={handleDelete}
              onSetActive={() => setActiveCollection(activeCollectionId === collection.id ? null : collection.id)}
              isActive={activeCollectionId === collection.id}
            />
          </div>

          <div className="collectionHeroIdentity">
            <span className="collectionHeroIcon">
              <FolderOpen size={22} />
            </span>
            <div className="collectionHeroText">
              <h2 className="collectionHeroTitle">{collection.name}</h2>
              {collection.description && <p className="collectionHeroDesc">{collection.description}</p>}
              <div className="collectionHeroMeta">
                <span>Created {formatDate(collection.createdAt)}</span>
                <span className="collectionHeroMetaDot">·</span>
                <span>Updated {formatDate(collection.updatedAt)}</span>
                <span className="collectionHeroMetaDot">·</span>
                <span>{total} item{total === 1 ? "" : "s"}</span>
                {collection.pinned && (
                  <>
                    <span className="collectionHeroMetaDot">·</span>
                    <span className="collectionHeroPinned"><Pin size={10} /> Pinned</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="collectionStatStrip">
            {MEMBER_TYPES.map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                type="button"
                className={`collectionStat ${adding === type ? "active" : ""}`}
                onClick={() => setAdding(adding === type ? null : type)}
                title={`${resolved.counts[type]} ${label.toLowerCase()}`}
              >
                <Icon size={12} />
                <strong>{resolved.counts[type]}</strong>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </header>

        {/* ── Body ─────────────────────────────────────────── */}
        <div className="collectionDetailBody">
          {total === 0 && adding === null ? (
            <CollectionEmptyState
              icon={<Sparkles size={22} />}
              title="This collection is ready for research."
              body="Link sources, notes, evidence, or insights here — or create new material and assign it. Ask questions in the chat panel, then link them to this collection."
              accent={accent.key}
              action="Link a source"
              actionLabel="or create a note or insight"
              onAction={() => setAdding("sources")}
            />
          ) : (
            <div className="collectionDetailSections">
              {MEMBER_TYPES.map(({ type, label, icon: Icon, verb }) => {
                const ids = resolved.members[type] || [];
                const entities = ids
                  .map((id) => (type === "sources" ? id : resolved.entityById[type]?.[id]))
                  .filter(Boolean);
                const candidates =
                  type === "sources"
                    ? (files || []).filter((f) => !ids.includes(f.file_name))
                    : Object.values(resolved.entityById[type] || {}).filter((e) => !ids.includes(e.id));
                const showCandidates = adding === type && candidates.length > 0;

                return (
                  <section key={type} className="collectionDetailSection">
                    <div className="collectionDetailSectionHeader">
                      <span className="collectionDetailSectionTitle">
                        <Icon size={12} />
                        {label}
                        <em>{entities.length}</em>
                      </span>
                      <button
                        type="button"
                        className={`collectionAddBtn ${adding === type ? "open" : ""}`}
                        onClick={() => setAdding(adding === type ? null : type)}
                        aria-expanded={adding === type}
                      >
                        <Plus size={12} />
                        {adding === type ? (candidates.length ? "Done" : "Close") : verb}
                      </button>
                    </div>

                    {adding === type && candidates.length === 0 && (
                      <p className="collectionCandidatesEmpty">
                        {type === "sources"
                          ? "All uploaded sources are linked — upload a new document in the source library."
                          : `No unlinked ${label.toLowerCase()} available yet.`}
                      </p>
                    )}

                    {showCandidates && (
                      <ul className="collectionCandidateList">
                        {candidates.slice(0, 12).map((candidate) => {
                          const id = type === "sources" ? candidate.file_name : candidate.id;
                          const cLabel =
                            type === "sources"
                              ? candidate.file_name
                              : type === "questions"
                                ? candidate.text
                                : memberLabel(type, candidate);
                          return (
                            <li key={id}>
                              <button
                                type="button"
                                className="collectionCandidateRow"
                                onClick={() => toggleMember(type, id)}
                                title={`Link ${cLabel}`}
                              >
                                <Link2 size={11} />
                                <span>{cLabel}</span>
                                <em>Link</em>
                              </button>
                            </li>
                          );
                        })}
                        {candidates.length > 12 && (
                          <li className="collectionCandidatesMore">+{candidates.length - 12} more — search sources in the library</li>
                        )}
                      </ul>
                    )}

                    {entities.length === 0 ? (
                      <p className="collectionSectionEmpty">Nothing linked yet.</p>
                    ) : (
                      <ul className="collectionDetailMemberList">
                        {entities.map((entity) => {
                          const id = type === "sources" ? entity : entity.id;
                          const label = memberLabel(type, entity);
                          const sub = memberSub(type, entity);
                          return (
                            <li key={id} className="collectionDetailMember">
                              <button
                                type="button"
                                className="collectionDetailMemberOpen"
                                onClick={() => openMember(type, entity)}
                                title={label ? `Open ${label}` : "Open"}
                              >
                                <Icon size={12} />
                                <span className="collectionDetailMemberText">
                                  {type === "questions" ? (
                                    <span className="collectionDetailQuestion">
                                      {entity.text}
                                      <em className={`questionStatus ${entity.status}`}>
                                        {entity.status === "answered" ? "answered" : entity.status === "saved" ? "saved" : "asked"}
                                      </em>
                                    </span>
                                  ) : (
                                    <>
                                      <strong>{label}</strong>
                                      {sub && <em className="collectionDetailMemberSub">{sub}</em>}
                                    </>
                                  )}
                                </span>
                                <ExternalLink size={10} className="collectionDetailMemberOpenIcon" />
                              </button>
                              {type === "questions" && (
                                <button
                                  type="button"
                                  className={`collectionDetailQuestionSave ${entity.saved ? "saved" : ""}`}
                                  onClick={() => toggleQuestionSaved(entity.id)}
                                  title={entity.saved ? "Unsave question" : "Save question"}
                                  aria-pressed={entity.saved}
                                >
                                  <Pin size={10} />
                                </button>
                              )}
                              <button
                                type="button"
                                className="collectionDetailMemberRemove"
                                onClick={() => removeFromCollection(collection.id, type, id)}
                                title="Remove from collection (object is kept)"
                                aria-label={`Remove from collection`}
                              >
                                <X size={11} />
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </section>
                );
              })}

              <div className="collectionLocalNotice">
                <FolderOpen size={11} />
                <span>Collections and their links are stored locally in your browser. Removing an item here never deletes the underlying source, note, evidence, or insight.</span>
              </div>
            </div>
          )}
        </div>

        {editing && (
          <CollectionEditor
            collection={collection}
            onSave={saveEdit}
            onClose={() => setEditing(false)}
          />
        )}
      </div>
    </div>,
    document.body
  );
}