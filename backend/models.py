"""
models.py - Pydantic schemas for request/response validation
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


# ── Auth ───────────────────────────────────────────────────────────────────────
class SignupRequest(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str
    email: str
    plan: str


# ── Generation request ────────────────────────────────────────────────────────
class GenerateRequest(BaseModel):
    code: Optional[str] = Field(None, min_length=10)
    url: Optional[str] = Field(None)
    screenshot_b64: Optional[str] = Field(None)
    language: str = Field(default="python")
    input_type: str = Field(default="code")  # code | requirement | url | screenshot
    title: Optional[str] = None


# ── Test / Edge case sub-schemas ───────────────────────────────────────────────
class TestCase(BaseModel):
    id: str
    name: str
    description: str
    input: str
    expected_output: str
    category: str
    priority: str

class EdgeCase(BaseModel):
    id: str
    scenario: str
    description: str
    risk_level: str
    suggestion: str


# ── Bug prediction sub-schema ─────────────────────────────────────────────────
class BugPrediction(BaseModel):
    id: str
    title: str
    description: str
    severity: str
    line_hint: Optional[str] = None
    category: str


# ── Fix suggestion sub-schema ─────────────────────────────────────────────────
class FixSuggestion(BaseModel):
    id: str
    bug_title: str
    fix_title: str
    explanation: str
    code_snippet: str
    effort: str
    impact: str


# ── Full generation response ───────────────────────────────────────────────────

class GenerateResponse(BaseModel):
    run_id: int
    test_cases: List[TestCase]
    edge_cases: List[EdgeCase]
    bug_predictions: List[BugPrediction]
    fix_suggestions: List[FixSuggestion]
    functional_tests: List = []  # NEW: UI functional tests
    coverage_score: float
    coverage_breakdown: dict
    explanation: str
    improvements: List[str]
    language: str
    ui_analysis: dict = {}  # NEW: Raw UI data for frontend
    generated_at: str


# ── History ────────────────────────────────────────────────────────────────────
class HistoryItem(BaseModel):
    id: int
    title: str
    language: str
    coverage_score: float
    created_at: str
    input_preview: str
    bug_count: int = 0

class HistoryResponse(BaseModel):
    items: List[HistoryItem]
    total: int

class RunDetailResponse(BaseModel):
    id: int
    title: str
    input_code: str
    language: str
    test_cases: List[TestCase]
    edge_cases: List[EdgeCase]
    functional_tests: List = []  # NEW
    bug_predictions: List[BugPrediction]
    fix_suggestions: List[FixSuggestion]
    coverage_score: float
    coverage_breakdown: dict
    explanation: str
    improvements: List[str]
    ui_analysis: Optional[dict] = None
    created_at: str
    source: str


# ── Usage ──────────────────────────────────────────────────────────────────────
class UsageResponse(BaseModel):
    used: int
    limit: int
    plan: str
    remaining: int


# ── Settings ──────────────────────────────────────────────────────────────────
class UpdateSettingsRequest(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    current_password: Optional[str] = None
    new_password: Optional[str] = Field(None, min_length=6)

class SettingsResponse(BaseModel):
    username: str
    email: str
    plan: str
    member_since: str
    total_runs: int
    usage_today: int
    usage_limit: int
