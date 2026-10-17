"""
analysis.py — Post-session Groq LLM analysis with progressive SSE card delivery.

The flagship behavior: session ends → analysis auto-starts → cards stream one by one
to the frontend without any user input.

Card order (Lesson mode):
  1. summary          — always first, fastest
  2. objectives       — learning objectives extracted
  3. concepts         — key concepts with explanations
  4. key_moments      — timestamped important moments
  5. questions        — quiz questions for review
  6. stats            — speaking statistics
  7. insights         — AI insights and suggestions
"""
import json
import logging
import os
from datetime import datetime, timezone
from typing import AsyncIterator

import aiosqlite
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from database import DB_PATH
from groq import AsyncGroq

router = APIRouter(tags=["analysis"])
logger = logging.getLogger(__name__)

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_MODEL = os.environ.get("GROQ_MODEL", "openai/gpt-oss-120b")

CARD_ORDER = ["summary", "objectives", "concepts", "key_moments", "questions", "stats", "insights"]


# ── Prompt templates ──────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are Tatva, an expert knowledge extraction AI specializing in analyzing spoken content.
You extract structured, accurate knowledge from transcripts.
Always respond with valid JSON only — no markdown fences, no explanation outside the JSON.
Base all claims strictly on what was actually said in the transcript.
If something cannot be determined from the transcript, say so explicitly rather than fabricating it."""


def _build_card_prompt(card_type: str, mode: str, transcript: str, title: str) -> str:
    base = f"""Analyze this {mode} session titled "{title}".

TRANSCRIPT:
{transcript[:12000]}  

{"[TRANSCRIPT TRUNCATED — above is first 12,000 characters]" if len(transcript) > 12000 else ""}

"""

    prompts = {
        "summary": base + """Return a JSON object with this exact structure:
{
  "headline": "One-sentence summary of the session",
  "overview": "2-3 paragraph narrative summary of what was covered",
  "session_type": "lesson",
  "key_takeaway": "The single most important thing from this session"
}""",

        "objectives": base + """Return a JSON object:
{
  "learning_objectives": [
    { "objective": "string", "covered": true/false, "confidence": "high/medium/low" }
  ],
  "prerequisite_knowledge": ["list of things a learner should already know"],
  "outcomes": "What a learner gains from this session"
}""",

        "concepts": base + """Return a JSON object:
{
  "concepts": [
    {
      "term": "concept name",
      "definition": "clear explanation from the session",
      "examples": ["examples mentioned in the session"],
      "importance": "why this concept matters"
    }
  ]
}""",

        "key_moments": base + """Return a JSON object:
{
  "moments": [
    {
      "label": "short name for this moment",
      "description": "what happened or was said",
      "significance": "why this moment matters",
      "type": "insight|question|example|turning_point|definition"
    }
  ]
}
Note: If timestamps are available in the transcript, include approximate_time_label (e.g. "~5 min in").""",

        "questions": base + """Return a JSON object with quiz questions to test understanding:
{
  "questions": [
    {
      "question": "the question text",
      "type": "multiple_choice|open_ended|true_false",
      "options": ["A", "B", "C", "D"],  // only for multiple_choice
      "correct_answer": "the answer or option letter",
      "explanation": "why this is correct, based on the session"
    }
  ],
  "difficulty": "beginner|intermediate|advanced"
}
Generate between 5 and 8 questions. Vary the types.""",

        "stats": base + """Return a JSON object with session statistics.
