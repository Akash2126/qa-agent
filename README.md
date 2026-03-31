# ⚡ AI QA Automation Agent

> **SaaS-ready full-stack app** that auto-generates test cases, edge cases, coverage scores, and explanations from code or requirements — powered by a 5-step agentic AI pipeline.

---

## 🗂️ Folder Structure

```
qa-agent/
├── backend/
│   ├── main.py            ← FastAPI app + all API routes
│   ├── auth.py            ← JWT auth + password hashing + usage limiter
│   ├── database.py        ← SQLite/SQLAlchemy ORM models
│   ├── models.py          ← Pydantic request/response schemas
│   ├── requirements.txt
│   ├── .env.example
│   └── agent/
│       ├── analyzer.py    ← Step 1: Code structure analysis
│       ├── generator.py   ← Step 2: Test case generation
│       ├── edge_cases.py  ← Step 3: Edge case detection
│       ├── coverage.py    ← Step 4: Coverage evaluation
│       └── improver.py    ← Step 5: Explanation + improvements
│
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       ├── context/
│       │   └── AuthContext.jsx
│       ├── services/
│       │   ├── api.js
│       │   └── exportUtils.js
│       ├── hooks/
│       │   └── useDebounce.js
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── HistorySidebar.jsx
│       │   ├── GitHubImport.jsx
│       │   ├── TestCasesPanel.jsx
│       │   ├── EdgeCasesPanel.jsx
│       │   ├── CoveragePanel.jsx
│       │   ├── ExplanationPanel.jsx
│       │   └── LoadingSkeleton.jsx
│       └── pages/
│           ├── LoginPage.jsx
│           ├── SignupPage.jsx
│           └── DashboardPage.jsx
│
├── setup.sh               ← One-shot setup script
└── README.md
```

---

## 🚀 Quick Start (Recommended)

```bash
git clone <your-repo>
cd qa-agent
chmod +x setup.sh
./setup.sh
```

Then follow the terminal output instructions.

---

## 🛠️ Manual Setup

### Prerequisites
- **Python 3.9+**
- **Node.js 18+**

---

### 1️⃣ Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and optionally add GROQ_API_KEY
```

### 2️⃣ Start Backend

```bash
# From the backend/ directory, venv activated:
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API runs at: **http://localhost:8000**  
Swagger docs: **http://localhost:8000/docs**

---

### 3️⃣ Frontend Setup

```bash
cd frontend
npm install
```

### 4️⃣ Start Frontend

```bash
npm run dev
```

App runs at: **http://localhost:5173**

---

## 🌍 Environment Variables

| Variable     | Default                       | Description                                     |
|-------------|-------------------------------|--------------------------------------------------|
| `SECRET_KEY` | `your-super-secret-jwt-key…`  | JWT signing secret — **change in production**    |
| `DATABASE_URL`| `sqlite:///./qa_agent.db`    | SQLite DB path (or any SQLAlchemy URL)           |
| `GROQ_API_KEY`| *(empty)*                    | Groq API key for LLM-powered generation (free)  |

### Getting a Free Groq API Key

1. Go to [https://console.groq.com](https://console.groq.com)
2. Sign up (free) → Create API key
3. Add to `backend/.env`:  `GROQ_API_KEY=gsk_...`

> **No Groq key?** The app still works with built-in template-based generation — fully offline.

---

## 📡 API Reference

| Method | Endpoint           | Auth | Description                          |
|--------|--------------------|------|--------------------------------------|
| POST   | `/signup`          | No   | Register new user                    |
| POST   | `/login`           | No   | Login → JWT token                    |
| POST   | `/generate`        | JWT  | Run 5-step AI pipeline               |
| GET    | `/history`         | JWT  | List past runs (paginated)           |
| GET    | `/history/{id}`    | JWT  | Get single run detail                |
| DELETE | `/history/{id}`    | JWT  | Delete a run                         |
| POST   | `/save/{id}`       | JWT  | Update run title                     |
| GET    | `/usage`           | JWT  | Get daily usage stats                |
| GET    | `/github/files`    | JWT  | List files in a public GH repo       |
| GET    | `/github/file`     | JWT  | Get raw file content from GH         |

---

## 🤖 AI Pipeline (5 Steps)

```
Input Code / Requirements
       │
       ▼
┌─────────────────────┐
│  1. analyzer.py     │  → Detects functions, classes, patterns, complexity
└─────────────────────┘
       │
       ▼
┌─────────────────────┐
│  2. generator.py    │  → LLM / template → 6–10 test cases (unit, integration, functional)
└─────────────────────┘
       │
       ▼
┌─────────────────────┐
│  3. edge_cases.py   │  → LLM / heuristics → 4–8 edge cases with risk levels
└─────────────────────┘
       │
       ▼
┌─────────────────────┐
│  4. coverage.py     │  → Weighted coverage score + breakdown (5 dimensions)
└─────────────────────┘
       │
       ▼
┌─────────────────────┐
│  5. improver.py     │  → Plain-English explanation + improvement actions
└─────────────────────┘
       │
       ▼
    JSON Response → Frontend
```

---

## 💸 SaaS Plan Limits

| Plan | Requests/day | DB field      |
|------|-------------|----------------|
| Free | 10          | `user.plan = "free"` |
| Pro  | 500         | `user.plan = "pro"`  |

To upgrade a user manually:
```sql
UPDATE users SET plan = 'pro' WHERE email = 'user@example.com';
```

---

## 🎯 Frontend Features

- ✅ Monaco Editor (code input with syntax highlighting)
- ✅ Auto-run on paste (debounced 2s)
- ✅ Output tabs: Test Cases / Edge Cases / Coverage / Explanation
- ✅ Copy button for each test case
- ✅ Coverage ring gauge + breakdown bars
- ✅ Download JSON or PDF report (jsPDF)
- ✅ History sidebar with search + delete
- ✅ GitHub public repo import
- ✅ Mobile responsive layout
- ✅ JWT auth (login / signup)

---

## 🏗️ Production Notes

- Replace `sqlite:///./qa_agent.db` with PostgreSQL for production
- Set a strong random `SECRET_KEY` (e.g. `openssl rand -hex 32`)
- Add HTTPS via nginx or a cloud reverse proxy
- Use environment secrets manager (not `.env` files) in production
