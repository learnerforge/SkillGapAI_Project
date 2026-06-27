import { useState, useEffect } from 'react'
import { api, type UserProfile } from '../api/client'

interface Props {
  username: string
  onLogout: () => void
}

export default function Profile({ username, onLogout }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getUserProfile(username)
      .then(setProfile)
      .catch(() => {
        setProfile(null)
        setError('Failed to load profile')
      })
      .finally(() => setLoading(false))
  }, [username])

  return (
    <div className="page">
      <div className="page-header animate-fade-in">
        <h2 className="page-title">Profile</h2>
        <p className="page-subtitle">Your account details</p>
      </div>

      {error && <p className="error-text">{error}</p>}

      {loading ? (
        <div className="loader-center"><div className="loading-dots"><span /><span /><span /></div></div>
      ) : (
        <div className="card profile-card animate-slide-up">
          <div className="profile-avatar">
            {profile?.username?.charAt(0).toUpperCase() || username.charAt(0).toUpperCase()}
          </div>
          <div className="profile-info">
            <div className="profile-row">
              <span className="profile-label">Username</span>
              <span className="profile-value">{profile?.username || username}</span>
            </div>
            <div className="profile-row">
              <span className="profile-label">Email</span>
              <span className="profile-value">{profile?.email || 'Not set'}</span>
            </div>
            <div className="profile-row">
              <span className="profile-label">Member since</span>
              <span className="profile-value">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="profile-row">
              <span className="profile-label">Last login</span>
              <span className="profile-value">
                {profile?.last_login ? new Date(profile.last_login).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
          <button className="btn btn-secondary btn-full" onClick={onLogout} style={{ marginTop: 20 }}>
            Log Out
          </button>
        </div>
      )}
    </div>
  )
}
