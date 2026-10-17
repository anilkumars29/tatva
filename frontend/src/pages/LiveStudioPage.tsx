// pages/LiveStudioPage.tsx — Screen 3: Live Voice Studio
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, type Session } from "../api/client";
import { useAudioCapture } from "../hooks/useAudioCapture";
import { useSLNGTranscript } from "../hooks/useSLNGTranscript";
import { LiveTranscriptPanel } from "../components/LiveTranscriptPanel";
import { WaveformVisualizer } from "../components/WaveformVisualizer";

export function LiveStudioPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<Session | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isEnding, setIsEnding] = useState(false);

  const [demoActive, setDemoActive] = useState(false);
  const timerRef = useRef<number | null>(null);

  const { status: micStatus, error: micError, start: startMic, stop: stopMic } = useAudioCapture(id || "");
  const micActive = micStatus === "recording";
  const { lines } = useSLNGTranscript(id || null, true);

  // Load session
  useEffect(() => {
    if (!id) return;
    api.getSession(id).then(setSession).catch(console.error);
  }, [id]);

  // Elapsed timer
  useEffect(() => {
    timerRef.current = window.setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const toggleMic = async () => {
    if (micActive) {
      stopMic();

    } else {
      await startMic();

    }
  };

  // Demo simulation mode in case mic is blocked or to test progressive synthesis
  const simulateDemoSpeech = async () => {
    if (!id || demoActive) return;
    setDemoActive(true);

    const demoSentences = [
      "Welcome to this deep dive into Voice AI architecture. Today we're exploring end-to-end latency optimization.",
      "The primary bottleneck in modern speech pipelines isn't the inference time of the LLM alone; it is the waterfall cascade.",
      "When audio goes from client to Speech-to-Text, then to the LLM, and finally to Text-to-Speech, each boundary introduces serialization overhead.",
      "To achieve sub-400 millisecond conversational turn-around, modern platforms utilize full-duplex WebSockets and speculative chunking.",
      "Let's define our first key concept: Streaming Diarization. Diarization is the process of partitioning an audio stream into speaker turns.",
      "In a multi-speaker debate or collaborative roundtable, accurate turn boundaries prevent the LLM from synthesizing contradictory arguments.",
      "In summary: optimize your transport layer with WebRTC data channels, stream partial transcript frames, and inject session arguments into agent memory."
    ];

    // Post to backend transcript directly for seamless demo reliability
    try {
      for (const sent of demoSentences) {
        await new Promise((r) => setTimeout(r, 900));
        await api.appendTranscript(id, {
          speaker: "Speaker 1",
          text: sent,
        }).catch(() => {});
      }
    } finally {
      setDemoActive(false);
    }
  };

  const handleEndSession = async () => {
    if (!id || isEnding) return;
    setIsEnding(true);

    try {
      stopMic();
      await api.endSession(id);
      navigate(`/distilling/${id}`);
    } catch (err) {
      console.error("Failed to end session:", err);
      // Still navigate to distilling
      navigate(`/distilling/${id}`);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Studio Top Bar */}
      <header className="bg-white border-b border-border px-6 py-3.5 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-error animate-ping" />
            <span className="text-label-sm font-bold uppercase tracking-wider text-error">
              Live Voice Studio
            </span>
          </div>

          <div className="h-4 w-px bg-border" />

          <div>
            <h2 className="font-bold text-title-md text-neutral truncate max-w-md">
              {session?.title || "Live Session"}
            </h2>
          </div>

          {session?.mode && (
            <span className="badge-mode badge-lesson text-[10px] hidden sm:inline-block">
              {session.mode}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="font-mono text-headline-sm font-semibold text-neutral/80 bg-surface-container px-3 py-1 rounded-lg">
            {formatTimer(elapsedSeconds)}
          </div>

          <button
            onClick={handleEndSession}
            disabled={isEnding}
            className="btn-danger py-2 px-5 text-label-md font-bold shadow-md cursor-pointer hover:bg-error/90 active:scale-95 transition-all"
          >
            {isEnding ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Finalizing…
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <span>⏹️</span>
                <span>End Session & Distill</span>
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Studio Viewport */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Audio Deck & Telemetry (1 col) */}
        <div className="space-y-5 flex flex-col">
          {/* Deck Card */}
          <div className="card p-6 bg-white space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral/50">Audio Input Stream</span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                micActive ? "bg-secondary/15 text-secondary-dark" : "bg-surface-container text-neutral/60"
              }`}>
                {micActive ? "● Streaming to SLNG Nova 3" : "Microphone Idle"}
              </span>
            </div>

            {/* Waveform Animation */}
            <div className="h-24 bg-surface-container-low rounded-xl p-4 flex flex-col items-center justify-center border border-border/70">
              <WaveformVisualizer active={micActive || demoActive} bars={28} color="#6258E8" />
              <span className="text-[11px] text-neutral/50 mt-2 font-mono">
                {micActive ? "16kHz Linear PCM · Full Duplex" : "Click 'Start Mic' to begin speech input"}
              </span>
            </div>

            {/* Microphone controls */}
            <div className="space-y-3">
              <button
                onClick={toggleMic}
                disabled={micStatus === "requesting"}
                className={`w-full py-3 px-4 rounded-xl text-label-md font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  micActive
                    ? "bg-error/15 text-error border border-error/30 hover:bg-error/25"
                    : "bg-primary text-white hover:bg-primary-dark shadow-sm"
                }`}
              >
                <span>{micActive ? "🔇 Pause Mic" : micStatus === "requesting" ? "Connecting speech recognition…" : "🎙️ Start Mic Stream"}</span>
              </button>

              <button
                onClick={simulateDemoSpeech}
                disabled={demoActive}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-surface-container text-neutral hover:bg-surface-container-high border border-border transition-all flex items-center justify-center gap-2"
              >
                <span>⚡</span>
                <span>{demoActive ? "Simulating Voice Input…" : "Simulate Lecture Speech (Test Demo)"}</span>
              </button>
            </div>

            {micError && (
              <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-xs text-error">
                {micError}
              </div>
            )}
          </div>

          {/* Guidelines Mini Card */}
          <div className="card p-5 bg-white space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral/60">Live Studio Guidance</h4>
            <ul className="text-body-sm text-neutral/70 space-y-2 text-xs">
              <li className="flex items-start gap-2">
                <span className="text-secondary font-bold">✓</span>
                <span>Speak naturally. SLNG Nova 3 automatically segments thoughts and punctuate sentences.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-secondary font-bold">✓</span>
                <span>When done, click <strong>End Session & Distill</strong>. Groq analysis will synthesize the knowledge canvas automatically.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column: Live Transcript Panel (2 cols) */}
        <div className="lg:col-span-2 card bg-white flex flex-col overflow-hidden h-[calc(100vh-140px)]">
          <div className="card-header justify-between bg-surface-container-low/40">
            <div className="flex items-center gap-2">
              <span className="text-base">📜</span>
              <h3 className="font-semibold text-title-md text-neutral">Real-Time Transcription</h3>
            </div>
            <div className="flex items-center gap-2 text-xs text-neutral/50">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              <span>SLNG Nova 3 English STT</span>
            </div>
          </div>

          <div className="flex-1 overflow-hidden p-2">
            <LiveTranscriptPanel lines={lines} />
          </div>
        </div>
      </div>
    </div>
  );
}
