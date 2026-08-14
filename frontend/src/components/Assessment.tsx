import { useState, useEffect, useRef } from 'react'
import { api, type Role, type AnalyzeResult } from '../api/client'
import Select from './Select'

const SKILLS = [
  { key: 'Logical', label: 'Logical Reasoning' },
  { key: 'Quant', label: 'Quantitative Aptitude' },
  { key: 'English', label: 'English & Communication' },
  { key: 'ComputerProgramming', label: 'Programming Logic' },
  { key: 'Domain', label: 'Domain Knowledge' },
]

const RESUME_ERROR_MESSAGES: Record<string, string> = {
  PDF_ERROR_PASSWORD: 'This PDF is password-protected. Remove the password and re-upload.',
  PDF_ERROR_IMAGE: 'This PDF looks like a scanned/image file with no extractable text. Upload a text-based PDF or paste your resume below.',
  PDF_ERROR_TYPE: 'Only PDF files are supported.',
  PDF_ERROR_SIZE: 'File is too large (max 10 MB).',
  PDF_ERROR_PARSE: 'Could not read this PDF. Try a different file.',
}

interface Props {
  defaultRoleId?: string
  username?: string
}

export default function Assessment({ defaultRoleId, username }: Props) {
  const [roles, setRoles] = useState<Role[]>([])
  const [selectedRole, setSelectedRole] = useState(defaultRoleId || '')
  const [loadingRoles, setLoadingRoles] = useState(true)
  const [scores, setScores] = useState<Record<string, number>>(() =>
    Object.fromEntries(SKILLS.map((s) => [s.key, 5]))
  )
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [availableSkills, setAvailableSkills] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalyzeResult | null>(null)
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')
  const [resumeStatus, setResumeStatus] = useState<'idle' | 'parsing' | 'ready' | 'error'>('idle')
  const [resumeText, setResumeText] = useState('')
  const [resumeInfo, setResumeInfo] = useState('')
  const [resumeError, setResumeError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    api.getRoles()
      .then(setRoles)
      .catch(() => {})
      .finally(() => setLoadingRoles(false))
  }, [])

  useEffect(() => {
    if (!selectedRole) {
      setAvailableSkills([])
      setSelectedSkills([])
      return
    }
    api.getRole(selectedRole)
      .then(r => setAvailableSkills([...r.required_skills_list, ...r.optional_skills_list]))
      .catch(() => setAvailableSkills([]))
  }, [selectedRole])

  const handleScoreChange = (key: string, value: number) => {
    setScores((prev) => ({ ...prev, [key]: value }))
  }

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    )
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setFileName(file.name)
    setResumeStatus('parsing')
    setResumeError('')
    setResumeInfo('')
    try {
      const res = await api.parseResume(file)
      if (res.success && res.text) {
        setResumeText(res.text)
        setResumeStatus('ready')
        setResumeInfo(
          `${res.page_count ?? 1} page${(res.page_count ?? 1) > 1 ? 's' : ''} · ${res.word_count ?? res.text.split(/\s+/).length} words`
        )
      } else {
        setResumeStatus('error')
        setResumeError(
          (res.code && RESUME_ERROR_MESSAGES[res.code]) ||
            res.message ||
            'Could not parse this PDF.'
        )
      }
    } catch {
      setResumeStatus('error')
      setResumeError('Upload failed. Is the backend running?')
    }
  }

  const clearResume = () => {
    setFileName('')
    setResumeText('')
    setResumeStatus('idle')
    setResumeInfo('')
    setResumeError('')
  }

  const handleAnalyze = async () => {
    setError('')
    setLoading(true)
    setResult(null)
    try {
      const res = await api.analyze({
        scores,
        selected_skills: selectedSkills,
        target_role: selectedRole || undefined,
        user_id: username,
        resume_text: resumeText || undefined,
      })
      setResult(res)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="assessment-page">
      <h2 className="page-title animate-fade-in">Skill Assessment</h2>
      <p className="page-subtitle animate-fade-in stagger-1">
        Rate your proficiency across key skill areas
      </p>

      {/* Sliders Card */}
      <div className="card animate-slide-up stagger-1">
        <h3 className="card-title">Self Assessment Scores</h3>

        {SKILLS.map((skill, i) => (
          <div
            key={skill.key}
            className="slider-group"
            style={{ animationDelay: `${0.15 + i * 0.06}s` }}
          >
            <div className="slider-header">
              <span className="slider-label">{skill.label}</span>
              <span className="slider-value">{scores[skill.key]}</span>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              step={0.5}
              value={scores[skill.key]}
              onChange={(e) =>
                handleScoreChange(skill.key, Number(e.target.value))
              }
            />
          </div>
        ))}
      </div>

      {/* Role Selector */}
      <div className="card animate-slide-up stagger-3">
        <h3 className="card-title">Target Role</h3>
        <div className="form-group">
          <label className="form-label">Select a role</label>
          <Select
            options={[
              { value: '', label: 'No specific role' },
              ...roles.map(r => ({ value: r.role_id, label: `${r.role_name} (${r.domain})` })),
            ]}
            value={selectedRole}
            onChange={setSelectedRole}
            placeholder="Select a role"
            loading={loadingRoles}
          />
        </div>
      </div>

      {/* Skills Already Have */}
      {availableSkills.length > 0 && (
        <div className="card animate-slide-up stagger-4">
          <h3 className="card-title">Skills You Already Have</h3>
          <p className="page-subtitle" style={{ marginBottom: 12 }}>
            Select the skills you already possess to improve accuracy
          </p>
          <div className="skill-tags">
            {availableSkills.map(s => (
              <button
                key={s}
                type="button"
                className={`skill-tag optional${selectedSkills.includes(s) ? ' selected' : ''}`}
                onClick={() => toggleSkill(s)}
              >
                {s}
                {selectedSkills.includes(s) ? ' ✓' : ''}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Resume Upload */}
      <div className="card animate-slide-up stagger-5">
        <h3 className="card-title">Resume Upload</h3>
        <div
          className="file-upload"
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".pdf"
            hidden
            onChange={handleFileChange}
          />
          {fileName ? (
            <span className="file-name">{fileName}</span>
          ) : (
            <span className="file-placeholder">
              Click to upload a PDF resume (optional)
            </span>
          )}
        </div>

        {resumeStatus === 'parsing' && (
          <p className="resume-status parsing">
            <span className="spinner" /> Parsing resume...
          </p>
        )}

        {resumeStatus === 'ready' && (
          <div className="resume-status ready">
            <span>Resume parsed successfully ({resumeInfo}).</span>
            <button type="button" className="btn btn-secondary btn-small" onClick={clearResume}>
              Remove
            </button>
          </div>
        )}

        {resumeStatus === 'error' && (
          <p className="error-text">{resumeError}</p>
        )}

        <div className="form-group" style={{ marginTop: 12 }}>
          <label className="form-label">
            Or paste your resume text{' '}
            <span className="text-muted">(enables AI role detection)</span>
          </label>
          <textarea
            className="form-textarea"
            rows={6}
            placeholder="Paste the text content of your resume here..."
            value={resumeText}
            onChange={(e) => {
              setResumeText(e.target.value)
              if (e.target.value && resumeStatus !== 'ready') setResumeStatus('ready')
              if (!e.target.value) setResumeStatus('idle')
            }}
          />
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      {/* Analyze Button */}
      <button
        className="btn btn-primary btn-full animate-slide-up stagger-5"
        onClick={handleAnalyze}
        disabled={loading}
      >
        {loading ? (
          <>
            <span className="spinner" />
            Analyzing...
          </>
        ) : (
          'Analyze My Skills'
        )}
      </button>

      {/* Results */}
      {result && (
        <div className="card result-card animate-scale-in">
          <h3 className="card-title">Results</h3>

          <div style={{ textAlign: 'center', marginBottom: result.ai_role ? 4 : 16 }}>
            {result.ai_role && (
              <span className="ai-role-badge">
                AI detected: {result.ai_role}
              </span>
            )}
          </div>

          <div
            className="score-ring"
            style={{ '--score-deg': `${(result.final_readiness_score / 100) * 360}deg` } as React.CSSProperties}
          >
            <div className="result-score">{result.final_readiness_score}%</div>
          </div>
          <p className="result-label">Readiness Score</p>

          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <span className={`ready-badge ${result.is_job_ready ? 'ready' : 'not-ready'}`}>
              {result.is_job_ready ? 'Job Ready' : 'Needs Improvement'}
            </span>
          </div>

          {result.all_skills.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <h4 style={{
                marginBottom: 12, fontSize: 13, fontWeight: 600,
                color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px',
              }}>
                Skill Breakdown
              </h4>
              {result.all_skills.map((s, i) => (
                <div key={i} className="skill-breakdown-row animate-fade-in" style={{ animationDelay: `${i * 0.06}s` }}>
                  <div className="sb-skill">{s.skill}</div>
                  <div className="sb-bar-track">
                    <div
                      className="sb-bar-fill"
                      style={{
                        width: `${Math.min((s.actual / Math.max(s.required, 1)) * 100, 100)}%`,
                        background: s.is_missing ? 'var(--danger)' : 'var(--success)',
                      }}
                    />
                  </div>
                  <div className="sb-values">
                    <span style={{ color: s.is_missing ? 'var(--danger)' : 'var(--success)' }}>
                      {s.actual}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>/ {s.required}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {result.remedial_roadmap.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <h4 style={{
                marginBottom: 12, fontSize: 13, fontWeight: 600,
                color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px',
              }}>
                Recommended Resources
              </h4>
              <div className="resource-list">
                {result.remedial_roadmap.map((r, i) => (
                  <a
                    key={i}
                    href={r.video_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="resource-item animate-fade-in"
                    style={{ animationDelay: `${i * 0.06}s`, textDecoration: 'none' }}
                  >
                    <div className="resource-skill">{r.skill}</div>
                    <div className="resource-gap">Gap: {r.gap_amount}</div>
                    {r.resources?.[0] && (
                      <div className="resource-meta">
                        {r.resources[0].name} &middot; {r.resources[0].provider}
                      </div>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
