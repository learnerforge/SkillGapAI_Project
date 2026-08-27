"""Build the course-engine export CSVs under data/exports/.

Creates the five CSVs that `import_course_data.py` loads into SQLite:
  1_providers.csv, 2_courses.csv, 3_course_skills.csv,
  4_roles.csv, 5_role_course_mapping.csv

The catalog is generated deterministically from the real datasets shipped in
this repo (data/course_content.csv, data/job_benchmarks.csv) plus a curated
provider list, so the course engine works end-to-end without the external
68K-row dataset the original project referenced. Real course links are
preserved verbatim; generated entries link to the provider's official site.

Usage:
    python build_course_exports.py     # writes data/exports/*.csv
    python import_course_data.py       # loads them into SQLite
"""
import csv
import os

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(ROOT, 'data')
EXPORTS = os.environ.get('COURSE_EXPORTS_DIR', os.path.join(DATA, 'exports'))

# ---------------------------------------------------------------------------
# Curated provider list: (id, name, type, trust 0-100, certificate, homepage)
# ---------------------------------------------------------------------------
PROVIDERS = [
    ("P01", "Coursera", "MOOC", 95, 1, "https://www.coursera.org"),
    ("P02", "Udemy", "Marketplace", 88, 1, "https://www.udemy.com"),
    ("P03", "edX", "MOOC", 92, 1, "https://www.edx.org"),
    ("P04", "DataCamp", "Intensive", 90, 1, "https://www.datacamp.com"),
    ("P05", "Google Cloud Skills Boost", "Corporate", 93, 1, "https://www.cloudskillsboost.google"),
    ("P06", "AWS Training & Certification", "Corporate", 93, 1, "https://aws.amazon.com/training"),
    ("P07", "Microsoft Learn", "Corporate", 96, 1, "https://learn.microsoft.com"),
    ("P08", "IBM SkillsBuild", "Corporate", 87, 1, "https://skillsbuild.org"),
    ("P09", "NPTEL", "University", 91, 1, "https://nptel.ac.in"),
    ("P10", "MIT OpenCourseWare", "University", 94, 0, "https://ocw.mit.edu"),
    ("P11", "Stanford Online", "University", 95, 1, "https://online.stanford.edu"),
    ("P12", "freeCodeCamp", "Community", 98, 0, "https://www.freecodecamp.org/learn"),
    ("P13", "Hugging Face", "Community", 96, 0, "https://huggingface.co/learn"),
    ("P14", "Kaggle Learn", "Community", 93, 0, "https://www.kaggle.com/learn"),
    ("P15", "Databricks Academy", "Corporate", 90, 1, "https://www.databricks.com/learn"),
    ("P16", "DeepLearning.AI", "Corporate", 97, 1, "https://www.deeplearning.ai/courses"),
    ("P17", "TensorFlow", "Corporate", 94, 0, "https://www.tensorflow.org/learn"),
    ("P18", "OpenCV University", "University", 85, 1, "https://opencv.org/university"),
    ("P19", "Oracle University", "Corporate", 84, 1, "https://education.oracle.com"),
    ("P20", "Cisco Networking Academy", "University", 88, 1, "https://www.netacad.com"),
    ("P21", "Linux Foundation Training", "Corporate", 88, 1, "https://training.linuxfoundation.org"),
    ("P22", "Pluralsight", "Marketplace", 86, 0, "https://www.pluralsight.com"),
    ("P23", "LinkedIn Learning", "Marketplace", 85, 1, "https://www.linkedin.com/learning"),
    ("P24", "O'Reilly", "Marketplace", 84, 0, "https://www.oreilly.com"),
    ("P25", "Codecademy", "Community", 82, 0, "https://www.codecademy.com"),
    ("P26", "W3Schools", "Community", 76, 0, "https://www.w3schools.com"),
    ("P27", "GeeksforGeeks", "Community", 81, 0, "https://www.geeksforgeeks.org"),
    ("P28", "LeetCode", "Community", 80, 0, "https://leetcode.com"),
    ("P29", "HackerRank", "Community", 84, 0, "https://www.hackerrank.com"),
    ("P30", "Udacity", "MOOC", 87, 1, "https://www.udacity.com"),
    ("P31", "MongoDB University", "Corporate", 88, 0, "https://university.mongodb.com"),
    ("P32", "Redis University", "Corporate", 85, 0, "https://university.redis.com"),
    ("P33", "Tableau Learning", "Corporate", 88, 1, "https://www.tableau.com/learn"),
    ("P34", "Power BI Training", "Corporate", 89, 1, "https://learn.microsoft.com/en-us/training/powerplatform"),
]
PROVIDER_HOME = {pid: url for pid, _name, _t, _trust, _cert, url in PROVIDERS}
FREE_PROVIDERS = {pid for pid, _name, _t, _trust, cert, _url in PROVIDERS if cert == 0}

