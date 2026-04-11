from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import joblib
import sqlite3
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)

DB_PATH = 'data/skill_progress.db'

def init_db():
    os.makedirs('data', exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS skill_progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            skill_name TEXT,
            target_role TEXT,
            status TEXT DEFAULT 'pending',
            resource_link TEXT,
            resource_name TEXT,
            duration TEXT,
            gap_score REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP,
            UNIQUE(user_id, skill_name, target_role)
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS user_profiles (
            user_id TEXT PRIMARY KEY,
            name TEXT,
            email TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

init_db()

print("Loading SkillGap AI Brain...")
try:
    benchmarks_df = pd.read_csv('data/job_benchmarks.csv')
    content_df = pd.read_csv('data/course_content.csv')
    rf_model = joblib.load('models/rf_employability_model.pkl')
    risk_model = joblib.load('models/dt_risk_model.pkl')
    print("All datasets and ML models loaded successfully!")
except Exception as e:
    print(f"Startup Warning: {e}")

SKILL_CONTENT_DB = {
    "SQL Database": {"name": "SQL for Data Analysis", "provider": "Udemy", "duration": "12 hours", "level": "Beginner"},
    "SQL Database Systems": {"name": "Advanced SQL & Database", "provider": "Coursera", "duration": "20 hours", "level": "Intermediate"},
    "Advanced SQL ETL": {"name": "SQL for Data Engineering", "provider": "DataCamp", "duration": "16 hours", "level": "Advanced"},
    "Excel Spreadsheets": {"name": "Excel Skills for Business", "provider": "Coursera", "duration": "20 hours", "level": "Beginner"},
    "Excel Advanced": {"name": "Advanced Excel Modeling", "provider": "Udemy", "duration": "10 hours", "level": "Advanced"},
    "Data Visualization": {"name": "Data Visualization Mastery", "provider": "Tableau", "duration": "8 hours", "level": "Beginner"},
    "Data Visualization (Tableau/PowerBI)": {"name": "Tableau & PowerBI Complete", "provider": "Udemy", "duration": "15 hours", "level": "Intermediate"},
    "Business Intelligence Tools": {"name": "PowerBI for Business", "provider": "Microsoft", "duration": "12 hours", "level": "Intermediate"},
    "Python Data Analysis": {"name": "Python for Everybody", "provider": "Coursera", "duration": "25 hours", "level": "Beginner"},
    "Python R Statistics": {"name": "Python & R for Data Science", "provider": "DataCamp", "duration": "30 hours", "level": "Intermediate"},
    "Pandas Data Cleaning": {"name": "Data Wrangling with Pandas", "provider": "DataCamp", "duration": "6 hours", "level": "Intermediate"},
    "Data Wrangling": {"name": "Data Wrangling Masterclass", "provider": "Udemy", "duration": "8 hours", "level": "Intermediate"},
    "Logical Reasoning": {"name": "Logical Reasoning Fundamentals", "provider": "Coursera", "duration": "6 hours", "level": "Beginner"},
    "Problem Solving": {"name": "Problem Solving Techniques", "provider": "Udemy", "duration": "5 hours", "level": "Beginner"},
    "Quantitative Analysis": {"name": "Quantitative Aptitude", "provider": "Udemy", "duration": "10 hours", "level": "Intermediate"},
    "Statistical Modeling": {"name": "Statistical Modeling in R/Python", "provider": "Coursera", "duration": "25 hours", "level": "Advanced"},
    "Statistics & Linear Algebra": {"name": "Statistics & Linear Algebra for ML", "provider": "Khan Academy", "duration": "20 hours", "level": "Intermediate"},
    "Python & Data Structures": {"name": "Python Data Structures", "provider": "Coursera", "duration": "15 hours", "level": "Beginner"},
    "Advanced Python": {"name": "Advanced Python Programming", "provider": "Udemy", "duration": "20 hours", "level": "Advanced"},
    "Advanced Python Programming": {"name": "Advanced Python Mastery", "provider": "Coursera", "duration": "25 hours", "level": "Advanced"},
    "Machine Learning Algorithms": {"name": "Machine Learning by Stanford", "provider": "Coursera", "duration": "55 hours", "level": "Intermediate"},
    "ML Algorithms": {"name": "ML Algorithm Implementation", "provider": "Fast.ai", "duration": "30 hours", "level": "Intermediate"},
    "Deep Learning": {"name": "Deep Learning Specialization", "provider": "Coursera", "duration": "3 months", "level": "Advanced"},
    "Deep Learning (TensorFlow/PyTorch)": {"name": "Deep Learning with TensorFlow", "provider": "TensorFlow", "duration": "40 hours", "level": "Advanced"},
    "Feature Engineering": {"name": "Feature Engineering for ML", "provider": "Kaggle", "duration": "8 hours", "level": "Intermediate"},
    "MLOps": {"name": "MLOps Specialization", "provider": "Coursera", "duration": "20 hours", "level": "Advanced"},
    "MLOps Fundamentals": {"name": "MLOps Fundamentals", "provider": "Google Cloud", "duration": "12 hours", "level": "Intermediate"},
    "NLP": {"name": "NLP Fundamentals", "provider": "Hugging Face", "duration": "15 hours", "level": "Intermediate"},
    "Natural Language Processing": {"name": "NLP with Transformers", "provider": "Hugging Face", "duration": "20 hours", "level": "Advanced"},
    "Computer Vision": {"name": "Computer Vision Bootcamp", "provider": "OpenCV", "duration": "18 hours", "level": "Advanced"},
    "Large Language Models": {"name": "Building with LLMs", "provider": "DeepLearning.AI", "duration": "15 hours", "level": "Advanced"},
    "LLM RAG": {"name": "RAG Systems Implementation", "provider": "Anthropic", "duration": "10 hours", "level": "Advanced"},
    "Python Spark": {"name": "PySpark for Data Engineering", "provider": "Databricks", "duration": "20 hours", "level": "Intermediate"},
    "Big Data Technologies": {"name": "Big Data Engineering", "provider": "Cloudera", "duration": "30 hours", "level": "Advanced"},
    "Cloud Platforms (AWS/GCP/Azure)": {"name": "Cloud Data Engineering", "provider": "AWS/GCP", "duration": "25 hours", "level": "Intermediate"},
    "Cloud AWS GCP": {"name": "Multi-Cloud Fundamentals", "provider": "Google Cloud", "duration": "20 hours", "level": "Intermediate"},
    "Data Pipeline & ETL Tools": {"name": "ETL Pipeline Design", "provider": "Udemy", "duration": "15 hours", "level": "Intermediate"},
    "System Design": {"name": "System Design Interview", "provider": "Exponent", "duration": "15 hours", "level": "Advanced"},
    "System Design Basics": {"name": "Intro to System Design", "provider": "Educative", "duration": "8 hours", "level": "Intermediate"},
    "Data Structures & Algorithms": {"name": "Algorithms Part 1 & 2", "provider": "Princeton", "duration": "40 hours", "level": "Intermediate"},
    "Algorithms & Logic": {"name": "Algorithm Design Manual", "provider": "Coursera", "duration": "30 hours", "level": "Advanced"},
    "Version Control & Git": {"name": "Git & GitHub Bootcamp", "provider": "Udemy", "duration": "12 hours", "level": "Beginner"},
    "Git Version Control": {"name": "Version Control with Git", "provider": "Atlassian", "duration": "6 hours", "level": "Beginner"},
    "Object-Oriented Programming": {"name": "OOP in Python/Java", "provider": "Udemy", "duration": "15 hours", "level": "Intermediate"},
    "Docker Kubernetes": {"name": "Container Orchestration", "provider": "Kubernetes", "duration": "20 hours", "level": "Advanced"},
    "Communication Skills": {"name": "Business Communication", "provider": "LinkedIn Learning", "duration": "8 hours", "level": "Beginner"},
    "Presentation & Communication": {"name": "Professional Presentations", "provider": "Coursera", "duration": "10 hours", "level": "Intermediate"},
    "Business Acumen": {"name": "Business Fundamentals", "provider": "Harvard", "duration": "12 hours", "level": "Intermediate"},
}

COURSE_RESOURCES = {
    "SQL Database": [
        {"name": "SQL for Data Analysis", "link": "https://www.udemy.com/course/sql-for-data-analysis", "duration": "12 hours", "provider": "Udemy"},
        {"name": "The Complete SQL Bootcamp", "link": "https://www.udemy.com/course/the-complete-sql-bootcamp/", "duration": "9 hours", "provider": "Udemy"}
    ],
    "Excel Spreadsheets": [
        {"name": "Excel Skills for Business", "link": "https://www.coursera.org/specializations/excel-skills-for-business", "duration": "20 hours", "provider": "Coursera"},
        {"name": "Advanced Excel Formulas", "link": "https://www.udemy.com/course/advanced-excel-formulas/", "duration": "8 hours", "provider": "Udemy"}
    ],
    "Data Visualization": [
        {"name": "Tableau A-Z", "link": "https://www.udemy.com/course/tableau-10/", "duration": "15 hours", "provider": "Udemy"},
        {"name": "Data Visualization with Tableau", "link": "https://www.coursera.org/learn/data-visualization-tableau", "duration": "20 hours", "provider": "Coursera"}
    ],
    "Machine Learning Models": [
        {"name": "Machine Learning by Stanford", "link": "https://www.coursera.org/learn/machine-learning", "duration": "55 hours", "provider": "Coursera"},
        {"name": "ML Specialization", "link": "https://www.coursera.org/specializations/machine-learning-intro", "duration": "40 hours", "provider": "Coursera"}
    ],
    "Deep Learning": [
        {"name": "Deep Learning Specialization", "link": "https://www.coursera.org/specializations/deep-learning", "duration": "3 months", "provider": "Coursera"},
        {"name": "Fast.ai Practical DL", "link": "https://course.fast.ai/", "duration": "2 months", "provider": "Fast.ai"}
    ],
    "NLP": [
        {"name": "NLP with Transformers", "link": "https://huggingface.co/learn/nlp-course", "duration": "20 hours", "provider": "Hugging Face"},
        {"name": "Advanced NLP with spaCy", "link": "https://course.spacy.io/", "duration": "10 hours", "provider": "spaCy"}
    ],
    "Computer Vision": [
        {"name": "CV with Deep Learning", "link": "https://www.udemy.com/course/computer-vision-python/", "duration": "18 hours", "provider": "Udemy"},
        {"name": "OpenCV Tutorial", "link": "https://docs.opencv.org/", "duration": "Self-paced", "provider": "OpenCV"}
    ],
    "Cloud Platforms": [
        {"name": "AWS Solutions Architect", "link": "https://aws.amazon.com/certification/certified-solutions-architect-associate/", "duration": "40 hours", "provider": "AWS"},
        {"name": "GCP Data Engineer", "link": "https://cloud.google.com/certification/data-engineer", "duration": "50 hours", "provider": "Google"}
    ],
    "System Design": [
        {"name": "System Design Interview", "link": "https://www.tryexponent.com/courses/system-design", "duration": "15 hours", "provider": "Exponent"},
        {"name": "Grokking System Design", "link": "https://www.educative.io/course/grokking-the-system-design-interview", "duration": "20 hours", "provider": "Educative"}
    ],
    "Algorithms": [
        {"name": "Algorithms Part 1 & 2", "link": "https://www.coursera.org/learn/algorithms-part1", "duration": "40 hours", "provider": "Princeton"},
        {"name": "LeetCode Patterns", "link": "https://leetcode.com/explore/", "duration": "Self-paced", "provider": "LeetCode"}
    ]
}

def get_content_for_skill(skill_name):
    skill_lower = skill_name.lower()
    
    for key, resources in COURSE_RESOURCES.items():
        if key.lower() in skill_lower or skill_lower in key.lower():
            return resources
    
    if skill_name in SKILL_CONTENT_DB:
        info = SKILL_CONTENT_DB[skill_name]
        return [{
            "name": info["name"],
            "link": f"https://www.google.com/search?q=learn+{skill_name.replace(' ', '+')}+course",
            "duration": info["duration"],
            "provider": info["provider"]
        }]
    
    return [{
        "name": f"Learn {skill_name}",
        "link": f"https://www.google.com/search?q=learn+{skill_name.replace(' ', '+')}+course+2026",
        "duration": "Varies",
        "provider": "Multiple"
    }]

def calculate_gap(student_scores, selected_skills, target_role, user_id="default"):
    role_rules = benchmarks_df[benchmarks_df['Role_Name'].str.strip() == target_role.strip()]
    
    if role_rules.empty:
        return {"error": "Role not found."}

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

        skill_data = {
            "skill": skill_name,
            "gap_amount": round(gap, 1),
            "required": required_score,
            "actual": actual_score,
            "is_missing": gap > 0,
            "status": "pending"
        }
        
        if gap > 0:
            missing_skills.append(skill_name)
            resources = get_content_for_skill(skill_name)
            skill_data["resources"] = resources
            
            # Persist progress with a safe default if resource fields are missing
            remedy_link = resources[0].get('link', '') if resources and isinstance(resources, list) else ''
            remedy_name = resources[0].get('name', '') if resources and isinstance(resources, list) else ''
            remedy_duration = resources[0].get('duration', '') if resources and isinstance(resources, list) else ''

            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            c.execute('''
                INSERT OR REPLACE INTO skill_progress 
                (user_id, skill_name, target_role, status, resource_link, resource_name, duration, gap_score)
                VALUES (?, ?, ?, 'pending', ?, ?, ?, ?)
            ''', (
                user_id, skill_name, target_role,
                remedy_link, remedy_name,
                remedy_duration, round(gap, 1)
            ))
            conn.commit()
            conn.close()
            
            recommended_links.append({
                "skill": skill_name, 
                "gap_amount": round(gap, 1),
                "video_link": remedy_link,
                "duration": remedy_duration,
                "resources": resources
            })
        
        all_skills_data.append(skill_data)

    final_score = round(readiness_score, 2)
    
    return {
        "target_role": target_role,
        "final_readiness_score": final_score,
        "is_job_ready": final_score >= 80,
        "missing_skills": missing_skills,
        "remedial_roadmap": recommended_links,
        "all_skills": all_skills_data
    }

@app.route('/api/analyze', methods=['POST'])
def analyze_student():
    data = request.json
    student_scores = data.get("scores", {})
    selected_skills = data.get("selected_skills", []) 
    target_role = data.get("target_role", "Data Analyst (Entry)")
    user_id = data.get("user_id", "default")
    
    results = calculate_gap(student_scores, selected_skills, target_role, user_id)
    return jsonify(results)

@app.route('/api/analyze', methods=['GET'])
def analyze_student_get():
    # Explicit guidance for GET requests
    return jsonify({"error": "POST method required. Use /api/analyze with a JSON payload."}), 405

@app.route('/api/progress', methods=['GET'])
def get_progress():
    user_id = request.args.get('user_id', 'default')
    target_role = request.args.get('target_role', None)
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    if target_role:
        c.execute('''
            SELECT * FROM skill_progress 
            WHERE user_id = ? AND target_role = ?
            ORDER BY created_at DESC
        ''', (user_id, target_role))
    else:
        c.execute('''
            SELECT * FROM skill_progress 
            WHERE user_id = ?
            ORDER BY created_at DESC
        ''', (user_id,))
    
    rows = c.fetchall()
    conn.close()
    
    skills = [dict(row) for row in rows]
    
    total = len(skills)
    completed = len([s for s in skills if s['status'] == 'completed'])
    pending = len([s for s in skills if s['status'] == 'pending'])
    in_progress = len([s for s in skills if s['status'] == 'in_progress'])
    
    return jsonify({
        "skills": skills,
        "total": total,
        "completed": completed,
        "pending": pending,
        "in_progress": in_progress,
        "completion_rate": round((completed / total * 100) if total > 0 else 0, 1)
    })

@app.route('/api/progress/update', methods=['POST'])
def update_progress():
    data = request.json
    user_id = data.get("user_id", "default")
    skill_name = data.get("skill_name")
    target_role = data.get("target_role")
    status = data.get("status", "in_progress")
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    if status == 'completed':
        c.execute('''
            UPDATE skill_progress 
            SET status = ?, completed_at = ?
            WHERE user_id = ? AND skill_name = ? AND target_role = ?
        ''', (status, datetime.now(), user_id, skill_name, target_role))
    else:
        c.execute('''
            UPDATE skill_progress 
            SET status = ?
            WHERE user_id = ? AND skill_name = ? AND target_role = ?
        ''', (status, user_id, skill_name, target_role))
    
    conn.commit()
    
    c.execute('SELECT * FROM skill_progress WHERE user_id = ? AND skill_name = ?', (user_id, skill_name))
    updated = c.fetchone()
    conn.close()
    
    return jsonify({"success": True, "skill": dict(updated) if updated else None})

@app.route('/api/progress/reset', methods=['POST'])
def reset_progress():
    data = request.json
    user_id = data.get("user_id", "default")
    target_role = data.get("target_role")
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        DELETE FROM skill_progress 
        WHERE user_id = ? AND target_role = ?
    ''', (user_id, target_role))
    conn.commit()
    conn.close()
    
    return jsonify({"success": True, "message": "Progress reset successfully"})

@app.route('/api/content/<skill_name>', methods=['GET'])
def get_skill_content(skill_name):
    resources = get_content_for_skill(skill_name)
    return jsonify({"skill": skill_name, "resources": resources})

if __name__ == '__main__':
    print("Starting SkillGap AI Brain on Port 5000...")
    app.run(debug=True, port=5000)
