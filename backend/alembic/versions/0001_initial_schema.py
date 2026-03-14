"""Initial schema: raw_items, processed_items, daily_snapshots

Revision ID: 0001
Revises:
Create Date: 2026-03-14 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "raw_items",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("url", sa.Text(), nullable=False),
        sa.Column("url_hash", sa.String(64), nullable=False),
        sa.Column("title", sa.Text(), nullable=True),
        sa.Column("body_text", sa.Text(), nullable=True),
        sa.Column("source_type", sa.String(32), nullable=False),
        sa.Column("source_name", sa.String(128), nullable=True),
        sa.Column("language_detected", sa.String(8), nullable=True),
        sa.Column("fetched_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("url_hash", name="uq_raw_items_url_hash"),
    )
    op.create_index("ix_raw_items_url_hash", "raw_items", ["url_hash"])
    op.create_index("ix_raw_items_fetched_at", "raw_items", ["fetched_at"])
    op.create_index("ix_raw_items_source_type", "raw_items", ["source_type"])

    op.create_table(
        "processed_items",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("raw_id", sa.BigInteger(), nullable=False),
        sa.Column("original_url", sa.Text(), nullable=False),
        sa.Column("title_zh", sa.Text(), nullable=False),
        sa.Column("summary_zh", sa.Text(), nullable=False),
        sa.Column("score", sa.Float(), nullable=False),
        sa.Column("category", sa.String(32), nullable=False),
        sa.Column("source_name", sa.String(128), nullable=True),
        sa.Column("source_type", sa.String(32), nullable=True),
        sa.Column("processed_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["raw_id"], ["raw_items.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_processed_items_raw_id", "processed_items", ["raw_id"])
    op.create_index("ix_processed_items_score", "processed_items", ["score"])
    op.create_index("ix_processed_items_processed_at", "processed_items", ["processed_at"])
    op.create_index("ix_processed_items_category", "processed_items", ["category"])

    op.create_table(
        "daily_snapshots",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("date", sa.String(10), nullable=False),
        sa.Column("persona", sa.String(16), nullable=False),
        sa.Column("language", sa.String(4), nullable=False),
        sa.Column("snapshot_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("is_breaking_news", sa.Boolean(), nullable=True),
        sa.Column("produced_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("date", "persona", "language", name="uq_snapshot_date_persona_lang"),
    )
    op.create_index("ix_daily_snapshots_date", "daily_snapshots", ["date"])


def downgrade() -> None:
    op.drop_table("daily_snapshots")
    op.drop_table("processed_items")
    op.drop_table("raw_items")
