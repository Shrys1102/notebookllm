import { Clock } from "lucide-react";
import TimelineItem from "./TimelineItem.jsx";

function shortTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function dominantCollection(events, collections) {
  const counts = {};
  let best = null;
  for (const e of events) {
    if (!e.collectionId) continue;
    counts[e.collectionId] = (counts[e.collectionId] || 0) + 1;
    if (!best || counts[e.collectionId] > counts[best]) best = e.collectionId;
  }
  if (!best) return null;
  return collections.find((c) => c.id === best)?.name || null;
}

/**
 * A dated section of the research journal: a calm date header, then one or
 * more derived research sessions (temporal proximity only — 25-minute gaps
 * split sessions; no invented titles), each listing its activities.
 */
export default function TimelineGroup({ group, collections = [], live = {}, onRestore, previewable }) {
  // Defensive: never crash on malformed or legacy group/session shapes —
  // skip empty sessions instead of assuming every session has events.
  const sessions = (group.sessions || [])
    .map((session) => ({
      ...session,
      events: Array.isArray(session?.events) ? session.events : [],
    }))
    .filter((session) => session.events.length > 0);
  const total = sessions.reduce((n, s) => n + s.events.length, 0);
  if (!sessions.length) return null;

  return (
    <section className="tlGroup" aria-label={`${group.label} research activity`}>
      <header className="tlGroupHeader">
        <span className="tlGroupLabel">{group.label}</span>
        <span className="tlGroupCount">
          {total} activit{total === 1 ? "y" : "ies"}
        </span>
      </header>

      {sessions.map((session, si) => {
        const collectionName = dominantCollection(session.events, collections);
        return (
          <div key={si} className="tlSession">
            <header className="tlSessionHeader">
              <Clock size={10} />
              <span className="tlSessionRange">
                {shortTime(session.events[0].at)}
                {session.events.length > 1 ? ` – ${shortTime(session.events[session.events.length - 1].at)}` : ""}
              </span>
              <span className="tlSessionCount">{session.events.length} activit{session.events.length === 1 ? "y" : "ies"}</span>
              {collectionName && <span className="tlSessionCollection">{collectionName}</span>}
            </header>
            <ul className="tlItemList">
              {session.events.map((activity) => (
                <TimelineItem
                  key={activity.id}
                  activity={activity}
                  live={live}
                  collections={collections}
                  onRestore={onRestore}
                  previewable={previewable}
                />
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}