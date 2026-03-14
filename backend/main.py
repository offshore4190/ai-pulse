"""FastAPI application entry point for the AI Pulse pipeline backend."""
import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.db.connection import init_db
from backend.routers.pipeline import router as pipeline_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# Origins allowed to call the backend (adjust for production deployment)
ALLOWED_ORIGINS = [
    "http://localhost:3000",    # Vite dev server (default)
    "http://localhost:5173",    # Vite preview
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]
# In production you can extend this via the env var EXTRA_CORS_ORIGINS (comma-separated)
extra = os.environ.get("EXTRA_CORS_ORIGINS", "")
if extra:
    ALLOWED_ORIGINS.extend([o.strip() for o in extra.split(",") if o.strip()])


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialise DB tables on startup; shut down scheduler on exit."""
    logger.info("AI Pulse backend starting up…")
    init_db()

    # Start the APScheduler (imports lazily to avoid circular deps at module load)
    from backend.scheduler import start_scheduler, shutdown_scheduler
    start_scheduler()

    yield

    logger.info("AI Pulse backend shutting down…")
    shutdown_scheduler()


app = FastAPI(
    title="AI Pulse Pipeline API",
    description="Four-stage content refresh pipeline backend for AI Pulse.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pipeline_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
