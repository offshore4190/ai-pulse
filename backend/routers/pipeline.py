"""REST API routes for the pipeline service.

Endpoints:
  GET  /api/pipeline/snapshot       – return today's prebuilt DashboardData snapshot
  POST /api/pipeline/run            – manually trigger the full pipeline
  GET  /api/pipeline/status         – return pipeline health / last-run metadata
"""
import asyncio
import logging
from datetime import date, datetime, timezone
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.db.connection import get_db
from backend.db.models import DailySnapshot
from backend.pipeline.aggregator import aggregate_and_store

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/pipeline", tags=["pipeline"])


# ── GET /api/pipeline/snapshot ─────────────────────────────────────────────

@router.get("/snapshot")
async def get_snapshot(
    persona: Literal["investor", "student"] = Query("investor"),
    language: Literal["zh", "en"] = Query("zh"),
    date_str: Optional[str] = Query(None, description="YYYY-MM-DD, defaults to today"),
    db: Session = Depends(get_db),
):
    """
    Return the most recent prebuilt DashboardData snapshot for the given
    persona / language combination.

    - If today's snapshot exists in DB → return immediately (fast path, no AI call).
    - If not found → trigger on-demand aggregation and return the result.
    """
    target_date = date.today()
    if date_str:
        try:
            target_date = date.fromisoformat(date_str)
        except ValueError:
            raise HTTPException(status_code=422, detail=f"Invalid date format: {date_str!r}")

    snapshot: Optional[DailySnapshot] = (
        db.query(DailySnapshot)
        .filter_by(date=target_date.isoformat(), persona=persona, language=language)
        .first()
    )

    if snapshot:
        logger.info("Snapshot cache hit: %s/%s/%s", target_date, persona, language)
        return snapshot.snapshot_json

    # On-demand build (first request of the day or after manual clear)
    logger.info("Snapshot cache miss — building on-demand for %s/%s/%s", target_date, persona, language)
    new_snap = aggregate_and_store(db, persona=persona, language=language, target_date=target_date)
    if not new_snap:
        raise HTTPException(
            status_code=503,
            detail="Snapshot generation failed. Pipeline may not have data for today yet.",
        )
    return new_snap.snapshot_json


# ── POST /api/pipeline/run ─────────────────────────────────────────────────

@router.post("/run")
async def run_pipeline(
    db: Session = Depends(get_db),
):
    """
    Manually trigger the complete four-stage pipeline for today.
    Runs asynchronously in the background; returns a 202 Accepted immediately.
    """
    from backend.pipeline.run_pipeline import run_full_pipeline  # local import avoids circular deps
    asyncio.create_task(_run_pipeline_task(db))
    return {"status": "accepted", "message": "Pipeline triggered. Check /api/pipeline/status for progress."}


async def _run_pipeline_task(db: Session):
    try:
        from backend.pipeline.run_pipeline import run_full_pipeline
        await run_full_pipeline(db)
    except Exception as exc:
        logger.error("Background pipeline task failed: %s", exc)


# ── GET /api/pipeline/status ───────────────────────────────────────────────

@router.get("/status")
async def get_status(db: Session = Depends(get_db)):
    """Return metadata about the last produced snapshots."""
    today_str = date.today().isoformat()
    snapshots = (
        db.query(DailySnapshot)
        .filter(DailySnapshot.date == today_str)
        .all()
    )

    return {
        "today": today_str,
        "snapshots_available": [
            {
                "persona": s.persona,
                "language": s.language,
                "is_breaking_news": s.is_breaking_news,
                "produced_at": s.produced_at.isoformat() if s.produced_at else None,
            }
            for s in snapshots
        ],
        "server_time_utc": datetime.now(timezone.utc).isoformat(),
    }
