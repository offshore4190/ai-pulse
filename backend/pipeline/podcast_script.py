"""Generate podcast-style script from DashboardData via Gemini.

Used by GET /api/pipeline/podcast-script. Frontend falls back to buildFallbackScript
when this returns 503 or on network error.
"""
import json
import logging
import os
from datetime import datetime, timezone
from typing import Optional

from google.genai import Client as GenAIClient

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
PODCAST_MODEL = "gemini-2.0-flash"

VOICE_TONE_DESCRIPTIONS = {
    "youth": "口语化、活力、像朋友聊天。使用短句、口语化表达，可适当使用语气词（比如、其实、对吧）。避免长从句和书面语。",
    "middle": "稳重、有见解、节奏适中。句式适中，用词准确，带一点分析感。",
    "elder": "娓娓道来、有阅历感。语速略慢，用词稳重，像在讲故事。",
    "gentle": "舒缓、亲切、温和。语气柔和，句式舒缓。",
    "sunny": "积极、明快。语气轻松，节奏明快。",
    "professional": "简洁、信息密度高。用词精准，少废话，偏资讯播报风格。",
}


def build_podcast_prompt(
    dashboard: dict,
    persona: str,
    language: str,
    voice_tone: str,
) -> str:
    """Build the Gemini prompt to convert DashboardData into PodcastScript."""
    dashboard_json = json.dumps(dashboard, ensure_ascii=False, indent=2)

    lang_instr = "Use Simplified Chinese for all output text." if language == "zh" else "Use English for all output text."
    persona_instr = (
        "Target audience: AI investor. Focus on funding rounds, market signals, business impact. "
        "Include chapters for todaySignal, metrics, news, socialSignals, deals, majorInsights, agentIntros."
        if persona == "investor"
        else "Target audience: Chinese university student. Use conversational, peer-to-peer voice. "
        "Include chapters for todaySignal, metrics, news, sideHustles, peerStory, todayAction, majorInsights, agentIntros."
    )
    tone_desc = VOICE_TONE_DESCRIPTIONS.get(voice_tone, VOICE_TONE_DESCRIPTIONS["sunny"])

    return f"""You are an AI podcast script writer. Convert the following daily AI intelligence dashboard into a podcast-style script.

{lang_instr}
{persona_instr}

VOICE/TONE for this script: {tone_desc}. Write all content in this style.

Dashboard data (JSON):
{dashboard_json}

Generate ONLY a valid JSON object with this exact structure (no markdown fences):
{{
  "title": "string - podcast title in target language",
  "intro": "string - brief welcome (1-2 sentences)",
  "chapters": [
    {{ "id": "string (kebab-case)", "title": "string", "content": "string - narrative paragraph(s) for this section", "order": 0 }},
    ...
  ],
  "outro": "string - brief sign-off (1-2 sentences)",
  "generatedAt": "ISO8601 string"
}}

Rules:
- Each chapter id should be unique and kebab-case (e.g. today-signal, metrics, news).
- Chapter order must follow: todaySignal -> metrics -> news -> [persona-specific] -> majorInsights -> agentIntros.
- Content in each chapter should be narrative, podcast-ready prose (not bullet lists unless appropriate).
- **Chapter transitions**: Every chapter MUST begin with a brief transition phrase that connects to the previous section (e.g. "接下来聊聊..." / "说到融资动态..." / "Now let's look at..." / "On the deal front..."). The first chapter may start without one if intro leads naturally.
- **Oral style**: Use short sentences, conversational phrasing. Avoid long subordinate clauses and written-language patterns.
- **Pacing**: intro = 1-2 short welcoming sentences; outro = 1-2 natural sign-off sentences.
- Include generatedAt as current ISO timestamp.
- Respond with ONLY the JSON object, no other text.

Example tone (Chinese): "大家好，欢迎收听。先说说今天的重磅——某某公司发布了新模型。接下来看看数据，核心指标这边…"
Example tone (English): "Welcome back. First up: today's big move—Company X unveiled a new model. Now for the numbers…"
"""


def generate_podcast_script(
    dashboard: dict,
    persona: str,
    language: str,
    voice_tone: str,
) -> Optional[dict]:
    """
    Call Gemini to generate a PodcastScript from DashboardData.
    Returns the script dict or None on failure (no API key, exception, invalid JSON).
    """
    if not GEMINI_API_KEY:
        logger.warning("Podcast script: GEMINI_API_KEY not set")
        return None

    try:
        client = GenAIClient(api_key=GEMINI_API_KEY)
        prompt = build_podcast_prompt(dashboard, persona, language, voice_tone)

        response = client.models.generate_content(
            model=PODCAST_MODEL,
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "temperature": 0.3,
            },
        )
        raw = response.text or "{}"
        script = json.loads(raw)

        if not isinstance(script, dict):
            logger.error("Podcast script: response is not a dict")
            return None

        script["generatedAt"] = script.get("generatedAt") or datetime.now(timezone.utc).isoformat()
        return script
    except json.JSONDecodeError as exc:
        logger.error("Podcast script: invalid JSON from Gemini: %s", exc)
        return None
    except Exception as exc:
        logger.error("Podcast script generation failed: %s", exc)
        return None
