// pages/DistillingPage.tsx — Screen 4: Distilling Insights
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, type CanvasCard } from "../api/client";
import { KnowledgeCard } from "../components/KnowledgeCard";

const TOTAL_CARDS = 7;
const CARD_LABELS: Record<string, string> = {
  summary: "Executive Summary & Core Takeaway",
  objectives: "Curriculum Objectives & Prerequisites",
  concepts: "Key Concepts & Term Definitions",
  key_moments: "Breakthrough Moments Timeline",
  questions: "Retention Quiz & Verification",
  stats: "Speaking Telemetry & Statistics",
  insights: "AI Observations & Recommendations",
};

export function DistillingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [cards, setCards] = useState<CanvasCard[]>([]);
  const [currentStep, setCurrentStep] = useState<string>("Initializing Groq Analysis Engine…");
  const [progressPercent, setProgressPercent] = useState<number>(10);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const sseUrl = api.analyseUrl(id);
    const es = new EventSource(sseUrl);
    const receivedCards = new Set<string>();
    const failedCards = new Set<string>();

    es.addEventListener("status", () => {
      setCurrentStep("Distilling transcript into structured intelligence…");
      setProgressPercent(15);
    });

    es.addEventListener("card_start", (e) => {
      const data = JSON.parse(e.data);
      const label = CARD_LABELS[data.card_type] || data.card_type;
      setCurrentStep(`Synthesizing: ${label}…`);
      const pct = Math.round(((data.index + 1) / TOTAL_CARDS) * 85);
      setProgressPercent(pct);
    });

    es.addEventListener("card_ready", (e) => {
      const data = JSON.parse(e.data);
      receivedCards.add(data.card_type);
      const newCard: CanvasCard = {
        card_type: data.card_type,
        content: data.content,
        created_at: new Date().toISOString(),
      };
      setCards((prev) => {
        // avoid duplicate cards
        if (prev.some((c) => c.card_type === data.card_type)) return prev;
        return [...prev, newCard];
      });
      const pct = Math.round(((data.index + 1) / TOTAL_CARDS) * 100);
      setProgressPercent(Math.min(95, pct));
    });

    es.addEventListener("card_error", (e) => {
      const data = JSON.parse(e.data);
      failedCards.add(data.card_type);
    });

    es.addEventListener("complete", (e) => {
      const data = JSON.parse(e.data);
      const succeeded = data.status === "complete" && !failedCards.size && receivedCards.size === TOTAL_CARDS;
      setProgressPercent(Math.round(receivedCards.size / TOTAL_CARDS * 100));
      setCurrentStep(succeeded ? "Knowledge synthesis complete!" : "Synthesis could not generate all cards.");
      setIsComplete(succeeded);
      if (!succeeded) {
        setError(`${receivedCards.size} of ${TOTAL_CARDS} cards generated. Check the backend model configuration and provider errors before retrying.`);
      }
      es.close();
    });

    es.addEventListener("error", (e) => {
      console.warn("SSE connection closed or completed:", e);
      setCurrentStep("Synthesis interrupted.");
      setProgressPercent(Math.round(receivedCards.size / TOTAL_CARDS * 100));
      setError(`Connection interrupted. ${receivedCards.size} of ${TOTAL_CARDS} cards generated. Any completed cards are available on the canvas.`);
      es.close();
    });

    return () => {
      es.close();
    };
  }, [id]);

  return (
    <div className="min-h-screen bg-surface py-12 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Top Distilling Indicator Header */}
        <div className="card p-8 bg-white border border-border shadow-level-2 text-center space-y-6">
          <div className="relative w-20 h-20 mx-auto">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-3xl animate-pulse">
              ✨
            </div>
            {!isComplete && !error && (
              <span className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            )}
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
              <span>{isComplete ? "✓ Synthesis Complete" : error ? "Synthesis Incomplete" : "● Live Knowledge Distillation"}</span>
            </div>
            <h1 className="text-headline-md font-bold text-neutral">
              {isComplete ? "Knowledge Canvas Synthesized!" : error ? "Synthesis Needs Attention" : "Tatva is Distilling Your Session"}
            </h1>
            <p className="text-body-md text-neutral/60 font-medium">
              {currentStep}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full max-w-md mx-auto space-y-2">
            <div className="w-full h-2.5 bg-surface-container rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary via-primary-light to-secondary transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-neutral/50 font-mono">
              <span>{cards.length} of {TOTAL_CARDS} cards ready</span>
              <span>{progressPercent}%</span>
            </div>
          </div>

          {/* CTA when done */}
          {isComplete && (
            <div className="pt-2 animate-fade-in">
              <button
                onClick={() => navigate(`/canvas/${id}`)}
                className="btn-primary py-3.5 px-8 rounded-full text-label-md font-bold shadow-level-2 cursor-pointer inline-flex items-center gap-2"
              >
                <span>Explore Full Knowledge Canvas</span>
                <span>→</span>
              </button>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-surface-container text-xs text-neutral/70 space-y-2">
              <p>{error}</p>
              <button
                onClick={() => navigate(`/canvas/${id}`)}
                className="btn-secondary text-xs py-1.5 px-4 mx-auto"
              >
                View Available Canvas Cards →
              </button>
            </div>
          )}
        </div>

        {/* Progressive Card Feed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-title-md font-bold text-neutral">
              Synthesized Knowledge Cards
            </h2>
            <span className="text-xs text-neutral/50">
              Streaming progressive cards live from Groq LLM
            </span>
          </div>

          {cards.length === 0 ? (
            <div className="card p-8 bg-white border border-border text-center space-y-4">
              <div className="h-6 w-48 skeleton mx-auto rounded" />
              <div className="h-16 w-full skeleton rounded" />
              <div className="h-10 w-3/4 skeleton mx-auto rounded" />
            </div>
          ) : (
            <div className="space-y-4">
              {cards.map((card, i) => (
                <div key={card.card_type} className="animate-slide-up">
                  <KnowledgeCard card={card} index={i} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
