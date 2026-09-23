import { AlertTriangle, RotateCw } from "lucide-react";

export default function ChatError({ message, onRetry }) {
  // Format technical error messages into readable user explanations
  let displayMessage = message;
  if (typeof message === "string") {
    if (message.includes("Network Error") || message.includes("ERR_CONNECTION_REFUSED")) {
      displayMessage = "Unable to connect to the backend server. Please verify the Python service is running.";
    } else if (message.includes("404")) {
      displayMessage = "The requested session or document could not be found.";
    } else if (message.includes("500") || message.includes("Internal Server Error")) {
      displayMessage = "The reasoning engine encountered an unexpected issue while querying the vector index.";
    }
  }

  return (
    <div className="chatErrorCard" role="alert">
      <div className="chatErrorHeader">
        <div className="chatErrorTitle">
          <AlertTriangle size={16} className="textDanger" />
          <strong>Analysis interrupted</strong>
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
      <p className="chatErrorMessage">{displayMessage || "An error occurred while generating the answer."}</p>
    </div>
  );
}
