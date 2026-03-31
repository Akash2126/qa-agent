"""
agent/improver.py - Step 5: Generate human-readable explanation & improvement suggestions
"""

import json
import httpx
from typing import List, Dict, Any
from .ollama_helper import call_llama



# ── Public Interface ───────────────────────────────────────────────────────────
async def generate_explanation_and_improvements(
    analysis: Dict[str, Any],
    test_cases: List[Dict],
    edge_cases: List[Dict],
    coverage: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Generate a plain-English explanation of the analysis and
    actionable improvement suggestions.
    """
    try:
        return await _improve_via_llm(analysis, test_cases, edge_cases, coverage)
    except Exception as e:
        print(f"[LLM] Explanation generation failed: {e}. Falling back to templates.")
        return _improve_via_templates(analysis, test_cases, edge_cases, coverage)



# ── LLM-based Improvement ──────────────────────────────────────────────────────
async def _improve_via_llm(
    analysis: Dict[str, Any],
    test_cases: List[Dict],
    edge_cases: List[Dict],
    coverage: Dict[str, Any],
) -> Dict[str, Any]:
    code  = analysis["raw_code"]
    lang  = analysis["language"]
    score = coverage["score"]
    grade = coverage["grade"]

    system_prompt = (
        "You are a senior QA architect. Provide a concise, developer-friendly explanation "
        "of the test analysis and specific actionable improvements. "
        "Return ONLY valid JSON with keys: 'explanation' (string) and 'improvements' (array of strings)."
    )

    user_prompt = f"""
Code language: {lang}
Coverage score: {score}% (Grade: {grade})
Functions detected: {', '.join(str(f) for f in analysis['detected_functions'][:5]) or 'N/A'}
Test cases generated: {len(test_cases)}
Edge cases detected: {len(edge_cases)}
Breakdown: {json.dumps(coverage['breakdown'])}

High-risk edge cases: {[e['scenario'] for e in edge_cases if e.get('risk_level') == 'critical']}

Code snippet (first 1500 chars):
```{lang}
{code[:1500]}
```

Write a 3–4 sentence explanation and list 4–6 specific improvement actions.
Return JSON only: {{"explanation": "...", "improvements": ["...", "..."]}}
"""

    llm_response = await call_llama(user_prompt, system_prompt)
    content = llm_response.strip()
    content = content.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    return json.loads(content)



# ── Template-based Improvement ─────────────────────────────────────────────────
def _improve_via_templates(
    analysis: Dict[str, Any],
    test_cases: List[Dict],
    edge_cases: List[Dict],
    coverage: Dict[str, Any],
) -> Dict[str, Any]:
    """Rule-based explanation and improvement generation."""
    score  = coverage["score"]
    grade  = coverage["grade"]
    lang   = analysis["language"]
    fns    = analysis["detected_functions"]
    bd     = coverage["breakdown"]

    # ── Explanation ────────────────────────────────────────────────────────────
    fn_part = (
        f"The code contains {len(fns)} function(s): {', '.join(fns[:3])}."
        if fns else "No explicit functions were detected — this may be a script or requirements doc."
    )

    score_desc = (
        "excellent"  if score >= 85 else
        "good"       if score >= 70 else
        "moderate"   if score >= 55 else
        "low"
    )

    complexity_part = ""
    if analysis["has_async"]:
        complexity_part += " The code uses async/await, requiring concurrency-aware tests."
    if analysis["has_recursion"]:
        complexity_part += " Recursive logic detected — stack depth tests are critical."
    if not analysis["has_error_handling"]:
        complexity_part += " No error handling found — this is a high-risk gap."

    explanation = (
        f"{fn_part} "
        f"The overall test coverage is {score_desc} at {score}% (Grade {grade}).{complexity_part} "
        f"A total of {len(test_cases)} test cases and {len(edge_cases)} edge cases were generated "
        f"covering function, branch, error-handling, and integration dimensions."
    )

    # ── Improvements ──────────────────────────────────────────────────────────
    improvements = []

    if bd.get("function_coverage", 100) < 80:
        uncovered = len(fns) - round(len(fns) * bd["function_coverage"] / 100)
        improvements.append(
            f"Add unit tests for {uncovered} uncovered function(s) to reach 100% function coverage."
        )

    if bd.get("branch_coverage", 100) < 75:
        improvements.append(
            "Increase branch coverage by adding negative test cases for every if/else branch."
        )

    if not analysis["has_error_handling"]:
        improvements.append(
            "Implement try/except (or try/catch) blocks around all I/O and external calls."
        )

    critical_edges = [e["scenario"] for e in edge_cases if e.get("risk_level") == "critical"]
    if critical_edges:
        improvements.append(
            f"Address critical edge cases immediately: {', '.join(critical_edges[:3])}."
        )

    if analysis["has_async"]:
        improvements.append(
            "Write dedicated concurrency tests to catch race conditions in async paths."
        )

    if analysis["has_recursion"]:
        improvements.append(
            "Add a recursion depth test with sys.setrecursionlimit to catch stack overflows."
        )

    if score < 70:
        improvements.append(
            "Consider adopting a test-driven development (TDD) approach to increase coverage organically."
        )

    improvements.append(
        f"Integrate these tests into a CI pipeline (GitHub Actions / GitLab CI) to run on every commit."
    )

    return {
        "explanation": explanation,
        "improvements": improvements[:6],
    }
