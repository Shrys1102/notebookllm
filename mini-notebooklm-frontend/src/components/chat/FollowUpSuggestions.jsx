import { Compass, Sparkles } from "lucide-react";
import { useMemo } from "react";

export default function FollowUpSuggestions({ sources = [], onSelectSuggestion }) {
  const suggestions = useMemo(() => {
    const uniqueSources = [...new Set(sources.map((s) => s.source).filter(Boolean))];
    const items = [];

    if (uniqueSources.length > 0) {
      const primaryDoc = uniqueSources[0];
      items.push(`What are the key conclusions in ${primaryDoc}?`);
      if (uniqueSources.length > 1) {
        items.push(`Compare findings between ${uniqueSources[0]} and ${uniqueSources[1]}`);
      } else {
        items.push(`Extract methodology and data points from ${primaryDoc}`);
      }
      items.push("What potential limitations or caveats are mentioned?");
    } else {
      items.push("Synthesize the key takeaways across the documents");
      items.push("What are the most critical evidence points?");
      items.push("Explain any complex terminology mentioned");
    }

    return items.slice(0, 3);
  }, [sources]);

  if (!suggestions.length || !onSelectSuggestion) return null;

  return (
    <div className="followUpContainer">
      <div className="followUpHeader">
        <Compass size={13} className="followUpIcon" />
        <span>Explore further</span>
      </div>
      <div className="followUpPills">
        {suggestions.map((item, idx) => (
          <button
            key={idx}
            type="button"
            className="followUpPill"
            onClick={() => onSelectSuggestion(item)}
            aria-label={`Follow up: ${item}`}
          >
            <Sparkles size={12} className="followUpPillIcon" />
            <span>{item}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
