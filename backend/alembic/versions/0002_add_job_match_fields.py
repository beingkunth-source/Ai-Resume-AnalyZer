"""add partially_matched_skills and analysis_json to job_matches

Revision ID: 0002_add_job_match_fields
Revises: 0001_initial
Create Date: 2026-09-09
"""
from alembic import op
import sqlalchemy as sa

revision = "0002_add_job_match_fields"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("job_matches", sa.Column("partially_matched_skills", sa.JSON(), nullable=False, server_default="[]"))
    op.add_column("job_matches", sa.Column("analysis_json", sa.JSON(), nullable=False, server_default="{}"))
    op.alter_column("job_matches", "partially_matched_skills", server_default=None)
    op.alter_column("job_matches", "analysis_json", server_default=None)


def downgrade() -> None:
    op.drop_column("job_matches", "analysis_json")
    op.drop_column("job_matches", "partially_matched_skills")
