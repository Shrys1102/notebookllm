import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { FolderOpen, Plus, Check, X, History, Layers } from "lucide-react";
import { useResearch } from "../../context/ResearchContext.jsx";
import { collectionAccentMeta } from "../../utils/researchModels.js";
import Button from "../ui/Button.jsx";
import CollectionCard from "./CollectionCard.jsx";
import CollectionFilters from "./CollectionFilters.jsx";
import CollectionEditor from "./CollectionEditor.jsx";
import CollectionEmptyState from "./CollectionEmptyState.jsx";

function countMembers(collection) {
  const m = collection.members || {};
  return {
    sources: (m.sources || []).length,
    questions: (m.questions || []).length,
    evidence: (m.evidence || []).length,
    notes: (m.notes || []).length,
    insights: (m.insights || []).length,
  };
}

/**
 * The Collection Library: search, sort, create, edit, pin, set as active
 * scope, and enter the detail workspace. Collections are local-first and
 * hold ID references only — multi-collection membership is free, and
 * deleting a collection never deletes its objects.
 */
export default function CollectionLibrary({ files = [] }) {
  const research = useResearch();
  const {
    collections,
    activeCollectionId,
    setActiveCollection,
    createCollection,
    updateCollection,
    toggleCollectionPinned,
    deleteCollection,
    addToCollection,
    removeFromCollection,
    openCollection,
    recentCollections,
    createCollectionRequest,
    assignSourceFileName,
    setAssignSource,
  } = research;

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("updated");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);

  // Palette / shortcut "New Collection" opens the editor directly.
  useEffect(() => {
    if (createCollectionRequest > 0) {
      setEditingCollection(null);
      setEditorOpen(true);
    }
  }, [createCollectionRequest]);

  const openEditorFor = (collection = null) => {
    setEditingCollection(collection);
    setEditorOpen(true);
  };

  const saveEditor = (patch) => {
    if (editingCollection) {
      updateCollection(editingCollection.id, patch);
    } else {
      const created = createCollection(patch.name, {
        description: patch.description,
        accentKey: patch.accentKey,
        pinned: patch.pinned,
      });
      setAssignSource(null);
      openCollection(created.id);
    }
    setEditorOpen(false);
    setEditingCollection(null);
  };

  const sorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = collections
      .filter((c) => !q || c.name.toLowerCase().includes(q) || (c.description || "").toLowerCase().includes(q))
      .map((c) => ({ collection: c, counts: countMembers(c) }));
    list.sort((a, b) => {
      if (a.collection.pinned !== b.collection.pinned) return a.collection.pinned ? -1 : 1;
      if (sort === "name") return a.collection.name.localeCompare(b.collection.name);
      if (sort === "created") return new Date(b.collection.createdAt) - new Date(a.collection.createdAt);
      return new Date(b.collection.updatedAt) - new Date(a.collection.updatedAt);
    });
    return list;
  }, [collections, query, sort]);

  const recentList = useMemo(
    () => recentCollections.map((r) => collections.find((c) => c.id === r.id)).filter(Boolean).slice(0, 4),
    [recentCollections, collections]
  );

  const toggleAssign = (collectionId) => {
    if ((collections.find((c) => c.id === collectionId)?.members.sources || []).includes(assignSourceFileName)) {
      removeFromCollection(collectionId, "sources", assignSourceFileName);
    } else {
      addToCollection(collectionId, "sources", assignSourceFileName);
    }
  };

  return (
    <div className="collectionLibrary" aria-label="Collection library">
      <div className="researchSectionHeader">
        <div className="researchSectionTitle">
          <FolderOpen size={14} />
          <span>Collections</span>
          <span className="researchCountBadge">{collections.length}</span>
        </div>
        <Button variant="secondary" size="sm" onClick={() => openEditorFor(null)} disabled={editorOpen}>
          <Plus size={13} />
          New Collection
        </Button>
      </div>

      {assignSourceFileName && (
        <div className="collectionAssignStrip">
          <div className="collectionAssignTitle">
            <Layers size={12} />
            <span>Assign <strong>{assignSourceFileName}</strong> to a collection</span>
          </div>
          <div className="collectionAssignChips">
            {collections.map((c) => {
              const active = (c.members.sources || []).includes(assignSourceFileName);
              const accent = collectionAccentMeta(c);
              return (
                <button
                  key={c.id}
                  type="button"
                  className={`collectionAssignChip accent-${accent.key} ${active ? "active" : ""}`}
                  onClick={() => toggleAssign(c.id)}
                  aria-pressed={active}
                >
                  <span className="collectionAssignDot" />
                  {c.name}
                  {active && <Check size={11} />}
                </button>
              );
            })}
          </div>
          <button type="button" className="collectionAssignDone" onClick={() => setAssignSource(null)} aria-label="Done assigning source">
            <X size={12} />
          </button>
        </div>
      )}

      {collections.length > 0 && (
        <CollectionFilters
          query={query}
          onQueryChange={setQuery}
          sort={sort}
          onSortChange={setSort}
          count={sorted.length}
        />
      )}

      {recentList.length > 0 && !query && (
        <div className="collectionRecentRow">
          <History size={11} />
          <span>Recently opened:</span>
          {recentList.map((c) => {
            const accent = collectionAccentMeta(c);
            return (
              <button
                key={c.id}
                type="button"
                className={`collectionRecentChip accent-${accent.key}`}
                onClick={() => openCollection(c.id)}
              >
                <span className="collectionAssignDot" />
                {c.name}
              </button>
            );
          })}
        </div>
      )}

      {collections.length === 0 ? (
        <CollectionEmptyState
          icon={<FolderOpen size={22} />}
          title="Your research has a home."
          body="Collections group sources, questions, evidence, notes, and insights around a theme or project — without duplicating any of them. Create your first collection to begin."
          action="Create your first collection"
          onAction={() => openEditorFor(null)}
        />
      ) : sorted.length === 0 ? (
        <CollectionEmptyState
          icon={<FolderOpen size={20} />}
          title={`Nothing matched "${query}"`}
          body="Try a different term or clear the search to browse every collection."
          accent="slate"
          action="Clear search"
          onAction={() => setQuery("")}
        />
      ) : (
        <div className="collectionLibraryGrid">
          {sorted.map(({ collection, counts }) => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              counts={counts}
              accent={collectionAccentMeta(collection)}
              onOpen={() => openCollection(collection.id)}
              onTogglePin={() => toggleCollectionPinned(collection.id)}
              onEdit={() => openEditorFor(collection)}
              onDelete={() => deleteCollection(collection.id)}
              onSetActive={() => setActiveCollection(activeCollectionId === collection.id ? null : collection.id)}
              isActive={activeCollectionId === collection.id}
            />
          ))}
        </div>
      )}

      <div className="researchLocalNotice">
        <FolderOpen size={11} />
        <span>Collections are stored locally in your browser and are not synced to the server. Objects can belong to many collections at once.</span>
      </div>

      {editorOpen &&
        createPortal(
          <CollectionEditor
            collection={editingCollection}
            onSave={saveEditor}
            onClose={() => {
              setEditorOpen(false);
              setEditingCollection(null);
            }}
          />,
          document.body
        )}
    </div>
  );
}