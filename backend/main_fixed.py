"main.py - FastAPI application — AI QA Automation Agent (upgraded)"

from fastapi import FastAPI, Depends, HTTPException, status
import traceback
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
import json, httpx

from database import create_tables, get_db, User, TestRun
from auth import (
    hash_password, verify_password, create_access_token,
    get_current_user, check_and_increment_usage, DAILY_LIMITS,
)
from models import (
    SignupRequest, LoginRequest, TokenResponse,
    GenerateRequest, GenerateResponse,
    HistoryResponse, HistoryItem, RunDetailResponse, UsageResponse,
    UpdateSettingsRequest, SettingsResponse,
)
from agent.analyzer          import analyze_code
from agent.generator         import generate_test_cases
from agent.edge_cases        import detect_edge_cases
from agent.bug_predictor     import predict_bugs
from agent.fix_suggester     import generate_fix_suggestions
from agent.coverage          import evaluate_coverage
from agent.improver          import generate_explanation_and_improvements
from agent.ui_analyzer       import analyze_url
from agent.vision_analyzer   import analyze_screenshot
from agent.functional_tester import generate_functional_test_cases
from agent.ui_bug_detector   import predict_ui_bugs

app = FastAPI(title="AI QA Automation Agent", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[\"http://localhost:5173\", \"http://localhost:3000\"],
    allow_credentials=True, allow_methods=[\"*\"], allow_headers=[\"*\"],
)

@app.on_event(\"startup\")
def on_startup():
    create_tables()

@app.get(\"/\")
def root():
    return {\"status\": \"ok\", \"version\": \"2.0.0\"}


# ══════════════════════════════════════════════════════════════
# AUTH
# ══════════════════════════════════════════════════════════════

@app.post(\"/signup\", response_model=TokenResponse, status_code=201)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(409, \"Email already registered\")
    if db.query(User).filter(User.username == payload.username).first():
        raise HTTPException(409, \"Username already taken\")
    user = User(email=payload.email, username=payload.username,
                hashed_password=hash_password(payload.password))
    db.add(user); db.commit(); db.refresh(user)
    token = create_access_token({\"sub\": str(user.id)})
    return TokenResponse(access_token=token, username=user.username,
                         email=user.email, plan=user.plan)

@app.post(\"/login\", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(401, \"Invalid email or password\")
    token = create_access_token({\"sub\": str(user.id)})
    return TokenResponse(access_token=token, username=user.username,
                         email=user.email, plan=user.plan)


# ══════════════════════════════════════════════════════════════
# GENERATION — 7-step pipeline
# ══════════════════════════════════════════════════════════════

@app.post(\"/generate\", response_model=GenerateResponse)
async def generate(
    payload: GenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    print(f\"[DEBUG] Generate called with input_type={payload.input_type}, has_code={bool(payload.code)}, has_url={bool(payload.url)}, has_screenshot={bool(payload.screenshot_b64)}\")
    
    check_and_increment_usage(current_user, db)

    code_analysis = None
    functional_tests = []
    ui_bugs_list = []
    ui_analysis = None
    test_cases = []
    edge_cases = []
    code_bugs = []
    fixes = []
    coverage = {'score': 0.0, 'breakdown': {}}
    improvement_data = {'explanation': '', 'improvements': []}
    
    try:
        # BRANCH 1: CODE ANALYSIS (existing)
        if payload.input_type in ['code', 'requirement'] and payload.code and len(payload.code) >= 10:
            code_analysis = analyze_code(payload.code, payload.language, payload.input_type)
        elif payload.input_type in ['code', 'requirement'] and not payload.code:
            print(f\"[WARN] No code provided for input_type={payload.input_type}\")
            code_analysis = {}
        
        
        # BRANCH 2: FUNCTIONAL/UI ANALYSIS (new)
        if payload.input_type == 'url' and payload.url:
            try:
                ui_analysis = await analyze_url(payload.url)
                functional_tests = generate_functional_test_cases(ui_analysis or {})
                ui_bugs_list = predict_ui_bugs(ui_analysis or {})
            except Exception as e:
                print(f\"[WARN] UI functional tests failed: {e}\")
                functional_tests = []
                ui_bugs_list = []
                ui_analysis = {}
        elif payload.input_type == 'screenshot' and payload.screenshot_b64:
            try:
                ui_analysis = await analyze_screenshot(payload.screenshot_b64)
                functional_tests = generate_functional_test_cases(ui_analysis or {})
                ui_bugs_list = predict_ui_bugs(ui_analysis or {})
            except Exception as e:
                print(f\"[WARN] UI functional tests failed: {e}\")
                functional_tests = []
                ui_bugs_list = []
                ui_analysis = {}
        
        # CODE PIPELINE (if applicable)
        if code_analysis:
            test_cases      = await generate_test_cases(code_analysis)
            edge_cases      = await detect_edge_cases(code_analysis, test_cases)
            code_bugs       = await predict_bugs(code_analysis)
            fixes           = await generate_fix_suggestions(code_analysis, code_bugs)
            coverage        = evaluate_coverage(code_analysis, test_cases, edge_cases)
        
        improvement_data = await generate_explanation_and_improvements(
            code_analysis or ui_analysis or {}, test_cases, edge_cases, coverage)
    except Exception as pipeline_error:
        print(f\"[ERROR] Pipeline failed: {str(pipeline_error)}\")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f\"Pipeline error: {str(pipeline_error)}\")
    

    title = payload.title or f\"Run — {datetime.utcnow().strftime('%b %d, %H:%M')}\"
    run = TestRun(
        user_id=current_user.id, title=title,
        input_code=payload.code, input_type=payload.input_type,
        language=payload.language,
        test_cases=json.dumps(test_cases),
        edge_cases=json.dumps(edge_cases),
        coverage_score=coverage[\"score\"],
    )
    # Persist bugs+fixes by appending to a secondary JSON blob in explanation col
    run.explanation = json.dumps({
        \"text\": improvement_data.get(\"explanation\", \"\"),
        \"improvements\": improvement_data.get(\"improvements\", []),
        \"bugs\": code_bugs + ui_bugs_list,
        \"fixes\": fixes,
    })
    db.add(run); db.commit(); db.refresh(run)


    return GenerateResponse(
        run_id=run.id,
        test_cases=test_cases,
        edge_cases=edge_cases,
        bug_predictions=code_bugs + ui_bugs_list,  # Merge code + UI bugs
        fix_suggestions=fixes,
        functional_tests=functional_tests,  # NEW
        coverage_score=coverage[\"score\"],
        coverage_breakdown=coverage[\"breakdown\"],
        explanation=improvement_data.get(\"explanation\", \"\"),
        improvements=improvement_data.get(\"improvements\", []),
        language=payload.language,
        ui_analysis=ui_analysis,  # For frontend
        generated_at=datetime.utcnow().isoformat(),
    )


# ══════════════════════════════════════════════════════════════
# HISTORY
# ══════════════════════════════════════════════════════════════

def _parse_explanation_blob(raw: str):
    \"\"\"Parse the extended explanation JSON blob, or return defaults.\"\"\"

    try:
        blob = json.loads(raw)
        if isinstance(blob, dict) and \"text\" in blob:
            return blob
    except Exception:
        pass
    return {\"text\": raw, \"improvements\": [], \"bugs\": [], \"fixes\": []}


@app.get(\"/history\", response_model=HistoryResponse)
def get_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0, limit: int = 20,
):
    runs  = db.query(TestRun).filter(TestRun.user_id == current_user.id)\
               .order_by(TestRun.created_at.desc()).offset(skip).limit(limit).all()
    total = db.query(TestRun).filter(TestRun.user_id == current_user.id).count()

    items = []
    for r in runs:
        blob      = _parse_explanation_blob(r.explanation or \"\")
        bug_count = len(blob.get(\"bugs\", []))
        items.append(HistoryItem(
            id=r.id, title=r.title, language=r.language,
            coverage_score=r.coverage_score,
            created_at=r.created_at.isoformat(),
            input_preview=r.input_code[:100],
            bug_count=bug_count,
        ))
    return HistoryResponse(items=items, total=total)


@app.get(\"/history/{run_id}\", response_model=RunDetailResponse)
def get_run_detail(
    run_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    run = db.query(TestRun).filter(
        TestRun.id == run_id, TestRun.user_id == current_user.id).first()
    if not run:
        raise HTTPException(404, \"Run not found\")

    test_cases = json.loads(run.test_cases) if run.test_cases else []
    edge_cases = json.loads(run.edge_cases) if run.edge_cases else []
    blob       = _parse_explanation_blob(run.explanation or \"\")
    analysis   = analyze_code(run.input_code, run.language, run.input_type)
    coverage   = evaluate_coverage(analysis, test_cases, edge_cases)

    return RunDetailResponse(
        id=run.id, title=run.title, input_code=run.input_code,
        language=run.language, test_cases=test_cases, edge_cases=edge_cases,
        bug_predictions=blob.get(\"bugs\", []),
        fix_suggestions=blob.get(\"fixes\", []),
        coverage_score=run.coverage_score,
        coverage_breakdown=coverage[\"breakdown\"],
        explanation=blob.get(\"text\", \"\"),
        improvements=blob.get(\"improvements\", []),
        created_at=run.created_at.isoformat(),
        source=run.source or \"\",
    )


@app.delete(\"/history/{run_id}\", status_code=204)
def delete_run(run_id: int, db: Session = Depends(get_db),
               current_user: User = Depends(get_current_user)):
    run = db.query(TestRun).filter(
        TestRun.id == run_id, TestRun.user_id == current_user.id).first()
    if not run:
        raise HTTPException(404, \"Run not found\")
    db.delete(run); db.commit()


@app.post(\"/save/{run_id}\")
def save_run(run_id: int, body: dict, db: Session = Depends(get_db),
             current_user: User = Depends(get_current_user)):
    run = db.query(TestRun).filter(TestRun.id == run_id, TestRun.user_id == current_user.id).first()
    if not run:
        raise HTTPException(404, \"Run not found\")
    run.title = body.get(\"title\", run.title)
    db.commit()
    return {\"success\": True, \"title\": run.title}


# ══════════════════════════════════════════════════════════════
# USAGE
# ══════════════════════════════════════════════════════════════

@app.get(\"/usage\", response_model=UsageResponse)
def get_usage(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    today = datetime.utcnow().strftime(\"%Y-%m-%d\")
    used  = current_user.usage_count if current_user.usage_date == today else 0
    limit = DAILY_LIMITS.get(current_user.plan, 10)
    return UsageResponse(used=used, limit=limit, plan=current_user.plan, remaining=max(limit-used, 0))


# ══════════════════════════════════════════════════════════════
# SETTINGS
# ══════════════════════════════════════════════════════════════

@app.get(\"/settings\", response_model=SettingsResponse)
def get_settings(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    today      = datetime.utcnow().strftime(\"%Y-%m-%d\")
    used       = current_user.usage_count if current_user.usage_date == today else 0
    total_runs = db.query(TestRun).filter(TestRun.user_id == current_user.id).count()
    return SettingsResponse(
        username=current_user.username, email=current_user.email,
        plan=current_user.plan,
        member_since=current_user.created_at.strftime(\"%B %Y\"),
        total_runs=total_runs,
        usage_today=used,
        usage_limit=DAILY_LIMITS.get(current_user.plan, 10),
    )

@app.patch(\"/settings\", response_model=SettingsResponse)
def update_settings(
    payload: UpdateSettingsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.username and payload.username != current_user.username:
        if db.query(User).filter(User.username == payload.username).first():
            raise HTTPException(409, \"Username already taken\")
        current_user.username = payload.username

    if payload.new_password:
        if not payload.current_password:
            raise HTTPException(400, \"current_password is required to change password\")
        if not verify_password(payload.current_password, current_user.hashed_password):
            raise HTTPException(401, \"Current password is incorrect\")
        current_user.hashed_password = hash_password(payload.new_password)

    db.commit(); db.refresh(current_user)
    today      = datetime.utcnow().strftime(\"%Y-%m-%d\")
    used       = current_user.usage_count if current_user.usage_date == today else 0
    total_runs = db.query(TestRun).filter(TestRun.user_id == current_user.id).count()
    return SettingsResponse(
        username=current_user.username, email=current_user.email,
        plan=current_user.plan,
        member_since=current_user.created_at.strftime(\"%B %Y\"),
        total_runs=total_runs, usage_today=used,
        usage_limit=DAILY_LIMITS.get(current_user.plan, 10),
    )


# ══════════════════════════════════════════════════════════════
# GITHUB
# ══════════════════════════════════════════════════════════════

@app.get(\"/github/files\")
async def github_list_files(repo_url: str, current_user: User = Depends(get_current_user)):
    try:
parts = repo_url.rstrip("/").split("/")
        owner, repo = parts[-2], parts[-1]
api_url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/HEAD?recursive=1"
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.get(api_url, headers={\"Accept\": \"application/vnd.github.v3+json\"})
            r.raise_for_status()
CODE_EXTS = {'.py', '.js', '.ts', '.java', '.go', '.rb', '.cs', '.cpp', '.rs', '.kt', '.jsx', '.tsx'}
        files = [
            {\"path\": item[\"path\"]}
            for item in r.json().get(\"tree\", [])
            if item[\"type\"] == \"blob\" and any(item[\"path\"].endswith(e) for e in CODE_EXTS)
        ]
        return {\"owner\": owner, \"repo\": repo, \"files\": files[:50]}
    except Exception as e:
        raise HTTPException(400, f\"Failed to fetch repo: {e}\")

@app.get(\"/github/file\")
async def github_get_file(owner: str, repo: str, path: str,
                          current_user: User = Depends(get_current_user)):
    try:
        url = f\"https://raw.githubusercontent.com/{owner}/{repo}/HEAD/{path}\"
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.get(url); r.raise_for_status()
        return {\"path\": path, \"content\": r.text[:10000]}
    except Exception as e:
        raise HTTPException(400, f\"Failed to fetch file: {e}\")

