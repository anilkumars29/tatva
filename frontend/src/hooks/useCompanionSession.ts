// hooks/useCompanionSession.ts
// Manages a LiveKit room connection for the UNMUTE Voice Companion.

import { useRef, useState, useCallback, useEffect } from "react";
import {
  Room,
  RoomEvent,
  createLocalAudioTrack,
  type LocalAudioTrack,
  type RemoteTrack,
} from "livekit-client";
import { api } from "../api/client";

const TRANSCRIPT_TOPIC = "slng.transcript.v1";

export interface CompanionMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export type CompanionStatus = "idle" | "connecting" | "active" | "ended" | "error";

export function useCompanionSession(sessionId: string | null) {
  const [status, setStatus] = useState<CompanionStatus>("idle");
  const [messages, setMessages] = useState<CompanionMessage[]>([]);
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roomRef = useRef<Room | null>(null);
  const micRef = useRef<LocalAudioTrack | null>(null);

  const attemptRef = useRef(0);
  const busyRef = useRef(false);
  const audioRef = useRef(new Map<RemoteTrack, HTMLAudioElement>());

  const cleanup = useCallback(() => {
    attemptRef.current++;
    busyRef.current = false;
    micRef.current?.stop();
    micRef.current = null;
    for (const [track, element] of audioRef.current) {
      track.detach(element);
      element.pause();
      element.remove();
    }
    audioRef.current.clear();
    const room = roomRef.current;
    roomRef.current = null;
    room?.removeAllListeners();
    if (room) void room.disconnect();
  }, []);

  const start = useCallback(async () => {
    if (!sessionId || busyRef.current) return;
    busyRef.current = true;
    const attempt = ++attemptRef.current;
    const current = () => attemptRef.current === attempt;
    setMuted(false);
    setStatus("connecting");
    setError(null);
    setMessages([]);

    try {
      const sessionData = await api.createCompanionSession(sessionId);

      if (!current()) return;
      const room = new Room({ adaptiveStream: true, dynacast: true });
      roomRef.current = room;

      // Play agent audio
      room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
        if (!current() || track.kind !== "audio" || audioRef.current.has(track)) return;
        const el = track.attach() as HTMLAudioElement;
        audioRef.current.set(track, el);
        el.autoplay = true;
        document.body.appendChild(el);
      });

      room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
        const element = audioRef.current.get(track);
        if (element) {
          track.detach(element);
          element.pause();
          element.remove();
          audioRef.current.delete(track);
        }
      });

      // Live transcript from companion
      room.on(RoomEvent.DataReceived, (payload: Uint8Array, _p: unknown, _k: unknown, topic?: string) => {
        if (!current() || topic !== TRANSCRIPT_TOPIC) return;
        try {
          const msg = JSON.parse(new TextDecoder().decode(payload));
          if (msg.type === "conversation_item_added" && msg.item) {
            const { id, role, content } = msg.item;
            const text = Array.isArray(content) ? content.join("\n") : String(content);
            setMessages((prev) =>
              prev.find((m) => m.id === id) ? prev : [...prev, { id, role, content: text }]
            );
          }
        } catch {
          // ignore malformed messages
        }
      });

      // Speaking indicator
      room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        if (!current()) return;
        const agentIs = speakers.some(
          (p) => p.identity !== room.localParticipant.identity
        );
        setAgentSpeaking(agentIs);
      });

      room.on(RoomEvent.Disconnected, () => {
        if (!current()) return;
        cleanup();
        setAgentSpeaking(false);
        setStatus("ended");
      });

      await room.connect(sessionData.livekit_url, sessionData.livekit_token);

      if (!current()) { await room.disconnect(); return; }
      const micTrack = await createLocalAudioTrack({echoCancellation: true, noiseSuppression: true});
      if (!current()) { micTrack.stop(); await room.disconnect(); return; }
      micRef.current = micTrack;
      await room.localParticipant.publishTrack(micTrack);

      if (!current()) return;
      setStatus("active");
    } catch (err) {
      if (!current()) return;
      cleanup();
      const msg = err instanceof Error ? err.message : "Failed to start companion";
      setError(msg);
      setStatus("error");
    }
  }, [sessionId, cleanup]);

  const toggleMute = useCallback(async () => {
    if (!micRef.current) return;
    if (muted) {
      await micRef.current.unmute();
    } else {
      await micRef.current.mute();
    }
    setMuted((m) => !m);
  }, [muted]);

  const disconnect = useCallback(async () => {
    cleanup();
    setStatus("ended");
    setAgentSpeaking(false);
    setMuted(false);
  }, [cleanup]);

  // Cancel in-flight setup as well as active audio on close, navigation or unmount.
  useEffect(() => {
    return cleanup;
  }, [sessionId, cleanup]);

  return {
    status, messages, agentSpeaking, muted, error,
    start, toggleMute, disconnect,
  };
}
