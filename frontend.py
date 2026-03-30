import streamlit as st
import requests
import re
import joblib
import numpy as np
import PyPDF2
import io

# Set professional page configuration
st.set_page_config(page_title="SkillGap AI Master Dashboard", page_icon="🧠", layout="wide")

# --- 1. LOAD THE AI BRAIN ---
try:
    model = joblib.load('skillgap_phase2_model.pkl')
    model_loaded = True
except:
    model_loaded = False

# --- 2. PDF & RESUME ENGINE ---
def extract_text_from_pdf(uploaded_file):
    try:
        pdf_reader = PyPDF2.PdfReader(uploaded_file)
        text = ""
        for page in range(len(pdf_reader.pages)):
            text += pdf_reader.pages[page].extract_text()
        return text
    except Exception as e:
        return "" # Returns empty if the PDF is entirely broken

def analyze_resume_text(text):
    text = text.lower()
    score = 0
    feedback = []
    
    action_verbs = {'developed', 'engineered', 'built', 'optimized', 'designed', 'created', 'implemented', 'scraped', 'integrated', 'extract', 'processed', 'managed', 'led'}
    words = set(re.findall(r'\b\w+\b', text))
    found_verbs = action_verbs.intersection(words)
    
    if len(found_verbs) >= 2:
        score += 3
        feedback.append(f"✅ Action verbs detected: {', '.join(found_verbs).title()}")
    else:
        feedback.append("❌ Missing strong action verbs.")

    numbers = re.findall(r'\d+', text)
    if len(numbers) >= 2:
        score += 4
        feedback.append(f"✅ Metrics & Impact found: {', '.join(numbers[:3])}...")
    else:
        feedback.append("❌ No data metrics found. Add numbers to show impact.")

    tech_keywords = {'python', 'react', 'dashboard', 'machine learning', 'api', 'database', 'extraction', 'ecommerce', 'data', 'flask', 'sql', 'java', 'c++'}
    found_tech = tech_keywords.intersection(words)
    
    if len(found_tech) >= 2:
        score += 3
        feedback.append(f"✅ Tech stack identified: {', '.join(found_tech).title()}")
    else:
        feedback.append("❌ Missing core technical keywords.")
        
    return {"Total_Score": score, "Feedback": feedback}


# ==========================================
# --- UNIFIED DASHBOARD UI ---
# ==========================================
st.title("🚀 SkillGap AI: Holistic Career Predictor")
st.markdown("Upload your resume and input your scores to get a complete AI-driven employability analysis.")
st.markdown("---")

col1, col2, col3 = st.columns(3)

with col1:
    st.subheader("📋 Core AMCAT Scores")
    st.caption("Enter your raw scores (100-900)")
    # UPGRADE: Tooltips added to sliders!
    logical = st.slider("Logical Reasoning", 100, 900, 500, help="Measures problem-solving ability. Average is 500.")
    quant = st.slider("Quantitative Aptitude", 100, 900, 500, help="Measures mathematical and analytical skills.")
    english = st.slider("English & Comm.", 100, 900, 500, help="Measures written comprehension and grammar.")
    coding = st.slider("Programming Logic", 100, 900, 500, help="Measures algorithmic thinking and code structure.")

with col2:
    st.subheader("💻 Domain Knowledge")
    target_role = st.selectbox(
        "Target Job Profile:",
        ["Data Analyst (Entry)", "Data Analyst (Senior)", "Machine Learning Engineer", "AI Engineer", "Data Engineer"],
        help="The AI will benchmark your skills against industry requirements for this specific role."
    )
    
    tech_skills = st.multiselect(
        "Select your verified skills:",
        ["SQL Database", "Excel/Spreadsheets", "Data Visualization (PowerBI)", 
         "Machine Learning Models", "Data Cleaning (Pandas)", "Deep Learning", 
         "Computer Vision / NLP", "System Design", "Cloud Platforms (AWS/GCP)"],
         help="Select the technologies you have used in your academic projects or internships."
    )

with col3:
    st.subheader("📄 Upload Resume")
    st.caption("Upload your PDF resume for ATS analysis.")
    uploaded_resume = st.file_uploader("Choose a PDF file", type="pdf", help="Must be a text-based PDF, not a scanned image.")
    
st.markdown("---")

