import pandas as pd
import json
import pickle
from sentence_transformers import SentenceTransformer
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report

print(" Starting AI Training Sequence...")

# 1. LOAD THE JSONL DATASET
print(" Loading resume dataset...")
data = []
with open('resumes_dataset (1).jsonl', 'r', encoding='utf-8') as f:
    for line in f:
        data.append(json.loads(line))

df = pd.DataFrame(data)
print(f" Loaded {len(df)} resumes across {df['Category'].nunique()} categories.")

# 2. LOAD THE NLP BRAIN
print(" Loading NLP Sentence Transformer...")
# This turns text into 384-dimensional mathematical vectors
model = SentenceTransformer('all-MiniLM-L6-v2')

# 3. VECTORIZE THE RESUME TEXT
# We encode the raw 'Text' of each resume. 
# Using batch_size=16 so it doesn't crash your 8GB RAM!
print(" Converting resumes to mathematical vectors (This may take a few minutes)...")
X = model.encode(df['Text'].tolist(), batch_size=16, show_progress_bar=True)
y = df['Category']

# 4. SPLIT THE DATA
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 5. TRAIN THE CUSTOM MODEL
print(" Training the Custom Random Forest Engine...")
clf = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
clf.fit(X_train, y_train)

# 6. TEST THE ACCURACY
print("\n AI Evaluation Metrics:")
y_pred = clf.predict(X_test)
print(classification_report(y_test, y_pred))

# 7. SAVE THE TRAINED AI
print(" Saving your custom AI model...")
with open('custom_resume_classifier.pkl', 'wb') as f:
    pickle.dump(clf, f)

print(" Training Complete! Saved as 'custom_resume_classifier.pkl'")