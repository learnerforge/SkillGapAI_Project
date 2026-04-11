import streamlit as st
import requests
import re
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
import io

st.set_page_config(
    page_title="SkillGap AI Pro", 
    page_icon="🎯", 
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Custom CSS for modern dark theme
st.markdown("""
<style>
    /* Main theme */
    .stApp {
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    }
    
    /* Headers */
    h1, h2, h3 {
        color: #e94560 !important;
    }
    
    /* Cards */
    .metric-card {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 16px;
        padding: 20px;
        border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    /* Success boxes */
    .success-box {
        background: linear-gradient(135deg, #0d7377 0%, #14ffec 100%);
        border-radius: 12px;
        padding: 15px;
        color: white;
    }
    
    /* Warning boxes */
    .warning-box {
        background: linear-gradient(135deg, #f39c12 0%, #e74c3c 100%);
        border-radius: 12px;
        padding: 15px;
        color: white;
    }
    
    /* Skill bars */
    .skill-bar {
        height: 8px;
        border-radius: 4px;
        margin: 5px 0;
    }
    
    /* Hide default Streamlit elements */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    
    /* Custom button styling */
    .stButton > button {
        background: linear-gradient(135deg, #e94560 0%, #0f3460 100%);
        color: white;
        border: none;
        border-radius: 25px;
        padding: 12px 30px;
        font-weight: bold;
        transition: all 0.3s;
    }
    
    .stButton > button:hover {
        transform: scale(1.02);
        box-shadow: 0 4px 15px rgba(233, 69, 96, 0.4);
    }
    
    /* Progress bar custom */
    .stProgress > div > div > div {
        background: linear-gradient(90deg, #e94560, #14ffec);
    }
    
    /* Expander styling */
    .streamlit-expanderHeader {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 8px;
    }
</style>
""", unsafe_allow_html=True)

# LOAD MODELS
try:
    model = joblib.load('models/rf_employability_model.pkl')
    scaler = joblib.load('models/scaler.pkl')
    model_loaded = True
except:
    model_loaded = False

# 2026 MARKET SKILLS DATABASE
SKILLS_DB = {
    "Data Analyst (Entry)": {
        "required": ["SQL Database", "Excel Spreadsheets", "Data Visualization", "Python Data Analysis", "Logical Reasoning"],
        "salary_range": "4-7 LPA",
        "demand": "Very High",
        "growth": "+15%"
    },
    "Data Analyst (Senior)": {
        "required": ["Advanced SQL ETL", "Python R Statistics", "Business Intelligence", "Statistical Modeling", "Data Wrangling"],
        "salary_range": "8-15 LPA",
        "demand": "High",
        "growth": "+12%"
    },
    "Machine Learning Engineer": {
        "required": ["Python Data Structures", "ML Algorithms", "Deep Learning", "Feature Engineering", "MLOps"],
        "salary_range": "12-25 LPA",
        "demand": "Very High",
        "growth": "+25%"
    },
    "AI Engineer": {
        "required": ["Advanced Python", "Deep Learning", "NLP", "Computer Vision", "LLM RAG"],
        "salary_range": "15-35 LPA",
        "demand": "Extremely High",
        "growth": "+35%"
    },
    "Data Engineer": {
        "required": ["SQL Database Systems", "Python Spark", "Cloud AWS GCP", "Data Pipeline ETL", "Big Data"],
        "salary_range": "10-22 LPA",
        "demand": "Very High",
        "growth": "+20%"
    },
    "Software Engineer (General)": {
        "required": ["Data Structures Algorithms", "Problem Solving", "Git Version Control", "OOP", "System Design"],
        "salary_range": "6-18 LPA",
        "demand": "High",
        "growth": "+10%"
    }
}

ALL_SKILLS = [
    "SQL Database", "Excel Spreadsheets", "Data Visualization", "Python Data Analysis",
    "Tableau", "PowerBI", "Pandas Data Cleaning", "Machine Learning Models",
    "Deep Learning", "TensorFlow PyTorch", "Computer Vision", "Natural Language Processing",
    "AWS Cloud", "GCP Cloud", "Azure Cloud", "Spark Big Data", "Docker Kubernetes",
    "Git Version Control", "System Design", "Algorithms Logic", "MLOps", "LLM RAG"
]

def extract_text_from_pdf(uploaded_file):
    try:
        import PyPDF2
        pdf_reader = PyPDF2.PdfReader(uploaded_file)
        text = ""
        for page in pdf_reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text.strip()
    except Exception as e:
        error_msg = str(e).lower()
        if "image" in error_msg or "couldn't extract" in error_msg:
            return "PDF_ERROR_IMAGE"
        elif "password" in error_msg:
            return "PDF_ERROR_PASSWORD"
        else:
            return f"PDF_ERROR_{e}"

def analyze_resume(text):
    score = 0
    feedback = []
    suggestions = []
    
    text_lower = text.lower()
    words = set(re.findall(r'\b\w+\b', text_lower))
    
    # Action verbs
    action_verbs = {'developed', 'engineered', 'built', 'optimized', 'designed', 'created', 
                   'implemented', 'scraped', 'integrated', 'processed', 'managed', 'led',
                   'architected', 'automated', 'deployed', 'analyzed', 'transformed'}
    found_verbs = action_verbs.intersection(words)
    
    if len(found_verbs) >= 2:
        score += 3
        feedback.append(("success", f"Strong action verbs: {', '.join(found_verbs)}"))
    else:
        suggestions.append("Add more action verbs (developed, built, optimized...)")
    
    # Metrics
    numbers = re.findall(r'\d+', text)
    if len(numbers) >= 3:
        score += 3
        feedback.append(("success", f"Quantifiable achievements found"))
    else:
        suggestions.append("Add numbers to show impact (e.g., 'Improved performance by 40%')")
    
    # Tech keywords
    tech_keywords = {'python', 'sql', 'excel', 'tableau', 'powerbi', 'machine learning', 
                    'tensorflow', 'pytorch', 'aws', 'docker', 'api', 'database', 'pandas',
                    'numpy', 'sklearn', 'git', 'flask', 'react', 'java', 'javascript'}
    found_tech = tech_keywords.intersection(words)
    
    if len(found_tech) >= 3:
        score += 4
        feedback.append(("success", f"Tech stack: {', '.join(list(found_tech)[:5])}"))
    else:
        suggestions.append("Add more technical skills (Python, SQL, Machine Learning...)")
    
    return {"score": score, "max": 10, "feedback": feedback, "suggestions": suggestions}

# HEADER
st.markdown("""
<div style='text-align: center; padding: 20px 0;'>
    <h1 style='font-size: 3rem; margin: 0;'>🎯 SkillGap AI Pro</h1>
    <p style='color: #888; font-size: 1.2rem;'>2026 Market-Ready Employability Analyzer</p>
</div>
""", unsafe_allow_html=True)

# TABS
tab1, tab2, tab3 = st.tabs(["📊 Assessment", "📈 Market Insights", "📚 Learning Path"])

with tab1:
    col_input, col_skills = st.columns([1.2, 1])
    
    with col_input:
        st.markdown("### 📋 Enter Your Scores")
        
        with st.container():
            logical = st.slider("🧠 Logical Reasoning", 100, 900, 500, help="Problem-solving ability")
            quant = st.slider("📐 Quantitative Aptitude", 100, 900, 500, help="Mathematical skills")
            english = st.slider("📝 English & Communication", 100, 900, 500, help="Written communication")
            coding = st.slider("💻 Programming Logic", 100, 900, 500, help="Coding proficiency")
            domain = st.slider("🎯 Domain Knowledge", 100, 900, 500, help="Technical domain expertise")
        
        st.markdown("### 🎯 Target Role")
        target_role = st.selectbox(
            "Select your dream job:",
            list(SKILLS_DB.keys()),
            label_visibility="collapsed"
        )
        
        role_info = SKILLS_DB[target_role]
        with st.expander("📌 Role Details", expanded=False):
            st.markdown(f"""
            | Metric | Value |
            |--------|-------|
            | **Salary Range** | {role_info['salary_range']} |
            | **Demand** | {role_info['demand']} |
            | **Growth** | {role_info['growth']} YoY |
            """)
    
    with col_skills:
        st.markdown("### ✅ Your Skills")
        selected_skills = st.multiselect(
            "Select skills you have:",
            ALL_SKILLS,
            default=["SQL Database", "Excel Spreadsheets"] if "SQL Database" in ALL_SKILLS else [],
            label_visibility="collapsed"
        )
        
        st.markdown("### 📄 Resume Upload")
        uploaded_resume = st.file_uploader("Upload PDF", type="pdf")
    
    st.markdown("---")
    
    if st.button("🚀 Generate Comprehensive Report", use_container_width=True, type="primary"):
        if not uploaded_resume:
            st.warning("⚠️ Please upload your resume for full analysis")
            st.stop()
        elif not model_loaded:
            st.error("🚨 ML Model not loaded. Run `train_model.py` first.")
            st.stop()
        
        with st.spinner("🔄 Analyzing your profile..."):
            # Resume Analysis
            resume_text = extract_text_from_pdf(uploaded_resume)
            
            # Handle PDF errors
            if resume_text.startswith("PDF_ERROR_"):
                error_type = resume_text.replace("PDF_ERROR_", "")
                if error_type == "IMAGE":
                    st.error("⚠️ **Scanned PDF Detected!**\n\nThis appears to be an image-based (scanned) PDF. Please convert it to a text-based PDF or use a text-based resume.\n\n**Solutions:**\n1. Use a text-based PDF resume\n2. Copy-paste content into a Word doc and save as PDF\n3. Use OCR tools to convert scanned PDF to text")
                    st.stop()
                elif error_type == "PASSWORD":
                    st.error("⚠️ This PDF is password-protected. Please remove password protection and re-upload.")
                    st.stop()
                else:
                    st.error(f"⚠️ Could not read PDF: {error_type}")
                    st.stop()
            
            word_count = len(resume_text.split())
            
            if word_count < 30:
                st.error("⚠️ Could not extract enough text from PDF. Please ensure it's a text-based resume (not scanned/images).")
                st.stop()
            
            resume_result = analyze_resume(resume_text)
            
            # Feature Engineering for ML
            total_aptitude = logical + quant + english
            tech_score = coding + domain
            logical_quant_avg = (logical + quant) / 2
            gpa_normalized = 0.75  # Assume default, could be input field
            
            features = np.array([[
                logical, quant, english, coding, domain,
                total_aptitude, tech_score, logical_quant_avg,
                gpa_normalized, int(gpa_normalized > 0.75), 0  # Top_College default
            ]])
            
            features_scaled = scaler.transform(features)
            ml_probability = model.predict_proba(features_scaled)[0][1] * 100
            
            # Flask Backend Call
            flask_payload = {
                "target_role": target_role,
                "scores": {
                    "Logical": logical / 100,
                    "Quant": quant / 100,
                    "English": english / 100,
                    "ComputerProgramming": coding / 100,
                    "Domain": domain / 100
                },
                "selected_skills": selected_skills
            }
            
            flask_data = {}
            try:
                response = requests.post("http://127.0.0.1:5000/api/analyze", json=flask_payload, timeout=5)
                if response.status_code == 200:
                    flask_data = response.json()
            except requests.exceptions.ConnectionError:
                st.info("📡 Backend offline - Run `python app.py` to enable full features")
            except Exception as e:
                st.warning(f"Backend error: {e}")
            
            # DISPLAY RESULTS
            st.markdown("---")
            st.markdown("## 📊 Your Results")
            
            result_col1, result_col2, result_col3 = st.columns(3)
            
            with result_col1:
                # Employability Score
                if ml_probability >= 75:
                    st.markdown("""
                    <div class='success-box'>
                        <h2 style='text-align: center; margin: 0;'>🎉</h2>
                        <h3 style='text-align: center;'>Highly Employable</h3>
                        <p style='text-align: center; font-size: 2.5rem; margin: 10px 0;'>{}%</p>
                        <p style='text-align: center;'>Top {}% of candidates</p>
                    </div>
                    """.format(round(ml_probability, 1), int(100-ml_probability)), unsafe_allow_html=True)
                elif ml_probability >= 50:
                    st.markdown("""
                    <div style='background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%); border-radius: 12px; padding: 20px; color: white;'>
                        <h3 style='text-align: center;'>⚡ Moderately Employable</h3>
                        <p style='text-align: center; font-size: 2.5rem; margin: 10px 0;'>{}%</p>
                        <p style='text-align: center;'>Room for improvement</p>
                    </div>
                    """.format(round(ml_probability, 1)), unsafe_allow_html=True)
                else:
                    st.markdown("""
                    <div style='background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); border-radius: 12px; padding: 20px; color: white;'>
                        <h3 style='text-align: center;'>📚 Needs Development</h3>
                        <p style='text-align: center; font-size: 2.5rem; margin: 10px 0;'>{}%</p>
                        <p style='text-align: center;'>Focus on upskilling</p>
                    </div>
                    """.format(round(ml_probability, 1)), unsafe_allow_html=True)
            
            with result_col2:
                st.markdown("### 📄 Resume Score")
                resume_pct = (resume_result['score'] / resume_result['max']) * 100
                st.progress(resume_pct / 100)
                st.markdown(f"**Score: {resume_result['score']}/{resume_result['max']}**")
                
                for status, msg in resume_result['feedback']:
                    if status == "success":
                        st.success(f"✅ {msg}")
                
                for suggestion in resume_result['suggestions']:
                    st.warning(f"💡 {suggestion}")
            
            with result_col3:
                st.markdown("### 🔍 Skill Match")
                required_skills = role_info['required']
                matched = [s for s in required_skills if any(sk.lower() in s.lower() or s.lower() in sk.lower() for sk in selected_skills)]
                match_pct = len(matched) / len(required_skills) * 100
                
                st.progress(match_pct / 100)
                st.markdown(f"**Match: {round(match_pct, 0)}%** for {target_role}")
                
                missing = [s for s in required_skills if s not in matched]
                if missing:
                    with st.expander("❌ Missing Skills", expanded=True):
                        for skill in missing:
                            st.error(f"- {skill}")
            
            # Skill Gap Analysis
            if flask_data.get('missing_skills'):
                st.markdown("### 🎯 Skill Gap Analysis")
                gap_col1, gap_col2 = st.columns(2)
                
                with gap_col1:
                    st.markdown("#### ❌ Skills to Develop")
                    for skill in flask_data.get('missing_skills', []):
                        st.error(f"• {skill}")
                
                with gap_col2:
                    st.markdown("#### 🛤️ Recommended Learning")
                    for item in flask_data.get('remedial_roadmap', []):
                        # Robust video link fallback
                        video_link = item.get('video_link', '')
                        if not video_link:
                            skill_for_link = item.get('skill', '')
                            video_link = f"https://www.youtube.com/results?search_query={skill_for_link.replace(' ', '+')}+course"
                        st.markdown(f"""
                        **{item['skill']}**  
                        [📚 Start Learning]({video_link})  
                        Gap: {item['gap_amount']}/10
                        """)

with tab2:
    st.markdown("### 📈 2026 Tech Job Market Insights")
    
    market_col1, market_col2, market_col3 = st.columns(3)
    
    with market_col1:
        st.markdown("#### 🏆 Highest Demand Roles")
        st.markdown("""
        1. **AI Engineer** - +35% growth
        2. **ML Engineer** - +25% growth  
        3. **Data Engineer** - +20% growth
        4. **Data Analyst** - +15% growth
        5. **Software Engineer** - +10% growth
        """)
    
    with market_col2:
        st.markdown("#### 💰 Salary Trends (2026)")
        st.markdown("""
        | Role | Avg Package |
        |------|-------------|
        | AI Engineer | 20-30 LPA |
        | ML Engineer | 15-22 LPA |
        | Data Engineer | 12-18 LPA |
        | Senior DA | 8-15 LPA |
        | Entry DA | 4-7 LPA |
        """)
    
    with market_col3:
        st.markdown("#### 🔥 Must-Have Skills")
        hot_skills = ["LLM & Generative AI", "Cloud (AWS/GCP)", "MLOps", 
                      "Real-time Analytics", "Data Visualization", "Python + SQL"]
        for skill in hot_skills:
            st.markdown(f"• **{skill}**")
    
    st.markdown("### 📊 Role Comparison")
    comparison_data = {
        'Role': list(SKILLS_DB.keys()),
        'Demand': [SKILLS_DB[r]['demand'] for r in SKILLS_DB],
        'Salary': [SKILLS_DB[r]['salary_range'] for r in SKILLS_DB],
        'Growth': [SKILLS_DB[r]['growth'] for r in SKILLS_DB]
    }
    st.dataframe(pd.DataFrame(comparison_data), use_container_width=True)

with tab3:
    st.markdown("### 📚 Personalized Learning Path")
    
    st.markdown("""
    Based on your profile and target role, here's your curated learning roadmap:
    """)
    
    learning_col1, learning_col2 = st.columns(2)
    
    with learning_col1:
        st.markdown("#### 🎯 Priority 1 (Critical)")
        priority_1 = {
            "AI Engineer": ["Advanced Python Programming", "Deep Learning Specialization", "NLP with Transformers"],
            "ML Engineer": ["ML Algorithms", "Feature Engineering", "MLOps Fundamentals"],
            "Data Engineer": ["Advanced SQL & ETL", "Spark & Big Data", "Cloud Platforms"],
            "Data Analyst (Senior)": ["Business Intelligence Tools", "Statistical Modeling", "Python for Analytics"],
            "Data Analyst (Entry)": ["SQL Fundamentals", "Excel Advanced", "Data Visualization"],
            "Software Engineer (General)": ["DSA Complete Course", "System Design", "Git & Version Control"]
        }
        for course in priority_1.get(target_role, []):
            st.markdown(f"- 📚 **{course}**")
    
    with learning_col2:
        st.markdown("#### 🚀 Priority 2 (Enhancement)")
        priority_2 = {
            "AI Engineer": ["Computer Vision", "LLM Fine-tuning", "Model Deployment"],
            "ML Engineer": ["Model Optimization", "A/B Testing", "ML Pipelines"],
            "Data Engineer": ["Data Modeling", "Kafka & Streaming", "Kubernetes"],
            "Data Analyst (Senior)": ["Dashboard Design", "SQL Optimization", "Storytelling with Data"],
            "Data Analyst (Entry)": ["Pandas & NumPy", "Basic Statistics", "Git Basics"],
            "Software Engineer (General)": ["OOP Design Patterns", "API Design", "Testing"]
        }
        for course in priority_2.get(target_role, []):
            st.markdown(f"- 📖 **{course}**")
    
    st.markdown("---")
    st.markdown("""
    ### ⏰ Recommended Timeline
    
    | Phase | Duration | Focus |
    |-------|----------|-------|
    | Foundation | 2-3 months | Core skills for your role |
    | Intermediate | 3-4 months | Advanced concepts & projects |
    | Mastery | 2-3 months | Real-world projects & portfolio |
    | Job Prep | 1 month | Interview prep & networking |
    """)
    
    st.markdown("### 🎓 Free Resources to Get Started")
    st.markdown("""
    - **Coursera**: [Machine Learning by Stanford](https://coursera.org/learn/machine-learning)
    - **Fast.ai**: [Practical Deep Learning](https://fast.ai)
    - **Hugging Face**: [NLP Course](https://huggingface.co/learn/nlp-course)
    - **Google**: [Cloud Skills Boost](https://www.cloudskillsboost.google)
    - **AWS**: [Free Training](https://aws.amazon.com/training/)
    """)

# FOOTER
st.markdown("---")
st.markdown(f"""
<div style='text-align: center; color: #666; padding: 20px;'>
    <p>SkillGap AI Pro © 2026 | Powered by Machine Learning</p>
    <p style='font-size: 0.8rem;'>Model Accuracy: 75%+ | Updated for 2026 Market</p>
</div>
""", unsafe_allow_html=True)
