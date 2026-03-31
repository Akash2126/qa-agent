import httpx
import json
from typing import Optional

OLLAMA_URL = "http://localhost:11434/api/generate"

async def call_llama(user_prompt: str, system_prompt: str = "") -> str:
    """
    Call local Ollama llama3 model. Returns generated text.
    Raises httpx exceptions if Ollama not running.
    """
    full_prompt = ""
    if system_prompt:
        full_prompt += f"<|system|>\n{system_prompt}\n<|end|>\n\n"
    full_prompt += f"<|user|>\n{user_prompt}\n<|end|>\n\n<|assistant|>\n"
    
    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.post(
                OLLAMA_URL,
                json={
                    "model": "llama3",
                    "prompt": full_prompt,
                    "stream": False,
                    "format": "json",
                    "options": {
                        "temperature": 0.3,
                        "num_predict": 2000,
                    }
                }
            )
            resp.raise_for_status()
            data = resp.json()
            return data["response"].strip()
    except Exception as e:
        raise Exception(f"Ollama unavailable: {str(e)}. Ensure `ollama serve` running and `ollama pull llama3` done.")
