"""Stage 4: Aggregate processed items into a DashboardData-compatible JSON snapshot.

Reads today's ProcessedItems from the DB, sorts by score descending,
then assembles the full DashboardData structure expected by the frontend
(see src/types.ts). Writes the result to daily_snapshots table.
"""
import json
import logging
import os
import random
from datetime import datetime, date, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session
from google.genai import Client as GenAIClient

from backend.db.models import DailySnapshot, ProcessedItem

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
ENRICH_MODEL = "gemini-2.0-flash"

# ── Category → news type mapping ───────────────────────────────────────────
CATEGORY_TYPE_MAP = {
    "product": "product",
    "funding": "funding",
    "policy": "policy",
    "tech": "tech",
    "research": "research",
}

# ── Static enrichment prompt ────────────────────────────────────────────────
def _build_enrichment_prompt(
    persona: str,
    language: str,
    top_news: List[dict],
    today_str: str,
) -> str:
    lang_instr = "Use Simplified Chinese." if language == "zh" else "Use English."
    persona_instr = (
        "Target audience: AI investor. Focus on funding rounds, market signals, business impact."
        if persona == "investor"
        else """Target audience: Chinese university student. Use a conversational, peer-to-peer voice. TONE examples:
- todaySignal.title: like dorm gossip, e.g. "你室友用AI三天写完了文献综述，她用的是这个方法" (NOT "AI Assisted Research Efficiency Up 40%")
- todaySignal.takeaway: start with "今天就做：", e.g. "今天就做：把你的作业题目丢给Claude，让它先给你出一个提纲"
- todayAction: one concrete action, verb-first, e.g. "把你的作业题目丢给Claude，让它先给你出一个提纲"
- metrics: friendly labels, e.g. label "同龄人悄悄用AI" with change "另外15%还不知道" (NOT "AI Tools Used: 85%")
- news titles: student-friendly hooks, e.g. "6分钟听完今天最重要的1件AI大事，通勤/走路听" (NOT "Daily Podcast (Multimodal)")
- news takeaway: conversational, e.g. "今天就做：把最难的一篇文献丢进Kimi，问它3句话总结"
"""
    )
    news_json = json.dumps(top_news, ensure_ascii=False)
    return f"""
You are an AI intelligence editor. Based on the following real news items collected today ({today_str}),
generate supplementary data to complete a dashboard JSON.

{lang_instr} {persona_instr}

Real news items (scored and categorised):
{news_json}

Generate ONLY a JSON object with these fields (do NOT repeat the news array — it is already provided):
{{
  "todaySignal": {{"title": "str", "description": "str", "takeaway": "str", "url": "str", "timestamp": "str"}},
  "metrics": [{{"label": "str", "value": "str", "change": "str", "isPositive": bool}}],
  "socialSignals": [{{"id":"str","author":{{"name":"str","handle":"str","avatar":"str","role":"str","followers":"str"}},"content":"str","interpretation":"str","timestamp":"str","url":"str"}}],
  "deals": [{{"company":"str","stage":"str","description":"str","investors":["str"],"amount":"str","timestamp":"str","url":"str"}}],
  "topics": [{{"name":"str","status":"high|rising","insight":"str"}}],
  "calendar": [{{"date":"str","event":"str"}}],
  "majorInsights": [{{"discipline":"humanities|science|engineering|business","title":"str","content":"str","trend":"str","url":"str","timestamp":"str"}}],
  "majorInsightsUrl": "str",
  "agentIntros": [{{"name":"str","category":"str","features":["str"],"description":"str","url":"str"}}],
  "isBreakingNews": bool
}}

{"For investor persona: include socialSignals (3-4 items) and deals (3-5 items). Omit sideHustles/peerStory/soloEntrepreneurs/todayAction/dailyPrompt." if persona == "investor" else "For student persona: omit socialSignals and deals. Add: \"sideHustles\":[...], \"peerStory\":{{...}}, \"soloEntrepreneurs\":[...], \"todayAction\":\"str\", \"dailyPrompt\":\"str\"."}

Respond with ONLY valid JSON. No markdown fences.
"""


def _call_gemini_enrichment(prompt: str) -> dict:
    if not GEMINI_API_KEY:
        return {}
    client = GenAIClient(api_key=GEMINI_API_KEY)
    try:
        response = client.models.generate_content(
            model=ENRICH_MODEL,
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "temperature": 0.2,
                "tools": [{"google_search": {}}],
            },
        )
        raw = response.text or "{}"
        return json.loads(raw)
    except Exception as exc:
        logger.error("Enrichment Gemini call failed: %s", exc)
        return {}


