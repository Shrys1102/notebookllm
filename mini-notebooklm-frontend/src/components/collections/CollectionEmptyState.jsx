/**
 * Intentional empty state for collections: the library ("Your research has
 * a home.") and the empty collection ("This collection is ready for
 * research.") both route through this so copy stays purposeful.
 */
export default function CollectionEmptyState({ icon, title, body, action, actionLabel, onAction, accent = "teal", style }) {
  return (
    <div className={`collectionEmptyState accent-${accent}`} style={style} role="status">
      <span className="collectionEmptyIcon">{icon}</span>
      <strong className="collectionEmptyTitle">{title}</strong>
      {body && <p className="collectionEmptyBody">{body}</p>}
      {action && (
        <button type="button" className="collectionEmptyAction" onClick={onAction}>
          {action}
          {actionLabel && <span className="collectionEmptyActionHint">{actionLabel}</span>}
        </button>
      )}
    </div>
  );
}