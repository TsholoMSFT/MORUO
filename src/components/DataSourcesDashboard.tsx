/**
 * Data Sources Status Dashboard
 * Displays connection status, health, and configuration for all data sources
 */

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  CloudCheck,
  CloudSlash,
  CloudWarning,
  Key,
  ArrowsClockwise,
  Trash,
  Clock,
  CheckCircle,
  Warning,
  Info,
  Database,
  Lightning,
  GlobeSimple,
} from '@phosphor-icons/react'
import {
  getSystemHealth,
  testDataSourceConnection,
  clearDataCache,
  getDataSourceConfiguration,
  getStatusMessage,
  formatBytes,
  type SystemHealth,
  type DataSourceHealth,
  type ConnectionStatus,
} from '@/lib/data-sources/data-source-service'
import type { DataSourceName } from '@/lib/data-sources/types'

export function DataSourcesDashboard() {
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [testingSource, setTestingSource] = useState<DataSourceName | null>(null)
  const [clearing, setClearing] = useState(false)
  const [config, setConfig] = useState<{
    configured: DataSourceName[]
    unconfigured: DataSourceName[]
    noKeyRequired: DataSourceName[]
  } | null>(null)

  const refreshHealth = useCallback(async () => {
    setLoading(true)
    try {
      const healthData = await getSystemHealth()
      setHealth(healthData)
      setConfig(getDataSourceConfiguration())
    } catch (error) {
      console.error('Failed to get health:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshHealth()
  }, [refreshHealth])

  const testSource = async (source: DataSourceName) => {
    setTestingSource(source)
    try {
      const result = await testDataSourceConnection(source)
      // Update health with new result
      if (health) {
        setHealth({
          ...health,
          sources: health.sources.map(s => 
            s.name === source ? result : s
          ),
        })
      }
    } finally {
      setTestingSource(null)
    }
  }

  const handleClearCache = async () => {
    setClearing(true)
    try {
      const newStats = clearDataCache()
      if (health) {
        setHealth({
          ...health,
          cacheStats: newStats,
        })
      }
    } finally {
      setClearing(false)
    }
  }

  if (loading && !health) {
    return (
      <div className="flex items-center justify-center p-12">
        <ArrowsClockwise size={32} className="animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!health) {
    return (
      <Alert>
        <Warning size={16} />
        <AlertDescription>Failed to load data source health information.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Database size={28} weight="duotone" className="text-primary" />
            Data Sources Dashboard
          </h2>
          <p className="text-muted-foreground">
            Monitor connections, health, and cache for financial data sources
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshHealth} disabled={loading}>
            <ArrowsClockwise size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleClearCache} disabled={clearing}>
            <Trash size={16} />
            Clear Cache
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      <Card className={`border-l-4 ${
        health.overall === 'connected' ? 'border-l-green-500' :
        health.overall === 'degraded' ? 'border-l-amber-500' : 'border-l-red-500'
      }`}>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <StatusIcon status={health.overall} size={32} />
              <div>
                <h3 className="font-semibold text-lg">
                  System Status: {health.overall.toUpperCase()}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {getStatusMessage(health.overall)}
                </p>
              </div>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <div>Active Source: <span className="font-mono">{health.activeSource || 'None'}</span></div>
              <div>Last Check: {new Date(health.lastFullCheck).toLocaleTimeString()}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          label="Connected"
          value={health.sources.filter(s => s.status === 'connected').length}
          total={health.sources.length}
          icon={<CloudCheck size={20} className="text-green-500" />}
        />
        <SummaryCard
          label="Degraded"
          value={health.sources.filter(s => s.status === 'degraded').length}
          total={health.sources.length}
          icon={<CloudWarning size={20} className="text-amber-500" />}
        />
        <SummaryCard
          label="Disconnected"
          value={health.sources.filter(s => s.status === 'disconnected').length}
          total={health.sources.length}
          icon={<CloudSlash size={20} className="text-red-500" />}
        />
        <SummaryCard
          label="Cache Size"
          value={formatBytes(health.cacheStats.totalSize)}
          subValue={`${health.cacheStats.entries} entries`}
          icon={<Database size={20} className="text-primary" />}
        />
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="sources" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sources">Data Sources</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="fallback">Fallback Chain</TabsTrigger>
        </TabsList>

        <TabsContent value="sources" className="mt-4 space-y-3">
          {health.sources.map((source) => (
            <SourceCard
              key={source.name}
              source={source}
              onTest={() => testSource(source.name)}
              testing={testingSource === source.name}
            />
          ))}
        </TabsContent>

        <TabsContent value="configuration" className="mt-4 space-y-4">
          {config && (
            <>
              {/* No Key Required */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <GlobeSimple size={20} className="text-green-500" />
                    Free APIs (No Key Required)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {config.noKeyRequired.map(source => (
                      <Badge key={source} variant="outline" className="bg-green-500/10">
                        {source}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Configured */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Key size={20} className="text-primary" />
                    Configured APIs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {config.configured.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {config.configured.map(source => (
                        <Badge key={source} variant="default">
                          {source}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No premium APIs configured</p>
                  )}
                </CardContent>
              </Card>

              {/* Unconfigured */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Warning size={20} className="text-amber-500" />
                    Unconfigured APIs (Optional)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {config.unconfigured.map(source => (
                      <div key={source} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="font-mono text-sm">{source}</span>
                        <span className="text-xs text-muted-foreground">
                          Add <code>VITE_{source.toUpperCase().replace(/-/g, '_')}_API_KEY</code> to .env
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Setup Instructions */}
              <Alert>
                <Info size={16} />
                <AlertDescription>
                  To configure additional data sources, create a <code>.env.local</code> file in the project root with your API keys.
                  The system will automatically use fallback sources if premium APIs are not configured.
                </AlertDescription>
              </Alert>
            </>
          )}
        </TabsContent>

        <TabsContent value="fallback" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Automatic Fallback Chain</CardTitle>
              <CardDescription>
                When fetching financial data, sources are tried in priority order until one succeeds
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {health.fallbackChain.map((source, index) => {
                  const sourceHealth = health.sources.find(s => s.name === source)
                  return (
                    <div
                      key={source}
                      className="flex items-center gap-3 p-3 bg-muted rounded-lg"
                    >
                      <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <span className="font-medium">{sourceHealth?.displayName || source}</span>
                      </div>
                      <StatusBadge status={sourceHealth?.status || 'unknown'} />
                      {index < health.fallbackChain.length - 1 && (
                        <span className="text-muted-foreground">→</span>
                      )}
                    </div>
                  )
                })}
              </div>

              <Alert className="mt-4">
                <Lightning size={16} />
                <AlertDescription>
                  {health.activeSource ? (
                    <>Currently using <strong>{health.activeSource}</strong> as the primary data source.</>
                  ) : (
                    <>No active data source. Check your network connection and API keys.</>
                  )}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface SourceCardProps {
  source: DataSourceHealth
  onTest: () => void
  testing: boolean
}

function SourceCard({ source, onTest, testing }: SourceCardProps) {
  return (
    <Card className={`border-l-4 ${
      source.status === 'connected' ? 'border-l-green-500' :
      source.status === 'degraded' ? 'border-l-amber-500' :
      source.status === 'disconnected' ? 'border-l-red-500' : 'border-l-gray-400'
    }`}>
      <CardContent className="py-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <StatusIcon status={source.status} size={24} />
            <div>
              <h3 className="font-semibold">{source.displayName}</h3>
              <p className="text-sm text-muted-foreground font-mono">{source.name}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {source.features.map((feature, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="text-right">
            <StatusBadge status={source.status} />
            {source.responseTime !== null && (
              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1 justify-end">
                <Clock size={12} />
                {source.responseTime}ms
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={onTest}
              disabled={testing}
            >
              {testing ? (
                <ArrowsClockwise size={14} className="animate-spin" />
              ) : (
                'Test'
              )}
            </Button>
          </div>
        </div>
        {source.errorMessage && (
          <div className="mt-3 text-sm text-red-500 bg-red-500/10 p-2 rounded">
            {source.errorMessage}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function StatusIcon({ status, size = 20 }: { status: ConnectionStatus; size?: number }) {
  switch (status) {
    case 'connected':
      return <CloudCheck size={size} weight="fill" className="text-green-500" />
    case 'degraded':
      return <CloudWarning size={size} weight="fill" className="text-amber-500" />
    case 'disconnected':
      return <CloudSlash size={size} weight="fill" className="text-red-500" />
    case 'no-key':
      return <Key size={size} className="text-gray-400" />
    default:
      return <Info size={size} className="text-gray-500" />
  }
}

function StatusBadge({ status }: { status: ConnectionStatus }) {
  const variants: Record<ConnectionStatus, 'default' | 'destructive' | 'secondary' | 'outline'> = {
    'connected': 'default',
    'degraded': 'secondary',
    'disconnected': 'destructive',
    'no-key': 'outline',
    'unknown': 'outline',
  }

  return (
    <Badge variant={variants[status]} className="uppercase text-xs">
      {status.replace('-', ' ')}
    </Badge>
  )
}

interface SummaryCardProps {
  label: string
  value: number | string
  total?: number
  subValue?: string
  icon: React.ReactNode
}

function SummaryCard({ label, value, total, subValue, icon }: SummaryCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1">
              {value}
              {total !== undefined && (
                <span className="text-base font-normal text-muted-foreground">/{total}</span>
              )}
            </p>
            {subValue && (
              <p className="text-xs text-muted-foreground mt-1">{subValue}</p>
            )}
          </div>
          <div className="p-2 bg-primary/10 rounded-full">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
