import { useState, useEffect, useMemo } from 'react'
import { api } from '../api/client'
import { UCard, UBadge, ULoader, UProgressBar, USkeleton, USelect } from './ui'
import type { Role, Provider } from '../types'

export default function MarketInsights() {
  const [roles, setRoles] = useState<Role[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [domainFilter, setDomainFilter] = useState('')
  const [sortBy, setSortBy] = useState<'demand' | 'priority' | 'months'>('demand')
  const [showProviders, setShowProviders] = useState(false)

  useEffect(() => {
    Promise.all([
      api.getRoles().then(setRoles).catch(() => {}),
      api.getProviders().then(setProviders).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  const domains = useMemo(() => {
    const d = new Set(roles.map(r => r.domain).filter(Boolean))
    return Array.from(d).sort()
  }, [roles])

  const filteredRoles = useMemo(() => {
    let list = domainFilter ? roles.filter(r => r.domain === domainFilter) : [...roles]
    switch (sortBy) {
      case 'demand': list.sort((a, b) => b.market_demand_score - a.market_demand_score); break
      case 'priority': list.sort((a, b) => b.priority_score - a.priority_score); break
      case 'months': list.sort((a, b) => a.average_learning_months - b.average_learning_months); break
    }
    return list
  }, [roles, domainFilter, sortBy])

  const topDemand = useMemo(() => [...roles].sort((a, b) => b.market_demand_score - a.market_demand_score).slice(0, 5), [roles])
  const fastestLearn = useMemo(() => [...roles].sort((a, b) => a.average_learning_months - b.average_learning_months).slice(0, 5), [roles])

  const domainGroups = useMemo(() => roles.reduce<Record<string, Role[]>>((acc, r) => {
    const d = r.domain || 'Other'
    if (!acc[d]) acc[d] = []
    acc[d].push(r)
    return acc
  }, {}), [roles])

  if (loading) {
    return (
      <div className="space-y-6">
        <USkeleton variant="text" width="240px" height="28px" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <USkeleton variant="card" />
          <USkeleton variant="card" />
          <USkeleton variant="card" />
        </div>
        <USkeleton variant="rectangular" height="400px" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="typo-section">2026 Tech Job Market Insights</h3>
        <div className="flex items-center gap-3">
          <USelect
            placeholder="All Domains"
            value={domainFilter}
            onChange={e => setDomainFilter(e.target.value)}
            options={domains.map(d => ({ value: d, label: d }))}
            className="w-44"
          />
          <USelect
            placeholder="Sort by..."
            value={sortBy}
            onChange={e => setSortBy(e.target.value as typeof sortBy)}
            options={[
              { value: 'demand', label: 'Market Demand' },
              { value: 'priority', label: 'Priority Score' },
              { value: 'months', label: 'Learning Months' },
            ]}
            className="w-40"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-children">
        <UCard>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-[#e94560]" />
            <h4 className="font-heading text-sm font-semibold text-white/80">Roles by Domain</h4>
          </div>
          <div className="space-y-4">
            {Object.entries(domainGroups).length === 0 ? (
              <p className="text-sm text-white/30">No domain data available</p>
            ) : (
              Object.entries(domainGroups).map(([domain, group]) => (
                <div key={domain}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-[#e94560] shrink-0" />
                    <span className="font-semibold text-sm text-[#e94560]">{domain}</span>
                    <UBadge>{group.length}</UBadge>
                  </div>
                  <p className="text-[11px] text-white/40 leading-relaxed pl-4 line-clamp-2">
                    {group.map(r => r.role_name).join(', ')}
                  </p>
                </div>
              ))
            )}
          </div>
        </UCard>

        <UCard>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-[#14ffec]" />
            <h4 className="font-heading text-sm font-semibold text-white/80">Top Roles by Demand</h4>
          </div>
          <div className="space-y-1">
            {topDemand.map((r, i) => (
              <div key={r.role_id} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="text-xs font-bold text-white/20 w-5 shrink-0">{i + 1}</span>
                  <span className="text-sm truncate">{r.role_name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <div className="w-16">
                    <UProgressBar variant="accent" value={r.market_demand_score} size="sm" />
                  </div>
                  <span className="text-xs font-semibold text-[#14ffec] w-5 text-right">{r.market_demand_score}</span>
                </div>
              </div>
            ))}
          </div>
        </UCard>

        <UCard>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-[#f39c12]" />
            <h4 className="font-heading text-sm font-semibold text-white/80">Fastest Learning Paths</h4>
          </div>
          <div className="space-y-1">
            {fastestLearn.map((r, i) => (
              <div key={r.role_id} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="text-xs font-bold text-white/20 w-5 shrink-0">{i + 1}</span>
                  <span className="text-sm truncate">{r.role_name}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-xs text-white/40">{r.average_learning_months}</span>
                  <UBadge variant="warning" size="sm">months</UBadge>
                </div>
              </div>
            ))}
          </div>
        </UCard>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-heading text-sm font-semibold text-white/70">
            All Roles Comparison
            <span className="text-white/30 ml-2 font-normal">({filteredRoles.length} roles)</span>
          </h4>
        </div>
        <UCard padded={false} className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="text-left px-4 py-3 text-[#e94560] font-semibold text-xs uppercase tracking-wider">Role</th>
                <th className="text-left px-4 py-3 text-[#e94560] font-semibold text-xs uppercase tracking-wider">Domain</th>
                <th className="text-left px-4 py-3 text-[#e94560] font-semibold text-xs uppercase tracking-wider">Level</th>
                <th className="text-left px-4 py-3 text-[#e94560] font-semibold text-xs uppercase tracking-wider">Priority</th>
                <th className="text-left px-4 py-3 text-[#e94560] font-semibold text-xs uppercase tracking-wider">Demand</th>
                <th className="text-right px-4 py-3 text-[#e94560] font-semibold text-xs uppercase tracking-wider">Months</th>
              </tr>
            </thead>
            <tbody>
              {filteredRoles.map(r => (
                <tr key={r.role_id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 font-medium text-sm">{r.role_name}</td>
                  <td className="px-4 py-3 text-white/50 text-xs">{r.domain}</td>
                  <td className="px-4 py-3">
                    <UBadge variant={r.level === 'advanced' ? 'danger' : r.level === 'intermediate' ? 'warning' : 'success'}>
                      {r.level}
                    </UBadge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <UProgressBar variant="accent" value={r.priority_score} size="sm" className="w-14" />
                      <span className="text-xs text-white/50">{r.priority_score}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <UProgressBar variant="success" value={r.market_demand_score} size="sm" className="w-14" />
                      <span className="text-xs text-white/50">{r.market_demand_score}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-white/50 text-xs">{r.average_learning_months}</td>
                </tr>
              ))}
              {filteredRoles.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-white/30 text-sm">
                    No roles match the selected filter
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </UCard>
      </div>

      {providers.length > 0 && (
        <div>
          <button
            onClick={() => setShowProviders(p => !p)}
            className="flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white transition-colors mb-3"
          >
            <span>{showProviders ? 'Hide' : 'Show'} Course Providers</span>
            <svg
              className={`w-3.5 h-3.5 transition-transform duration-200 ${showProviders ? 'rotate-180' : ''}`}
              viewBox="0 0 12 8" fill="none"
            >
              <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {showProviders && (
            <div className="animate-slideDown">
              <UCard padded={false} className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.02]">
                      <th className="text-left px-4 py-3 text-[#e94560] font-semibold text-xs uppercase tracking-wider">Provider</th>
                      <th className="text-left px-4 py-3 text-[#e94560] font-semibold text-xs uppercase tracking-wider">Type</th>
                      <th className="text-left px-4 py-3 text-[#e94560] font-semibold text-xs uppercase tracking-wider">Trust</th>
                      <th className="text-center px-4 py-3 text-[#e94560] font-semibold text-xs uppercase tracking-wider">Cert</th>
                      <th className="text-center px-4 py-3 text-[#e94560] font-semibold text-xs uppercase tracking-wider">Free</th>
                      <th className="text-left px-4 py-3 text-[#e94560] font-semibold text-xs uppercase tracking-wider">Country</th>
                    </tr>
                  </thead>
                  <tbody>
                    {providers.map(p => (
                      <tr key={p.provider_id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 font-medium text-sm">{p.provider_name}</td>
                        <td className="px-4 py-3 text-white/50 text-xs">{p.provider_type}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 max-w-[100px]">
                            <UProgressBar
                              variant={p.trust_score >= 80 ? 'success' : p.trust_score >= 60 ? 'warning' : 'danger'}
                              value={p.trust_score}
                              size="sm"
                              className="flex-1"
                            />
                            <span className="text-xs text-white/50 w-6 text-right">{p.trust_score}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={p.certificate_supported ? 'text-[#14ffec]' : 'text-white/20'}>
                            {p.certificate_supported ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={p.free_courses_available ? 'text-[#14ffec]' : 'text-white/20'}>
                            {p.free_courses_available ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-white/50 text-xs">{p.country}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </UCard>
            </div>
          )}
        </div>
      )}

      {providers.length === 0 && !loading && (
        <UCard>
          <p className="text-sm text-white/40">No provider data available. Run import_course_data.py first.</p>
        </UCard>
      )}
    </div>
  )
}
