"""
agent/bug_predictor.py - Step 3b: Predict likely bugs from code analysis
Uses Ollama LLM when available, falls back to heuristic rule engine.
"""

import json
import uuid
import httpx
import re
from typing import List, Dict, Any
from .ollama_helper import call_llama


async def predict_bugs(analysis: Dict[str, Any]) -> List[Dict]:
    """Return a list of predicted bug objects from static analysis + LLM."""
    try:
        return await _predict_via_llm(analysis)
    except Exception as e:
        print(f"[BugPredictor LLM] failed: {e}")
        return _predict_via_heuristics(analysis)


# ── LLM path ───────────────────────────────────────────────────────────────────
async def _predict_via_llm(analysis: Dict[str, Any]) -> List[Dict]:
    code = analysis["raw_code"]
    lang = analysis["language"]

    system = (
        "You are a static analysis expert. Identify likely bugs in the code. "
        "Return ONLY a valid JSON array. Each bug must have: "
        "id (string), title (string), description (string), "
        "severity (critical|high|medium|low), line_hint (string or null), "
        "category (string: e.g. logic_error|null_reference|off_by_one|race_condition|security|memory)."
    )
    prompt = f"""Find probable bugs in this {lang} code:

```{lang}
{code[:3000]}
```

Focus on: null dereferences, off-by-one errors, unhandled exceptions, logic inversions,
type mismatches, resource leaks, security vulnerabilities, concurrency issues.
Return JSON array of 4–7 bug predictions only.
"""
    llm_response = await call_llama(prompt, system)
    raw = llm_response.strip()
    raw = raw.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    return json.loads(raw)


# ── Heuristic path ─────────────────────────────────────────────────────────────
def _predict_via_heuristics(analysis: Dict[str, Any]) -> List[Dict]:
    bugs = []
    code = analysis["raw_code"].lower()

    def bug(title, desc, severity, category, line_hint=None):
        return {"id": str(uuid.uuid4())[:8], "title": title, "description": desc,
                "severity": severity, "line_hint": line_hint, "category": category}

    # No error handling → unhandled exceptions everywhere
    if not analysis["has_error_handling"]:
        bugs.append(bug(
            "Missing exception handling",
            "No try/except blocks detected. Any runtime error will crash the caller with no context.",
            "critical", "unhandled_exception"
        ))

    # Loops without bounds checks
    if analysis["has_loops"]:
        bugs.append(bug(
            "Potential off-by-one in loop",
            "Loop boundary conditions not explicitly validated. Iterating to len(x) vs len(x)-1 is a common source of IndexError.",
            "high", "off_by_one"
        ))

    # Recursion without depth guard
    if analysis["has_recursion"]:
        bugs.append(bug(
            "Unbounded recursion depth",
            "Recursive function detected without apparent max-depth guard. Deep inputs will hit Python's recursion limit (~1000) causing RecursionError.",
            "critical", "recursion_overflow"
        ))

    # Async without proper error handling
    if analysis["has_async"] and not analysis["has_error_handling"]:
        bugs.append(bug(
            "Unhandled async rejection",
            "Async function lacks try/except. Unhandled coroutine exceptions are silently swallowed in some frameworks.",
            "high", "race_condition"
        ))

    # Hard-coded values heuristic
    hardcoded = re.findall(r'["\'](?:password|secret|api_key|token)["\']', analysis["raw_code"], re.I)
    if hardcoded:
        bugs.append(bug(
            "Possible hardcoded secret",
            f"Found literal(s) that look like sensitive values ({', '.join(set(hardcoded[:3]))}). These should come from environment variables.",
            "critical", "security"
        ))

    # Mutable default argument (Python-specific)
    if analysis["language"] == "python":
        if re.search(r"def\s+\w+\s*\([^)]*=\s*[\[{]", analysis["raw_code"]):
            bugs.append(bug(
                "Mutable default argument",
                "Using a mutable object (list/dict) as a default parameter. This is shared across all calls — a classic Python gotcha.",
                "medium", "logic_error"
            ))
        if "== None" in analysis["raw_code"] or "!= None" in analysis["raw_code"]:
            bugs.append(bug(
                "Identity vs equality for None",
                "Using == None instead of `is None`. While often works, it breaks with objects that override __eq__.",
                "low", "logic_error"
            ))

    # Null/undefined access
    if any(fn for fn in analysis["detected_functions"]) and not analysis["has_conditionals"]:
        bugs.append(bug(
            "Potential null reference",
            "Functions are called but no conditional guards check for None/null input. First call with None will likely raise AttributeError.",
            "high", "null_reference"
        ))

    # Resource leak
    if "open(" in analysis["raw_code"] and "with " not in analysis["raw_code"]:
        bugs.append(bug(
            "File resource leak",
            "File opened with open() but not inside a `with` block. If an exception occurs, the file handle will never be closed.",
            "high", "memory"
        ))

    return bugs[:7]

