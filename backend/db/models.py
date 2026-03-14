"""SQLAlchemy ORM models for the AI Pulse pipeline."""
from datetime import datetime, timezone
from sqlalchemy import (
    BigInteger, Boolean, Column, DateTime, Float, Index,
    Integer, String, Text, UniqueConstraint, ForeignKey,
)
from sqlalchemy.dialects.postgresql import JSONB
from backend.db.connection import Base


def _utcnow():
    return datetime.now(timezone.utc)


class RawItem(Base):
    """Stage 1 output: raw items fetched from all data sources."""
    __tablename__ = "raw_items"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    url = Column(Text, nullable=False)
    url_hash = Column(String(64), nullable=False, unique=True, index=True)  # SHA-256 hex
    title = Column(Text, nullable=True)
    body_text = Column(Text, nullable=True)
    source_type = Column(String(32), nullable=False)  # rss | github | twitter | youtube
    source_name = Column(String(128), nullable=True)  # e.g. "TechCrunch", "@sama"
    language_detected = Column(String(8), nullable=True)  # "zh" | "en" | …
    fetched_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)

    __table_args__ = (
        Index("ix_raw_items_fetched_at", "fetched_at"),
        Index("ix_raw_items_source_type", "source_type"),
    )

    def __repr__(self):
        return f"<RawItem id={self.id} source={self.source_type} url={self.url[:60]}>"


class ProcessedItem(Base):
    """Stage 3 output: AI-scored and summarised items."""
    __tablename__ = "processed_items"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    raw_id = Column(BigInteger, ForeignKey("raw_items.id", ondelete="CASCADE"), nullable=False, index=True)
    original_url = Column(Text, nullable=False)
    title_zh = Column(Text, nullable=False)
    summary_zh = Column(Text, nullable=False)
    score = Column(Float, nullable=False)  # 1–10 relevance score
    category = Column(String(32), nullable=False)  # product|funding|policy|tech|research
    source_name = Column(String(128), nullable=True)
    source_type = Column(String(32), nullable=True)
    processed_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)

    __table_args__ = (
        Index("ix_processed_items_score", "score"),
        Index("ix_processed_items_processed_at", "processed_at"),
        Index("ix_processed_items_category", "category"),
    )

    def __repr__(self):
        return f"<ProcessedItem id={self.id} score={self.score} category={self.category}>"


class DailySnapshot(Base):
    """Stage 4 output: assembled DashboardData JSON keyed by date/persona/language."""
    __tablename__ = "daily_snapshots"

    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(String(10), nullable=False)       # YYYY-MM-DD
    persona = Column(String(16), nullable=False)     # investor | student
    language = Column(String(4), nullable=False)     # zh | en
    snapshot_json = Column(JSONB, nullable=False)
    is_breaking_news = Column(Boolean, default=False)
    produced_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("date", "persona", "language", name="uq_snapshot_date_persona_lang"),
        Index("ix_daily_snapshots_date", "date"),
    )

    def __repr__(self):
        return f"<DailySnapshot date={self.date} persona={self.persona} lang={self.language}>"
