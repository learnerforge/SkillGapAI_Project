import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os

print("=" * 60)
print("SKILLGAP AI MODEL TRAINING - ENHANCED VERSION")
print("=" * 60)

# 1. Load Dataset
try:
    df = pd.read_csv('data/amcat_data.csv')
    print(f"[OK] Dataset loaded: {len(df)} records")
except FileNotFoundError:
    print("[ERROR] amcat_data.csv not found!")
    exit()

# 2. Feature Engineering
print("\n[STEP 1] Feature Engineering...")

# Select core aptitude features
aptitude_cols = ['Logical', 'Quant', 'English', 'ComputerProgramming', 'Domain']

# Handle missing values (-1 means not taken/test absent)
for col in aptitude_cols:
    if col in df.columns:
        valid_scores = df[df[col] > 0][col]
        if len(valid_scores) > 0:
            df[col] = df[col].replace(-1, valid_scores.mean())
        else:
            df[col] = df[col].replace(-1, 0)

# Create derived features
df['Total_Aptitude'] = df[['Logical', 'Quant', 'English']].sum(axis=1)
df['Tech_Score'] = df[['ComputerProgramming', 'Domain']].sum(axis=1)
df['Logical_Quant_Avg'] = (df['Logical'] + df['Quant']) / 2
df['English_Ratio'] = df['English'] / (df['Total_Aptitude'] + 1)

# Academic performance features
if 'collegeGPA' in df.columns:
    df['GPA_Normalized'] = df['collegeGPA'] / 100
    df['Strong_Academics'] = (df['collegeGPA'] > 75).astype(int)
else:
    df['GPA_Normalized'] = 0.7
    df['Strong_Academics'] = 0

# College tier factor
if 'CollegeTier' in df.columns:
    df['Top_College'] = (df['CollegeTier'] == 1).astype(int)
else:
    df['Top_College'] = 0

# Create target: High salary = 1, Low salary = 0
# 2026 market: Entry level 4-6 LPA, Mid 6-10 LPA, Senior 10+ LPA
if 'Salary' in df.columns:
    salary_percentile_75 = df['Salary'].quantile(0.75)
    df['High_Salary'] = (df['Salary'] >= salary_percentile_75).astype(int)
    print(f"[OK] Target created: High salary threshold = {salary_percentile_75:.0f} INR")
else:
    print("[ERROR] Salary column missing!")
    exit()

# 3. Feature Selection
features = [
    'Logical', 'Quant', 'English', 'ComputerProgramming', 'Domain',
    'Total_Aptitude', 'Tech_Score', 'Logical_Quant_Avg',
    'GPA_Normalized', 'Strong_Academics', 'Top_College'
]

# Verify all features exist
for col in features:
    if col not in df.columns:
        print(f"[WARNING] Column '{col}' not found, setting to 0")
        df[col] = 0

X = df[features].fillna(0)
y = df['High_Salary']

print(f"[OK] Features: {len(features)}")
print(f"[OK] Target distribution: {dict(y.value_counts())}")

# 4. Scale Features
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# 5. Train Model with multiple classifiers
print("\n[STEP 2] Training Ensemble Model...")

X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42, stratify=y)

# Random Forest with tuned parameters
rf_model = RandomForestClassifier(
    n_estimators=200,
    max_depth=15,
    min_samples_split=5,
    min_samples_leaf=2,
    random_state=42,
    class_weight='balanced',
    n_jobs=-1
)
rf_model.fit(X_train, y_train)
rf_pred = rf_model.predict(X_test)
rf_accuracy = accuracy_score(y_test, rf_pred)

# Gradient Boosting
gb_model = GradientBoostingClassifier(
    n_estimators=150,
    max_depth=6,
    learning_rate=0.1,
    random_state=42
)
gb_model.fit(X_train, y_train)
gb_pred = gb_model.predict(X_test)
gb_accuracy = accuracy_score(y_test, gb_pred)

# Choose best model
if rf_accuracy >= gb_accuracy:
    best_model = rf_model
    best_name = "Random Forest"
    best_accuracy = rf_accuracy
else:
    best_model = gb_model
    best_name = "Gradient Boosting"
    best_accuracy = gb_accuracy

print(f"\n[METHOD] {best_name}")
print(f"[ACCURACY] {best_accuracy * 100:.2f}%")

# Cross-validation score
cv_scores = cross_val_score(best_model, X_scaled, y, cv=5)
print(f"[CV SCORE] {cv_scores.mean() * 100:.2f}% (+/- {cv_scores.std() * 200:.2f}%)")

# Feature importance
print("\n[FEATURE IMPORTANCE]")
importance_df = pd.DataFrame({
    'Feature': features,
    'Importance': best_model.feature_importances_
}).sort_values('Importance', ascending=False)
for _, row in importance_df.iterrows():
    print(f"  {row['Feature']}: {row['Importance']:.3f}")

# 6. Save Model and Scaler
os.makedirs('models', exist_ok=True)
joblib.dump(best_model, 'models/rf_employability_model.pkl')
joblib.dump(scaler, 'models/scaler.pkl')
print(f"\n[OK] Model saved: models/rf_employability_model.pkl")
print(f"[OK] Scaler saved: models/scaler.pkl")

# 7. Classification Report
print("\n[CLASSIFICATION REPORT]")
print(classification_report(y_test, best_model.predict(X_test), target_names=['Low Employable', 'High Employable']))

print("\n" + "=" * 60)
print("TRAINING COMPLETE!")
print("=" * 60)
