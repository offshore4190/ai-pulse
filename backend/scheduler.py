"""APScheduler: daily pipeline trigger at UTC 22:00 (Beijing time 06:00).

Start/stop are called from the FastAPI lifespan context in main.py.
Can also be run standalone:
    python -m backend.scheduler
"""
import asyncio
import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from backend.db.connection import SessionLocal

logger = logging.getLogger(__name__)

_scheduler: AsyncIOScheduler | None = None


async def _daily_pipeline_job():
    """The job function executed by APScheduler."""
    logger.info("[Scheduler] Daily pipeline job triggered")
    from backend.pipeline.run_pipeline import run_full_pipeline

    db = SessionLocal()
    try:
        await run_full_pipeline(db)
    except Exception as exc:
        logger.error("[Scheduler] Pipeline job failed: %s", exc)
    finally:
        db.close()


def start_scheduler() -> None:
    """Initialise and start the background scheduler."""
    global _scheduler

    _scheduler = AsyncIOScheduler()

    # Every day at UTC 22:00 (Beijing 06:00 next day)
    _scheduler.add_job(
        _daily_pipeline_job,
        trigger=CronTrigger(hour=22, minute=0, timezone="UTC"),
        id="daily_pipeline",
        name="Daily AI content pipeline",
        replace_existing=True,
        misfire_grace_time=300,  # allow up to 5-min late start
    )

    _scheduler.start()
    logger.info("[Scheduler] Started — daily pipeline job scheduled at UTC 22:00")


def shutdown_scheduler() -> None:
    """Gracefully stop the scheduler."""
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("[Scheduler] Shut down")


# ── Standalone entrypoint ──────────────────────────────────────────────────

if __name__ == "__main__":
    import logging

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )

    from backend.db.connection import init_db

    init_db()

    async def _main():
        start_scheduler()
        logger.info("Scheduler running standalone. Press Ctrl+C to stop.")
        try:
            while True:
                await asyncio.sleep(60)
        except (KeyboardInterrupt, SystemExit):
            shutdown_scheduler()

    asyncio.run(_main())
