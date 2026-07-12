import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { getAuth } from 'firebase/auth'
import { 
  User, 
  Job, 
  Module, 
  AdminStats, 
  HealthCheck,
  TokenResponse,
  LoginRequest
} from '../types/api'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

// Request interceptor to attach Firebase ID token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const auth = getAuth()
    const user = auth.currentUser
    if (user) {
      try {
        const token = await user.getIdToken(true) // Force refresh
        config.headers.Authorization = `Bearer ${token}`
      } catch (error) {
        console.error('Failed to get ID token:', error)
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - Firebase will handle refresh
      // Redirect to login if needed
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  verifyToken: async (): Promise<User> => {
    const response = await api.post('/auth/verify-token')
    return response.data
  },

  getMe: async (): Promise<User> => {
    const response = await api.get('/auth/me')
    return response.data
  },

  syncProfile: async (): Promise<User> => {
    const response = await api.post('/auth/sync-profile')
    return response.data
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout/all')
  },
}

// Users API
export const usersApi = {
  list: async (params?: {
    page?: number
    page_size?: number
    search?: string
    role?: string
    status?: string
  }): Promise<{ items: User[]; total: number }> => {
    const response = await api.get('/users', { params })
    return response.data
  },

  get: async (id: string): Promise<User> => {
    const response = await api.get(`/users/${id}`)
    return response.data
  },

  update: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await api.patch(`/users/${id}`, data)
    return response.data
  },

  updateRole: async (id: string, role: string): Promise<User> => {
    const response = await api.patch(`/users/${id}/role`, { role })
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`)
  },

  getModules: async (id: string): Promise<any[]> => {
    const response = await api.get(`/users/${id}/modules`)
    return response.data
  },

  enableModule: async (userId: string, moduleName: string): Promise<void> => {
    await api.post(`/users/${userId}/modules/${moduleName}/enable`)
  },

  disableModule: async (userId: string, moduleName: string): Promise<void> => {
    await api.post(`/users/${userId}/modules/${moduleName}/disable`)
  },

  getStats: async (): Promise<AdminStats> => {
    const response = await api.get('/admin/stats')
    return response.data
  },
}

// Jobs API
export const jobsApi = {
  list: async (params?: {
    page?: number
    page_size?: number
    search?: string
    area?: string
    job_type?: string
    status?: string
    is_active?: boolean
  }): Promise<{ items: Job[]; total: number }> => {
    const response = await api.get('/jobs', { params })
    return response.data
  },

  get: async (id: string): Promise<Job> => {
    const response = await api.get(`/jobs/${id}`)
    return response.data
  },

  create: async (data: Partial<Job>): Promise<Job> => {
    const response = await api.post('/jobs', data)
    return response.data
  },

  update: async (id: string, data: Partial<Job>): Promise<Job> => {
    const response = await api.patch(`/jobs/${id}`, data)
    return response.data
  },

  publish: async (id: string): Promise<Job> => {
    const response = await api.patch(`/jobs/${id}/publish`)
    return response.data
  },

  unpublish: async (id: string): Promise<Job> => {
    const response = await api.patch(`/jobs/${id}/unpublish`)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/jobs/${id}`)
  },

  getStats: async (): Promise<any> => {
    const response = await api.get('/jobs/stats')
    return response.data
  },
}

// Modules API
export const modulesApi = {
  list: async (params?: {
    category?: string
    include_hidden?: boolean
  }): Promise<Module[]> => {
    const response = await api.get('/modules', { params })
    return response.data
  },

  get: async (name: string): Promise<Module> => {
    const response = await api.get(`/modules/${name}`)
    return response.data
  },

  enable: async (name: string, userIds?: string[], roles?: string[]): Promise<void> => {
    await api.post(`/modules/${name}/enable`, { user_ids: userIds, roles })
  },

  disable: async (name: string, userIds?: string[], roles?: string[]): Promise<void> => {
    await api.post(`/modules/${name}/disable`, { user_ids: userIds, roles })
  },

  enableForUser: async (moduleName: string, userId: string): Promise<void> => {
    await api.post(`/modules/${moduleName}/users/${userId}/enable`)
  },

  disableForUser: async (moduleName: string, userId: string): Promise<void> => {
    await api.post(`/modules/${moduleName}/users/${userId}/disable`)
  },

  enableForRole: async (moduleName: string, role: string): Promise<void> => {
    await api.post(`/modules/${moduleName}/roles/${role}/enable`)
  },

  disableForRole: async (moduleName: string, role: string): Promise<void> => {
    await api.post(`/modules/${moduleName}/roles/${role}/disable`)
  },

  updateConfig: async (name: string, config: Record<string, any>): Promise<void> => {
    await api.patch(`/modules/${name}/config`, { config })
  },

  healthCheck: async (name: string): Promise<any> => {
    const response = await api.get(`/modules/${name}/health`)
    return response.data
  },

  healthCheckAll: async (): Promise<any> => {
    const response = await api.get('/modules/health/all')
    return response.data
  },

  reload: async (name: string): Promise<void> => {
    await api.post(`/modules/${name}/reload`)
  },

  discoverNew: async (): Promise<string[]> => {
    const response = await api.get('/modules/discover/new')
    return response.data
  },
}

// Admin API
export const adminApi = {
  getStats: async (): Promise<AdminStats> => {
    const response = await api.get('/admin/stats')
    return response.data
  },

  listUsers: async (params?: {
    page?: number
    page_size?: number
    search?: string
    role?: string
    status?: string
  }): Promise<{ items: User[]; total: number }> => {
    const response = await api.get('/admin/users', { params })
    return response.data
  },

  listJobs: async (params?: {
    page?: number
    page_size?: number
    status?: string
    is_active?: boolean
  }): Promise<{ items: Job[]; total: number }> => {
    const response = await api.get('/admin/jobs', { params })
    return response.data
  },

  getAuditLogs: async (params?: {
    page?: number
    page_size?: number
    user_id?: string
    action?: string
    resource_type?: string
  }): Promise<any> => {
    const response = await api.get('/admin/audit-logs', { params })
    return response.data
  },

  getSystemConfig: async (): Promise<any> => {
    const response = await api.get('/admin/system/config')
    return response.data
  },

  setSystemConfig: async (key: string, value: any, description?: string, isPublic?: boolean): Promise<any> => {
    const response = await api.post('/admin/system/config', { key, value, description, is_public: isPublic })
    return response.data
  },

  deleteSystemConfig: async (key: string): Promise<void> => {
    await api.delete(`/admin/system/config/${key}`)
  },
}

// Health API
export const healthApi = {
  check: async (): Promise<HealthCheck> => {
    const response = await api.get('/health')
    return response.data
  },

  readiness: async (): Promise<{ status: string }> => {
    const response = await api.get('/health/ready')
    return response.data
  },

  liveness: async (): Promise<{ status: string }> => {
    const response = await api.get('/health/live')
    return response.data
  },
}

export default api