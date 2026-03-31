#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# setup.sh — One-shot setup + run script for AI QA Automation Agent
# Usage:
#   chmod +x setup.sh
#   ./setup.sh          # Setup both backend and frontend
#   ./setup.sh backend  # Setup + run backend only
#   ./setup.sh frontend # Setup + run frontend only
# ──────────────────────────────────────────────────────────────────────────────

set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${CYAN}[QA Agent]${NC} $1"; }
ok()   { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }

# ── Backend setup ──────────────────────────────────────────────────────────────
setup_backend() {
  log "Setting up backend…"
  cd "$ROOT/backend"

  if [ ! -d ".venv" ]; then
    python3 -m venv .venv
    ok "Virtual environment created"
  fi

  source .venv/bin/activate
  pip install -q --upgrade pip
  pip install -q -r requirements.txt
  ok "Python dependencies installed"

  # Copy .env if not present
  if [ ! -f ".env" ]; then
    cp .env.example .env
    warn "Created .env from .env.example — add your GROQ_API_KEY for LLM features"
  fi

  ok "Backend ready"
}

# ── Frontend setup ─────────────────────────────────────────────────────────────
setup_frontend() {
  log "Setting up frontend…"
  cd "$ROOT/frontend"

  if ! command -v node &>/dev/null; then
    echo "❌ Node.js is not installed. Please install from https://nodejs.org"
    exit 1
  fi

  npm install --silent
  ok "Frontend dependencies installed"
  ok "Frontend ready"
}

# ── Run backend ────────────────────────────────────────────────────────────────
run_backend() {
  cd "$ROOT/backend"
  source .venv/bin/activate
  export $(grep -v '^#' .env | xargs) 2>/dev/null || true
  log "Starting backend on http://localhost:8000 …"
  uvicorn main:app --reload --host 0.0.0.0 --port 8000
}

# ── Run frontend ───────────────────────────────────────────────────────────────
run_frontend() {
  cd "$ROOT/frontend"
  log "Starting frontend on http://localhost:5173 …"
  npm run dev
}

# ── Main ───────────────────────────────────────────────────────────────────────
case "${1:-}" in
  backend)
    setup_backend
    run_backend
    ;;
  frontend)
    setup_frontend
    run_frontend
    ;;
  *)
    setup_backend
    setup_frontend
    echo ""
    log "Setup complete! Now run in TWO separate terminals:"
    echo ""
    echo "  Terminal 1 (backend):"
    echo "    cd backend && source .venv/bin/activate && uvicorn main:app --reload"
    echo ""
    echo "  Terminal 2 (frontend):"
    echo "    cd frontend && npm run dev"
    echo ""
    echo "  Then open: http://localhost:5173"
    echo ""
    ;;
esac
