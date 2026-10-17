// components/CompanionPanel.tsx
import { useEffect, useRef } from "react";
import { useCompanionSession } from "../hooks/useCompanionSession";
import { WaveformVisualizer } from "./WaveformVisualizer";

interface Props {
  sessionId: string;
  sessionTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CompanionPanel({ sessionId, sessionTitle, isOpen, onClose }: Props) {
  const {
    status,
    messages,
    agentSpeaking,
    muted,
    error,
    start,
    toggleMute,
    disconnect,
  } = useCompanionSession(isOpen ? sessionId : null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && status === "idle") {
      start();
    }
  }, [isOpen, status, start]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[460px] bg-white shadow-2xl z-50 flex flex-col border-l border-border animate-slide-up">
      {/* Drawer Header */}
      <div className="p-5 border-b border-border flex items-center justify-between bg-surface-container-low/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shadow-md relative">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </svg>
            {agentSpeaking && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-secondary border-2 border-white animate-ping" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-title-md text-neutral">Tatva Voice Companion</h3>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                status === "active" ? "bg-secondary/15 text-secondary-dark" :
                status === "connecting" ? "bg-tertiary-container text-tertiary-dark" :
                status === "error" ? "bg-error/10 text-error" :
                "bg-surface-container text-neutral/60"
              }`}>
                {status}
              </span>
            </div>
            <p className="text-body-sm text-neutral/50 truncate max-w-[240px]">{sessionTitle}</p>
          </div>
        </div>

        <button
          onClick={() => {
            disconnect();
            onClose();
          }}
          className="w-8 h-8 rounded-full flex items-center justify-center text-neutral/50 hover:text-neutral hover:bg-surface-container transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Voice Status & Visualizer Banner */}
      <div className="p-4 bg-surface-container-low border-b border-border flex flex-col items-center justify-center gap-2">
        <div className="h-10 flex items-center justify-center">
          <WaveformVisualizer active={agentSpeaking || status === "active"} bars={20} color={agentSpeaking ? "#15A894" : "#6258E8"} />
        </div>
        <p className="text-xs font-semibold text-neutral/70">
          {agentSpeaking
            ? "Tatva is speaking…"
            : status === "active"
            ? (muted ? "Your microphone is muted" : "Listening… Speak anytime to ask or reflect")
            : status === "connecting"
            ? "Connecting voice channel via SLNG LiveKit…"
            : status === "error"
            ? "Agent configuration needed"
            : "Voice session ended"}
        </p>
      </div>

      {/* Error Banner if any */}
      {error && (
        <div className="m-4 p-3.5 rounded-xl bg-error/10 border border-error/20 text-xs text-error">
          <p className="font-bold mb-1">Live Voice Agent Note</p>
          <p>{error}</p>
          <p className="mt-1.5 text-neutral/70">
            Note: Once you deploy the UNMUTE agent via <code className="bg-white/80 px-1 py-0.5 rounded font-mono">unmute deploy</code> and set <code className="bg-white/80 px-1 py-0.5 rounded font-mono">SLNG_AGENT_ID</code> in <code className="bg-white/80 px-1 py-0.5 rounded font-mono">.env</code>, live voice WebRTC connects automatically!
          </p>
        </div>
      )}

      {/* Chat / Transcript Stream */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral/50 space-y-3">
            <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-2xl">
              🎙️
            </div>
            <div>
              <p className="font-semibold text-neutral/80 text-body-md">Session-Aware Dialogue</p>
              <p className="text-body-sm text-neutral/60 mt-1">
                Tatva has absorbed this session's summary and concepts. Ask questions like:
              </p>
            </div>
            <div className="space-y-1.5 text-xs text-neutral/70 w-full text-left">
              <div className="p-2 rounded bg-surface-container-low border border-border">
                "Can you explain the main concept with another analogy?"
              </div>
              <div className="p-2 rounded bg-surface-container-low border border-border">
                "Quiz me on the hardest takeaway from this lecture."
              </div>
              <div className="p-2 rounded bg-surface-container-low border border-border">
                "How would you summarize my delivery pacing?"
              </div>
            </div>
          </div>
        ) : (
          messages.map((m) => {
            const isUser = m.role === "user";
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
              >
                <span className="text-[10px] font-semibold text-neutral/40 uppercase mb-0.5 px-1">
                  {isUser ? "You" : "Tatva Companion"}
                </span>
                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl text-body-sm leading-relaxed ${
                    isUser
                      ? "bg-primary text-white rounded-br-sm"
                      : "bg-surface-container-low text-neutral border border-border rounded-bl-sm"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Controls Footer */}
      <div className="p-4 border-t border-border bg-white flex items-center justify-between gap-3">
        {status === "active" ? (
          <>
            <button
              onClick={toggleMute}
              className={`flex-1 py-2.5 px-4 rounded-xl text-label-md font-semibold flex items-center justify-center gap-2 border transition-all ${
                muted
                  ? "bg-error/10 text-error border-error/20 hover:bg-error/20"
                  : "bg-surface-container text-neutral border-border hover:bg-surface-container-high"
              }`}
            >
              {muted ? "🔇 Unmute Mic" : "🎙️ Mute Mic"}
            </button>

            <button
              onClick={disconnect}
              className="py-2.5 px-5 rounded-xl bg-error text-white text-label-md font-semibold hover:opacity-90 active:scale-[0.98] transition-all"
            >
              End Call
            </button>
          </>
        ) : (
          <button
            onClick={start}
            disabled={status === "connecting"}
            className="w-full py-3 px-5 rounded-xl bg-primary text-white text-label-md font-semibold hover:bg-primary-dark transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <span>🎙️</span>
            <span>{status === "connecting" ? "Connecting…" : status === "ended" ? "Restart Voice Call" : "Connect Voice Companion"}</span>
          </button>
        )}
      </div>
    </div>
  );
}
