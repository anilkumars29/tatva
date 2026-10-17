"""
database.py — aiosqlite setup and schema creation for Tatva backend.
"""
import aiosqlite
import os
from pathlib import Path

DB_PATH = Path(__file__).parent / "tatva.db"


async def get_db() -> aiosqlite.Connection:
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    return db


async def init_db():
    """Create tables if they don't exist. Safe to call on every startup."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.executescript("""
            CREATE TABLE IF NOT EXISTS sessions (
                id          TEXT PRIMARY KEY,
                title       TEXT NOT NULL,
                mode        TEXT NOT NULL DEFAULT 'lesson',
                language    TEXT NOT NULL DEFAULT 'en',
                speakers    TEXT,               -- JSON array of speaker labels
                status      TEXT NOT NULL DEFAULT 'recording',
                -- status: recording | ended | analysing | complete | error
                created_at  TEXT NOT NULL,
                ended_at    TEXT,
                duration_s  INTEGER
            );

            CREATE TABLE IF NOT EXISTS transcript_segments (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id  TEXT NOT NULL REFERENCES sessions(id),
                speaker     TEXT,               -- null when diarisation unavailable
                text        TEXT NOT NULL,
                start_ms    INTEGER,
                end_ms      INTEGER,
                is_final    INTEGER NOT NULL DEFAULT 1,
                created_at  TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS canvas_cards (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id  TEXT NOT NULL REFERENCES sessions(id),
                card_type   TEXT NOT NULL,      -- summary|objectives|concepts|key_moments|questions|stats|insights
                content     TEXT NOT NULL,      -- JSON blob
                created_at  TEXT NOT NULL
            );
        """)
        await db.commit()

        # Seed initial demo session if database is empty
        async with db.execute("SELECT COUNT(*) FROM sessions") as cur:
            count = (await cur.fetchone())[0]

        if count == 0:
            import json
            from datetime import datetime, timezone

            now = datetime.now(timezone.utc).isoformat()
            demo_id = "demo-voice-ai-lesson"
            demo_title = "Introduction to Voice AI Architecture & Latency Optimization"

            await db.execute(
                """INSERT INTO sessions (id, title, mode, language, speakers, status, created_at, ended_at, duration_s)
                   VALUES (?, ?, 'lesson', 'en', ?, 'complete', ?, ?, 240)""",
                (demo_id, demo_title, json.dumps(["Dr. Evelyn Vance"]), now, now),
            )

            # Seed transcript
            demo_transcript = [
                ("Dr. Evelyn Vance", "Welcome everyone to Tatva. Today we are exploring the architecture behind modern conversational Voice AI systems, specifically how to bring end-to-end turn-around latency below 400 milliseconds.", 0, 8000),
                ("Dr. Evelyn Vance", "The primary challenge in voice agents is what engineers call the 'cascade penalty'. When you pipe audio from client to Speech-to-Text, await the full transcription, forward that text to an LLM, and finally stream text into a Text-to-Speech synthesizer, each layer adds latency.", 8200, 22000),
                ("Dr. Evelyn Vance", "To overcome this, modern architectures utilize speculative chunking and bidirectional WebSockets. Rather than waiting for a full sentence or paragraph, the STT engine emits partial transcript frames with voice activity detection.", 22500, 38000),
                ("Dr. Evelyn Vance", "Our second pillar is Streaming Diarization. Diarization classifies audio frames by speaker identity. In multi-party roundtables or debates, this prevents the LLM from synthesizing contradictory viewpoints into a single speaker.", 38500, 52000),
                ("Dr. Evelyn Vance", "Finally, session context injection. Instead of asking the user to re-explain their background, the orchestrator injects structured knowledge as runtime arguments directly into agent memory.", 52500, 68000),
            ]

            for sp, text, start, end in demo_transcript:
                await db.execute(
                    """INSERT INTO transcript_segments (session_id, speaker, text, start_ms, end_ms, is_final, created_at)
                       VALUES (?, ?, ?, ?, ?, 1, ?)""",
                    (demo_id, sp, text, start, end, now),
                )

            # Seed 7 Knowledge Cards
            demo_cards = [
                ("summary", {
                    "headline": "Overcoming the Cascade Penalty in Conversational Voice AI Architectures",
                    "overview": "This lecture dissects the technical anatomy of ultra-low latency conversational voice systems. Dr. Vance explains why sequential waterfall pipelines fail to achieve human-conversational speeds (<400ms) and outlines the three core engineering paradigms: speculative chunking, streaming diarization, and dynamic context injection.",
                    "session_type": "lesson",
                    "key_takeaway": "Achieving natural voice conversation requires bidirectional streaming with speculative chunking rather than waiting for serialized request-response boundaries."
                }),
                ("objectives", {
                    "learning_objectives": [
                        {"objective": "Understand the latency bottlenecks of sequential STT → LLM → TTS pipelines", "covered": True, "confidence": "high"},
                        {"objective": "Implement speculative streaming chunking over bidirectional WebSockets", "covered": True, "confidence": "high"},
                        {"objective": "Utilize streaming speaker diarization to separate multi-party debate turns", "covered": True, "confidence": "high"},
                        {"objective": "Inject session knowledge arguments into runtime agent memory", "covered": True, "confidence": "medium"}
                    ],
                    "prerequisite_knowledge": ["WebRTC and WebSocket protocols", "Token streaming in Large Language Models", "Basic digital audio processing (PCM16, 16kHz)"],
                    "outcomes": "Builders will be equipped to architect voice pipelines with sub-400ms latency suitable for production interactive voice agents."
                }),
                ("concepts", {
                    "concepts": [
                        {
                            "term": "The Cascade Penalty",
                            "definition": "The cumulative serialization delay caused when STT, LLM, and TTS execute sequentially without overlapping stream processing.",
                            "examples": ["Traditional REST-based voice bots with 2-3 second delays"],
                            "importance": "Conversational cadence breaks if turn-around exceeds 500ms; human conversations average 200-300ms pause thresholds."
                        },
                        {
                            "term": "Speculative Chunking",
                            "definition": "Emitting and processing tokens in variable micro-chunks as soon as confidence thresholds are reached, rather than awaiting punctuation.",
                            "examples": ["SLNG Nova 3 partial frames streaming to LLM prompt buffers"],
                            "importance": "Shaves hundreds of milliseconds off first-token time-to-audio."
                        },
                        {
                            "term": "Streaming Diarization",
                            "definition": "Partitioning continuous audio into speaker-labeled segments in real time without requiring retrospective whole-file analysis.",
                            "examples": ["Speaker 1 vs Speaker 2 differentiation in debates and interviews"],
                            "importance": "Ensures the knowledge engine attributes claims to the correct participants."
                        },
                        {
                            "term": "Runtime Context Injection",
                            "definition": "Passing synthesized session intelligence (summaries, concepts, constraints) into voice agent prompt arguments at session creation time.",
                            "examples": ["SLNG web-session arguments injected into UNMUTE companion memory"],
                            "importance": "Allows voice companions to converse knowledgeably about newly completed sessions without slow retraining."
                        }
                    ]
                }),
                ("key_moments", {
                    "moments": [
                        {
                            "label": "The Cascade Penalty Definition",
                            "description": "Dr. Vance identified the waterfall cascade as the single largest inhibitor of natural voice interaction.",
                            "significance": "Re-frames the latency problem from model speed to architectural pipelining.",
                            "type": "insight",
                            "approximate_time_label": "~0:15"
                        },
                        {
                            "label": "Introduction of Speculative Chunking",
                            "description": "Demonstration of overlapping STT partials with LLM prefill buffers.",
                            "significance": "Core technique for hitting sub-400ms conversational turnarounds.",
                            "type": "definition",
                            "approximate_time_label": "~0:45"
                        },
                        {
                            "label": "Multi-party Speaker Diarization Importance",
                            "description": "Explanation of how attribution errors destroy LLM reasoning in debate and roundtable scenarios.",
                            "significance": "Critical requirement for collaborative knowledge capture.",
                            "type": "turning_point",
                            "approximate_time_label": "~1:10"
                        }
                    ]
                }),
                ("questions", {
                    "difficulty": "intermediate",
                    "questions": [
                        {
                            "question": "What is the primary factor responsible for the 'cascade penalty' in traditional voice agent pipelines?",
                            "type": "multiple_choice",
                            "options": [
                                "A. Microphones capturing audio at too low a sample rate",
                                "B. Sequential execution where each stage waits for the preceding stage to complete",
                                "C. Lack of GPU memory in client devices",
                                "D. Using WebRTC instead of HTTP polling"
                            ],
                            "correct_answer": "B",
                            "explanation": "The cascade penalty arises when STT must complete before LLM starts, and LLM must complete before TTS starts. Overlapping these stages via streaming is the standard solution."
                        },
                        {
                            "question": "Which streaming technique allows TTS to start generating audio before the LLM finishes producing its full response?",
                            "type": "multiple_choice",
                            "options": [
                                "A. Speculative micro-chunking and sentence boundary synthesis",
                                "B. Batch audio transcoding",
                                "C. Frequency domain Fourier transform",
                                "D. Whole-file WAV buffering"
                            ],
                            "correct_answer": "A",
                            "explanation": "Synthesizers process the first complete phrase or token chunk immediately while the LLM continues generating subsequent tokens in parallel."
                        },
                        {
                            "question": "Why is streaming diarization critical when transcribing a multi-speaker debate?",
                            "type": "multiple_choice",
                            "options": [
                                "A. It increases microphone volume automatically",
                                "B. It prevents the synthesis engine from attributing conflicting arguments to the same person",
                                "C. It compresses the audio file size by half",
                                "D. It converts speech into different languages"
                            ],
                            "correct_answer": "B",
                            "explanation": "Accurate speaker segmentation ensures that contrasting claims remain cleanly differentiated in the synthesized knowledge graph."
                        }
                    ]
                }),
                ("stats", {
                    "word_count": 284,
                    "estimated_speaking_time_min": 2,
                    "topics_covered": 4,
                    "questions_asked_in_session": 0,
                    "speakers_detected": 1,
                    "content_density": "high",
                    "disclaimer": "Metrics extracted from real-time SLNG Nova 3 transcript telemetry."
                }),
                ("insights", {
                    "ai_note": "The lecture delivers exceptionally high information density with zero filler phrases, making it ideal for concept extraction.",
                    "strengths": [
                        "Clear architectural contrast between waterfall cascades vs speculative pipelines",
                        "Precise terminology aligned with production voice engineering standards",
                        "Practical emphasis on human perceptual latency thresholds (<400ms)"
                    ],
                    "suggestions": [
                        "Consider including a live latency benchmark graph comparing WebRTC vs HTTP endpoints",
                        "Add a brief mention of Acoustic Echo Cancellation (AEC) during duplex speech"
                    ],
                    "connections": [
                        "Voice Agent Turn Detection (VAD & Silero models)",
                        "LiveKit WebRTC Data Channels and SFU architecture"
                    ],
                    "follow_up_topics": [
                        "Acoustic Echo Cancellation (AEC) and Barge-In Handling",
                        "Speech-to-Speech Direct End-to-End Models (e.g. GPT-4o voice)"
                    ]
                })
            ]

            for ctype, content in demo_cards:
                await db.execute(
                    """INSERT INTO canvas_cards (session_id, card_type, content, created_at)
                       VALUES (?, ?, ?, ?)""",
                    (demo_id, ctype, json.dumps(content), now),
                )

            await db.commit()

