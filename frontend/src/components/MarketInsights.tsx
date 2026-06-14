import { useState, useEffect } from 'react'
import { api } from '../api/client'
import type { Role, Provider } from '../types'
import MetricCard from './ui/MetricCard'

export default function MarketInsights() {
  const [roles, setRoles] = useState<Role[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.getRoles().then(setRoles).catch(() => {}),
      api.getProviders().then(setProviders).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="info-msg">Loading market data...</div>

  const topDemand = [...roles].sort((a, b) => b.market_demand_score - a.market_demand_score).slice(0, 5)
  const fastestLearn = [...roles].sort((a, b) => a.average_learning_months - b.average_learning_months).slice(0, 5)

  const domainGroups = roles.reduce<Record<string, Role[]>>((acc, r) => {
    const d = r.domain || 'Other'
    if (!acc[d]) acc[d] = []
    acc[d].push(r)
    return acc
  }, {})

  return (
    <div>
      <h3 style={{ marginBottom: 20 }}>2026 Tech Job Market Insights</h3>

      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="card">
          <h4 style={{ marginBottom: 12 }}>Roles by Domain</h4>
          {Object.entries(domainGroups).map(([domain, group]) => (
            <div key={domain} style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: 600, color: '#e94560', fontSize: '0.9rem' }}>{domain}</div>
              <div style={{ color: '#888', fontSize: '0.85rem' }}>{group.length} roles: {group.map(r => r.role_name).join(', ')}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <h4 style={{ marginBottom: 12 }}>Top Roles by Demand</h4>
          {topDemand.map((r, i) => (
            <div key={r.role_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 4 ? '1px solid var(--card-border)' : 'none' }}>
              <span>{r.role_name}</span>
              <span style={{ color: '#14ffec' }}>{r.market_demand_score}/100</span>
            </div>
          ))}
        </div>

        <div className="card">
          <h4 style={{ marginBottom: 12 }}>Fastest Learning Paths</h4>
          {fastestLearn.map((r, i) => (
            <div key={r.role_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 4 ? '1px solid var(--card-border)' : 'none' }}>
              <span>{r.role_name}</span>
              <span style={{ color: '#f39c12' }}>{r.average_learning_months} months</span>
            </div>
          ))}
        </div>
      </div>

      <h4 style={{ marginBottom: 12 }}>All Roles Comparison</h4>
      <div className="card" style={{ overflowX: 'auto', marginBottom: 24 }}>
        <table>
          <thead>
            <tr>
              <th>Role</th>
              <th>Domain</th>
              <th>Level</th>
              <th>Priority</th>
              <th>Demand</th>
              <th>Months</th>
            </tr>
          </thead>
          <tbody>
            {roles.map(r => (
              <tr key={r.role_id}>
                <td style={{ fontWeight: 600 }}>{r.role_name}</td>
                <td>{r.domain}</td>
                <td style={{ textTransform: 'capitalize' }}>{r.level}</td>
                <td>
                  <div className="progress-bar" style={{ width: 80, display: 'inline-block' }}>
                    <div className="progress-fill" style={{ width: `${r.priority_score}%` }} />
                  </div>
                  {r.priority_score}
                </td>
                <td>
                  <div className="progress-bar" style={{ width: 80, display: 'inline-block' }}>
                    <div className="progress-fill" style={{ width: `${r.market_demand_score}%` }} />
                  </div>
                  {r.market_demand_score}
                </td>
                <td>{r.average_learning_months}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {providers.length > 0 && (
        <>
          <h4 style={{ marginBottom: 12 }}>Course Providers Overview</h4>
          <div className="card" style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Provider</th>
                  <th>Type</th>
                  <th>Trust Score</th>
                  <th>Certificates</th>
                  <th>Free</th>
                  <th>Country</th>
                </tr>
              </thead>
              <tbody>
                {providers.map(p => (
                  <tr key={p.provider_id}>
                    <td style={{ fontWeight: 600 }}>{p.provider_name}</td>
                    <td>{p.provider_type}</td>
                    <td>
                      <div className="progress-bar" style={{ width: 60, display: 'inline-block' }}>
                        <div className="progress-fill" style={{ width: `${p.trust_score}%` }} />
                      </div>
                      {p.trust_score}
                    </td>
                    <td>{p.certificate_supported ? 'Yes' : 'No'}</td>
                    <td>{p.free_courses_available ? 'Yes' : 'No'}</td>
                    <td>{p.country}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
