"""Stage 3: AI scoring, categorisation, and summarisation.

For each unprocessed RawItem:
- Batch 10 items per Gemini API call.
- Prompt returns JSON array: [{id, score, category, title_zh, summary_zh}]
- Items with score < 6 are discarded (not AI-relevant enough).
- Surviving items are written to processed_items table.
"""
import json
import logging
import os
import time
from datetime import datetime, timezone
from typing import List

from sqlalchemy.orm import Session
from google.genai import Client as GenAIClient

from backend.db.models import ProcessedItem, RawItem

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
SCORING_MODEL = "gemini-2.0-flash"
BATCH_SIZE = 10
MIN_SCORE = 6.0
RETRY_DELAYS = [2, 4, 8]  # seconds


def _get_client() -> GenAIClient:
    return GenAIClient(api_key=GEMINI_API_KEY)


def _build_scoring_prompt(batch: List[dict]) -> str:
    items_json = json.dumps(batch, ensure_ascii=False, indent=2)
    return f"""You are an AI news editor. Score, categorise, and summarise each news item below.

For each item return a JSON object with:
- "id": the original id string
- "score": integer 1-10 measuring AI relevance and industry significance
  (10 = major breakthrough/funding, 1 = marginally related)
- "category": one of "product" | "funding" | "policy" | "tech" | "research"
- "title_zh": a punchy Simplified Chinese headline, max 20 characters
- "summary_zh": a concise Simplified Chinese summary, max 60 characters

Scoring rubric:
- 9-10: Major product launch / large funding round / significant policy / breakthrough research
- 7-8: Noteworthy update, meaningful funding, solid research
- 5-6: Minor update, small project, tangentially related
- 1-4: Not AI-specific, purely promotional, duplicate/spam

Respond with ONLY a valid JSON array. No markdown fences.

Items:
{items_json}"""


def _call_gemini_with_retry(prompt: str) -> List[dict]:
    """Call Gemini API with exponential back-off on transient errors."""
    client = _get_client()
    last_exc = None

    for attempt, delay in enumerate([0] + RETRY_DELAYS):
        if delay:
            time.sleep(delay)
        try:
            response = client.models.generate_content(
                model=SCORING_MODEL,
                contents=prompt,
                config={"response_mime_type": "application/json", "temperature": 0.1},
            )
            raw = response.text or "[]"
            result = json.loads(raw)
            if isinstance(result, list):
                return result
            logger.warning("Unexpected Gemini response type: %s", type(result))
            return []
        except Exception as exc:
            last_exc = exc
            msg = str(exc)
            is_quota = "429" in msg or "RESOURCE_EXHAUSTED" in msg
            is_server = "500" in msg or "INTERNAL" in msg
            if (is_quota or is_server) and attempt < len(RETRY_DELAYS):
                logger.warning("Gemini error (attempt %d): %s — retrying in %ds", attempt + 1, msg, RETRY_DELAYS[attempt] if attempt < len(RETRY_DELAYS) else 0)
                continue
            break

    logger.error("Gemini scoring failed after retries: %s", last_exc)
    return []


def process_raw_items(raw_items: List[RawItem], db: Session) -> List[ProcessedItem]:
    """Score, filter, and persist raw items. Returns the newly created ProcessedItem rows."""
    if not raw_items or not GEMINI_API_KEY:
        if not GEMINI_API_KEY:
            logger.error("GEMINI_API_KEY not set — cannot run AI processor")
        return []

    inserted: List[ProcessedItem] = []

    for batch_start in range(0, len(raw_items), BATCH_SIZE):
        batch_raw = raw_items[batch_start: batch_start + BATCH_SIZE]

        # Build a lightweight payload for the model
        batch_input = [
            {
                "id": str(item.id),
                "title": (item.title or "")[:200],
                "body": (item.body_text or "")[:400],
                "source": item.source_name or item.source_type,
            }
            for item in batch_raw
        ]

        prompt = _build_scoring_prompt(batch_input)
        scored = _call_gemini_with_retry(prompt)

        # Map results back to RawItem by id
        score_map = {r.get("id", ""): r for r in scored if isinstance(r, dict)}

        for item in batch_raw:
            result = score_map.get(str(item.id))
            if not result:
                logger.debug("No score result for raw_id=%s — skipping", item.id)
                continue

            score = float(result.get("score", 0))
            if score < MIN_SCORE:
                logger.debug("raw_id=%s scored %.1f < %.1f — discarded", item.id, score, MIN_SCORE)
                continue

            category = result.get("category", "tech")
            if category not in {"product", "funding", "policy", "tech", "research"}:
                category = "tech"

            title_zh = str(result.get("title_zh", item.title or ""))[:100]
            summary_zh = str(result.get("summary_zh", ""))[:200]

            pi = ProcessedItem(
                raw_id=item.id,
                original_url=item.url,
                title_zh=title_zh,
                summary_zh=summary_zh,
                score=score,
                category=category,
                source_name=item.source_name,
                source_type=item.source_type,
                processed_at=datetime.now(timezone.utc),
                source_published_at=getattr(item, "published_at", None),
            )
            db.add(pi)
            inserted.append(pi)

        logger.info(
            "AI processor batch %d-%d: %d/%d items passed score threshold",
            batch_start,
            batch_start + len(batch_raw),
            len([p for p in inserted if p in inserted]),  # cumulative
            len(batch_raw),
        )

    try:
        db.commit()
        for obj in inserted:
            db.refresh(obj)
        logger.info("AI processor: committed %d processed_items", len(inserted))
    except Exception as exc:
        db.rollback()
        logger.error("AI processor: DB commit failed: %s", exc)
        return []

    return inserted
