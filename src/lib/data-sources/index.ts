/**
 * Unified Data Sources Index
 * Aggregates all data sources with fallback cascade and AI enrichment
 */

// Types
export type {
  DataSourceName,
  CompanyFinancials,
  MacroeconomicData,
  SECFiling,
  TechSentiment,
  PackageStats,
  ArxivPaper,
  TechTrendAnalysis,
  DataSourceResult,
  CacheEntry,
} from './types'

export { CACHE_DURATIONS, API_KEYS } from './types'

// Cache utilities
export {
  getFromCache,
  setCache,
  clearExpiredCache,
  clearAllCache,
  getCacheStats,
} from './cache'

// Individual data sources
export { fetchYahooFinancials } from './yahoo-finance'
export { fetchAlphaVantageFinancials } from './alpha-vantage'
export { fetchFMPFinancials, searchFMPCompanies } from './financial-modeling-prep'
export { fetchIEXFinancials } from './iex-cloud'
export { fetchEODFinancials, searchEODTickers } from './eod-historical'
export { 
  fetchFREDSeries, 
  fetchFREDIndicators, 
  fetchKeyEconomicIndicators,
  FRED_SERIES 
} from './fred'
export { 
  fetchWorldBankIndicator, 
  fetchTechIndicators,
  compareCountries,
  WORLD_BANK_INDICATORS,
  COUNTRY_CODES
} from './world-bank'
export { 
  fetchSECFilings, 
  fetchSECFinancials 
} from './sec-edgar'
export { 
  fetchNPMPackageStats, 
  compareNPMPackages,
  getNPMTechSentiment 
} from './npm-stats'
export { 
  fetchPyPIPackageStats, 
  comparePyPIPackages,
  getPyPITechSentiment,
  inferTechnologyAdoption 
} from './pypi-stats'
export { 
  searchArxivPapers, 
  searchTechPapers,
  analyzeResearchTrends,
  getLatestAIResearch,
  ARXIV_CATEGORIES 
} from './arxiv'
export { 
  getRepoInfo, 
  searchRepositories,
  getTrendingRepos,
  analyzeTechHealth,
  parseGitHubUrl 
} from './github-trends'

// Re-export unified fetcher
export { 
  fetchCompanyFinancials,
  fetchWithFallback,
  getDataSourcePriority,
  type FetchOptions 
} from './unified-fetcher'

// Re-export AI enrichment
export {
  enrichFinancialsWithAI,
  generateTechTrendAnalysis,
  type AIEnrichmentOptions
} from './ai-enrichment'

// Re-export data source service
export {
  testDataSourceConnection,
  testAllDataSources,
  getSystemHealth,
  clearDataCache,
  getDataSourceConfiguration,
  fetchWithRetry,
  instrumentedRequest,
  validateApiKey,
  getStatusMessage,
  getStatusColor,
  formatBytes,
  type ConnectionStatus,
  type DataSourceHealth,
  type SystemHealth,
  type RetryConfig,
} from './data-source-service'
