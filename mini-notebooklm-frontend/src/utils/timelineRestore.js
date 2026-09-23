import { activityMeta } from "../components/timeline/activityMeta.js";

/**
 * Context restoration for timeline activities.
 *
 * An activity never embeds objects — it carries normalized references. To
 * restore, resolve those references against live data and navigate with the
 * existing infrastructure (document viewer, collection workspace, research
 * surface tabs). If the referenced object no longer exists, we say so and
 * navigate to the closest valid surface; nothing is fabricated.
 */

export function resolveActivityContext(activity, live = {}) {
  const { collections = [] } = live;
  const collection = activity.collectionId ? collections.find((c) => c.id === activity.collectionId) || null : null;

  let title = activity.title || "";
  let status = "ok"; // ok | collection_missing | object_missing
  let collectionName = collection?.name || null;

  switch (activity.type) {
    case "collection_created":
    case "collection_updated":
    case "collection_opened":
    case "item_linked":
    case "item_unlinked":
      if (!activity.collectionId) status = "object_missing";
      else if (!collection) status = "collection_missing";
      break;
    case "document_opened":
    case "source_added":
    case "bookmark_created":
      if (!activity.fileName && !activity.sourceId) status = "object_missing";
      break;
    case "evidence_saved":
      if (!activity.evidenceId && !activity.fileName) status = "object_missing";
      break;
    case "question_created":
    case "question_answered":
      if (!activity.questionId && !activity.title) status = "object_missing";
      break;
    case "note_created":
    case "note_updated":
      if (!activity.noteId && !activity.title) status = "object_missing";
      break;
    case "insight_created":
    case "insight_updated":
      if (!activity.insightId && !activity.title) status = "object_missing";
      break;
    default:
      break;
  }

  return { collection, collectionName, title, status };
}

/**
 * Returns true when the activity still points at a live object worth
 * restoring (a deleted collection makes its events read-only).
 */
export function activityRestorable(activity, live = {}) {
  return resolveActivityContext(activity, live).status === "ok";
}

/** Run the restore for an activity through existing navigation helpers. */
export function runActivityRestore(activity, helpers = {}) {
  const { onOpenDocument, openCollection, openResearchPanel } = helpers;
  const fileName = activity.fileName || activity.sourceId;

  switch (activity.type) {
    case "document_opened":
    case "source_added":
    case "bookmark_created":
      if (fileName) onOpenDocument?.({ fileName });
      else openResearchPanel?.("overview");
      break;
    case "evidence_saved":
      onOpenDocument?.({
        fileName,
        chunkId: activity.metadata?.chunkId ?? null,
        chunk_index: activity.metadata?.chunkId ?? null,
      });
      break;
    case "note_created":
    case "note_updated":
      openResearchPanel?.("notes");
      break;
    case "insight_created":
    case "insight_updated":
      openResearchPanel?.("insights");
      break;
    case "question_created":
    case "question_answered":
      openResearchPanel?.("overview");
      break;
    case "collection_created":
    case "collection_updated":
    case "collection_opened":
    case "item_linked":
    case "item_unlinked":
      openCollection?.(activity.collectionId);
      break;
    default:
      openResearchPanel?.("overview");
      break;
  }
}

/** Short action verb for a row button, e.g. "Open collection". */
export function activityVerb(activity) {
  return activityMeta(activity.type).verb;
}
