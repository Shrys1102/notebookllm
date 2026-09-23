/**
 * Phase 5 research entity models.
 *
 * All entities are local-first (browser storage). Normalizers tolerate future
 * backend identifiers (insightId, collectionId, sourceId, ...) without
 * requiring them today, so a future sync backend can plug in cleanly.
 *
 *   local data → normalize → frontend model → UI
 */

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Collection accent palette — a restrained set of research-friendly hues.
 * Components apply the accent as the CSS custom properties
 * `--c-accent` (base) and `--c-accent-strong` (readable on light/dark), so
 * soft/glow variants are derived with color-mix in styles.
 */
export const COLLECTION_ACCENTS = {
  teal: { base: "#2a7a6e", strong: "#0f3d37", label: "Teal" },
  sage: { base: "#5d7a54", strong: "#2c4327", label: "Sage" },
  amber: { base: "#a8862f", strong: "#5c4711", label: "Amber" },
  rust: { base: "#b45f3a", strong: "#6b3318", label: "Rust" },
  blue: { base: "#3a6ea5", strong: "#1d3d61", label: "Blue" },
  violet: { base: "#7a5ca8", strong: "#3f2a63", label: "Violet" },
  rose: { base: "#b0566a", strong: "#6b2737", label: "Rose" },
  slate: { base: "#55606e", strong: "#262d37", label: "Slate" },
};

export const COLLECTION_ACCENT_KEYS = Object.keys(COLLECTION_ACCENTS);

/** Deterministic accent pick so every collection has a quiet visual identity. */
export function accentForKey(name = "") {
  let hash = 0;
  const text = String(name);
  for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) | 0;
  const key = COLLECTION_ACCENT_KEYS[Math.abs(hash) % COLLECTION_ACCENT_KEYS.length];
  return { key, ...COLLECTION_ACCENTS[key] };
}

/**
 * A source reference inside an insight: only fields that exist are populated.
 * Future: sourceId, citationId, characterOffsets, highlightRanges.
 */
export function makeSourceReference(raw = {}) {
  return {
    fileName: raw.fileName || raw.source || raw.file_name || null,
    chunkId: raw.chunkId ?? raw.chunk_id ?? raw.chunk_index ?? null,
    chunkIndex: raw.chunk_index ?? null,
    excerpt: raw.excerpt || raw.preview || raw.chunkText || null,
    section: raw.section ?? null,
    pageNumber: raw.pageNumber ?? raw.page_number ?? null,
    documentId: raw.documentId ?? raw.document_id ?? null,
    sourceId: raw.sourceId ?? raw.source_id ?? null,
    citationId: raw.citationId ?? raw.citation_id ?? null,
  };
}

export function normalizeInsight(raw = {}) {
  return {
    id: raw.id || raw.insightId || makeId("insight"),
    title: (raw.title || "Untitled insight").slice(0, 240),
    body: raw.body || "",
    sourceReferences: Array.isArray(raw.sourceReferences)
      ? raw.sourceReferences.filter(Boolean).map(makeSourceReference)
      : [],
    collectionIds: Array.isArray(raw.collectionIds) ? raw.collectionIds : [],
    createdAt: raw.createdAt || raw.created_at || nowIso(),
    updatedAt: raw.updatedAt || raw.updated_at || raw.createdAt || nowIso(),
    raw,
  };
}

export function normalizeCollection(raw = {}) {
  const members = raw.members || {};
  const name = (raw.name || "Untitled collection").slice(0, 80);
  const requestedKey = raw.accentKey || raw.accent;
  const accent = COLLECTION_ACCENTS[requestedKey] ? { key: requestedKey, ...COLLECTION_ACCENTS[requestedKey] } : accentForKey(name);
  return {
    id: raw.id || raw.collectionId || makeId("collection"),
    name,
    description: raw.description || "",
    accentKey: accent.key,
    pinned: Boolean(raw.pinned),
    members: {
      sources: Array.isArray(members.sources) ? members.sources : [],
      questions: Array.isArray(members.questions) ? members.questions : [],
      evidence: Array.isArray(members.evidence) ? members.evidence : [],
      notes: Array.isArray(members.notes) ? members.notes : [],
      insights: Array.isArray(members.insights) ? members.insights : [],
    },
    createdAt: raw.createdAt || raw.created_at || nowIso(),
    updatedAt: raw.updatedAt || raw.updated_at || raw.createdAt || nowIso(),
    raw,
  };
}

export function collectionAccentMeta(collection) {
  const meta = COLLECTION_ACCENTS[collection?.accentKey] || COLLECTION_ACCENTS.teal;
  return { ...meta, key: collection?.accentKey || "teal" };
}

export function normalizeQuestion(raw = {}) {
  return {
    id: raw.id || makeId("question"),
    text: raw.text || "",
    scope: raw.scope || null,
    status: raw.status || "asked", // asked | answered | saved
    saved: Boolean(raw.saved),
    collectionIds: Array.isArray(raw.collectionIds) ? raw.collectionIds : [],
    at: raw.at || raw.createdAt || nowIso(),
    raw,
  };
}

/**
 * Canonical research activity vocabulary. Legacy aliases (recorded by
 * earlier phases) map onto their canonical type at display/restore time.
 */
export const ACTIVITY_TYPE_ALIASES = {
  question_asked: "question_created",
  bookmark_added: "bookmark_created",
};

export function canonicalActivityType(type) {
  return ACTIVITY_TYPE_ALIASES[type] || type || "activity";
}

/**
 * ResearchActivity — the temporal memory record. Reference fields are all
 * optional and normalized (never embedded copies of objects). Carries
 * legacy fields (label / entityType / entityId / fileName) so activity
 * recorded by earlier phases keeps displaying after this upgrade.
 */
export function normalizeEvent(raw = {}) {
  const at = raw.at || raw.createdAt || raw.timestamp || nowIso();
  return {
    id: raw.id || makeId("activity"),
    type: canonicalActivityType(raw.type || "activity"),
    title: raw.title || raw.label || "",
    description: raw.description || "",
    objectType: raw.objectType || raw.entityType || null,
    objectId: raw.objectId || raw.entityId || null,
    collectionId: raw.collectionId ?? null,
    sourceId: raw.sourceId ?? null,
    questionId: raw.questionId ?? null,
    insightId: raw.insightId ?? null,
    noteId: raw.noteId ?? null,
    evidenceId: raw.evidenceId ?? null,
    fileName: raw.fileName ?? null,
    metadata: raw.metadata && typeof raw.metadata === "object" ? raw.metadata : {},
    // legacy aliases
    label: raw.label || "",
    entityType: raw.entityType || null,
    entityId: raw.entityId || null,
    at,
    raw,
  };
}