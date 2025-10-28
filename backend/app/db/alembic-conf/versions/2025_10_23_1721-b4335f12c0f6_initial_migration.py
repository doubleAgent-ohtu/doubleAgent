"""Initial migration

Revision ID: b4335f12c0f6
Revises:
Create Date: 2025-10-23 17:21:56.872485

"""

from typing import Sequence, Union

from alembic import op
from sqlalchemy import Column, Integer, String, DateTime, func


# revision identifiers, used by Alembic.
revision: str = "b4335f12c0f6"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "prompt",
        Column("id", Integer, primary_key=True),
        Column("user", String()),
        Column("agent_name", String(50), server_default="unknown"),
        Column("prompt", String(4000), nullable=False),
        Column("created_at", DateTime(timezone=True), server_default=func.now()),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table("prompt")
