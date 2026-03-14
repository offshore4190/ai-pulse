"""Stage 1 collector: YouTube Data API v3 — top AI channels."""
import logging
import os
from dataclasses import dataclass, field
from datetime import datetime, timezone, timedelta
from typing import List

import httpx

logger = logging.getLogger(__name__)

YOUTUBE_API_KEY = os.environ.get("YOUTUBE_API_KEY", "")
YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3"

# Curated AI / ML YouTube channels (channel IDs)
AI_CHANNELS = [
    {"id": "UCbmNph6atAoGfqLoCL_duAg", "name": "Andrej Karpathy"},
    {"id": "UCWX9lom-Hs5AEgF2NxGU_Gw", "name": "Two Minute Papers"},
    {"id": "UCZHmQk67mSJgfCCTn4M_3xA", "name": "Yannic Kilcher"},
    {"id": "UC9-y-6csu5WGm29I7JiwpnA", "name": "Computerphile"},
    {"id": "UCnUYZLuoy1rq1aVMwx4aTzw", "name": "Stanford CS229"},
    {"id": "UCddiUEpeqJcYeBxX1IVBKvQ", "name": "DeepLearningAI"},
    {"id": "UCMTFbk6IdhFQSBJZyaRZTRA", "name": "Lex Fridman"},
]

MAX_RESULTS = 5  # per channel
LOOKBACK_DAYS = 7
FETCH_TIMEOUT = 15


@dataclass
class RawFeedItem:
    url: str
    title: str
    body_text: str
    source_name: str
    source_type: str = "youtube"
    published_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


async def collect_youtube() -> List[RawFeedItem]:
    """Fetch recent AI-related videos from curated YouTube channels."""
    if not YOUTUBE_API_KEY:
        logger.warning("YOUTUBE_API_KEY not set — skipping YouTube collector")
        return []

    items: List[RawFeedItem] = []
    published_after = (datetime.now(timezone.utc) - timedelta(days=LOOKBACK_DAYS)).strftime(
        "%Y-%m-%dT%H:%M:%SZ"
    )

    async with httpx.AsyncClient(timeout=FETCH_TIMEOUT, follow_redirects=True) as client:
        for channel in AI_CHANNELS:
            try:
                resp = await client.get(
                    f"{YOUTUBE_API_BASE}/search",
                    params={
                        "key": YOUTUBE_API_KEY,
                        "channelId": channel["id"],
                        "part": "snippet",
                        "order": "date",
                        "type": "video",
                        "maxResults": MAX_RESULTS,
                        "publishedAfter": published_after,
                    },
                )
                resp.raise_for_status()
                data = resp.json()

                for item in data.get("items", []):
                    snippet = item.get("snippet", {})
                    video_id = item.get("id", {}).get("videoId", "")
                    if not video_id:
                        continue

                    title = snippet.get("title", "").strip()
                    description = snippet.get("description", "").strip()[:400]
                    published_at_str = snippet.get("publishedAt", "")

                    published_at = datetime.now(timezone.utc)
                    if published_at_str:
                        try:
                            published_at = datetime.fromisoformat(
                                published_at_str.replace("Z", "+00:00")
                            )
                        except Exception:
                            pass

                    video_url = f"https://www.youtube.com/watch?v={video_id}"

                    items.append(
                        RawFeedItem(
                            url=video_url,
                            title=f"[YouTube] {title}",
                            body_text=f"{description}\nChannel: {channel['name']}",
                            source_name=channel["name"],
                            published_at=published_at,
                        )
                    )

                logger.info("YouTube [%s]: %d videos", channel["name"], len(data.get("items", [])))

            except Exception as exc:
                logger.warning("YouTube [%s] failed: %s", channel["name"], exc)

    logger.info("YouTube collector total: %d items", len(items))
    return items
