"""Add published_at to raw_items and source_published_at to processed_items

Revision ID: 0002
Revises: 0001
Create Date: 2026-03-14 00:00:00.000001

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "raw_items",
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "processed_items",
        sa.Column("source_published_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("processed_items", "source_published_at")
    op.drop_column("raw_items", "published_at")
