import { Sparkles } from "lucide-react";

export default function ChatLoading({ selectedFile }) {
  const scopeLabel = selectedFile ? selectedFile.file_name : "entire corpus";

  return (
    <div className="chatLoadingState" role="status" aria-live="polite">
      <div className="chatLoadingAvatar">
        <span className="avatarAura pulseAura">
          <Sparkles size={16} />
        </span>
      </div>

      <div className="chatLoadingBody">
        <div className="chatLoadingMeta">
          <span className="messageAuthor">Aura AI</span>
          <span className="chatLoadingPulseLabel">
            Reading {scopeLabel} & synthesizing analysis...
          </span>
        </div>

        <div className="chatLoadingShimmers">
          <div className="shimmerLine shimmerLong" />
          <div className="shimmerLine shimmerMedium" />
          <div className="shimmerLine shimmerShort" />
        </div>
      </div>
    </div>
  );
}
