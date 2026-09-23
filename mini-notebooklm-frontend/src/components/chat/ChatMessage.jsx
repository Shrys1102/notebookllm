import { Sparkles, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CodeBlock from "./CodeBlock.jsx";
import SourceAccordion from "./SourceAccordion.jsx";
import CitationGroup from "../citations/CitationGroup.jsx";
import MessageActions from "./MessageActions.jsx";
import FollowUpSuggestions from "./FollowUpSuggestions.jsx";
import ChatError from "./ChatError.jsx";
import { formatDate } from "../../utils/formatters.js";

const markdownComponents = {
  code: CodeBlock,
  a: ({ node, ...props }) => (
    <a {...props} target="_blank" rel="noopener noreferrer" className="markdownLink" />
  ),
  table: ({ node, ...props }) => (
    <div className="tableWrapper">
      <table className="markdownTable" {...props} />
    </div>
  ),
  blockquote: ({ node, ...props }) => (
    <blockquote className="markdownBlockquote" {...props} />
  ),
  hr: ({ node, ...props }) => <hr className="markdownDivider" {...props} />,
};

export default function ChatMessage({
  message,
  onRegenerate,
  onSelectSuggestion,
  onOpenViewer,
}) {
  const isAssistant = message.role === "assistant";
  const isError = message.isError;

  return (
    <article
      className={`messageRow ${isAssistant ? "assistant" : "user"} ${isError ? "error" : ""}`}
      tabIndex={0}
      aria-label={`${isAssistant ? "Aura AI" : "User"} message`}
    >
      <div className="messageAvatar" aria-hidden="true">
        {isAssistant ? (
          <span className="avatarAura" title="Aura Research Assistant">
            <Sparkles size={15} />
          </span>
        ) : (
          <span className="avatarUser" title="You">
            <User size={15} />
          </span>
        )}
      </div>

      <div className="messageContainer">
        <div className="messageMeta">
          <span className="messageAuthor">{isAssistant ? "Aura AI" : "You"}</span>
          {message.createdAt && (
            <span className="messageTime">{formatDate(message.createdAt)}</span>
          )}
        </div>

        <div className="messageContent">
          {isError ? (
            <ChatError
              message={message.content}
              onRetry={onRegenerate ? () => onRegenerate(message.id) : null}
            />
          ) : isAssistant ? (
            <div className="markdownBody">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {message.content}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="userText">{message.content}</p>
          )}
        </div>

        {isAssistant && !isError && (
          <div className="messageFooter">
            <CitationGroup sources={message.sources} className="messageCitationRow" />

            <SourceAccordion
              sources={message.sources}
              onOpenViewer={onOpenViewer}
            />

            <FollowUpSuggestions
              sources={message.sources}
              onSelectSuggestion={onSelectSuggestion}
            />

            <div className="messageActionRow">
              <MessageActions
                content={message.content}
                isAssistant={isAssistant}
                isError={isError}
                sources={message.sources}
                onRegenerate={onRegenerate ? () => onRegenerate(message.id) : null}
              />
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
