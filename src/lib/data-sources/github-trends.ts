/**
 * GitHub API Data Source
 * Free tier: 60 requests/hour unauthenticated, 5000/hour with token
 * Repository activity, stars, contributors, and trends
 */

import type { TechSentiment, DataSourceResult } from './types'
import { CACHE_DURATIONS } from './types'
import { getCacheKey, fetchWithCache } from './cache'

const GITHUB_API_URL = 'https://api.github.com'

// Optional GitHub token for higher rate limits
const GITHUB_TOKEN = typeof import.meta !== 'undefined' 
  ? (import.meta.env?.VITE_GITHUB_TOKEN || '')
  : ''

interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string
  html_url: string
  stargazers_count: number
  watchers_count: number
  forks_count: number
  open_issues_count: number
  language: string
  topics: string[]
  created_at: string
  updated_at: string
  pushed_at: string
  size: number
  default_branch: string
  license: { name: string } | null
  subscribers_count?: number
}

interface GitHubSearchResult {
  total_count: number
  incomplete_results: boolean
  items: GitHubRepo[]
}

interface GitHubContributor {
  login: string
  id: number
  contributions: number
  html_url: string
}

interface GitHubRepoStats {
  repo: GitHubRepo
  contributors: number
  commitsLastMonth: number
  isActive: boolean
}

async function fetchGitHub<T>(endpoint: string): Promise<T> {
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json',
  }

  if (GITHUB_TOKEN) {
    headers['Authorization'] = `token ${GITHUB_TOKEN}`
  }

  const response = await fetch(`${GITHUB_API_URL}${endpoint}`, { headers })
  
  if (response.status === 403) {
    throw new Error('GitHub API rate limit exceeded')
  }
  
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`)
  }

  return response.json()
}

/**
 * Get repository information
 */
export async function getRepoInfo(
  owner: string,
  repo: string
): Promise<DataSourceResult<GitHubRepoStats>> {
  const cacheKey = getCacheKey('github_repo', `${owner}/${repo}`)

  try {
    const result = await fetchWithCache<GitHubRepoStats>(
      cacheKey,
      async () => {
        const [repoData, contributors] = await Promise.all([
          fetchGitHub<GitHubRepo>(`/repos/${owner}/${repo}`),
          fetchGitHub<GitHubContributor[]>(`/repos/${owner}/${repo}/contributors?per_page=1`).catch(() => []),
        ])

        // Check activity: updated in last 3 months
        const lastUpdate = new Date(repoData.pushed_at)
        const threeMonthsAgo = new Date()
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
        const isActive = lastUpdate > threeMonthsAgo

        // Get contributor count from Link header (pagination info)
        // For now, just use what we got
        const contributorCount = contributors.length

        const stats: GitHubRepoStats = {
          repo: repoData,
          contributors: contributorCount,
          commitsLastMonth: 0, // Would need commit API
          isActive,
        }

        return { data: stats, source: 'github' as const }
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
      source: 'github',
      timestamp: Date.now(),
      cached: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Search for repositories by topic/technology
 */
export async function searchRepositories(
  query: string,
  options: {
    language?: string
    sort?: 'stars' | 'forks' | 'updated' | 'help-wanted-issues'
    order?: 'asc' | 'desc'
    perPage?: number
  } = {}
): Promise<DataSourceResult<GitHubRepo[]>> {
  const {
    language,
    sort = 'stars',
    order = 'desc',
    perPage = 10,
  } = options

  const cacheKey = getCacheKey('github_search', `${query}_${language || 'all'}_${sort}`)

  try {
    const result = await fetchWithCache<GitHubRepo[]>(
      cacheKey,
      async () => {
        let searchQuery = query
        if (language) {
          searchQuery += `+language:${language}`
        }

        const searchResult = await fetchGitHub<GitHubSearchResult>(
          `/search/repositories?q=${encodeURIComponent(searchQuery)}&sort=${sort}&order=${order}&per_page=${perPage}`
        )

        return { data: searchResult.items, source: 'github' as const }
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
      source: 'github',
      timestamp: Date.now(),
      cached: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get trending repositories for a topic
 */
export async function getTrendingRepos(
  topic: string,
  language?: string
): Promise<GitHubRepo[]> {
  // Search for recently created repos with high star counts
  const oneMonthAgo = new Date()
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
  const dateStr = oneMonthAgo.toISOString().split('T')[0]

  let query = `${topic} created:>${dateStr} stars:>100`
  if (language) {
    query += ` language:${language}`
  }

  const result = await searchRepositories(query, {
    sort: 'stars',
    order: 'desc',
    perPage: 10,
  })

  return result.data || []
}

/**
 * Analyze technology health from GitHub data
 */
export async function analyzeTechHealth(
  technology: string,
  language?: string
): Promise<TechSentiment> {
  const [popularRepos, trendingRepos] = await Promise.all([
    searchRepositories(technology, { language, sort: 'stars', perPage: 20 }),
    searchRepositories(`${technology} pushed:>${getLastMonthDate()}`, { language, sort: 'updated', perPage: 20 }),
  ])

  const popular = popularRepos.data || []
  const trending = trendingRepos.data || []

  // Calculate metrics
  const totalStars = popular.reduce((sum, r) => sum + r.stargazers_count, 0)
  const avgStars = popular.length > 0 ? totalStars / popular.length : 0
  const activeRepos = trending.length
  const avgForks = popular.reduce((sum, r) => sum + r.forks_count, 0) / (popular.length || 1)

  // Determine sentiment
  const sentiment = totalStars > 100000 && activeRepos > 10 
    ? 'positive' 
    : totalStars < 1000 || activeRepos < 3 
      ? 'negative' 
      : 'neutral'

  return {
    source: 'github',
    query: technology,
    timestamp: new Date().toISOString(),
    metrics: {
      totalStars,
      avgStars,
      avgForks,
      activeRepos,
      popularRepoCount: popular.length,
      topLanguages: [...new Set(popular.map(r => r.language).filter(Boolean))].slice(0, 5),
    },
    sentiment,
    confidence: Math.min(popular.length / 20, 1),
  }
}

/**
 * Extract repo info from package repository URL
 */
export function parseGitHubUrl(url: string | null): { owner: string; repo: string } | null {
  if (!url) return null

  const match = url.match(/github\.com[/:]([\w-]+)\/([\w.-]+)/i)
  if (match) {
    return {
      owner: match[1],
      repo: match[2].replace(/\.git$/, ''),
    }
  }

  return null
}

function getLastMonthDate(): string {
  const date = new Date()
  date.setMonth(date.getMonth() - 1)
  return date.toISOString().split('T')[0]
}
