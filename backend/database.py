"""
database.py - SQLite database setup using SQLAlchemy ORM
"""

from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

# ── Database URL ──────────────────────────────────────────────────────────────
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./qa_agent.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # Required for SQLite
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ── ORM Models ─────────────────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id         = Column(Integer, primary_key=True, index=True)
    email      = Column(String(255), unique=True, index=True, nullable=False)
    username   = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    usage_count = Column(Integer, default=0)          # Requests today
    usage_date  = Column(String(20), default="")      # YYYY-MM-DD of last reset
    plan        = Column(String(20), default="free")  # free | pro


class TestRun(Base):
    __tablename__ = "test_runs"

    id             = Column(Integer, primary_key=True, index=True)
    user_id        = Column(Integer, nullable=False, index=True)
    title          = Column(String(255), default="Untitled Run")
    input_code         = Column(Text, nullable=False)
    input_url           = Column(Text, nullable=True)
    input_screenshot_b64= Column(Text, nullable=True)
    input_type          = Column(String(50), default="code")   # code | requirement | url | screenshot
    language            = Column(String(50), default="python")
    test_cases          = Column(Text, default="")    # JSON string
    edge_cases          = Column(Text, default="")    # JSON string
    functional_tests    = Column(Text, default="")    # NEW: JSON UI tests
    ui_bugs             = Column(Text, default="")    # NEW: JSON UI bugs
    coverage_score = Column(Float, default=0.0)
    explanation    = Column(Text, default="")
    created_at     = Column(DateTime, default=datetime.utcnow)
    source         = Column(String(255), default="")  # GitHub URL if from GH


# ── Helpers ────────────────────────────────────────────────────────────────────
def get_db():
    """Dependency: yields a DB session and ensures it's closed after use."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """Create all tables in the database."""
    Base.metadata.create_all(bind=engine)
