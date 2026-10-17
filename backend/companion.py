"""
companion.py — Proxies SLNG web-session creation for the UNMUTE Voice Companion.

The browser never touches the SLNG API directly.
We inject session context (summary, concepts) as per-session arguments
that the UNMUTE agent uses via {{session_summary}}, {{key_concepts}} template vars.
"""
import json
import logging
import os

import aiosqlite
import httpx
from fastapi import APIRouter, HTTPException

from database import DB_PATH

router = APIRouter(tags=["companion"])
logger = logging.getLogger(__name__)

SLNG_API_KEY = os.environ.get("SLNG_API_KEY", "")
SLNG_AGENT_ID = os.environ.get("SLNG_AGENT_ID", "")
SLNG_AGENTS_BASE = "https://api.agents.slng.ai"


@router.post("/api/sessions/{session_id}/companion/session")
async def create_companion_session(session_id: str, participant_name: str = "learner"):
    """
    Create a SLNG web session for the Tatva Voice Companion.
    Injects session context so the companion can reference the actual session content.
    """
    slng_key = os.environ.get("SLNG_API_KEY") or SLNG_API_KEY
    agent_id = os.environ.get("SLNG_AGENT_ID") or SLNG_AGENT_ID
    if not slng_key:
        raise HTTPException(status_code=503, detail="SLNG_API_KEY not configured")
    if not agent_id:
        raise HTTPException(
            status_code=503,
            detail="SLNG_AGENT_ID not configured — deploy the UNMUTE companion first"
        )

    # Fetch session metadata
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM sessions WHERE id = ?", (session_id,)) as cur:
            session = await cur.fetchone()

        # Fetch summary card for context injection
        async with db.execute(
            "SELECT content FROM canvas_cards WHERE session_id = ? AND card_type = 'summary'",
            (session_id,),
        ) as cur:
            summary_row = await cur.fetchone()

        # Fetch concepts card
        async with db.execute(
            "SELECT content FROM canvas_cards WHERE session_id = ? AND card_type = 'concepts'",
            (session_id,),
        ) as cur:
            concepts_row = await cur.fetchone()

        # Fetch full transcript (condensed)
        async with db.execute(
            "SELECT speaker, text FROM transcript_segments WHERE session_id = ? ORDER BY id",
            (session_id,),
        ) as cur:
            tx_rows = await cur.fetchall()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Build context arguments (SLNG limit: 32 keys, 8192 chars total)
    session_summary = ""
    if summary_row:
        summary_data = json.loads(summary_row["content"])
        session_summary = summary_data.get("overview", summary_data.get("headline", ""))

    key_concepts = ""
    if concepts_row:
        concepts_data = json.loads(concepts_row["content"])
        concepts_list = concepts_data.get("concepts", [])
        key_concepts = "; ".join(
            f"{c['term']}: {c['definition']}" for c in concepts_list[:5]
        )

    # Build condensed transcript (max ~1500 chars)
    transcript_lines = [
        f"[{r['speaker'] or 'Speaker'}]: {r['text']}" for r in tx_rows
    ]
    full_tx = "\n".join(transcript_lines)
    condensed_tx = full_tx[:1500] + ("..." if len(full_tx) > 1500 else "")

    arguments = {
        "session_title": (session["title"] or "")[:200],
        "session_mode": session["mode"] or "lesson",
        "session_summary": session_summary[:800],
        "key_concepts": key_concepts[:600],
        "transcript_excerpt": condensed_tx,
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(
            f"{SLNG_AGENTS_BASE}/v1/agents/{agent_id}/web-sessions",
            headers={
                "Authorization": f"Bearer {slng_key}",
                "Content-Type": "application/json",
            },
            json={
                "arguments": arguments,
                "participant_name": participant_name,
            },
        )

    if not resp.is_success:
        logger.error(f"[Companion] SLNG error {resp.status_code}: {resp.text}")
        raise HTTPException(
            status_code=resp.status_code,
            detail=f"SLNG companion session failed: {resp.text}",
        )

    return resp.json()
