import { useState, useEffect, useCallback } from 'react'
import { api, type Course, type Role, type Recommendation, type Skill } from '../api/client'
import Select from './Select'

const DIFFICULTY_OPTIONS = [
  { value: '', label: 'Any' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

export default function LearningPath() {
  const [roles, setRoles] = useState<Role[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [searchSkill, setSearchSkill] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [view, setView] = useState<'browse' | 'recommend'>('recommend')
  const [loading, setLoading] = useState(true)
  const [courseLoading, setCourseLoading] = useState(false)

  useEffect(() => {
    Promise.all([
      api.getRoles().catch(() => [] as Role[]),
      api.getSkills().catch(() => [] as Skill[]),
    ])
      .then(([r, s]) => {
        setRoles(r)
        setSkills(s)
      })
      .finally(() => setLoading(false))
  }, [])

  const fetchCourses = useCallback(async (skill?: string, diff?: string) => {
    setCourseLoading(true)
    try {
      const result = await api.getCourses({ skill: skill || undefined, difficulty: diff || undefined })
      setCourses(result)
    } catch {
      setCourses([])
    }
    setCourseLoading(false)
  }, [])

  const fetchRecommendations = useCallback(async (roleId: string) => {
    setCourseLoading(true)
    try {
      const result = await api.getRecommendations(roleId)
      setRecommendations(result)
    } catch {
      setRecommendations([])
    }
    setCourseLoading(false)
  }, [])

  const handleRoleChange = (roleId: string) => {
    setSelectedRole(roleId)
    if (roleId) {
      setView('recommend')
      fetchRecommendations(roleId)
    }
  }

  const handleSearch = () => {
    setView('browse')
    fetchCourses(searchSkill, difficulty)
  }

  type DisplayCourse = {
    course_id: string
    title: string
    url: string
    provider_name: string
    difficulty: string
    duration: string | null
    price_type: string | null
    certificate_available: number | null
    data_quality_score: number | null
    relevance_score: number | undefined
  }

  const displayCourses: DisplayCourse[] = view === 'recommend'
    ? recommendations.map(r => ({
        course_id: r.course_id,
        title: r.title,
        url: r.url,
        provider_name: r.provider_name,
        difficulty: r.difficulty,
        duration: r.duration,
        price_type: r.price_type,
        certificate_available: r.certificate_available,
        data_quality_score: r.data_quality_score,
        relevance_score: r.relevance_score,
      }))
    : courses.map(c => ({
        course_id: c.course_id,
        title: c.title,
        url: c.url,
        provider_name: c.provider_name,
        difficulty: c.difficulty,
        duration: c.duration,
        price_type: c.price_type,
        certificate_available: c.certificate_available,
        data_quality_score: c.data_quality_score,
        relevance_score: undefined,
      }))

  return (
    <div className="page">
      <div className="page-header animate-fade-in">
        <h2 className="page-title">Learning Path</h2>
        <p className="page-subtitle">Discover curated courses across 34 providers</p>
      </div>

      <div className="card animate-slide-up stagger-1">
        <h3 className="card-title">Recommendations by Role</h3>
        <div className="form-group">
          <label className="form-label">Select a role</label>
          <Select
            options={roles.map(r => ({ value: r.role_id, label: `${r.role_name} (${r.domain})` }))}
            value={selectedRole}
            onChange={handleRoleChange}
            placeholder="Select a role"
            loading={loading}
          />
        </div>
      </div>

      <div className="card animate-slide-up stagger-2">
        <h3 className="card-title">Browse Courses</h3>
        <div className="course-search-row">
          <div style={{ flex: 1 }}>
            <label className="form-label">Skill</label>
            <input
              className="form-input"
              list="skill-suggestions"
              placeholder="e.g. Python, SQL, Machine Learning..."
              value={searchSkill}
              onChange={e => setSearchSkill(e.target.value)}
            />
            <datalist id="skill-suggestions">
              {skills.slice(0, 20).map(s => (
                <option key={s.normalized_skill_name} value={s.normalized_skill_name} />
              ))}
            </datalist>
          </div>
          <div style={{ minWidth: 140 }}>
            <label className="form-label">Difficulty</label>
            <Select
              options={DIFFICULTY_OPTIONS}
              value={difficulty}
              onChange={setDifficulty}
              placeholder="Any"
            />
          </div>
          <div className="course-search-btn-wrapper">
            <button className="btn btn-primary" onClick={handleSearch} disabled={courseLoading}>
              {courseLoading ? <><span className="spinner" /> Search</> : 'Search'}
            </button>
          </div>
        </div>
      </div>

      {courseLoading ? (
        <div className="loader-center"><div className="loading-dots"><span /><span /><span /></div></div>
      ) : (
        <>
          {view === 'recommend' && selectedRole && recommendations.length === 0 && (
            <div className="card animate-fade-in">
              <p className="empty-state">No recommendations found for this role.</p>
            </div>
          )}
          {view === 'browse' && courses.length === 0 && (
            <div className="card animate-fade-in">
              <p className="empty-state">Search for a skill to find courses.</p>
            </div>
          )}
          <div className="course-grid">
            {displayCourses.map((c, i) => (
              <a
                key={c.course_id + i}
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className="course-card animate-slide-up"
                style={{ animationDelay: `${i * 0.04}s`, textDecoration: 'none' }}
              >
                <div className="course-card-top">
                  <div className="course-title">{c.title}</div>
                  <div className="course-provider">{c.provider_name}</div>
                </div>
                <div className="course-card-meta">
                  <span className={`course-diff diff-${c.difficulty?.toLowerCase() || 'unknown'}`}>
                    {c.difficulty || 'N/A'}
                  </span>
                  {c.duration && <span className="course-duration">{c.duration}</span>}
                  {c.certificate_available ? <span className="cert-badge small">Cert</span> : null}
                </div>
                <div className="course-card-footer">
                  {c.data_quality_score != null && (
                    <span className="course-quality">Quality: {c.data_quality_score.toFixed(1)}</span>
                  )}
                  {'relevance_score' in c && c.relevance_score != null && (
                    <span className="course-relevance">
                      Match: {typeof c.relevance_score === 'number' ? c.relevance_score.toFixed(0) : c.relevance_score}%
                    </span>
                  )}
                </div>
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
