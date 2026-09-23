import { useMemo } from "react";
import { TIMELINE_BUCKETS, activityBucket } from "./activityMeta.js";

/**
 * Timeline filter row: activity buckets (Today / All / object types) plus a
 * quiet "in collection" selector derived from the collections that actually
 * appear in recorded activity. Chip counts are real.
 */
export default function TimelineFilters({ events = [], collections = [], bucket, onBucketChange, collectionFilter, onCollectionChange }) {
  const counts = useMemo(() => {
    const map = {};
    for (const event of events) {
      const b = activityBucket(event.type);
      map[b] = (map[b] || 0) + 1;
    }
    return map;
  }, [events]);

  const collectionsPresent = useMemo(() => {
    const ids = new Set();
    for (const event of events) if (event.collectionId) ids.add(event.collectionId);
    return [...ids].map((id) => ({ id, name: collections.find((c) => c.id === id)?.name || "Collection" }));
  }, [events, collections]);

  return (
    <div className="tlFilters">
      <div className="tlBucketRow" role="group" aria-label="Filter research activity">
        {TIMELINE_BUCKETS.map((b) => {
          const active = bucket === b.id;
          const count = counts[b.id];
          return (
            <button
              key={b.id}
              type="button"
              className={`tlBucketChip ${active ? "active" : ""}`}
              onClick={() => onBucketChange(b.id)}
              aria-pressed={active}
            >
              {b.label}
              {b.id !== "today" && typeof count === "number" && count > 0 && <em>{count}</em>}
            </button>
          );
        })}
      </div>
      {collectionsPresent.length > 0 && (
        <select
          className="tlCollectionSelect"
          value={collectionFilter || ""}
          onChange={(e) => onCollectionChange(e.target.value || null)}
          aria-label="Filter timeline by collection"
        >
          <option value="">All collections</option>
          {collectionsPresent.map(({ id, name }) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}