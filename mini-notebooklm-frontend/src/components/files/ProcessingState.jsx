import { Database, Loader2, Sparkles, AlertCircle, RotateCw } from "lucide-react";
import { getFileExtension } from "../../utils/formatters.js";

export default function ProcessingState({ fileName, progress = 0, error, onRetry }) {
  const ext = fileName ? getFileExtension(fileName).toLowerCase() : "";

  if (error) {
    return (
      <div className="processingCard errorState" role="alert">
        <div className="processingCardHeader">
          <div className="processingCardTitle">
            <AlertCircle size={15} className="textDanger" />
            <span className="processingFileName" title={fileName}>
              {fileName || "Ingestion Error"}
            </span>
          </div>
          {onRetry && (
            <button
              type="button"
              className="processingRetryBtn"
              onClick={onRetry}
              title="Dismiss and retry upload"
              aria-label="Retry upload"
            >
              <RotateCw size={12} />
              <span>Retry</span>
            </button>
          )}
        </div>
        <p className="processingErrorMessage">{error}</p>
      </div>
    );
  }

  return (
    <div className="processingCard" role="status" aria-live="polite">
      <div className="processingCardHeader">
        <div className="processingCardTitle">
          <Loader2 size={15} className="spin textPrimary" />
          <span className="processingFileName" title={fileName}>
            {fileName || "Processing document..."}
          </span>
        </div>
        <span className="processingBadge">INDEXING</span>
      </div>

      <div className="processingProgressBar">
        <div
          className="processingProgressFill"
          style={{ width: `${Math.max(progress, 15)}%` }}
        />
      </div>

      <div className="processingMeta">
        <span className="processingStatusLabel">
          <Database size={11} />
          Extracting text & vector embeddings...
        </span>
        <span className="processingPercent">{progress > 0 ? `${progress}%` : "In progress"}</span>
      </div>
    </div>
  );
}
