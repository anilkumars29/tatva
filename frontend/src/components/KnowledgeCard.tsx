// components/KnowledgeCard.tsx
import { useState } from "react";
import type { CanvasCard } from "../api/client";

interface Props {
  card: CanvasCard;
  index?: number;
}

export function KnowledgeCard({ card }: Props) {
  const [copied, setCopied] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [revealedAnswers, setRevealedAnswers] = useState<Record<number, boolean>>({});

  const type = card.card_type;
  const content = card.content as any;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(content, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getHeaderMeta = () => {
    switch (type) {
      case "summary":
        return {
          title: "Executive Synthesis & Summary",
          badge: "Essential",
          badgeColor: "bg-primary/10 text-primary-dark",
          icon: "⚡",
        };
      case "objectives":
        return {
          title: "Learning Objectives & Outcomes",
          badge: "Curriculum",
          badgeColor: "bg-secondary/15 text-secondary-dark",
          icon: "🎯",
        };
      case "concepts":
        return {
          title: "Key Concepts & Core Definitions",
          badge: `${content.concepts?.length ?? 0} Concepts`,
          badgeColor: "bg-primary/10 text-primary-dark",
          icon: "💡",
        };
      case "key_moments":
        return {
          title: "Key Moments & Breakthroughs",
          badge: "Timeline",
          badgeColor: "bg-tertiary-container text-tertiary-dark",
          icon: "⏱️",
        };
      case "questions":
        return {
          title: "Retention Quiz & Knowledge Check",
          badge: `${content.questions?.length ?? 0} Questions`,
          badgeColor: "bg-secondary/15 text-secondary-dark",
          icon: "📝",
        };
      case "stats":
        return {
          title: "Session Metrics & Speaking Dynamics",
          badge: "Telemetry",
          badgeColor: "bg-neutral/10 text-neutral",
          icon: "📊",
        };
      case "insights":
        return {
          title: "AI Synthesis & Strategic Recommendations",
          badge: "Intelligence",
          badgeColor: "bg-primary/10 text-primary-dark",
          icon: "🧠",
        };
      default:
        return {
          title: type.replace("_", " ").toUpperCase(),
          badge: "Artifact",
          badgeColor: "bg-surface-container text-neutral",
          icon: "📄",
        };
    }
  };

  const meta = getHeaderMeta();

  return (
    <div className="card overflow-hidden transition-all duration-200 hover:shadow-level-3">
      {/* Card Header */}
      <div className="card-header justify-between bg-white">
        <div className="flex items-center gap-3">
          <span className="text-xl">{meta.icon}</span>
          <div>
            <h3 className="font-semibold text-title-md text-neutral">{meta.title}</h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full ${meta.badgeColor}`}>
            {meta.badge}
          </span>
          <button
            onClick={handleCopy}
            title="Copy card JSON"
            className="p-1.5 rounded text-neutral/50 hover:text-neutral hover:bg-surface-container-low transition-colors"
          >
            {copied ? (
              <span className="text-secondary text-xs font-semibold">✓ Copied</span>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-6 bg-white space-y-4">
        {/* SUMMARY */}
        {type === "summary" && (
          <div className="space-y-4">
            {content.headline && (
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1">Headline Takeaway</p>
                <p className="text-headline-sm font-semibold text-neutral">{content.headline}</p>
              </div>
            )}
            {content.overview && (
              <div className="text-body-md text-neutral/90 leading-relaxed whitespace-pre-line">
                {content.overview}
              </div>
            )}
            {content.key_takeaway && (
              <div className="p-3.5 rounded-lg bg-tertiary-container/40 border border-tertiary/30 flex items-start gap-3">
                <span className="text-tertiary-dark text-lg">💡</span>
                <div>
                  <span className="text-xs font-bold text-tertiary-dark uppercase tracking-wide block">Core Takeaway</span>
                  <p className="text-body-sm font-medium text-neutral">{content.key_takeaway}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* OBJECTIVES */}
        {type === "objectives" && (
          <div className="space-y-4">
            {content.learning_objectives && (
              <div className="space-y-2.5">
                <p className="text-xs font-bold uppercase tracking-wider text-neutral/50">Covered Objectives</p>
                <div className="space-y-2">
                  {content.learning_objectives.map((obj: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-surface-container-low border border-border/80">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 ${
                        obj.covered ? "bg-secondary text-white" : "bg-neutral/20 text-neutral"
                      }`}>
                        {obj.covered ? "✓" : "○"}
                      </span>
                      <div className="flex-1">
                        <p className="text-body-md font-medium text-neutral">{obj.objective}</p>
                        {obj.confidence && (
                          <span className="text-[11px] font-semibold text-neutral/50 uppercase tracking-wider">
                            Confidence: {obj.confidence}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {content.prerequisite_knowledge && content.prerequisite_knowledge.length > 0 && (
              <div className="pt-2">
                <p className="text-xs font-bold uppercase tracking-wider text-neutral/50 mb-2">Prerequisites</p>
                <div className="flex flex-wrap gap-2">
                  {content.prerequisite_knowledge.map((pre: string, i: number) => (
                    <span key={i} className="px-2.5 py-1 rounded-md bg-surface-container text-body-sm text-neutral/80">
                      {pre}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {content.outcomes && (
              <div className="p-3.5 rounded-lg bg-secondary/5 border border-secondary/20">
                <p className="text-xs font-bold text-secondary-dark uppercase tracking-wide mb-1">Expected Outcome</p>
                <p className="text-body-sm text-neutral/90">{content.outcomes}</p>
              </div>
            )}
          </div>
        )}

        {/* CONCEPTS */}
        {type === "concepts" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {content.concepts?.map((c: any, i: number) => (
              <div key={i} className="p-4 rounded-xl border border-border bg-surface-container-low/40 space-y-2.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-title-md text-primary-dark">{c.term}</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">#{i + 1}</span>
                  </div>
                  <p className="text-body-sm text-neutral leading-relaxed">{c.definition}</p>
                </div>

                <div className="space-y-2 pt-2 border-t border-border/60">
                  {c.examples && c.examples.length > 0 && (
                    <div>
                      <span className="text-[11px] font-bold uppercase text-neutral/50 block mb-1">Examples</span>
                      <div className="flex flex-wrap gap-1.5">
                        {c.examples.map((ex: string, j: number) => (
                          <span key={j} className="text-xs bg-white px-2 py-0.5 rounded border border-border text-neutral/80">
                            {ex}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {c.importance && (
                    <p className="text-xs text-neutral/70 italic">
                      <span className="font-semibold text-neutral/90 not-italic">Why it matters: </span>
                      {c.importance}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* KEY MOMENTS */}
        {type === "key_moments" && (
          <div className="space-y-3">
            {content.moments?.map((m: any, i: number) => {
              const typeColors: Record<string, string> = {
                insight: "bg-primary/10 text-primary-dark border-primary/20",
                definition: "bg-secondary/10 text-secondary-dark border-secondary/20",
                question: "bg-tertiary-container text-tertiary-dark border-tertiary/30",
                turning_point: "bg-error/10 text-error border-error/20",
                example: "bg-surface-container text-neutral border-border",
              };
              const colorClass = typeColors[m.type] ?? "bg-surface-container text-neutral border-border";

              return (
                <div key={i} className="p-4 rounded-xl border border-border bg-white flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center font-bold text-xs text-neutral/70 shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-semibold text-title-md text-neutral">{m.label}</h4>
                      <div className="flex items-center gap-2">
                        {m.approximate_time_label && (
                          <span className="text-xs text-neutral/50 font-mono">{m.approximate_time_label}</span>
                        )}
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${colorClass}`}>
                          {m.type}
                        </span>
                      </div>
                    </div>
                    <p className="text-body-sm text-neutral/80">{m.description}</p>
                    {m.significance && (
                      <p className="text-xs text-neutral/60 italic pt-1">Significance: {m.significance}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* QUESTIONS / QUIZ */}
        {type === "questions" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral/50">
                Interactive Knowledge Verification
              </span>
              {content.difficulty && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-surface-container text-neutral/80 uppercase">
                  Level: {content.difficulty}
                </span>
              )}
            </div>

            <div className="space-y-4">
              {content.questions?.map((q: any, i: number) => {
                const userAns = selectedAnswers[i];
                const isRevealed = revealedAnswers[i];
                const isCorrect = userAns && userAns.toLowerCase().trim().startsWith(q.correct_answer?.toLowerCase().trim().slice(0, 1) || "");

                return (
                  <div key={i} className="p-4 rounded-xl border border-border bg-surface-container-low/30 space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        Q{i + 1}
                      </span>
                      <p className="font-semibold text-body-md text-neutral flex-1">{q.question}</p>
                    </div>

                    {/* Multiple Choice Options */}
                    {q.options && q.options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-9">
                        {q.options.map((opt: string, optIdx: number) => {
                          const isOptionSelected = userAns === opt;
                          return (
                            <button
                              key={optIdx}
                              onClick={() => setSelectedAnswers((prev) => ({ ...prev, [i]: opt }))}
                              className={`p-2.5 text-left rounded-lg text-body-sm font-medium border transition-all ${
                                isOptionSelected
                                  ? "border-primary bg-primary text-white font-semibold"
                                  : "border-border bg-white text-neutral hover:border-primary/40"
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <div className="pl-9 pt-1 flex items-center justify-between gap-3">
                      <button
                        onClick={() => setRevealedAnswers((prev) => ({ ...prev, [i]: !prev[i] }))}
                        className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                      >
                        {isRevealed ? "Hide Answer" : "Show Correct Answer & Explanation"}
                      </button>

                      {userAns && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          isCorrect ? "bg-secondary/15 text-secondary-dark" : "bg-error/10 text-error"
                        }`}>
                          {isCorrect ? "✓ Answer Checked" : "Selected"}
                        </span>
                      )}
                    </div>

                    {isRevealed && (
                      <div className="pl-9 pt-2 text-xs space-y-1 bg-white p-3 rounded-lg border border-border">
                        <p className="font-bold text-secondary-dark">
                          Correct Answer: <span className="font-mono">{q.correct_answer}</span>
                        </p>
                        {q.explanation && (
                          <p className="text-neutral/80">{q.explanation}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STATS */}
        {type === "stats" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-surface-container-low border border-border text-center">
                <span className="text-headline-md font-bold text-primary block">{content.word_count ?? "—"}</span>
                <span className="text-xs text-neutral/60 font-medium">Spoken Words</span>
              </div>
              <div className="p-3.5 rounded-xl bg-surface-container-low border border-border text-center">
                <span className="text-headline-md font-bold text-secondary block">
                  {content.estimated_speaking_time_min ? `${content.estimated_speaking_time_min}m` : "—"}
                </span>
                <span className="text-xs text-neutral/60 font-medium">Est. Duration</span>
              </div>
              <div className="p-3.5 rounded-xl bg-surface-container-low border border-border text-center">
                <span className="text-headline-md font-bold text-tertiary-dark block">
                  {content.topics_covered ?? "—"}
                </span>
                <span className="text-xs text-neutral/60 font-medium">Topics Covered</span>
              </div>
              <div className="p-3.5 rounded-xl bg-surface-container-low border border-border text-center">
                <span className="text-headline-md font-bold text-neutral block uppercase text-title-md pt-1.5">
                  {content.content_density ?? "Normal"}
                </span>
                <span className="text-xs text-neutral/60 font-medium">Content Density</span>
              </div>
            </div>

            {content.disclaimer && (
              <p className="text-xs text-neutral/50 italic text-center">{content.disclaimer}</p>
            )}
          </div>
        )}

        {/* INSIGHTS */}
        {type === "insights" && (
          <div className="space-y-4">
            {content.ai_note && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-surface-container-low border border-primary/20">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">✨</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">Tatva AI Observation</span>
                </div>
                <p className="text-body-md font-medium text-neutral">{content.ai_note}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {content.strengths && (
                <div className="p-4 rounded-xl border border-secondary/30 bg-secondary/5 space-y-2">
                  <p className="text-xs font-bold text-secondary-dark uppercase tracking-wider">Session Strengths</p>
                  <ul className="space-y-1.5 text-body-sm text-neutral/90">
                    {content.strengths.map((str: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-secondary font-bold">✓</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {content.suggestions && (
                <div className="p-4 rounded-xl border border-tertiary/40 bg-tertiary-container/30 space-y-2">
                  <p className="text-xs font-bold text-tertiary-dark uppercase tracking-wider">Actionable Suggestions</p>
                  <ul className="space-y-1.5 text-body-sm text-neutral/90">
                    {content.suggestions.map((sug: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-tertiary-dark font-bold">→</span>
                        <span>{sug}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {content.follow_up_topics && content.follow_up_topics.length > 0 && (
              <div className="pt-2">
                <p className="text-xs font-bold uppercase tracking-wider text-neutral/50 mb-2">Recommended Next Topics</p>
                <div className="flex flex-wrap gap-2">
                  {content.follow_up_topics.map((top: string, i: number) => (
                    <span key={i} className="px-3 py-1 rounded-full bg-surface-container border border-border text-body-sm text-neutral font-medium">
                      🧭 {top}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
