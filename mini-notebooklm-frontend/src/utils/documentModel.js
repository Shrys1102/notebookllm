/**
 * Frontend document & citation model.
 *
 * The backend currently exposes:
 *   - /files → { file_name, size_bytes, uploaded_at, extension }
 *   - /ask   → sources: [{ source, chunk_index, preview }]
 *
 * Everything else (pageNumber, pageCount, section, chunkText, highlightRanges,
 * boundingBoxes, documentId, ...) is FUTURE backend metadata. The normalizers
 * below tolerate those fields when they arrive and never require them today.
 *
 * The UI must only consume fields via these normalizers so a backend contract
 * change stays a one-file change.
 */

import { getFileExtension } from "./formatters.js";

const MIME_BY_EXT = {
  ".pdf": "application/pdf",
  ".txt": "text/plain",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

export const DOCUMENT_KINDS = {
  PDF: "pdf",
  TXT: "txt",
  DOCX: "docx",
  PPTX: "pptx",
  UNKNOWN: "unknown",
};

export function getDocumentKind(fileName = "") {
  const ext = getFileExtension(fileName).toLowerCase();
  if (ext === ".pdf") return DOCUMENT_KINDS.PDF;
  if (ext === ".txt") return DOCUMENT_KINDS.TXT;
  if (ext === ".docx") return DOCUMENT_KINDS.DOCX;
  if (ext === ".pptx") return DOCUMENT_KINDS.PPTX;
  return DOCUMENT_KINDS.UNKNOWN;
}

export function getMimeType(fileName = "") {
  return MIME_BY_EXT[getFileExtension(fileName).toLowerCase()] || "application/octet-stream";
}

/**
 * Normalize a raw file record from GET /files (or an upload result).
 * All future fields pass through untouched (documentId, pageCount, chunkCount,
 * processingStatus, sourceUrl, ...).
 */
export function normalizeFile(raw = {}) {
  // Idempotent: accepts raw API records (file_name) and already-normalized
  // file objects (fileName).
  const fileName = raw.file_name || raw.fileName || raw.filename || raw.name || "";
  return {
    documentId: raw.documentId ?? raw.document_id ?? null,
    fileName,
    source: raw.source || fileName,
    sizeBytes: raw.size_bytes ?? raw.sizeBytes ?? null,
    uploadedAt: raw.uploaded_at ?? raw.uploadedAt ?? null,
    extension: (raw.extension || getFileExtension(fileName)).toLowerCase(),
    mimeType: raw.mimeType || getMimeType(fileName),
    kind: getDocumentKind(fileName),
    // Future backend fields (tolerated, never required):
    documentVersion: raw.documentVersion ?? raw.document_version ?? null,
    pageCount: raw.pageCount ?? raw.page_count ?? null,
    chunkCount: raw.chunkCount ?? raw.chunk_count ?? null,
    processingStatus: raw.processingStatus ?? raw.processing_status ?? null,
    sourceUrl: raw.sourceUrl ?? raw.source_url ?? null,
    raw,
  };
}

/**
 * Normalize a citation / evidence target. Accepts whatever the current code
 * passes around (source cards from /ask, viewer targets, SourceAccordion items)
 * and future structured citation payloads.
 */
export function normalizeCitation(raw = {}) {
  const fileName = raw.fileName || raw.file_name || raw.source || raw.documentName || "";
  const chunkId = raw.chunkId ?? raw.chunk_id ?? (raw.chunk_index !== undefined && raw.chunk_index !== -1 ? raw.chunk_index : null);
  const preview = raw.excerpt || raw.preview || raw.chunkText || raw.chunk_text || raw.content || null;
  return {
    id: raw.id || raw.citationId || (fileName ? `${fileName}:${chunkId ?? "doc"}` : `citation-${Math.random().toString(36).slice(2, 8)}`),
    documentId: raw.documentId ?? raw.document_id ?? null,
    fileName,
    source: raw.source || fileName,
    mimeType: raw.mimeType || getMimeType(fileName),
    kind: raw.kind || getDocumentKind(fileName),
    pageNumber: raw.pageNumber ?? raw.page_number ?? null,
    pageCount: raw.pageCount ?? raw.page_count ?? null,
    section: raw.section ?? raw.sectionName ?? null,
    heading: raw.heading ?? null,
    chunkId,
    chunkIndex: raw.chunk_index ?? null,
    chunkText: raw.chunkText ?? raw.chunk_text ?? preview,
    excerpt: preview,
    preview,
    highlightRanges: raw.highlightRanges ?? raw.highlight_ranges ?? null,
    boundingBoxes: raw.boundingBoxes ?? raw.bounding_boxes ?? null,
    characterOffsets: raw.characterOffsets ?? raw.character_offsets ?? null,
    sourceUrl: raw.sourceUrl ?? raw.source_url ?? null,
    sourceIndex: raw.sourceIndex ?? raw.source_index ?? null,
    questionContext: raw.questionContext ?? raw.question_context ?? null,
    file: raw.file || null,
    raw,
  };
}

/**
 * How the viewer can render a given document kind TODAY.
 *  - content-dependent: real reading surface when text content is present
 *  - preview-unavailable: no content API exists; evidence excerpt only
 *  - unsupported-rendering: format-specific renderer not available
 */
export function getViewerCapability(kind) {
  switch (kind) {
    case DOCUMENT_KINDS.TXT:
      return "content-dependent";
    case DOCUMENT_KINDS.PDF:
      return "preview-unavailable";
    case DOCUMENT_KINDS.DOCX:
    case DOCUMENT_KINDS.PPTX:
      return "unsupported-rendering";
    default:
      return "unsupported-rendering";
  }
}

/**
 * Derive the honest viewer content state for a document + available text.
 */
export function getContentState(file, citation) {
  const kind = file?.kind || citation?.kind || getDocumentKind(file?.fileName || citation?.fileName || "");
  const capability = getViewerCapability(kind);
  const excerpt = citation?.excerpt || null;
  if (capability === "content-dependent") {
    return excerpt ? { state: "READY", excerpt, kind } : { state: "NO_CONTENT", kind };
  }
  return { state: "UNAVAILABLE", kind, capability, excerpt };
}