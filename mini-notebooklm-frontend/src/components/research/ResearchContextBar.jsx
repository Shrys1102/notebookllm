import { Layers, FileText, Eye, FolderOpen } from "lucide-react";
import { useResearch } from "../../context/ResearchContext.jsx";
import { collectionAccentMeta } from "../../utils/researchModels.js";

/**
 * Compact workspace context indicator.
 *
 * Always tells the user what the AI is currently allowed to use:
 *   Researching across N sources        (no scope)
 *   Researching: paper.pdf              (scoped)
 *   Collection: Literature Review        (active collection)
 *   · Viewing: paper.pdf                (document open in viewer)
 */
export default function ResearchContextBar({ selectedFile, fileCount = 0 }) {
  const { activeCitation, viewerOpen, activeCollection, openCollection } = useResearch();

  const scopeName = selectedFile?.file_name || null;
  const viewingName = viewerOpen ? activeCitation?.fileName || null : null;

  return (
    <div className="researchContextBar" aria-label="Active research context">
      <div className="researchContextScope" title={scopeName ? `AI is scoped to ${scopeName}` : `AI can use all ${fileCount} sources`}>
        {scopeName ? <FileText size={12} /> : <Layers size={12} />}
        <span className="researchContextLabel">
          {scopeName ? "Researching" : "Researching across"}
        </span>
        <strong>{scopeName || `${fileCount} source${fileCount === 1 ? "" : "s"}`}</strong>
      </div>
      {activeCollection && (
        <button
          type="button"
          className={`researchContextCollection accent-${collectionAccentMeta(activeCollection).key}`}
          onClick={() => openCollection(activeCollection.id)}
          title={`Active collection: ${activeCollection.name} — open its workspace`}
        >
          <span className="researchContextDivider">/</span>
          <FolderOpen size={12} />
          <span>Research</span>
          <strong>{activeCollection.name}</strong>
        </button>
      )}
      {viewingName && (
        <div className="researchContextViewing" title={`Viewing ${viewingName}`}>
          <span className="researchContextDivider">·</span>
          <Eye size={12} />
          <span>Viewing</span>
          <strong>{viewingName}</strong>
        </div>
      )}
    </div>
  );
}