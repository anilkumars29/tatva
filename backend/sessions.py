"""
sessions.py — Session CRUD and transcript accumulation endpoints.
"""
import json
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
import aiosqlite

from database import get_db
from models import SessionCreate, SessionOut, TranscriptOut, TranscriptSegment

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _row_to_session(row: aiosqlite.Row) -> dict:
    d = dict(row)
    d["speakers"] = json.loads(d["speakers"]) if d.get("speakers") else None
    return d


# ── Create session ─────────────────────────────────────────────────────────────

@router.post("", response_model=SessionOut, status_code=201)
async def create_session(body: SessionCreate, db: aiosqlite.Connection = Depends(get_db)):
    session_id = str(uuid.uuid4())
    now = _now()
    speakers_json = json.dumps(body.speakers) if body.speakers else None
    await db.execute(
        """INSERT INTO sessions (id, title, mode, language, speakers, status, created_at)
           VALUES (?, ?, ?, ?, ?, 'recording', ?)""",
        (session_id, body.title, body.mode, body.language, speakers_json, now),
    )
    await db.commit()
    await db.close()
    return SessionOut(
        id=session_id,
        title=body.title,
        mode=body.mode,
        language=body.language,
        speakers=body.speakers,
        status="recording",
        created_at=now,
        ended_at=None,
        duration_s=None,
    )


# ── List sessions ──────────────────────────────────────────────────────────────

@router.get("", response_model=list[SessionOut])
async def list_sessions(db: aiosqlite.Connection = Depends(get_db)):
    async with db.execute(
        "SELECT * FROM sessions ORDER BY created_at DESC LIMIT 50"
    ) as cursor:
        rows = await cursor.fetchall()
    await db.close()
    return [SessionOut(**_row_to_session(r)) for r in rows]


# ── Get single session ─────────────────────────────────────────────────────────

@router.get("/{session_id}", response_model=SessionOut)
async def get_session(session_id: str, db: aiosqlite.Connection = Depends(get_db)):
    async with db.execute("SELECT * FROM sessions WHERE id = ?", (session_id,)) as cur:
        row = await cur.fetchone()
    await db.close()
    if not row:
        raise HTTPException(status_code=404, detail="Session not found")
    return SessionOut(**_row_to_session(row))


# ── End session ────────────────────────────────────────────────────────────────

@router.post("/{session_id}/end")
async def end_session(session_id: str, db: aiosqlite.Connection = Depends(get_db)):
    """
    Mark session ended. The caller (frontend) then connects to /api/sessions/{id}/analyse
    which is triggered separately. This is a clean separation so the UI can immediately
    navigate to the Distilling screen.
    """
    async with db.execute("SELECT * FROM sessions WHERE id = ?", (session_id,)) as cur:
        row = await cur.fetchone()
    if not row:
        await db.close()
        raise HTTPException(status_code=404, detail="Session not found")

    # Calculate duration
    created_at = datetime.fromisoformat(row["created_at"])
    ended_at = datetime.now(timezone.utc)
    duration_s = int((ended_at - created_at).total_seconds())

    await db.execute(
        "UPDATE sessions SET status = 'ended', ended_at = ?, duration_s = ? WHERE id = ?",
        (ended_at.isoformat(), duration_s, session_id),
    )
    await db.commit()
    await db.close()
    return {"session_id": session_id, "status": "ended", "duration_s": duration_s}


# ── Append transcript segment (called by STT relay) ───────────────────────────

@router.post("/{session_id}/transcript")
@router.post("/{session_id}/transcript-segment")
async def append_transcript(
    session_id: str,
    segment: TranscriptSegment,
    db: aiosqlite.Connection = Depends(get_db),
):
    now = _now()
    await db.execute(
        """INSERT INTO transcript_segments
           (session_id, speaker, text, start_ms, end_ms, is_final, created_at)
           VALUES (?, ?, ?, ?, ?, 1, ?)""",
        (session_id, segment.speaker, segment.text, segment.start_ms, segment.end_ms, now),
    )
    await db.commit()
    await db.close()

    try:
        from stt_relay import _get_queue
        queue = _get_queue(session_id)
        await queue.put({
            "text": segment.text,
            "is_final": True,
            "speaker": segment.speaker,
            "start_ms": segment.start_ms,
            "end_ms": segment.end_ms,
        })
    except Exception:
        pass

    return {"ok": True}


# ── Get full transcript ────────────────────────────────────────────────────────

@router.get("/{session_id}/transcript", response_model=TranscriptOut)
async def get_transcript(session_id: str, db: aiosqlite.Connection = Depends(get_db)):
    async with db.execute(
        "SELECT speaker, text, start_ms, end_ms FROM transcript_segments "
        "WHERE session_id = ? ORDER BY id ASC",
        (session_id,),
    ) as cur:
        rows = await cur.fetchall()
    await db.close()
    segments = [TranscriptSegment(**dict(r)) for r in rows]
    full_text = "\n".join(
        f"[{s.speaker or 'Speaker'}]: {s.text}" for s in segments
    )
    return TranscriptOut(session_id=session_id, segments=segments, full_text=full_text)
