// components/LiveTranscriptPanel.tsx
import { useEffect, useRef } from "react";
import type { TranscriptLine } from "../hooks/useSLNGTranscript";

interface Props {
  lines: TranscriptLine[];
}

const SPEAKER_COLORS = [
  "text-primary",
  "text-secondary-dark",
  "text-tertiary-dark",
  "text-neutral/70",
];

export function LiveTranscriptPanel({ lines }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-neutral/40">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <rect x="8" y="14" width="24" height="3" rx="1.5" fill="currentColor" opacity="0.3" />
          <rect x="8" y="20" width="18" height="3" rx="1.5" fill="currentColor" opacity="0.3" />
          <rect x="8" y="26" width="21" height="3" rx="1.5" fill="currentColor" opacity="0.3" />
        </svg>
        <p className="text-body-sm">Transcript will appear here…</p>
      </div>
    );
  }

  const speakerIndex: Record<string, number> = {};
  let nextIndex = 0;

  return (
    <div className="h-full overflow-y-auto px-4 py-3 flex flex-col gap-2">
      {lines.map((line) => {
        const sp = line.speaker ?? "Speaker";
        if (!(sp in speakerIndex)) {
          speakerIndex[sp] = nextIndex % SPEAKER_COLORS.length;
          nextIndex++;
        }
        const colorClass = SPEAKER_COLORS[speakerIndex[sp]];

        return (
          <div
            key={line.id}
            className={`animate-slide-up ${line.is_final ? "" : "opacity-60"}`}
          >
            {line.speaker && (
              <span className={`text-label-sm font-semibold uppercase tracking-wide ${colorClass} mr-2`}>
                {line.speaker}
              </span>
            )}
            <span className={`text-body-md text-neutral ${line.is_final ? "" : "italic"}`}>
              {line.text}
              {!line.is_final && (
                <span className="inline-block w-1 h-4 bg-primary ml-1 animate-pulse" />
              )}
            </span>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
