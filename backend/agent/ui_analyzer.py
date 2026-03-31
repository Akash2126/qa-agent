"""
backend/agent/ui_analyzer.py - Analyze Website URL → Extract UI structure/elements
"""
import httpx
import re
from bs4 import BeautifulSoup
from typing import Dict, Any, List
from pydantic import BaseModel

class UIElement(BaseModel):
    type: str  # button | input | link | form | heading
    text: str
    selector: str
    attributes: dict

async def analyze_url(url: str) -> Dict[str, Any]:
    """
    Fetch URL -> parse HTML -> extract clickable elements, forms, navigation.
    Returns UI analysis dict similar to code analysis.
    """
    try:
        async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
            resp = await client.get(url)
            resp.raise_for_status()
        
        soup = BeautifulSoup(resp.text, 'html.parser')
        
        # Extract key UI elements
        buttons = []
        for btn in soup.find_all(['button', 'a', '[role=\"button\"]'], string=re.compile(r'.{2,}')):
            buttons.append({
                'type': 'button',
                'text': btn.get_text(strip=True),
                'selector': btn.get('href') or btn.get('id') or btn.name,
                'attributes': dict(btn.attrs)
            })
        
        forms = []
        for form in soup.find_all('form'):
            forms.append({
                'action': form.get('action'),
                'method': form.get('method', 'get'),
                'inputs': len(form.find_all(['input', 'textarea', 'select']))
            })
        
        nav_links = [a.get('href') for a in soup.find_all('a', href=True) if 'nav' in a.parent.get('class', []) or len(a.get_text(strip=True)) < 50]
        
        return {
            'raw_html': resp.text[:5000],  # Truncated
            'url': url,
            'title': soup.title.string if soup.title else 'No title',
            'buttons': buttons[:20],
            'forms': forms,
            'nav_links': nav_links[:10],
            'has_login': bool(soup.find(string=re.compile(r'login|sign', re.I))),
            'has_search': bool(soup.find('input', {'type': 'search'}) or soup.find(string=re.compile(r'search', re.I))),
            'ui_complexity': len(buttons) + len(forms) + len(nav_links)
        }
    except Exception as e:
        return {'error': str(e), 'url': url}
