import { useState, useEffect } from 'react'
import { api } from '../api/client'
import type { Role, AnalysisResult, Skill } from '../types'

const SLIDER_CONFIG = [
  { key: 'Logical', label: 'Logical Reasoning', min: 100, max: 900, default: 500 },
  { key: 'Quant', label: 'Quantitative Aptitude', min: 100, max: 900, default: 500 },
  { key: 'English', label: 'English & Communication', min: 100, max: 900, default: 500 },
  { key: 'ComputerProgramming', label: 'Programming Logic', min: 100, max: 900, default: 500 },
  { key: 'Domain', label: 'Domain Knowledge', min: 100, max: 900, default: 500 },
]

interface AssessmentProps {
  userId: string
}

export default function Assessment({ userId }: AssessmentProps) {
  const [roles, setRoles] = useState<Role[]>([])
  const [allSkills, setAllSkills] = useState<Skill[]>([])
  const [scores, setScores] = useState<Record<string, number>>(
    Object.fromEntries(SLIDER_CONFIG.map(s => [s.key, s.default]))
  )
  const [selectedRoleId, setSelectedRoleId] = useState('')
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [resumeText, setResumeText] = useState('')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showRoleDetail, setShowRoleDetail] = useState(false)

  useEffect(() => {
    api.getRoles().then(setRoles).catch(() => {})
    api.getSkills().then(setAllSkills).catch(() => {})
  }, [])

  const selectedRole = roles.find(r => r.role_id === selectedRoleId)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setResumeText(reader.result as string)
    reader.readAsText(file)
  }

  const analyze = async () => {
    if (!selectedRole) {
      setError('Please select a target role')
      return
    }
    setLoading(true); setError(''); setResult(null)
    try {
      const scoresNormalized = Object.fromEntries(
        Object.entries(scores).map(([k, v]) => [k, v / 100])
      )
      const data = await api.analyze({
        target_role: selectedRole.role_name,
        scores: scoresNormalized,
        selected_skills: selectedSkills,
        resume_text: resumeText,
        user_id: userId,
      })
      setResult(data)
    } catch {
      setError('Backend offline. Run app.py first.')
    }
    setLoading(false)
  }

  const requiredSkills = selectedRole?.required_skills
    ? selectedRole.required_skills.split(';').map(s => s.trim()).filter(Boolean)
    : []

  const matchedSkills = requiredSkills.filter(s =>
    selectedSkills.some(sk => sk.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(sk.toLowerCase()))
  )
  const matchPct = requiredSkills.length ? Math.round((matchedSkills.length / requiredSkills.length) * 100) : 0

  return (
    <div>
      <div className="grid-2">
        <div>
          <h3 style={{ marginBottom: 16 }}>Enter Your Scores</h3>
          <div className="card">
            {SLIDER_CONFIG.map(s => (
              <div className="slider-group" key={s.key}>
                <label>{s.label}</label>
                <input
                  type="range"
                  min={s.min}
                  max={s.max}
                  value={scores[s.key]}
                  onChange={e => setScores(s => ({ ...s, [s.key]: Number(e.target.value) }))}
                />
                <div className="slider-value">{scores[s.key]}</div>
              </div>
            ))}
          </div>

          <h3 style={{ margin: '16px 0' }}>Target Role</h3>
          <select
            value={selectedRoleId}
            onChange={e => setSelectedRoleId(e.target.value)}
            style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid var(--card-border)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '1rem', marginBottom: 12 }}
          >
            <option value="">Select a role...</option>
            {roles.map(r => (
              <option key={r.role_id} value={r.role_id}>
                {r.role_name} ({r.domain})
              </option>
            ))}
          </select>

          {selectedRole && (
            <div className="expander">
              <div className="expander-header" onClick={() => setShowRoleDetail(!showRoleDetail)}>
                Role Details
                <span>{showRoleDetail ? '-' : '+'}</span>
              </div>
              {showRoleDetail && (
                <div className="expander-body">
                  <table>
                    <tbody>
                      <tr><td>Domain</td><td>{selectedRole.domain}</td></tr>
                      <tr><td>Level</td><td>{selectedRole.level}</td></tr>
                      <tr><td>Learning Months</td><td>{selectedRole.average_learning_months}</td></tr>
                      <tr><td>Priority Score</td><td>{selectedRole.priority_score}/100</td></tr>
                      <tr><td>Market Demand</td><td>{selectedRole.market_demand_score}/100</td></tr>
                      <tr><td>Required Skills</td><td>{selectedRole.required_skills.replace(/;/g, ', ')}</td></tr>
                      <tr><td>Optional Skills</td><td>{selectedRole.optional_skills.replace(/;/g, ', ')}</td></tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <h3 style={{ marginBottom: 16 }}>Your Skills</h3>
          <div className="card" style={{ marginBottom: 16 }}>
            <select
              multiple
              value={selectedSkills}
              onChange={e => setSelectedSkills(Array.from(e.target.selectedOptions, o => o.value))}
              style={{ width: '100%', minHeight: 200, padding: 8, borderRadius: 8, border: '1px solid var(--card-border)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '0.9rem' }}
            >
              {allSkills.map(s => (
                <option key={s.normalized_skill_name} value={s.normalized_skill_name}>
                  {s.normalized_skill_name}
                </option>
              ))}
            </select>
          </div>

          <h3 style={{ marginBottom: 16 }}>Resume Upload</h3>
          <div className="card">
            <input
              type="file"
              accept=".txt,.pdf"
              onChange={handleFileUpload}
              style={{ width: '100%', color: 'white' }}
            />
            {resumeText && (
              <div style={{ marginTop: 8, color: '#888', fontSize: '0.85rem' }}>
                Loaded {resumeText.length} characters
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ margin: '24px 0' }}>
        <button className="btn" onClick={analyze} disabled={loading}>
          {loading ? 'Analyzing...' : 'Generate Comprehensive Report'}
        </button>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {result && (
        <div>
          <h3 style={{ marginBottom: 16 }}>Your Results</h3>
          <div className="grid-3">
            <div className={`stat-box ${result.final_readiness_score >= 75 ? 'success' : result.final_readiness_score >= 50 ? 'warning' : 'danger'}`}>
              <h3>{result.final_readiness_score >= 75 ? 'Highly Employable' : result.final_readiness_score >= 50 ? 'Moderately Employable' : 'Needs Development'}</h3>
              <div className="value">{result.final_readiness_score}%</div>
            </div>

            <div className="card">
              <h4 style={{ marginBottom: 12 }}>Resume Score</h4>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${result.missing_skills.length > 0 ? Math.max(10, 100 - Math.round(result.missing_skills.length / Math.max(result.all_skills.length, 1) * 100)) : 100}%` }} />
              </div>
              <div className="slider-value" style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '8px 0' }}>
                {result.missing_skills.length > 0 ? Math.max(10, 100 - Math.round(result.missing_skills.length / Math.max(result.all_skills.length, 1) * 100)) : 100}%
              </div>
              <div style={{ marginTop: 4, fontSize: '0.85rem', color: '#888' }}>
                Based on {result.all_skills.length} skills analyzed
              </div>
              {result.ai_role && (
                <div className="info-msg" style={{ marginTop: 8 }}>
                  AI Classification: {result.ai_role}
                </div>
              )}
            </div>

            <div className="card">
              <h4 style={{ marginBottom: 12 }}>Skill Match</h4>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${matchPct}%` }} />
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '8px 0' }}>{matchPct}%</div>
              <div style={{ color: '#888' }}>for {selectedRole?.role_name}</div>
              {result.missing_skills.length > 0 && (
                <div className="expander" style={{ marginTop: 12 }}>
                  <div className="expander-header">Missing Skills</div>
                  <div className="expander-body">
                    {result.missing_skills.map(s => (
                      <div key={s} style={{ color: '#e74c3c', padding: '4px 0' }}>{s}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {result.remedial_roadmap.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <h3 style={{ marginBottom: 16 }}>Skill Gap Analysis</h3>
              <div className="grid-2">
                <div className="card">
                  <h4 style={{ marginBottom: 12, color: '#e74c3c' }}>Skills to Develop</h4>
                  {result.missing_skills.map(s => (
                    <div key={s} style={{ padding: '6px 0', color: '#e74c3c' }}>{s}</div>
                  ))}
                </div>
                <div className="card">
                  <h4 style={{ marginBottom: 12, color: '#14ffec' }}>Recommended Learning</h4>
                  {result.remedial_roadmap.map(item => (
                    <div key={item.skill} style={{ marginBottom: 12, padding: 8, background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                      <div style={{ fontWeight: 600 }}>{item.skill}</div>
                      <div style={{ color: '#888', fontSize: '0.85rem' }}>
                        Gap: {item.gap_amount}/10
                      </div>
                      <a href={item.video_link || `https://www.youtube.com/results?search_query=${encodeURIComponent(item.skill)}+course`}
                         target="_blank" rel="noopener noreferrer"
                         style={{ color: '#14ffec', fontSize: '0.85rem' }}>
                        Start Learning
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
