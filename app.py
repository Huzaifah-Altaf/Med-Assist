from flask import Flask, request, jsonify
from rules import check_safety

app = Flask(__name__)

@app.route('/')
def home():
    return "MedAssist backend is running!!"

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()

    symptoms = data.get('symptoms')
    conditions = data.get('conditions')
    medications = data.get('medications')

    safety_warnings = check_safety(conditions, medications)

    return jsonify({
        "received": {
            "symptoms": symptoms,
            "conditions": conditions,
            "medications": medications
        },
        "safety_warnings": safety_warnings,
        "message": "Data received successfully"
    })

if __name__ == '__main__':
    app.run(debug=True)