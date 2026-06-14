export interface Role {
  role_id: string
  role_name: string
  role_slug: string
  domain: string
  subdomain: string
  level: string
  description: string
  required_skills: string
  optional_skills: string
  tools: string
  average_learning_months: number
  priority_score: number
  market_demand_score: number
  required_skills_list?: string[]
  optional_skills_list?: string[]
}

export interface Provider {
  provider_id: string
  provider_name: string
  provider_type: string
  country: string
  trust_score: number
  priority_level: string
  free_courses_available: boolean
  paid_courses_available: boolean
  certificate_supported: boolean
  badge_supported: boolean
  website_url: string
}

export interface Course {
  course_id: string
  title: string
  url: string
  provider_name: string
  difficulty: string
  duration: string
  price_type: string
  certificate_available: boolean
  credential_type: string
  data_quality_score: number
  language: string
  category: string
  skills?: CourseSkill[]
}

export interface CourseSkill {
  course_skill_id: string
  course_id: string
  skill_name: string
  normalized_skill_name: string
  skill_type: string
  confidence_score: number
}

export interface Recommendation {
  mapping_id: string
  role_id: string
  course_id: string
  provider_name: string
  relevance_score: number
  required_or_optional: string
  title: string
  url: string
  difficulty: string
  duration: string
  price_type: string
  certificate_available: boolean
  credential_type: string
  data_quality_score: number
  language: string
  skill_match_score: number
  title_match_score: number
  provider_trust_score: number
}

export interface Skill {
  normalized_skill_name: string
  skill_type: string
}

export interface AnalysisResult {
  target_role: string
  final_readiness_score: number
  is_job_ready: boolean
  missing_skills: string[]
  remedial_roadmap: RemedialItem[]
  all_skills: SkillData[]
  ai_role?: string
  error?: string
}

export interface RemedialItem {
  skill: string
  gap_amount: number
  video_link?: string
  resources?: { name: string; link: string; duration: string; provider: string }[]
}

export interface SkillData {
  skill: string
  gap_amount: number
  required: number
  actual: number
  is_missing: boolean
  status: string
  resources?: { name: string; link: string; duration: string; provider: string }[]
}

export interface User {
  id: number
  username: string
  email: string
}

export interface AuthResponse {
  success: boolean
  message: string
  user?: User
}
