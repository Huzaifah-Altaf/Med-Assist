import os
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

DEFAULT_MODEL = "gemini-3.1-flash-lite"
GEMINI_MODEL = os.getenv("GEMINI_MODEL", DEFAULT_MODEL)
GEMINI_TIMEOUT_MS = 20_000

# The client is created on first use so a missing key does not prevent the
# Flask application from starting (app.py already has a graceful fallback).
_client = None


def _get_client():
    global _client

    if _client is None:
        api_key = os.getenv("GEMINI_API_KEY", "").strip()
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY is not configured")

        _client = genai.Client(
            api_key=api_key,
            http_options=types.HttpOptions(
                timeout=GEMINI_TIMEOUT_MS,
                retry_options=types.HttpRetryOptions(
                    attempts=3,
                    initial_delay=1,
                    max_delay=8,
                    http_status_codes=[408, 429, 500, 502, 503, 504],
                ),
            ),
        )

    return _client

def generate_explanation(predicted_condition, safety_warnings, graph_relationships, relevant_guidelines, symptoms, conditions, medications):
    prompt = f"""You are assisting a doctor by explaining a clinical decision support system's output in clear, professional language.

Patient case:
- Symptoms: {', '.join(symptoms) if symptoms else 'None listed'}
- Existing conditions: {', '.join(conditions) if conditions else 'None listed'}
- Current medications: {', '.join(medications) if medications else 'None listed'}

System findings:
- Predicted condition: {predicted_condition}
- Safety warnings: {safety_warnings if safety_warnings else 'None'}
- Known drug relationships: {graph_relationships if graph_relationships else 'None'}
- Relevant clinical guidelines: {relevant_guidelines if relevant_guidelines else 'None'}

Write a brief, clear explanation (3-5 sentences) for the doctor, summarizing the predicted condition, any safety concerns, and a relevant recommendation. Be direct and professional, as if speaking to a colleague."""

    response = _get_client().models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt
    )
    text = getattr(response, "text", None)
    if not isinstance(text, str) or not text.strip():
        raise RuntimeError("Gemini returned an empty explanation")
    return text.strip()

if __name__ == '__main__':
    result = generate_explanation(
        predicted_condition="Fungal infection",
        safety_warnings=[],
        graph_relationships=[{"relationship": "CONTRAINDICATED_FOR", "target": "CKD"}],
        relevant_guidelines=["Fungal skin infections typically present with itching, redness, and skin eruptions. Topical antifungal treatment is usually the first-line approach."],
        symptoms=["itching", "skin_rash"],
        conditions=[],
        medications=["Ibuprofen"]
    )
    print(result)
