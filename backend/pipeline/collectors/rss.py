"""Stage 1 collector: RSS feeds from major AI/tech publications."""
import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import List

import feedparser
import httpx

logger = logging.getLogger(__name__)

# Curated list of high-quality AI/tech RSS feeds
RSS_FEEDS: List[dict] = [
    {"url": "https://openai.com/blog/rss.xml", "name": "OpenAI Blog"},
    {"url": "https://www.anthropic.com/rss.xml", "name": "Anthropic"},
    {"url": "https://deepmind.google/blog/rss/", "name": "Google DeepMind"},
    {"url": "https://ai.meta.com/blog/feed/", "name": "Meta AI Blog"},
    {"url": "https://techcrunch.com/category/artificial-intelligence/feed/", "name": "TechCrunch AI"},
    {"url": "https://www.theverge.com/ai-artificial-intelligence/rss/index.xml", "name": "The Verge AI"},
    {"url": "https://venturebeat.com/category/ai/feed/", "name": "VentureBeat AI"},
    {"url": "https://www.wired.com/feed/tag/ai/latest/rss", "name": "Wired AI"},
    {"url": "https://feeds.feedburner.com/blogspot/gJZg", "name": "Google Research Blog"},
    {"url": "https://huggingface.co/blog/feed.xml", "name": "Hugging Face Blog"},
]

FETCH_TIMEOUT = 15  # seconds


@dataclass
class RawFeedItem:
    url: str
    title: str
    body_text: str
    source_name: str
    source_type: str = "rss"
    published_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


async def collect_rss() -> List[RawFeedItem]:
    """Fetch all configured RSS feeds and return a flat list of raw items."""
    items: List[RawFeedItem] = []

    async with httpx.AsyncClient(timeout=FETCH_TIMEOUT, follow_redirects=True) as client:
        for feed_cfg in RSS_FEEDS:
            try:
                resp = await client.get(feed_cfg["url"])
                resp.raise_for_status()
                feed = feedparser.parse(resp.text)

                for entry in feed.entries:
                    url = entry.get("link", "")
                    if not url:
                        continue

                    title = entry.get("title", "").strip()
                    # Prefer summary/description over full content for body text
                    body = (
                        entry.get("summary", "")
                        or entry.get("description", "")
                        or ""
                    ).strip()

                    published_at = datetime.now(timezone.utc)
                    if hasattr(entry, "published_parsed") and entry.published_parsed:
                        try:
                            published_at = datetime(*entry.published_parsed[:6], tzinfo=timezone.utc)
                        except Exception:
                            pass

                    items.append(
                        RawFeedItem(
                            url=url,
                            title=title,
                            body_text=body,
                            source_name=feed_cfg["name"],
                            published_at=published_at,
                        )
                    )

                logger.info("RSS [%s]: fetched %d entries", feed_cfg["name"], len(feed.entries))

            except Exception as exc:
                logger.warning("RSS [%s] failed: %s", feed_cfg["name"], exc)

    logger.info("RSS collector total: %d items", len(items))
    return items
