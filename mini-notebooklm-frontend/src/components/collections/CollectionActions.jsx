import { useState } from "react";
import { Pin, PinOff, Pencil, Trash2, Check, X } from "lucide-react";

/**
 * Tactile action cluster shared by collection cards and the detail hero:
 * pin, set-as-active-scope, rename (edit), delete (with an inline,
 * two-step confirm so "remove collection" is never confused with deleting
 * the objects inside it).
 */
export default function CollectionActions({ collection, onTogglePin, onEdit, onDelete, onSetActive, isActive, tone = "card" }) {
  const [confirming, setConfirming] = useState(false);

  const handleDelete = () => {
    if (confirming) {
      onDelete?.();
    } else {
      setConfirming(true);
      window.setTimeout(() => setConfirming(false), 4000);
    }
  };

  return (
    <div className={`collectionActions tone-${tone}`} onClick={(e) => e.stopPropagation()}>
      {confirming ? (
        <>
          <span className="collectionDeleteConfirmText">Keep items, delete grouping?</span>
          <button
            type="button"
            className="collectionActionBtn danger solid"
            onClick={handleDelete}
            aria-label={`Confirm delete ${collection.name}`}
            title="Delete collection (items are kept)"
          >
            <Check size={13} />
          </button>
          <button
            type="button"
            className="collectionActionBtn"
            onClick={() => setConfirming(false)}
            aria-label="Cancel delete"
            title="Cancel"
          >
            <X size={13} />
          </button>
        </>
      ) : (
        <>
          {onSetActive && (
            <button
              type="button"
              className={`collectionActionBtn ${isActive ? "active" : ""}`}
              onClick={onSetActive}
              aria-pressed={isActive}
              title={isActive ? "Active research scope — click to clear" : "Use as active research scope"}
            >
              <Check size={13} />
            </button>
          )}
          <button
            type="button"
            className={`collectionActionBtn ${collection.pinned ? "pinned" : ""}`}
            onClick={onTogglePin}
            aria-pressed={collection.pinned}
            title={collection.pinned ? "Unpin collection" : "Pin collection"}
          >
            {collection.pinned ? <PinOff size={13} /> : <Pin size={13} />}
          </button>
          {onEdit && (
            <button
              type="button"
              className="collectionActionBtn"
              onClick={onEdit}
              title="Edit collection"
              aria-label={`Edit ${collection.name}`}
            >
              <Pencil size={13} />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              className="collectionActionBtn danger"
              onClick={handleDelete}
              title="Delete collection (items are kept)"
              aria-label={`Delete ${collection.name}`}
            >
              <Trash2 size={13} />
            </button>
          )}
        </>
      )}
    </div>
  );
}