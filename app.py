from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import joblib

app = Flask(__name__)
CORS(app)

print("Loading SkillGap AI Brain...")
try:
    benchmarks_df = pd.read_csv('data/job_benchmarks.csv')
    content_df = pd.read_csv('data/course_content.csv')
    rf_model = joblib.load('models/rf_employability_model.pkl')
    risk_model = joblib.load('models/dt_risk_model.pkl')
    print("All datasets and ML models loaded successfully!")
except Exception as e:
    print(f"Startup Warning: {e}")

def calculate_gap(student_scores, selected_skills, target_role):
    # --- DEBUG TRACKER START ---
    print(f"\n--- NEW ANALYSIS INITIATED ---")
    print(f"Target Role: {target_role}")
    print(f"Raw Input Scores: {student_scores}")
    print(f"Raw Input Skills: {selected_skills}")
    # ---------------------------

    # We use .strip() to safely ignore any accidental spaces in your CSV files
    role_rules = benchmarks_df[benchmarks_df['Role_Name'].str.strip() == target_role.strip()]
    
    if role_rules.empty:
        print("ERROR: Could not find this role in the CSV!")
        return {"error": "Role not found."}

    readiness_score = 0
    missing_skills = []
    recommended_links = []

    for index, row in role_rules.iterrows():
        skill_name = str(row['Skill_Name']).strip()
        mapped_column = str(row['Mapped_Column']).strip()
        required_score = float(row['Required_Score'])
        weightage = float(row['Weightage'])

        if mapped_column == 'Self_Rating':
            actual_score = 10.0 if skill_name in selected_skills else 0.0
        else:
            # Safely fetch the score as a float, default to 0.0 if missing
            actual_score = float(student_scores.get(mapped_column, 0.0))
        
        gap = required_score - actual_score
        
        # --- DEBUG TRACKER: PRINT THE MATH ---
        print(f"Evaluating -> [{skill_name}] | Required: {required_score} | Actual: {actual_score} | Gap: {round(gap, 2)}")

        score_contribution = 0
        if required_score > 0:
            score_contribution = (actual_score / required_score) * weightage * 100
            
        if score_contribution > (weightage * 100):
            score_contribution = weightage * 100 
            
        readiness_score += score_contribution

        if gap > 0:
            missing_skills.append(skill_name)
            
            search_tag = mapped_column if mapped_column != 'Self_Rating' else skill_name
            remedy = content_df[content_df['Skill_Tag'].str.contains(search_tag, case=False, na=False)]
            
            if not remedy.empty:
                recommended_links.append({
                    "skill": skill_name, 
                    "gap_amount": round(gap, 1),
                    "video_link": remedy.iloc[0]['Link'],
                    "duration": remedy.iloc[0]['Duration']
                })

    final_score = round(readiness_score, 2)
    print(f"FINAL CALCULATED SCORE: {final_score}%")
    
    return {
        "target_role": target_role,
        "final_readiness_score": final_score,
        "is_job_ready": final_score >= 80,
        "missing_skills": missing_skills,
        "remedial_roadmap": recommended_links
    }

@app.route('/api/analyze', methods=['POST'])
def analyze_student():
    data = request.json
    student_scores = data.get("scores", {})
    selected_skills = data.get("selected_skills", []) 
    target_role = data.get("target_role", "Data Analyst (Entry)")
    
    results = calculate_gap(student_scores, selected_skills, target_role)
    return jsonify(results)

if __name__ == '__main__':
    print("Starting X-Ray Debug Engine on Port 5000...")
    app.run(debug=True, port=5000)