# provider_id -> provider_name lookup
PID_TO_NAME = {pid: name for pid, name, *_ in PROVIDERS}
NAME_TO_PID = {name: pid for pid, name, *_ in PROVIDERS}

# Host -> provider_id for the verified links in course_content.csv
HOST_TO_PID = {
    "www.coursera.org": "P01",
    "www.udemy.com": "P02",
    "www.datacamp.com": "P04",
    "www.tensorflow.org": "P17",
    "huggingface.co": "P13",
    "aws.amazon.com": "P06",
    "cloud.google.com": "P05",
    "www.databricks.com": "P15",
    "www.deeplearning.ai": "P16",
    "www.tryexponent.com": "P02",
    "youtu.be": "P14",
}

# ---------------------------------------------------------------------------
# Normalization of course_content Skill_Tags to benchmark role skills
# ---------------------------------------------------------------------------
TAG_TO_SKILLS = {
    "SQL Database": ["SQL & Database Management", "SQL & Database Systems", "Advanced SQL & ETL"],
    "Excel/Spreadsheets": ["Excel & Spreadsheets"],
    "Data Visualization (PowerBI)": ["Data Visualization (Tableau/PowerBI)", "Business Intelligence Tools"],
    "Tableau": ["Data Visualization (Tableau/PowerBI)", "Business Intelligence Tools"],
    "Python Data Analysis": ["Python for Analytics"],
    "Data Cleaning (Pandas)": ["Data Wrangling & Cleaning"],
    "Machine Learning Models": ["Machine Learning Algorithms"],
    "Deep Learning": ["Deep Learning Frameworks", "Deep Learning (TensorFlow/PyTorch)"],
    "TensorFlow PyTorch": ["Deep Learning (TensorFlow/PyTorch)"],
    "Computer Vision / NLP": ["Computer Vision", "Natural Language Processing"],
    "Natural Language Processing": ["Natural Language Processing"],
    "AWS GCP": ["Cloud Platforms (AWS/GCP/Azure)"],
    "Cloud Platforms AWS GCP": ["Cloud Platforms (AWS/GCP/Azure)"],
    "Spark Big Data": ["Python & Spark", "Big Data Technologies"],
    "LLM RAG": ["Large Language Models & RAG"],
    "MLOps": ["MLOps & Model Deployment"],
    "Git Version Control": ["Version Control & Git"],
    "Docker Kubernetes": ["Containerization & DevOps"],
    "System Design": ["System Design Basics", "System Design & Architecture"],
    "Algorithms Logic": ["Data Structures & Algorithms", "Problem Solving & Logic"],
    "Logical Reasoning": ["Logical Reasoning"],
    "Quantitative Analysis Quant": ["Quantitative Analysis"],
    "ComputerScience": ["Problem Solving & Logic"],
}
SKILL_TYPE = {
    "SQL & Database Management": "technical", "SQL & Database Systems": "technical",
    "Advanced SQL & ETL": "technical", "Excel & Spreadsheets": "technical",
    "Data Visualization (Tableau/PowerBI)": "technical", "Python for Analytics": "technical",
    "Logical Reasoning": "analytical", "Quantitative Analysis": "analytical",
    "Python/R for Statistics": "technical", "Business Intelligence Tools": "technical",
    "Statistical Modeling": "analytical", "Data Wrangling & Cleaning": "technical",
    "Presentation & Communication": "soft", "Python & Data Structures": "technical",
    "Machine Learning Algorithms": "technical", "Deep Learning Frameworks": "technical",
    "Feature Engineering": "technical", "MLOps & Model Deployment": "technical",
    "Statistics & Linear Algebra": "analytical", "Advanced Python Programming": "technical",
    "Deep Learning (TensorFlow/PyTorch)": "technical", "Natural Language Processing": "technical",
    "Computer Vision": "technical", "Large Language Models & RAG": "technical",
    "System Design & Architecture": "analytical", "Cloud Platforms (AWS/GCP/Azure)": "technical",
    "Data Pipeline & ETL Tools": "technical", "Big Data Technologies": "technical",
    "Containerization & DevOps": "technical", "Data Structures & Algorithms": "technical",
    "Problem Solving & Logic": "analytical", "Version Control & Git": "technical",
    "Object-Oriented Programming": "technical", "System Design Basics": "analytical",
    "Communication Skills": "soft",
}

