from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import joblib
import sqlite3
from datetime import datetime
import os
import pickle
from sentence_transformers import SentenceTransformer

import course_db

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
benchmarks_df = None
content_df = None
rf_model = None
risk_model = None
try:
    benchmarks_df = pd.read_csv('data/job_benchmarks.csv')
    content_df = pd.read_csv('data/course_content.csv')
    print("CSV datasets loaded successfully!")
except Exception as e:
    print(f"CSV Warning: {e}")
try:
    rf_model = joblib.load('models/rf_employability_model.pkl')
    risk_model = joblib.load('models/dt_risk_model.pkl')
    print("ML models loaded successfully!")
except Exception as e:
    print(f"Model Warning: {e}")

print("Loading Phase 4 Enterprise Deep Learning Engine...")
nlp_model = None
classifier_model = None
try:
    nlp_model = SentenceTransformer('all-MiniLM-L6-v2')
    with open('custom_resume_classifier.pkl', 'rb') as f:
        classifier_model = pickle.load(f)
    print("Phase 4 Custom AI Loaded Successfully!")
except Exception as e:
    print(f"Phase 4 AI Warning: {e}")

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
        if key.lower() in skill_lower or skill_lower in key.lower():
            return resources
    if skill_name in SKILL_CONTENT_DB:
        info = SKILL_CONTENT_DB[skill_name]
        return [{"name": info["name"], "link": f"https://www.google.com/search?q=learn+{skill_name.replace(' ', '+')}+course", "duration": info["duration"], "provider": info["provider"]}]
    resources = course_db.get_courses(skill=skill_name, limit=3)
    if resources:
        return [{"name": r["title"], "link": r["url"] or f"https://www.google.com/search?q=learn+{skill_name.replace(' ', '+')}+course", "duration": r.get("duration") or "Varies", "provider": r.get("provider_name") or "Multiple"} for r in resources]
    return [{"name": f"Learn {skill_name}", "link": f"https://www.google.com/search?q=learn+{skill_name.replace(' ', '+')}+course+2026", "duration": "Varies", "provider": "Multiple"}]

def calculate_gap(student_scores, selected_skills, target_role, user_id="default"):
    if isinstance(benchmarks_df, pd.DataFrame) and not benchmarks_df.empty:
        role_rules = benchmarks_df[benchmarks_df['Role_Name'].str.strip() == target_role.strip()]
        if not role_rules.empty:
            return _calculate_gap_csv(role_rules, student_scores, selected_skills, target_role, user_id)
    skills_required, _ = course_db.get_skills_for_role_by_name(target_role)
    if skills_required:
        return _calculate_gap_db(target_role, skills_required, student_scores, selected_skills, user_id)
    return {"error": "Role not found.", "final_readiness_score": 0, "missing_skills": [], "remedial_roadmap": []}

def _calculate_gap_csv(role_rules, student_scores, selected_skills, target_role, user_id):
    readiness_score = 0
    missing_skills = []
    recommended_links = []
    all_skills_data = []

    for index, row in role_rules.iterrows():
        skill_name = str(row['Skill_Name']).strip()
        mapped_column = str(row['Mapped_Column']).strip()
        required_score = float(row['Required_Score'])
        weightage = float(row['Weightage'])

        if mapped_column == 'Self_Rating':
            actual_score = 10.0 if skill_name in selected_skills else 0.0
        else:
            actual_score = float(student_scores.get(mapped_column, 0.0))

        gap = required_score - actual_score
        score_contribution = 0
        if required_score > 0:
            score_contribution = (actual_score / required_score) * weightage * 100
        if score_contribution > (weightage * 100):
            score_contribution = weightage * 100
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

def _calculate_gap_db(target_role, skills_required, student_scores, selected_skills, user_id):
    readiness_score = 0
    missing_skills = []
    recommended_links = []
    all_skills_data = []

    weight = 100.0 / len(skills_required) if skills_required else 0

    for skill_name in skills_required:
        required_score = 7.0
        actual_score = 10.0 if skill_name in selected_skills else float(student_scores.get(skill_name, 0.0))
        gap = required_score - actual_score
        score_contribution = (actual_score / required_score) * weight if required_score > 0 else 0
        if score_contribution > weight:
            score_contribution = weight
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

    results = calculate_gap(student_scores, selected_skills, target_role, user_id)

    resume_text = data.get("resume_text", "")
    if classifier_model and resume_text and len(resume_text.split()) > 10:
        try:
            resume_vector = nlp_model.encode(resume_text, batch_size=1)
            predicted_role = classifier_model.predict([resume_vector])[0]
            results["ai_role"] = predicted_role
        except Exception as e:
            pass

    return jsonify(results)

@app.route('/api/roles', methods=['GET'])
def get_roles():
    domain = request.args.get('domain')
    roles = course_db.get_all_roles()
    if domain:
        roles = [r for r in roles if r.get('domain', '').lower() == domain.lower()]
    return jsonify(roles)

@app.route('/api/roles/<role_id>', methods=['GET'])
def get_role(role_id):
    role = course_db.get_role(role_id)
    if not role:
        return jsonify({"error": "Role not found"}), 404
    skills_required, skills_optional = course_db.get_skills_for_role(role_id)
    role['required_skills_list'] = skills_required
    role['optional_skills_list'] = skills_optional
    return jsonify(role)

@app.route('/api/courses', methods=['GET'])
def get_courses():
    skill = request.args.get('skill')
    difficulty = request.args.get('difficulty')
    provider = request.args.get('provider')
    limit = int(request.args.get('limit', 50))
    offset = int(request.args.get('offset', 0))
    courses = course_db.get_courses(skill=skill, difficulty=difficulty, provider=provider, limit=limit, offset=offset)
    return jsonify(courses)

@app.route('/api/courses/<course_id>', methods=['GET'])
def get_course(course_id):
    course = course_db.get_course(course_id)
    if not course:
        return jsonify({"error": "Course not found"}), 404
    return jsonify(course)

@app.route('/api/skills', methods=['GET'])
def get_skills():
    search = request.args.get('search')
    skills = course_db.get_skills(search=search)
    return jsonify(skills)

@app.route('/api/recommendations', methods=['GET'])
def get_recommendations():
    role_id = request.args.get('role_id')
    limit = int(request.args.get('limit', 20))
    if not role_id:
        return jsonify({"error": "role_id is required"}), 400
    recommendations = course_db.get_recommendations(role_id, limit=limit)
    return jsonify(recommendations)

@app.route('/api/providers', methods=['GET'])
def get_providers():
    providers = course_db.get_providers()
    return jsonify(providers)

if __name__ == '__main__':
    print("Starting SkillGap AI Brain on Port 5000...")
    app.run(debug=True, port=5000)
