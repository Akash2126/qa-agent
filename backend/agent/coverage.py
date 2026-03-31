"""
agent/coverage.py - Step 4: Calculate test coverage score and breakdown
"""

from typing import List, Dict, Any


def evaluate_coverage(
    analysis: Dict[str, Any],
    test_cases: List[Dict],
    edge_cases: List[Dict],
) -> Dict[str, Any]:
    """
    Compute a coverage score (0–100) based on what is tested vs what exists.
    Returns the score and a breakdown dict for frontend visualization.
    """

    breakdown  = {}
    weights    = {}
    total_w    = 0
    weighted_s = 0.0

    # ── 1. Function Coverage ───────────────────────────────────────────────────
    fns = analysis["detected_functions"]
    if fns:
        covered_fns = _count_covered_functions(fns, test_cases)
        fn_score    = min(covered_fns / len(fns), 1.0)
        breakdown["function_coverage"] = round(fn_score * 100, 1)
        weights["function_coverage"]   = 30
    else:
        breakdown["function_coverage"] = 75.0
        weights["function_coverage"]   = 30

    # ── 2. Branch / Conditional Coverage ──────────────────────────────────────
    if analysis["has_conditionals"]:
        branch_score = _estimate_branch_coverage(test_cases)
        breakdown["branch_coverage"] = round(branch_score * 100, 1)
        weights["branch_coverage"]   = 25
    else:
        breakdown["branch_coverage"] = 85.0
        weights["branch_coverage"]   = 25

    # ── 3. Error Handling Coverage ────────────────────────────────────────────
    error_score = _estimate_error_coverage(test_cases, analysis)
    breakdown["error_handling_coverage"] = round(error_score * 100, 1)
    weights["error_handling_coverage"]   = 20

    # ── 4. Edge Case Coverage ─────────────────────────────────────────────────
    edge_score = min(len(edge_cases) / 5.0, 1.0) * 0.8  # 80% max from count alone
    breakdown["edge_case_coverage"] = round(edge_score * 100, 1)
    weights["edge_case_coverage"]   = 15

    # ── 5. Integration Coverage ────────────────────────────────────────────────
    integration_tests = [t for t in test_cases if t.get("category") == "integration"]
    if analysis.get("detected_patterns") or analysis.get("has_async"):
        int_score = min(len(integration_tests) / 2.0, 1.0)
        breakdown["integration_coverage"] = round(int_score * 100, 1)
        weights["integration_coverage"]   = 10
    else:
        breakdown["integration_coverage"] = 90.0
        weights["integration_coverage"]   = 10

    # ── Compute weighted average ───────────────────────────────────────────────
    for key, w in weights.items():
        total_w    += w
        weighted_s += breakdown[key] * w

    overall = round(weighted_s / total_w, 1) if total_w else 0.0

    # ── Bonus points for thoroughness ─────────────────────────────────────────
    if len(test_cases) >= 8:
        overall = min(overall + 3.0, 100.0)
    if any(t["priority"] == "high" for t in test_cases):
        overall = min(overall + 2.0, 100.0)

    return {
        "score": overall,
        "breakdown": breakdown,
        "test_count": len(test_cases),
        "edge_count": len(edge_cases),
        "grade": _score_to_grade(overall),
    }


# ── Helpers ────────────────────────────────────────────────────────────────────
def _count_covered_functions(functions: list, test_cases: List[Dict]) -> int:
    """Count how many functions appear in at least one test case."""
    covered = 0
    all_test_text = " ".join(
        f"{tc.get('name','')} {tc.get('input','')} {tc.get('description','')}"
        for tc in test_cases
    ).lower()
    for fn in functions:
        if fn.lower() in all_test_text:
            covered += 1
    return covered


def _estimate_branch_coverage(test_cases: List[Dict]) -> float:
    """Estimate branch coverage by checking for positive/negative test pairs."""
    names_lower = [tc.get("name", "").lower() for tc in test_cases]

    positive = sum(
        1 for n in names_lower
        if any(w in n for w in ["valid", "happy", "success", "correct", "expected"])
    )
    negative = sum(
        1 for n in names_lower
        if any(w in n for w in ["invalid", "error", "fail", "none", "empty", "wrong", "edge"])
    )

    if positive == 0:
        return 0.4
    if negative == 0:
        return 0.5

    ratio = negative / (positive + negative)
    return min(0.5 + ratio * 1.0, 1.0)


def _estimate_error_coverage(test_cases: List[Dict], analysis: dict) -> float:
    """Score how well error paths are tested."""
    error_tests = [
        tc for tc in test_cases
        if any(w in tc.get("name", "").lower() for w in
               ["error", "exception", "fail", "invalid", "none", "empty", "boundary", "overflow"])
    ]

    if not analysis["has_error_handling"] and not error_tests:
        return 0.2   # Code has no error handling → poor coverage

    if error_tests:
        return min(len(error_tests) / 3.0, 1.0)
    return 0.5


def _score_to_grade(score: float) -> str:
    if score >= 90:
        return "A"
    elif score >= 80:
        return "B"
    elif score >= 70:
        return "C"
    elif score >= 60:
        return "D"
    return "F"
