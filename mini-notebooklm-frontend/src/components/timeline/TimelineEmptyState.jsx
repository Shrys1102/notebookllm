import { History, ArrowRight } from "lucide-react";

/**
 * Premium timeline empty state. Activity is never fabricated — for users
 * upgrading into the timeline, the journal begins with their next real
 * research action.
 */
export default function TimelineEmptyState({ onExplore = null }) {
  return (
    <div className="tlEmptyState" role="status">
      <span className="tlEmptyIcon">
        <History size={20} />
      </span>
      <strong className="tlEmptyTitle">Your research trail starts here.</strong>
      <p className="tlEmptyBody">
        From now on, Mini-NotebookLM keeps a quiet journal of the research actions that matter —
        questions asked, documents opened, evidence saved, notes and insights written, collections
        built. Nothing from before this moment is invented; everything you do next appears here.
      </p>
      <button type="button" className="tlEmptyExplore" onClick={onExplore}>
        Explore the research workspace
        <ArrowRight size={13} />
      </button>
    </div>
  );
}