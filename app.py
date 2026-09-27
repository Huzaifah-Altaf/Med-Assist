from flask import Flask, request, jsonify

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

    return jsonify({
        "received": {
            "symptoms": symptoms,
            "conditions": conditions,
            "medications": medications
        },
        "message": "Data received successfully"
    })

if __name__ == '__main__':
    app.run(debug=True)