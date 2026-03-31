"""
backend/agent/vision_analyzer.py - Screenshot analysis via LLM Vision API (Grok/GPT-4V)
"""
import base64, httpx, json
from typing import Dict, Any, List
from bs4 import BeautifulSoup

async def analyze_screenshot(b64_image: str) -> Dict[str, Any]:
    """
    Screenshot analysis using heuristics (no vision LLM).
    Returns UI analysis dict compatible with ui_analyzer.
    """
    # Vision LLM not supported with Ollama llama3 (text-only).
    # Fallback to basic heuristic analysis. For full vision, use vision-capable Ollama model.
    
    try:
        # Decode b64 to bytes, then simple heuristic (not full image OCR)
        image_bytes = base64.b64decode(b64_image)
        return {
            'error': 'Vision analysis disabled - Ollama llama3 is text-only. Use ui_analyzer for HTML-based UI analysis.',
            'raw_b64': b64_image[:100],
            'elements': [],
            'forms': 0,
            'has_login': False,
            'issues': ['No vision capabilities; recommend URL-based analysis via ui_analyzer.py'],
            'ui_complexity': 0,
            'fallback': 'Use BeautifulSoup on HTML source for UI detection'
        }
    except Exception as e:
        return {'error': f'Vision analysis failed: {str(e)}', 'elements': []}


