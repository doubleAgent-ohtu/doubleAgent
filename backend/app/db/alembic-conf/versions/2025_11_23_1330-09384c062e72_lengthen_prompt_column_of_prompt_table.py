"""Lengthen the prompt column of the prompt table.
Additionally, set the nullable value of the user column to false.

Revision ID: 09384c062e72
Revises: b4335f12c0f6
Create Date: 2025-11-23 13:30:12.294128

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "09384c062e72"
down_revision: Union[str, Sequence[str], None] = "b4335f12c0f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.alter_column(
        table_name="prompt",
        column_name="prompt",
        existing_type=sa.String(length=4000),
        type_=sa.String(length=15000),
        existing_nullable=False,
    )
    op.alter_column(
        table_name="prompt",
        column_name="user",
        nullable=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column(
        table_name="prompt",
        column_name="prompt",
        existing_type=sa.String(length=15000),
        type_=sa.String(length=4000),
        existing_nullable=False,
    )
    op.alter_column(
        table_name="prompt",
        column_name="user",
        nullable=True,
    )
