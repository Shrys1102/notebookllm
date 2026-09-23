import { useEffect, useMemo, useState } from "react";
import { History, BookOpen, Layers, FolderOpen, Search } from "lucide-react";
import { useResearch } from "../../context/ResearchContext.jsx";
import { activityBucket } from "./activityMeta.js";
import { runActivityRestore } from "../../utils/timelineRestore.js";
import TimelineFilters from "./TimelineFilters.jsx";
import TimelineGroup from "./TimelineGroup.jsx";
import TimelineEmptyState from "./TimelineEmptyState.jsx";

const SESSION_GAP_MS = 25 * 60 * 1000;
const OLD_DAYS = 180;

function sameCalendarDay(isoA, isoB) {
  const a = new Date(isoA);
  const b = new Date(isoB);
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function dateLabelFor(iso) {
  const d = new Date(iso);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((startToday - startDay) / 86400000);
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays > OLD_DAYS) return "Older";
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: "long" });
  const sameYear = d.getFullYear() === now.getFullYear();
  return sameYear
    ? d.toLocaleDateString([], { month: "long", day: "numeric" })
    : d.toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" });
}

function matchesBucket(activity, bucket) {
  if (bucket === "all") return true;
  if (bucket === "today") return sameCalendarDay(activity.at, new Date().toISOString());
  return activityBucket(activity.type) === bucket;
}

/**
 * The research journal — a dedicated, temporal memory surface. Groups real
 * activity by day, splits days into derived research sessions (temporal
 * proximity), filters by activity type or collection, and restores the
 * exact research context for any entry. Nothing here fabricates history.
 */
export default function ResearchTimeline({ onOpenDocument }) {
  const research = useResearch();
  const { events, collections, savedEvidence, notes, insights, history, openCollection, openResearchPanel, timelineRequest } = research;

  const [bucket, setBucket] = useState("all");
  const [collectionFilter, setCollectionFilter] = useState(null);

  // Palette / shortcut requests: "View Today's Research", "Reset filter".
  useEffect(() => {
    if (timelineRequest.n > 0) {
      setBucket(timelineRequest.filter === "today" ? "today" : "all");
      setCollectionFilter(null);
    }
  }, [timelineRequest]);

  const filtered = useMemo(() => {
    return events.filter((e) => matchesBucket(e, bucket) && (!collectionFilter || e.collectionId === collectionFilter));
  }, [events, bucket, collectionFilter]);

  const groups = useMemo(() => {
    const map = new Map();
    for (const event of filtered) {
      const isoDay = new Date(event.at);
      isoDay.setHours(0, 0, 0, 0);
      const key = isoDay.toISOString();
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(event);
    }
    const sortedDays = [...map.keys()].sort((a, b) => (a < b ? 1 : -1));
    return sortedDays.map((key) => {
      const dayEvents = map.get(key).sort((a, b) => (a.at < b.at ? 1 : -1));
      // Sessions: split where the gap between consecutive activities
      // (newest first) exceeds the session gap.
      const sessions = [];
      let current = [];
      for (let i = 0; i < dayEvents.length; i += 1) {
        current.push(dayEvents[i]);
        const next = dayEvents[i + 1];
        if (next && Date.parse(current[current.length - 1].at) - Date.parse(next.at) >= SESSION_GAP_MS) {
          sessions.push(current);
          current = [];
        }
      }
      if (current.length) sessions.push(current);
      return { label: dateLabelFor(key), sessions };
    });
  }, [filtered]);

  const live = useMemo(() => ({ savedEvidence, notes, insights, history }), [savedEvidence, notes, insights, history]);

  const restore = (activity) => {
    runActivityRestore(activity, { onOpenDocument, openCollection, openResearchPanel });
  };

  const totalActivities = events.length;

  return (
    <div className="researchTimelineSurface" aria-label="Research timeline">
      <div className="researchSectionHeader">
        <div className="researchSectionTitle">
          <History size={14} />
          <span>Research Timeline</span>
          <span className="researchCountBadge">{totalActivities}</span>
        </div>
      </div>

      {events.length > 0 && (
        <TimelineFilters
          events={events}
          collections={collections}
          bucket={bucket}
          onBucketChange={setBucket}
          collectionFilter={collectionFilter}
          onCollectionChange={setCollectionFilter}
        />
      )}

      {events.length === 0 ? (
        <TimelineEmptyState
          onExplore={() => openResearchPanel("overview")}
        />
      ) : filtered.length === 0 ? (
        <div className="researchEmptyState">
          <Search size={20} className="textMuted" />
          <strong>No activity matches this filter</strong>
          <p>Try another activity type or clear the collection filter to see the full journal.</p>
        </div>
      ) : (
        <div className="tlJournal">
          {groups.map((group) => (
            <TimelineGroup
              key={group.label}
              group={group}
              collections={collections}
              live={live}
              onRestore={restore}
              previewable
            />
          ))}
        </div>
      )}

      {events.length === 0 && (
        <div className="tlJourneyRow">
          <span className="tlJourneyPill"><BookOpen size={11} /> Notes</span>
          <span className="tlJourneyPill"><Layers size={11} /> Sources</span>
          <span className="tlJourneyPill"><FolderOpen size={11} /> Collections</span>
        </div>
      )}

      <div className="researchLocalNotice">
        <History size={11} />
        <span>Your research journal is stored locally in this browser and keeps the most recent {totalActivities >= 200 ? 200 : totalActivities} activities. Pick any entry to return to that exact research context.</span>
      </div>
    </div>
  );
}