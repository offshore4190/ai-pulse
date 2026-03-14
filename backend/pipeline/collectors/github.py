"""Stage 1 collector: GitHub Trending (AI-related repositories)."""
import logging
import os
import re
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import List

import httpx

logger = logging.getLogger(__name__)

GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
GITHUB_API = "https://api.github.com"

# Search queries to surface AI-related trending repos
AI_SEARCH_QUERIES = [
    "topic:ai topic:machine-learning stars:>500",
    "topic:llm stars:>200",
    "topic:deep-learning stars:>500",
    "topic:generative-ai stars:>200",
]

FETCH_TIMEOUT = 20


@dataclass
class RawFeedItem:
    url: str
    title: str
    body_text: str
    source_name: str = "GitHub Trending"
    source_type: str = "github"
    published_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


def _build_headers() -> dict:
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {GITHUB_TOKEN}"
    return headers


async def collect_github() -> List[RawFeedItem]:
    """Query GitHub Search API for trending AI repositories."""
    items: List[RawFeedItem] = []
    seen_ids: set = set()

    async with httpx.AsyncClient(timeout=FETCH_TIMEOUT, follow_redirects=True) as client:
        for query in AI_SEARCH_QUERIES:
            try:
                resp = await client.get(
                    f"{GITHUB_API}/search/repositories",
                    params={
                        "q": query,
                        "sort": "stars",
                        "order": "desc",
                        "per_page": 10,
                    },
                    headers=_build_headers(),
                )
                resp.raise_for_status()
                data = resp.json()

                for repo in data.get("items", []):
                    repo_id = repo.get("id")
                    if repo_id in seen_ids:
                        continue
                    seen_ids.add(repo_id)

                    html_url = repo.get("html_url", "")
                    name = repo.get("full_name", "")
                    description = repo.get("description") or ""
                    stars = repo.get("stargazers_count", 0)
                    language = repo.get("language") or "Unknown"
                    topics = ", ".join(repo.get("topics", [])[:5])

                    body_text = (
                        f"{description}\n"
                        f"Stars: {stars:,} | Language: {language} | Topics: {topics}"
                    ).strip()

                    pushed_at_str = repo.get("pushed_at", "")
                    published_at = datetime.now(timezone.utc)
                    if pushed_at_str:
                        try:
                            published_at = datetime.fromisoformat(
                                pushed_at_str.replace("Z", "+00:00")
                            )
                        except Exception:
                            pass

                    items.append(
                        RawFeedItem(
                            url=html_url,
                            title=f"[GitHub] {name} — {description[:80]}",
                            body_text=body_text,
                            published_at=published_at,
                        )
                    )

                logger.info("GitHub query '%s': %d repos", query[:40], len(data.get("items", [])))

            except Exception as exc:
                logger.warning("GitHub query '%s' failed: %s", query[:40], exc)

    logger.info("GitHub collector total: %d unique items", len(items))
    return items
