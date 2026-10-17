// hooks/useSLNGTranscript.ts
// Reads SSE transcript events from the backend and accumulates segments.

import { useEffect, useRef, useState, useCallback } from "react";
import { api } from "../api/client";

export interface TranscriptLine {
  id: string;
  text: string;
  speaker: string | null;
  is_final: boolean;
  start_ms: number | null;
  end_ms: number | null;
}

export function useSLNGTranscript(sessionId: string | null, active: boolean) {
  const [lines, setLines] = useState<TranscriptLine[]>([]);
  const [ended, setEnded] = useState(false);
  const esRef = useRef<EventSource | null>(null);
  const partialIdRef = useRef<string>("__partial__");

  const reset = useCallback(() => {
    setLines([]);
    setEnded(false);
  }, []);

  useEffect(() => {
    if (!sessionId || !active) return;

    const es = new EventSource(api.transcriptStreamUrl(sessionId));
    esRef.current = es;

    es.addEventListener("transcript", (e) => {
      const data = JSON.parse(e.data) as {
        text: string;
        is_final: boolean;
        speaker: string | null;
        start_ms: number | null;
        end_ms: number | null;
      };

      setLines((prev) => {
        if (data.is_final) {
          // Replace partial placeholder (if exists) with final segment
          const id = `final-${Date.now()}-${Math.random()}`;
          const withoutPartial = prev.filter((l) => l.id !== partialIdRef.current);
          return [...withoutPartial, { ...data, id }];
        } else {
          // Update rolling partial
          const existing = prev.find((l) => l.id === partialIdRef.current);
          if (existing) {
            return prev.map((l) =>
              l.id === partialIdRef.current ? { ...l, text: data.text } : l
            );
          }
          return [...prev, { ...data, id: partialIdRef.current }];
        }
      });
    });

    es.addEventListener("session_ended", () => {
      setEnded(true);
      es.close();
    });

    es.addEventListener("error", () => {
      // SSE will auto-reconnect; only close if session ended
      if (ended) es.close();
    });

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [sessionId, active]);

  return { lines, ended, reset };
}
