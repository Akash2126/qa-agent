"""
backend/agent/ui_bug_detector.py - Detect UI bugs from analysis (broken flows, accessibility)
"""
from typing import List, Dict, Any
import uuid
import re

COMMON_UI_BUGS = [
    {"title": "Missing alt text on images", "severity": "medium", "category": "accessibility", "fix": "Add alt attributes to all img tags"},
    {"title": "Unlabeled form inputs", "severity": "high", "category": "usability", "fix": "Add labels or aria-label to inputs"},
    {"title": "Empty navigation links", "severity": "medium", "category": "navigation", "fix": "Add descriptive text to nav links"},
    {"title": "Too many buttons (click fatigue)", "severity": "low", "category": "ux", "fix": "Review button count >15, consider grouping"},
]

def detect_ui_bugs(ui_analysis: Dict[str, Any]) -> List[Dict]:
    """
    Heuristic + analysis-based UI bug detection.
    """
    bugs = []
    
    # Button analysis
    buttons = ui_analysis.get('buttons', [])
    empty_btns = [b for b in buttons if not b.get('text', '').strip()]
    if empty_btns:
        bugs.append({
            'id': str(uuid.uuid4())[:8],
            'title': f"{len(empty_btns)} buttons missing text",
            'severity': 'high',
            'repro_steps': ['Load page', 'Inspect buttons without text'],
            'expected': 'All buttons have descriptive text',
            'actual': 'Empty/unlabeled buttons found',
            'category': 'usability'
        })
    
    # Form analysis
    forms = ui_analysis.get('forms', [])
    for form in forms:
        if form.get('inputs', 0) > 0 and not form.get('action'):
            bugs.append({
                'id': str(uuid.uuid4())[:8],
                'title': 'Form missing action attribute',
                'severity': 'critical',
                'repro_steps': ['Find form', 'Attempt submit'],
                'expected': 'Form has valid action URL',
                'actual': 'No action - submit fails',
                'category': 'functional'
            })
    
    # Generic issues
    if ui_analysis.get('ui_complexity', 0) > 50:
        bugs.append({
            'id': str(uuid.uuid4())[:8],
            'title': 'High UI complexity detected',
            'severity': 'medium',
            'repro_steps': ['Count interactive elements'],
            'expected': '<30 elements for good UX',
            'actual': f'{ui_analysis["ui_complexity"]} elements',
            'category': 'performance'
        })
    
    return bugs + [b.copy() for b in COMMON_UI_BUGS[:3]]  # Add common ones

async def predict_ui_bugs(ui_analysis: Dict[str, Any]) -> List[Dict]:
    """
    Main entrypoint.
    """
    return detect_ui_bugs(ui_analysis)

