import { AlertTriangle, RotateCw, WifiOff, Key, Database, Server } from "lucide-react";
import { classifyError } from "../../utils/formatters.js";

export default function ChatError({ message, error, onRetry }) {
  const classification = error ? classifyError(error) : classifyError(null);
  const { category, message: classifiedMessage } = classification;
  const displayMessage = classifiedMessage || message || "An error occurred while generating the answer.";

  const iconMap = {
    connection: WifiOff,
    llm: Key,
    retrieval: Database,
    api: Server,
    auth: AlertTriangle,
    unknown: AlertTriangle,
  };
  const Icon = iconMap[category] || AlertTriangle;

  const categoryLabel = {
    connection: "Backend Unavailable",
    llm: "LLM Not Configured",
    retrieval: "Retrieval Failure",
    api: "Backend Error",
    auth: "Authentication Error",
    unknown: "Unexpected Error",
  };

  return (
    <div className="chatErrorCard" role="alert">
      <div className="chatErrorHeader">
        <div className="chatErrorTitle">
          <Icon size={16} className="textDanger" />
          <strong>{categoryLabel[category] || "Analysis interrupted"}</strong>
        </div>
        {onRetry && (
          <button
            type="button"
            className="chatErrorRetryBtn"
            onClick={onRetry}
            aria-label="Retry generation"
          >
            <RotateCw size={13} />
            <span>Retry</span>
          </button>
        )}
      </div>
      <p className="chatErrorMessage">{displayMessage}</p>
    </div>
  );
}
