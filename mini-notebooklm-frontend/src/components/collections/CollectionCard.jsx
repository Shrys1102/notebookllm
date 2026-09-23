import { FolderOpen, FileText, MessageCircleQuestion, Quote, NotebookPen, Lightbulb, Pin } from "lucide-react";
import CollectionActions from "./CollectionActions.jsx";
import { formatDate } from "../../utils/formatters.js";

const COUNT_ICONS = {
  sources: FileText,
  questions: MessageCircleQuestion,
  evidence: Quote,
  notes: NotebookPen,
  insights: Lightbulb,
};

const COUNT_LABELS = {
  sources: "Sources",
  questions: "Questions",
  evidence: "Evidence",
  notes: "Notes",
  insights: "Insights",
};

/**
 * A collection rendered as a physical research object: quiet layered
 * surface, a restrained accent identity, live object counts, and last
 * activity. Hover lifts the card gently; actions reveal with the same
 * motion language as the source library.
 */
export default function CollectionCard({ collection, counts, accent, onOpen, onTogglePin, onEdit, onDelete, onSetActive, isActive }) {
  return (
    <article
      className={`collectionLibCard accent-${accent.key} ${collection.pinned ? "pinned" : ""} ${isActive ? "active" : ""}`}
      aria-label={`Collection ${collection.name}`}
    >
      <span className="collectionLibAccentBar" aria-hidden="true" />
      <button type="button" className="collectionLibCardMain" onClick={onOpen} aria-label={`Open ${collection.name}`}>
        <span className="collectionLibIcon">
          <FolderOpen size={17} />
        </span>
        {collection.pinned && (
          <span className="collectionLibPin" title="Pinned">
            <Pin size={11} />
          </span>
        )}
        <strong className="collectionLibTitle">{collection.name}</strong>
        {collection.description && <p className="collectionLibDesc">{collection.description}</p>}
        <span className="collectionLibCounts">
          {Object.keys(COUNT_ICONS).map((type) => {
            const Icon = COUNT_ICONS[type];
            const value = counts[type] || 0;
            if (!value) return null;
            return (
              <span key={type} className="collectionLibCount" title={`${value} ${COUNT_LABELS[type].toLowerCase()}`}>
                <Icon size={10} />
                <em>{value}</em>
              </span>
            );
          })}
          {!Object.values(counts).some(Boolean) && <span className="collectionLibCount empty">Empty</span>}
        </span>
        <span className="collectionLibMeta">
          {collection.pinned && <em className="collectionLibPinnedLabel">Pinned · </em>}
          Updated {formatDate(collection.updatedAt)}
        </span>
      </button>
      <div className="collectionLibActions">
        <CollectionActions
          collection={collection}
          onTogglePin={onTogglePin}
          onEdit={onEdit}
          onDelete={onDelete}
          onSetActive={onSetActive}
          isActive={isActive}
        />
      </div>
    </article>
  );
}