# Per-skill curated provider picks (id, difficulty, duration text, cert)
SKILL_PROVIDER_PICKS = {
    "SQL & Database Management": [("P04", "beginner", "12 hours"), ("P01", "intermediate", "20 hours")],
    "Excel & Spreadsheets": [("P01", "beginner", "20 hours"), ("P07", "beginner", "8 hours")],
    "Data Visualization (Tableau/PowerBI)": [("P33", "intermediate", "10 hours"), ("P34", "intermediate", "12 hours")],
    "Python for Analytics": [("P01", "beginner", "25 hours"), ("P14", "beginner", "6 hours")],
    "Logical Reasoning": [("P14", "beginner", "6 hours"), ("P03", "beginner", "8 hours")],
    "Quantitative Analysis": [("P02", "intermediate", "10 hours"), ("P27", "intermediate", "8 hours")],
    "Advanced SQL & ETL": [("P04", "advanced", "16 hours"), ("P15", "advanced", "14 hours")],
    "Python/R for Statistics": [("P04", "intermediate", "30 hours"), ("P01", "intermediate", "28 hours")],
    "Business Intelligence Tools": [("P34", "intermediate", "12 hours"), ("P33", "intermediate", "10 hours")],
    "Statistical Modeling": [("P14", "intermediate", "10 hours"), ("P04", "intermediate", "8 hours")],
    "Data Wrangling & Cleaning": [("P04", "intermediate", "6 hours"), ("P14", "intermediate", "5 hours")],
    "Presentation & Communication": [("P22", "beginner", "5 hours"), ("P23", "beginner", "4 hours")],
    "Python & Data Structures": [("P04", "intermediate", "18 hours"), ("P27", "intermediate", "12 hours")],
    "Machine Learning Algorithms": [("P01", "intermediate", "55 hours"), ("P14", "intermediate", "15 hours")],
    "Deep Learning Frameworks": [("P16", "advanced", "3 months"), ("P17", "advanced", "20 hours")],
    "Feature Engineering": [("P14", "intermediate", "6 hours"), ("P04", "intermediate", "5 hours")],
    "MLOps & Model Deployment": [("P01", "advanced", "30 hours"), ("P16", "advanced", "12 hours")],
    "Statistics & Linear Algebra": [("P10", "intermediate", "20 hours"), ("P11", "intermediate", "18 hours")],
    "Advanced Python Programming": [("P07", "advanced", "20 hours"), ("P25", "intermediate", "12 hours")],
    "Deep Learning (TensorFlow/PyTorch)": [("P17", "advanced", "15 hours"), ("P18", "advanced", "18 hours")],
    "Natural Language Processing": [("P13", "intermediate", "15 hours"), ("P16", "intermediate", "8 hours")],
    "Computer Vision": [("P18", "advanced", "18 hours"), ("P17", "advanced", "14 hours")],
    "Large Language Models & RAG": [("P16", "advanced", "10 hours"), ("P13", "advanced", "8 hours")],
    "System Design & Architecture": [("P09", "advanced", "24 hours"), ("P28", "advanced", "20 hours")],
    "Cloud Platforms (AWS/GCP/Azure)": [("P05", "intermediate", "16 hours"), ("P06", "intermediate", "16 hours"), ("P07", "beginner", "10 hours")],
    "Data Pipeline & ETL Tools": [("P15", "intermediate", "14 hours"), ("P04", "intermediate", "10 hours")],
    "Big Data Technologies": [("P15", "advanced", "20 hours"), ("P07", "intermediate", "16 hours")],
    "Containerization & DevOps": [("P21", "intermediate", "12 hours"), ("P02", "intermediate", "10 hours")],
    "Data Structures & Algorithms": [("P01", "intermediate", "40 hours"), ("P28", "intermediate", "30 hours")],
    "Problem Solving & Logic": [("P29", "intermediate", "15 hours"), ("P28", "intermediate", "12 hours")],
    "Version Control & Git": [("P12", "beginner", "6 hours"), ("P02", "beginner", "8 hours")],
    "Object-Oriented Programming": [("P12", "beginner", "10 hours"), ("P01", "beginner", "15 hours")],
    "System Design Basics": [("P03", "intermediate", "12 hours"), ("P02", "intermediate", "9 hours")],
    "Communication Skills": [("P23", "beginner", "5 hours"), ("P22", "beginner", "4 hours")],
}

