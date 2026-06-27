import { useState, useEffect } from 'react'
import { api, type ProgressItem } from '../api/client'

interface Props {
  username: string
}

const STATUS_OPTIONS = ['all', 'pending', 'completed'] as const

export default function ProgressTracker({ username }: Props) {
  const [progress, setProgress] = useState<ProgressItem[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [error, setError] = useState('')

  const fetchProgress = () => {
    setLoading(true)
    const status = statusFilter === 'all' ? undefined : statusFilter
    api.getProgress(username, status)
      .then(setProgress)
      .catch(() => setProgress([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchProgress()
  }, [username, statusFilter])

  const handleToggleStatus = async (item: ProgressItem) => {
    const newStatus = item.status === 'completed' ? 'pending' : 'completed'
    const key = `${item.skill_name}-${item.target_role}`
    setUpdating(key)
    setError('')
    try {
      await api.updateProgress(username, item.skill_name, item.target_role, newStatus)
      fetchProgress()
    } catch {
      setError('Failed to update progress')
    }
    setUpdating(null)
  }

  const completedCount = progress.filter(p => p.status === 'completed').length
  const pendingCount = progress.filter(p => p.status === 'pending').length

  return (
    <div className="page">
      <div className="page-header animate-fade-in">
        <h2 className="page-title">My Progress</h2>
        <p className="page-subtitle">Track your skill development journey</p>
      </div>

      <div className="stats-grid small animate-slide-up stagger-1">
        <div className="stat-card">
          <div className="stat-value">{progress.length}</div>
          <div className="stat-label">Total</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--success)' }}>{completedCount}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--warning)' }}>{pendingCount}</div>
          <div className="stat-label">Pending</div>
        </div>
      </div>

      <div className="domain-tabs animate-fade-in stagger-1">
        {STATUS_OPTIONS.map(s => (
          <button
            key={s}
            className={`domain-tab ${statusFilter === s ? 'active' : ''}`}
            onClick={() => setStatusFilter(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {error && <p className="error-text">{error}</p>}

      {loading ? (
        <div className="loader-center"><div className="loading-dots"><span /><span /><span /></div></div>
      ) : progress.length === 0 ? (
        <div className="card">
          <p className="empty-state">No progress items yet. Complete an assessment to get started.</p>
        </div>
      ) : (
        <div className="progress-list animate-slide-up stagger-2">
          {progress.map((item, i) => (
            <div
              key={`${item.skill_name}-${item.target_role}`}
              className="progress-item animate-fade-in"
              style={{ animationDelay: `${i * 0.04}s` }}
            >
              <div className="progress-item-left">
                <div className="progress-item-skill">{item.skill_name}</div>
                <div className="progress-item-role">{item.target_role}</div>
                <div className="progress-item-meta">
                  {item.gap_score != null && <span>Gap: {item.gap_score.toFixed(1)}</span>}
                  {item.duration && <span>{item.duration}</span>}
                  <span>{new Date(item.created_at).toLocaleDateString()}</span>
                </div>
                {item.resource_link && (
                  <a
                    href={item.resource_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="progress-resource-link"
                  >
                    View Resource
                  </a>
                )}
              </div>
              <div className="progress-item-right">
                <span className={`status-badge ${item.status}`}>
                  {item.status}
                </span>
                <button
                  className="btn btn-secondary btn-small"
                  onClick={() => handleToggleStatus(item)}
                  disabled={updating === `${item.skill_name}-${item.target_role}`}
                >
                  {updating === `${item.skill_name}-${item.target_role}`
                    ? <span className="spinner" />
                    : item.status === 'completed' ? 'Reopen' : 'Complete'
                  }
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
