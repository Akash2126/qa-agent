"""
agent/analyzer.py - Step 1: Analyze code/requirements to extract structure and metadata
"""

import re
from typing import Dict, Any


def analyze_code(code: str, language: str, input_type: str) -> Dict[str, Any]:
    """
    Analyzes the input code or requirements to extract structural information.
    Returns a structured analysis dict used by downstream pipeline steps.
    """

    analysis = {
        "language": language,
        "input_type": input_type,
        "raw_code": code,
        "line_count": len(code.splitlines()),
        "char_count": len(code),
        "detected_functions": [],
        "detected_classes": [],
        "detected_imports": [],
        "detected_patterns": [],
        "complexity_hints": [],
        "has_error_handling": False,
        "has_loops": False,
        "has_conditionals": False,
        "has_recursion": False,
        "has_async": False,
    }

    if input_type == "code":
        _extract_code_features(code, language, analysis)
    else:
        _extract_requirement_features(code, analysis)

    return analysis


def _extract_code_features(code: str, language: str, analysis: dict) -> None:
    """Extract structural features from source code."""

    # ── Python patterns ────────────────────────────────────────────────────────
    if language == "python":
        analysis["detected_functions"] = re.findall(r"def\s+(\w+)\s*\(", code)
        analysis["detected_classes"]   = re.findall(r"class\s+(\w+)\s*[:\(]", code)
        analysis["detected_imports"]   = re.findall(r"(?:import|from)\s+([\w.]+)", code)
        analysis["has_error_handling"] = bool(re.search(r"\btry\b|\bexcept\b|\braise\b", code))
        analysis["has_loops"]          = bool(re.search(r"\bfor\b|\bwhile\b", code))
        analysis["has_conditionals"]   = bool(re.search(r"\bif\b|\belif\b|\belse\b", code))
        analysis["has_recursion"]      = _detect_recursion_python(code, analysis["detected_functions"])
        analysis["has_async"]          = bool(re.search(r"\basync\b|\bawait\b", code))

    # ── JavaScript / TypeScript ────────────────────────────────────────────────
    elif language in ("javascript", "typescript"):
        analysis["detected_functions"] = re.findall(
            r"(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s*)?\(|(\w+)\s*\(.*\)\s*\{)", code
        )
        analysis["detected_classes"]   = re.findall(r"class\s+(\w+)", code)
        analysis["has_error_handling"] = bool(re.search(r"\btry\b|\bcatch\b|\bthrow\b", code))
        analysis["has_loops"]          = bool(re.search(r"\bfor\b|\bwhile\b|\bforEach\b|\bmap\b", code))
        analysis["has_conditionals"]   = bool(re.search(r"\bif\b|\bswitch\b|\bternary\b", code))
        analysis["has_async"]          = bool(re.search(r"\basync\b|\bawait\b|\.then\(|\.catch\(", code))

    # ── Java ──────────────────────────────────────────────────────────────────
    elif language == "java":
        analysis["detected_functions"] = re.findall(r"(?:public|private|protected|static)\s+\w+\s+(\w+)\s*\(", code)
        analysis["detected_classes"]   = re.findall(r"class\s+(\w+)", code)
        analysis["has_error_handling"] = bool(re.search(r"\btry\b|\bcatch\b|\bthrows\b", code))
        analysis["has_loops"]          = bool(re.search(r"\bfor\b|\bwhile\b|\bdo\b", code))
        analysis["has_conditionals"]   = bool(re.search(r"\bif\b|\bswitch\b", code))

    # ── Complexity hints ───────────────────────────────────────────────────────
    if analysis["has_recursion"]:
        analysis["complexity_hints"].append("recursive_algorithm")
    if analysis["has_async"]:
        analysis["complexity_hints"].append("async_operations")
    if analysis["has_error_handling"]:
        analysis["complexity_hints"].append("exception_handling")
    if len(analysis["detected_functions"]) > 5:
        analysis["complexity_hints"].append("large_module")
    if analysis["has_loops"] and analysis["has_conditionals"]:
        analysis["complexity_hints"].append("complex_control_flow")

    # ── Common patterns ────────────────────────────────────────────────────────
    _detect_design_patterns(code, analysis)


def _extract_requirement_features(code: str, analysis: dict) -> None:
    """Parse natural-language requirements for testable behaviors."""
    text = code.lower()
    patterns = []

    if any(w in text for w in ["user", "login", "signup", "auth"]):
        patterns.append("authentication")
    if any(w in text for w in ["api", "endpoint", "rest", "http"]):
        patterns.append("api_endpoint")
    if any(w in text for w in ["database", "db", "store", "persist"]):
        patterns.append("data_persistence")
    if any(w in text for w in ["calculate", "compute", "formula", "math"]):
        patterns.append("computation")
    if any(w in text for w in ["validate", "check", "verify", "ensure"]):
        patterns.append("validation")
    if any(w in text for w in ["file", "upload", "download", "export"]):
        patterns.append("file_operations")
    if any(w in text for w in ["email", "notification", "alert", "send"]):
        patterns.append("notifications")

    analysis["detected_patterns"] = patterns
    analysis["complexity_hints"]  = patterns[:3]


def _detect_recursion_python(code: str, functions: list) -> bool:
    """Check if any function calls itself (simple recursion detection)."""
    for fn in functions:
        # Look for the function name appearing inside its own body
        body_match = re.search(rf"def\s+{fn}\s*\([^)]*\):(.*?)(?=def\s|\Z)", code, re.DOTALL)
        if body_match and re.search(rf"\b{fn}\s*\(", body_match.group(1)):
            return True
    return False


def _detect_design_patterns(code: str, analysis: dict) -> None:
    """Detect common design patterns for smarter test generation."""
    patterns = []
    if re.search(r"singleton|_instance", code, re.IGNORECASE):
        patterns.append("singleton")
    if re.search(r"factory|create_\w+|make_\w+", code, re.IGNORECASE):
        patterns.append("factory")
    if re.search(r"decorator|@\w+", code):
        patterns.append("decorator")
    if re.search(r"observer|subscribe|publish|emit|on_\w+", code, re.IGNORECASE):
        patterns.append("observer")
    if re.search(r"strategy|\bsort\b.*key=", code, re.IGNORECASE):
        patterns.append("strategy")
    analysis["detected_patterns"].extend(patterns)
