import {
  FileText,
  FileUp,
  MessageCircleQuestion,
  CheckCircle2,
  Quote,
  NotebookPen,
  Lightbulb,
  FolderOpen,
  FolderPlus,
  Bookmark,
  Link2,
  Unlink,
  History,
} from "lucide-react";

/**
 * Research activity presentation registry. Canonical types (see
 * researchModels.ACTIVITY_TYPE_ALIASES for the legacy-name mapping) each
 * carry the language used across the timeline journal: the eyebrow label,
 * the action verb for context restoration, the semantic icon, and a tone
 * used for the icon tile (icon + color; never color alone).
 */
export const ACTIVITY_META = {
  document_opened: { label: "Opened document", verb: "Open document", icon: FileText, tone: "document" },
  source_added: { label: "Added source", verb: "Open document", icon: FileUp, tone: "source" },
  bookmark_created: { label: "Bookmarked source", verb: "Open document", icon: Bookmark, tone: "bookmark" },
  question_created: { label: "Asked question", verb: "View question", icon: MessageCircleQuestion, tone: "question" },
  question_answered: { label: "Question answered", verb: "View question", icon: CheckCircle2, tone: "question" },
  evidence_saved: { label: "Saved evidence", verb: "Open evidence", icon: Quote, tone: "evidence" },
  note_created: { label: "Created note", verb: "Open notes", icon: NotebookPen, tone: "note" },
  note_updated: { label: "Updated note", verb: "Open notes", icon: NotebookPen, tone: "note" },
  insight_created: { label: "Saved insight", verb: "Open insights", icon: Lightbulb, tone: "insight" },
  insight_updated: { label: "Updated insight", verb: "Open insights", icon: Lightbulb, tone: "insight" },
  collection_created: { label: "Created collection", verb: "Open collection", icon: FolderPlus, tone: "collection" },
  collection_updated: { label: "Updated collection", verb: "Open collection", icon: FolderOpen, tone: "collection" },
  collection_opened: { label: "Opened collection", verb: "Open collection", icon: FolderOpen, tone: "collection" },
  item_linked: { label: "Linked to collection", verb: "Open collection", icon: Link2, tone: "collection" },
  item_unlinked: { label: "Removed from collection", verb: "Open collection", icon: Unlink, tone: "collection" },
};

const FALLBACK = { label: "Research activity", verb: "Open", icon: History, tone: "activity" };

export function activityMeta(type) {
  return ACTIVITY_META[type] || FALLBACK;
}

/** Filter buckets used by the timeline chip row. */
export function activityBucket(type) {
  switch (type) {
    case "question_created":
    case "question_answered":
      return "questions";
    case "evidence_saved":
      return "evidence";
    case "note_created":
    case "note_updated":
      return "notes";
    case "insight_created":
    case "insight_updated":
      return "insights";
    case "collection_created":
    case "collection_updated":
    case "collection_opened":
    case "item_linked":
    case "item_unlinked":
      return "collections";
    case "document_opened":
    case "bookmark_created":
      return "documents";
    case "source_added":
      return "sources";
    default:
      return "all";
  }
}

export const TIMELINE_BUCKETS = [
  { id: "today", label: "Today" },
  { id: "all", label: "All" },
  { id: "documents", label: "Documents" },
  { id: "questions", label: "Questions" },
  { id: "evidence", label: "Evidence" },
  { id: "notes", label: "Notes" },
  { id: "insights", label: "Insights" },
  { id: "collections", label: "Collections" },
  { id: "sources", label: "Sources" },
];
