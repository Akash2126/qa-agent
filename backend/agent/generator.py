"""
agent/generator.py - Step 2: Generate test cases using Ollama llama3
Falls back to template-based generation if no API key is provided.
"""

import json
import uuid
import httpx
from typing import List, Dict, Any
from .ollama_helper import call_llama


# ── Public Interface ───────────────────────────────────────────────────────────
async def generate_test_cases(analysis: Dict[str, Any]) -> List[Dict]:
    """
    Generate structured test cases from the analysis object.
    Uses Ollama llama3, falls back to templates if unavailable.
    """
    try:
        return await _generate_via_llm(analysis)
    except Exception as e:
        print(f"[LLM] Test case generation failed: {e}. Falling back to templates.")
        return _generate_via_templates(analysis)


# ── LLM-based Generation ───────────────────────────────────────────────────────
async def _generate_via_llm(analysis: Dict[str, Any]) -> List[Dict]:
    code    = analysis["raw_code"]
    lang    = analysis["language"]
    itype   = analysis["input_type"]

    system_prompt = (
        "You are an expert QA engineer. Generate comprehensive test cases in strict JSON format. "
        "Return ONLY a valid JSON array, no markdown, no explanation outside JSON. "
        "Each test case must have: id (string), name (string), description (string), "
        "input (string), expected_output (string), category (unit|integration|functional), "
        "priority (high|medium|low)."
    )

    user_prompt = f"""
Analyze this {lang} {itype} and generate 6–10 comprehensive test cases:

```{lang}
{code[:3000]}
```

Functions found: {', '.join(str(f) for f in analysis['detected_functions'][:5]) or 'N/A'}
Patterns: {', '.join(analysis['complexity_hints'][:3]) or 'N/A'}

Return a JSON array of test case objects only.
"""

    llm_response = await call_llama(user_prompt, system_prompt)
    content = llm_response.strip()
    # Strip markdown code fences if present
    content = content.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    return json.loads(content)


# ── Template-based Generation (fallback) ──────────────────────────────────────
def _generate_via_templates(analysis: Dict[str, Any]) -> List[Dict]:
    """Rule-based test case generation when LLM is unavailable."""
    cases = []
    fns   = analysis["detected_functions"]
    lang  = analysis["language"]
    itype = analysis["input_type"]

    # ── Happy-path tests for each detected function ────────────────────────────
    for fn in fns[:4]:
        cases.append(_make_case(
            name=f"test_{fn}_happy_path",
            description=f"Verify that `{fn}` returns the expected output for valid inputs.",
            input=f"{fn}(valid_input)",
            expected=f"Expected valid output from `{fn}`",
            category="unit", priority="high",
        ))

    # ── Error-handling tests ───────────────────────────────────────────────────
    if analysis["has_error_handling"] or fns:
        fn_name = fns[0] if fns else "target_function"
        cases.append(_make_case(
            name=f"test_{fn_name}_with_none_input",
            description="Ensure the function raises an appropriate error when None is passed.",
            input=f"{fn_name}(None)",
            expected="TypeError or ValueError raised",
            category="unit", priority="high",
        ))
        cases.append(_make_case(
            name=f"test_{fn_name}_with_empty_input",
            description="Verify behavior with empty string / empty list.",
            input=f"{fn_name}('')",
            expected="ValueError or empty result depending on contract",
            category="unit", priority="medium",
        ))

    # ── Loop / iteration tests ─────────────────────────────────────────────────
    if analysis["has_loops"]:
        cases.append(_make_case(
            name="test_iteration_with_large_dataset",
            description="Stress-test loop performance with a large collection.",
            input="function_under_test(list_of_10000_items)",
            expected="Result returned within acceptable time, no memory errors",
            category="functional", priority="medium",
        ))
        cases.append(_make_case(
            name="test_iteration_with_empty_collection",
            description="Verify correct behavior when iterating over an empty list.",
            input="function_under_test([])",
            expected="Empty result or zero, no crash",
            category="unit", priority="high",
        ))

    # ── Async tests ────────────────────────────────────────────────────────────
    if analysis["has_async"]:
        cases.append(_make_case(
            name="test_async_function_resolves",
            description="Verify that the async function resolves successfully.",
            input="await async_function(valid_params)",
            expected="Promise/coroutine resolves with expected value",
            category="integration", priority="high",
        ))
        cases.append(_make_case(
            name="test_async_function_timeout",
            description="Ensure proper handling when the async operation times out.",
            input="await async_function(slow_source, timeout=0.001)",
            expected="TimeoutError or cancellation handled gracefully",
            category="integration", priority="medium",
        ))

    # ── Class tests ────────────────────────────────────────────────────────────
    for cls in analysis["detected_classes"][:2]:
        cases.append(_make_case(
            name=f"test_{cls.lower()}_initialization",
            description=f"Verify that `{cls}` initializes with valid default state.",
            input=f"instance = {cls}()",
            expected=f"Instance created with correct default attributes",
            category="unit", priority="high",
        ))

    # ── Requirement-based tests ────────────────────────────────────────────────
    if itype == "requirement":
        for pattern in analysis["detected_patterns"][:3]:
            cases.extend(_requirement_test_templates(pattern))

    # ── Ensure minimum 5 tests ─────────────────────────────────────────────────
    if len(cases) < 5:
        cases.extend(_generic_tests(lang))

    return cases[:10]   # Cap at 10


def _make_case(name, description, input, expected, category, priority) -> Dict:
    return {
        "id": str(uuid.uuid4())[:8],
        "name": name,
        "description": description,
        "input": input,
        "expected_output": expected,
        "category": category,
        "priority": priority,
    }


def _requirement_test_templates(pattern: str) -> List[Dict]:
    templates = {
        "authentication": [
            _make_case("test_login_valid_credentials", "Login with correct email/password.",
                       "POST /login {email, password}", "200 OK with JWT token", "integration", "high"),
            _make_case("test_login_invalid_password", "Login with wrong password.",
                       "POST /login {email, wrong_password}", "401 Unauthorized", "integration", "high"),
        ],
        "api_endpoint": [
            _make_case("test_endpoint_returns_200", "Endpoint returns 200 for valid request.",
                       "GET /endpoint with auth header", "200 OK with valid body", "integration", "high"),
            _make_case("test_endpoint_unauthenticated", "Endpoint rejects unauthenticated request.",
                       "GET /endpoint without auth", "401 Unauthorized", "integration", "high"),
        ],
        "data_persistence": [
            _make_case("test_save_and_retrieve", "Data saved and retrieved correctly.",
                       "save(record); retrieve(record.id)", "Retrieved record matches saved", "integration", "high"),
        ],
        "validation": [
            _make_case("test_valid_input_accepted", "Valid input passes validation.",
                       "validate(valid_data)", "True or no exception", "unit", "high"),
            _make_case("test_invalid_input_rejected", "Invalid input is rejected.",
                       "validate(invalid_data)", "False or ValidationError", "unit", "high"),
        ],
    }
    return templates.get(pattern, [])


def _generic_tests(lang: str) -> List[Dict]:
    return [
        _make_case("test_return_type", "Verify the return type matches spec.",
                   "result = function_under_test(sample_input)", f"isinstance(result, expected_type) == True",
                   "unit", "medium"),
        _make_case("test_boundary_values", "Check boundary values (min/max).",
                   "function_under_test(MAX_INT), function_under_test(MIN_INT)",
                   "No overflow; result within expected bounds", "unit", "high"),
        _make_case("test_idempotency", "Calling twice with same input gives same output.",
                   "result1 = f(x); result2 = f(x)", "result1 == result2", "unit", "medium"),
    ]

