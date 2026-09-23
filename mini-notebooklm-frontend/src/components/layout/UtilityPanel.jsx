import { Activity, AudioLines, FileText, Loader2, Map, PlayCircle, Search, Sparkles, X, NotebookPen } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../services/api.js";
import { isMermaid } from "../../utils/formatters.js";
import Button from "../ui/Button.jsx";
import Card from "../ui/Card.jsx";
import MermaidDiagram from "../ui/MermaidDiagram.jsx";
import ResearchPanel from "../research/ResearchPanel.jsx";
import { useResearch } from "../../context/ResearchContext.jsx";

export default function UtilityPanel({ tools, selectedFile, isOpen = true, onClose, onOpenDocument, files = [], fileCount = 0 }) {
  const [topic, setTopic] = useState("");
  const [activeTab, setActiveTab] = useState("studio");
  const research = useResearch();
  const selectedLabel = selectedFile?.file_name || "All documents";

  // When the research panel is requested from the palette/shortcuts, select it.
  useEffect(() => {
    if (research.researchPanelTab) setActiveTab("research");
  }, [research.researchPanelTab]);

  const selectTab = (tab) => {
    setActiveTab(tab);
    if (tab === "studio") research.setResearchPanelTab(null);
    else research.setResearchPanelTab(research.researchPanelTab || "notes");
  };

  const researchRequested = Boolean(research.researchPanelTab);

  return (
    <aside className={`utilityPanel ${isOpen ? "open" : "collapsed"}`}>
      <div className="utilityHeader">
        <div className="utilityHeaderTitle">
          <Sparkles size={16} />
          <span>Research Studio</span>
        </div>
        {onClose && (
          <button className="iconButton small closeStudioBtn" onClick={onClose} aria-label="Close Studio Panel">
            <X size={15} />
          </button>
        )}
      </div>

      <div className="utilityTabs" role="tablist" aria-label="Studio panels">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "studio"}
          className={`utilityTab ${activeTab === "studio" ? "active" : ""}`}
          onClick={() => selectTab("studio")}
        >
          <Sparkles size={12} />
          <span>Studio</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "research"}
          className={`utilityTab ${activeTab === "research" ? "active" : ""}`}
          onClick={() => selectTab("research")}
        >
          <NotebookPen size={12} />
          <span>Research</span>
          {researchRequested && <span className="utilityTabDot" title="Research surface requested" />}
        </button>
      </div>

      {activeTab === "research" ? (
        <div className="utilityScroll researchTabScroll">
          <ResearchPanel onOpenDocument={onOpenDocument} files={files} fileCount={fileCount} />
        </div>
      ) : (
        <div className="utilityScroll">
          <Card
            title="Summary"
            action={
              <Button variant="secondary" size="sm" onClick={tools.generateSummary} disabled={tools.loadingKey === "Summary"}>
                {tools.loadingKey === "Summary" ? <Loader2 className="spin" size={15} /> : <FileText size={15} />}
                Generate
              </Button>
            }
          >
            <p className="muted">{tools.summary?.summary || `Create a concise summary for ${selectedLabel}.`}</p>
          </Card>

          <Card
            title="Concept map"
            action={
              <Button variant="secondary" size="sm" onClick={tools.generateConceptMap} disabled={tools.loadingKey === "Concept map"}>
                {tools.loadingKey === "Concept map" ? <Loader2 className="spin" size={15} /> : <Map size={15} />}
                Map
              </Button>
            }
          >
            {tools.conceptMap?.concept_map ? (
              isMermaid(tools.conceptMap.concept_map) ? (
                <MermaidDiagram chart={tools.conceptMap.concept_map} />
              ) : (
                <pre className="codeBlock">{tools.conceptMap.concept_map}</pre>
              )
            ) : (
              <p className="muted">Generate a Mermaid mindmap from the active document scope.</p>
            )}
          </Card>

          <Card
            title="Voice overview"
            action={
              <Button variant="secondary" size="sm" onClick={tools.generateVoice} disabled={tools.loadingKey === "Voice overview"}>
                {tools.loadingKey === "Voice overview" ? <Loader2 className="spin" size={15} /> : <AudioLines size={15} />}
                Audio
              </Button>
            }
          >
            {tools.voice?.audio_file ? (
              <div className="voiceBox">
                <audio controls autoPlay src={api.voiceUrl(tools.voice.download_url || tools.voice.audio_file)} />
                <p>{tools.voice.summary_text}</p>
              </div>
            ) : (
              <p className="muted">Generate a short MP3 overview with the backend voice endpoint.</p>
            )}
          </Card>

          <Card title="Learning videos">
            <form
              className="videoSearch"
              onSubmit={(event) => {
                event.preventDefault();
                tools.findVideos(topic);
              }}
            >
              <input value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="Optional topic" />
              <Button type="submit" variant="secondary" size="icon" disabled={tools.loadingKey === "YouTube"} title="Find videos">
                {tools.loadingKey === "YouTube" ? <Loader2 className="spin" size={15} /> : <Search size={15} />}
              </Button>
            </form>
            {tools.videos?.videos?.length ? (
              <div className="videoList">
                {tools.videos.videos.map((video) => (
                  <a key={video.url} href={video.url} target="_blank" rel="noreferrer">
                    {video.thumbnail && <img src={video.thumbnail} alt="" />}
                    <span>
                      <strong>{video.title}</strong>
                      <small>{video.channel} · {video.duration_label}</small>
                    </span>
                    <PlayCircle size={16} />
                  </a>
                ))}
              </div>
            ) : (
              <p className="muted">Find YouTube recommendations by topic or document content.</p>
            )}
          </Card>
        </div>
      )}
    </aside>
  );
}