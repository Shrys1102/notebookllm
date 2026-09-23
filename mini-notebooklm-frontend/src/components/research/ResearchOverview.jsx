import { useMemo } from "react";
import {
  Layers,
  Quote,
  NotebookPen,
  Lightbulb,
  History,
  MessageCircleQuestion,
  ArrowRight,
  FolderOpen,
  Check,
  Search,
  ArrowUpRight,
} from "lucide-react";
import { useResearch } from "../../context/ResearchContext.jsx";
import { formatDate } from "../../utils/formatters.js";
import { activityMeta } from "../timeline/activityMeta.js";
import { runActivityRestore } from "../../utils/timelineRestore.js";

/**
 * Research dashboard: real counts, recent questions with status, and a live
 * activity timeline. Only shows data that actually exists — no decorative
 * analytics. Research activity is prioritized over statistics.
 */
export default function ResearchOverview({ fileCount = 0, onOpenDocument }) {
  const research = useResearch();
  const {
    savedEvidence,
    notes,
    insights,
    collections,
    recentDocuments,
    recentCollections,
    history,
    events,
    toggleQuestionSaved,
    openResearchPanel,
    openCollection,
  } = research;

  const recentCollectionList = recentCollections
    .map((r) => collections.find((c) => c.id === r.id))
    .filter(Boolean)
    .slice(0, 3);

  const questions = history.questions || [];
  const timeline = useMemo(() => {
    return events.slice(0, 8).map((event) => ({ ...event, meta: activityMeta(event.type) }));
  }, [events]);

  const restoreTimelineEvent = (event) => {
    runActivityRestore(event, { onOpenDocument, openCollection, openResearchPanel });
  };

  const stats = [
    { label: "Sources", value: fileCount, icon: Layers },
    { label: "Questions", value: (history.questions || []).length, icon: MessageCircleQuestion },
    { label: "Evidence", value: savedEvidence.length, icon: Quote },
    { label: "Notes", value: notes.length, icon: NotebookPen },
    { label: "Insights", value: insights.length, icon: Lightbulb },
    { label: "Collections", value: collections.length, icon: FolderOpen },
  ];

  const recentCollectionsRow = recentCollectionList.length > 0 && (
    <div className="researchOverviewRecent">
      <span className="researchOverviewRecentLabel">Recent collections:</span>
      {recentCollectionList.map((c) => (
        <button
          key={c.id}
          type="button"
          className="researchOverviewRecentChip"
          onClick={() => openCollection(c.id)}
        >
          <FolderOpen size={11} />
          {c.name}
        </button>
      ))}
    </div>
  );

  return (
    <div className="researchOverview" aria-label="Research overview">
      <div className="researchSectionHeader">
        <div className="researchSectionTitle">
          <Layers size={14} />
          <span>Research Overview</span>
        </div>
      </div>

      {/* Counts */}
      <div className="researchStatGrid">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="researchStatBox" title={`${stat.value} ${stat.label.toLowerCase()}`}>
              <Icon size={13} />
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="researchQuickActions">
        <button type="button" className="researchQuickAction" onClick={() => openResearchPanel("notes")}>
          <NotebookPen size={12} />
          New Note
        </button>
        <button type="button" className="researchQuickAction" onClick={() => openResearchPanel("insights")}>
          <Lightbulb size={12} />
          Insights
        </button>
        <button type="button" className="researchQuickAction" onClick={() => openResearchPanel("collections")}>
          <FolderOpen size={12} />
          Collections
        </button>
      </div>

      {/* Recent questions */}
      <div className="researchOverviewSection">
        <div className="researchOverviewSectionHeader">
          <span className="researchOverviewSectionTitle">
            <MessageCircleQuestion size={12} />
            Recent Questions
          </span>
          {questions.length > 0 && (
            <button
              type="button"
              className="researchOverviewMore"
              onClick={() => openResearchPanel("overview")}
              title="Questions are recorded locally as you ask them in chat"
            >
              {questions.length}
            </button>
          )}
        </div>
        {questions.length === 0 ? (
          <p className="researchOverviewEmpty">Questions you ask in chat will be tracked here with their status.</p>
        ) : (
          <ul className="researchQuestionList">
            {questions.slice(0, 4).map((q) => (
              <li key={q.id} className="researchQuestionRow">
                <span className={`researchQuestionStatus ${q.status}`} title={`Status: ${q.status}`}>
                  {q.status === "answered" ? <Check size={10} /> : <ArrowRight size={10} />}
                </span>
                <span className="researchQuestionText" title={q.text}>{q.text}</span>
                <span className="researchQuestionMeta">
                  {q.scope && <em title="Scope">{q.scope}</em>}
                  <time title={q.at}>{formatDate(q.at)}</time>
                </span>
                <button
                  type="button"
                  className={`researchQuestionSave ${q.saved ? "saved" : ""}`}
                  onClick={() => toggleQuestionSaved(q.id)}
                  title={q.saved ? "Remove from saved questions" : "Save question"}
                  aria-pressed={q.saved}
                >
                  <Check size={11} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Timeline */}
      <div className="researchOverviewSection">
        <div className="researchOverviewSectionHeader">
          <span className="researchOverviewSectionTitle">
            <History size={12} />
            Research Timeline
          </span>
          {timeline.length > 0 && (
            <button
              type="button"
              className="researchOverviewMore"
              onClick={() => openResearchPanel("timeline")}
              title="Open the full research timeline"
            >
              View timeline
            </button>
          )}
        </div>
        {timeline.length === 0 ? (
          <p className="researchOverviewEmpty">Your research journal starts now — questions asked, documents opened, evidence saved, notes and insights written, collections built will appear here.</p>
        ) : (
          <ol className="researchTimeline restorable">
            {timeline.map((event) => {
              const Icon = event.meta.icon;
              return (
                <li key={event.id} className="researchTimelineItem">
                  <button
                    type="button"
                    className="researchTimelineRow"
                    onClick={() => restoreTimelineEvent(event)}
                    title={`${event.meta.verb} — ${event.title || event.meta.label}`}
                  >
                    <span className="researchTimelineDot">
                      <Icon size={9} />
                    </span>
                    <span className="researchTimelineLabel" title={event.title}>
                      <em>{event.meta.label}</em>
                      <strong>{event.title}</strong>
                    </span>
                    <time className="researchTimelineTime">{formatDate(event.at)}</time>
                    <ArrowUpRight size={11} className="researchTimelineGo" />
                  </button>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {/* Recent collections */}
      {recentCollectionsRow}

      {/* Recent documents shortcut */}
      {recentDocuments.length > 0 && (
        <div className="researchOverviewRecent">
          <span className="researchOverviewRecentLabel">Jump back into:</span>
          <button
            type="button"
            className="researchOverviewRecentChip"
            onClick={() => onOpenDocument?.({ fileName: recentDocuments[0].fileName })}
          >
            <History size={11} />
            {recentDocuments[0].fileName}
          </button>
        </div>
      )}

      <div className="researchLocalNotice">
        <Search size={11} />
        <span>Overview reflects local research activity in this browser.</span>
      </div>
    </div>
  );
}