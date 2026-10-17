"""
models.py — Pydantic request/response models for the Tatva API.
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime


SessionMode = Literal["lesson", "speech", "debate", "discussion"]
SessionStatus = Literal["recording", "ended", "analysing", "complete", "error"]
CardType = Literal[
    "summary", "objectives", "concepts", "key_moments",
    "questions", "stats", "insights"
]


# ── Session ────────────────────────────────────────────────────────────────────

class SessionCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    mode: SessionMode = "lesson"
    language: str = "en"
    speakers: Optional[List[str]] = None   # e.g. ["Teacher", "Student"]


class SessionOut(BaseModel):
    id: str
    title: str
    mode: SessionMode
    language: str = "en"
    speakers: Optional[List[str]] = None
    status: SessionStatus = "recording"
    created_at: str
    ended_at: Optional[str] = None
    duration_s: Optional[int] = None


# ── Transcript ─────────────────────────────────────────────────────────────────

class TranscriptSegment(BaseModel):
    speaker: Optional[str] = None
    text: str
    start_ms: Optional[int] = None
    end_ms: Optional[int] = None


class TranscriptOut(BaseModel):
    session_id: str
    segments: List[TranscriptSegment]
    full_text: str


# ── Canvas ─────────────────────────────────────────────────────────────────────

class CanvasCard(BaseModel):
    card_type: CardType
    content: dict
    created_at: str


class CanvasOut(BaseModel):
    session_id: str
    cards: List[CanvasCard]


# ── Companion ──────────────────────────────────────────────────────────────────

class CompanionSessionRequest(BaseModel):
    participant_name: Optional[str] = "learner"


class CompanionSessionOut(BaseModel):
    call_id: str
    room_name: str
    livekit_url: str
    livekit_token: str
    max_session_seconds: int
    message: str
