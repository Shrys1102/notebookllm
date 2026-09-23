import { useState } from "react";
import { Check, Copy, ExternalLink, Trash2, Quote, NotebookPen, Lightbulb } from "lucide-react";
import { useResearch } from "../../context/ResearchContext.jsx";
import Button from "../ui/Button.jsx";
import CollectionPicker from "./CollectionPicker.jsx";
import { formatDate, getFileExtension } from "../../utils/formatters.js";

function DocBadge(fileName = "") {
  const ext = getFileExtension(fileName).toLowerCase();
  if (ext === ".pdf") return <span className="docTypeIcon pdf">PDF</span>;
  if (ext === ".pptx") return <span className="docTypeIcon pptx">PPT</span>;
  if (ext === ".docx") return <span className="docTypeIcon docx">DOC</span>;
  return <span className="docTypeIcon txt">TXT</span>;
}

export default function SavedEvidence({ onOpenDocument }) {
  const research = useResearch();
  const { savedEvidence } = research;
  const [copiedId, setCopiedId] = useState(null);
  const [noteSavedId, setNoteSavedId] = useState(null);
  const [insightSavedId, setInsightSavedId] = useState(null);

  const copyExcerpt = async (item) => {
    try {
      await navigator.clipboard.writeText(item.excerpt);
      setCopiedId(item.id);
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore
    }
  };

  const saveToNotes = (item) => {
    research.createNote({
      title: `Evidence from ${item.fileName}${item.chunkId !== null && item.chunkId !== undefined ? ` (chunk ${item.chunkId + 1})` : ""}`,
      body: "",
      sourceFileName: item.fileName,
      excerpt: item.excerpt,
      citation: item,
    });
    setNoteSavedId(item.id);
    window.setTimeout(() => setNoteSavedId(null), 2000);
  };

  const saveAsInsight = (item) => {
    research.createInsight({
      title: `Insight — from ${item.fileName}${item.chunkId !== null && item.chunkId !== undefined ? ` (chunk ${item.chunkId + 1})` : ""}`,
      body: item.excerpt,
      sourceReferences: [
        {
          fileName: item.fileName,
          chunkId: item.chunkId,
          chunkIndex: item.chunkIndex,
          excerpt: item.excerpt,
          section: item.section,
          pageNumber: item.pageNumber,
        },
      ],
    });
    research.openResearchPanel("insights");
    setInsightSavedId(item.id);
    window.setTimeout(() => setInsightSavedId(null), 2000);
  };

  const toggleCollection = (item, collectionId) => {
    if (item.collectionIds.includes(collectionId)) research.removeFromCollection(collectionId, "evidence", item.id);
    else research.addToCollection(collectionId, "evidence", item.id);
  };

  return (
    <div className="savedEvidence" aria-label="Saved evidence passages">
      <div className="researchSectionHeader">
        <div className="researchSectionTitle">
          <Quote size={14} />
          <span>Saved Evidence</span>
          <span className="researchCountBadge">{savedEvidence.length}</span>
        </div>
      </div>

      {savedEvidence.length === 0 ? (
        <div className="researchEmptyState">
          <Quote size={22} className="textMuted" />
          <strong>No saved evidence</strong>
          <p>Save passages from chat citations or the evidence panel. Saved evidence is stored locally in this browser.</p>
        </div>
      ) : (
        <div className="savedEvidenceList">
          {savedEvidence.map((item) => (
            <article key={item.id} className="savedEvidenceCard">
              <div className="savedEvidenceCardHeader">
                {DocBadge(item.fileName)}
                <strong className="savedEvidenceDocName" title={item.fileName}>{item.fileName}</strong>
                <span className="savedEvidenceDate">{formatDate(item.savedAt)}</span>
              </div>
              {item.chunkId !== null && item.chunkId !== undefined && (
                <span className="sourceChunkBadge">Chunk #{item.chunkId + 1}</span>
              )}
              <blockquote className="savedEvidenceExcerpt">"{item.excerpt}"</blockquote>
              <div className="savedEvidenceActions">
                <Button variant="secondary" size="sm" onClick={() => onOpenDocument?.({ fileName: item.fileName, chunkId: item.chunkId, chunk_index: item.chunkIndex, excerpt: item.excerpt, sourceIndex: item.sourceIndex })}>
                  <ExternalLink size={12} />
                  Open Source
                </Button>
                <button type="button" className="evidenceRefAction" onClick={() => copyExcerpt(item)} title="Copy excerpt">
                  {copiedId === item.id ? <Check size={12} className="textSuccess" /> : <Copy size={12} />}
                  <span>{copiedId === item.id ? "Copied" : "Copy"}</span>
                </button>
                <button type="button" className="evidenceRefAction" onClick={() => saveToNotes(item)} title="Create note from this evidence">
                  {noteSavedId === item.id ? <Check size={12} className="textSuccess" /> : <NotebookPen size={12} />}
                  <span>{noteSavedId === item.id ? "Noted" : "To Note"}</span>
                </button>
                <button type="button" className="evidenceRefAction" onClick={() => saveAsInsight(item)} title="Save as insight">
                  {insightSavedId === item.id ? <Check size={12} className="textSuccess" /> : <Lightbulb size={12} />}
                  <span>{insightSavedId === item.id ? "Insight" : "To Insight"}</span>
                </button>
                <button type="button" className="evidenceRefAction danger" onClick={() => research.removeSavedEvidence(item.id)} title="Remove saved evidence" aria-label="Remove saved evidence">
                  <Trash2 size={12} />
                  <span>Remove</span>
                </button>
              </div>
              <div className="savedEvidenceCollections">
                <CollectionPicker value={item.collectionIds || []} onToggle={(cid) => toggleCollection(item, cid)} />
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="researchLocalNotice">
        <Quote size={11} />
        <span>Saved evidence is stored locally in your browser and is not synced to the server.</span>
      </div>
    </div>
  );
}