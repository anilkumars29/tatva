// components/ModeSelector.tsx
import React from "react";

export type ModeType = "lesson" | "speech" | "debate" | "discussion";

export interface ModeOption {
  id: ModeType;
  title: string;
  badge: string;
  tagline: string;
  description: string;
  icon: (color: string) => React.ReactNode;
}

export const MODES: ModeOption[] = [
  {
    id: "lesson",
    title: "Lesson & Lecture",
    badge: "Most Popular",
    tagline: "Structured educational capture",
    description: "Extracts core learning objectives, detailed concept definitions, real-world examples, and auto-generates test-your-knowledge quizzes.",
    icon: (c) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <line x1="9" y1="7" x2="15" y2="7" />
        <line x1="9" y1="11" x2="13" y2="11" />
      </svg>
    ),
  },
  {
    id: "speech",
    title: "Speech & Presentation",
    badge: "Public Speaking",
    tagline: "Rhetoric and delivery analysis",
    description: "Evaluates narrative pacing, persuasive clarity, emotional cadence, key takeaways, and suggestions to elevate your stage presence.",
    icon: (c) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="22" />
      </svg>
    ),
  },
  {
    id: "debate",
    title: "Debate & Argument",
    badge: "Multi-Speaker",
    tagline: "Logical clash and evidence mapping",
    description: "Maps claims vs. counterclaims, detects logical fallacies, identifies turning points, and scores argument strength across speakers.",
    icon: (c) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 11 18-5v12L3 13v-2z" />
        <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
      </svg>
    ),
  },
  {
    id: "discussion",
    title: "Roundtable Discussion",
    badge: "Collaborative",
    tagline: "Consensus and decision tracking",
    description: "Captures brainstorming sessions, tracks action items, maps consensus vs. divergent opinions, and distills high-leverage meeting decisions.",
    icon: (c) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

interface Props {
  selected: ModeType;
  onChange: (mode: ModeType) => void;
}

export function ModeSelector({ selected, onChange }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {MODES.map((m) => {
        const isSelected = selected === m.id;
        const color = isSelected ? "#6258E8" : "#20212B";

        return (
          <div
            key={m.id}
            onClick={() => onChange(m.id)}
            className={`cursor-pointer p-5 rounded-xl border-2 transition-all relative group ${
              isSelected
                ? "border-primary bg-primary/5 shadow-focus-primary"
                : "border-border bg-white hover:border-primary/40 hover:bg-surface-container-low/50"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                    isSelected ? "bg-primary text-white" : "bg-surface-container text-neutral"
                  }`}
                >
                  {m.icon(isSelected ? "#FFFFFF" : color)}
                </div>
                <div>
                  <h3 className="font-semibold text-title-md text-neutral">{m.title}</h3>
                  <p className="text-body-sm text-neutral/60">{m.tagline}</p>
                </div>
              </div>

              <span
                className={`text-[11px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full ${
                  isSelected
                    ? "bg-primary text-white"
                    : "bg-surface-container text-neutral/70"
                }`}
              >
                {m.badge}
              </span>
            </div>

            <p className="text-body-sm text-neutral/80 leading-relaxed">
              {m.description}
            </p>

            <div className="mt-4 flex items-center gap-1.5 text-label-sm font-medium">
              <span className={isSelected ? "text-primary font-semibold" : "text-neutral/40 group-hover:text-primary transition-colors"}>
                {isSelected ? "✓ Selected mode" : "Select this mode →"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
