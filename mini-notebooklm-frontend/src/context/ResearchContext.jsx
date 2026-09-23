import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./AuthContext.jsx";
import {
  storageGet,
  storageSet,
  userStorageGet,
  userStorageSet,
} from "../services/localStorage.js";
import { normalizeCitation, normalizeFile } from "../utils/documentModel.js";
import {
  makeSourceReference,
  normalizeCollection,
  normalizeEvent,
  normalizeInsight,
} from "../utils/researchModels.js";

const ResearchContext = createContext(null);

export const VIEWER_STATUS = {
  CLOSED: "CLOSED",
  OPENING: "OPENING",
  LOADING: "LOADING",
  READY: "READY",
  ERROR: "ERROR",
  UNSUPPORTED: "UNSUPPORTED",
};

export const RESEARCH_TABS = {
  OVERVIEW: "overview",
  NOTES: "notes",
  EVIDENCE: "evidence",
  INSIGHTS: "insights",
  COLLECTIONS: "collections",
  BOOKMARKS: "bookmarks",
  RECENT: "recent",
  TIMELINE: "timeline",
};

// Collection member-type → display label (activity titles for link events).
const TYPE_LABELS = {
  sources: "Source",
  questions: "Question",
  evidence: "Evidence",
  notes: "Note",
  insights: "Insight",
};

