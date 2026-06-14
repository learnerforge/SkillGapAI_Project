import { useState, useEffect } from 'react'
import { api } from '../api/client'
import type { Role, Recommendation, Provider } from '../types'

const DOMAIN_PHASES = [
  { phase: 'Foundation', duration: '2-3 months', desc: 'Core skills for your role' },
  { phase: 'Intermediate', duration: '3-4 months', desc: 'Advanced concepts & projects' },
  { phase: 'Mastery', duration: '2-3 months', desc: 'Real-world projects & portfolio' },
  { phase: 'Job Prep', duration: '1 month', desc: 'Interview prep & networking' },
]

export default function LearningPath() {
  const [roles, setRoles] = useState<Role[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [selectedRoleId, setSelectedRoleId] = useState('')
  const [recs, setRecs] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.getRoles().then(setRoles).catch(() => {})
    api.getProviders().then(setProviders).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedRoleId) { setRecs([]); return }
    setLoading(true)
    api.getRecommendations(selectedRoleId, 20)
      .then(setRecs)
      .catch(() => setRecs([]))
      .finally(() => setLoading(false))
  }, [selectedRoleId])

  const selectedRole = roles.find(r => r.role_id === selectedRoleId)

  const priority1 = recs.filter(r => r.required_or_optional === 'required' || r.required_or_optional === 'recommended')
  const priority2 = recs.filter(r => r.required_or_optional === 'foundation')
  const extras = recs.filter(r => r.required_or_optional === 'optional')

  const topProviders = [...providers].sort((a, b) => b.trust_score - a.trust_score).slice(0, 6)

  return (
    <div>
      <h3 style={{ marginBottom: 8 }}>Personalized Learning Path</h3>
      <p style={{ color: '#888', marginBottom: 20 }}>Based on your profile and target role, here is your curated learning roadmap:</p>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Select Target Role</label>
        <select
          value={selectedRoleId}
          onChange={e => setSelectedRoleId(e.target.value)}
          style={{ width: '100%', maxWidth: 400, padding: '12px', borderRadius: 8, border: '1px solid var(--card-border)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '1rem' }}
        >
          <option value="">Select a role...</option>
          {roles.map(r => (
            <option key={r.role_id} value={r.role_id}>{r.role_name} ({r.domain})</option>
          ))}
        </select>
      </div>

      {loading && <div className="info-msg">Loading recommendations...</div>}

      {recs.length > 0 && (
        <div className="grid-2" style={{ marginBottom: 24 }}>
          <div className="card">
            <h4 style={{ marginBottom: 12, color: '#14ffec' }}>Recommended Courses</h4>
            {priority1.length === 0 && <div className="info-msg">No recommended courses found</div>}
            {priority1.slice(0, 8).map(r => (
              <div key={r.mapping_id} style={{ padding: '10px 0', borderBottom: '1px solid var(--card-border)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{r.title}</div>
                <div style={{ color: '#888', fontSize: '0.8rem' }}>
                  {r.provider_name}
                  {r.difficulty && <span className={`badge ${r.difficulty}`} style={{ marginLeft: 6 }}>{r.difficulty}</span>}
                  {r.certificate_available && <span style={{ marginLeft: 6, color: '#14ffec' }}>Cert</span>}
                </div>
                <div style={{ color: '#666', fontSize: '0.8rem' }}>Relevance: {r.relevance_score}</div>
              </div>
            ))}
          </div>

          <div className="card">
            <h4 style={{ marginBottom: 12, color: '#f39c12' }}>Foundation Courses</h4>
            {priority2.length === 0 && <div className="info-msg">No foundation courses found</div>}
            {priority2.slice(0, 8).map(r => (
              <div key={r.mapping_id} style={{ padding: '10px 0', borderBottom: '1px solid var(--card-border)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{r.title}</div>
                <div style={{ color: '#888', fontSize: '0.8rem' }}>
                  {r.provider_name}
                  {r.difficulty && <span className={`badge ${r.difficulty}`} style={{ marginLeft: 6 }}>{r.difficulty}</span>}
                  {r.certificate_available && <span style={{ marginLeft: 6, color: '#14ffec' }}>Cert</span>}
                </div>
                <div style={{ color: '#666', fontSize: '0.8rem' }}>Score: {r.relevance_score}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {extras.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h4 style={{ marginBottom: 12, color: '#888' }}>Optional Courses</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {extras.slice(0, 10).map(r => (
              <div key={r.mapping_id} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, fontSize: '0.85rem' }}>
                <div style={{ fontWeight: 600 }}>{r.title}</div>
                <div style={{ color: '#888' }}>{r.provider_name} | Score: {r.relevance_score}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {recs.length === 0 && !loading && selectedRoleId && (
        <div className="card" style={{ marginBottom: 24 }}>
          <p style={{ color: '#888' }}>No recommendations available. Make sure the course data is imported (run import_course_data.py).</p>
        </div>
      )}

      {recs.length === 0 && !loading && !selectedRoleId && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h4 style={{ marginBottom: 12 }}>Quick Reference Learning Plan</h4>
          <table>
            <thead>
              <tr>
                <th>Phase</th>
                <th>Duration</th>
                <th>Focus</th>
              </tr>
            </thead>
            <tbody>
              {DOMAIN_PHASES.map(p => (
                <tr key={p.phase}>
                  <td style={{ fontWeight: 600 }}>{p.phase}</td>
                  <td>{p.duration}</td>
                  <td style={{ color: '#888' }}>{p.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedRole && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h4 style={{ marginBottom: 12 }}>Role-Specific Learning Plan</h4>
          <table>
            <thead>
              <tr>
                <th>Phase</th>
                <th>Duration</th>
                <th>Focus</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600 }}>Foundation</td>
                <td>2-3 months</td>
                <td style={{ color: '#888' }}>Core skills: {selectedRole.required_skills.slice(0, 80)}...</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Intermediate</td>
                <td>3-4 months</td>
                <td style={{ color: '#888' }}>Advanced concepts & {selectedRole.optional_skills.slice(0, 60)}...</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Mastery</td>
                <td>2-3 months</td>
                <td style={{ color: '#888' }}>Real-world projects & portfolio</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Job Prep</td>
                <td>1 month</td>
                <td style={{ color: '#888' }}>Interview prep & networking</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {topProviders.length > 0 && (
        <div className="card">
          <h4 style={{ marginBottom: 12 }}>Top-Rated Course Providers</h4>
          <div className="grid-3">
            {topProviders.map(p => (
              <div key={p.provider_id} style={{ padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                <div style={{ fontWeight: 600 }}>{p.provider_name}</div>
                <div style={{ color: '#888', fontSize: '0.85rem' }}>
                  Trust: {p.trust_score}/100
                </div>
                <div style={{ color: '#888', fontSize: '0.85rem' }}>
                  Type: {p.provider_type}
                </div>
                <div style={{ color: '#14ffec', fontSize: '0.85rem' }}>
                  {p.certificate_supported ? 'Certificates' : ''}{p.certificate_supported && p.free_courses_available ? ' | ' : ''}{p.free_courses_available ? 'Free courses' : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: 24 }}>
        <h4 style={{ marginBottom: 12 }}>Free Resources to Get Started</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          <a href="https://coursera.org/learn/machine-learning" target="_blank" rel="noopener noreferrer" style={{ color: '#14ffec' }}>Machine Learning by Stanford</a>
          <a href="https://fast.ai" target="_blank" rel="noopener noreferrer" style={{ color: '#14ffec' }}>Practical Deep Learning</a>
          <a href="https://huggingface.co/learn/nlp-course" target="_blank" rel="noopener noreferrer" style={{ color: '#14ffec' }}>NLP Course</a>
          <a href="https://www.cloudskillsboost.google" target="_blank" rel="noopener noreferrer" style={{ color: '#14ffec' }}>Google Cloud Skills Boost</a>
          <a href="https://aws.amazon.com/training/" target="_blank" rel="noopener noreferrer" style={{ color: '#14ffec' }}>AWS Free Training</a>
        </div>
      </div>
    </div>
  )
}
