# SkillGap AI Pro

**2026 Market-Ready Employability Analyzer** -- Assess skill gaps across 25 tech roles using ML, with a 68K+ course engine spanning 34 providers.

---

## Quick Start

```bash
# One-time setup: import course engine data
python import_course_data.py

# Start the server (serves API + React frontend on one port)
python app.py

# Open http://localhost:5000
```

### Development mode

```bash
cd frontend && npm install && npm run dev   # Vite on port 8501
# In another terminal:
python ../app.py                            # Flask API on port 5000
# Open http://localhost:8501
```

### Windows

Double-click `start_backend.bat`, then open `http://localhost:5000`.

---

## Architecture

```
React + TypeScript (frontend/)
    │
    ├── POST /api/analyze          → ML gap analysis + score
    ├── GET  /api/roles            → 25 tech roles across 5 domains
    ├── GET  /api/courses          → 68K course catalog search
    ├── GET  /api/recommendations  → Role-specific course picks
    ├── GET  /api/skills           → Skill search
    ├── GET  /api/providers        → 34 course providers
    ├── GET  /api/progress         → User skill progress tracking
    ├── POST /api/progress/update  → Mark skills complete/pending
    ├── GET  /api/user/:username   → User profile
    ├── POST /api/login            → Authentication
    └── POST /api/register         → Registration
          │
    Flask (app.py) on port 5000
          │
    ┌─────┼──────────────────────────┐
    │     │                          │
  SQLite   ML Models (joblib)      CSV Files
  (skill_    rf_employability      amcat_data.csv
  progress)  dt_risk              job_benchmarks.csv
  course_    custom_resume         course_content.csv
  engine)    classifier
```

## Frontend Pages

| Page | Purpose | Key API |
|------|---------|---------|
| **Dashboard** | Stats overview, quick actions | `GET /api/progress` |
| **Assessment** | Skill sliders, role selector, resume upload, gap results | `POST /api/analyze`, `GET /api/roles` |
| **Market Insights** | Browse 25 roles by domain, provider trust scores | `GET /api/roles`, `GET /api/providers` |
| **Learning Path** | Course search by skill/difficulty, role-based recommendations | `GET /api/courses`, `GET /api/recommendations`, `GET /api/skills` |
| **Progress** | Track pending/completed skills, resource links | `GET /api/progress`, `POST /api/progress/update` |
| **Role Detail** | Single role view with skills + recommended courses | `GET /api/roles/:id`, `GET /api/recommendations` |
| **Profile** | User info + logout | `GET /api/user/:username` |

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analyze` | POST | Gap analysis: `scores`, `target_role`, `user_id` → readiness score + remedial roadmap |
| `/api/roles` | GET | All 25 roles. Filter: `?domain=AI/ML` |
| `/api/roles/<id>` | GET | Single role with required/optional skills |
| `/api/courses` | GET | Search: `?skill=Python&difficulty=beginner&provider=X&limit=50` |
| `/api/courses/<id>` | GET | Single course with associated skills |
| `/api/skills` | GET | Skill search: `?search=Python` |
| `/api/recommendations` | GET | Role courses: `?role_id=R011&limit=20` |
| `/api/providers` | GET | All 34 providers with trust scores |
| `/api/progress` | GET | User skill progress: `?user_id=X&status=pending` |
| `/api/progress/update` | POST | Update skill status: `user_id`, `skill_name`, `target_role`, `status` |
| `/api/user/<username>` | GET | User profile (username, email, created_at, last_login) |
| `/api/login` | POST | Authenticate: `username`, `password` → user info |
| `/api/register` | POST | Register: `username`, `password`, `email` |

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite 6 (plain CSS, no framework)
- **Backend**: Flask, Flask-CORS
- **ML**: scikit-learn, Sentence Transformers, joblib
- **Data**: SQLite, pandas, course engine (68K courses, 156K role-course mappings)
- **Auth**: SQLite + SHA-256 hashing

## ML Models

| Model | Algorithm | Purpose |
|-------|-----------|---------|
| `rf_employability_model.pkl` | Random Forest (200 trees) | Predict high-salary employability |
| `dt_risk_model.pkl` | Decision Tree (depth=5) | Predict dropout/graduation risk |
| `custom_resume_classifier.pkl` | SentenceTransformer + RF (100 trees) | Classify resume into job category |
| `scaler.pkl` | StandardScaler | Feature normalization |

## Course Engine

| Table | Rows | Description |
|-------|------|-------------|
| `providers` | 34 | NPTEL, Microsoft Learn, MIT OCW, freeCodeCamp, etc. |
| `courses` | 68,641 | Multi-provider, multi-language catalog |
| `course_skills` | 164,260 | Auto-extracted skill tags |
| `roles` | 25 | Structured roles with required/optional skills |
| `role_course_mappings` | 156,755 | Scored course-to-role relevance |

## Project Structure

```
app.py                          # Flask API + serves React build
auth.py                         # Authentication (SQLite + SHA-256)
course_db.py                    # Course engine query layer
import_course_data.py           # One-time course data import
train_model.py                  # Employability model training
train_risk_model.py             # Risk model training
train_custom_ai.py              # Resume classifier training
start_backend.bat               # Launch Flask on port 5000
start_frontend.bat              # Launch Vite on port 8501

frontend/
  index.html
  vite.config.ts                # Port 8501, /api proxy → 5000
  package.json
  src/
    main.tsx                    # Entry point
    App.tsx                     # Auth gate + tab routing
    App.css                     # All styles (glassmorphism, uiverse-inspired)
    api/client.ts               # Typed fetch wrapper for all endpoints
    components/
      LoginPage.tsx             # Login + register (glassmorphism card)
      Dashboard.tsx             # Stats, quick actions
      Assessment.tsx            # Skill sliders, role select, gap results
      MarketInsights.tsx        # Role grid + provider listing
      LearningPath.tsx          # Course browser + recommendations
      ProgressTracker.tsx       # Skill progress tracking
      RoleDetail.tsx            # Role skills + recommended courses
      Profile.tsx               # User profile + logout
      Select.tsx                # Custom dropdown (replaces native <select>)

data/
  skill_progress.db             # Main database (users + course engine, ~140MB)
  amcat_data.csv                # Employability dataset
  job_benchmarks.csv            # Role skill benchmarks
  course_content.csv            # Remedial course resources

models/
  rf_employability_model.pkl
  dt_risk_model.pkl
  scaler.pkl
  custom_resume_classifier.pkl
```

## Notes

- `data/skill_progress.db` (140 MB) is excluded from `.gitignore`. Use Git LFS or a release artifact for deployment.
- Correct Python path: `C:\Users\bakke\AppData\Local\Programs\Python\Python311\python.exe` (has Flask + scikit-learn). The default `python` on PATH is a different venv.
- Flask serves both the API and the built React frontend on port 5000 in production. In dev mode, Vite (8501) proxies `/api` to Flask (5000).
- Build frontend: `cd frontend && npm run build` — outputs to `frontend/dist/`.
- Colab notebook: `SkillGapAI_Colab_Deploy.ipynb` — 11-cell workflow for Google Colab deployment.