def _build_news_items(processed: List[ProcessedItem], limit: int = 8) -> List[dict]:
    """Convert top ProcessedItem rows into DashboardData news[] entries."""
    news = []
    for i, item in enumerate(processed[:limit]):
        news.append({
            "id": f"pi-{item.id}",
            "type": CATEGORY_TYPE_MAP.get(item.category, "tech"),
            "title": item.title_zh,
            "context": item.summary_zh,
            "source": item.source_name or item.source_type or "AI Pulse",
            "takeaway": item.summary_zh,
            "timestamp": _relative_time(item.processed_at),
            "url": item.original_url,
        })
    return news


def _relative_time(dt: Optional[datetime]) -> str:
    if not dt:
        return "今日"
    now = datetime.now(timezone.utc)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    delta = now - dt
    hours = int(delta.total_seconds() // 3600)
    if hours < 1:
        return "刚刚"
    if hours < 24:
        return f"{hours}小时前"
    days = hours // 24
    return f"{days}天前"


def aggregate_and_store(
    db: Session,
    persona: str = "investor",
    language: str = "zh",
    target_date: Optional[date] = None,
) -> Optional[DailySnapshot]:
    """
    Build a DashboardData snapshot for the given persona/language and persist it.
    Returns the DailySnapshot ORM object, or None on failure.
    """
    today = target_date or date.today()
    today_str = today.isoformat()

    # ── Fetch today's processed items sorted by score ──────────────────────
    cutoff = datetime.combine(today, datetime.min.time()).replace(tzinfo=timezone.utc)
    items: List[ProcessedItem] = (
        db.query(ProcessedItem)
        .filter(ProcessedItem.processed_at >= cutoff)
        .order_by(ProcessedItem.score.desc())
        .limit(40)
        .all()
    )

    if not items:
        logger.warning("Aggregator: no processed items for %s — snapshot will use enrichment only", today_str)

    # ── Build news[] from DB items ─────────────────────────────────────────
    news_items = _build_news_items(items, limit=8 if persona == "investor" else 6)

    # ── Call Gemini for supplementary fields ──────────────────────────────
    top_for_enrichment = [
        {"title": it["title"], "context": it["context"], "source": it["source"], "url": it["url"]}
        for it in news_items[:6]
    ]
    prompt = _build_enrichment_prompt(persona, language, top_for_enrichment, today_str)
    enriched = _call_gemini_enrichment(prompt)

    # ── Assemble final DashboardData ───────────────────────────────────────
    snapshot: Dict[str, Any] = {
        "isBreakingNews": enriched.get("isBreakingNews", False),
        "producedAt": datetime.now(timezone.utc).isoformat(),
        "todaySignal": enriched.get("todaySignal") or {
            "title": news_items[0]["title"] if news_items else "AI Pulse",
            "description": news_items[0]["context"] if news_items else "",
            "takeaway": "",
            "url": news_items[0]["url"] if news_items else "#",
            "timestamp": today_str,
        },
        "metrics": enriched.get("metrics", []),
        "news": news_items,
        "socialSignals": enriched.get("socialSignals", []) if persona == "investor" else [],
        "deals": enriched.get("deals", []) if persona == "investor" else [],
        "topics": enriched.get("topics", []),
        "calendar": enriched.get("calendar", []),
        "majorInsights": enriched.get("majorInsights", []),
        "majorInsightsUrl": enriched.get("majorInsightsUrl", "https://openai.com/research/"),
        "agentIntros": enriched.get("agentIntros", []),
    }

    # Student-only fields
    if persona == "student":
        snapshot["sideHustles"] = enriched.get("sideHustles", [])
        snapshot["peerStory"] = enriched.get("peerStory")
        snapshot["soloEntrepreneurs"] = enriched.get("soloEntrepreneurs", [])
        snapshot["todayAction"] = enriched.get("todayAction")
        snapshot["dailyPrompt"] = enriched.get("dailyPrompt")

    # ── Upsert into daily_snapshots ────────────────────────────────────────
    existing: Optional[DailySnapshot] = (
        db.query(DailySnapshot)
        .filter_by(date=today_str, persona=persona, language=language)
        .first()
    )

    if existing:
        existing.snapshot_json = snapshot
        existing.is_breaking_news = bool(snapshot.get("isBreakingNews"))
        existing.produced_at = datetime.now(timezone.utc)
        db_obj = existing
        logger.info("Aggregator: updated existing snapshot for %s/%s/%s", today_str, persona, language)
    else:
        db_obj = DailySnapshot(
            date=today_str,
            persona=persona,
            language=language,
            snapshot_json=snapshot,
            is_breaking_news=bool(snapshot.get("isBreakingNews")),
            produced_at=datetime.now(timezone.utc),
        )
        db.add(db_obj)
        logger.info("Aggregator: creating new snapshot for %s/%s/%s", today_str, persona, language)

    try:
        db.commit()
        db.refresh(db_obj)
    except Exception as exc:
        db.rollback()
        logger.error("Aggregator: DB commit failed: %s", exc)
        return None

    return db_obj
