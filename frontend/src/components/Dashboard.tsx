import { useState, useEffect } from 'react'
import { api, type ProgressItem } from '../api/client'

interface Props {
  username: string
  onNavigate: (tab: string, params?: Record<string, string>) => void
}

export default function Dashboard({ username, onNavigate }: Props) {
  const [progress, setProgress] = useState<ProgressItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getProgress(username)
      .then(setProgress)
      .catch(() => setProgress([]))
      .finally(() => setLoading(false))
  }, [username])

  const completedCount = progress.filter(p => p.status === 'completed').length
  const pendingCount = progress.filter(p => p.status === 'pending').length
  const totalGap = progress.reduce((sum, p) => sum + (p.gap_score || 0), 0)
  const avgGap = progress.length ? (totalGap / progress.length) : 0

  return (
    <div className="page">
      <div className="page-header animate-fade-in">
        <h2 className="page-title">Welcome back, {username}</h2>
        <p className="page-subtitle">Here's your skill development overview</p>
      </div>

      {loading ? (
        <div className="loader-center"><div className="loading-dots"><span /><span /><span /></div></div>
      ) : (
        <>
          <div className="stats-grid animate-slide-up stagger-1">
            <div className="stat-card">
              <div className="stat-value">{progress.length}</div>
              <div className="stat-label">Skills Assessed</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--success)' }}>{completedCount}</div>
              <div className="stat-label">Completed</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--warning)' }}>{pendingCount}</div>
              <div className="stat-label">In Progress</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{avgGap.toFixed(1)}</div>
              <div className="stat-label">Avg Gap Score</div>
            </div>
          </div>

          <div className="action-grid animate-slide-up stagger-2">
            <button className="action-card" onClick={() => onNavigate('assessment')}>
              <div className="action-icon">&#9881;</div>
              <div className="action-title">New Assessment</div>
              <div className="action-desc">Analyze your skills for a target role</div>
            </button>
            <button className="action-card" onClick={() => onNavigate('market')}>
              <div className="action-icon">&#9733;</div>
              <div className="action-title">Market Insights</div>
              <div className="action-desc">Browse 25 tech roles and providers</div>
            </button>
            <button className="action-card" onClick={() => onNavigate('courses')}>
              <div className="action-icon">&#9998;</div>
              <div className="action-title">Learning Path</div>
              <div className="action-desc">Find courses to close your skill gaps</div>
            </button>
            <button className="action-card" onClick={() => onNavigate('progress')}>
              <div className="action-icon">&#9654;</div>
              <div className="action-title">My Progress</div>
              <div className="action-desc">Track your skill development journey</div>
            </button>
          </div>
        </>
      )}
    </div>
  )
}
