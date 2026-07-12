import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Users, 
  Briefcase, 
  Shield, 
  BarChart, 
  Settings, 
  FileText,
  Loader2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select'
import { adminApi } from '../lib/api'
import { AdminStats, User } from '../types/api'
import { cn, formatDate } from '../lib/utils'

export function Admin() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'jobs' | 'audit' | 'system'>('overview')

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: adminApi.getStats,
  })

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => adminApi.getUsers({ page: 1, page_size: 20 }),
  })

  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['adminJobs'],
    queryFn: () => adminApi.getJobs({ page: 1, page_size: 20 }),
  })

  const { data: auditLogs } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: () => adminApi.getAuditLogs({ page: 1, page_size: 50 }),
  })

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'jobs', label: 'Jobs', icon: Briefcase },
    { id: 'audit', label: 'Audit Logs', icon: FileText },
    { id: 'system', label: 'System', icon: Settings },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>
          <p className="text-slate-500 mt-1">System administration and monitoring</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-1 px-1" aria-label="Admin tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors',
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab stats={stats} loading={statsLoading} />
      )}
      {activeTab === 'users' && (
        <UsersTab users={users?.items || []} loading={usersLoading} total={users?.total || 0} />
      )}
      {activeTab === 'jobs' && (
        <JobsTab jobs={jobs?.items || []} loading={jobsLoading} total={jobs?.total || 0} />
      )}
      {activeTab === 'audit' && (
        <AuditTab logs={auditLogs?.items || []} />
      )}
      {activeTab === 'system' && (
        <SystemTab />
      )}
    </div>
  )
}

function OverviewTab({ stats, loading }: { stats?: AdminStats; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}><CardContent className="py-6 animate-pulse"><div className="h-8 bg-slate-200 rounded w-1/2" /></CardContent></Card>
        ))}
      </div>
    )
  }

  const statItems = [
    { label: 'Total Users', value: stats?.total_users || 0, icon: Users, color: 'bg-blue-500' },
    { label: 'Caregivers', value: stats?.caregivers || 0, icon: Users, color: 'bg-green-500' },
    { label: 'Residents', value: stats?.residents || 0, icon: Users, color: 'bg-orange-500' },
    { label: 'Admins', value: stats?.admins || 0, icon: Shield, color: 'bg-purple-500' },
    { label: 'Total Jobs', value: stats?.total_jobs || 0, icon: Briefcase, color: 'bg-indigo-500' },
    { label: 'Active Jobs', value: stats?.active_jobs || 0, icon: Briefcase, color: 'bg-teal-500' },
    { label: 'Modules Loaded', value: stats?.modules_loaded || 0, icon: Shield, color: 'bg-pink-500' },
    { label: 'Modules Enabled', value: stats?.modules_enabled || 0, icon: Shield, color: 'bg-emerald-500' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</p>
                </div>
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', stat.color)}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function UsersTab({ users, loading, total }: { users: User[]; loading: boolean; total: number }) {
  if (loading) {
    return <div className="animate-pulse space-y-4">{[...Array(5)].map((_, i) => <Card key={i}><CardContent className="py-4"><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-slate-200" /><div className="flex-1 space-y-2"><div className="h-4 bg-slate-200 rounded w-1/4" /><div className="h-3 bg-slate-200 rounded w-1/6" /></div></div></CardContent></Card>)}</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{total} users total</p>
      </div>
      <Card>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Joined</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{user.name}</p>
                          <p className="text-sm text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={cn('inline-flex px-2 py-1 rounded-full text-xs font-medium', 
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'caregiver' ? 'bg-blue-100 text-blue-800' :
                        'bg-orange-100 text-orange-800')}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={cn('inline-flex px-2 py-1 rounded-full text-xs font-medium',
                        user.status === 'active' ? 'bg-green-100 text-green-800' :
                        user.status === 'inactive' ? 'bg-slate-100 text-slate-800' :
                        user.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800')}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-500">{formatDate(user.created_at)}</td>
                    <td className="px-4 py-4 text-right">
                      <Button variant="ghost" size="sm">Edit</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function JobsTab({ jobs, loading, total }: { jobs: any[]; loading: boolean; total: number }) {
  if (loading) {
    return <div className="animate-pulse space-y-4">{[...Array(5)].map((_, i) => <Card key={i}><CardContent className="py-4"><div className="h-4 bg-slate-200 rounded w-3/4" /></CardContent></Card>)}</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{total} jobs total</p>
      </div>
      <Card>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Job</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Area</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Posted</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4">
                      <p className="font-medium text-slate-900">{job.title}</p>
                      <p className="text-sm text-slate-500">Owner: {job.owner?.name || 'Unknown'}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">{job.job_type}</td>
                    <td className="px-4 py-4 text-sm text-slate-600">{job.work_area}</td>
                    <td className="px-4 py-4">
                      <span className={cn('inline-flex px-2 py-1 rounded-full text-xs font-medium',
                        job.is_active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800')}>
                        {job.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-500">{formatDate(job.created_at)}</td>
                    <td className="px-4 py-4 text-right">
                      <Button variant="ghost" size="sm">View</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function AuditTab({ logs }: { logs: any[] }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Resource</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Details</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-500 font-mono">{formatDate(log.created_at)}</td>
                    <td className="px-4 py-3 text-sm text-slate-900">{log.user_id || 'System'}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-700">{log.action}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{log.resource_type}</td>
                    <td className="px-4 py-3 text-sm text-slate-500 max-w-xs truncate">{JSON.stringify(log.details)}</td>
                    <td className="px-4 py-3 text-sm text-slate-500 font-mono">{log.ip_address || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SystemTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm font-medium text-slate-500">Environment</p>
              <p className="text-lg font-semibold text-slate-900 mt-1">Development</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm font-medium text-slate-500">API Version</p>
              <p className="text-lg font-semibold text-slate-900 mt-1">1.0.0</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm font-medium text-slate-500">Database</p>
              <p className="text-lg font-semibold text-slate-900 mt-1">SQLite</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm font-medium text-slate-500">Modules</p>
              <p className="text-lg font-semibold text-slate-900 mt-1">8 Loaded</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Maintenance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button variant="outline">Clear Cache</Button>
            <Button variant="outline">Rebuild Search Index</Button>
            <Button variant="destructive">Enable Maintenance Mode</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}