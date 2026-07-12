import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  Users, 
  Briefcase, 
  Shield, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { adminApi } from '../lib/api'
import { AdminStats } from '../types/api'
import { cn, formatDate, formatRelativeTime } from '../lib/utils'

export function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: adminApi.getStats,
  })

  const statsCards = [
    {
      title: 'Total Users',
      value: stats?.total_users || 0,
      change: '+12%',
      changeType: 'increase',
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      title: 'Active Jobs',
      value: stats?.active_jobs || 0,
      change: '+5%',
      changeType: 'increase',
      icon: Briefcase,
      color: 'bg-green-500',
    },
    {
      title: 'Caregivers',
      value: stats?.caregivers || 0,
      change: '+8%',
      changeType: 'increase',
      icon: Users,
      color: 'bg-orange-500',
    },
    {
      title: 'Modules Enabled',
      value: stats?.modules_enabled || 0,
      change: '0%',
      changeType: 'neutral',
      icon: Shield,
      color: 'bg-purple-500',
    },
  ]

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><CardContent className="py-6 animate-pulse"><div className="h-8 bg-slate-200 rounded w-1/2" /><div className="h-4 bg-slate-200 rounded w-1/4 mt-4" /></CardContent></Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Overview of your platform</p>
        </div>
        <div className="text-sm text-slate-500">
          Last updated: {formatRelativeTime(new Date())}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{stat.value.toLocaleString()}</p>
                  <div className="flex items-center gap-1 mt-2">
                    {stat.changeType === 'increase' ? (
                      <ArrowUpRight className="w-4 h-4 text-green-500" />
                    ) : stat.changeType === 'decrease' ? (
                      <ArrowDownRight className="w-4 h-4 text-red-500" />
                    ) : (
                      <span className="w-4 h-4 text-slate-400">—</span>
                    )}
                    <span className={cn('text-sm font-medium', 
                      stat.changeType === 'increase' ? 'text-green-600' :
                      stat.changeType === 'decrease' ? 'text-red-600' :
                      'text-slate-500'
                    )}>
                      {stat.change}
                    </span>
                    <span className="text-sm text-slate-400">vs last month</span>
                  </div>
                </div>
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', stat.color)}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-20 flex flex-col items-center gap-2">
                <Users className="w-6 h-6" />
                <span className="text-sm">Add User</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center gap-2">
                <Briefcase className="w-6 h-6" />
                <span className="text-sm">Post Job</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center gap-2">
                <Shield className="w-6 h-6" />
                <span className="text-sm">Manage Modules</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center gap-2">
                <TrendingUp className="w-6 h-6" />
                <span className="text-sm">View Reports</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
            <Button variant="ghost" size="sm">View All</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ActivityItem 
                icon="UserPlus"
                title="New user registered"
                description="Sarah Johnson joined as Caregiver"
                time="2 min ago"
                color="text-blue-600"
              />
              <ActivityItem 
                icon="Briefcase"
                title="New job posted"
                description="Senior Caregiver - Area 2"
                time="15 min ago"
                color="text-green-600"
              />
              <ActivityItem 
                icon="Shield"
                title="Module enabled"
                description="Notifications module enabled globally"
                time="1 hour ago"
                color="text-purple-600"
              />
              <ActivityItem 
                icon="UserCheck"
                title="User role changed"
                description="Michael Chen promoted to Admin"
                time="3 hours ago"
                color="text-orange-600"
              />
              <ActivityItem 
                icon="Settings"
                title="System config updated"
                description="Email notifications settings modified"
                time="5 hours ago"
                color="text-slate-600"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ActivityItem({ 
  icon, 
  title, 
  description, 
  time, 
  color 
}: { 
  icon: string
  title: string
  description: string
  time: string
  color: string
}) {
  const icons: Record<string, React.ReactNode> = {
    UserPlus: <Users className="w-5 h-5" />,
    Briefcase: <Briefcase className="w-5 h-5" />,
    Shield: <Shield className="w-5 h-5" />,
    UserCheck: <Shield className="w-5 h-5" />,
    Settings: <TrendingUp className="w-5 h-5" />,
  }

  return (
    <div className="flex items-start gap-3">
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', `${color} bg-opacity-10`)}>
        {icons[icon]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900">{title}</p>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      <span className="text-xs text-slate-400 whitespace-nowrap">{time}</span>
    </div>
  )
}