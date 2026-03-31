"""
backend/agent/functional_tester.py - Generate UI functional test cases from UI analysis
"""
from typing import List, Dict, Any
import uuid

def generate_functional_tests(ui_analysis: Dict[str, Any]) -> List[Dict]:
    """
    From UI analysis → generate structured functional test cases.
    Formats Playwright/Puppeteer style steps.
    """
    tests = []
    
    buttons = ui_analysis.get('buttons', [])
    forms = ui_analysis.get('forms', False)
    nav_links = ui_analysis.get('nav_links', [])
    
    # Button click tests
    for btn in buttons[:8]:
        btn_text = (btn.get('text', 'button')[:30] if isinstance(btn, dict) 
                   else str(btn)[:30] if btn else 'button')
        tests.append({
            'id': str(uuid.uuid4())[:8],
            'title': f"Click '{btn_text}'",
            'steps': [
                "1. Navigate to page",
                f"2. Locate button: '{btn_text}'",
                "3. Click button",
                "4. Verify page response/no errors"
            ],
            'expected_result': "Button click triggers expected action (no 404/js errors)",
            'category': 'functional',
            'priority': 'medium'
        })
    
    # Form tests
    if forms:
        tests.append({
            'id': str(uuid.uuid4())[:8],
            'title': "Form submission flow",
            'steps': [
                "1. Navigate to page",
                "2. Fill all form inputs with valid data",
                "3. Submit form",
                "4. Verify success message/redirect"
            ],
            'expected_result': "Form submits without validation errors",
            'category': 'functional',
            'priority': 'high'
        })
    
    # Navigation tests
    if nav_links:
        link_preview = ', '.join([str(link)[:20] for link in nav_links[:3]])
        tests.append({
            'id': str(uuid.uuid4())[:8],
            'title': "Primary navigation",
            'steps': [
                f"1. Click each nav link: {link_preview}",
                "2. Verify each loads without errors",
                "3. Check back button works"
            ],
            'expected_result': "All nav links functional, no 404s",
            'category': 'functional',
            'priority': 'high'
        })
    
    return tests[:12]  # Limit

def generate_functional_test_cases(ui_analysis: Dict[str, Any]) -> List[Dict]:
    """
    Main entrypoint - generates functional test cases from UI analysis.
    Uses heuristics (LLM enhancement TODO).
    """
    return generate_functional_tests(ui_analysis or {})

