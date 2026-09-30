from flask import Flask, request, jsonify
from rules import check_safety
from neo4j_client import query_interactions
import joblib
import pandas as pd

app = Flask(__name__)

# Load the trained model once, when the server starts
model = joblib.load('model/medassist_model.pkl')

# Get the exact list of symptom columns the model expects (same order as training)
symptom_columns = pd.read_csv('data/Training.csv').drop(columns=['Unnamed: 133', 'prognosis']).columns.tolist()

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

    # Query Neo4j for each medication's known relationships
    graph_relationships = []
    for med in medications:
        graph_relationships.extend(query_interactions(med))

    return jsonify({
        "predicted_condition": predicted_disease,
        "safety_warnings": safety_warnings,
        "graph_relationships": graph_relationships,
        "received": {
            "symptoms": symptoms,
            "conditions": conditions,
            "medications": medications
        }
    })

if __name__ == '__main__':
    app.run(debug=True)