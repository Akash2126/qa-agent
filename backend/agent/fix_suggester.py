"""
agent/fix_suggester.py - Step 3c: Generate concrete fix suggestions for predicted bugs.
"""

import json
import uuid
import httpx
from typing import List, Dict, Any
from .ollama_helper import call_llama


async def generate_fix_suggestions(
    analysis: Dict[str, Any],
    bugs: List[Dict],
) -> List[Dict]:
    """Generate actionable, code-level fix suggestions for each predicted bug."""
    try:
        return await _suggest_via_llm(analysis, bugs)
    except Exception as e:
        print(f"[FixSuggester LLM] failed: {e}")
        return _suggest_via_templates(analysis, bugs)


# ── LLM path ───────────────────────────────────────────────────────────────────
async def _suggest_via_llm(analysis: Dict[str, Any], bugs: List[Dict]) -> List[Dict]:
    code = analysis["raw_code"]
    lang = analysis["language"]
    bug_list = [{"title": b["title"], "category": b["category"]} for b in bugs[:5]]

    system = (
        "You are a senior software engineer providing fix suggestions. "
        "Return ONLY a valid JSON array. Each fix must have: "
        "id (string), bug_title (string), fix_title (string), "
        "explanation (string), code_snippet (string — the fixed code example), "
        "effort (quick|moderate|significant), impact (high|medium|low)."
    )
    prompt = f"""
Given this {lang} code and the following predicted bugs, generate concrete fix suggestions:

Code:
```{lang}
{code[:2500]}
```

Bugs to fix:
{json.dumps(bug_list, indent=2)}

For each bug, provide a specific fix with a short corrected code snippet.
Return JSON array of fix suggestion objects only.
"""
    llm_response = await call_llama(prompt, system)
    raw = llm_response.strip()
    raw = raw.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    return json.loads(raw)


# ── Template path ──────────────────────────────────────────────────────────────
def _suggest_via_templates(analysis: Dict[str, Any], bugs: List[Dict]) -> List[Dict]:
    lang = analysis["language"]
    fixes = []

    TEMPLATE_MAP = {
        "unhandled_exception": {
            "fix_title": "Wrap with try/except and log errors",
            "explanation": "Surround the risky operation with a try/except block. Catch specific exceptions rather than bare Exception where possible. Always log or re-raise so callers know what went wrong.",
            "code_snippet": (
                "# Before\ndef process(data):\n    return risky_operation(data)\n\n"
                "# After\ndef process(data):\n    try:\n        return risky_operation(data)\n"
                "    except ValueError as e:\n        logger.error(f'process failed: {e}')\n        raise"
            ) if lang == "python" else (
                "// Before\nfunction process(data) { return riskyOp(data); }\n\n"
                "// After\nasync function process(data) {\n  try {\n    return await riskyOp(data);\n"
                "  } catch (err) {\n    console.error('process failed:', err);\n    throw err;\n  }\n}"
            ),
            "effort": "quick", "impact": "high",
        },
        "off_by_one": {
            "fix_title": "Use enumerate() and validate bounds explicitly",
            "explanation": "Prefer enumerate() over manual index arithmetic. When slicing, test with len-1 boundary inputs. Use range(len(x)) rather than range(len(x)+1) unless the extra iteration is intentional.",
            "code_snippet": (
                "# Before\nfor i in range(len(items) + 1):  # BUG\n    print(items[i])\n\n"
                "# After\nfor i, item in enumerate(items):  # safe\n    print(item)"
            ),
            "effort": "quick", "impact": "high",
        },
        "recursion_overflow": {
            "fix_title": "Add base-case guard and depth limit",
            "explanation": "Add an explicit depth parameter with a maximum value. Consider converting deep recursion to an iterative solution with an explicit stack for inputs larger than a few thousand.",
            "code_snippet": (
                "import sys\nMAX_DEPTH = 500\n\ndef recurse(node, depth=0):\n"
                "    if depth > MAX_DEPTH:\n        raise RecursionError('Max depth exceeded')\n"
                "    if not node:  # base case\n        return\n    recurse(node.next, depth + 1)"
            ),
            "effort": "moderate", "impact": "high",
        },
        "null_reference": {
            "fix_title": "Add explicit None/null guards at entry points",
            "explanation": "Validate all nullable parameters at the top of each function. Use early-return guards rather than nested conditionals for cleaner code.",
            "code_snippet": (
                "# Before\ndef process(user):\n    return user.name.upper()\n\n"
                "# After\ndef process(user):\n    if user is None:\n        raise ValueError('user cannot be None')\n"
                "    if not user.name:\n        return ''\n    return user.name.upper()"
            ) if lang == "python" else (
                "// Before\nfunction process(user) { return user.name.toUpperCase(); }\n\n"
                "// After\nfunction process(user) {\n  if (!user) throw new Error('user is required');\n"
                "  return user?.name?.toUpperCase() ?? '';\n}"
            ),
            "effort": "quick", "impact": "high",
        },
        "security": {
            "fix_title": "Move secrets to environment variables",
            "explanation": "Never hardcode credentials. Use os.environ or a secrets manager. Add the secrets file to .gitignore immediately. Rotate any credentials that may have been committed.",
            "code_snippet": (
                "# Before\nAPI_KEY = 'sk-abc123'\n\n"
                "# After\nimport os\nAPI_KEY = os.environ.get('API_KEY')\n"
                "if not API_KEY:\n    raise RuntimeError('API_KEY env var not set')"
            ),
            "effort": "quick", "impact": "high",
        },
        "logic_error": {
            "fix_title": "Review and correct conditional logic",
            "explanation": "Logic errors often appear as inverted conditions, wrong operator precedence, or missing negation. Add unit tests for both the true and false branches of every condition.",
            "code_snippet": (
                "# Before (mutable default — shared state bug)\ndef append(item, lst=[]):\n    lst.append(item)\n    return lst\n\n"
                "# After\ndef append(item, lst=None):\n    if lst is None:\n        lst = []\n    lst.append(item)\n    return lst"
            ),
            "effort": "quick", "impact": "medium",
        },
        "memory": {
            "fix_title": "Use context managers for resource cleanup",
            "explanation": "Always open files, database connections, and network sockets inside a `with` block (Python) or try-finally (other languages) to guarantee cleanup even if an exception occurs.",
            "code_snippet": (
                "# Before\nf = open('data.txt')\ndata = f.read()  # if exception here, never closed\nf.close()\n\n"
                "# After\nwith open('data.txt') as f:\n    data = f.read()  # always closed"
            ),
            "effort": "quick", "impact": "medium",
        },
        "race_condition": {
            "fix_title": "Use locks or atomic operations for shared state",
            "explanation": "Protect shared mutable state with asyncio.Lock (async) or threading.Lock (threads). Prefer immutable data structures or message passing to eliminate sharing altogether.",
            "code_snippet": (
                "import asyncio\n_lock = asyncio.Lock()\n\nasync def safe_update(counter):\n"
                "    async with _lock:\n        counter['value'] += 1  # atomic"
            ),
            "effort": "significant", "impact": "high",
        },
    }

    for bug in bugs[:6]:
        cat     = bug.get("category", "logic_error")
        tmpl    = TEMPLATE_MAP.get(cat, TEMPLATE_MAP["logic_error"])
        fixes.append({
            "id":          str(uuid.uuid4())[:8],
            "bug_title":   bug["title"],
            "fix_title":   tmpl["fix_title"],
            "explanation": tmpl["explanation"],
            "code_snippet": tmpl["code_snippet"],
            "effort":      tmpl["effort"],
            "impact":      tmpl["impact"],
        })

    return fixes

