"""Stage 2: Deduplication, HTML cleaning, and translation.

Workflow for each incoming RawFeedItem:
1. Compute SHA-256 of the URL → skip if already in raw_items (dedup).
2. Strip HTML tags via BeautifulSoup.
3. Detect language; if non-Chinese, call Gemini Flash for lightweight translation.
4. INSERT the cleaned record into raw_items (ON CONFLICT DO NOTHING).
Returns the list of newly inserted RawItem ORM objects.
"""
import hashlib
import logging
import os
import re
import json
from datetime import datetime, timezone
from typing import List, TYPE_CHECKING

from bs4 import BeautifulSoup
from sqlalchemy.orm import Session
from google.genai import Client as GenAIClient

from backend.db.models import RawItem

if TYPE_CHECKING:
    from backend.pipeline.collectors.rss import RawFeedItem

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
TRANSLATION_MODEL = "gemini-2.0-flash"
BATCH_SIZE = 20  # items per translation call

# Simple heuristic: if > 40% chars are CJK → treat as Chinese
_CJK_RE = re.compile(r"[\u4e00-\u9fff\u3400-\u4dbf]")


def _is_chinese(text: str) -> bool:
    if not text:
        return False
    cjk_count = len(_CJK_RE.findall(text))
    return cjk_count / max(len(text), 1) > 0.15


def _sha256_url(url: str) -> str:
    return hashlib.sha256(url.encode("utf-8")).hexdigest()


def _clean_html(raw_html: str) -> str:
    """Strip HTML tags and normalise whitespace."""
    if not raw_html:
        return ""
    soup = BeautifulSoup(raw_html, "html.parser")
    # Remove script/style elements
    for tag in soup(["script", "style", "noscript", "iframe", "nav", "footer", "aside"]):
        tag.decompose()
    text = soup.get_text(separator=" ")
    # Collapse whitespace
    text = re.sub(r"\s+", " ", text).strip()
    return text[:2000]  # cap at 2000 chars for downstream processing


def _translate_batch(items_to_translate: List[dict]) -> List[dict]:
    """Translate a batch of {id, title, body} dicts to Simplified Chinese via Gemini."""
    if not GEMINI_API_KEY or not items_to_translate:
        return items_to_translate

    client = GenAIClient(api_key=GEMINI_API_KEY)
    payload = json.dumps(items_to_translate, ensure_ascii=False)

    prompt = (
        "Translate the following JSON array of news items to Simplified Chinese. "
        "Return ONLY valid JSON array with the same structure (id, title, body). "
        "Keep proper nouns (company/product names) in their original form.\n\n"
        f"{payload}"
    )

    try:
        response = client.models.generate_content(
            model=TRANSLATION_MODEL,
            contents=prompt,
            config={"response_mime_type": "application/json", "temperature": 0.1},
        )
        raw = response.text or "[]"
        translated = json.loads(raw)
        if isinstance(translated, list):
            return translated
    except Exception as exc:
        logger.warning("Translation batch failed: %s — keeping original text", exc)

    return items_to_translate


def preprocess_and_store(
    raw_feed_items: List,  # List[RawFeedItem] from any collector
    db: Session,
) -> List[RawItem]:
    """Deduplicate, clean, translate, and persist items. Returns newly inserted ORM objects."""
    if not raw_feed_items:
        return []

    # ── Step 1: URL deduplication against existing DB records ──────────────
    url_hashes = [_sha256_url(item.url) for item in raw_feed_items]
    existing_hashes: set = set(
        row[0]
        for row in db.query(RawItem.url_hash)
        .filter(RawItem.url_hash.in_(url_hashes))
        .all()
    )

    new_items = [
        (item, url_hashes[i])
        for i, item in enumerate(raw_feed_items)
        if url_hashes[i] not in existing_hashes
    ]

    if not new_items:
        logger.info("Preprocessor: all %d items already in DB — nothing to do", len(raw_feed_items))
        return []

    logger.info("Preprocessor: %d new items (skipped %d duplicates)", len(new_items), len(raw_feed_items) - len(new_items))

    # ── Step 2: HTML clean ──────────────────────────────────────────────────
    cleaned: List[dict] = []
    for item, url_hash in new_items:
        title_clean = _clean_html(item.title)
        body_clean = _clean_html(item.body_text)
        lang = "zh" if _is_chinese(title_clean + body_clean) else "en"
        cleaned.append({
            "item": item,
            "url_hash": url_hash,
            "title": title_clean,
            "body": body_clean,
            "lang": lang,
        })

    # ── Step 3: Translate non-Chinese batches ───────────────────────────────
    non_zh = [c for c in cleaned if c["lang"] != "zh"]
    if non_zh:
        for start in range(0, len(non_zh), BATCH_SIZE):
            batch = non_zh[start: start + BATCH_SIZE]
            translation_input = [
                {"id": str(i), "title": c["title"], "body": c["body"][:500]}
                for i, c in enumerate(batch)
            ]
            translated = _translate_batch(translation_input)
            t_map = {t["id"]: t for t in translated if isinstance(t, dict)}
            for i, c in enumerate(batch):
                t = t_map.get(str(i))
                if t:
                    c["title"] = t.get("title", c["title"])
                    c["body"] = t.get("body", c["body"])

    # ── Step 4: Insert into raw_items ───────────────────────────────────────
    inserted: List[RawItem] = []
    for c in cleaned:
        orm_obj = RawItem(
            url=c["item"].url,
            url_hash=c["url_hash"],
            title=c["title"],
            body_text=c["body"],
            source_type=c["item"].source_type,
            source_name=c["item"].source_name,
            language_detected=c["lang"],
            fetched_at=getattr(c["item"], "published_at", None) or datetime.now(timezone.utc),
        )
        db.add(orm_obj)
        inserted.append(orm_obj)

    try:
        db.commit()
        for obj in inserted:
            db.refresh(obj)
        logger.info("Preprocessor: committed %d new raw_items", len(inserted))
    except Exception as exc:
        db.rollback()
        logger.error("Preprocessor: DB commit failed: %s", exc)
        return []

    return inserted
