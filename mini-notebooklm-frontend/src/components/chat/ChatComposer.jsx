import { useRef, useEffect } from "react";
import { Send, Upload, Layers, FileText, CornerDownLeft, Sparkles } from "lucide-react";
import Button from "../ui/Button.jsx";

export default function ChatComposer({
  draft,
  onDraftChange,
  onSubmit,
  disabled,
  selectedFile,
  onTriggerUpload,
}) {
  const textareaRef = useRef(null);

  // Auto resize textarea height based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const newHeight = Math.min(textareaRef.current.scrollHeight, 180);
      textareaRef.current.style.height = `${Math.max(newHeight, 44)}px`;
    }
  }, [draft]);

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!disabled && draft.trim()) {
        onSubmit();
      }
    }
  };

  return (
    <div className="composerContainer">
      <form
        className="composerForm"
        onSubmit={(e) => {
          e.preventDefault();
          if (!disabled && draft.trim()) {
            onSubmit();
          }
        }}
      >
        <div className="composerScopeBar">
          <div className="composerScopeBadge" title={selectedFile ? `Scoped to ${selectedFile.file_name}` : "Scoped to entire corpus"}>
            {selectedFile ? <FileText size={12} /> : <Layers size={12} />}
            <span>{selectedFile ? selectedFile.file_name : "All Documents"}</span>
          </div>

          <div className="composerRightHints">
            {onTriggerUpload && (
              <button
                type="button"
                className="composerUploadBtn"
                onClick={onTriggerUpload}
                title="Add new document to corpus"
                aria-label="Upload document"
              >
                <Upload size={13} />
                <span>Add Source</span>
              </button>
            )}
          </div>
        </div>

        <div className="composerInputRow">
          <textarea
            ref={textareaRef}
            className="composerTextarea"
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedFile
                ? `Ask anything about ${selectedFile.file_name}...`
                : "Ask anything about your uploaded sources..."
            }
            rows={1}
            disabled={disabled}
            aria-label="Ask question input"
          />

          <Button
            type="submit"
            variant="primary"
            size="icon"
            disabled={disabled || !draft.trim()}
            className="composerSubmitBtn"
            title="Send query (Enter)"
            aria-label="Send query"
          >
            <Send size={16} />
          </Button>
        </div>

        <div className="composerFooter">
          <span className="composerHint">
            <kbd>↵</kbd> Send · <kbd>Shift ↵</kbd> New line
          </span>
          {draft.length > 0 && (
            <span className="composerCharCount">{draft.length} chars</span>
          )}
        </div>
      </form>
    </div>
  );
}
