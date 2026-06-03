import sqlite3
import pandas as pd
import os

DB_PATH = 'data/skill_progress.db'
EXPORTS_DIR = r"E:\GitHub Projects\course engine\data\exports"

def get_csv_path(filename):
    return os.path.join(EXPORTS_DIR, filename)

def import_providers(conn):
    df = pd.read_csv(get_csv_path('1_providers.csv'))
    df.to_sql('providers', conn, if_exists='replace', index=False)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_providers_id ON providers(provider_id)")
    print(f"  Imported {len(df)} providers")

def import_courses(conn):
    df = pd.read_csv(get_csv_path('2_courses.csv'))
    df.to_sql('courses', conn, if_exists='replace', index=False)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_courses_id ON courses(course_id)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_courses_provider ON courses(provider_id)")
    print(f"  Imported {len(df)} courses")

def import_course_skills(conn):
    df = pd.read_csv(get_csv_path('3_course_skills.csv'))
    df.to_sql('course_skills', conn, if_exists='replace', index=False)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_cs_course ON course_skills(course_id)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_cs_skill ON course_skills(normalized_skill_name)")
    print(f"  Imported {len(df)} course skills")

def import_roles(conn):
    df = pd.read_csv(get_csv_path('4_roles.csv'))
    df.to_sql('roles', conn, if_exists='replace', index=False)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_roles_id ON roles(role_id)")
    print(f"  Imported {len(df)} roles")

def import_role_course_mappings(conn):
    df = pd.read_csv(get_csv_path('5_role_course_mapping.csv'))
    df.to_sql('role_course_mappings', conn, if_exists='replace', index=False)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_rcm_role ON role_course_mappings(role_id)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_rcm_course ON role_course_mappings(course_id)")
    print(f"  Imported {len(df)} role-course mappings")

def main():
    os.makedirs('data', exist_ok=True)
    conn = sqlite3.connect(DB_PATH)

    print("Importing course data into skill_progress.db...")
    import_providers(conn)
    import_courses(conn)
    import_course_skills(conn)
    import_roles(conn)
    import_role_course_mappings(conn)

    conn.commit()
    conn.close()
    print("Done! All course data imported successfully.")

if __name__ == '__main__':
    main()
