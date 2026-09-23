import { Sparkles, ArrowRight } from "lucide-react";
import { activityMeta } from "./activityMeta.js";

/**
 * Lightweight context preview for a timeline event: resolves the activity's
 * references against real live data (never fabricating) and shows what a
 * restore will bring back, with a single Restore action.
 */
export default function TimelineContextPreview({ activity, live = {}, collectionName = null, onRestore }) {
  const { savedEvidence = [], notes = [], insights = [], history = {} } = live;
  const meta = activityMeta(activity.type);

  let detail = null;

  if (activity.type === "evidence_saved") {
    const item = activity.evidenceId ? savedEvidence.find((e) => e.id === activity.evidenceId) : null;
    const snippet = item?.excerpt || null;
    detail = snippet ? { label: "Saved passage", body: snippet } : { label: "Evidence", body: activity.title };
  } else if (activity.type === "note_created" || activity.type === "note_updated") {
    const note = activity.noteId ? notes.find((n) => n.id === activity.noteId) : null;
    const body = note?.body || "";
    detail = { label: note ? "Note" : "Note (original removed)", body: body ? body.slice(0, 240) : activity.title };
  } else if (activity.type === "insight_created" || activity.type === "insight_updated") {
    const insight = activity.insightId ? insights.find((i) => i.id === activity.insightId) : null;
    detail = { label: insight ? "Insight" : "Insight (original removed)", body: (insight?.body || activity.title).slice(0, 240) };
  } else if (activity.type === "question_created" || activity.type === "question_answered") {
    const q = activity.questionId ? (history.questions || []).find((x) => x.id === activity.questionId) : null;
    if (q) {
      detail = { label: `Question · ${q.status}`, body: q.text };
    } else if (activity.title) {
      detail = { label: "Question", body: activity.title };
    }
  } else if (activity.type === "collection_created" || activity.type === "collection_opened" || activity.type === "collection_updated") {
    detail = { label: "Collection", body: activity.title };
  }

  return (
    <div className="tlPreview" role="group" aria-label="Research context preview">
      <span className="tlPreviewEyebrow">
        <Sparkles size={11} />
        Research context
      </span>
      {detail && (
        <p className="tlPreviewBody">
          <em>{detail.label}</em>
          {detail.body}
        </p>
      )}
      <div className="tlPreviewMeta">
        {collectionName && <span className="tlPreviewChip">{collectionName}</span>}
        {activity.metadata?.pageNumber != null && <span className="tlPreviewChip">p.{activity.metadata.pageNumber}</span>}
        {activity.metadata?.chunkId != null && activity.metadata?.chunkId !== undefined && <span className="tlPreviewChip">chunk {activity.metadata.chunkId + 1}</span>}
      </div>
      <button type="button" className="tlPreviewRestore" onClick={() => onRestore(activity)}>
        Restore research context
        <ArrowRight size={12} />
      </button>
      <span className="tlPreviewHint">{meta.verb}</span>
    </div>
  );
}