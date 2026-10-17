# state.py — Session state for Tatva UNMUTE Companion
from pydantic import BaseModel, Field

class State(BaseModel):
    session_title: str = Field(
        default="",
        description="Title of the completed voice session."
    )
    session_mode: str = Field(
        default="lesson",
        description="Operating mode: lesson, speech, debate, or discussion."
    )
    session_summary: str = Field(
        default="",
        description="Executive narrative summary of what was covered."
    )
    key_concepts: str = Field(
        default="",
        description="Formatted list of core concepts and definitions."
    )
    transcript_excerpt: str = Field(
        default="",
        description="Condensed transcript excerpt from the session."
    )