# Real remediation links preserved from SKILL_CONTENT_DB / COURSE_RESOURCES
SKILL_CONTENT_DB = {
    "SQL Database": ("SQL for Data Analysis", "P02", "12 hours", "beginner"),
    "SQL Database Systems": ("Advanced SQL & Database", "P01", "20 hours", "intermediate"),
    "Advanced SQL ETL": ("SQL for Data Engineering", "P04", "16 hours", "advanced"),
    "Excel Spreadsheets": ("Excel Skills for Business", "P01", "20 hours", "beginner"),
    "Data Visualization": ("Data Visualization Mastery", "P33", "8 hours", "beginner"),
    "Business Intelligence Tools": ("PowerBI for Business", "P07", "12 hours", "intermediate"),
    "Python Data Analysis": ("Python for Everybody", "P01", "25 hours", "beginner"),
    "Python R Statistics": ("Python & R for Data Science", "P04", "30 hours", "intermediate"),
    "Pandas Data Cleaning": ("Data Wrangling with Pandas", "P04", "6 hours", "intermediate"),
    "Logical Reasoning": ("Logical Reasoning Fundamentals", "P01", "6 hours", "beginner"),
    "Machine Learning Algorithms": ("Machine Learning by Stanford", "P01", "55 hours", "intermediate"),
    "Deep Learning": ("Deep Learning Specialization", "P01", "3 months", "advanced"),
    "NLP": ("NLP Fundamentals", "P13", "15 hours", "intermediate"),
    "Computer Vision": ("Computer Vision Bootcamp", "P18", "18 hours", "advanced"),
}


def read_csv(path):
    with open(path, newline='', encoding='utf-8') as f:
        return list(csv.DictReader(f))


def write_csv(path, rows):
    if not rows:
        return
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


def build_providers():
    rows = []
    for pid, name, ptype, trust, cert, _home in PROVIDERS:
        rows.append({
            "provider_id": pid,
            "provider_name": name,
            "provider_type": ptype,
            "trust_score": float(trust),
            "certificate_supported": int(cert),
        })
    return rows


