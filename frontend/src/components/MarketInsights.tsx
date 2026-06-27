import { useState, useEffect } from 'react'
import { api, type Role, type Provider } from '../api/client'

interface Props {
  onNavigate: (tab: string, params?: Record<string, string>) => void
}

export default function MarketInsights({ onNavigate }: Props) {
  const [roles, setRoles] = useState<Role[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [activeDomain, setActiveDomain] = useState('All')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.getRoles().catch(() => [] as Role[]),
      api.getProviders().catch(() => [] as Provider[]),
    ])
      .then(([r, p]) => {
        setRoles(r)
        setProviders(p)
      })
      .finally(() => setLoading(false))
  }, [])

  const filteredRoles = roles.filter(r => {
    if (activeDomain !== 'All' && r.domain !== activeDomain) return false
    if (search && !r.role_name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const uniqueDomains = ['All', ...new Set(roles.map(r => r.domain).filter(Boolean))]

  const domainCounts = uniqueDomains.map(d => ({
    name: d,
    count: d === 'All' ? roles.length : roles.filter(r => r.domain === d).length,
  }))

  return (
    <div className="page">
      <div className="page-header animate-fade-in">
        <h2 className="page-title">Market Insights</h2>
        <p className="page-subtitle">Explore 25 tech roles across 5 domains</p>
      </div>

      <input
        className="form-input search-input animate-fade-in stagger-1"
        placeholder="Search roles..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <div className="domain-tabs animate-fade-in stagger-1">
        {domainCounts.map(d => (
          <button
            key={d.name}
            className={`domain-tab ${activeDomain === d.name ? 'active' : ''}`}
            onClick={() => setActiveDomain(d.name)}
          >
            {d.name}
            <span className="domain-count">{d.count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loader-center"><div className="loading-dots"><span /><span /><span /></div></div>
      ) : (
        <>
          <div className="role-grid">
            {filteredRoles.map((role, i) => (
              <div
                key={role.role_id}
                className="role-card animate-slide-up"
                style={{ animationDelay: `${i * 0.04}s` }}
                onClick={() => onNavigate('role', { roleId: role.role_id })}
              >
                <div className="role-card-header">
                  <span className="role-name">{role.role_name}</span>
                  <span className={`role-level level-${role.level?.toLowerCase().replace(/\s+/g, '-') || 'mid'}`}>
                    {role.level || 'N/A'}
                  </span>
                </div>
                <div className="role-domain-badge">{role.domain}</div>
                <div className="role-stats">
                  {role.market_demand_score != null && (
                    <div className="role-stat">
                      <span className="role-stat-label">Demand</span>
                      <div className="stat-bar-track">
                        <div className="stat-bar-fill demand-fill" style={{ width: `${role.market_demand_score}%` }} />
                      </div>
                      <span className="role-stat-value">{role.market_demand_score}%</span>
                    </div>
                  )}
                  {role.average_learning_months != null && (
                    <div className="role-stat">
                      <span className="role-stat-label">Learning</span>
                      <span className="role-stat-value">{role.average_learning_months}mo</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {filteredRoles.length === 0 && (
              <div className="empty-state">No roles match your filter.</div>
            )}
          </div>

          <div className="card animate-slide-up stagger-3" style={{ marginTop: 32 }}>
            <h3 className="card-title">Course Providers</h3>
            <div className="provider-grid">
              {providers.map(p => (
                <div key={p.provider_id} className="provider-card">
                  <div className="provider-name">{p.provider_name}</div>
                  <div className="provider-type">{p.provider_type}</div>
                  {p.trust_score != null && (
                    <div className="provider-trust-row">
                      <span className="provider-trust-label">Trust</span>
                      <div className="stat-bar-track">
                        <div className="stat-bar-fill trust-fill" style={{ width: `${p.trust_score}%` }} />
                      </div>
                      <span className="provider-trust-value">{p.trust_score}%</span>
                    </div>
                  )}
                  {p.certificate_supported ? (
                    <span className="cert-badge">Certificate</span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
