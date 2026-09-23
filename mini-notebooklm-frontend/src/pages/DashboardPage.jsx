import { useEffect, useRef, useState } from "react";
import ChatPanel from "../components/chat/ChatPanel.jsx";
import Header from "../components/layout/Header.jsx";
import Sidebar from "../components/layout/Sidebar.jsx";
import UtilityPanel from "../components/layout/UtilityPanel.jsx";
import CommandPalette from "../components/ui/CommandPalette.jsx";
import DocumentViewer from "../components/documents/DocumentViewer.jsx";
import CollectionDetail from "../components/collections/CollectionDetail.jsx";
import ResearchContextBar from "../components/research/ResearchContextBar.jsx";
import { useChat } from "../hooks/useChat.js";
import { useFiles } from "../hooks/useFiles.js";
import { useNotebookTools } from "../hooks/useNotebookTools.js";
import { useResearch } from "../context/ResearchContext.jsx";
import useKeyboardShortcuts from "../hooks/useKeyboardShortcuts.js";

export default function DashboardPage() {
  const research = useResearch();
  const filesState = useFiles((added) => {
    // A real upload just completed: record it in the research journal.
    for (const file of added || []) {
      research.recordActivity("source_added", {
        title: file.file_name || file.name || "Source added",
        fileName: file.file_name || file.name || null,
        sourceId: file.file_name || file.name || null,
        objectType: "source",
        metadata: { extension: file.extension || null, chunks: file.chunks_indexed ?? null },
      });
    }
  });
  const chat = useChat();
  const [selectedFile, setSelectedFile] = useState(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const tools = useNotebookTools(selectedFile);

  const {
    viewerOpen,
    activeCitation,
    focusMode,
    openDocumentViewer,
    setFocusMode,
    sidebarOpen,
    setSidebarOpen,
    studioOpen,
    setStudioOpen,
    openResearchPanel,
    recentDocuments,
    createNote,
    createInsight,
    recordQuestion,
    markQuestionAnswered,
  } = research;

  // Keyboard: Ctrl+B sidebar, Ctrl+K palette, Alt+S studio, Alt+R research panel.
  const bindings = [
    {
      keys: "ctrl+k",
      description: "Open command palette",
      onKeyDown: () => setPaletteOpen((v) => !v),
    },
    {
      keys: "ctrl+b",
      description: "Toggle source sidebar",
      onKeyDown: () => setSidebarOpen((v) => !v),
    },
    {
      keys: "alt+s",
      description: "Toggle Studio panel",
      onKeyDown: () => setStudioOpen((v) => !v),
    },
    {
      keys: "alt+r",
      description: "Open research panel",
      onKeyDown: () => openResearchPanel(research.researchPanelTab || "notes"),
    },
  ];
  useKeyboardShortcuts(bindings, true);

  const triggerUploadInput = () => {
    const fileInput = document.querySelector(".uploadZone input[type='file']");
    if (fileInput) fileInput.click();
  };

  const targetFileName = activeCitation?.fileName || null;
  const isScoped = Boolean(selectedFile && selectedFile.file_name === targetFileName);

  const handleToggleScope = () => {
    if (isScoped) {
      setSelectedFile(null);
    } else {
      const file = filesState.files.find((f) => f.file_name === targetFileName);
      if (file) setSelectedFile(file);
    }
  };

  const handleOpenDocument = (target) => {
    openDocumentViewer(target);
  };

  const handleAssignCurrentSource = () => {
    const name = activeCitation?.fileName;
    if (!name) return;
    research.setAssignSource(name);
    openResearchPanel("collections");
  };

  // Mark the most recent question as answered once a real (non-error)
  // assistant response lands, including after regeneration.
  const lastAnswerRef = useRef(null);
  useEffect(() => {
    const answers = chat.messages.filter((m) => m.role === "assistant" && !m.isError);
    const lastAnswer = answers[answers.length - 1];
    if (lastAnswer && lastAnswer.id !== lastAnswerRef.current) {
      lastAnswerRef.current = lastAnswer.id;
      markQuestionAnswered();
    }
  }, [chat.messages, markQuestionAnswered]);

  const handleToggleFocusMode = () => {
    if (viewerOpen) {
      setFocusMode(!focusMode);
    } else if (recentDocuments.length > 0) {
      const recent = recentDocuments[0];
      openDocumentViewer({ fileName: recent.fileName });
      setFocusMode(true);
    }
  };

  const saveLatestAnswer = () => {
    const lastAssistant = [...chat.messages].reverse().find((m) => m.role === "assistant" && !m.isError);
    if (!lastAssistant) return;
    const sources = lastAssistant.sources || [];
    const sourceList = [...new Set(sources.map((s) => s.source).filter(Boolean))];
    const questionPair = [...chat.messages].reverse().find((m) => m.role === "user");
    createNote({
      title: `AI answer${questionPair ? ` — ${questionPair.content.slice(0, 60)}` : ""}`,
      body: lastAssistant.content,
      sourceFileName: sourceList.length === 1 ? sourceList[0] : null,
      excerpt: sourceList.length > 1 ? `Grounded in: ${sourceList.join(", ")}` : null,
    });
    openResearchPanel("notes");
  };

  const saveLatestAnswerAsInsight = () => {
    const lastAssistant = [...chat.messages].reverse().find((m) => m.role === "assistant" && !m.isError);
    if (!lastAssistant) return;
    const sources = lastAssistant.sources || [];
    const sourceList = [...new Set(sources.map((s) => s.source).filter(Boolean))];
    const sourceReferences = sources
      .map((s) => ({
        fileName: s.source || null,
        chunkId: s.chunk_id ?? s.chunk_index ?? null,
        excerpt: s.text || s.excerpt || null,
        section: s.section || null,
      }))
      .filter((r) => r.fileName);
    createInsight({
      title: `Insight — ${sourceList[0] ? `from ${sourceList[0]}` : "AI answer"}`,
      body: lastAssistant.content,
      sourceReferences,
    });
    openResearchPanel("insights");
  };

  return (
    <div className="appContainer">
      <Header
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        studioOpen={studioOpen}
        onToggleStudio={() => setStudioOpen((v) => !v)}
        onOpenCommandPalette={() => setPaletteOpen(true)}
        selectedFile={selectedFile}
        onClearSelectedFile={() => setSelectedFile(null)}
        fileCount={filesState.files.length}
        health={tools.health}
      />

      <ResearchContextBar selectedFile={selectedFile} fileCount={filesState.files.length} />

      <div className={`appShell ${!sidebarOpen ? "sidebarCollapsed" : ""} ${!studioOpen ? "studioCollapsed" : ""}`}>
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          filesState={filesState}
          selectedFile={selectedFile}
          onSelectFile={setSelectedFile}
          chat={chat}
          onOpenViewer={handleOpenDocument}
        />

        <ChatPanel
          chat={chat}
          selectedFile={selectedFile}
          onTriggerUpload={triggerUploadInput}
          onOpenViewer={handleOpenDocument}
          onRecordQuestion={recordQuestion}
        />

        {studioOpen && (
          <UtilityPanel
            tools={tools}
            selectedFile={selectedFile}
            isOpen={studioOpen}
            onClose={() => setStudioOpen(false)}
            onOpenDocument={handleOpenDocument}
            files={filesState.files}
            fileCount={filesState.files.length}
          />
        )}
      </div>

      <CommandPalette
        isOpen={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onTriggerUpload={triggerUploadInput}
        onNewSession={chat.startNewSession}
        onClearSession={chat.clearSession}
        onGenerateSummary={tools.generateSummary}
        onGenerateConceptMap={tools.generateConceptMap}
        onGenerateVoice={tools.generateVoice}
        onOpenResearchPanel={openResearchPanel}
        onOpenTimeline={research.focusTimeline}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        onToggleStudio={() => setStudioOpen((v) => !v)}
        onToggleFocusMode={handleToggleFocusMode}
        onToggleEvidence={() => research.setEvidenceOpen((v) => !v)}
        onSaveLatestAnswer={saveLatestAnswer}
        onSaveLatestAnswerAsInsight={saveLatestAnswerAsInsight}
        onFocusResearchSearch={research.focusResearchSearch}
        onRequestCreateNote={research.requestCreateNote}
        onRequestCreateCollection={research.requestCreateCollection}
        onAssignCurrentSource={handleAssignCurrentSource}
        onOpenCollection={research.openCollection}
        onOpenRecentDocument={handleOpenDocument}
        viewerOpen={viewerOpen}
        canSaveAnswer={chat.messages.some((m) => m.role === "assistant" && !m.isError)}
        hasRecentDocuments={recentDocuments.length > 0}
        recentDocument={recentDocuments[0] || null}
        currentSourceName={activeCitation?.fileName || null}
        hasRecentCollection={research.recentCollections.length > 0}
        recentCollection={
          research.recentCollections.length > 0
            ? research.collections.find((c) => c.id === research.recentCollections[0].id) || null
            : null
        }
      />

      <DocumentViewer
        files={filesState.files}
        isScoped={isScoped}
        onToggleScope={handleToggleScope}
      />

      <CollectionDetail files={filesState.files} onOpenDocument={handleOpenDocument} />
    </div>
  );
}