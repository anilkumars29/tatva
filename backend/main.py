"""
main.py — Tatva FastAPI application entry point.
"""
import logging
import os
from contextlib import asynccontextmanager

from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load root .env
_root_env = Path(__file__).resolve().parent.parent / ".env"
if _root_env.exists():
    load_dotenv(_root_env)
load_dotenv()

from database import init_db
from sessions import router as sessions_router
from stt_relay import router as stt_router
from analysis import router as analysis_router
from companion import router as companion_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Tatva backend starting — initialising database…")
    await init_db()
    logger.info("Database ready.")
    yield
    logger.info("Tatva backend shutting down.")


app = FastAPI(
    title="Tatva API",
    description="Voice-First Knowledge Studio — backend for the Ignite hackathon",
    version="0.1.0",
    lifespan=lifespan,
)

cors_origins = os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sessions_router)
app.include_router(stt_router)
app.include_router(analysis_router)
app.include_router(companion_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "tatva-backend"}
