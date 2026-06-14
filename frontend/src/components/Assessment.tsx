import { useState, useEffect, useMemo, useCallback } from 'react'
import { api } from '../api/client'
import { UCard, UButton, USelect, USlider, UProgressBar, UBadge, UAccordion, ULoader, USkeleton } from './ui'
import { useNotification } from '../context/NotificationContext'
import type { Role, AnalysisResult, Skill } from '../types'

const SLIDER_CONFIG = [
  { key: 'Logical', label: 'Logical Reasoning', min: 100, max: 900, default: 500 },
  { key: 'Quant', label: 'Quantitative Aptitude', min: 100, max: 900, default: 500 },
  { key: 'English', label: 'English & Communication', min: 100, max: 900, default: 500 },
  { key: 'ComputerProgramming', label: 'Programming Logic', min: 100, max: 900, default: 500 },
  { key: 'Domain', label: 'Domain Knowledge', min: 100, max: 900, default: 500 },
]

interface AssessmentProps { userId: string }

export default function Assessment({ userId }: AssessmentProps) {
  const { error: notifyError } = useNotification()
  const [roles, setRoles] = useState<Role[]>([])
  const [allSkills, setAllSkills] = useState<Skill[]>([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [scores, setScores] = useState<Record<string, number>>(
    Object.fromEntries(SLIDER_CONFIG.map(s => [s.key, s.default]))
  )
  const [selectedRoleId, setSelectedRoleId] = useState('')
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [resumeText, setResumeText] = useState('')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState('')
  const [skillSearch, setSkillSearch] = useState('')
  const [fileError, setFileError] = useState('')

  useEffect(() => {
    Promise.all([
      api.getRoles().then(setRoles).catch(() => {}),
      api.getSkills().then(setAllSkills).catch(() => {}),
    ]).finally(() => setInitialLoading(false))
  }, [])

  const selectedRole = useMemo(() => roles.find(r => r.role_id === selectedRoleId), [roles, selectedRoleId])

  const filteredSkills = useMemo(() => {
    if (!skillSearch) return allSkills
    const q = skillSearch.toLowerCase()
    return allSkills.filter(s => s.normalized_skill_name.toLowerCase().includes(q))
  }, [allSkills, skillSearch])

  const requiredSkills = useMemo(() => selectedRole?.required_skills
    ? selectedRole.required_skills.split(';').map(s => s.trim()).filter(Boolean)
    : [], [selectedRole])

  const matchedSkills = useMemo(() => requiredSkills.filter(s =>
    selectedSkills.some(sk => sk.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(sk.toLowerCase()))
  ), [requiredSkills, selectedSkills])

  const matchPct = requiredSkills.length ? Math.round((matchedSkills.length / requiredSkills.length) * 100) : 0

  const resumeScore = useMemo(() => result
    ? (result.missing_skills.length > 0
      ? Math.max(10, 100 - Math.round(result.missing_skills.length / Math.max(result.all_skills.length, 1) * 100))
      : 100)
    : 0, [result])

  const toggleSkill = useCallback((skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    )
  }, [])

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileError('')
    if (file.size > 500_000) { setFileError('File too large (max 500 KB)'); return }
    const reader = new FileReader()
    reader.onload = () => setResumeText(reader.result as string)
    reader.onerror = () => setFileError('Failed to read file')
    reader.readAsText(file)
  }, [])

  const analyze = useCallback(async () => {
    if (!selectedRole) { setError('Please select a target role'); return }
    setAnalyzing(true); setError(''); setResult(null)
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
      if (data.error) { notifyError(data.error); setAnalyzing(false); return }
      setResult(data)
    } catch {
      setError('Backend offline. Start the server with app.py first.')
    }
    setAnalyzing(false)
  }, [selectedRole, scores, selectedSkills, resumeText, userId, notifyError])

  if (initialLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <USkeleton variant="card" />
            <USkeleton variant="card" />
          </div>
          <div className="space-y-6">
            <USkeleton variant="card" />
            <USkeleton variant="card" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <section>
            <h3 className="typo-section mb-4 flex items-center gap-2">
              Enter Your Scores
            </h3>
            <UCard>
              <div className="space-y-5">
                {SLIDER_CONFIG.map(s => (
                  <USlider
                    key={s.key}
                    label={s.label}
                    min={s.min}
                    max={s.max}
                    value={scores[s.key]}
                    onChange={v => setScores(prev => ({ ...prev, [s.key]: v }))}
                    marks
                  />
                ))}
              </div>
            </UCard>
          </section>

          <section>
            <h3 className="typo-section mb-4 flex items-center gap-2">
              Target Role
            </h3>
            <USelect
              placeholder="Select a target role..."
              value={selectedRoleId}
              onChange={e => setSelectedRoleId(e.target.value)}
              options={roles.map(r => ({ value: r.role_id, label: `${r.role_name} (${r.domain})` }))}
            />
            {selectedRole && (
              <UAccordion title="Role Details" icon="chevron" className="mt-3">
                <table className="w-full text-sm">
                  <tbody>
                    <tr>
                      <td className="py-1.5 pr-4 text-white/50 w-36">Domain</td>
                      <td className="font-medium">{selectedRole.domain}</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 pr-4 text-white/50">Level</td>
                      <td className="capitalize">
                        <UBadge variant={selectedRole.level === 'advanced' ? 'danger' : selectedRole.level === 'intermediate' ? 'warning' : 'success'}>
                          {selectedRole.level}
                        </UBadge>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1.5 pr-4 text-white/50">Learning Months</td>
                      <td className="font-medium">{selectedRole.average_learning_months}</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 pr-4 text-white/50">Priority</td>
                      <td className="flex items-center gap-2">
                        <UProgressBar variant="accent" value={selectedRole.priority_score} size="sm" className="w-20" />
                        <span className="text-xs">{selectedRole.priority_score}/100</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1.5 pr-4 text-white/50">Market Demand</td>
                      <td className="flex items-center gap-2">
                        <UProgressBar variant="success" value={selectedRole.market_demand_score} size="sm" className="w-20" />
                        <span className="text-xs">{selectedRole.market_demand_score}/100</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1.5 pr-4 text-white/50 align-top pt-1.5">Required Skills</td>
                      <td className="text-xs text-white/60">{selectedRole.required_skills.replace(/;/g, ', ')}</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 pr-4 text-white/50 align-top pt-1.5">Optional Skills</td>
                      <td className="text-xs text-white/60">{selectedRole.optional_skills.replace(/;/g, ', ')}</td>
                    </tr>
                  </tbody>
                </table>
              </UAccordion>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section>
            <h3 className="typo-section mb-4 flex items-center gap-2">
              Your Skills
              {selectedSkills.length > 0 && (
                <UBadge variant="info">{selectedSkills.length} selected</UBadge>
              )}
            </h3>
            <UCard>
              <input
                type="text"
                value={skillSearch}
                onChange={e => setSkillSearch(e.target.value)}
                placeholder="Search skills..."
                className="w-full mb-3 px-3 py-2 bg-[#141416] text-white text-sm border border-white/10 rounded-lg placeholder:text-[#555] focus:outline-none focus:border-[#e94560]/50"
              />
              <div className="max-h-[260px] overflow-y-auto space-y-0.5">
                {filteredSkills.length === 0 ? (
                  <p className="text-sm text-white/30 py-4 text-center">No skills match your search</p>
                ) : (
                  filteredSkills.map(s => {
                    const active = selectedSkills.includes(s.normalized_skill_name)
                    return (
                      <button
                        key={s.normalized_skill_name}
                        onClick={() => toggleSkill(s.normalized_skill_name)}
                        className={`
                          w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-150
                          ${active
                            ? 'bg-[#e94560]/15 text-[#e94560] border border-[#e94560]/30'
                            : 'text-white/70 hover:bg-white/5 border border-transparent'
                          }
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <span>{s.normalized_skill_name}</span>
                          {active && (
                            <svg className="w-4 h-4 text-[#e94560]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </UCard>
          </section>

          <section>
            <h3 className="typo-section mb-4 flex items-center gap-2">
              Resume Upload
              {resumeText && <UBadge variant="success">Loaded</UBadge>}
            </h3>
            <UCard>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/20 rounded-xl p-6 cursor-pointer hover:border-[#e94560]/50 transition-colors group">
                <svg className="w-10 h-10 text-white/30 mb-3 group-hover:text-[#e94560]/50 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span className="text-sm text-white/40 group-hover:text-white/60 transition-colors">
                  {resumeText ? 'Change resume file' : 'Click to upload .txt or .pdf resume'}
                </span>
                <span className="text-[10px] text-white/20 mt-1">Max 500 KB</span>
                <input type="file" accept=".txt,.pdf" onChange={handleFileUpload} className="hidden" />
              </label>
              {fileError && (
                <p className="mt-2 text-xs text-[#e74c3c]">{fileError}</p>
              )}
              {resumeText && !fileError && (
                <div className="mt-3 px-3 py-2 rounded-lg bg-[#14ffec]/10 border border-[#14ffec]/30 text-[#14ffec] text-xs flex items-center gap-2 animate-fadeIn">
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <span>Loaded {resumeText.length.toLocaleString()} characters</span>
                </div>
              )}
            </UCard>
          </section>
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center gap-3">
        <UButton size="lg" className="px-12" onClick={analyze} disabled={analyzing} loading={analyzing}>
          {analyzing ? 'Analyzing...' : 'Generate Comprehensive Report'}
        </UButton>
        {error && (
          <div className="px-4 py-3 rounded-lg bg-[#e74c3c]/10 border border-[#e74c3c]/30 text-[#e74c3c] text-sm animate-fadeIn">
            {error}
          </div>
        )}
      </div>

      {analyzing && !result && (
        <div className="mt-8 flex justify-center">
          <ULoader variant="bars" size="lg" />
        </div>
      )}

      {result && (
        <div className="mt-8 space-y-6">
          <h3 className="typo-section flex items-center gap-3">
            Your Results
            <UBadge variant={result.final_readiness_score >= 75 ? 'success' : result.final_readiness_score >= 50 ? 'warning' : 'danger'}>
              {result.final_readiness_score >= 75 ? 'Highly Employable' : result.final_readiness_score >= 50 ? 'Moderately Employable' : 'Needs Development'}
            </UBadge>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-children">
            <div className={`
              rounded-xl p-6 text-center text-white transition-all duration-500
              ${result.final_readiness_score >= 75
                ? 'bg-gradient-to-br from-[#0d7377] to-[#14ffec] shadow-lg shadow-[#14ffec]/10'
                : result.final_readiness_score >= 50
                  ? 'bg-gradient-to-br from-[#f39c12] to-[#e67e22] shadow-lg shadow-[#f39c12]/10'
                  : 'bg-gradient-to-br from-[#e74c3c] to-[#c0392b] shadow-lg shadow-[#e74c3c]/10'
              }
            `}>
              <p className="text-sm font-medium mb-2 opacity-80 tracking-wide uppercase">
                Readiness Score
              </p>
              <div className="text-5xl font-bold mb-1">{result.final_readiness_score}%</div>
              <p className="text-xs opacity-70 mt-2">
                {result.is_job_ready ? 'Job Ready' : 'Keep Learning'}
              </p>
            </div>

            <UCard>
              <h4 className="text-sm font-semibold text-white/70 mb-3">Resume Analysis</h4>
              <UProgressBar variant="success" value={resumeScore} size="lg" animated />
              <div className="text-2xl font-bold text-[#14ffec] mt-2">{resumeScore}%</div>
              <div className="text-xs text-white/40 mt-1">
                Based on {result.all_skills.length} skills analyzed
              </div>
              {result.ai_role && (
                <div className="mt-3 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white/60 flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-[#e94560] shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  <span>AI Classification: <strong className="text-white/80">{result.ai_role}</strong></span>
                </div>
              )}
            </UCard>

            <UCard>
              <h4 className="text-sm font-semibold text-white/70 mb-3">Skill Match</h4>
              <UProgressBar
                variant={matchPct >= 75 ? 'success' : matchPct >= 50 ? 'warning' : 'danger'}
                value={matchPct}
                animated
              />
              <div className="text-2xl font-bold text-white mt-2">{matchPct}%</div>
              <div className="text-xs text-white/40">for {selectedRole?.role_name}</div>
              {result.missing_skills.length > 0 && (
                <UAccordion title={`Missing Skills (${result.missing_skills.length})`} className="mt-3">
                  <div className="space-y-1.5">
                    {result.missing_skills.map(s => (
                      <div key={s} className="flex items-center gap-2 py-0.5 text-[#e74c3c] text-xs">
                        <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>
                        </svg>
                        {s}
                      </div>
                    ))}
                  </div>
                </UAccordion>
              )}
            </UCard>
          </div>

          {result.remedial_roadmap.length > 0 && (
            <div className="animate-fadeIn">
              <h3 className="typo-section mb-4">Skill Gap Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <UCard>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#e74c3c]" />
                    <h4 className="text-sm font-semibold text-[#e74c3c]">Skills to Develop</h4>
                  </div>
                  <div className="space-y-2">
                    {result.missing_skills.length === 0 ? (
                      <p className="text-sm text-[#14ffec]">No missing skills detected</p>
                    ) : (
                      result.missing_skills.map(s => (
                        <div key={s} className="flex items-center gap-2 text-sm text-[#e74c3c]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#e74c3c]/50 shrink-0" />
                          {s}
                        </div>
                      ))
                    )}
                  </div>
                </UCard>
                <UCard>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#14ffec]" />
                    <h4 className="text-sm font-semibold text-[#14ffec]">Recommended Learning</h4>
                  </div>
                  <div className="space-y-3">
                    {result.remedial_roadmap.map(item => (
                      <div key={item.skill} className="p-3 rounded-lg bg-white/5 hover:bg-white/[0.07] transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{item.skill}</span>
                          <UBadge
                            variant={item.gap_amount >= 7 ? 'danger' : item.gap_amount >= 4 ? 'warning' : 'success'}
                            dot
                          >
                            Gap: {item.gap_amount}/10
                          </UBadge>
                        </div>
                        <a
                          href={item.video_link || `https://www.youtube.com/results?search_query=${encodeURIComponent(item.skill)}+course`}
                          target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-[#14ffec] hover:text-[#14ffec]/80 hover:underline mt-1"
                        >
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                          Start Learning
                        </a>
                      </div>
                    ))}
                  </div>
                </UCard>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
