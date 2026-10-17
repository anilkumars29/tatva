// api/client.ts — Typed fetch wrappers for the Tatva backend

const BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

export interface Session {
  id: string;
  title: string;
  mode: "lesson" | "speech" | "debate" | "discussion";
  language: string;
  speakers: string[] | null;
  status: "recording" | "ended" | "analysing" | "complete" | "error";
  created_at: string;
  ended_at: string | null;
  duration_s: number | null;
}

export interface TranscriptSegment {
  speaker: string | null;
  text: string;
  start_ms: number | null;
  end_ms: number | null;
}

export interface CanvasCard {
  card_type: string;
  content: Record<string, unknown>;
  created_at: string;
}

export interface CompanionSession {
  call_id: string;
  room_name: string;
  livekit_url: string;
  livekit_token: string;
  max_session_seconds: number;
  message: string;
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export const api = {
  // Sessions
  listSessions: () => req<Session[]>("/api/sessions"),
  getSession: (id: string) => req<Session>(`/api/sessions/${id}`),
  createSession: (body: { title: string; mode: string; language?: string; speakers?: string[] }) =>
    req<Session>("/api/sessions", { method: "POST", body: JSON.stringify(body) }),
  endSession: (id: string) =>
    req<{ session_id: string; status: string; duration_s: number }>(`/api/sessions/${id}/end`, {
      method: "POST",
    }),
  getCanvas: (id: string) =>
    req<{ session_id: string; cards: CanvasCard[] }>(`/api/sessions/${id}/canvas`),
  getTranscript: (id: string) =>
    req<{ session_id: string; segments: TranscriptSegment[]; full_text: string }>(
      `/api/sessions/${id}/transcript`
    ),
  appendTranscript: (id: string, segment: { speaker?: string | null; text: string; start_ms?: number | null; end_ms?: number | null }) =>
    req<{ ok: boolean }>(`/api/sessions/${id}/transcript`, {
      method: "POST",
      body: JSON.stringify(segment),
    }),

  // Companion
  createCompanionSession: (sessionId: string, participantName?: string) =>
    req<CompanionSession>(
      `/api/sessions/${sessionId}/companion/session?participant_name=${encodeURIComponent(participantName ?? "learner")}`,
      { method: "POST" }
    ),

  // Analysis SSE URL (used directly in EventSource)
  analyseUrl: (id: string) => `${BASE}/api/sessions/${id}/analyse`,

  // Transcript SSE URL
  transcriptStreamUrl: (id: string) => `${BASE}/api/sessions/${id}/stream`,

  // WebSocket URL for audio
  audioWsUrl: (id: string) => `${BASE.replace("http", "ws")}/ws/sessions/${id}/audio`,
};
