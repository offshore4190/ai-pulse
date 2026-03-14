"""Orchestrator: runs all four pipeline stages end-to-end."""
import asyncio
import logging
from sqlalchemy.orm import Session

from backend.pipeline.collectors.rss import collect_rss
from backend.pipeline.collectors.github import collect_github
from backend.pipeline.collectors.twitter import collect_twitter
from backend.pipeline.collectors.youtube import collect_youtube
from backend.pipeline.preprocessor import preprocess_and_store
from backend.pipeline.ai_processor import process_raw_items
from backend.pipeline.aggregator import aggregate_and_store

logger = logging.getLogger(__name__)


async def run_full_pipeline(db: Session) -> None:
    """Execute all four pipeline stages sequentially for all persona/language combos."""
    logger.info("=== Pipeline START ===")

    # ── Stage 1: Data collection (all sources in parallel) ─────────────────
    logger.info("Stage 1: collecting data from all sources…")
    rss_items, github_items, twitter_items, youtube_items = await asyncio.gather(
        collect_rss(),
        collect_github(),
        collect_twitter(),
        collect_youtube(),
    )

    all_raw = rss_items + github_items + twitter_items + youtube_items
    logger.info("Stage 1 complete: %d total raw items collected", len(all_raw))

    # ── Stage 2: Deduplication, cleaning, translation ──────────────────────
    logger.info("Stage 2: preprocessing…")
    new_raw_items = preprocess_and_store(all_raw, db)
    logger.info("Stage 2 complete: %d new items stored to raw_items", len(new_raw_items))

    # ── Stage 3: AI scoring & categorisation ──────────────────────────────
    logger.info("Stage 3: AI scoring…")
    processed_items = process_raw_items(new_raw_items, db)
    logger.info("Stage 3 complete: %d items passed score threshold", len(processed_items))

    # ── Stage 4: Aggregate & publish snapshots for all combos ─────────────
    logger.info("Stage 4: aggregating snapshots…")
    combos = [
        ("investor", "zh"),
        ("investor", "en"),
        ("student", "zh"),
        ("student", "en"),
    ]
    for persona, language in combos:
        snap = aggregate_and_store(db, persona=persona, language=language)
        if snap:
            logger.info("Snapshot ready: %s/%s → produced_at=%s", persona, language, snap.produced_at)
        else:
            logger.warning("Snapshot generation failed for %s/%s", persona, language)

    logger.info("=== Pipeline END ===")
