import { useState } from "react";
import { FolderOpen, Plus, X, Check, Pin } from "lucide-react";
import { useResearch } from "../../context/ResearchContext.jsx";
import { collectionAccentMeta } from "../../utils/researchModels.js";

/**
 * Reusable "assign entity to collection" control.
 *
 * value:      array of collection ids the entity belongs to
 * onToggle:   (collectionId) => void
 * Used by notes, evidence, insights and sources so collection membership is
 * consistent across the workspace.
 */
export default function CollectionPicker({ value = [], onToggle, align = "left" }) {
  const research = useResearch();
  const { collections, createCollection } = research;
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");

  if (!collections.length && !creating) {
    return (
      <button
        type="button"
        className="collectionPickerAdd"
        onClick={() => setCreating(true)}
        title="Create a collection to organize this item"
      >
        <FolderOpen size={11} />
        <span>New Collection</span>
      </button>
    );
  }

  const submitNew = () => {
    const trimmed = name.trim();
    if (trimmed) {
      const collection = createCollection(trimmed);
      onToggle?.(collection.id);
    }
    setCreating(false);
    setName("");
  };

  const ordered = [...collections].sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)));

  return (
    <div className={`collectionPicker ${align === "right" ? "right" : ""}`}>
      {ordered.map((c) => {
        const active = value.includes(c.id);
        const accent = collectionAccentMeta(c);
        return (
          <button
            key={c.id}
            type="button"
            className={`collectionPickChip accent-${accent.key} ${active ? "active" : ""}`}
            onClick={() => onToggle?.(c.id)}
            title={active ? `Remove from ${c.name}` : `Add to ${c.name}`}
            aria-pressed={active}
          >
            <span className="collectionPickDot" />
            <span>{c.name}</span>
            {c.pinned && <Pin size={9} />}
            {active && <Check size={10} />}
          </button>
        );
      })}
      {creating ? (
        <span className="collectionPickCreate">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitNew();
              if (e.key === "Escape") setCreating(false);
            }}
            placeholder="Collection name"
            aria-label="New collection name"
            autoFocus
          />
          <button type="button" onClick={submitNew} aria-label="Create collection" title="Create collection">
            <Check size={11} />
          </button>
          <button type="button" onClick={() => setCreating(false)} aria-label="Cancel" title="Cancel">
            <X size={11} />
          </button>
        </span>
      ) : (
        <button type="button" className="collectionPickAddBtn" onClick={() => setCreating(true)} title="Create a new collection" aria-label="Create a new collection">
          <Plus size={11} />
        </button>
      )}
    </div>
  );
}