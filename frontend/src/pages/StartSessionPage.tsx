// pages/StartSessionPage.tsx — Screen 2: Start a Session
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api/client";
import { ModeSelector, type ModeType } from "../components/ModeSelector";

export function StartSessionPage() {
  const [mode, setMode] = useState<ModeType>("lesson");
  const [title, setTitle] = useState("");
  const [speakers, setSpeakers] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const SUGGESTED_TITLES: Record<ModeType, string[]> = {
    lesson: [
      "Introduction to Voice AI Architecture & Latency Optimization",
      "Deep Dive into WebRTC vs WebSockets for Audio Streaming",
      "State Management Patterns in Modern React Applications",
    ],
    speech: [
      "Keynote: The Future of Ambient Intelligence & Voice Interfaces",
      "Pitch Deck Rehearsal: Tatva Voice Knowledge Studio",
      "Tech Talk: Low-Latency Speech-to-Text at Scale",
    ],
    debate: [
      "Debate: Open Weights Models vs Proprietary Voice APIs",
      "Debate: Local Edge Processing vs Serverless Cloud Pipelines",
      "Debate: Audio-to-Audio Native LLMs vs Cascaded Pipelines",
    ],
    discussion: [
      "Product Strategy: Tatva Hackathon Roadmap & Presentation",
      "Architecture Sync: LiveKit Room Setup and Web-Session Integration",
      "Knowledge Studio: User Experience and Progressive SSE Synthesis",
    ],
  };

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please enter a title for your session.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const speakerList = speakers
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const session = await api.createSession({
        title: title.trim(),
        mode,
        language: "en",
        speakers: speakerList.length > 0 ? speakerList : undefined,
      });

      navigate(`/live/${session.id}`);
    } catch (err: any) {
      setError(err?.message || "Failed to create session");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface py-10 px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-label-sm text-neutral/60">
          <Link to="/" className="hover:text-primary transition-colors">Workspace</Link>
          <span>/</span>
          <span className="text-neutral font-semibold">Start New Session</span>
        </div>

        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-headline-lg font-bold text-neutral tracking-tight">
            Configure Your Voice Session
          </h1>
          <p className="text-body-md text-neutral/70">
            Select an operating mode, specify session guidelines, and launch the Live Voice Studio.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-error text-body-sm font-medium">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleStart} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mode Selection */}
            <div className="space-y-3">
              <label className="block text-title-md font-semibold text-neutral">
                1. Select Session Mode
              </label>
              <ModeSelector selected={mode} onChange={setMode} />
            </div>

            {/* Session Title */}
            <div className="space-y-3">
              <label htmlFor="session-title" className="block text-title-md font-semibold text-neutral">
                2. Session Title & Focus
              </label>
              <input
                id="session-title"
                type="text"
                placeholder="e.g. Distributed Consensus in Distributed Systems"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-border rounded-xl text-body-md text-neutral placeholder:text-neutral/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 shadow-sm"
              />

              {/* Suggestions */}
              <div className="space-y-1.5 pt-1">
                <span className="text-xs font-semibold text-neutral/50 block">Suggested topics for {mode}:</span>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_TITLES[mode].map((sug, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setTitle(sug)}
                      className="text-xs bg-white border border-border rounded-lg px-2.5 py-1.5 text-neutral/70 hover:border-primary/50 hover:text-primary transition-all text-left"
                    >
                      + {sug}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Optional Speakers (if debate or discussion) */}
            {(mode === "debate" || mode === "discussion") && (
              <div className="space-y-2 animate-fade-in">
                <label htmlFor="speakers-input" className="block text-title-md font-semibold text-neutral">
                  3. Participant / Speaker Names (Optional)
                </label>
                <input
                  id="speakers-input"
                  type="text"
                  placeholder="e.g. Speaker 1 (Affirmative), Speaker 2 (Opposition)"
                  value={speakers}
                  onChange={(e) => setSpeakers(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-body-sm text-neutral focus:outline-none focus:border-primary shadow-sm"
                />
                <p className="text-xs text-neutral/50">Comma-separated names for speaker diarization labeling.</p>
              </div>
            )}

            {/* Submit CTA */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-primary py-3.5 px-6 rounded-xl text-title-md font-bold justify-center shadow-level-2 hover:shadow-level-3 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Launching Studio…
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <span>🎙️</span>
                    <span>Launch Voice Studio</span>
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Sidebar Guidelines (1 col) */}
          <div className="space-y-6">
            <div className="card p-6 bg-white space-y-4">
              <div className="flex items-center gap-2.5 text-primary font-semibold text-title-md">
                <span>🛡️</span>
                <h3>Tatva Studio Guidelines</h3>
              </div>

              <div className="space-y-3 text-body-sm text-neutral/80">
                <div className="p-3 rounded-lg bg-surface-container-low border border-border">
                  <span className="font-semibold block text-neutral mb-0.5">Real-Time Capture</span>
                  <p className="text-xs text-neutral/70">
                    Audio is streamed live via WebSocket to SLNG Nova 3 with diarization and VAD active.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-surface-container-low border border-border">
                  <span className="font-semibold block text-neutral mb-0.5">Instant Synthesis</span>
                  <p className="text-xs text-neutral/70">
                    Pressing <strong>End Session</strong> immediately triggers Groq LLM progressive card generation without requiring manual prompting.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-surface-container-low border border-border">
                  <span className="font-semibold block text-neutral mb-0.5">Voice Companion</span>
                  <p className="text-xs text-neutral/70">
                    Once generated, click <strong>Talk to Tatva</strong> to interrogate your session with an interactive voice AI.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-neutral/50">
                <span>Engine: SLNG Nova 3 + Groq</span>
                <span className="text-secondary font-semibold">● Ready</span>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
