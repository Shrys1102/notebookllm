import { useState, useMemo } from "react";
import { Layers, Check, RefreshCw, FileText, UploadCloud, FolderSearch, FolderOpen, ArrowUpDown } from "lucide-react";
import SourceSearch from "./SourceSearch.jsx";
import SourceFilters from "./SourceFilters.jsx";
import SourceItem from "./SourceItem.jsx";
import SourcePreview from "./SourcePreview.jsx";
import FileUpload from "./FileUpload.jsx";
import { useResearch } from "../../context/ResearchContext.jsx";
import { getFileExtension } from "../../utils/formatters.js";

export default function SourceLibrary({
  filesState,
  selectedFile,
  onSelectFile,
  onOpenViewer,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("name");
  const [collectionFilter, setCollectionFilter] = useState("ALL");
  const [previewFile, setPreviewFile] = useState(null);

  const research = useResearch();
  const { collections } = research;

  const { files = [], loading, uploading, uploadProgress, uploadingFileName, uploadError, clearUploadError, refreshFiles, uploadFile, deleteFile } = filesState;

  // Filter, search, collection membership, and sort
  const filteredFiles = useMemo(() => {
    const activeCollection = collections.find((c) => c.id === collectionFilter);
    const collectionSources = activeCollection ? new Set(activeCollection.members.sources) : null;

    const filtered = files.filter((file) => {
      const ext = getFileExtension(file.file_name).toUpperCase().replace(".", "");
      const matchesFilter = activeFilter === "ALL" || ext === activeFilter;
      const matchesSearch = !searchQuery.trim() || file.file_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCollection = !collectionSources || collectionSources.has(file.file_name);
      return matchesFilter && matchesSearch && matchesCollection;
    });

    const sorted = [...filtered];
    if (sortBy === "name") sorted.sort((a, b) => a.file_name.localeCompare(b.file_name));
    else if (sortBy === "date") sorted.sort((a, b) => new Date(b.uploaded_at || 0) - new Date(a.uploaded_at || 0));
    else if (sortBy === "size") sorted.sort((a, b) => (b.size_bytes || 0) - (a.size_bytes || 0));
    return sorted;
  }, [files, activeFilter, searchQuery, collectionFilter, collections, sortBy]);

  return (
    <div className="sourceLibraryContainer">
      <FileUpload
        uploading={uploading}
        progress={uploadProgress}
        uploadingFileName={uploadingFileName}
        uploadError={uploadError}
        onClearUploadError={clearUploadError}
        onUpload={uploadFile}
      />

      <div className="sourceLibraryHeader">
        <div className="sourceLibraryTitle">
          <span>Corpus Documents</span>
          <span className="sourceCountBadge">{files.length}</span>
        </div>
        <button
          type="button"
          className={`iconButton small ${loading ? "spin" : ""}`}
          onClick={refreshFiles}
          title="Refresh source library"
          aria-label="Refresh sources"
        >
          <RefreshCw size={13} />
        </button>
      </div>

      {files.length > 0 && (
        <div className="sourceLibraryControls">
          <SourceSearch
            query={searchQuery}
            onQueryChange={setSearchQuery}
            matchCount={filteredFiles.length}
            totalCount={files.length}
          />
          {files.length > 2 && (
            <SourceFilters
              files={files}
              activeFilter={activeFilter}
              onSelectFilter={setActiveFilter}
            />
          )}
          <div className="sourceLibraryOrganize">
            <label className="sourceOrganizeLabel">
              <ArrowUpDown size={11} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort sources"
                title="Sort sources"
              >
                <option value="name">Name</option>
                <option value="date">Newest</option>
                <option value="size">Size</option>
              </select>
            </label>
            <label className="sourceOrganizeLabel">
              <FolderOpen size={11} />
              <select
                value={collectionFilter}
                onChange={(e) => setCollectionFilter(e.target.value)}
                aria-label="Filter sources by collection"
                title="Filter by collection"
              >
                <option value="ALL">All collections</option>
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
      )}

      <div className="sourceLibraryScroll">
        {files.length === 0 && !uploading ? (
          <div className="emptyCorpusState">
            <div className="emptyCorpusIcon">
              <UploadCloud size={24} />
            </div>
            <strong>Research Corpus Empty</strong>
            <p>Upload your research documents (PDF, DOCX, PPTX, TXT) to begin synthesis and exploration.</p>
          </div>
        ) : filteredFiles.length === 0 && (searchQuery || collectionFilter !== "ALL") ? (
          <div className="emptySearchState">
            <FolderSearch size={20} className="textMuted" />
            <span>
              {collectionFilter !== "ALL"
                ? `No documents in this collection${searchQuery ? ` match "${searchQuery}"` : ""}`
                : `No documents match "${searchQuery}"`}
            </span>
          </div>
        ) : (
          <div className="sourceItemList">
            {/* Master All Documents Scope Button */}
            <div
              className={`sourceRowItem masterRow ${!selectedFile ? "selected" : ""}`}
              onClick={() => onSelectFile(null)}
              role="button"
              tabIndex={0}
              aria-selected={!selectedFile}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelectFile(null)}
            >
              <div className="sourceRowLeft">
                <span className="docTypeIcon all">ALL</span>
                <div className="sourceRowMeta">
                  <strong className="sourceRowTitle">All Corpus Sources</strong>
                  <span className="sourceRowSub">
                    Query across {files.length} active source{files.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              {!selectedFile && (
                <span className="sourceSelectedCheck" title="Active scope">
                  <Check size={14} />
                </span>
              )}
            </div>

            {filteredFiles.map((file) => (
              <SourceItem
                key={file.file_name}
                file={file}
                isSelected={selectedFile?.file_name === file.file_name}
                onSelect={onSelectFile}
                onOpenPreview={(f) => setPreviewFile(f)}
                onDelete={deleteFile}
              />
            ))}
          </div>
        )}
      </div>

      <SourcePreview
        file={previewFile}
        isOpen={Boolean(previewFile)}
        onClose={() => setPreviewFile(null)}
        isSelected={selectedFile?.file_name === previewFile?.file_name}
        onSelectScope={onSelectFile}
        onOpenViewer={onOpenViewer}
        onDelete={deleteFile}
      />
    </div>
  );
}
