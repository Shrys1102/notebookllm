import { useState } from "react";
import { Check, Copy, Terminal } from "lucide-react";
import MermaidDiagram from "../ui/MermaidDiagram.jsx";
import { isMermaid } from "../../utils/formatters.js";

export default function CodeBlock({ node, inline, className, children, ...props }) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "";
  const codeString = String(children).replace(/\n$/, "");

  // Inline code
  if (inline || !match && !codeString.includes("\n") && !isMermaid(codeString)) {
    return (
      <code className="inlineCode" {...props}>
        {children}
      </code>
    );
  }

  // Mermaid diagrams
  if (language.toLowerCase() === "mermaid" || isMermaid(codeString)) {
    return <MermaidDiagram chart={codeString} />;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="codeBlockWrapper">
      <div className="codeBlockHeader">
        <div className="codeBlockLang">
          <Terminal size={13} />
          <span>{language || "code"}</span>
        </div>
        <button
          type="button"
          className="codeBlockCopyBtn"
          onClick={handleCopy}
          aria-label="Copy code to clipboard"
          title="Copy code"
        >
          {copied ? <Check size={13} className="textSuccess" /> : <Copy size={13} />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <pre className="codeBlockContent">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    </div>
  );
}
