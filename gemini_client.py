import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

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

    response = client.models.generate_content(
        model="gemini-3.8-flash",
        contents=prompt
    )
    return response.text

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