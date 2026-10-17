"""
stt_relay.py — WebSocket relay from browser → SLNG Nova 3 STT.

Flow:
  Browser mic audio (PCM16 / webm-opus) → WS /ws/sessions/{id}/audio
  → This relay → SLNG STT WebSocket (wss://stt.slng.ai/...)
  → final_transcript events → SSE /api/sessions/{id}/stream (browser reads)

The SLNG API key never reaches the browser.
"""
import asyncio
import json
import os
import logging
from datetime import datetime, timezone

import websockets
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import StreamingResponse
import aiosqlite

from database import get_db, DB_PATH

logger = logging.getLogger(__name__)
router = APIRouter(tags=["stt"])

SLNG_API_KEY = os.environ.get("SLNG_API_KEY", "")

# Official SLNG bridge protocol: init, binary PCM, finalize/close.
SLNG_STT_WS_URL = "wss://in.api.slng.ai/v1/bridges/unmute/stt/deepgram/nova:3"

# SSE queues keyed by session_id  (session_id → asyncio.Queue)
_sse_queues: dict[str, asyncio.Queue] = {}


def _get_queue(session_id: str) -> asyncio.Queue:
    if session_id not in _sse_queues:
        _sse_queues[session_id] = asyncio.Queue(maxsize=500)
    return _sse_queues[session_id]


def _clear_queue(session_id: str):
    _sse_queues.pop(session_id, None)


# ── SSE stream (browser reads this) ───────────────────────────────────────────

@router.get("/api/sessions/{session_id}/stream")
async def transcript_stream(session_id: str):
    """
    Server-Sent Events endpoint. Browser connects here to receive live
    transcript segments from SLNG STT.
    """
    queue = _get_queue(session_id)

    async def event_generator():
        try:
            while True:
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=30.0)
                except asyncio.TimeoutError:
                    # heartbeat to keep connection alive
                    yield "event: ping\ndata: {}\n\n"
                    continue

                if event is None:
                    # sentinel — session ended
                    yield "event: session_ended\ndata: {}\n\n"
                    break

                yield f"event: transcript\ndata: {json.dumps(event)}\n\n"
        except asyncio.CancelledError:
            pass

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


# ── WebSocket: browser audio → SLNG STT ───────────────────────────────────────

