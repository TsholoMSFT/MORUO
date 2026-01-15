/**
 * NPM Registry Stats Data Source
 * Free, no API key required
 * Package download statistics and metadata
 */

import type { PackageStats, TechSentiment, DataSourceResult } from './types'
import { CACHE_DURATIONS } from './types'
import { getCacheKey, fetchWithCache } from './cache'

const NPM_REGISTRY_URL = 'https://registry.npmjs.org'
const NPM_DOWNLOADS_URL = 'https://api.npmjs.org/downloads'

interface NPMPackageInfo {
  name: string
  description: string
  'dist-tags': { latest: string }
  time: Record<string, string>
  maintainers: Array<{ name: string; email: string }>
  repository?: { type: string; url: string }
  keywords?: string[]
  versions: Record<string, {
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
  }>
}

interface NPMDownloadsPoint {
  downloads: number
  start: string
  end: string
  package: string
}

interface NPMDownloadsRange {
  downloads: Array<{ day: string; downloads: number }>
  start: string
  end: string
  package: string
}

export async function fetchNPMPackageStats(
  packageName: string
): Promise<DataSourceResult<PackageStats>> {
  const cacheKey = getCacheKey('npm_stats', packageName)

  try {
    const result = await fetchWithCache<PackageStats>(
      cacheKey,
      async () => {
        // Fetch package info and download stats in parallel
        const [pkgResponse, lastMonthResponse, lastWeekResponse, lastYearResponse] = await Promise.all([
          fetch(`${NPM_REGISTRY_URL}/${encodeURIComponent(packageName)}`),
          fetch(`${NPM_DOWNLOADS_URL}/point/last-month/${encodeURIComponent(packageName)}`),
          fetch(`${NPM_DOWNLOADS_URL}/point/last-week/${encodeURIComponent(packageName)}`),
          fetch(`${NPM_DOWNLOADS_URL}/range/last-year/${encodeURIComponent(packageName)}`),
        ])

        if (!pkgResponse.ok) {
          throw new Error(`Package not found: ${packageName}`)
        }

        const pkgInfo: NPMPackageInfo = await pkgResponse.json()
        const lastMonth: NPMDownloadsPoint = lastMonthResponse.ok ? await lastMonthResponse.json() : { downloads: 0 }
        const lastWeek: NPMDownloadsPoint = lastWeekResponse.ok ? await lastWeekResponse.json() : { downloads: 0 }
        const lastYear: NPMDownloadsRange = lastYearResponse.ok ? await lastYearResponse.json() : { downloads: [] }

        // Calculate trend (compare recent weeks)
        const yearlyDownloads = lastYear.downloads || []
        const totalYearly = yearlyDownloads.reduce((sum, d) => sum + d.downloads, 0)
        
        // Compare last 30 days to previous 30 days
        const recent30Days = yearlyDownloads.slice(-30)
        const prev30Days = yearlyDownloads.slice(-60, -30)
        const recentSum = recent30Days.reduce((sum, d) => sum + d.downloads, 0)
        const prevSum = prev30Days.reduce((sum, d) => sum + d.downloads, 0)
        const trendPercent = prevSum > 0 ? ((recentSum - prevSum) / prevSum) * 100 : 0

        // Get version info
        const latestVersion = pkgInfo['dist-tags'].latest
        const latestVersionInfo = pkgInfo.versions[latestVersion]
        const dependencyCount = Object.keys(latestVersionInfo?.dependencies || {}).length

        // Extract repo info
        let repoUrl = pkgInfo.repository?.url || null
        if (repoUrl) {
          repoUrl = repoUrl.replace(/^git\+/, '').replace(/\.git$/, '')
        }

        const stats: PackageStats = {
          name: pkgInfo.name,
          platform: 'npm',
          version: latestVersion,
          downloadsLastWeek: lastWeek.downloads,
          downloadsLastMonth: lastMonth.downloads,
          downloadsLastYear: totalYearly,
          trend: trendPercent > 5 ? 'rising' : trendPercent < -5 ? 'falling' : 'stable',
          trendPercent,
          stars: null, // NPM doesn't have stars, need GitHub for that
          forks: null,
          openIssues: null,
          contributors: pkgInfo.maintainers?.length || null,
          lastPublish: pkgInfo.time[latestVersion] || null,
          firstPublish: pkgInfo.time.created || null,
          dependencyCount,
          repositoryUrl: repoUrl,
        }

        return { data: stats, source: 'npm-stats' as const }
      },
      CACHE_DURATIONS.techStats
    )

    return {
      data: result.data,
      source: result.source,
      timestamp: Date.now(),
      cached: result.cached,
    }
  } catch (error) {
    return {
      data: null,
      source: 'npm-stats',
      timestamp: Date.now(),
      cached: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get stats for multiple packages (useful for comparing technologies)
 */
export async function compareNPMPackages(
  packageNames: string[]
): Promise<Record<string, PackageStats | null>> {
  const results: Record<string, PackageStats | null> = {}

  await Promise.all(
    packageNames.map(async (name) => {
      const result = await fetchNPMPackageStats(name)
      results[name] = result.data
    })
  )

  return results
}

/**
 * Get tech sentiment from NPM ecosystem
 */
export async function getNPMTechSentiment(
  packages: string[]
): Promise<TechSentiment> {
  const stats = await compareNPMPackages(packages)
  
  const validStats = Object.values(stats).filter(s => s !== null) as PackageStats[]
  
  const totalDownloads = validStats.reduce((sum, s) => sum + (s.downloadsLastMonth || 0), 0)
  const avgTrend = validStats.length > 0 
    ? validStats.reduce((sum, s) => sum + (s.trendPercent || 0), 0) / validStats.length 
    : 0

  return {
    source: 'npm-stats',
    query: packages.join(', '),
    timestamp: new Date().toISOString(),
    metrics: {
      totalDownloads,
      packageCount: validStats.length,
      avgTrendPercent: avgTrend,
    },
    sentiment: avgTrend > 10 ? 'positive' : avgTrend < -10 ? 'negative' : 'neutral',
    confidence: Math.min(validStats.length / packages.length, 1),
  }
}
