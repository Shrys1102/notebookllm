import { useMemo, useState } from "react";
import { Info, ExternalLink, Trash2 } from "lucide-react";
import { activityMeta } from "./activityMeta.js";
import { resolveActivityContext } from "../../utils/timelineRestore.js";
import TimelineContextPreview from "./TimelineContextPreview.jsx";

function timeLabel(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * One entry in the research journal. The row is a single semantic control:
 * activating it restores the exact research context (document, collection,
 * surface). An optional context toggle reveals a compact preview of what
 * the restore brings back. Deleted objects render gracefully — the row
 * stays readable and never crashes.
 */
export default function TimelineItem({ activity, live = {}, collections = [], onRestore, previewable }) {
  const meta = activityMeta(activity.type);
  const Icon = meta.icon;
  const [showPreview, setShowPreview] = useState(false);

  const resolved = useMemo(() => resolveActivityContext(activity, { collections }), [activity, collections]);
  const available = resolved.status === "ok";
  const collectionName = resolved.collectionName;

  const title = activity.title || resolved.title || meta.label;
  const description = activity.description || null;
  const hasPreview = previewable && (showPreview ? true : Boolean(activity.questionId || activity.insightId || activity.noteId || activity.evidenceId || activity.collectionId));

  return (
    <li className={`tlItem tone-${meta.tone} ${available ? "" : "unavailable"}`}>
      <div className="tlItemRail" aria-hidden="true" />
      <div className="tlItemMain">
        <button
          type="button"
          className="tlItemAction"
          onClick={() => onRestore(activity)}
          aria-label={`${available ? meta.verb : "View"} — ${title}`}
          disabled={!available}
        >
          <span className="tlItemIcon">
            <Icon size={14} />
          </span>
          <span className="tlItemText">
            <span className="tlItemEyebrow">
              {meta.label}
              <time dateTime={activity.at}>{timeLabel(activity.at)}</time>
            </span>
            <strong className="tlItemTitle">{title}</strong>
            {description && <span className="tlItemDesc">{description}</span>}
            <span className="tlItemChips">
              {collectionName && <span className="tlItemChip">{collectionName}</span>}
              {activity.metadata?.scope && <span className="tlItemChip">{activity.metadata.scope}</span>}
              {resolved.status === "collection_missing" && (
                <span className="tlItemChip missing">
                  <Trash2 size={9} />
                  Collection removed
                </span>
              )}
              {resolved.status === "object_missing" && <span className="tlItemChip missing">Original item unavailable</span>}
            </span>
          </span>
          <span className="tlItemGo">
            {available ? meta.verb : "Unavailable"}
            <ExternalLink size={11} />
          </span>
        </button>
        {hasPreview && (
          <button
            type="button"
            className={`tlItemInfo ${showPreview ? "open" : ""}`}
            onClick={() => setShowPreview((v) => !v)}
            aria-expanded={showPreview}
            aria-label={showPreview ? "Hide research context preview" : "Show research context preview"}
            title="Context preview"
          >
            <Info size={12} />
          </button>
        )}
      </div>
      {showPreview && (
        <TimelineContextPreview
          activity={activity}
          live={live}
          collectionName={collectionName}
          onRestore={(a) => {
            onRestore(a);
            setShowPreview(false);
          }}
        />
      )}
    </li>
  );
}