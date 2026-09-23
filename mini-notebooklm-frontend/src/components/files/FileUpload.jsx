import { useRef, useState } from "react";
import { UploadCloud, FileUp } from "lucide-react";
import ProcessingState from "./ProcessingState.jsx";

export default function FileUpload({
  uploading,
  progress,
  uploadingFileName,
  uploadError,
  onClearUploadError,
  onUpload,
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) onUpload(file);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      inputRef.current?.click();
    }
  };

  if (uploading || uploadError) {
    return (
      <div className="uploadProcessingWrapper">
        <ProcessingState
          fileName={uploadingFileName}
          progress={progress}
          error={uploadError}
          onRetry={onClearUploadError}
        />
      </div>
    );
  }

  return (
    <div
      className={`uploadZone ${dragging ? "isDragging" : ""}`}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label="Add sources to your research corpus"
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt,.docx,.pptx"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onUpload(file);
          event.target.value = "";
        }}
        hidden
      />

      <div className="uploadContent">
        <div className="uploadIconWrapper">
          <FileUp size={20} className="uploadIcon" />
        </div>

        <div className="uploadText">
          <strong>Add Research Sources</strong>
          <span>Drag & drop or <span className="uploadBrowse">browse files</span></span>
        </div>
      </div>

      <div className="fileTypePills">
        <span className="fileBadge">PDF</span>
        <span className="fileBadge">DOCX</span>
        <span className="fileBadge">PPTX</span>
        <span className="fileBadge">TXT</span>
      </div>
    </div>
  );
}
