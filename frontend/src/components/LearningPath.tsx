import { useState, useEffect, useMemo } from 'react'
import { api } from '../api/client'
import { UCard, UBadge, ULoader, USelect, UProgressBar, UAccordion, USkeleton } from './ui'
import { useNotification } from '../context/NotificationContext'
import type { Role, Recommendation, Provider } from '../types'

const DOMAIN_PHASES = [
  { phase: 'Foundation', duration: '2-3 months', desc: 'Core skills for your role' },
  { phase: 'Intermediate', duration: '3-4 months', desc: 'Advanced concepts & projects' },
  { phase: 'Mastery', duration: '2-3 months', desc: 'Real-world projects & portfolio' },
  { phase: 'Job Prep', duration: '1 month', desc: 'Interview prep & networking' },
]

const FREE_RESOURCES = [
  { label: 'Machine Learning by Stanford', url: 'https://coursera.org/learn/machine-learning' },
  { label: 'Practical Deep Learning', url: 'https://fast.ai' },
  { label: 'NLP Course', url: 'https://huggingface.co/learn/nlp-course' },
  { label: 'Google Cloud Skills Boost', url: 'https://www.cloudskillsboost.google' },
  { label: 'AWS Free Training', url: 'https://aws.amazon.com/training/' },
  { label: 'MIT OpenCourseWare', url: 'https://ocw.mit.edu' },
]

function getLevelBadge(difficulty?: string) {
  if (!difficulty) return 'default' as const
  if (difficulty === 'advanced') return 'danger' as const
  if (difficulty === 'intermediate') return 'warning' as const
  return 'success' as const
}

