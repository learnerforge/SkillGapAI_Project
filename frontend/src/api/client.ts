const BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || 'Request failed')
  }
  return res.json()
}

export interface Role {
  role_id: string
  role_name: string
  domain: string
  level: string
  priority_score: number | null
  market_demand_score: number | null
  average_learning_months: number | null
  required_skills: string | null
  optional_skills: string | null
}

export interface RoleDetail extends Role {
  required_skills_list: string[]
  optional_skills_list: string[]
}

export interface Course {
  course_id: string
  title: string
  url: string
  provider_name: string
  difficulty: string
  duration: string | null
  price_type: string | null
  certificate_available: number | null
  credential_type: string | null
  data_quality_score: number | null
  language: string | null
  category: string | null
}

export interface CourseDetail extends Course {
  skills: {
    course_skill_id: string
    course_id: string
    normalized_skill_name: string
    confidence_score: number
    extraction_method: string
  }[]
}

export interface Recommendation {
  mapping_id: string
  role_id: string
  course_id: string
  relevance_score: number
  required_or_optional: string
  title: string
  url: string
  difficulty: string
  duration: string | null
  price_type: string | null
  certificate_available: number | null
  credential_type: string | null
  data_quality_score: number | null
  provider_name: string
  language: string | null
}

export interface Provider {
  provider_id: string
  provider_name: string
  provider_type: string
  trust_score: number | null
  certificate_supported: number | null
}

export interface Skill {
  normalized_skill_name: string
  skill_type: string | null
}

export interface AnalyzeResult {
  target_role: string
  final_readiness_score: number
  is_job_ready: boolean
  missing_skills: string[]
  remedial_roadmap: {
    skill: string
    gap_amount: number
    video_link: string
    resources: { name: string; link: string; duration: string; provider: string }[]
  }[]
  all_skills: {
    skill: string
    gap_amount: number
    required: number
    actual: number
    is_missing: boolean
    status: string
    resources?: { name: string; link: string; duration: string; provider: string }[]
  }[]
  ai_role?: string
}

export interface ProgressItem {
  id: number
  user_id: string
  skill_name: string
  target_role: string
  status: string
  resource_link: string | null
  resource_name: string | null
  duration: string | null
  gap_score: number | null
  created_at: string
  completed_at: string | null
}

export interface UserProfile {
  id: number
  username: string
  email: string | null
  created_at: string
  last_login: string | null
}

export const api = {
  login: (username: string, password: string) =>
    request<{ success: boolean; user?: { id: number; username: string }; message?: string }>('/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  register: (username: string, password: string, email?: string) =>
    request<{ success: boolean; message: string }>('/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, email }),
    }),

  analyze: (data: {
    scores: Record<string, number>
    selected_skills?: string[]
    target_role?: string
    user_id?: string
    resume_text?: string
  }) =>
    request<AnalyzeResult>('/analyze', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getRoles: () => request<Role[]>('/roles'),

  getRolesByDomain: (domain: string) =>
    request<Role[]>(`/roles?domain=${encodeURIComponent(domain)}`),

  getRole: (roleId: string) => request<RoleDetail>(`/roles/${roleId}`),

  getCourses: (params?: { skill?: string; difficulty?: string; provider?: string; limit?: number; offset?: number }) => {
    const q = new URLSearchParams()
    if (params?.skill) q.set('skill', params.skill)
    if (params?.difficulty) q.set('difficulty', params.difficulty)
    if (params?.provider) q.set('provider', params.provider)
    if (params?.limit) q.set('limit', String(params.limit))
    if (params?.offset) q.set('offset', String(params.offset))
    const qs = q.toString()
    return request<Course[]>(`/courses${qs ? '?' + qs : ''}`)
  },

  getCourse: (courseId: string) => request<CourseDetail>(`/courses/${courseId}`),

  getSkills: (search?: string) =>
    request<Skill[]>(`/skills${search ? '?search=' + encodeURIComponent(search) : ''}`),

  getRecommendations: (roleId: string, limit?: number) =>
    request<Recommendation[]>(`/recommendations?role_id=${encodeURIComponent(roleId)}${limit ? '&limit=' + limit : ''}`),

  getProviders: () => request<Provider[]>('/providers'),

  getProgress: (userId: string, status?: string) =>
    request<ProgressItem[]>(`/progress?user_id=${encodeURIComponent(userId)}${status ? '&status=' + encodeURIComponent(status) : ''}`),

  updateProgress: (userId: string, skillName: string, targetRole: string, status: string) =>
    request<{ success: boolean }>('/progress/update', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, skill_name: skillName, target_role: targetRole, status }),
    }),

  getUserProfile: (username: string) => request<UserProfile>(`/user/${encodeURIComponent(username)}`),
}
