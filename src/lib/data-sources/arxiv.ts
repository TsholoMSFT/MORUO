/**
 * ArXiv Research Paper Data Source
 * Free, no API key required
 * Academic research papers for technology trend analysis
 */

import type { ArxivPaper, TechSentiment, DataSourceResult } from './types'
import { CACHE_DURATIONS } from './types'
import { getCacheKey, fetchWithCache } from './cache'

const ARXIV_API_URL = 'https://export.arxiv.org/api/query'

// ArXiv categories relevant to tech/AI/ML
export const ARXIV_CATEGORIES = {
  CS_AI: 'cs.AI',       // Artificial Intelligence
  CS_LG: 'cs.LG',       // Machine Learning
  CS_CL: 'cs.CL',       // Computation and Language (NLP)
  CS_CV: 'cs.CV',       // Computer Vision
  CS_NE: 'cs.NE',       // Neural and Evolutionary Computing
  CS_RO: 'cs.RO',       // Robotics
  CS_SE: 'cs.SE',       // Software Engineering
  CS_DB: 'cs.DB',       // Databases
  CS_DC: 'cs.DC',       // Distributed Computing
  CS_CR: 'cs.CR',       // Cryptography
  STAT_ML: 'stat.ML',   // Machine Learning (Statistics)
  ECON_GN: 'econ.GN',   // General Economics
  QFIN_GN: 'q-fin.GN',  // Quantitative Finance
} as const

interface ArxivEntry {
  id: string
  title: string
  summary: string
  published: string
  updated: string
  authors: Array<{ name: string }>
  categories: string[]
  links: Array<{ href: string; type?: string; title?: string }>
}

function parseArxivXML(xml: string): ArxivEntry[] {
  const entries: ArxivEntry[] = []
  
  // Simple XML parsing for ArXiv response
  const entryMatches = xml.match(/<entry>([\s\S]*?)<\/entry>/g) || []
  
  for (const entryXml of entryMatches) {
    const getId = (tag: string) => {
      const match = entryXml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))
      return match ? match[1].trim() : ''
    }

    const getAll = (tag: string) => {
      const matches = entryXml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'g')) || []
      return matches.map(m => {
        const inner = m.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))
        return inner ? inner[1].trim() : ''
      })
    }

    const getLinks = () => {
      const linkMatches = entryXml.match(/<link[^>]+>/g) || []
      return linkMatches.map(link => {
        const href = link.match(/href="([^"]+)"/)
        const type = link.match(/type="([^"]+)"/)
        const title = link.match(/title="([^"]+)"/)
        return {
          href: href ? href[1] : '',
          type: type ? type[1] : undefined,
          title: title ? title[1] : undefined,
        }
      })
    }

    const getCategories = () => {
      const catMatches = entryXml.match(/<category[^>]+>/g) || []
      return catMatches.map(cat => {
        const term = cat.match(/term="([^"]+)"/)
        return term ? term[1] : ''
      }).filter(Boolean)
    }

    entries.push({
      id: getId('id'),
      title: getId('title').replace(/\s+/g, ' '),
      summary: getId('summary').replace(/\s+/g, ' '),
      published: getId('published'),
      updated: getId('updated'),
      authors: getAll('name').map(name => ({ name })),
      categories: getCategories(),
      links: getLinks(),
    })
  }

  return entries
}

export async function searchArxivPapers(
  query: string,
  options: {
    category?: string
    maxResults?: number
    sortBy?: 'relevance' | 'lastUpdatedDate' | 'submittedDate'
    sortOrder?: 'ascending' | 'descending'
  } = {}
): Promise<DataSourceResult<ArxivPaper[]>> {
  const {
    category,
    maxResults = 20,
    sortBy = 'submittedDate',
    sortOrder = 'descending',
  } = options

  const cacheKey = getCacheKey('arxiv_search', `${query}_${category || 'all'}_${maxResults}`)

  try {
    const result = await fetchWithCache<ArxivPaper[]>(
      cacheKey,
      async () => {
        // Build search query
        let searchQuery = `all:${encodeURIComponent(query)}`
        if (category) {
          searchQuery = `cat:${category}+AND+${searchQuery}`
        }

        const url = `${ARXIV_API_URL}?search_query=${searchQuery}&start=0&max_results=${maxResults}&sortBy=${sortBy}&sortOrder=${sortOrder}`

        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`ArXiv API error: ${response.status}`)
        }

        const xml = await response.text()
        const entries = parseArxivXML(xml)

        const papers: ArxivPaper[] = entries.map(entry => {
          const pdfLink = entry.links.find(l => l.title === 'pdf')
          const arxivId = entry.id.split('/').pop()?.replace('abs/', '') || entry.id

          return {
            id: arxivId,
            title: entry.title,
            abstract: entry.summary,
            authors: entry.authors.map(a => a.name),
            categories: entry.categories,
            publishedDate: entry.published,
            updatedDate: entry.updated,
            pdfUrl: pdfLink?.href || `https://arxiv.org/pdf/${arxivId}.pdf`,
            arxivUrl: `https://arxiv.org/abs/${arxivId}`,
          }
        })

        return { data: papers, source: 'arxiv' as const }
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
      source: 'arxiv',
      timestamp: Date.now(),
      cached: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Search for papers by technology/topic
 */
export async function searchTechPapers(
  technology: string,
  options: { maxResults?: number } = {}
): Promise<ArxivPaper[]> {
  const result = await searchArxivPapers(technology, {
    ...options,
    sortBy: 'submittedDate',
    sortOrder: 'descending',
  })

  return result.data || []
}

/**
 * Analyze research trends for a technology
 */
export async function analyzeResearchTrends(
  technology: string
): Promise<TechSentiment> {
  const recentPapers = await searchArxivPapers(technology, {
    maxResults: 100,
    sortBy: 'submittedDate',
    sortOrder: 'descending',
  })

  const papers = recentPapers.data || []

  // Count papers by month
  const papersByMonth: Record<string, number> = {}
  papers.forEach(paper => {
    const month = paper.publishedDate.substring(0, 7) // YYYY-MM
    papersByMonth[month] = (papersByMonth[month] || 0) + 1
  })

  const months = Object.keys(papersByMonth).sort()
  const recentMonths = months.slice(-3)
  const olderMonths = months.slice(-6, -3)

  const recentCount = recentMonths.reduce((sum, m) => sum + (papersByMonth[m] || 0), 0)
  const olderCount = olderMonths.reduce((sum, m) => sum + (papersByMonth[m] || 0), 0)

  const trendPercent = olderCount > 0 ? ((recentCount - olderCount) / olderCount) * 100 : 0

  // Determine sentiment based on publication volume and trend
  const sentiment = papers.length > 50 && trendPercent > 10 
    ? 'positive' 
    : papers.length < 10 || trendPercent < -20 
      ? 'negative' 
      : 'neutral'

  return {
    source: 'arxiv',
    query: technology,
    timestamp: new Date().toISOString(),
    metrics: {
      totalPapers: papers.length,
      recentPapers: recentCount,
      trendPercent,
      topCategories: [...new Set(papers.flatMap(p => p.categories))].slice(0, 5),
    },
    sentiment,
    confidence: Math.min(papers.length / 50, 1),
  }
}

/**
 * Get latest AI/ML research papers
 */
export async function getLatestAIResearch(
  maxResults: number = 20
): Promise<ArxivPaper[]> {
  const result = await searchArxivPapers('machine learning OR artificial intelligence OR deep learning', {
    category: ARXIV_CATEGORIES.CS_AI,
    maxResults,
    sortBy: 'submittedDate',
    sortOrder: 'descending',
  })

  return result.data || []
}