export default function LearningPath() {
  const { error: notifyError } = useNotification()
  const [roles, setRoles] = useState<Role[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [selectedRoleId, setSelectedRoleId] = useState('')
  const [recs, setRecs] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [showOptional, setShowOptional] = useState(false)
  const [showProvidersList, setShowProvidersList] = useState(false)

  useEffect(() => {
    Promise.all([
      api.getRoles().then(setRoles).catch(() => {}),
      api.getProviders().then(setProviders).catch(() => {}),
    ]).finally(() => setInitialLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedRoleId) { setRecs([]); return }
    setLoading(true)
    api.getRecommendations(selectedRoleId, 30)
      .then(setRecs)
      .catch(() => { notifyError('Failed to load recommendations') })
      .finally(() => setLoading(false))
  }, [selectedRoleId, notifyError])

  const selectedRole = useMemo(() => roles.find(r => r.role_id === selectedRoleId), [roles, selectedRoleId])

  const priority1 = useMemo(() =>
    recs.filter(r => r.required_or_optional === 'required' || r.required_or_optional === 'recommended'),
    [recs],
  )

  const priority2 = useMemo(() =>
    recs.filter(r => r.required_or_optional === 'foundation'),
    [recs],
  )

  const extras = useMemo(() =>
    recs.filter(r => r.required_or_optional === 'optional'),
    [recs],
  )

  const topProviders = useMemo(() =>
    [...providers].sort((a, b) => b.trust_score - a.trust_score).slice(0, 6),
    [providers],
  )

  if (initialLoading) {
    return (
      <div className="space-y-6">
        <USkeleton variant="text" width="300px" height="28px" />
        <USkeleton variant="text" width="200px" height="16px" />
        <USkeleton variant="rectangular" height="44px" className="max-w-md" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <USkeleton variant="card" />
          <USkeleton variant="card" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="typo-section mb-1">Personalized Learning Path</h3>
        <p className="text-sm text-white/40">
          {selectedRole
            ? `Curated courses for ${selectedRole.role_name}`
            : 'Select a target role to see your curated learning roadmap'
          }
        </p>
      </div>

      <div className="max-w-md">
        <USelect
          label="Select Target Role"
          placeholder="Choose a role..."
          value={selectedRoleId}
          onChange={e => setSelectedRoleId(e.target.value)}
          options={roles.map(r => ({ value: r.role_id, label: `${r.role_name} (${r.domain})` }))}
        />
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <ULoader text="Loading recommendations..." />
        </div>
      )}

      {!loading && recs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
          <UCard>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-[#14ffec] shrink-0" />
              <h4 className="font-heading font-semibold text-[#14ffec]">
                Recommended Courses
                <UBadge variant="info" className="ml-2">{priority1.length}</UBadge>
              </h4>
            </div>
            {priority1.length === 0 ? (
              <p className="text-sm text-white/40">No required or recommended courses found for this role.</p>
            ) : (
              <div className="space-y-1">
                {priority1.slice(0, 10).map(r => (
                  <div key={r.mapping_id} className="py-2.5 border-b border-white/5 last:border-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate" title={r.title}>{r.title}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-[11px] text-white/40">{r.provider_name}</span>
                          <UBadge variant={getLevelBadge(r.difficulty)}>{r.difficulty || 'all'}</UBadge>
                          {r.certificate_available && <UBadge variant="success">Cert</UBadge>}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-xs font-semibold text-[#14ffec]">{r.relevance_score}</div>
                        <div className="text-[10px] text-white/30">score</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </UCard>

          <UCard>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-[#f39c12] shrink-0" />
              <h4 className="font-heading font-semibold text-[#f39c12]">
                Foundation Courses
                <UBadge variant="warning" className="ml-2">{priority2.length}</UBadge>
              </h4>
            </div>
            {priority2.length === 0 ? (
              <p className="text-sm text-white/40">No foundation courses found for this role.</p>
            ) : (
              <div className="space-y-1">
                {priority2.slice(0, 10).map(r => (
                  <div key={r.mapping_id} className="py-2.5 border-b border-white/5 last:border-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate" title={r.title}>{r.title}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-[11px] text-white/40">{r.provider_name}</span>
                          <UBadge variant={getLevelBadge(r.difficulty)}>{r.difficulty || 'all'}</UBadge>
                          {r.certificate_available && <UBadge variant="success">Cert</UBadge>}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-xs font-semibold text-[#f39c12]">{r.relevance_score}</div>
                        <div className="text-[10px] text-white/30">score</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </UCard>
        </div>
      )}

      {!loading && extras.length > 0 && (
        <div>
          <button
            onClick={() => setShowOptional(p => !p)}
            className="flex items-center gap-2 text-sm font-semibold text-white/60 hover:text-white transition-colors"
          >
            <span>Optional Courses ({extras.length})</span>
            <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${showOptional ? 'rotate-180' : ''}`} viewBox="0 0 12 8" fill="none">
              <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {showOptional && (
            <UCard className="mt-3 animate-slideDown">
              <div className="flex flex-wrap gap-2">
                {extras.slice(0, 12).map(r => (
                  <div key={r.mapping_id} className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/[0.07] transition-colors">
                    <p className="text-xs font-medium">{r.title}</p>
                    <p className="text-[10px] text-white/40 mt-0.5">{r.provider_name} | Score: {r.relevance_score}</p>
                  </div>
                ))}
              </div>
            </UCard>
          )}
        </div>
      )}

      {!loading && recs.length === 0 && selectedRoleId && (
        <UCard glass>
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-[#f39c12] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <p className="text-sm text-white/60">
              No course recommendations available. Verify that course data has been imported (run <code className="text-[#14ffec]">import_course_data.py</code>).
            </p>
          </div>
        </UCard>
      )}

      {!loading && recs.length === 0 && !selectedRoleId && (
        <UCard>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-white/40 shrink-0" />
            <h4 className="font-heading font-semibold text-white/60">Quick Reference Learning Plan</h4>
          </div>
          <div className="space-y-1">
            {DOMAIN_PHASES.map(p => (
              <div key={p.phase} className="flex items-center py-3 border-b border-white/5 last:border-0">
                <div className="w-32 shrink-0 flex items-center gap-2">
                  <span className="text-sm font-medium">{p.phase}</span>
                  <UBadge variant="warning">{p.duration}</UBadge>
                </div>
                <span className="text-sm text-white/50">{p.desc}</span>
              </div>
            ))}
          </div>
        </UCard>
      )}

      {selectedRole && (
        <UCard>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-[#e94560] shrink-0" />
            <h4 className="font-heading font-semibold text-white/70">Learning Plan for {selectedRole.role_name}</h4>
          </div>
          <div className="space-y-1">
            {[
              { phase: 'Foundation', dur: '2-3 months', focus: `Core skills: ${selectedRole.required_skills.slice(0, 100)}${selectedRole.required_skills.length > 100 ? '...' : ''}` },
              { phase: 'Intermediate', dur: '3-4 months', focus: `Advanced concepts & ${selectedRole.optional_skills.slice(0, 80)}${selectedRole.optional_skills.length > 80 ? '...' : ''}` },
              { phase: 'Mastery', dur: '2-3 months', focus: 'Real-world projects & portfolio building' },
              { phase: 'Job Prep', dur: '1 month', focus: `Interview prep for ${selectedRole.role_name} roles` },
            ].map(p => (
              <div key={p.phase} className="flex items-start py-3 border-b border-white/5 last:border-0">
                <div className="w-32 shrink-0 flex items-center gap-2 pt-0.5">
                  <span className="text-sm font-medium">{p.phase}</span>
                  <UBadge variant="warning">{p.dur}</UBadge>
                </div>
                <span className="text-sm text-white/50 leading-relaxed">{p.focus}</span>
              </div>
            ))}
          </div>
        </UCard>
      )}

      {topProviders.length > 0 && (
        <div>
          <button
            onClick={() => setShowProvidersList(p => !p)}
            className="flex items-center gap-2 text-sm font-semibold text-white/60 hover:text-white transition-colors mb-3"
          >
            <span>Top-Rated Course Providers</span>
            <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${showProvidersList ? 'rotate-180' : ''}`} viewBox="0 0 12 8" fill="none">
              <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {showProvidersList && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 animate-slideDown">
              {topProviders.map(p => (
                <UCard key={p.provider_id} hover glass>
                  <p className="font-semibold text-sm">{p.provider_name}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <UProgressBar
                      variant={p.trust_score >= 80 ? 'success' : 'warning'}
                      value={p.trust_score}
                      size="sm"
                      className="flex-1"
                    />
                    <span className="text-[10px] text-white/40">{p.trust_score}</span>
                  </div>
                  <p className="text-[10px] text-white/40 mt-1">{p.provider_type}</p>
                  <div className="flex gap-1 mt-1.5 flex-wrap">
                    {p.certificate_supported && <UBadge variant="success">Cert</UBadge>}
                    {p.free_courses_available && <UBadge variant="info">Free</UBadge>}
                  </div>
                </UCard>
              ))}
            </div>
          )}
        </div>
      )}

      <UCard glass>
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-[#14ffec] shrink-0" />
          <h4 className="font-heading font-semibold text-white/70">Free Resources to Get Started</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {FREE_RESOURCES.map(link => (
            <a
              key={link.label}
              href={link.url}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-xs text-[#14ffec] hover:bg-[#14ffec]/10 hover:border-[#14ffec]/30 transition-all group"
            >
              <svg className="w-3.5 h-3.5 shrink-0 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              <span className="truncate">{link.label}</span>
            </a>
          ))}
        </div>
      </UCard>
    </div>
  )
}
