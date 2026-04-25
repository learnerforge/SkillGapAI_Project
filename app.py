from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import joblib
import sqlite3
from datetime import datetime
import os

# NEW IMPORTS FOR PHASE 4 AI
import pickle
from sentence_transformers import SentenceTransformer

app = Flask(__name__)
CORS(app)

DB_PATH = 'data/skill_progress.db'

def init_db():
    os.makedirs('data', exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS skill_progress (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT, skill_name TEXT, target_role TEXT, status TEXT DEFAULT 'pending', resource_link TEXT, resource_name TEXT, duration TEXT, gap_score REAL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, completed_at TIMESTAMP, UNIQUE(user_id, skill_name, target_role))''')
    c.execute('''CREATE TABLE IF NOT EXISTS user_profiles (user_id TEXT PRIMARY KEY, name TEXT, email TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
    conn.commit()
    conn.close()

init_db()

print("Loading SkillGap AI Brain...")
try:
    benchmarks_df = pd.read_csv('data/job_benchmarks.csv')
    content_df = pd.read_csv('data/course_content.csv')
    rf_model = joblib.load('models/rf_employability_model.pkl')
    risk_model = joblib.load('models/dt_risk_model.pkl')
    print("All Phase 2 datasets and ML models loaded successfully!")
except Exception as e:
    print(f"Startup Warning: {e}")

print("🧠 Loading Phase 4 Enterprise Deep Learning Engine...")
try:
    nlp_model = SentenceTransformer('all-MiniLM-L6-v2')
    with open('custom_resume_classifier.pkl', 'rb') as f:
        classifier_model = pickle.load(f)
    print("✅ Phase 4 Custom AI Loaded Successfully!")
except Exception as e:
    print(f"Phase 4 AI Warning: {e}")
    classifier_model = None

SKILL_CONTENT_DB = {
    "SQL Database": {"name": "SQL for Data Analysis", "provider": "Udemy", "duration": "12 hours", "level": "Beginner"},
    "SQL Database Systems": {"name": "Advanced SQL & Database", "provider": "Coursera", "duration": "20 hours", "level": "Intermediate"},
    "Advanced SQL ETL": {"name": "SQL for Data Engineering", "provider": "DataCamp", "duration": "16 hours", "level": "Advanced"},
    "Excel Spreadsheets": {"name": "Excel Skills for Business", "provider": "Coursera", "duration": "20 hours", "level": "Beginner"},
    "Data Visualization": {"name": "Data Visualization Mastery", "provider": "Tableau", "duration": "8 hours", "level": "Beginner"},
    "Business Intelligence Tools": {"name": "PowerBI for Business", "provider": "Microsoft", "duration": "12 hours", "level": "Intermediate"},
    "Python Data Analysis": {"name": "Python for Everybody", "provider": "Coursera", "duration": "25 hours", "level": "Beginner"},
    "Python R Statistics": {"name": "Python & R for Data Science", "provider": "DataCamp", "duration": "30 hours", "level": "Intermediate"},
    "Pandas Data Cleaning": {"name": "Data Wrangling with Pandas", "provider": "DataCamp", "duration": "6 hours", "level": "Intermediate"},
    "Logical Reasoning": {"name": "Logical Reasoning Fundamentals", "provider": "Coursera", "duration": "6 hours", "level": "Beginner"},
    "Machine Learning Algorithms": {"name": "Machine Learning by Stanford", "provider": "Coursera", "duration": "55 hours", "level": "Intermediate"},
    "Deep Learning": {"name": "Deep Learning Specialization", "provider": "Coursera", "duration": "3 months", "level": "Advanced"},
    "NLP": {"name": "NLP Fundamentals", "provider": "Hugging Face", "duration": "15 hours", "level": "Intermediate"},
    "Computer Vision": {"name": "Computer Vision Bootcamp", "provider": "OpenCV", "duration": "18 hours", "level": "Advanced"}
}

COURSE_RESOURCES = {
    "SQL Database": [{"name": "SQL for Data Analysis", "link": "https://www.udemy.com/course/sql-for-data-analysis", "duration": "12 hours", "provider": "Udemy"}],
    "Machine Learning Models": [{"name": "Machine Learning by Stanford", "link": "https://www.coursera.org/learn/machine-learning", "duration": "55 hours", "provider": "Coursera"}],
    "Deep Learning": [{"name": "Deep Learning Specialization", "link": "https://www.coursera.org/specializations/deep-learning", "duration": "3 months", "provider": "Coursera"}]
}

def get_content_for_skill(skill_name):
    skill_lower = skill_name.lower()
    for key, resources in COURSE_RESOURCES.items():
        if key.lower() in skill_lower or skill_lower in key.lower(): return resources
    if skill_name in SKILL_CONTENT_DB:
        info = SKILL_CONTENT_DB[skill_name]
        return [{"name": info["name"], "link": f"https://www.google.com/search?q=learn+{skill_name.replace(' ', '+')}+course", "duration": info["duration"], "provider": info["provider"]}]
    return [{"name": f"Learn {skill_name}", "link": f"https://www.google.com/search?q=learn+{skill_name.replace(' ', '+')}+course+2026", "duration": "Varies", "provider": "Multiple"}]

def calculate_gap(student_scores, selected_skills, target_role, user_id="default"):
    role_rules = benchmarks_df[benchmarks_df['Role_Name'].str.strip() == target_role.strip()]
    if role_rules.empty: return {"error": "Role not found."}

    readiness_score = 0
    missing_skills = []
    recommended_links = []
    all_skills_data = []

    for index, row in role_rules.iterrows():
        skill_name = str(row['Skill_Name']).strip()
        mapped_column = str(row['Mapped_Column']).strip()
        required_score = float(row['Required_Score'])
        weightage = float(row['Weightage'])

        if mapped_column == 'Self_Rating': actual_score = 10.0 if skill_name in selected_skills else 0.0
        else: actual_score = float(student_scores.get(mapped_column, 0.0))
        
        gap = required_score - actual_score
        score_contribution = 0
        if required_score > 0: score_contribution = (actual_score / required_score) * weightage * 100
        if score_contribution > (weightage * 100): score_contribution = weightage * 100 
        readiness_score += score_contribution

        skill_data = {"skill": skill_name, "gap_amount": round(gap, 1), "required": required_score, "actual": actual_score, "is_missing": gap > 0, "status": "pending"}
        
        if gap > 0:
            missing_skills.append(skill_name)
            resources = get_content_for_skill(skill_name)
            skill_data["resources"] = resources
            remedy_link = resources[0].get('link', '') if resources and isinstance(resources, list) else ''
            
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            c.execute('''INSERT OR REPLACE INTO skill_progress (user_id, skill_name, target_role, status, resource_link, gap_score) VALUES (?, ?, ?, 'pending', ?, ?)''', (user_id, skill_name, target_role, remedy_link, round(gap, 1)))
            conn.commit()
            conn.close()
            
            recommended_links.append({"skill": skill_name, "gap_amount": round(gap, 1), "video_link": remedy_link, "resources": resources})
        
        all_skills_data.append(skill_data)

    final_score = round(readiness_score, 2)
    return {"target_role": target_role, "final_readiness_score": final_score, "is_job_ready": final_score >= 80, "missing_skills": missing_skills, "remedial_roadmap": recommended_links, "all_skills": all_skills_data}

@app.route('/api/analyze', methods=['POST'])
def analyze_student():
    data = request.json
    student_scores = data.get("scores", {})
    selected_skills = data.get("selected_skills", []) 
    target_role = data.get("target_role", "Data Analyst (Entry)")
    user_id = data.get("user_id", "default")
    
    # 1. Run your exact Phase 2 analysis
    results = calculate_gap(student_scores, selected_skills, target_role, user_id)
    
    # 2. Secretly run the new Phase 4 AI on the text!
    resume_text = data.get("resume_text", "")
    if classifier_model and resume_text and len(resume_text.split()) > 10:
        try:
            resume_vector = nlp_model.encode(resume_text, batch_size=1)
            predicted_role = classifier_model.predict([resume_vector])[0]
            results["ai_role"] = predicted_role
        except Exception as e:
            pass

    return jsonify(results)

if __name__ == '__main__':
    print("Starting SkillGap AI Brain on Port 5000...")
    app.run(debug=True, port=5000)