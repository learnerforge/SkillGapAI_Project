import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier  # <-- Fixed import!
from sklearn.metrics import accuracy_score
import joblib
import os

print("Starting Academic Risk Model Training...")

# 1. Load the exact Dropout Dataset
try:
    df = pd.read_csv('data/students_dropout_academic_success.csv')
    print("Dropout dataset loaded successfully.")
except FileNotFoundError:
    print("Error: Could not find students_dropout_academic_success.csv in 'data' folder.")
    exit()

# 2. Select Features (We will look at how they performed in their 1st Semester)
features = [
    'Curricular units 1st sem (enrolled)', 
    'Curricular units 1st sem (approved)', 
    'Curricular units 1st sem (grade)'
]

X = df[features].fillna(0)

# 3. Define the Target (1 = Graduate/Safe, 0 = Dropout or still Enrolled)
y = (df['target'] == 'Graduate').astype(int)

# 4. Train the Decision Tree Model
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print("Training Decision Tree...")
risk_model = DecisionTreeClassifier(max_depth=5, random_state=42)
risk_model.fit(X_train, y_train)

# 5. Check Accuracy
y_pred = risk_model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f"Risk Model Training Complete! Accuracy: {accuracy * 100:.2f}%")

# 6. Save the Model
os.makedirs('models', exist_ok=True)
joblib.dump(risk_model, 'models/dt_risk_model.pkl')
print("Model saved to 'models/dt_risk_model.pkl'")