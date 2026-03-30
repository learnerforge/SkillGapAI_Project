import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import joblib
import os

print("Starting Model Training Process...")

# 1. Load the AMCAT Dataset
try:
    df = pd.read_csv('data/amcat_data.csv')
    print("Dataset loaded successfully.")
except FileNotFoundError:
    print("Error: amcat_data.csv not found in the 'data' folder.")
    exit()

# 2. Prepare Features (Inputs) and Target (Output)
# We use the core aptitude and technical scores as inputs
features = ['Logical', 'Quant', 'English', 'ComputerProgramming']

# Check if these columns exist, if not, print available columns to debug
for col in features:
    if col not in df.columns:
        print(f"Column '{col}' is missing! Available columns: {df.columns.tolist()}")
        exit()

# Fill any missing blank scores with 0
X = df[features].fillna(0)

# Create a Target variable: Let's assume a Salary >= 300,000 indicates a successful placement
if 'Salary' in df.columns:
    y = (df['Salary'] >= 300000).astype(int)
else:
    print("Salary column missing. Creating a mock target based on average scores for demonstration.")
    # Fallback if Salary column isn't there: Target based on passing a threshold
    y = ((X['Logical'] + X['Quant'] + X['ComputerProgramming']) > 1500).astype(int)

# 3. Split the data into Training (80%) and Testing (20%)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 4. Train the Random Forest Model
print("Training Random Forest Classifier...")
rf_model = RandomForestClassifier(n_estimators=100, random_state=42, max_depth=10)
rf_model.fit(X_train, y_train)

# 5. Test the Model's Accuracy
y_pred = rf_model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f"Model Training Complete! Accuracy: {accuracy * 100:.2f}%")

# 6. Save the Model to the 'models' folder
os.makedirs('models', exist_ok=True)
joblib.dump(rf_model, 'models/rf_employability_model.pkl')
print("Model saved to 'models/rf_employability_model.pkl'")