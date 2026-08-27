from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import pandas as pd
import joblib
import sqlite3
from datetime import datetime
import os
import pickle

try:
    from sentence_transformers import SentenceTransformer
except ImportError:
    SentenceTransformer = None

import course_db
import auth
import resume_parser

app = Flask(__name__)
CORS(app)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

DB_PATH = course_db.DB_PATH

def init_db():
    os.makedirs('data', exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS skill_progress (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT, skill_name TEXT, target_role TEXT, status TEXT DEFAULT 'pending', resource_link TEXT, resource_name TEXT, duration TEXT, gap_score REAL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, completed_at TIMESTAMP, UNIQUE(user_id, skill_name, target_role))''')
    c.execute('''CREATE TABLE IF NOT EXISTS user_profiles (user_id TEXT PRIMARY KEY, name TEXT, email TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
    # Course engine schema (populated by import_course_data.py when the full
    # dataset is available; kept here so the API degrades to empty results
    # instead of 500s when the DB has not been provisioned).
    c.execute('''CREATE TABLE IF NOT EXISTS roles (
        role_id TEXT PRIMARY KEY, role_name TEXT, required_skills TEXT,
        optional_skills TEXT, domain TEXT, level TEXT, priority_score REAL,
        market_demand_score REAL, average_learning_months REAL
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS providers (
        provider_id TEXT PRIMARY KEY, provider_name TEXT, provider_type TEXT,
        trust_score REAL, certificate_supported INTEGER
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS courses (
        course_id TEXT PRIMARY KEY, title TEXT, url TEXT, provider_name TEXT,
        difficulty TEXT, duration TEXT, price_type TEXT,
        certificate_available INTEGER, credential_type TEXT,
        data_quality_score REAL, language TEXT, category TEXT, provider_id TEXT
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS course_skills (
        course_skill_id INTEGER PRIMARY KEY AUTOINCREMENT, course_id TEXT,
        normalized_skill_name TEXT, skill_type TEXT, confidence_score REAL,
        extraction_method TEXT
    )''')
    c.execute('''CREATE TABLE IF NOT EXISTS role_course_mappings (
        mapping_id INTEGER PRIMARY KEY AUTOINCREMENT, role_id TEXT,
        course_id TEXT, relevance_score REAL, required_or_optional TEXT
    )''')
    c.execute("CREATE INDEX IF NOT EXISTS idx_courses_id ON courses(course_id)")
    c.execute("CREATE INDEX IF NOT EXISTS idx_courses_provider ON courses(provider_id)")
    c.execute("CREATE INDEX IF NOT EXISTS idx_cs_course ON course_skills(course_id)")
    c.execute("CREATE INDEX IF NOT EXISTS idx_cs_skill ON course_skills(normalized_skill_name)")
    c.execute("CREATE INDEX IF NOT EXISTS idx_rcm_role ON role_course_mappings(role_id)")
    c.execute("CREATE INDEX IF NOT EXISTS idx_rcm_course ON role_course_mappings(course_id)")
    conn.commit()
    conn.close()

def seed_benchmark_roles():
    """Seed the roles table from data/job_benchmarks.csv when the course DB
    has not been provisioned (roles table empty), so the core role-based
    assessment works out of the box."""
    conn = sqlite3.connect(DB_PATH)
    try:
        count = conn.execute("SELECT COUNT(*) FROM roles").fetchone()[0]
    except sqlite3.OperationalError:
        conn.close()
        return 0
    if count > 0:
        conn.close()
        return 0
    if not isinstance(benchmarks_df, pd.DataFrame) or benchmarks_df.empty:
        conn.close()
        return 0
    def domain_for(role_id):
        for prefix, domain in {"DA": "Data", "ML": "AI/ML", "AI": "AI/ML", "DE": "Data", "SWE": "Software"}.items():
            if role_id.startswith(prefix):
                return domain
        return "General"

    roles = {}
    for _, row in benchmarks_df.iterrows():
        rid = str(row['Role_ID']).strip()
        roles.setdefault(rid, {"role_name": str(row['Role_Name']).strip(), "skills": []})
        roles[rid]["skills"].append(str(row['Skill_Name']).strip())
    for rid, info in roles.items():
        conn.execute(
            "INSERT OR IGNORE INTO roles (role_id, role_name, required_skills, optional_skills, domain, level) VALUES (?, ?, ?, '', ?, 'Mid')",
            (rid, info["role_name"], ";".join(info["skills"]), domain_for(rid)),
        )
    conn.commit()
    conn.close()
    return len(roles)

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

seeded = seed_benchmark_roles()
if seeded:
    print(f"[OK] Seeded {seeded} roles from job_benchmarks.csv. Run import_course_data.py (with data/exports/*.csv) for the full 25-role / 68K-course engine.")

# Phase 2/3 ML models. Each model is loaded independently so a missing or
# corrupt model never blocks startup.
rf_model = None
scaler_model = None
risk_model = None
try:
    rf_model = joblib.load('models/rf_employability_model.pkl')
except Exception as e:
    print(f"Employability model warning: {e}")
try:
    scaler_model = joblib.load('models/scaler.pkl')
except Exception as e:
    print(f"Scaler warning: {e}")
try:
    risk_model = joblib.load('models/dt_risk_model.pkl')
except Exception as e:
    print(f"Risk model warning: {e}")
if rf_model or risk_model:
    print("ML models loaded successfully!" if rf_model else "ML models loaded (partial).")

# Phase 4 resume classifier (SentenceTransformer embeddings + RandomForest).
print("Loading Phase 4 Enterprise Deep Learning Engine...")
nlp_model = None
classifier_model = None
try:
    if SentenceTransformer is not None:
        nlp_model = SentenceTransformer('all-MiniLM-L6-v2')
    with open('models/custom_resume_classifier.pkl', 'rb') as f:
        classifier_model = pickle.load(f)
    print("Phase 4 Custom AI Loaded Successfully!" if nlp_model else "Phase 4 Custom AI loaded (NLP unavailable).")
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
    resources = None
    try:
        resources = course_db.get_courses(skill=skill_name, limit=3)
    except Exception:
        resources = None
    if resources:
        return [{"name": r["title"], "link": r["url"] or f"https://www.google.com/search?q=learn+{skill_name.replace(' ', '+')}+course", "duration": r.get("duration") or "Varies", "provider": r.get("provider_name") or "Multiple"} for r in resources]
    return [{"name": f"Learn {skill_name}", "link": f"https://www.google.com/search?q=learn+{skill_name.replace(' ', '+')}+course+2026", "duration": "Varies", "provider": "Multiple"}]

def _normalize_scores(student_scores):
    """Normalize incoming score values to a 0-10 scale.

    The UI sends 0-10 slider values, while the legacy AMCAT-style payloads use
    a 0-100 (or 0-900) scale. Any value above 10 is assumed to be percentage-
    based and divided by 100 so both payloads score consistently against the
    0-10 benchmarks.
    """
    normalized = {}
    for key, value in (student_scores or {}).items():
        try:
            val = float(value)
        except (TypeError, ValueError):
            continue
        if val > 10:
            val = val / 100.0
        normalized[key] = val
    return normalized

# Feature order the employability model was trained on (see train_model.py).
EMPLOYABILITY_FEATURES = [
    'Logical', 'Quant', 'English', 'ComputerProgramming', 'Domain',
    'Total_Aptitude', 'Tech_Score', 'Logical_Quant_Avg',
    'GPA_Normalized', 'Strong_Academics', 'Top_College',
]

def _employability_signals(student_scores):
    """Predict high-salary employability from the 5 aptitude sliders.

    Uses rf_employability_model.pkl + scaler.pkl when available. The model was
    trained on the 0-100 AMCAT scale, so 0-10 slider values are scaled up by
    10. Academic features default to a mid-tier profile. Returns None when the
    models are not loaded or inference fails, so this never breaks analysis.
    """
    if rf_model is None or scaler_model is None:
        return None
    try:
        scores = _normalize_scores(student_scores)
        def score(*keys, default=0.0):
            for k in keys:
                if k in scores:
                    return float(scores[k])
            return default
        logical = score('Logical')
        quant = score('Quant')
        english = score('English')
        programming = score('ComputerProgramming')
        domain = score('Domain')
        features = [
            logical * 10, quant * 10, english * 10, programming * 10, domain * 10,
            (logical + quant + english) * 10,
            (programming + domain) * 10,
            ((logical + quant) / 2) * 10,
            0.7, 0, 0,
        ]
        scaled = scaler_model.transform(pd.DataFrame([features], columns=EMPLOYABILITY_FEATURES))
        proba = rf_model.predict_proba(scaled)[0]
        best = int(proba.argmax())
        return {
            "employability_score": int(round(float(proba[best]) * 100)),
            "employability_class": "High" if rf_model.classes_[best] == 1 else "Low",
        }
    except Exception:
        return None

def calculate_gap(student_scores, selected_skills, target_role, user_id="default"):
    student_scores = _normalize_scores(student_scores)
    target_role = (target_role or "").strip()
    role_name = target_role

    if isinstance(benchmarks_df, pd.DataFrame) and not benchmarks_df.empty:
        role_rules = benchmarks_df[
            (benchmarks_df['Role_ID'].str.strip() == target_role) |
            (benchmarks_df['Role_Name'].str.strip() == target_role)
        ]
        if not role_rules.empty:
            role_name = role_rules['Role_Name'].iloc[0].strip()
            return _calculate_gap_csv(role_rules, student_scores, selected_skills, role_name, user_id)

    skills_required, _ = course_db.get_skills_for_role_by_name(target_role)
    if not skills_required:
        role = course_db.get_role_by_identifier(target_role)
        if role:
            role_name = role['role_name']
            skills_required, _ = course_db.get_skills_for_role_identifier(target_role)
    if skills_required:
        return _calculate_gap_db(role_name, skills_required, student_scores, selected_skills, user_id)
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

    # Compute general aptitude baseline from slider scores (scaled 0-10)
    # student_scores keys are "Logical", "Quant", etc. (not skill names)
    # so we average them as a proxy for general readiness
    score_vals = [float(v) for v in student_scores.values() if isinstance(v, (int, float))]
    default_score = sum(score_vals) / max(len(score_vals), 1) if score_vals else 5.0

    weight = 100.0 / len(skills_required) if skills_required else 0

    for skill_name in skills_required:
        required_score = 7.0
        actual_score = 10.0 if skill_name in selected_skills else default_score
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

@app.route('/api/resume/parse', methods=['POST'])
def parse_resume():
    file = request.files.get('file')
    try:
        text, page_count = resume_parser.parse_resume_file(file)
    except resume_parser.ResumeParseError as e:
        return jsonify({"success": False, "code": e.code, "message": e.message})
    except Exception:
        return jsonify({"success": False, "code": resume_parser.PDF_ERROR_PARSE, "message": "Unexpected error while reading the PDF."})
    return jsonify({
        "success": True,
        "text": text,
        "page_count": page_count,
        "word_count": len(text.split()),
    })

@app.route('/api/analyze', methods=['POST'])
def analyze_student():
    data = request.json
    student_scores = data.get("scores", {})
    selected_skills = data.get("selected_skills", [])
    target_role = data.get("target_role", "Data Analyst (Entry)")
    user_id = data.get("user_id", "default")

    results = calculate_gap(student_scores, selected_skills, target_role, user_id)

    employability = _employability_signals(student_scores)
    if employability:
        results.update(employability)

    resume_text = data.get("resume_text", "")
    if classifier_model and nlp_model and resume_text and len(resume_text.split()) > 10:
        try:
            resume_vector = nlp_model.encode(resume_text, batch_size=1)
            predicted_role = classifier_model.predict([resume_vector])[0]
            results["ai_role"] = predicted_role
        except Exception as e:
            results["ai_role"] = None
            results["ai_error"] = str(e)

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

@app.route('/api/progress', methods=['GET'])
def get_progress():
    user_id = request.args.get('user_id', 'default')
    status_filter = request.args.get('status')
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    if status_filter:
        rows = conn.execute('SELECT * FROM skill_progress WHERE user_id = ? AND status = ? ORDER BY created_at DESC', (user_id, status_filter)).fetchall()
    else:
        rows = conn.execute('SELECT * FROM skill_progress WHERE user_id = ? ORDER BY created_at DESC', (user_id,)).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

@app.route('/api/progress/update', methods=['POST'])
def update_progress():
    data = request.json
    skill_name = data.get('skill_name')
    target_role = data.get('target_role')
    user_id = data.get('user_id', 'default')
    new_status = data.get('status', 'completed')
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    if new_status == 'completed':
        c.execute('UPDATE skill_progress SET status = ?, completed_at = ? WHERE user_id = ? AND skill_name = ? AND target_role = ?',
                  ('completed', datetime.now(), user_id, skill_name, target_role))
    else:
        c.execute('UPDATE skill_progress SET status = ? WHERE user_id = ? AND skill_name = ? AND target_role = ?',
                  (new_status, user_id, skill_name, target_role))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

@app.route('/api/user/<username>', methods=['GET'])
def get_user_profile(username):
    user = auth.get_user_info(username)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"id": user[0], "username": user[1], "email": user[2], "created_at": user[3], "last_login": user[4]})

@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.json
    username = data.get('username', '')
    password = data.get('password', '')
    success, user = auth.authenticate_user(username, password)
    if success:
        return jsonify({"success": True, "user": {"id": user[0], "username": user[1]}})
    return jsonify({"success": False, "message": "Invalid username or password"})

@app.route('/api/register', methods=['POST'])
def api_register():
    data = request.json
    username = data.get('username', '')
    email = data.get('email', '')
    password = data.get('password', '')
    success, message = auth.register_user(username, password, email)
    return jsonify({"success": success, "message": message})

@app.route('/assets/<path:filename>')
def serve_assets(filename):
    return send_from_directory('frontend/dist/assets', filename)

@app.route('/<path:filename>')
def serve_static(filename):
    if filename.startswith('api/'):
        return jsonify({"error": "Not found"}), 404
    try:
        return send_from_directory('frontend/dist', filename)
    except:
        return send_from_directory('frontend/dist', 'index.html')

@app.route('/')
def serve_index():
    return send_from_directory('frontend/dist', 'index.html')

if __name__ == '__main__':
    print("Starting SkillGap AI Brain on Port 5000...")
    print("Frontend: http://127.0.0.1:5000 | API: http://127.0.0.1:5000/api/")
    app.run(debug=False, port=5000)
