import { useEffect, useState } from "react";
import { NotebookPen, Plus, Trash2, Download, FileText, Quote, X, Check, Copy, Lightbulb } from "lucide-react";
import { useResearch } from "../../context/ResearchContext.jsx";
import Button from "../ui/Button.jsx";
import CollectionPicker from "./CollectionPicker.jsx";
import { formatDate } from "../../utils/formatters.js";

function noteToMarkdown(note) {
  const lines = [`# ${note.title}`, ""];
  if (note.sourceFileName) lines.push(`**Source:** ${note.sourceFileName}`);
  if (note.excerpt) lines.push("", `> ${note.excerpt}`);
  lines.push("", note.body || "", "", `_Saved ${formatDate(note.createdAt)}_`);
  return lines.join("\n");
}

export default function ResearchNotes({ onOpenDocument }) {
  const research = useResearch();
  const { notes } = research;
  const [editingId, setEditingId] = useState(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [creating, setCreating] = useState(false);
  const [downloaded, setDownloaded] = useState(null);
  const [insightSavedId, setInsightSavedId] = useState(null);

  // When the palette / shortcut asks to create a note, open the editor.
  useEffect(() => {
    if (research.noteCreateRequest > 0) {
      startCreate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [research.noteCreateRequest]);

  const startCreate = () => {
    setCreating(true);
    setEditingId(null);
    setDraftTitle("");
    setDraftBody("");
  };

  const startEdit = (note) => {
    setCreating(false);
    setEditingId(note.id);
    setDraftTitle(note.title);
    setDraftBody(note.body);
  };

  const saveDraft = () => {
    if (!draftTitle.trim() && !draftBody.trim()) return;
    if (editingId) {
      research.updateNote(editingId, { title: draftTitle.trim() || "Untitled note", body: draftBody });
    } else {
      research.createNote({ title: draftTitle.trim() || "Untitled note", body: draftBody });
    }
    setCreating(false);
    setEditingId(null);
    setDraftTitle("");
    setDraftBody("");
  };

  const downloadNote = (note) => {
    const blob = new Blob([noteToMarkdown(note)], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${note.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase().slice(0, 60) || "note"}.md`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setDownloaded(note.id);
    window.setTimeout(() => setDownloaded(null), 2000);
  };

  const createInsightFromNote = (note) => {
    const sourceReferences = [];
    if (note.sourceFileName) {
      sourceReferences.push({
        fileName: note.sourceFileName,
        chunkId: note.citation?.chunkId ?? null,
        excerpt: note.excerpt || undefined,
      });
    }
    research.createInsight({
      title: `Insight — ${note.title}`,
      body: note.body || note.excerpt || "",
      sourceReferences,
    });
    research.openResearchPanel("insights");
    setInsightSavedId(note.id);
    window.setTimeout(() => setInsightSavedId(null), 2000);
  };

  const toggleCollection = (note, collectionId) => {
    if (note.collectionIds.includes(collectionId)) research.removeFromCollection(collectionId, "notes", note.id);
    else research.addToCollection(collectionId, "notes", note.id);
  };

  return (
    <div className="researchNotes" aria-label="Research notes">
      <div className="researchSectionHeader">
        <div className="researchSectionTitle">
          <NotebookPen size={14} />
          <span>Research Notes</span>
          <span className="researchCountBadge">{notes.length}</span>
        </div>
        <Button variant="secondary" size="sm" onClick={startCreate} disabled={creating}>
          <Plus size={13} />
          New Note
        </Button>
      </div>

      {creating || editingId ? (
        <div className="noteEditor">
          <input
            className="noteEditorTitle"
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            placeholder="Note title"
            aria-label="Note title"
            autoFocus
          />
          <textarea
            className="noteEditorBody"
            value={draftBody}
            onChange={(e) => setDraftBody(e.target.value)}
            placeholder="Write your synthesis, questions, or observations… (stored locally in this browser)"
            aria-label="Note body"
            rows={5}
          />
          <div className="noteEditorActions">
            <Button variant="primary" size="sm" onClick={saveDraft} disabled={!draftTitle.trim() && !draftBody.trim()}>
              <Check size={13} />
              Save Note
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCreating(false);
                setEditingId(null);
              }}
            >
              <X size={13} />
              Cancel
            </Button>
          </div>
        </div>
      ) : notes.length === 0 ? (
        <div className="researchEmptyState">
          <NotebookPen size={22} className="textMuted" />
          <strong>No notes yet</strong>
          <p>Save an AI answer or evidence passage to a note, or create one from scratch. Notes are stored locally in this browser.</p>
        </div>
      ) : (
        <div className="noteList">
          {notes.map((note) => (
            <article key={note.id} className="noteCard">
              <div className="noteCardHeader">
                <strong className="noteCardTitle">{note.title}</strong>
                <div className="noteCardActions">
                  <button
                    type="button"
                    className={`iconButton small ${insightSavedId === note.id ? "saved" : ""}`}
                    onClick={() => createInsightFromNote(note)}
                    title="Create an insight from this note"
                    aria-label="Create insight from note"
                  >
                    {insightSavedId === note.id ? <Check size={12} className="textSuccess" /> : <Lightbulb size={12} />}
                  </button>
                  <button
                    type="button"
                    className="iconButton small"
                    onClick={() => research.duplicateNote(note.id)}
                    title="Duplicate note"
                    aria-label="Duplicate note"
                  >
                    <Copy size={12} />
                  </button>
                  <button type="button" className="iconButton small" onClick={() => downloadNote(note)} title="Download as Markdown" aria-label="Download note as Markdown">
                    {downloaded === note.id ? <Check size={12} className="textSuccess" /> : <Download size={12} />}
                  </button>
                  <button type="button" className="iconButton small" onClick={() => startEdit(note)} title="Edit note" aria-label="Edit note">
                    <NotebookPen size={12} />
                  </button>
                  <button
                    type="button"
                    className="iconButton small deleteBtn"
                    onClick={() => research.deleteNote(note.id)}
                    title="Delete note"
                    aria-label="Delete note"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {note.sourceFileName && (
                <button
                  type="button"
                  className="noteSourceLink"
                  onClick={() => onOpenDocument?.({ fileName: note.sourceFileName, excerpt: note.excerpt || undefined })}
                  title={`Open ${note.sourceFileName}`}
                >
                  <FileText size={11} />
                  {note.sourceFileName}
                </button>
              )}

              {note.excerpt && <blockquote className="noteExcerpt">"{note.excerpt}"</blockquote>}

              {note.body && <p className="noteBody">{note.body}</p>}

              <div className="noteCardFooter">
                <CollectionPicker value={note.collectionIds || []} onToggle={(cid) => toggleCollection(note, cid)} />
                <span className="noteDate" title={`Created ${formatDate(note.createdAt)}`}>Updated {formatDate(note.updatedAt)}</span>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="researchLocalNotice">
        <Quote size={11} />
        <span>Notes are stored locally in your browser and are not synced to the server.</span>
      </div>
    </div>
  );
}