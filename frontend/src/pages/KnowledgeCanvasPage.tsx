// pages/KnowledgeCanvasPage.tsx — Screen 5: Interactive Knowledge Canvas
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api, type Session, type CanvasCard, type TranscriptSegment } from "../api/client";
import { KnowledgeCard } from "../components/KnowledgeCard";
import { CompanionPanel } from "../components/CompanionPanel";

export function KnowledgeCanvasPage() {
  const { id } = useParams<{ id: string }>();

  const [session, setSession] = useState<Session | null>(null);
  const [cards, setCards] = useState<CanvasCard[]>([]);
  const [transcript, setTranscript] = useState<{ segments: TranscriptSegment[]; full_text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [isCompanionOpen, setIsCompanionOpen] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchAll = async () => {
      try {
        setLoading(true);
        const [sData, cData, tData] = await Promise.all([
          api.getSession(id),
          api.getCanvas(id).catch(() => ({ cards: [] })),
          api.getTranscript(id).catch(() => ({ segments: [], full_text: "" })),
        ]);
        setSession(sData);
        setCards(cData.cards);
        setTranscript(tData);
      } catch (err) {
        console.error("Failed to load canvas data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [id]);

  const handleExportMarkdown = () => {
    if (!session) return;

    let md = `# ${session.title}\n`;
    md += `**Mode:** ${session.mode} | **Date:** ${new Date(session.created_at).toLocaleString()}\n\n---\n\n`;

    for (const card of cards) {
      md += `## ${card.card_type.toUpperCase()}\n`;
      md += "```json\n" + JSON.stringify(card.content, null, 2) + "\n```\n\n";
    }

    if (transcript && transcript.full_text) {
      md += `## VERBATIM TRANSCRIPT\n\n${transcript.full_text}\n`;
    }

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${session.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}-canvas.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredCards = cards.filter((c) => {
    if (activeTab === "all") return true;
    if (activeTab === "summary" && (c.card_type === "summary" || c.card_type === "objectives")) return true;
    if (activeTab === "concepts" && c.card_type === "concepts") return true;
    if (activeTab === "moments" && c.card_type === "key_moments") return true;
    if (activeTab === "quiz" && c.card_type === "questions") return true;
    if (activeTab === "insights" && (c.card_type === "insights" || c.card_type === "stats")) return true;
    return false;
  });

  return (
    <div className="min-h-screen bg-surface pb-24">
      {/* Canvas Top Bar */}
      <header className="bg-white border-b border-border sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Link to="/" className="text-xs font-semibold text-neutral/50 hover:text-primary transition-colors">
                ← Workspace
              </Link>
              <span className="text-neutral/30">•</span>
              <span className="badge-mode badge-lesson text-[10px]">
                {session?.mode || "Lesson"}
              </span>
              <span className="text-xs text-neutral/40 font-mono">
                {cards.length} Knowledge Cards
              </span>
            </div>
            <h1 className="text-headline-sm font-bold text-neutral tracking-tight">
              {session?.title || "Interactive Knowledge Canvas"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportMarkdown}
              className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Export Markdown</span>
            </button>

            {/* Talk to Tatva Main Trigger */}
            <button
              onClick={() => setIsCompanionOpen(true)}
              className="btn-pill py-2 px-5 text-label-md flex items-center gap-2 shadow-level-2 hover:shadow-level-3"
            >
              <span className="text-base">🎙️</span>
              <span>Talk to Tatva</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Filter Tabs */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-border px-6 sticky top-[73px] z-20">
        <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto py-2">
          {[
            { id: "all", label: `All Cards (${cards.length})` },
            { id: "summary", label: "Summary & Objectives" },
            { id: "concepts", label: "Key Concepts" },
            { id: "moments", label: "Breakthrough Moments" },
            { id: "quiz", label: "Retention Quiz" },
            { id: "insights", label: "AI Insights & Stats" },
            { id: "transcript", label: "Verbatim Transcript" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-label-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-primary text-white font-semibold shadow-sm"
                  : "text-neutral/60 hover:text-neutral hover:bg-surface-container"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Canvas Body Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="card p-8 bg-white border border-border space-y-4">
                <div className="h-6 w-1/3 skeleton rounded" />
                <div className="h-20 w-full skeleton rounded" />
              </div>
            ))}
          </div>
        ) : activeTab === "transcript" ? (
          /* Full Transcript Tab */
          <div className="card p-6 bg-white border border-border space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="font-bold text-title-md text-neutral">Verbatim Spoken Transcript</h3>
                <p className="text-xs text-neutral/50">Captured live via SLNG Nova 3 Speech-to-Text WebSocket</p>
              </div>
              <span className="text-xs font-mono text-neutral/60">
                {transcript?.segments?.length ?? 0} segments recorded
              </span>
            </div>

            <div className="space-y-3 divide-y divide-border/40">
              {transcript?.segments && transcript.segments.length > 0 ? (
                transcript.segments.map((seg, i) => (
                  <div key={i} className="pt-3 flex items-start gap-4 text-body-sm">
                    <span className="text-xs font-bold font-mono text-primary uppercase min-w-[70px]">
                      {seg.speaker || "Speaker"}
                    </span>
                    <p className="text-neutral leading-relaxed flex-1">{seg.text}</p>
                  </div>
                ))
              ) : (
                <p className="text-neutral/50 text-body-sm py-4">No transcript segments recorded for this session.</p>
              )}
            </div>
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="card p-12 bg-white text-center max-w-md mx-auto space-y-3">
            <span className="text-3xl">🧩</span>
            <h3 className="font-bold text-headline-sm text-neutral">No Cards Found</h3>
            <p className="text-body-sm text-neutral/60">
              No synthesized cards match this filter. Select "All Cards" or trigger analysis.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredCards.map((card, idx) => (
              <KnowledgeCard key={card.card_type} card={card} index={idx} />
            ))}
          </div>
        )}
      </main>

      {/* Floating Action Button for Voice Companion */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsCompanionOpen(true)}
          className="btn-pill py-3 px-6 shadow-2xl flex items-center gap-3 text-label-md bg-secondary hover:bg-secondary-dark transform hover:-translate-y-0.5 transition-all cursor-pointer group"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
          </span>
          <span className="font-bold">Talk to Tatva Voice AI</span>
        </button>
      </div>

      {/* Companion Drawer */}
      <CompanionPanel
        sessionId={id || ""}
        sessionTitle={session?.title || "Tatva Session"}
        isOpen={isCompanionOpen}
        onClose={() => setIsCompanionOpen(false)}
      />
    </div>
  );
}
