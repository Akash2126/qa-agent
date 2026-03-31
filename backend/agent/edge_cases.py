"""
agent/edge_cases.py - Step 3: Detect and generate edge cases from analysis
"""

import json
import uuid
import httpx
from typing import List, Dict, Any
from .ollama_helper import call_llama



# ── Public Interface ───────────────────────────────────────────────────────────
async def detect_edge_cases(analysis: Dict[str, Any], test_cases: List[Dict]) -> List[Dict]:
    """
    Identify edge cases not covered by primary test cases.
    Uses LLM when available, otherwise applies heuristic rules.
    """
    try:
        return await _detect_via_llm(analysis, test_cases)
    except Exception as e:
        print(f"[LLM] Edge case detection failed: {e}. Falling back to heuristics.")
        return _detect_via_heuristics(analysis)



# ── LLM-based Detection ────────────────────────────────────────────────────────
async def _detect_via_llm(analysis: Dict[str, Any], test_cases: List[Dict]) -> List[Dict]:
    code = analysis["raw_code"]
    lang = analysis["language"]

    system_prompt = (
        "You are a QA security and robustness expert. Identify edge cases and corner cases "
        "that could cause failures or vulnerabilities. Return ONLY a valid JSON array. "
        "Each edge case must have: id (string), scenario (string), description (string), "
        "risk_level (critical|high|medium|low), suggestion (string)."
    )

    covered = [tc["name"] for tc in test_cases[:5]]

    user_prompt = f"""
Analyze this {lang} code for edge cases NOT covered by these tests: {covered}

```{lang}
{code[:2500]}
```

Focus on: boundary conditions, concurrency, memory, security, network failures, type coercion.
Return a JSON array of 4–7 edge case objects only.
"""

    llm_response = await call_llama(user_prompt, system_prompt)
    content = llm_response.strip()
    content = content.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    return json.loads(content)



# ── Heuristic Detection ────────────────────────────────────────────────────────
def _detect_via_heuristics(analysis: Dict[str, Any]) -> List[Dict]:
    """Rule-based edge case detection from structural analysis."""
    cases = []

    # ── Universal edge cases ───────────────────────────────────────────────────
    cases.extend([
        _make_edge(
            scenario="null_none_input",
            description="Passing None/null where a value is expected.",
            risk="critical",
            suggestion="Add explicit null checks at function entry points.",
        ),
        _make_edge(
            scenario="empty_string_input",
            description="Empty string '' passed instead of valid string.",
            risk="high",
            suggestion="Validate that strings are non-empty before processing.",
        ),
        _make_edge(
            scenario="integer_overflow",
            description="Very large integer values that may overflow in certain languages.",
            risk="medium",
            suggestion="Use safe math libraries or validate numeric input ranges.",
        ),
        _make_edge(
            scenario="unicode_special_characters",
            description="Input contains unicode, emojis, or RTL characters causing encoding issues.",
            risk="medium",
            suggestion="Normalize all string inputs to UTF-8 and test with unicode fixtures.",
        ),
    ])

    # ── Loop-specific ──────────────────────────────────────────────────────────
    if analysis["has_loops"]:
        cases.extend([
            _make_edge(
                scenario="infinite_loop_risk",
                description="Loop condition may never become False under certain inputs.",
                risk="critical",
                suggestion="Add a max-iteration guard or validate loop termination invariant.",
            ),
            _make_edge(
                scenario="off_by_one_in_iteration",
                description="Array/list indexed off-by-one causing IndexError or missing last element.",
                risk="high",
                suggestion="Use len()-based bounds or enumerate() to avoid index arithmetic.",
            ),
        ])

    # ── Async-specific ─────────────────────────────────────────────────────────
    if analysis["has_async"]:
        cases.extend([
            _make_edge(
                scenario="race_condition",
                description="Two concurrent calls modify shared state simultaneously.",
                risk="critical",
                suggestion="Use locks, semaphores, or immutable state in async paths.",
            ),
            _make_edge(
                scenario="unhandled_promise_rejection",
                description="Async function throws but rejection is not caught upstream.",
                risk="high",
                suggestion="Always attach .catch() or use try/await with error handling.",
            ),
        ])

    # ── Error-handling gaps ────────────────────────────────────────────────────
    if not analysis["has_error_handling"]:
        cases.append(_make_edge(
            scenario="no_error_handling",
            description="Code lacks try/catch — any runtime error will propagate uncaught.",
            risk="critical",
            suggestion="Wrap core logic in try/except and return meaningful error responses.",
        ))

    # ── Recursion-specific ─────────────────────────────────────────────────────
    if analysis["has_recursion"]:
        cases.append(_make_edge(
            scenario="recursion_depth_exceeded",
            description="Deep recursion with large input exceeds system stack limit.",
            risk="critical",
            suggestion="Add a base case guard and consider iterative rewrite for large inputs.",
        ))

    # ── Pattern-specific ───────────────────────────────────────────────────────
    for pattern in analysis.get("detected_patterns", []):
        if pattern == "authentication":
            cases.append(_make_edge(
                scenario="jwt_token_expiry",
                description="Expired JWT token is accepted or causes 500 instead of 401.",
                risk="critical",
                suggestion="Always validate token expiry and return 401 with clear message.",
            ))
        elif pattern == "data_persistence":
            cases.append(_make_edge(
                scenario="database_connection_failure",
                description="DB connection drops mid-transaction causing data corruption.",
                risk="critical",
                suggestion="Use transactions with rollback and connection pool health checks.",
            ))
        elif pattern == "file_operations":
            cases.append(_make_edge(
                scenario="file_not_found",
                description="File path does not exist at runtime.",
                risk="high",
                suggestion="Check file existence with os.path.exists() before opening.",
            ))

    return cases[:8]


def _make_edge(scenario: str, description: str, risk: str, suggestion: str) -> Dict:
    return {
        "id": str(uuid.uuid4())[:8],
        "scenario": scenario,
        "description": description,
        "risk_level": risk,
        "suggestion": suggestion,
    }
