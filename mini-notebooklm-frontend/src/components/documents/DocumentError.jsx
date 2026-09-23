import { AlertTriangle, RotateCw, X, FileX2 } from "lucide-react";
import Button from "../ui/Button.jsx";

/**
 * Consistent recoverable error component for the document viewer.
 * Never exposes stack traces — only human-readable messages.
 */
export default function DocumentError({ title = "Document unavailable", message = "This document could not be opened.", onRetry, onClose, variant = "error" }) {
  return (
    <div className={`documentErrorState ${variant}`} role="alert">
      <div className="documentErrorIcon">
        {variant === "unsupported" ? <FileX2 size={26} /> : <AlertTriangle size={26} />}
      </div>
      <h3>{title}</h3>
      <p>{message}</p>
      <div className="documentErrorActions">
        {onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            <RotateCw size={13} />
            Retry
          </Button>
        )}
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={13} />
            Close
          </Button>
        )}
      </div>
    </div>
  );
}