# --- THE MASTER ANALYSIS BUTTON ---
if st.button("🔍 Generate Master Employability Report", type="primary", use_container_width=True):
    if not uploaded_resume:
        st.warning("⚠️ Please upload your PDF resume first!")
    elif not model_loaded:
        st.error("🚨 Model file 'skillgap_phase2_model.pkl' not found!")
    else:
        with st.spinner("Analyzing resume and computing AI models..."):
            
            # 1. READ & SCORE THE RESUME
            resume_text = extract_text_from_pdf(uploaded_resume)
            
            # UPGRADE: Bulletproof PDF Error Handling!
            word_count = len(resume_text.split())
            if word_count < 50:
                st.error("🚨 **PDF Read Error:** We couldn't extract enough text from your resume (found less than 50 words). Please ensure you uploaded a text-based PDF and not an image!")
                st.stop() # Stops the rest of the code from crashing
            
            resume_result = analyze_resume_text(resume_text)
            resume_score = resume_result['Total_Score']
            
            # 2. RUN THE ML PREDICTION (Phase 2)
            total_aptitude = logical + quant + english
            user_data = np.array([[logical, quant, english, coding, total_aptitude, resume_score]])
            ml_probability = model.predict_proba(user_data)[0][1] * 100 
            
            # 3. PING THE FLASK BACKEND (Phase 1)
            flask_payload = {
                "target_role": target_role,
                "scores": {
                    "Logical": logical / 100,
                    "Quant": quant / 100,
                    "English": english / 100,
                    "ComputerProgramming": coding / 100,
                    "ComputerScience": 5.0
                },
                "selected_skills": tech_skills 
            }
            
            flask_data = {}
            try:
                # Adding a quick timeout so it doesn't hang if backend is down
                response = requests.post("http://127.0.0.1:5000/api/analyze", json=flask_payload, timeout=3)
                flask_data = response.json()
            except:
                # UPGRADE: Presentation Mode Fallback!
                st.toast("🔌 Running in Local Presentation Mode (Backend Disconnected)", icon="⚠️")
                flask_data = {
                    "missing_skills": ["Cloud Platforms (AWS/GCP)", "System Design"],
                    "remedial_roadmap": [
                        {"skill": "Cloud Platforms", "gap_amount": 2, "video_link": "https://www.youtube.com/results?search_query=AWS+for+beginners"},
                        {"skill": "System Design", "gap_amount": 1.5, "video_link": "https://www.youtube.com/results?search_query=System+Design+Interview"}
                    ]
                }

            # ==========================================
            # --- DISPLAY UNIFIED RESULTS ---
            # ==========================================
            st.header("📊 Final Holistic Assessment")
            
            res_col1, res_col2 = st.columns(2)
            
            with res_col1:
                # UPGRADE: Metric Deltas (Green/Red Arrows)
                if ml_probability > 75:
                    st.metric(label="AI Employability Match", value=f"{round(ml_probability, 1)}%", delta="High Probability", delta_color="normal")
                    st.success("✨ Highly Employable! Your profile and resume match top candidates.")
                elif ml_probability > 40:
                    st.metric(label="AI Employability Match", value=f"{round(ml_probability, 1)}%", delta="Average Probability", delta_color="off")
                    st.warning("⚠️ Average profile. Review the skill gaps to improve your chances.")
                else:
                    st.metric(label="AI Employability Match", value=f"{round(ml_probability, 1)}%", delta="Low Probability", delta_color="inverse")
                    st.error("🚨 Low match detected. Significant upskilling required.")
                    
                st.subheader("📄 ATS Resume Analysis")
                st.markdown(f"**Score: {resume_score}/10**")
                
                # UPGRADE: Visual Progress Bar
                st.progress(resume_score / 10) 
                
                for note in resume_result['Feedback']:
                    if "✅" in note:
                        st.caption(note)
                    else:
                        st.markdown(f"<span style='color:red'>{note}</span>", unsafe_allow_html=True)
            
            with res_col2:
                if flask_data:
                    st.subheader("❌ Technical Skill Gaps")
                    missing = flask_data.get("missing_skills", [])
                    if missing:
                        for skill in missing:
                            st.error(f"Missing: {skill}")
                    else:
                        st.info("No core skills missing for this role.")
                        
                    st.subheader("🛤️ Recommended Roadmap")
                    roadmap = flask_data.get("remedial_roadmap", [])
                    if roadmap:
                        for item in roadmap:
                            st.markdown(f"- **Learn {item['skill']}** ([Course Link]({item['video_link']}))")