import sqlite3
import os

DB_PATH = 'data/skill_progress.db'

def get_conn():
    return sqlite3.connect(DB_PATH)

def dict_fetch(conn, query, params=None):
    conn.row_factory = sqlite3.Row
    cur = conn.execute(query, params or [])
    return [dict(r) for r in cur.fetchall()]

def dict_fetch_one(conn, query, params=None):
    conn.row_factory = sqlite3.Row
    cur = conn.execute(query, params or [])
    row = cur.fetchone()
    return dict(row) if row else None

def get_all_roles():
    conn = get_conn()
    roles = dict_fetch(conn, "SELECT * FROM roles ORDER BY domain, role_name")
    conn.close()
    return roles

def get_role(role_id):
    conn = get_conn()
    role = dict_fetch_one(conn, "SELECT * FROM roles WHERE role_id = ?", [role_id])
    conn.close()
    return role

def get_courses(skill=None, difficulty=None, provider=None, limit=50, offset=0):
    conn = get_conn()
    conditions = []
    params = []
    if skill:
        conditions.append("EXISTS (SELECT 1 FROM course_skills cs WHERE cs.course_id = c.course_id AND cs.normalized_skill_name = ?)")
        params.append(skill)
    if difficulty:
        conditions.append("c.difficulty = ?")
        params.append(difficulty)
    if provider:
        conditions.append("c.provider_id = ?")
        params.append(provider)
    where = " AND ".join(conditions) if conditions else "1=1"
    query = f"SELECT c.* FROM courses c WHERE {where} ORDER BY c.data_quality_score DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])
    courses = dict_fetch(conn, query, params)
    conn.close()
    return courses

def get_course(course_id):
    conn = get_conn()
    course = dict_fetch_one(conn, "SELECT * FROM courses WHERE course_id = ?", [course_id])
    if course:
        course['skills'] = dict_fetch(conn, "SELECT * FROM course_skills WHERE course_id = ?", [course_id])
    conn.close()
    return course

def get_skills(search=None):
    conn = get_conn()
    if search:
        skills = dict_fetch(conn, "SELECT DISTINCT normalized_skill_name, skill_type FROM course_skills WHERE normalized_skill_name LIKE ? ORDER BY normalized_skill_name LIMIT 200", [f'%{search}%'])
    else:
        skills = dict_fetch(conn, "SELECT DISTINCT normalized_skill_name, skill_type FROM course_skills ORDER BY normalized_skill_name LIMIT 200")
    conn.close()
    return skills

def get_recommendations(role_id, limit=20):
    conn = get_conn()
    mappings = dict_fetch(conn, """
        SELECT rcm.*, c.title, c.url, c.difficulty, c.duration, c.price_type,
               c.certificate_available, c.credential_type, c.data_quality_score,
               c.provider_name, c.language
        FROM role_course_mappings rcm
        JOIN courses c ON c.course_id = rcm.course_id
        WHERE rcm.role_id = ?
        ORDER BY rcm.relevance_score DESC
        LIMIT ?
    """, [role_id, limit])
    conn.close()
    return mappings

def get_providers():
    conn = get_conn()
    providers = dict_fetch(conn, "SELECT * FROM providers ORDER BY trust_score DESC")
    conn.close()
    return providers

def get_role_benchmarks(role_id):
    conn = get_conn()
    role = dict_fetch_one(conn, "SELECT role_name, required_skills, optional_skills, level, priority_score, market_demand_score, average_learning_months FROM roles WHERE role_id = ?", [role_id])
    conn.close()
    return role

def get_skills_for_role_by_name(role_name):
    conn = get_conn()
    role = dict_fetch_one(conn, "SELECT required_skills FROM roles WHERE role_name = ?", [role_name])
    conn.close()
    if not role or not role.get('required_skills'):
        return [], []
    required = [s.strip() for s in role['required_skills'].split(';') if s.strip()]
    return required, []

def get_skills_for_role(role_id):
    conn = get_conn()
    role = dict_fetch_one(conn, "SELECT required_skills, optional_skills FROM roles WHERE role_id = ?", [role_id])
    conn.close()
    if not role:
        return [], []
    required = [s.strip() for s in role['required_skills'].split(';') if s.strip()] if role['required_skills'] else []
    optional = [s.strip() for s in role['optional_skills'].split(';') if s.strip()] if role['optional_skills'] else []
    return required, optional
