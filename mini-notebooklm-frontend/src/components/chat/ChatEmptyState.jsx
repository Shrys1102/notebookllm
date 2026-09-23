import {
  BookOpen,
  Sparkles,
  GitCompare,
  Lightbulb,
  FileSearch,
  ListTree,
} from "lucide-react";

export default function ChatEmptyState({ selectedFile, onSelectStarter }) {
  const scopeText = selectedFile ? selectedFile.file_name : "all active sources";

  const starters = [
    {
      icon: Sparkles,
      title: "Executive Synthesis",
      prompt: `Summarize the core findings and main takeaways from ${scopeText}.`,
    },
    {
      icon: ListTree,
      title: "Key Methodologies",
      prompt: `Extract the primary methodologies, data points, and evidence cited in ${scopeText}.`,
    },
    {
      icon: GitCompare,
      title: "Comparative Analysis",
      prompt: `What are the contrasting perspectives, strengths, and trade-offs presented in ${scopeText}?`,
    },
    {
      icon: Lightbulb,
      title: "Clarify Complex Concepts",
      prompt: `Explain the most complex technical concepts and terminology in ${scopeText} step by step.`,
    },
  ];

  return (
    <div className="chatEmptyLanding">
      <div className="emptyLandingBadge">
        <BookOpen size={16} />
        <span>Grounded Knowledge Base</span>
      </div>

      <div className="emptyLandingHeader">
        <h2>Inquire across your research corpus</h2>
        <p>
          Ask questions, verify evidence with grounded citations, or launch a guided analysis
          targeting <strong>{selectedFile ? selectedFile.file_name : "all uploaded documents"}</strong>.
        </p>
      </div>

      <div className="starterGrid">
        {starters.map((starter, idx) => {
          const Icon = starter.icon;
          return (
            <button
              key={idx}
              type="button"
              className="starterCard"
              onClick={() => onSelectStarter(starter.prompt)}
              aria-label={`Start query: ${starter.title}`}
            >
              <div className="starterCardIcon">
                <Icon size={16} />
              </div>
              <div className="starterCardContent">
                <strong>{starter.title}</strong>
                <span>{starter.prompt}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
