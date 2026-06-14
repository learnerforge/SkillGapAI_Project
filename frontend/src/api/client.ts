const API_BASE = '/api'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

export const api = {
  getRoles: (domain?: string) =>
    request<import('../types').Role[]>(`/roles${domain ? `?domain=${domain}` : ''}`),

  getRole: (id: string) =>
    request<import('../types').Role>(`/roles/${id}`),

  getCourses: (params?: { skill?: string; difficulty?: string; provider?: string; limit?: number }) => {
    const q = new URLSearchParams()
    if (params?.skill) q.set('skill', params.skill)
    if (params?.difficulty) q.set('difficulty', params.difficulty)
    if (params?.provider) q.set('provider', params.provider)
    if (params?.limit) q.set('limit', String(params.limit))
    return request<import('../types').Course[]>(`/courses?${q}`)
  },

  getCourse: (id: string) =>
    request<import('../types').Course>(`/courses/${id}`),

  getSkills: (search?: string) =>
    request<import('../types').Skill[]>(`/skills${search ? `?search=${search}` : ''}`),

  getRecommendations: (roleId: string, limit = 20) =>
    request<import('../types').Recommendation[]>(`/recommendations?role_id=${roleId}&limit=${limit}`),

  getProviders: () =>
    request<import('../types').Provider[]>('/providers'),

  analyze: (payload: {
    target_role: string
    scores: Record<string, number>
    selected_skills: string[]
    resume_text?: string
    user_id?: string
  }) =>
    request<import('../types').AnalysisResult>('/analyze', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
}
