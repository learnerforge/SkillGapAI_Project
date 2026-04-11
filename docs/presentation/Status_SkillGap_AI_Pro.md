Status: SkillGap AI Pro – Enterprise Career Predictor
Date: 2026-04-09

Slide 1 — Title
- SkillGap AI Pro
- Enterprise Career Predictor
- Current Status Review

Slide 2 — Data & Datasets
- Data sources in repo/data:
  - amcat_data.csv (primary AMCAT features)
  - course_content.csv (remediation resources)
  - job_benchmarks.csv (role requirements)
  - students_dropout_academic_success.csv (risk model input)
  - skill_progress.db (progress tracking)
- Cleanups performed: removed unused cleaned datasets
- Data quality actions: introduced enhanced features (Total_Aptitude, Tech_Score, GPA_Normalized)

Slide 3 — Models & Metrics
- Models:
  - rf_employability_model.pkl (Random Forest)
  - dt_risk_model.pkl (Decision Tree)
- Training improvements:
  - Feature engineering added
  - Class balancing and hyperparameter tuning
- Current accuracy: ~75.12% on employability task (vs 65.5% prior)

Slide 4 — Backend & APIs
- Endpoints:
  - /api/analyze (POST) -> analysis results and remediation
  - /api/progress (GET) -> user progress summary
  - /api/progress/update (POST) -> update progress status
  - /api/progress/reset (POST) -> reset user progress
- Reliability: enhanced error handling for missing video links and resumes
- Backend can operate offline with fallbacks in UI

Slide 5 — Frontend & UI
- Streamlit UI with three tabs: Assessment, Market Insights, Learning Path
- Resume upload, score inputs, skill selection
- Robust remediation rendering with video links (fallback to YouTube search if missing)
- Progress view to show completion rates

Slide 6 — Error Handling (PDF Resume)
- PDFs that are image-based raise: PDF_ERROR_IMAGE
- Password-protected PDFs raise: PDF_ERROR_PASSWORD
- User-facing messages guide to convert or re-upload

Slide 7 — Current Status vs. Plan
- Achievements:
  - Data pipeline stabilized, models retrained, UI improvements
- Gaps & Next Steps:
  - Optional NLP/DL enhancements (A: lightweight NLP; B: embeddings)
  - UI polish, accessibility, deployment prep

Slide 8 — Risk & Mitigations
- Data privacy: local storage of progress with SQLite
- Model drift: retraining cadence and validation checks
- Dependency drift: pin versions and CI checks

Slide 9 — Roadmap (High Level)
- Short-term: finalize NLP-lite option A or DL option B decision
- Medium-term: multi-tenant enterprise deploy, auth, audit logs
- Long-term: enhanced resume parsing, real-time job market signals

Appendix — Quick Demos & How to Run
- Run backend: python app.py
- Run frontend: streamlit run frontend.py
- End-to-end test payload examples included in code
