import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Search, 
  Filter, 
  Loader2, 
  Check, 
  X,
  RotateCcw,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  ExternalLink
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select'
import { modulesApi } from '../lib/api'
import { Module } from '../types/api'
import { cn, formatDate, getModuleStatusColor } from '../lib/utils'

const categoryOptions = [
  { value: 'core', label: 'Core' },
  { value: 'jobs', label: 'Jobs' },
  { value: 'users', label: 'Users' },
  { value: 'admin', label: 'Admin' },
  { value: 'notifications', label: 'Notifications' },
  { value: 'reporting', label: 'Reporting' },
  { value: 'integrations', label: 'Integrations' },
  { value: 'caregiver_tools', label: 'Caregiver Tools' },
  { value: 'resident_tools', label: 'Resident Tools' },
  { value: 'custom', label: 'Custom' },
]

export function Modules() {
  const queryClient = useQueryClient()
  const [categoryFilter, setCategoryFilter] = useState('')
  const [includeHidden, setIncludeHidden] = useState(false)
  const [selectedModule, setSelectedModule] = useState<Module | null>(null)
  const [showConfig, setShowConfig] = useState(false)
  const [newConfig, setNewConfig] = useState<Record<string, any>>({})

  const { data: modules, isLoading, error, refetch } = useQuery({
    queryKey: ['modules', categoryFilter, includeHidden],
    queryFn: () => modulesApi.list({ category: categoryFilter, include_hidden: includeHidden }),
  })

  const enableMutation = useMutation({
    mutationFn: ({ name, userIds, roles }: { name: string; userIds?: string[]; roles?: string[] }) => 
      modulesApi.enable(name, userIds, roles),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['modules'] }),
  })

  const disableMutation = useMutation({
    mutationFn: ({ name, userIds, roles }: { name: string; userIds?: string[]; roles?: string[] }) => 
      modulesApi.disable(name, userIds, roles),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['modules'] }),
  })

  const reloadMutation = useMutation({
    mutationFn: (name: string) => modulesApi.reload(name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['modules'] }),
  })

  const healthMutation = useMutation({
    mutationFn: (name: string) => modulesApi.healthCheck(name),
  })

  const configMutation = useMutation({
    mutationFn: ({ name, config }: { name: string; config: Record<string, any> }) => 
      modulesApi.updateConfig(name, config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] })
      setShowConfig(false)
      setSelectedModule(null)
    },
  })

  const handleEnable = (name: string) => {
    enableMutation.mutate({ name })
  }

  const handleDisable = (name: string) => {
    disableMutation.mutate({ name })
  }

  const handleReload = (name: string) => {
    reloadMutation.mutate(name)
  }

  const handleHealthCheck = async (name: string) => {
    try {
      const health = await healthMutation.mutateAsync(name)
      alert(`Health check for ${name}: ${health.status}\n${JSON.stringify(health.details || {}, null, 2)}`)
    } catch (err) {
      alert('Health check failed')
    }
  }

  const handleConfigClick = (module: Module) => {
    setSelectedModule(module)
    setNewConfig({ ...module.config })
    setShowConfig(true)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Modules</h1>
        </div>
        <div className="animate-pulse space-y-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-1/4" />
                    <div className="h-3 bg-slate-200 rounded w-1/6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Modules</h1>
          <p className="text-slate-500 mt-1">Manage platform modules and their configurations</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={includeHidden}
              onChange={(e) => setIncludeHidden(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            Show hidden
          </label>
        </div>
      </div>

      {/* Category Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            {categoryOptions.map((cat) => (
              <Button
                key={cat.value}
                variant={categoryFilter === cat.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCategoryFilter(categoryFilter === cat.value ? '' : cat.value)}
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules?.map((module) => (
          <ModuleCard
            key={module.name}
            module={module}
            onEnable={handleEnable}
            onDisable={handleDisable}
            onReload={handleReload}
            onHealthCheck={handleHealthCheck}
            onConfig={handleConfigClick}
            isEnabling={enableMutation.isPending && enableMutation.variables?.name === module.name}
            isDisabling={disableMutation.isPending && disableMutation.variables?.name === module.name}
            isReloading={reloadMutation.isPending && reloadMutation.variables === module.name}
          />
        ))}

        {modules?.length === 0 && (
          <div className="col-span-full text-center py-12">
            <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No modules found</p>
          </div>
        )}
      </div>

      {/* Module Config Modal */}
      {showConfig && selectedModule && (
        <ModuleConfigModal
          module={selectedModule}
          config={newConfig}
          onConfigChange={setNewConfig}
          onSave={() => configMutation.mutate({ name: selectedModule!.name, config: newConfig })}
          onClose={() => { setShowConfig(false); setSelectedModule(null); }}
          isSaving={configMutation.isPending}
        />
      )}
    </div>
  )
}

function ModuleCard({ 
  module, 
  onEnable, 
  onDisable, 
  onReload, 
  onHealthCheck, 
  onConfig,
  isEnabling,
  isDisabling,
  isReloading,
}: { 
  module: Module
  onEnable: (name: string) => void
  onDisable: (name: string) => void
  onReload: (name: string) => void
  onHealthCheck: (name: string) => void
  onConfig: (module: Module) => void
  isEnabling: boolean
  isDisabling: boolean
  isReloading: boolean
}) {
  const statusColor = getModuleStatusColor(module.status)
  const isEnabled = module.enabled

  return (
    <Card className="overflow-hidden">
      <div className={cn('h-2', isEnabled ? 'bg-green-500' : 'bg-slate-200')} />
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <ExternalLink className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{module.name}</h3>
              <p className="text-sm text-slate-500">{module.version}</p>
            </div>
          </div>
          <span className={cn('px-2 py-1 rounded-full text-xs font-medium', statusColor)}>
            {module.status}
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-slate-600 mb-4 line-clamp-2">{module.description}</p>

        {/* Meta */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs">
            {module.category}
          </span>
          {module.tags.map((tag) => (
            <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
              {tag}
            </span>
          ))}
          {module.admin_only && (
            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
              Admin Only
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-200">
          {isEnabled ? (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => onDisable(module.name)}
              disabled={isDisabling}
            >
              {isDisabling ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Disable'}
            </Button>
          ) : (
            <Button 
              size="sm" 
              className="flex-1"
              onClick={() => onEnable(module.name)}
              disabled={isEnabling}
            >
              {isEnabling ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enable'}
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onReload(module.name)}
            disabled={isReloading}
            title="Reload"
          >
            {isReloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onHealthCheck(module.name)}
            title="Health Check"
          >
            {module.health?.status === 'healthy' ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : module.health?.status === 'unhealthy' ? (
              <AlertCircle className="w-4 h-4 text-red-500" />
            ) : (
              <HelpCircle className="w-4 h-4 text-slate-400" />
            )}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onConfig(module)}
            title="Configure"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>

        {/* Error */}
        {module.error && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {module.error}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ModuleConfigModal({ 
  module, 
  config, 
  onConfigChange, 
  onSave, 
  onClose, 
  isSaving 
}: { 
  module: Module
  config: Record<string, any>
  onConfigChange: (config: Record<string, any>) => void
  onSave: () => void
  onClose: () => void
  isSaving: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Configure {module.name}</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {Object.entries(module.config_schema?.properties || {}).map(([key, schema]: [string, any]) => (
            <div key={key}>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {key}
                {schema.description && (
                  <span className="text-slate-400 ml-1 text-xs">({schema.description})</span>
                )}
              </label>
              {schema.type === 'boolean' ? (
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config[key] || false}
                    onChange={(e) => onConfigChange({ ...config, [key]: e.target.checked })}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-600">Enabled</span>
                </label>
              ) : schema.type === 'number' ? (
                <input
                  type="number"
                  value={config[key] || ''}
                  onChange={(e) => onConfigChange({ ...config, [key]: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              ) : schema.type === 'array' ? (
                <textarea
                  value={JSON.stringify(config[key] || [], null, 2)}
                  onChange={(e) => {
                    try {
                      onConfigChange({ ...config, [key]: JSON.parse(e.target.value) })
                    } catch {
                      // Invalid JSON
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="JSON array"
                />
              ) : (
                <input
                  type="text"
                  value={config[key] || ''}
                  onChange={(e) => onConfigChange({ ...config, [key]: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
          ))}
          
          <div className="pt-4 flex justify-end gap-3 border-t border-slate-200">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={onSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Save Configuration'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}