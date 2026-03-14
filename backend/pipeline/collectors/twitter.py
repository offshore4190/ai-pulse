"""Stage 1 collector: Twitter/X API v2 — key AI thought-leaders."""
import logging
import os
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import List

import httpx

logger = logging.getLogger(__name__)

TWITTER_BEARER_TOKEN = os.environ.get("TWITTER_BEARER_TOKEN", "")
TWITTER_API_BASE = "https://api.twitter.com/2"

# High-signal AI accounts to track (username list)
AI_HANDLES = [
    "sama",           # Sam Altman / OpenAI
    "karpathy",       # Andrej Karpathy
    "ylecun",         # Yann LeCun / Meta AI
    "demishassabis",  # Demis Hassabis / DeepMind
    "danielnouri",    # AI practitioner
    "GaryMarcus",     # AI critic/researcher
    "fchollet",       # François Chollet / Keras
    "hardmaru",       # David Ha / AI research
    "ClementDelangue", # Hugging Face CEO
    "AravSrinivas",   # Perplexity CEO
]

TWEET_FIELDS = "id,text,author_id,created_at,public_metrics,entities"
EXPANSIONS = "author_id"
USER_FIELDS = "name,username,public_metrics"
MAX_RESULTS = 10  # per user
FETCH_TIMEOUT = 15


@dataclass
class RawFeedItem:
    url: str
    title: str
    body_text: str
    source_name: str
    source_type: str = "twitter"
    published_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


def _auth_headers() -> dict:
    return {"Authorization": f"Bearer {TWITTER_BEARER_TOKEN}"}


async def _get_user_id(client: httpx.AsyncClient, username: str) -> str | None:
    try:
        resp = await client.get(
            f"{TWITTER_API_BASE}/users/by/username/{username}",
            headers=_auth_headers(),
            params={"user.fields": "public_metrics"},
        )
        if resp.status_code == 200:
            return resp.json().get("data", {}).get("id")
    except Exception as exc:
        logger.warning("Twitter: could not resolve @%s: %s", username, exc)
    return None


async def collect_twitter() -> List[RawFeedItem]:
    """Fetch recent tweets from curated AI influencer accounts."""
    if not TWITTER_BEARER_TOKEN:
        logger.warning("TWITTER_BEARER_TOKEN not set — skipping Twitter collector")
        return []

    items: List[RawFeedItem] = []

    async with httpx.AsyncClient(timeout=FETCH_TIMEOUT, follow_redirects=True) as client:
        for handle in AI_HANDLES:
            user_id = await _get_user_id(client, handle)
            if not user_id:
                continue

            try:
                resp = await client.get(
                    f"{TWITTER_API_BASE}/users/{user_id}/tweets",
                    headers=_auth_headers(),
                    params={
                        "tweet.fields": TWEET_FIELDS,
                        "expansions": EXPANSIONS,
                        "user.fields": USER_FIELDS,
                        "max_results": MAX_RESULTS,
                        "exclude": "retweets,replies",
                    },
                )
                resp.raise_for_status()
                data = resp.json()

                # Build author display name lookup from includes
                users_map: dict = {}
                for u in data.get("includes", {}).get("users", []):
                    users_map[u["id"]] = u

                for tweet in data.get("data", []):
                    tweet_id = tweet.get("id", "")
                    text = tweet.get("text", "").strip()
                    author_id = tweet.get("author_id", "")
                    author_info = users_map.get(author_id, {})
                    author_name = author_info.get("name", handle)
                    followers = author_info.get("public_metrics", {}).get("followers_count", 0)

                    created_at_str = tweet.get("created_at", "")
                    published_at = datetime.now(timezone.utc)
                    if created_at_str:
                        try:
                            published_at = datetime.fromisoformat(
                                created_at_str.replace("Z", "+00:00")
                            )
                        except Exception:
                            pass

                    tweet_url = f"https://x.com/{handle}/status/{tweet_id}"
                    metrics = tweet.get("public_metrics", {})
                    engagement = (
                        f"Likes: {metrics.get('like_count', 0)} | "
                        f"Retweets: {metrics.get('retweet_count', 0)} | "
                        f"Followers: {followers:,}"
                    )

                    items.append(
                        RawFeedItem(
                            url=tweet_url,
                            title=f"@{handle} ({author_name}): {text[:100]}",
                            body_text=f"{text}\n{engagement}",
                            source_name=f"@{handle}",
                            published_at=published_at,
                        )
                    )

                logger.info("Twitter @%s: %d tweets fetched", handle, len(data.get("data", [])))

            except Exception as exc:
                logger.warning("Twitter @%s failed: %s", handle, exc)

    logger.info("Twitter collector total: %d items", len(items))
    return items
