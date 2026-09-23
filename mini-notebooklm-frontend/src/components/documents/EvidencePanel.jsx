import { useState } from "react";
import {
  Quote,
  Copy,
  Check,
  Sparkles,
  FileText,
  Layers,
  Hash,
  Bookmark,
  BookmarkCheck,
  NotebookPen,
  Lightbulb,
  X,
  Database,
} from "lucide-react";
import Button from "../ui/Button.jsx";
import { useResearch } from "../../context/ResearchContext.jsx";
import { normalizeCitation } from "../../utils/documentModel.js";
import { getFileExtension } from "../../utils/formatters.js";

function DocBadge(fileName = "") {
  const ext = getFileExtension(fileName).toLowerCase();
  if (ext === ".pdf") return <span className="docTypeIcon pdf">PDF</span>;
  if (ext === ".pptx") return <span className="docTypeIcon pptx">PPT</span>;
  if (ext === ".docx") return <span className="docTypeIcon docx">DOC</span>;
  return <span className="docTypeIcon txt">TXT</span>;
}

/**
 * First-class research evidence panel: explains WHY THIS SOURCE MATTERS.
 * Renders only fields that exist, and offers real actions:
 * copy evidence · save evidence · save to notes · bookmark source · scope AI.
 */
export default function EvidencePanel({ citationTarget, onScopeToSource, isScoped, onClose }) {
  const research = useResearch();
  const [copied, setCopied] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);
  const [insightSaved, setInsightSaved] = useState(false);

  if (!citationTarget) return null;

  const citation = normalizeCitation(citationTarget);
  const quoteText = citation.excerpt || null;
  const chunkNumber = citation.chunkId !== null && citation.chunkId !== undefined
    ? citation.chunkId + 1
    : citation.chunkIndex !== undefined && citation.chunkIndex !== null && citation.chunkIndex !== -1
      ? citation.chunkIndex + 1
      : null;

  const saved = research.isEvidenceSaved(citation);
  const bookmarked = research.isBookmarked(citation.fileName);

  const handleCopyQuote = async () => {
    if (!quoteText) return;
    try {
      await navigator.clipboard.writeText(quoteText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleSaveEvidence = () => {
    research.saveEvidence(citation);
  };

  const handleSaveToNotes = () => {
    research.createNote({
      title: `Evidence from ${citation.fileName}${chunkNumber ? ` (chunk ${chunkNumber})` : ""}`,
      body: "",
      sourceFileName: citation.fileName,
      excerpt: quoteText,
      citation,
    });
    setNoteSaved(true);
    window.setTimeout(() => setNoteSaved(false), 2000);
  };

  const handleToggleBookmark = () => {
    research.toggleBookmark({
      fileName: citation.fileName,
      extension: citation.extension,
      sizeBytes: citation.file?.size_bytes ?? null,
    });
  };

  const handleSaveAsInsight = () => {
    if (!quoteText) return;
    research.createInsight({
      title: `Insight — from ${citation.fileName}${chunkNumber ? ` (chunk ${chunkNumber})` : ""}`,
      body: quoteText,
      sourceReferences: [
        {
          fileName: citation.fileName,
          chunkId: citation.chunkId,
          excerpt: quoteText,
          section: citation.section,
          pageNumber: citation.pageNumber,
        },
      ],
    });
    research.openResearchPanel("insights");
    setInsightSaved(true);
    window.setTimeout(() => setInsightSaved(false), 2000);
  };

  return (
    <div className="evidencePanel" aria-label="Cited Evidence Details">
      <div className="evidencePanelHeader">
        <div className="evidencePanelTitle">
          <Sparkles size={15} className="evidenceIcon" />
          <span>AI Evidence Grounding</span>
        </div>
        <div className="evidencePanelHeaderActions">
          {citation.sourceIndex !== undefined && (
            <span className="evidenceSourceNumberBadge">Citation [{citation.sourceIndex + 1}]</span>
          )}
          {onClose && (
            <button type="button" className="iconButton small" onClick={onClose} aria-label="Close evidence panel" title="Close evidence panel">
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      <div className="evidencePanelContent">
        <div className="evidenceMetaBlock">
          <div className="evidenceMetaRow">
            <span className="evidenceMetaLabel">
              <FileText size={12} /> Source:
            </span>
            <strong className="evidenceMetaValue" title={citation.fileName}>
              {DocBadge(citation.fileName)}
              <span className="evidenceMetaDocName">{citation.fileName || "Document"}</span>
            </strong>
          </div>

          {chunkNumber && (
            <div className="evidenceMetaRow">
              <span className="evidenceMetaLabel">
                <Hash size={12} /> Chunk:
              </span>
              <strong className="evidenceMetaValue">#{chunkNumber}</strong>
            </div>
          )}

          {citation.pageNumber && (
            <div className="evidenceMetaRow">
              <span className="evidenceMetaLabel">
                <Layers size={12} /> Page:
              </span>
              <strong className="evidenceMetaValue">{citation.pageNumber}</strong>
            </div>
          )}

          {citation.section && (
            <div className="evidenceMetaRow">
              <span className="evidenceMetaLabel">
                <Layers size={12} /> Section:
              </span>
              <strong className="evidenceMetaValue" title={citation.section}>{citation.section}</strong>
            </div>
          )}
        </div>

        {citation.questionContext && (
          <div className="evidenceContextBlock">
            <span className="evidenceContextLabel">Prompt Context:</span>
            <p className="evidenceContextText">"{citation.questionContext}"</p>
          </div>
        )}

        <div className="evidenceQuoteBox">
          <div className="evidenceQuoteHeader">
            <span className="evidenceQuoteLabel">
              <Quote size={13} /> Retrieved Passage
            </span>
            {quoteText && (
              <button
                type="button"
                className={`evidenceCopyBtn ${copied ? "copied" : ""}`}
                onClick={handleCopyQuote}
                title="Copy cited passage"
                aria-label="Copy cited passage"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            )}
          </div>
          {quoteText ? (
            <blockquote className="evidenceQuoteText">"{quoteText}"</blockquote>
          ) : (
            <p className="evidenceNoPassage">No retrieved passage is associated with this document view.</p>
          )}
        </div>

        <div className="evidenceArchitectureNote">
          <small>
            <Database size={11} />
            <span>
              {quoteText
                ? "This passage was retrieved as semantic context for the AI response and is stored locally if you save it."
                : "Open a chat citation to attach its retrieved passage here."}
            </span>
          </small>
        </div>
      </div>

      <div className="evidenceActionGrid">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleSaveEvidence}
          disabled={!quoteText || saved}
          title={saved ? "Evidence already saved" : "Save passage to your evidence library"}
        >
          {saved ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
          <span>{saved ? "Saved" : "Save Evidence"}</span>
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleSaveToNotes}
          disabled={!quoteText}
          title="Create a research note from this passage"
        >
          {noteSaved ? <Check size={13} /> : <NotebookPen size={13} />}
          <span>{noteSaved ? "Saved to Notes" : "Save to Notes"}</span>
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleSaveAsInsight}
          disabled={!quoteText}
          title="Save this passage as an insight"
        >
          {insightSaved ? <Check size={13} /> : <Lightbulb size={13} />}
          <span>{insightSaved ? "Saved as Insight" : "Save as Insight"}</span>
        </Button>
      </div>

      <div className="evidencePanelFooter">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggleBookmark}
          title={bookmarked ? "Remove bookmark from this source" : "Bookmark this source for quick access"}
        >
          {bookmarked ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
          <span>{bookmarked ? "Bookmarked" : "Bookmark Source"}</span>
        </Button>

        {onScopeToSource && (
          <Button variant={isScoped ? "secondary" : "primary"} size="sm" onClick={onScopeToSource}>
            <Layers size={13} />
            <span>{isScoped ? "Scoped to this source" : "Scope AI to this Source"}</span>
          </Button>
        )}
      </div>
    </div>
  );
}