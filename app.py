from flask import Flask, request, jsonify
from flask_cors import CORS
from rules import check_safety
from neo4j_client import query_patient_interactions
from pinecone_client import search_guidelines
from gemini_client import generate_explanation
import joblib
import pandas as pd

app = Flask(__name__)
CORS(app)

# Lookup table: short source name -> full name shown on the page
SOURCE_NAMES = {
    'NIDDK': 'National Institute of Diabetes and Digestive and Kidney Diseases (NIH)',
    'NHLBI': 'National Heart, Lung, and Blood Institute (NIH)',
    'MPlusHealthTopics': 'MedlinePlus Health Topics (U.S. National Library of Medicine, NIH)',
    'NIHSeniorHealth': 'NIHSeniorHealth (National Institutes of Health)',
    'CDC': 'Centers for Disease Control and Prevention',
}

def full_source_name(code):
    if not code:
        return 'Source not recorded'
    return SOURCE_NAMES.get(code, code)

# Load the trained model once, when the server starts
model = joblib.load('model/medassist_model.pkl')

# Get the exact list of symptom columns the model expects (same order as training)
symptom_columns = pd.read_csv('data/Training.csv').drop(columns=['Unnamed: 133', 'prognosis']).columns.tolist()


@app.route('/symptoms')
def get_symptoms():
    return jsonify(symptom_columns)

@app.route('/')
def home():
    return "MedAssist backend is running!!"

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()

    symptoms = data.get('symptoms', [])
    conditions = data.get('conditions', [])
    medications = data.get('medications', [])

    # Build the input row the model expects: 1 if symptom present, 0 if not
    input_row = [1 if col in symptoms else 0 for col in symptom_columns]

    # Predict the disease
    predicted_disease = model.predict([input_row])[0]

    # Run safety checks
    safety_warnings = check_safety(conditions, medications)

    
        # Query Neo4j for interactions that apply to THIS patient only
    graph_relationships = query_patient_interactions(medications, conditions)

     # Search Pinecone for relevant clinical guidelines
    query_text = f"Patient with {', '.join(conditions)} taking {', '.join(medications)}, symptoms: {', '.join(symptoms)}"
    guideline_results = search_guidelines(query_text)
    relevant_guidelines = [
        {
            "text": hit.fields['text'],
            "source": full_source_name(hit.fields.get('source')),
        }
        for hit in guideline_results.result.hits
    ]
    guideline_texts = [g["text"] for g in relevant_guidelines]

        # Generate a clear explanation using Gemini
    try:
        explanation = generate_explanation(
            predicted_condition=predicted_disease,
            safety_warnings=safety_warnings,
            graph_relationships=graph_relationships,
            relevant_guidelines=guideline_texts,
            symptoms=symptoms,
            conditions=conditions,
            medications=medications
        )
    except Exception as e:
        print("Gemini error:", e)
        explanation = "Explanation is temporarily unavailable. Please review the safety warnings above and try again later."

    return jsonify({
        "predicted_condition": predicted_disease,
        "safety_warnings": safety_warnings,
        "graph_relationships": graph_relationships,
        "relevant_guidelines": relevant_guidelines,
        "explanation": explanation,
        "received": {
            "symptoms": symptoms,
            "conditions": conditions,
            "medications": medications
        }
    })

if __name__ == '__main__':
    app.run(debug=True)