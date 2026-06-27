import { useState, useEffect } from 'react'
import { api, type RoleDetail as RoleDetailType, type Recommendation } from '../api/client'

interface Props {
  roleId: string
  onNavigate: (tab: string, params?: Record<string, string>) => void
}

export default function RoleDetail({ roleId, onNavigate }: Props) {
  const [role, setRole] = useState<RoleDetailType | null>(null)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [recsLoading, setRecsLoading] = useState(false)
  const [recsError, setRecsError] = useState('')

  useEffect(() => {
    setLoading(true)
    api.getRole(roleId)
      .then(setRole)
      .catch(() => setRole(null))
      .finally(() => setLoading(false))
  }, [roleId])

  const handleShowCourses = () => {
    setRecsLoading(true)
    setRecsError('')
    api.getRecommendations(roleId)
      .then(setRecommendations)
      .catch(() => {
        setRecommendations([])
        setRecsError('Failed to load recommendations')
      })
      .finally(() => setRecsLoading(false))
  }

  if (loading) {
    return (
      <div className="page">
        <div className="loader-center"><div className="loading-dots"><span /><span /><span /></div></div>
      </div>
    )
  }

  if (!role) {
    return (
      <div className="page">
        <div className="card">
          <p className="empty-state">Role not found.</p>
          <button className="btn btn-secondary" onClick={() => onNavigate('market')}>
            Back to Roles
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <button className="back-link animate-fade-in" onClick={() => onNavigate('market')}>
        &larr; Back to Roles
      </button>

      <div className="card role-detail-card animate-slide-up">
        <div className="role-detail-header">
          <div>
            <h2 className="page-title" style={{ marginBottom: 4 }}>{role.role_name}</h2>
            <span className="role-domain-badge" style={{ fontSize: 13 }}>{role.domain}</span>
            <span className={`role-level level-${role.level?.toLowerCase().replace(/\s+/g, '-') || 'mid'}`} style={{ marginLeft: 8 }}>
              {role.level || 'N/A'}
            </span>
          </div>
        </div>

        <div className="role-detail-stats">
          {role.market_demand_score != null && (
            <div className="detail-stat">
              <span className="detail-stat-label">Market Demand</span>
              <div className="stat-bar-track">
                <div className="stat-bar-fill demand-fill" style={{ width: `${role.market_demand_score}%` }} />
              </div>
              <span className="detail-stat-value">{role.market_demand_score}%</span>
            </div>
          )}
          {role.average_learning_months != null && (
            <div className="detail-stat">
              <span className="detail-stat-label">Avg Learning Time</span>
              <span className="detail-stat-value">{role.average_learning_months} months</span>
            </div>
          )}
        </div>

        <div className="skill-sections">
          <div className="skill-section">
            <h4 className="skill-section-title">Required Skills</h4>
            <div className="skill-tags">
              {role.required_skills_list.map(s => (
                <span key={s} className="skill-tag required">{s}</span>
              ))}
              {role.required_skills_list.length === 0 && (
                <span className="text-muted">No required skills listed.</span>
              )}
            </div>
          </div>

          <div className="skill-section">
            <h4 className="skill-section-title">Optional Skills</h4>
            <div className="skill-tags">
              {role.optional_skills_list.map(s => (
                <span key={s} className="skill-tag optional">{s}</span>
              ))}
              {role.optional_skills_list.length === 0 && (
                <span className="text-muted">No optional skills listed.</span>
              )}
            </div>
          </div>
        </div>

        <button
          className="btn btn-primary btn-full"
          onClick={() => onNavigate('assessment', { roleId: role.role_id })}
          style={{ marginTop: 20 }}
        >
          Take Assessment for This Role
        </button>
      </div>

      <div className="card animate-slide-up stagger-2">
        <div className="card-header-row">
          <h3 className="card-title">Recommended Courses</h3>
          <button className="btn btn-secondary btn-small" onClick={handleShowCourses} disabled={recsLoading}>
            {recsLoading ? <span className="spinner" /> : 'Load Courses'}
          </button>
        </div>
        {recsError && <p className="error-text" style={{ marginBottom: 8 }}>{recsError}</p>}
        {recsLoading ? (
          <div className="loader-center" style={{ padding: 24 }}>
            <div className="loading-dots"><span /><span /><span /></div>
          </div>
        ) : recommendations.length > 0 ? (
          <div className="course-grid compact">
            {recommendations.map((r, i) => (
              <a
                key={r.mapping_id}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="course-card animate-fade-in"
                style={{ animationDelay: `${i * 0.04}s`, textDecoration: 'none' }}
              >
                <div className="course-title">{r.title}</div>
                <div className="course-provider">{r.provider_name}</div>
                <div className="course-card-meta">
                  <span className={`course-diff diff-${r.difficulty?.toLowerCase() || 'unknown'}`}>
                    {r.difficulty || 'N/A'}
                  </span>
                  {r.relevance_score != null && (
                    <span className="course-relevance">Match: {r.relevance_score.toFixed(0)}%</span>
                  )}
                </div>
              </a>
            ))}
          </div>
        ) : (
          <p className="text-muted" style={{ fontSize: 13 }}>Click "Load Courses" to see recommendations.</p>
        )}
      </div>
    </div>
  )
}
