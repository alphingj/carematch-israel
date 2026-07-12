/** API Types for Admin Panel */

export interface User {
  id: string
  email: string
  name: string
  phone?: string
  role: 'resident' | 'caregiver' | 'admin'
  status: 'active' | 'inactive' | 'pending' | 'suspended'
  gender?: string
  nationality?: string
  age?: number
  languages: string[]
  driving_license: boolean
  currently_working: boolean
  work_request?: string
  work_area?: string
  onboarding_completed: boolean
  onboarding_step: number
  enabled_modules: string[]
  disabled_modules: string[]
  created_at: string
  updated_at: string
  last_login_at?: string
  email_verified_at?: string
}

export interface Job {
  id: string
  title: string
  description: string
  requirements?: string
  benefits?: string
  job_type: 'full_time' | 'part_time' | 'live_in' | 'hourly' | 'reliever'
  work_area: 'Area 1' | 'Area 2' | 'Area 3' | 'All Area'
  salary_min?: number
  salary_max?: number
  salary_currency: string
  city?: string
  address?: string
  latitude?: number
  longitude?: number
  status: 'active' | 'inactive' | 'filled' | 'expired' | 'draft'
  is_active: boolean
  featured: boolean
  owner_id: string
  owner?: User
  created_at: string
  updated_at: string
  published_at?: string
  expires_at?: string
}

export interface Module {
  name: string
  version: string
  description: string
  category: string
  author: string
  status: string
  enabled: boolean
  config: Record<string, any>
  enabled_for_users: string[]
  enabled_for_roles: string[]
  disabled_for_users: string[]
  dependencies: string[]
  required_permissions: string[]
  icon: string
  tags: string[]
  admin_only: boolean
  hidden: boolean
  health?: Record<string, any>
  error?: string
}

export interface ModuleConfig {
  enabled: boolean
  config: Record<string, any>
  enabled_for_users: string[]
  enabled_for_roles: string[]
  disabled_for_users: string[]
}

export interface AdminStats {
  total_users: number
  caregivers: number
  residents: number
  admins: number
  total_jobs: number
  active_jobs: number
  inactive_jobs: number
  modules_loaded: number
  modules_enabled: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface LoginRequest {
  email: string
  password: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

export interface HealthCheck {
  status: string
  version: string
  timestamp: string
  database: string
  modules: Record<string, any>
}