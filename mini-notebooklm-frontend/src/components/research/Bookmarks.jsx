import { Bookmark, BookmarkCheck, ExternalLink, Trash2 } from "lucide-react";
import { useResearch } from "../../context/ResearchContext.jsx";
import Button from "../ui/Button.jsx";
import { formatDate, getFileExtension } from "../../utils/formatters.js";

function DocBadge(fileName = "") {
  const ext = getFileExtension(fileName).toLowerCase();
  if (ext === ".pdf") return <span className="docTypeIcon pdf">PDF</span>;
  if (ext === ".pptx") return <span className="docTypeIcon pptx">PPT</span>;
  if (ext === ".docx") return <span className="docTypeIcon docx">DOC</span>;
  return <span className="docTypeIcon txt">TXT</span>;
}

export default function Bookmarks({ onOpenDocument }) {
  const research = useResearch();
  const { bookmarks } = research;

  return (
    <div className="bookmarks" aria-label="Bookmarked sources">
      <div className="researchSectionHeader">
        <div className="researchSectionTitle">
          <BookmarkCheck size={14} />
          <span>Bookmarked Sources</span>
          <span className="researchCountBadge">{bookmarks.length}</span>
        </div>
      </div>

      {bookmarks.length === 0 ? (
        <div className="researchEmptyState">
          <Bookmark size={22} className="textMuted" />
          <strong>No bookmarks</strong>
          <p>Bookmark sources from the document viewer header to keep them one click away. Stored locally in this browser.</p>
        </div>
      ) : (
        <div className="bookmarkList">
          {bookmarks.map((bookmark) => (
            <div key={bookmark.id} className="bookmarkRow">
              <button
                type="button"
                className="bookmarkOpenBtn"
                onClick={() => onOpenDocument?.({ fileName: bookmark.fileName, sizeBytes: bookmark.sizeBytes, extension: bookmark.extension })}
                title={`Open ${bookmark.fileName}`}
              >
                {DocBadge(bookmark.fileName)}
                <span className="bookmarkName" title={bookmark.fileName}>{bookmark.fileName}</span>
                <span className="bookmarkDate">{formatDate(bookmark.savedAt)}</span>
                <ExternalLink size={11} className="bookmarkOpenIcon" />
              </button>
              <button
                type="button"
                className="iconButton small"
                onClick={() => research.removeBookmark(bookmark.id)}
                title="Remove bookmark"
                aria-label={`Remove bookmark ${bookmark.fileName}`}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="researchLocalNotice">
        <Bookmark size={11} />
        <span>Bookmarks are stored locally in your browser and are not synced to the server.</span>
      </div>
    </div>
  );
}