@router.websocket("/ws/sessions/{session_id}/audio")
async def audio_relay(ws: WebSocket, session_id: str):
    """
    Browser sends raw audio bytes (linear16 PCM, 16kHz, mono).
    This relay forwards them to SLNG, receives transcript frames,
    and pushes finals to the SSE queue and to the DB.
    """
    await ws.accept()
    queue = _get_queue(session_id)

    slng_key = os.environ.get("SLNG_API_KEY") or SLNG_API_KEY
    if not slng_key:
        await ws.send_text(json.dumps({"error": "SLNG_API_KEY not configured"}))
        await ws.close()
        return

    logger.info(f"[STT] Starting relay for session {session_id}")

    headers = {"Authorization": f"Bearer {slng_key}"}

    try:
        async with websockets.connect(SLNG_STT_WS_URL, additional_headers=headers) as slng_ws:
            await slng_ws.send(json.dumps({"type": "init", "config": {
                "language": "en", "sample_rate": 16000, "encoding": "linear16",
                "enable_partial_transcripts": True,
            }}))
            await ws.send_text(json.dumps({"type": "ready"}))

            async def forward_audio():
                """Read audio from browser WebSocket, send to SLNG."""
                try:
                    while True:
                        data = await ws.receive_bytes()
                        await slng_ws.send(data)
                except WebSocketDisconnect:
                    logger.info(f"[STT] Browser disconnected for session {session_id}")
                except Exception as e:
                    logger.warning(f"[STT] Forward audio error: {e}")
                finally:
                    # Signal SLNG that we're done sending
                    try:
                        await slng_ws.send(json.dumps({"type": "finalize"}))
                        await slng_ws.send(json.dumps({"type": "close"}))
                    except Exception:
                        pass

            async def receive_transcripts():
                """Read transcript frames from SLNG, push finals to SSE queue + DB."""
                async with aiosqlite.connect(DB_PATH) as db:
                    async for raw in slng_ws:
                        try:
                            msg = json.loads(raw)
                        except (json.JSONDecodeError, TypeError):
                            continue

                        msg_type = msg.get("type", "")

                        if msg_type in ("partial_transcript", "final_transcript"):
                            text = msg.get("transcript") or msg.get("text") or ""
                            if not text:
                                continue
                            event = {"text": text, "is_final": msg_type == "final_transcript",
                                     "speaker": msg.get("speaker"), "start_ms": None, "end_ms": None}
                            await queue.put(event)
                            if event["is_final"]:
                                await db.execute(
                                    "INSERT INTO transcript_segments (session_id, speaker, text, is_final, created_at) VALUES (?, ?, ?, 1, ?)",
                                    (session_id, event["speaker"], text, datetime.now(timezone.utc).isoformat()),
                                )
                                await db.commit()
                        elif msg_type in ("Results", ""):
                            # Deepgram frame structure
                            channel = msg.get("channel", {})
                            alts = channel.get("alternatives", [{}])
                            transcript = alts[0].get("transcript", "").strip()
                            is_final = msg.get("is_final", False)
                            speech_final = msg.get("speech_final", False)

                            if not transcript:
                                continue

                            logger.info(f"[STT] Emitting transcript: '{transcript}' (final={is_final or speech_final})")

                            # Diarization: words carry speaker info
                            speaker = None
                            words = alts[0].get("words", [])
                            if words:
                                speaker_nums = [w.get("speaker") for w in words if w.get("speaker") is not None]
                                if speaker_nums:
                                    # Most common speaker in this segment
                                    speaker = f"Speaker {max(set(speaker_nums), key=speaker_nums.count) + 1}"

                            start_ms = int(msg.get("start", 0) * 1000)
                            duration = msg.get("duration", 0)
                            end_ms = int((msg.get("start", 0) + duration) * 1000)

                            event = {
                                "text": transcript,
                                "is_final": is_final or speech_final,
                                "speaker": speaker,
                                "start_ms": start_ms,
                                "end_ms": end_ms,
                            }

                            # Push to SSE (partials + finals for live display)
                            await queue.put(event)

                            # Persist only finals to DB
                            if is_final or speech_final:
                                now = datetime.now(timezone.utc).isoformat()
                                await db.execute(
                                    """INSERT INTO transcript_segments
                                       (session_id, speaker, text, start_ms, end_ms, is_final, created_at)
                                       VALUES (?, ?, ?, ?, ?, 1, ?)""",
                                    (session_id, speaker, transcript, start_ms, end_ms, now),
                                )
                                await db.commit()

                        elif msg_type == "Metadata":
                            logger.info(f"[STT] SLNG metadata: {msg}")
                        elif msg_type in ("Error", "error"):
                            logger.error(f"[STT] SLNG error: {msg}")
                            raise RuntimeError(msg.get("message", "STT error"))

            # Run both concurrently
            tasks = [asyncio.create_task(forward_audio()), asyncio.create_task(receive_transcripts())]
            try:
                done, pending = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
                for task in done:
                    task.result()
                # Allow the upstream to flush the final transcript on browser stop.
                if tasks[0] in done and tasks[1] in pending:
                    await asyncio.wait_for(tasks[1], timeout=5)
            finally:
                for task in tasks:
                    if not task.done():
                        task.cancel()
                await asyncio.gather(*tasks, return_exceptions=True)

    except websockets.exceptions.InvalidStatus as e:
        logger.error(f"[STT] SLNG connection failed: {e}")
        await ws.send_text(json.dumps({"error": f"SLNG STT connection failed: {e}"}))
    except Exception as e:
        logger.error(f"[STT] Relay error: {e}")
        try:
            await ws.send_text(json.dumps({"error": f"Speech recognition failed: {e}"}))
        except Exception:
            pass
    finally:
        # Signal SSE consumers that the session audio is done
        # Keep transcript SSE open so microphone pause/retry works.
        logger.info(f"[STT] Relay ended for session {session_id}")
        try:
            await ws.close()
        except Exception:
            pass