const WORKSPACE_KEY = "mini-notebooklm:workspace";
const MAX_RECENT = 8;
const MAX_HISTORY_QUESTIONS = 20;
const MAX_HISTORY_SEARCHES = 20;
const MAX_EVENTS = 200;
// Coalescing: rapid repeats of the same kind of activity against the same
// object collapse into one entry (opened twice, edited twice, ...).
const COALESCE_TYPES = new Set([
  "document_opened",
  "collection_opened",
  "note_updated",
  "insight_updated",
  "collection_updated",
]);
const COALESCE_WINDOW_MS = 45 * 1000;
const SESSION_GAP_MS = 25 * 60 * 1000;

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix = "item") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ResearchProvider({ children }) {
  const { user } = useAuth();
  const username = user?.username || null;

  // ── Viewer state machine ────────────────────────────────────────────
  const [viewerStatus, setViewerStatus] = useState(VIEWER_STATUS.CLOSED);
  const [viewerError, setViewerError] = useState(null);
  const [openTargets, setOpenTargets] = useState([]); // { id, citation, openedAt }
  const [activeTargetId, setActiveTargetId] = useState(null);

  // ── Viewer options ──────────────────────────────────────────────────
  const [zoom, setZoom] = useState(100);
  const [fitWidth, setFitWidth] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [infoOpen, setInfoOpen] = useState(false);
  const [evidenceWidth, setEvidenceWidth] = useState(360);
  const [focusMode, setFocusMode] = useState(false);
  const [evidenceOpen, setEvidenceOpen] = useState(true);

  // ── Workspace chrome (persisted) ────────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [studioOpen, setStudioOpen] = useState(true);
  const [researchPanelTab, setResearchPanelTab] = useState(RESEARCH_TABS.OVERVIEW);
  const [researchSearchRequest, setResearchSearchRequest] = useState(0);
  const [researchSearchScope, setResearchSearchScope] = useState("all");
  const [noteCreateRequest, setNoteCreateRequest] = useState(0);
  const [createCollectionRequest, setCreateCollectionRequest] = useState(0);
  const [assignSourceFileName, setAssignSourceFileName] = useState(null);

  // ── Collection detail overlay (session-level, not persisted) ─────────
  const [openCollectionId, setOpenCollectionId] = useState(null);

  // ── Research data (per-user localStorage) ───────────────────────────
  const [recentDocuments, setRecentDocuments] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [savedEvidence, setSavedEvidence] = useState([]);
  const [notes, setNotes] = useState([]);
  const [insights, setInsights] = useState([]);
  const [collections, setCollections] = useState([]);
  const [activeCollectionId, setActiveCollectionId] = useState(null);
  const [recentCollections, setRecentCollections] = useState([]);
  const [events, setEvents] = useState([]);
  const [history, setHistory] = useState({ questions: [], searches: [] });
  const [timelineRequest, setTimelineRequest] = useState({ n: 0, filter: "all" });

  // Refs mirroring state for side-effect-free functional updates.
  const openTargetsRef = useRef(openTargets);
  const bookmarksRef = useRef(bookmarks);
  const collectionsRef = useRef(collections);
  const historyRef = useRef(history);
  const notesRef = useRef(notes);
  const insightsRef = useRef(insights);
  const evidenceRef = useRef(savedEvidence);
  useEffect(() => {
    openTargetsRef.current = openTargets;
  }, [openTargets]);
  useEffect(() => {
    bookmarksRef.current = bookmarks;
  }, [bookmarks]);
  useEffect(() => {
    collectionsRef.current = collections;
  }, [collections]);
  useEffect(() => {
    historyRef.current = history;
  }, [history]);
  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);
  useEffect(() => {
    insightsRef.current = insights;
  }, [insights]);
  useEffect(() => {
    evidenceRef.current = savedEvidence;
  }, [savedEvidence]);

  // Hydration guard: research data must finish loading from storage before
  // any persistence effect writes, otherwise a stale empty array can clobber
  // previously saved data on login.
  const [hydration, setHydration] = useState({ user: null, done: false });
  const hydrated = hydration.user === username && hydration.done;

  // Load per-user research data when the user changes.
  useEffect(() => {
    setHydration({ user: username, done: false });
    if (!username) {
      setRecentDocuments([]);
      setBookmarks([]);
      setSavedEvidence([]);
      setNotes([]);
      setInsights([]);
      setCollections([]);
      setActiveCollectionId(null);
      setRecentCollections([]);
      setOpenCollectionId(null);
      setAssignSourceFileName(null);
      setEvents([]);
      setHistory({ questions: [], searches: [] });
      return;
    }
    setRecentDocuments(userStorageGet("recent-documents", username, []));
    setBookmarks(userStorageGet("bookmarks", username, []));
    setSavedEvidence(userStorageGet("saved-evidence", username, []));
    setNotes(userStorageGet("notes", username, []));
    setInsights(userStorageGet("insights", username, []));
    setCollections((userStorageGet("collections", username, []) || []).map(normalizeCollection));
    setRecentCollections(userStorageGet("recent-collections", username, []));
    setEvents((userStorageGet("timeline", username, []) || []).map(normalizeEvent));
    setHistory(userStorageGet("research-history", username, { questions: [], searches: [] }));
    setActiveCollectionId(userStorageGet("active-collection", username, null));
    setResearchPanelTab(RESEARCH_TABS.OVERVIEW);
    // Mark hydrated on the next tick so batched data setStates land first.
    const timer = window.setTimeout(() => setHydration({ user: username, done: true }), 0);
    return () => window.clearTimeout(timer);
  }, [username]);

  // Persist research data per user (only after hydration completes).
  useEffect(() => {
    if (hydrated) userStorageSet("recent-documents", username, recentDocuments);
  }, [recentDocuments, username, hydrated]);
  useEffect(() => {
    if (hydrated) userStorageSet("bookmarks", username, bookmarks);
  }, [bookmarks, username, hydrated]);
  useEffect(() => {
    if (hydrated) userStorageSet("saved-evidence", username, savedEvidence);
  }, [savedEvidence, username, hydrated]);
  useEffect(() => {
    if (hydrated) userStorageSet("notes", username, notes);
  }, [notes, username, hydrated]);
  useEffect(() => {
    if (hydrated) userStorageSet("insights", username, insights);
  }, [insights, username, hydrated]);
  useEffect(() => {
    if (hydrated) userStorageSet("collections", username, collections);
  }, [collections, username, hydrated]);
  useEffect(() => {
    if (hydrated) userStorageSet("recent-collections", username, recentCollections);
  }, [recentCollections, username, hydrated]);
  useEffect(() => {
    if (hydrated) userStorageSet("timeline", username, events);
  }, [events, username, hydrated]);
  useEffect(() => {
    if (hydrated) userStorageSet("research-history", username, history);
  }, [history, username, hydrated]);
  useEffect(() => {
    if (hydrated) userStorageSet("active-collection", username, activeCollectionId);
  }, [activeCollectionId, username, hydrated]);

  // Persist workspace chrome (UI preference, not per-user).
  useEffect(() => {
    storageSet(WORKSPACE_KEY, { sidebarOpen, studioOpen, focusMode, evidenceOpen, evidenceWidth, researchPanelTab });
  }, [sidebarOpen, studioOpen, focusMode, evidenceOpen, evidenceWidth, researchPanelTab]);

  // Restore workspace chrome once.
  useEffect(() => {
    const saved = storageGet(WORKSPACE_KEY, null);
    if (saved && typeof saved === "object") {
      setSidebarOpen(saved.sidebarOpen ?? true);
      setStudioOpen(saved.studioOpen ?? true);
      setFocusMode(saved.focusMode ?? false);
      setEvidenceOpen(saved.evidenceOpen ?? true);
      if (typeof saved.evidenceWidth === "number") setEvidenceWidth(saved.evidenceWidth);
    }
  }, []);

  const activeCitation = useMemo(() => {
    const target = openTargets.find((t) => t.id === activeTargetId) || null;
    return target ? target.citation : null;
  }, [openTargets, activeTargetId]);

  const viewerOpen = viewerStatus !== VIEWER_STATUS.CLOSED;

  const activeCollection = useMemo(
    () => collections.find((c) => c.id === activeCollectionId) || null,
    [collections, activeCollectionId]
  );

  // ── Research activity (timeline) ────────────────────────────────────
  /**
   * Central activity recorder. Records only events that actually happen;
   * every entry is normalized (references by ID, never embedded copies).
   * Open/edit type repeats coalesce into the newest entry within a short
   * window so the journal stays calm.
   */
  const recordActivity = useCallback((type, opts = {}) => {
    const { title, description, objectType, objectId, collectionId, sourceId, questionId, insightId, noteId, evidenceId, fileName, metadata } = opts;
    const labelText = (title || description || "").slice(0, 200);
    if (!labelText && !fileName) return;
    const nowMs = Date.now();
    const at = new Date(nowMs).toISOString();
    const event = normalizeEvent({
      type,
      title: labelText,
      description: description ? String(description).slice(0, 300) : "",
      objectType: objectType || null,
      objectId: objectId || null,
      collectionId: collectionId ?? null,
      sourceId: sourceId ?? null,
      questionId: questionId ?? null,
      insightId: insightId ?? null,
      noteId: noteId ?? null,
      evidenceId: evidenceId ?? null,
      fileName: fileName ?? null,
      metadata: metadata && typeof metadata === "object" ? metadata : {},
      at,
    });
    setEvents((current) => {
      if (COALESCE_TYPES.has(type)) {
        const key = objectId ?? fileName ?? collectionId ?? questionId ?? insightId ?? noteId ?? null;
        const index = current.findIndex((e) => {
          if (e.type !== type || !key) return false;
          return (e.objectId === key || e.fileName === key || e.collectionId === key) && nowMs - Date.parse(e.at) < COALESCE_WINDOW_MS;
        });
        if (index >= 0) {
          const copy = [...current];
          copy.splice(index, 1);
          return [event, ...copy].slice(0, MAX_EVENTS);
        }
      }
      return [event, ...current].slice(0, MAX_EVENTS);
    });
  }, []);

  // Requests the timeline surface with a filter (e.g. "today" / "all").
  const focusTimeline = useCallback((filter = "all") => {
    setTimelineRequest((current) => ({ n: current.n + 1, filter: filter || "all" }));
    setResearchPanelTab(RESEARCH_TABS.TIMELINE);
    setStudioOpen(true);
  }, []);

  // ── Viewer control ──────────────────────────────────────────────────
  const openDocumentViewer = useCallback(
    (target) => {
      const citation = normalizeCitation(target || {});
      const current = openTargetsRef.current;
      const existing = current.find((t) => t.citation.fileName && t.citation.fileName === citation.fileName);

      if (existing) {
        if (citation.excerpt || citation.chunkId !== null) {
          setOpenTargets(current.map((t) => (t.id === existing.id ? { ...t, citation } : t)));
        }
        setActiveTargetId(existing.id);
      } else {
        const tab = { id: makeId("doc"), citation, openedAt: nowIso() };
        setOpenTargets([...current, tab]);
        setActiveTargetId(tab.id);
      }
      setViewerStatus(VIEWER_STATUS.OPENING);
      setViewerError(null);
      setInfoOpen(false);
    },
    []
  );

  const activateTab = useCallback((tabId) => {
    setActiveTargetId(tabId);
    setViewerStatus(VIEWER_STATUS.OPENING);
    setViewerError(null);
  }, []);

  const closeTab = useCallback((tabId) => {
    const current = openTargetsRef.current;
    const remaining = current.filter((t) => t.id !== tabId);
    if (!remaining.length) {
      setOpenTargets([]);
      setActiveTargetId(null);
      setViewerStatus(VIEWER_STATUS.CLOSED);
      setFocusMode(false);
    } else {
      setOpenTargets(remaining);
      setActiveTargetId((cur) => (cur === tabId ? remaining[remaining.length - 1].id : cur));
    }
  }, []);

  const closeViewer = useCallback(() => {
    setViewerStatus(VIEWER_STATUS.CLOSED);
    setViewerError(null);
    setOpenTargets([]);
    setActiveTargetId(null);
    setFocusMode(false);
    setSearchOpen(false);
    setInfoOpen(false);
  }, []);

  const recordRecent = useCallback(
    (file) => {
      const normalized = normalizeFile(file || {});
      if (!normalized.fileName) return;
      const entry = {
        id: makeId("recent"),
        fileName: normalized.fileName,
        sizeBytes: normalized.sizeBytes,
        extension: normalized.extension,
        kind: normalized.kind,
        mimeType: normalized.mimeType,
        openedAt: nowIso(),
      };
      setRecentDocuments((current) => [entry, ...current.filter((r) => r.fileName !== entry.fileName)].slice(0, MAX_RECENT));
      recordActivity("document_opened", {
        title: normalized.fileName,
        fileName: normalized.fileName,
        sourceId: normalized.fileName,
        objectType: "source",
        metadata: { extension: normalized.extension || null, sizeBytes: normalized.sizeBytes || null },
      });
    },
    [recordActivity]
  );

  const markViewerResolved = useCallback(
    (file) => {
      if (file) recordRecent(file);
      setViewerStatus(file ? VIEWER_STATUS.READY : VIEWER_STATUS.UNSUPPORTED);
    },
    [recordRecent]
  );

  const markViewerLoading = useCallback(() => {
    setViewerStatus(VIEWER_STATUS.LOADING);
  }, []);

  const markViewerError = useCallback((error) => {
    setViewerError(error || { title: "Document unavailable", message: "The document could not be opened." });
    setViewerStatus(VIEWER_STATUS.ERROR);
  }, []);

  // ── Bookmarks (sources) ─────────────────────────────────────────────
  const toggleBookmark = useCallback(
    (fileOrCitation) => {
      const fileName = fileOrCitation?.fileName || fileOrCitation?.source || fileOrCitation?.file_name;
      if (!fileName) return false;
      const exists = bookmarksRef.current.some((b) => b.fileName === fileName);
      if (exists) {
        setBookmarks((current) => current.filter((b) => b.fileName !== fileName));
        return false;
      }
      setBookmarks((current) => [
        ...current,
        {
          id: makeId("bookmark"),
          fileName,
          extension: fileOrCitation?.extension || null,
          kind: fileOrCitation?.kind || null,
          sizeBytes: fileOrCitation?.sizeBytes ?? fileOrCitation?.size_bytes ?? null,
          savedAt: nowIso(),
        },
      ]);
      recordActivity("bookmark_created", {
        title: fileName,
        fileName,
        sourceId: fileName,
        objectType: "source",
      });
      return true;
    },
    [recordActivity]
  );

  const removeBookmark = useCallback((id) => {
    setBookmarks((current) => current.filter((b) => b.id !== id));
  }, []);

  const isBookmarked = useCallback((fileName) => bookmarks.some((b) => b.fileName === fileName), [bookmarks]);

  // ── Saved evidence (passages) ───────────────────────────────────────
  const saveEvidence = useCallback(
    (citation) => {
      const normalized = normalizeCitation(citation || {});
      if (!normalized.fileName || !normalized.excerpt) return null;
      const dup = evidenceRef.current.find((e) => e.fileName === item.fileName && e.chunkId === item.chunkId);
      if (dup) return null;
      setSavedEvidence((current) => [item, ...current]);
      recordActivity("evidence_saved", {
        title: normalized.fileName,
        description: "Saved a passage to evidence",
        fileName: normalized.fileName,
        sourceId: normalized.fileName,
        objectType: "evidence",
        evidenceId: item.id,
        metadata: { chunkId: normalized.chunkId, pageNumber: normalized.pageNumber ?? null },
      });
      return item;
    },
    [recordActivity]
  );

  const removeSavedEvidence = useCallback((id) => {
    setSavedEvidence((current) => current.filter((e) => e.id !== id));
    // Strip from collections
    setCollections((current) =>
      current.map((c) => ({ ...c, members: { ...c.members, evidence: c.members.evidence.filter((eid) => eid !== id) } }))
    );
  }, []);

  const isEvidenceSaved = useCallback(
    (citation) => {
      const normalized = normalizeCitation(citation || {});
      return savedEvidence.some(
        (e) => e.fileName === normalized.fileName && (normalized.chunkId === null || e.chunkId === normalized.chunkId)
      );
    },
    [savedEvidence]
  );

  // ── Notes ───────────────────────────────────────────────────────────
  const createNote = useCallback(
    ({ title, body, sourceFileName, excerpt, citation } = {}) => {
      const note = {
        id: makeId("note"),
        title: (title || "Untitled note").slice(0, 200),
        body: body || "",
        sourceFileName: sourceFileName || citation?.fileName || null,
        excerpt: excerpt || citation?.excerpt || null,
        citation: citation ? normalizeCitation(citation) : null,
        collectionIds: [],
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      setNotes((current) => [note, ...current]);
      recordActivity("note_created", {
        title: note.title,
        noteId: note.id,
        objectType: "note",
        fileName: note.sourceFileName || null,
        description: note.sourceFileName ? `From ${note.sourceFileName}` : "",
      });
      return note;
    },
    [recordActivity]
  );

  const updateNote = useCallback(
    (id, patch) => {
      setNotes((current) => current.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: nowIso() } : n)));
      const currentNote = notesRef.current.find((n) => n.id === id);
      recordActivity("note_updated", {
        title: patch.title || currentNote?.title || "Note",
        noteId: id,
        objectType: "note",
        fileName: currentNote?.sourceFileName || null,
      });
    },
    [recordActivity]
  );

  const deleteNote = useCallback((id) => {
    setNotes((current) => current.filter((n) => n.id !== id));
    setCollections((current) =>
      current.map((c) => ({ ...c, members: { ...c.members, notes: c.members.notes.filter((nid) => nid !== id) } }))
    );
  }, []);

  const duplicateNote = useCallback((id) => {
    setNotes((current) => {
      const source = current.find((n) => n.id === id);
      if (!source) return current;
      const copy = {
        ...source,
        id: makeId("note"),
        title: `${source.title} (copy)`,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        collectionIds: [],
      };
      return [copy, ...current];
    });
  }, []);

  // ── Insights ────────────────────────────────────────────────────────
  const createInsight = useCallback(
    ({ title, body, sourceReferences = [] } = {}) => {
      const insight = normalizeInsight({
        title,
        body,
        sourceReferences: Array.isArray(sourceReferences) ? sourceReferences.map(makeSourceReference) : [],
      });
      setInsights((current) => [insight, ...current]);
      recordActivity("insight_created", {
        title: insight.title,
        insightId: insight.id,
        objectType: "insight",
        metadata: { sourceCount: insight.sourceReferences.length },
      });
      return insight;
    },
    [recordActivity]
  );

  const updateInsight = useCallback(
    (id, patch) => {
      setInsights((current) => current.map((i) => (i.id === id ? { ...i, ...patch, updatedAt: nowIso() } : i)));
      const currentInsight = insightsRef.current.find((i) => i.id === id);
      recordActivity("insight_updated", {
        title: patch.title || currentInsight?.title || "Insight",
        insightId: id,
        objectType: "insight",
      });
    },
    [recordActivity]
  );

  const deleteInsight = useCallback((id) => {
    setInsights((current) => current.filter((i) => i.id !== id));
    setCollections((current) =>
      current.map((c) => ({ ...c, members: { ...c.members, insights: c.members.insights.filter((iid) => iid !== id) } }))
    );
  }, []);

  // ── Collections ─────────────────────────────────────────────────────
  const createCollection = useCallback(
    (name, extras = {}) => {
      const collection = normalizeCollection({
        name: name || "Untitled collection",
        members: { sources: [], questions: [], evidence: [], notes: [], insights: [] },
        ...extras,
      });
      setCollections((current) => [collection, ...current]);
      recordActivity("collection_created", {
        title: collection.name,
        collectionId: collection.id,
        objectType: "collection",
        description: collection.description ? collection.description.slice(0, 120) : "",
      });
      return collection;
    },
    [recordActivity]
  );

  const renameCollection = useCallback((id, name) => {
    setCollections((current) =>
      current.map((c) => (c.id === id ? { ...c, name: (name || "Untitled collection").slice(0, 80), updatedAt: nowIso() } : c))
    );
  }, []);

  const updateCollection = useCallback(
    (id, patch) => {
      setCollections((current) =>
        current.map((c) => {
          if (c.id !== id) return c;
          const next = { ...c, ...patch };
          if (patch.name) next.name = String(patch.name).slice(0, 80);
          next.updatedAt = nowIso();
          return next;
        })
      );
      const existing = collectionsRef.current.find((c) => c.id === id);
      recordActivity("collection_updated", {
        title: patch.name || existing?.name || "Collection",
        collectionId: id,
        objectType: "collection",
        description: patch.description && existing && patch.description !== existing.description ? "Edited collection description" : "",
      });
    },
    [recordActivity]
  );

  const toggleCollectionPinned = useCallback(
    (id) => {
      setCollections((current) =>
        current.map((c) => (c.id === id ? { ...c, pinned: !c.pinned, updatedAt: nowIso() } : c))
      );
      const existing = collectionsRef.current.find((c) => c.id === id);
      if (existing) {
        recordActivity("collection_updated", {
          title: existing.name,
          description: existing.pinned ? "Unpinned collection" : "Pinned collection",
          collectionId: id,
          objectType: "collection",
        });
      }
    },
    [recordActivity]
  );

  const openCollection = useCallback(
    (id) => {
      if (!id || !collectionsRef.current.some((c) => c.id === id)) return;
      setOpenCollectionId(id);
      const entry = { id, openedAt: nowIso() };
      setRecentCollections((current) => [entry, ...current.filter((r) => r.id !== id)].slice(0, 6));
      const existing = collectionsRef.current.find((c) => c.id === id);
      recordActivity("collection_opened", {
        title: existing?.name || "Collection",
        collectionId: id,
        objectType: "collection",
      });
    },
    [recordActivity]
  );

  const closeCollection = useCallback(() => {
    setOpenCollectionId(null);
  }, []);

  const requestCreateCollection = useCallback(() => {
    setCreateCollectionRequest((n) => n + 1);
    setResearchPanelTab(RESEARCH_TABS.COLLECTIONS);
    setStudioOpen(true);
  }, []);

  const setAssignSource = useCallback((fileName) => {
    setAssignSourceFileName(fileName || null);
  }, []);

  const deleteCollection = useCallback((id) => {
    setCollections((current) => current.filter((c) => c.id !== id));
    setActiveCollectionId((current) => (current === id ? null : current));
    setOpenCollectionId((current) => (current === id ? null : current));
    setRecentCollections((current) => current.filter((r) => r.id !== id));
    // Strip the collection from every entity.
    setNotes((current) => current.map((n) => ({ ...n, collectionIds: n.collectionIds.filter((cid) => cid !== id) })));
    setSavedEvidence((current) => current.map((e) => ({ ...e, collectionIds: e.collectionIds.filter((cid) => cid !== id) })));
    setInsights((current) => current.map((i) => ({ ...i, collectionIds: i.collectionIds.filter((cid) => cid !== id) })));
    setHistory((current) => ({
      ...current,
      questions: (current.questions || []).map((q) => ({ ...q, collectionIds: (q.collectionIds || []).filter((cid) => cid !== id) })),
    }));
  }, []);

  const addToCollection = useCallback(
    (collectionId, type, id) => {
      if (!collectionId || !id) return;
      setCollections((current) =>
        current.map((c) => {
          if (c.id !== collectionId) return c;
          const list = c.members[type] || [];
          return { ...c, members: { ...c.members, [type]: list.includes(id) ? list : [...list, id] }, updatedAt: nowIso() };
        })
      );
      // Mirror membership on the entity itself (except sources, matched by fileName).
      if (type === "notes") {
        setNotes((current) => current.map((n) => (n.id === id ? { ...n, collectionIds: [...new Set([...n.collectionIds, collectionId])] } : n)));
      } else if (type === "evidence") {
        setSavedEvidence((current) => current.map((e) => (e.id === id ? { ...e, collectionIds: [...new Set([...e.collectionIds, collectionId])] } : e)));
      } else if (type === "insights") {
        setInsights((current) => current.map((i) => (i.id === id ? { ...i, collectionIds: [...new Set([...i.collectionIds, collectionId])] } : i)));
      } else if (type === "questions") {
        setHistory((current) => ({
          ...current,
          questions: (current.questions || []).map((q) =>
            q.id === id ? { ...q, collectionIds: [...new Set([...(q.collectionIds || []), collectionId])] } : q
          ),
        }));
      }
      const collection = collectionsRef.current.find((c) => c.id === collectionId);
      recordActivity("item_linked", {
        title: `${TYPE_LABELS[type] || type} added to ${collection?.name || "collection"}`,
        collectionId,
        objectType: TYPE_LABELS[type] ? type.slice(0, -1) : null,
        metadata: { linkedId: id },
      });
    },
    [recordActivity]
  );

  const removeFromCollection = useCallback(
    (collectionId, type, id) => {
      if (!collectionId || !id) return;
      setCollections((current) =>
        current.map((c) =>
          c.id === collectionId
            ? { ...c, members: { ...c.members, [type]: (c.members[type] || []).filter((mid) => mid !== id) }, updatedAt: nowIso() }
            : c
        )
      );
      if (type === "notes") {
        setNotes((current) => current.map((n) => (n.id === id ? { ...n, collectionIds: n.collectionIds.filter((cid) => cid !== collectionId) } : n)));
      } else if (type === "evidence") {
        setSavedEvidence((current) => current.map((e) => (e.id === id ? { ...e, collectionIds: e.collectionIds.filter((cid) => cid !== collectionId) } : e)));
      } else if (type === "insights") {
        setInsights((current) => current.map((i) => (i.id === id ? { ...i, collectionIds: i.collectionIds.filter((cid) => cid !== collectionId) } : i)));
      } else if (type === "questions") {
        setHistory((current) => ({
          ...current,
          questions: (current.questions || []).map((q) =>
            q.id === id ? { ...q, collectionIds: (q.collectionIds || []).filter((cid) => cid !== collectionId) } : q
          ),
        }));
      }
      const collection = collectionsRef.current.find((c) => c.id === collectionId);
      recordActivity("item_unlinked", {
        title: `${TYPE_LABELS[type] || type} removed from ${collection?.name || "collection"}`,
        collectionId,
        objectType: TYPE_LABELS[type] ? type.slice(0, -1) : null,
        metadata: { linkedId: id },
      });
    },
    [recordActivity]
  );

  const setActiveCollection = useCallback((id) => {
    setActiveCollectionId(id || null);
  }, []);

  // ── Research questions ──────────────────────────────────────────────
  const recordQuestion = useCallback(
    (question, scope = null) => {
      if (!question || !question.trim()) return;
      const entry = {
        id: makeId("question"),
        text: question.trim().slice(0, 500),
        scope: scope || null,
        status: "asked",
        saved: false,
        collectionIds: [],
        at: nowIso(),
      };
      setHistory((current) => ({
        ...current,
        questions: [entry, ...(current.questions || []).filter((q) => q.text !== entry.text)].slice(0, MAX_HISTORY_QUESTIONS),
      }));
      recordActivity("question_created", {
        title: entry.text,
        questionId: entry.id,
        objectType: "question",
        metadata: { scope: entry.scope },
      });
    },
    [recordActivity]
  );

  const markQuestionAnswered = useCallback(
    (questionText) => {
      const questions = historyRef.current.questions || [];
      if (!questions.length) return;
      const target = questionText
        ? questions.find((q) => q.text === questionText && q.status === "asked")
        : [...questions].reverse().find((q) => q.status === "asked");
      if (!target) return;
      setHistory((current) => ({
        ...current,
        questions: (current.questions || []).map((q) => (q.id === target.id ? { ...q, status: "answered" } : q)),
      }));
      recordActivity("question_answered", {
        title: target.text,
        questionId: target.id,
        objectType: "question",
        description: "Question answered",
      });
    },
    [recordActivity]
  );

  const toggleQuestionSaved = useCallback((id) => {
    setHistory((current) => ({
      ...current,
      questions: (current.questions || []).map((q) => (q.id === id ? { ...q, saved: !q.saved } : q)),
    }));
  }, []);

  const recordSearch = useCallback((query) => {
    if (!query || !query.trim()) return;
    const entry = { text: query.trim().slice(0, 300), at: nowIso() };
    setHistory((current) => ({
      ...current,
      searches: [entry, ...(current.searches || []).filter((s) => s.text !== entry.text)].slice(0, MAX_HISTORY_SEARCHES),
    }));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory({ questions: [], searches: [] });
    setRecentDocuments([]);
    setEvents([]);
  }, []);

  const openResearchPanel = useCallback((tab) => {
    setResearchPanelTab(tab || RESEARCH_TABS.OVERVIEW);
    setStudioOpen(true);
  }, []);

  const focusResearchSearch = useCallback((scope = "all") => {
    setResearchSearchScope(scope || "all");
    setResearchSearchRequest((n) => n + 1);
    setResearchPanelTab(RESEARCH_TABS.OVERVIEW);
    setStudioOpen(true);
  }, []);

  const requestCreateNote = useCallback(() => {
    setNoteCreateRequest((n) => n + 1);
    setResearchPanelTab(RESEARCH_TABS.NOTES);
    setStudioOpen(true);
  }, []);

  const value = useMemo(
    () => ({
      viewerStatus,
      viewerOpen,
      viewerError,
      openTargets,
      activeTargetId,
      activeCitation,
      openDocumentViewer,
      activateTab,
      closeTab,
      closeViewer,
      markViewerResolved,
      markViewerLoading,
      markViewerError,
      zoom,
      setZoom,
      fitWidth,
      setFitWidth,
      currentPage,
      setCurrentPage,
      searchOpen,
      setSearchOpen,
      searchQuery,
      setSearchQuery,
      infoOpen,
      setInfoOpen,
      evidenceWidth,
      setEvidenceWidth,
      focusMode,
      setFocusMode,
      evidenceOpen,
      setEvidenceOpen,
      sidebarOpen,
      setSidebarOpen,
      studioOpen,
      setStudioOpen,
      researchPanelTab,
      setResearchPanelTab,
      openResearchPanel,
      researchSearchRequest,
      researchSearchScope,
      setResearchSearchScope,
      focusResearchSearch,
      timelineRequest,
      focusTimeline,
      recordActivity,
      noteCreateRequest,
      requestCreateNote,
      createCollectionRequest,
      requestCreateCollection,
      assignSourceFileName,
      setAssignSource,
      openCollectionId,
      openCollection,
      closeCollection,
      recentCollections,
      recentDocuments,
      bookmarks,
      savedEvidence,
      notes,
      insights,
      collections,
      activeCollectionId,
      activeCollection,
      events,
      history,
      toggleBookmark,
      removeBookmark,
      isBookmarked,
      saveEvidence,
      removeSavedEvidence,
      isEvidenceSaved,
      createNote,
      updateNote,
      deleteNote,
      duplicateNote,
      createInsight,
      updateInsight,
      deleteInsight,
      createCollection,
      renameCollection,
      updateCollection,
      toggleCollectionPinned,
      deleteCollection,
      addToCollection,
      removeFromCollection,
      setActiveCollection,
      recordQuestion,
      markQuestionAnswered,
      toggleQuestionSaved,
      recordSearch,
      clearHistory,
    }),
    [
      viewerStatus, viewerOpen, viewerError, openTargets, activeTargetId, activeCitation,
      openDocumentViewer, activateTab, closeTab, closeViewer, markViewerResolved, markViewerLoading, markViewerError,
      zoom, fitWidth, currentPage, searchOpen, searchQuery, infoOpen, evidenceWidth,
      focusMode, evidenceOpen, sidebarOpen, studioOpen, researchPanelTab, openResearchPanel,
      researchSearchRequest, researchSearchScope, setResearchSearchScope, focusResearchSearch,
      timelineRequest, focusTimeline, recordActivity,
      noteCreateRequest, requestCreateNote, createCollectionRequest, requestCreateCollection,
      assignSourceFileName, setAssignSource, openCollectionId, openCollection, closeCollection, recentCollections,
      recentDocuments, bookmarks, savedEvidence, notes, insights, collections,
      activeCollectionId, activeCollection, events, history,
      toggleBookmark, removeBookmark, isBookmarked, saveEvidence, removeSavedEvidence, isEvidenceSaved,
      createNote, updateNote, deleteNote, duplicateNote,
      createInsight, updateInsight, deleteInsight,
      createCollection, renameCollection, updateCollection, toggleCollectionPinned, deleteCollection,
      addToCollection, removeFromCollection, setActiveCollection,
      recordQuestion, markQuestionAnswered, toggleQuestionSaved, recordSearch, clearHistory,
    ]
  );

  return <ResearchContext.Provider value={value}>{children}</ResearchContext.Provider>;
}

export function useResearch() {
  const context = useContext(ResearchContext);
  if (!context) throw new Error("useResearch must be used inside ResearchProvider");
  return context;
}