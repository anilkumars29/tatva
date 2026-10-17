import { useRef, useState, useCallback, useEffect } from "react";
import { api } from "../api/client";

export type AudioCaptureStatus = "idle" | "requesting" | "recording" | "error" | "stopped";
export function useAudioCapture(sessionId: string) {
  const [status, setStatus] = useState<AudioCaptureStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const generation = useRef(0);

  const release = useCallback(() => {
    generation.current++;
    processorRef.current?.disconnect();
    processorRef.current = null;
    void contextRef.current?.close();
    contextRef.current = null;
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    const ws = wsRef.current;
    wsRef.current = null;
    if (ws) {
      ws.onclose = null;
      ws.onerror = null;
      ws.onmessage = null;
      ws.close();
    }
  }, []);

  const start = useCallback(async () => {
    release();
    const attempt = generation.current;
    setStatus("requesting");
    setError(null);
    const fail = (message: string) => {
      if (generation.current !== attempt) return;
      release();
      setError(message);
      setStatus("error");
    };
    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio: {
        channelCount: 1, sampleRate: 16000, echoCancellation: true, noiseSuppression: true,
      }});
      if (generation.current !== attempt) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }
      streamRef.current = stream;
      const context = new AudioContext({sampleRate: 16000});
      contextRef.current = context;
      await context.resume();
      if (generation.current !== attempt) return;
      const ws = new WebSocket(api.audioWsUrl(sessionId));
      wsRef.current = ws;
      ws.binaryType = "arraybuffer";
      ws.onmessage = (message) => {
        if (generation.current !== attempt) return;
        try {
          const data = JSON.parse(message.data);
          if (data.error) { fail(data.error); return; }
          if (data.type !== "ready" || processorRef.current) return;
          const source = context.createMediaStreamSource(stream);
          const processor = context.createScriptProcessor(4096, 1, 1);
          processorRef.current = processor;
          processor.onaudioprocess = (event) => {
            if (ws.readyState !== WebSocket.OPEN) return;
            const samples = event.inputBuffer.getChannelData(0);
            const pcm = new Int16Array(samples.length);
            for (let i = 0; i < samples.length; i++) {
              pcm[i] = Math.max(-32768, Math.min(32767, Math.round(samples[i] * 32767)));
            }
            ws.send(pcm.buffer);
          };
          source.connect(processor);
          processor.connect(context.destination);
          setStatus("recording");
        } catch { fail("Invalid response from the speech recognition relay."); }
      };
      ws.onerror = () => fail("Cannot connect to speech recognition. Check the backend and retry.");
      ws.onclose = () => fail("Speech recognition disconnected. Start the microphone again to retry.");
    } catch (err) {
      fail(err instanceof Error ? err.message : "Microphone access failed.");
    }
  }, [sessionId, release]);

  const stop = useCallback(() => { release(); setStatus("stopped"); }, [release]);
  useEffect(() => release, [release, sessionId]);
  return {status, error, start, stop};
}
