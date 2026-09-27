import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score

# Load and clean data
df = pd.read_csv('data/Training.csv')
df = df.drop(columns=['Unnamed: 133'])

# Separate inputs (X) from the answer (y)
X = df.drop(columns=['prognosis'])   # all 132 symptom columns
y = df['prognosis']                  # the disease name

# Split into train and test sets (80% train, 20% test)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train a Decision Tree
model = DecisionTreeClassifier(random_state=42)
model.fit(X_train, y_train)

# Test it
predictions = model.predict(X_test)
accuracy = accuracy_score(y_test, predictions)

print(f"Decision Tree Accuracy: {accuracy * 100:.2f}%")

from sklearn.ensemble import RandomForestClassifier

# Train a Random Forest
rf_model = RandomForestClassifier(random_state=42)
rf_model.fit(X_train, y_train)

rf_predictions = rf_model.predict(X_test)
rf_accuracy = accuracy_score(y_test, rf_predictions)

print(f"Random Forest Accuracy: {rf_accuracy * 100:.2f}%")

import joblib
import os

os.makedirs('model', exist_ok=True)
joblib.dump(rf_model, 'model/medassist_model.pkl')
print("Model saved to model/medassist_model.pkl")