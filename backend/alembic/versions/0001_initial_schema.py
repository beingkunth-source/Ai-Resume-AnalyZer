"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-09-09
"""
from alembic import op
import sqlalchemy as sa

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table("users", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("name", sa.String(length=120), nullable=False), sa.Column("email", sa.String(length=320), nullable=False), sa.Column("password_hash", sa.String(length=255), nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), nullable=False))
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_table("resumes", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False), sa.Column("filename", sa.String(length=255), nullable=False), sa.Column("file_path", sa.String(length=500), nullable=False), sa.Column("raw_text", sa.Text(), nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), nullable=False))
    op.create_index("ix_resumes_user_id", "resumes", ["user_id"])
    op.create_table("resume_analyses", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("resume_id", sa.Integer(), sa.ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False), sa.Column("overall_score", sa.Float(), nullable=False), sa.Column("ats_score", sa.Float(), nullable=False), sa.Column("skills_score", sa.Float(), nullable=False), sa.Column("experience_score", sa.Float(), nullable=False), sa.Column("education_score", sa.Float(), nullable=False), sa.Column("projects_score", sa.Float(), nullable=False), sa.Column("formatting_score", sa.Float(), nullable=False), sa.Column("keyword_score", sa.Float(), nullable=False), sa.Column("impact_score", sa.Float(), nullable=False), sa.Column("analysis_json", sa.JSON(), nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), nullable=False))
    op.create_index("ix_resume_analyses_resume_id", "resume_analyses", ["resume_id"])
    op.create_table("job_descriptions", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False), sa.Column("title", sa.String(length=255), nullable=False), sa.Column("company", sa.String(length=255)), sa.Column("description", sa.Text(), nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), nullable=False))
    op.create_index("ix_job_descriptions_user_id", "job_descriptions", ["user_id"])
    op.create_table("job_matches", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("resume_id", sa.Integer(), sa.ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False), sa.Column("job_id", sa.Integer(), sa.ForeignKey("job_descriptions.id", ondelete="CASCADE"), nullable=False), sa.Column("match_score", sa.Float(), nullable=False), sa.Column("matched_skills", sa.JSON(), nullable=False), sa.Column("missing_skills", sa.JSON(), nullable=False), sa.Column("matched_keywords", sa.JSON(), nullable=False), sa.Column("missing_keywords", sa.JSON(), nullable=False), sa.Column("recommendations", sa.JSON(), nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), nullable=False))
    op.create_index("ix_job_matches_resume_id", "job_matches", ["resume_id"])
    op.create_index("ix_job_matches_job_id", "job_matches", ["job_id"])


def downgrade() -> None:
    op.drop_table("job_matches")
    op.drop_table("job_descriptions")
    op.drop_table("resume_analyses")
    op.drop_table("resumes")
    op.drop_table("users")
