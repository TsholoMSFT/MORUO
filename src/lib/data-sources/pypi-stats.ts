/**
 * PyPI Stats Data Source
 * Free, no API key required
 * Python package download statistics
 */

import type { PackageStats, TechSentiment, DataSourceResult } from './types'
import { CACHE_DURATIONS } from './types'
import { getCacheKey, fetchWithCache } from './cache'

const PYPI_URL = 'https://pypi.org/pypi'
const PYPISTATS_URL = 'https://pypistats.org/api'

interface PyPIPackageInfo {
  info: {
    name: string
    version: string
    summary: string
    author: string
    author_email: string
    home_page: string
    project_url: string
    project_urls: Record<string, string> | null
    keywords: string
    requires_dist: string[] | null
    requires_python: string
  }
  releases: Record<string, Array<{
    upload_time: string
    upload_time_iso_8601: string
  }>>
}

interface PyPIStatsOverall {
  data: Array<{
    category: string
    date: string
    downloads: number
  }>
  package: string
  type: string
}

interface PyPIStatsRecent {
  data: {
    last_day: number
    last_month: number
    last_week: number
  }
  package: string
  type: string
}

export async function fetchPyPIPackageStats(
  packageName: string
): Promise<DataSourceResult<PackageStats>> {
  const cacheKey = getCacheKey('pypi_stats', packageName)

  try {
    const result = await fetchWithCache<PackageStats>(
      cacheKey,
      async () => {
        // Fetch package info and download stats in parallel
        const [pkgResponse, recentResponse, overallResponse] = await Promise.all([
          fetch(`${PYPI_URL}/${encodeURIComponent(packageName)}/json`),
          fetch(`${PYPISTATS_URL}/packages/${encodeURIComponent(packageName)}/recent`),
          fetch(`${PYPISTATS_URL}/packages/${encodeURIComponent(packageName)}/overall?mirrors=false`),
        ])

        if (!pkgResponse.ok) {
          throw new Error(`Package not found: ${packageName}`)
        }

        const pkgInfo: PyPIPackageInfo = await pkgResponse.json()
        const recent: PyPIStatsRecent = recentResponse.ok ? await recentResponse.json() : { data: { last_day: 0, last_month: 0, last_week: 0 } }
        const overall: PyPIStatsOverall = overallResponse.ok ? await overallResponse.json() : { data: [] }

        // Calculate trend from overall data
        const sortedData = overall.data
          .filter(d => d.category === 'without_mirrors')
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        // Get last 30 days vs previous 30 days
        const last30 = sortedData.slice(0, 30)
        const prev30 = sortedData.slice(30, 60)
        
        const last30Sum = last30.reduce((sum, d) => sum + d.downloads, 0)
        const prev30Sum = prev30.reduce((sum, d) => sum + d.downloads, 0)
        const trendPercent = prev30Sum > 0 ? ((last30Sum - prev30Sum) / prev30Sum) * 100 : 0

        // Calculate yearly downloads
        const yearlyDownloads = sortedData
          .slice(0, 365)
          .reduce((sum, d) => sum + d.downloads, 0)

        // Get release info
        const releases = Object.keys(pkgInfo.releases).sort()
        const latestVersion = pkgInfo.info.version
        const latestReleaseInfo = pkgInfo.releases[latestVersion]
        const firstReleaseDate = releases[0] && pkgInfo.releases[releases[0]]?.[0]?.upload_time

        // Extract repo URL
        const projectUrls = pkgInfo.info.project_urls || {}
        const repoUrl = projectUrls['Source'] || 
                        projectUrls['Repository'] || 
                        projectUrls['GitHub'] ||
                        pkgInfo.info.home_page ||
                        null

        // Count dependencies
        const dependencyCount = pkgInfo.info.requires_dist?.length || 0

        const stats: PackageStats = {
          name: pkgInfo.info.name,
          platform: 'pypi',
          version: latestVersion,
          downloadsLastWeek: recent.data.last_week,
          downloadsLastMonth: recent.data.last_month,
          downloadsLastYear: yearlyDownloads,
          trend: trendPercent > 5 ? 'rising' : trendPercent < -5 ? 'falling' : 'stable',
          trendPercent,
          stars: null,
          forks: null,
          openIssues: null,
          contributors: null,
          lastPublish: latestReleaseInfo?.[0]?.upload_time_iso_8601 || null,
          firstPublish: firstReleaseDate || null,
          dependencyCount,
          repositoryUrl: repoUrl,
        }

        return { data: stats, source: 'pypi-stats' as const }
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
      source: 'pypi-stats',
      timestamp: Date.now(),
      cached: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Compare multiple Python packages
 */
export async function comparePyPIPackages(
  packageNames: string[]
): Promise<Record<string, PackageStats | null>> {
  const results: Record<string, PackageStats | null> = {}

  await Promise.all(
    packageNames.map(async (name) => {
      const result = await fetchPyPIPackageStats(name)
      results[name] = result.data
    })
  )

  return results
}

/**
 * Get tech sentiment from PyPI ecosystem
 */
export async function getPyPITechSentiment(
  packages: string[]
): Promise<TechSentiment> {
  const stats = await comparePyPIPackages(packages)
  
  const validStats = Object.values(stats).filter(s => s !== null) as PackageStats[]
  
  const totalDownloads = validStats.reduce((sum, s) => sum + (s.downloadsLastMonth || 0), 0)
  const avgTrend = validStats.length > 0 
    ? validStats.reduce((sum, s) => sum + (s.trendPercent || 0), 0) / validStats.length 
    : 0

  return {
    source: 'pypi-stats',
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

/**
 * Infer technology adoption from package downloads
 */
export function inferTechnologyAdoption(
  stats: PackageStats[]
): {
  adoption: 'high' | 'medium' | 'low'
  momentum: 'growing' | 'stable' | 'declining'
  maturity: 'mature' | 'growing' | 'emerging'
} {
  const totalMonthly = stats.reduce((sum, s) => sum + (s.downloadsLastMonth || 0), 0)
  const avgTrend = stats.reduce((sum, s) => sum + (s.trendPercent || 0), 0) / stats.length

  // Adoption based on download volume
  const adoption = totalMonthly > 10_000_000 ? 'high' : totalMonthly > 1_000_000 ? 'medium' : 'low'

  // Momentum based on trend
  const momentum = avgTrend > 10 ? 'growing' : avgTrend < -5 ? 'declining' : 'stable'

  // Maturity based on first publish date
  const avgAge = stats.reduce((sum, s) => {
    if (!s.firstPublish) return sum
    const age = Date.now() - new Date(s.firstPublish).getTime()
    return sum + age / (1000 * 60 * 60 * 24 * 365) // years
  }, 0) / stats.length

  const maturity = avgAge > 5 ? 'mature' : avgAge > 2 ? 'growing' : 'emerging'

  return { adoption, momentum, maturity }
}
