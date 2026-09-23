import { useEffect, useRef, useState } from "react";
import { X, Check, Pin } from "lucide-react";
import { COLLECTION_ACCENTS, COLLECTION_ACCENT_KEYS } from "../../utils/researchModels.js";
import Button from "../ui/Button.jsx";

/**
 * Create / edit dialog for a collection. Collects the identity fields that
 * make a collection feel like a research object: name, description, accent
 * color, and pinned state. Escape closes; focus starts on the name field.
 */
export default function CollectionEditor({ collection = null, onSave, onClose }) {
  const [name, setName] = useState(collection?.name || "");
  const [description, setDescription] = useState(collection?.description || "");
  const [accentKey, setAccentKey] = useState(collection?.accentKey || "teal");
  const [pinned, setPinned] = useState(Boolean(collection?.pinned));
  const nameRef = useRef(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      nameRef.current?.focus();
      return;
    }
    onSave({ name: trimmed, description: description.trim(), accentKey, pinned });
  };

  return (
    <div className="collectionEditorOverlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="collectionEditorCard" role="dialog" aria-modal="true" aria-label={collection ? "Edit collection" : "New collection"}>
        <div className="collectionEditorHeader">
          <strong>{collection ? "Edit collection" : "New collection"}</strong>
          <button type="button" className="iconButton small" onClick={onClose} aria-label="Close">
            <X size={15} />
          </button>
        </div>

        <div className="collectionEditorBody">
          <label className="collectionField">
            <span className="collectionFieldLabel">Name</span>
            <input
              ref={nameRef}
              type="text"
              className="collectionFieldInput"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="e.g. Thesis Literature"
              aria-label="Collection name"
            />
          </label>

          <label className="collectionField">
            <span className="collectionFieldLabel">Description <em>optional</em></span>
            <textarea
              className="collectionFieldTextarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this research about?"
              aria-label="Collection description"
              rows={2}
            />
          </label>

          <div className="collectionField">
            <span className="collectionFieldLabel">Accent</span>
            <div className="collectionAccentRow" role="radiogroup" aria-label="Accent color">
              {COLLECTION_ACCENT_KEYS.map((key) => {
                const meta = COLLECTION_ACCENTS[key];
                return (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={accentKey === key}
                    className={`collectionAccentSwatch ${accentKey === key ? "selected" : ""}`}
                    style={{ "--swatch": meta.base }}
                    onClick={() => setAccentKey(key)}
                    title={meta.label}
                    aria-label={meta.label}
                  />
                );
              })}
            </div>
          </div>

          <button
            type="button"
            className={`collectionPinnedToggle ${pinned ? "pinned" : ""}`}
            onClick={() => setPinned((v) => !v)}
            aria-pressed={pinned}
          >
            <Pin size={12} />
            <span>{pinned ? "Pinned — appears first in the library" : "Pin this collection"}</span>
          </button>
        </div>

        <div className="collectionEditorFooter">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={13} />
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={submit} disabled={!name.trim()}>
            <Check size={13} />
            {collection ? "Save changes" : "Create collection"}
          </Button>
        </div>
      </div>
    </div>
  );
}