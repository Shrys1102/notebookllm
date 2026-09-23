import { useMemo, useState } from "react";
import { History, ArrowRight, X } from "lucide-react";
import { useResearch } from "../../context/ResearchContext.jsx";
import { activityMeta } from "../timeline/activityMeta.js";

/**
 * Compact dashboard strip — the few most recent real research actions with
 * one-tap restore and a path to the full timeline. Reads activity straight
 * from ResearchContext; never fabricates entries. Dismissible for the
 * current page view; reappears when new activity lands.
 */
export default function RecentActivityStrip({ limit = 4 }) {
  const { events, openResearchPanel, openDocumentViewer, openCollection } = useResearch();
  const [dismissed, setDismissed] = useState(false);

  const recent = useMemo(
    () => events.slice(0, limit).map((event) => ({ ...event, meta: activityMeta(event.type) })),
    [events, limit]
  );

  if (!recent.length || dismissed) return null;

  const restore = (activity) => {
    const fileName = activity.fileName || activity.sourceId;
    switch (activity.type) {
      case "document_opened":
      case "source_added":
      case "bookmark_created":
        if (fileName) openDocumentViewer({ fileName });
        else openResearchPanel("overview");
        break;
      case "evidence_saved":
        openDocumentViewer({
          fileName,
          chunkId: activity.metadata?.chunkId ?? null,
          chunk_index: activity.metadata?.chunkId ?? null,
        });
        break;
      case "collection_created":
      case "collection_updated":
      case "collection_opened":
      case "item_linked":
      case "item_unlinked":
        openCollection(activity.collectionId);
        break;
      default:
        openResearchPanel("overview");
        break;
    }
  };

  return (
    <section className="recentActivityStrip" aria-label="Recent research activity">
      <header className="recentActivityHeader">
        <span className="recentActivityTitle">
          <History size={12} />
          Recent research
        </span>
        <div className="recentActivityHeaderActions">
          <button
            type="button"
            className="recentActivityMore"
            onClick={() => openResearchPanel("timeline")}
          >
            View timeline
            <ArrowRight size={11} />
          </button>
          <button
            type="button"
            className="recentActivityDismiss"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss recent research"
            title="Dismiss"
          >
            <X size={11} />
          </button>
        </div>
      </header>
      <ol className="recentActivityList">
        {recent.map((activity) => {
          const Icon = activity.meta.icon;
          return (
            <li key={activity.id}>
              <button
                type="button"
                className="recentActivityRow"
                onClick={() => restore(activity)}
                title={`${activity.meta.verb} — ${activity.title || activity.meta.label}`}
              >
                <span className="recentActivityDot">
                  <Icon size={11} />
                </span>
                <span className="recentActivityText">
                  <em>{activity.meta.label}</em>
                  <strong>{activity.title}</strong>
                </span>
                <ArrowRight size={11} className="recentActivityGo" />
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