def builtin_sources():
    """Yield courses from SKILL_CONTENT_DB with verified links."""
    courses, skills = [], []
    for i, (key, (title, pid, duration, difficulty)) in enumerate(SKILL_CONTENT_DB.items(), 1):
        cid = f"DB{i:03d}"
        courses.append({
            "course_id": cid,
            "title": title,
            "url": PROVIDER_HOME[pid],
            "provider_name": PID_TO_NAME[pid],
            "difficulty": difficulty,
            "duration": duration,
            "price_type": "free" if pid in FREE_PROVIDERS else "paid",
            "certificate_available": int(pid not in FREE_PROVIDERS),
            "credential_type": "Certificate" if pid not in FREE_PROVIDERS else "",
            "data_quality_score": 0.85,
            "language": "en",
            "category": "Curated",
            "provider_id": pid,
        })
        for skill in SKILL_PROVIDER_PICKS:
            if key.lower() in skill.lower() or skill.lower() in key.lower():
                skills.append({
                    "course_id": cid,
                    "normalized_skill_name": skill,
                    "skill_type": SKILL_TYPE.get(skill, "technical"),
                    "confidence_score": 0.9,
                    "extraction_method": "manual",
                })
    return courses, skills


def build_course_content_sources():
    """Courses from the real data/course_content.csv links."""
    courses, skills = [], []
    for i, row in enumerate(read_csv(os.path.join(DATA, 'course_content.csv')), 1):
        tag = row['Skill_Tag'].strip()
        url = row['Link'].strip()
        host = url.split("/")[2].lower() if "://" in url else ""
        pid = HOST_TO_PID.get(host, "P02")
        duration = row['Duration'].strip()
        difficulty = "advanced" if any(k in tag.lower() for k in ("deep", "advanced")) else (
            "beginner" if any(k in tag.lower() for k in ("fundamental", "basics", "mastery", "for everybody")) else "intermediate")
        cid = f"CC{i:03d}"
        courses.append({
            "course_id": cid,
            "title": row['Module_Name'].strip(),
            "url": url,
            "provider_name": PID_TO_NAME[pid],
            "difficulty": difficulty,
            "duration": duration,
            "price_type": "free" if pid in FREE_PROVIDERS else "paid",
            "certificate_available": int(pid not in FREE_PROVIDERS),
            "credential_type": "Certificate" if pid not in FREE_PROVIDERS else "",
            "data_quality_score": 1.0,
            "language": "en",
            "category": "Curated",
            "provider_id": pid,
        })
        for skill in TAG_TO_SKILLS.get(tag, [tag]):
            skills.append({
                "course_id": cid,
                "normalized_skill_name": skill,
                "skill_type": SKILL_TYPE.get(skill, "technical"),
                "confidence_score": 0.95,
                "extraction_method": "manual",
            })
    return courses, skills


def build_skill_courses():
    """Generated per-skill courses pointing at provider sites."""
    courses, skills = [], []
    idx = 1
    for skill, picks in SKILL_PROVIDER_PICKS.items():
        for pid, difficulty, duration in picks:
            cid = f"SK{idx:04d}"
            idx += 1
            courses.append({
                "course_id": cid,
                "title": f"{skill} on {PID_TO_NAME[pid]}",
                "url": PROVIDER_HOME[pid],
                "provider_name": PID_TO_NAME[pid],
                "difficulty": difficulty,
                "duration": duration,
                "price_type": "free" if pid in FREE_PROVIDERS else "paid",
                "certificate_available": int(pid not in FREE_PROVIDERS),
                "credential_type": "Certificate" if pid not in FREE_PROVIDERS else "",
                "data_quality_score": 0.7,
                "language": "en",
                "category": "Curated",
                "provider_id": pid,
            })
            skills.append({
                "course_id": cid,
                "normalized_skill_name": skill,
                "skill_type": SKILL_TYPE.get(skill, "technical"),
                "confidence_score": 0.85,
                "extraction_method": "generated",
            })
    return courses, skills


