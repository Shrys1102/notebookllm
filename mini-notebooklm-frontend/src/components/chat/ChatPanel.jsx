import { useEffect, useRef } from "react";
import ChatMessage from "./ChatMessage.jsx";
import ChatComposer from "./ChatComposer.jsx";
import ChatEmptyState from "./ChatEmptyState.jsx";
import ChatLoading from "./ChatLoading.jsx";
import RecentActivityStrip from "../research/RecentActivityStrip.jsx";

export default function ChatPanel({
  chat,
  selectedFile,
  onTriggerUpload,
  onOpenViewer,
  onRecordQuestion,
}) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.messages, chat.asking]);

  const handleSubmit = (queryToAsk = null) => {
    const question = typeof queryToAsk === "string" ? queryToAsk : chat.draft;
    chat.askQuestion(question, selectedFile?.file_name || null);
    onRecordQuestion?.(question);
  };

  const handleRegenerate = (assistantMessageId) => {
    if (chat.regenerateResponse) {
      chat.regenerateResponse(assistantMessageId, selectedFile?.file_name || null);
    }
  };

  return (
    <main className="centerPanel" aria-label="Research chat workspace">
      <div className="chatHeader">
        <div className="chatHeaderTitles">
          <span className="eyebrow">{selectedFile ? selectedFile.file_name : "All Corpus Sources"}</span>
          <h1>Research Workspace</h1>
        </div>
        <div className="chatHeaderMeta">
          <span className="sessionPill" title={`Current session: ${chat.sessionId}`}>
            {chat.sessionId}
          </span>
        </div>
      </div>

      <div className="chatScroll" tabIndex={0} aria-label="Conversation stream">
        {!chat.messages.length && !chat.asking ? (
          <>
          <RecentActivityStrip />
          <ChatEmptyState
            selectedFile={selectedFile}
            onSelectStarter={(prompt) => handleSubmit(prompt)}
          />
          </>
        ) : (
          chat.messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              onRegenerate={handleRegenerate}
              onSelectSuggestion={(suggestion) => handleSubmit(suggestion)}
              onOpenViewer={onOpenViewer}
            />
          ))
        )}

        {chat.asking && <ChatLoading selectedFile={selectedFile} />}

        <div ref={endRef} />
      </div>

      <ChatComposer
        draft={chat.draft}
        onDraftChange={chat.setDraft}
        onSubmit={() => handleSubmit()}
        disabled={chat.asking}
        selectedFile={selectedFile}
        onTriggerUpload={onTriggerUpload}
      />
    </main>
  );
}
