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
    host_name: str = "小智",
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

    # Intro format: 禁止「欢迎收听」，使用固定句式
    intro_zh = f'这是你的今日份「第一杯」，我是 {host_name}，建议趁热饮用。'
    intro_en = f"This is your first cup of today. I'm {host_name}. Drink it while it's hot."
    intro_rule = (
        f"- **INTRO (mandatory)**: Must use exactly: {intro_zh}"
        if language == "zh"
        else f"- **INTRO (mandatory)**: Must use exactly: {intro_en}"
    )
    intro_rule += " Do NOT say 「欢迎收听」 or \"Welcome to listen\"."

    # Student mode outro: 必须包含「今日只做一件事」
    student_outro = ""
    if persona == "student":
        student_outro = """
- **OUTRO (Student only, mandatory)**: The outro MUST end with the 「今日只做一件事」 action instruction. Use the concrete action from the dashboard's todayAction field. Format: "今日只做一件事：{action}" (Chinese) or "Today's one thing: {action}" (English).
"""

    return f"""You are an AI podcast script writer. Convert the following daily AI intelligence dashboard into a ~60-second broadcast-style script.

{lang_instr}
{persona_instr}

VOICE/TONE for this script: {tone_desc}. Write all content in this style.

Dashboard data (JSON):
{dashboard_json}

Generate ONLY a valid JSON object with this exact structure (no markdown fences):
{{
  "title": "string - podcast title in target language",
  "intro": "string - opening using the mandatory format below",
  "chapters": [
    {{ "id": "string (kebab-case)", "title": "string", "content": "string - narrative with rhythm markers", "order": 0 }},
    ...
  ],
  "outro": "string - sign-off (Student: must include 今日只做一件事 action)",
  "generatedAt": "ISO8601 string"
}}

Rules:
{intro_rule}
- **Duration**: The entire script must be ~60 seconds when read aloud. Prioritize: todaySignal, key metrics, 1-2 news items, todayAction (Student). Condense or omit rest.
- Each chapter id should be unique and kebab-case (e.g. today-signal, metrics, news).
- Chapter order must follow: todaySignal -> metrics -> news -> [persona-specific] -> majorInsights -> agentIntros.
- **Rhythm markers**: Use short sentences. At section transitions and key moments, insert [停顿] or [语气上扬] where appropriate. Example: "先说说今天的重磅。[停顿] OpenAI 发布了新模型。[语气上扬] 这对行业意味着什么？" / "First up.[停顿] Company X unveiled a new model.[语气上扬] What does that mean?"
- Content in each chapter: narrative, podcast-ready prose (not bullet lists). Include [停顿] between major points.
- **Chapter transitions**: Every chapter MUST begin with a brief transition phrase (e.g. "接下来聊聊..." / "说到融资动态..." / "Now let's look at...").
- **Oral style**: Short sentences, conversational phrasing. Avoid long subordinate clauses.
- Include generatedAt as current ISO timestamp.
- Respond with ONLY the JSON object, no other text.
{student_outro}

Example intro (Chinese): {intro_zh}
Example intro (English): {intro_en}
Example content with rhythm: "先说说今天的重磅。[停顿] 某某公司发布了新模型。[语气上扬] 这对行业意味着什么？接下来看看数据。[停顿]"
"""


def generate_podcast_script(
    dashboard: dict,
    persona: str,
    language: str,
    voice_tone: str,
    host_name: str = "小智",
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
        prompt = build_podcast_prompt(dashboard, persona, language, voice_tone, host_name)

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