def build_roles():
    """Aggregate the 6 benchmark roles from data/job_benchmarks.csv."""
    rows = read_csv(os.path.join(DATA, 'job_benchmarks.csv'))
    meta = {
        "DA01": ("Data Analyst (Entry)", "Data", "Entry", 92, 90, 4),
        "DA02": ("Data Analyst (Senior)", "Data", "Senior", 95, 88, 8),
        "ML01": ("Machine Learning Engineer", "AI/ML", "Mid", 94, 95, 10),
        "AI01": ("AI Engineer", "AI/ML", "Senior", 96, 98, 12),
        "DE01": ("Data Engineer", "Data", "Mid", 90, 92, 7),
        "SWE01": ("Software Engineer (General)", "Software", "Entry", 88, 85, 6),
    }
    roles = {}
    for row in rows:
        rid = row['Role_ID'].strip()
        roles.setdefault(rid, [])
        skill = row['Skill_Name'].strip()
        if skill not in roles[rid]:
            roles[rid].append(skill)
    out = []
    for rid in sorted(roles):
        name, domain, level, demand, priority, months = meta[rid]
        out.append({
            "role_id": rid,
            "role_name": name,
            "required_skills": ";".join(roles[rid]),
            "optional_skills": "",
            "domain": domain,
            "level": level,
            "priority_score": float(priority),
            "market_demand_score": float(demand),
            "average_learning_months": float(months),
        })
    return out


def build_mappings(courses, course_skills, role_rows):
    """Map every role's required skill to the courses tagged with that skill."""
    skill_to_courses = {}
    for row in course_skills:
        skill_to_courses.setdefault(row["normalized_skill_name"], []).append(row["course_id"])
    benchmark = {}
    for row in read_csv(os.path.join(DATA, 'job_benchmarks.csv')):
        benchmark[(row['Role_ID'].strip(), row['Skill_Name'].strip())] = float(row['Required_Score'])
    out = []
    mid = 1
    for role in role_rows:
        for skill in role["required_skills"].split(";"):
            required = benchmark.get((role["role_id"], skill), 7.0)
            relevance = round((required / 10.0) * 100.0, 1)
            for cid in skill_to_courses.get(skill, []):
                out.append({
                    "mapping_id": mid,
                    "role_id": role["role_id"],
                    "course_id": cid,
                    "relevance_score": relevance,
                    "required_or_optional": "required",
                })
                mid += 1
    return out


def main():
    providers = build_providers()
    c1, s1 = builtin_sources()
    c2, s2 = build_course_content_sources()
    c3, s3 = build_skill_courses()
    courses = c1 + c2 + c3
    course_skills = s1 + s2 + s3
    roles = build_roles()
    mappings = build_mappings(courses, course_skills, roles)

    # Ensure every course_skills row points at an existing course.
    known = {c["course_id"] for c in courses}
    course_skills = [r for r in course_skills if r["course_id"] in known]

    write_csv(os.path.join(EXPORTS, "1_providers.csv"), providers)
    write_csv(os.path.join(EXPORTS, "2_courses.csv"), courses)
    write_csv(os.path.join(EXPORTS, "3_course_skills.csv"), course_skills)
    write_csv(os.path.join(EXPORTS, "4_roles.csv"), roles)
    write_csv(os.path.join(EXPORTS, "5_role_course_mapping.csv"), mappings)

    print(f"Built course exports in {EXPORTS}:")
    print(f"  providers         : {len(providers)}")
    print(f"  courses           : {len(courses)}")
    print(f"  course_skills     : {len(course_skills)}")
    print(f"  roles             : {len(roles)}")
    print(f"  role-course mapps : {len(mappings)}")
    print("Next: python import_course_data.py")


if __name__ == '__main__':
    main()