Only include stats that can be reasonably estimated from the transcript — do NOT fabricate precise numbers.
{
  "word_count": <integer, count words in transcript>,
  "estimated_speaking_time_min": <integer>,
  "topics_covered": <integer count of distinct topics>,
  "questions_asked_in_session": <integer>,
  "speakers_detected": <integer>,
  "content_density": "low|medium|high",
  "disclaimer": "Statistics are estimated from transcript text and may not reflect exact audio duration."
}""",

        "insights": base + """Return a JSON object with AI insights and suggestions:
{
  "strengths": ["what was done well in this session"],
  "suggestions": ["specific, actionable improvements"],
  "connections": ["how this content connects to broader topics or prior knowledge"],
  "follow_up_topics": ["topics worth exploring next"],
  "ai_note": "One honest observation about the session that might surprise or help the learner"
}""",
    }

    return prompts.get(card_type, base + f"Summarize the {card_type} aspect as JSON.")


# ── SSE analysis stream ────────────────────────────────────────────────────────

@router.get("/api/sessions/{session_id}/analyse")
async def analyse_session(session_id: str):
    """
    SSE endpoint. On connection, begins Groq analysis immediately and streams
    each knowledge card as it completes. The frontend navigates here right
    after End Session — no user prompt needed.
    """
    api_key = os.environ.get("GROQ_API_KEY") or GROQ_API_KEY
    if not api_key:
        raise HTTPException(status_code=503, detail="GROQ_API_KEY not configured")

    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM sessions WHERE id = ?", (session_id,)) as cur:
            session = await cur.fetchone()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        # Get transcript
        async with db.execute(
            "SELECT speaker, text FROM transcript_segments WHERE session_id = ? ORDER BY id",
            (session_id,),
        ) as cur:
            rows = await cur.fetchall()

    if not rows:
        raise HTTPException(status_code=422, detail="No transcript found — nothing to analyse")

    transcript = "\n".join(
        f"[{r['speaker'] or 'Speaker'}]: {r['text']}" for r in rows
    )
    mode = session["mode"]
    title = session["title"]

    async def card_stream() -> AsyncIterator[str]:
        client = AsyncGroq(api_key=api_key)

        # Mark session as analysing
        async with aiosqlite.connect(DB_PATH) as db:
            await db.execute(
                "UPDATE sessions SET status = 'analysing' WHERE id = ?", (session_id,)
            )
            await db.commit()

        yield f"event: status\ndata: {json.dumps({'status': 'analysing', 'total_cards': len(CARD_ORDER)})}\n\n"

        errors = []
        for i, card_type in enumerate(CARD_ORDER):
            yield f"event: card_start\ndata: {json.dumps({'card_type': card_type, 'index': i})}\n\n"

            try:
                prompt = _build_card_prompt(card_type, mode, transcript, title)
                response = await client.chat.completions.create(
                    model=GROQ_MODEL,
                    messages=[
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": prompt},
                    ],
                    temperature=0.3,
                    max_tokens=2048,
                    response_format={"type": "json_object"},
                )

                raw = response.choices[0].message.content or "{}"
                content = json.loads(raw)
                now = datetime.now(timezone.utc).isoformat()

                # Persist card
                async with aiosqlite.connect(DB_PATH) as db:
                    await db.execute(
                        "INSERT INTO canvas_cards (session_id, card_type, content, created_at) VALUES (?, ?, ?, ?)",
                        (session_id, card_type, json.dumps(content), now),
                    )
                    await db.commit()

                yield f"event: card_ready\ndata: {json.dumps({'card_type': card_type, 'index': i, 'content': content})}\n\n"

            except Exception as e:
                logger.error(f"[Analysis] Card {card_type} failed: {e}")
                errors.append(card_type)
                yield f"event: card_error\ndata: {json.dumps({'card_type': card_type, 'error': str(e)})}\n\n"

        # Mark complete
        final_status = "complete" if not errors else "error"
        async with aiosqlite.connect(DB_PATH) as db:
            await db.execute(
                "UPDATE sessions SET status = ? WHERE id = ?", (final_status, session_id)
            )
            await db.commit()

        yield f"event: complete\ndata: {json.dumps({'status': final_status, 'errors': errors})}\n\n"

    return StreamingResponse(
        card_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


# ── Get completed canvas ───────────────────────────────────────────────────────

@router.get("/api/sessions/{session_id}/canvas")
async def get_canvas(session_id: str):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT card_type, content, created_at FROM canvas_cards WHERE session_id = ? ORDER BY id",
            (session_id,),
        ) as cur:
            rows = await cur.fetchall()

    if not rows:
        raise HTTPException(status_code=404, detail="Canvas not yet generated")

    cards = [
        {"card_type": r["card_type"], "content": json.loads(r["content"]), "created_at": r["created_at"]}
        for r in rows
    ]
    return {"session_id": session_id, "cards": cards}
