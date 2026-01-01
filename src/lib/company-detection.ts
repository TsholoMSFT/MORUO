import type { Industry } from './types'

/**
 * Auto-detect company type from name
 * Checks for common indicators of private companies
 * Priority: Manual flag > Auto-detection
 */
export function detectCompanyType(
  companyName: string,
  manualFlag?: boolean
): 'public' | 'private' {
  // If manual flag is explicitly set, use it
  if (manualFlag !== undefined) {
    return manualFlag ? 'private' : 'public'
  }

  // Auto-detection based on company name patterns
  const name = companyName.toLowerCase().trim()
  
  // Private company indicators
  const privateIndicators = [
    'llc',
    'l.l.c',
    'limited liability',
    'private',
    'pvt',
    'family',
    'partners',
    'partnership',
    '& associates',
    '& co',
    'holdings',
    'venture',
    'startup',
  ]
  
  // Public company indicators (less reliable, so we're more conservative)
  const publicIndicators = [
    'inc.',
    'incorporated',
    'corporation',
    'corp.',
    'plc',
    'public limited',
    'ag', // German public companies
    'sa', // European public companies
    'nv', // Dutch public companies
  ]
  
  // Check for private indicators first
  for (const indicator of privateIndicators) {
    if (name.includes(indicator)) {
      return 'private'
    }
  }
  
  // Check for public indicators
  for (const indicator of publicIndicators) {
    if (name.includes(indicator)) {
      return 'public'
    }
  }
  
  // Default to private if uncertain (safer assumption)
  // Most companies are private, better to default to industry averages
  return 'private'
}

/**
 * Attempt to guess ticker symbol from company name
 * This is a heuristic approach and may not always be accurate
 */
export function guessTickerFromName(companyName: string): string | null {
  const name = companyName.toLowerCase().trim()
  
  // Common large companies - hardcoded mapping
  const knownCompanies: Record<string, string> = {
    'microsoft': 'MSFT',
    'apple': 'AAPL',
    'amazon': 'AMZN',
    'google': 'GOOGL',
    'alphabet': 'GOOGL',
    'meta': 'META',
    'facebook': 'META',
    'tesla': 'TSLA',
    'netflix': 'NFLX',
    'nvidia': 'NVDA',
    'adobe': 'ADBE',
    'salesforce': 'CRM',
    'oracle': 'ORCL',
    'ibm': 'IBM',
    'intel': 'INTC',
    'cisco': 'CSCO',
    'walmart': 'WMT',
    'target': 'TGT',
    'costco': 'COST',
    'home depot': 'HD',
    'jpmorgan': 'JPM',
    'bank of america': 'BAC',
    'wells fargo': 'WFC',
    'goldman sachs': 'GS',
    'morgan stanley': 'MS',
    'citigroup': 'C',
    'visa': 'V',
    'mastercard': 'MA',
    'american express': 'AXP',
    'paypal': 'PYPL',
    'boeing': 'BA',
    'ge': 'GE',
    'general electric': 'GE',
    'ford': 'F',
    'gm': 'GM',
    'general motors': 'GM',
    'toyota': 'TM',
    'volkswagen': 'VWAGY',
    'bmw': 'BMWYY',
    'mercedes': 'DDAIF',
    'exxon': 'XOM',
    'chevron': 'CVX',
    'shell': 'SHEL',
    'bp': 'BP',
    'pfizer': 'PFE',
    'johnson & johnson': 'JNJ',
    'merck': 'MRK',
    'abbott': 'ABT',
    'bristol myers': 'BMY',
    'coca cola': 'KO',
    'pepsi': 'PEP',
    'procter & gamble': 'PG',
    'nike': 'NKE',
    'starbucks': 'SBUX',
    'mcdonald': 'MCD',
    'disney': 'DIS',
    'comcast': 'CMCSA',
    'verizon': 'VZ',
    'at&t': 'T',
    'deutsche bank': 'DB',
    'barclays': 'BCS',
    'hsbc': 'HSBC',
    'standard chartered': 'SCBFF',
    'santander': 'SAN',
    'bnp paribas': 'BNPQY',
    'credit suisse': 'CS',
    'ubs': 'UBS',
  }
  
  // Check for exact matches or partial matches
  for (const [company, ticker] of Object.entries(knownCompanies)) {
    if (name.includes(company)) {
      return ticker
    }
  }
  
  // No match found
  return null
}

/**
 * Validate if a ticker symbol is likely valid
 * Basic format checking
 */
export function isValidTickerFormat(ticker: string): boolean {
  if (!ticker || ticker.trim().length === 0) {
    return false
  }
  
  const cleaned = ticker.trim().toUpperCase()
  
  // Most tickers are 1-5 characters, some special ones up to 10
  if (cleaned.length < 1 || cleaned.length > 10) {
    return false
  }
  
  // Should only contain letters, numbers, dots, or hyphens
  const validPattern = /^[A-Z0-9.-]+$/
  return validPattern.test(cleaned)
}

/**
 * Suggest industry based on company name keywords
 */
export function suggestIndustryFromName(companyName: string): Industry | null {
  const name = companyName.toLowerCase().trim()
  
  // Technology keywords
  const techKeywords = [
    'tech', 'software', 'cloud', 'data', 'ai', 'cyber', 'digital',
    'analytics', 'saas', 'platform', 'systems', 'computing', 'internet',
    'electronics', 'semiconductor', 'IT', 'information technology'
  ]
  
  // Banking keywords
  const bankingKeywords = [
    'bank', 'financial', 'capital', 'credit', 'insurance', 'asset management',
    'investment', 'securities', 'wealth', 'finance', 'fund', 'trust'
  ]
  
  // Retail keywords
  const retailKeywords = [
    'retail', 'store', 'shop', 'mart', 'market', 'supermarket', 'grocery',
    'fashion', 'apparel', 'clothing', 'consumer', 'department store'
  ]
  
  // Manufacturing keywords
  const manufacturingKeywords = [
    'manufacturing', 'industrial', 'factory', 'production', 'automotive',
    'aerospace', 'machinery', 'equipment', 'materials', 'construction',
    'engineering', 'chemical', 'pharmaceutical', 'steel', 'metals'
  ]
  
  // Check each industry
  if (techKeywords.some(keyword => name.includes(keyword))) {
    return 'technology'
  }
  
  if (bankingKeywords.some(keyword => name.includes(keyword))) {
    return 'banking'
  }
  
  if (retailKeywords.some(keyword => name.includes(keyword))) {
    return 'retail'
  }
  
  if (manufacturingKeywords.some(keyword => name.includes(keyword))) {
    return 'manufacturing'
  }
  
  return null // Unable to determine
}

/**
 * Get company information suggestions
 * Combines multiple detection methods
 */
export interface CompanySuggestions {
  isPrivate: boolean
  suggestedTicker: string | null
  suggestedIndustry: Industry | null
  confidence: 'high' | 'medium' | 'low'
}

export function getCompanySuggestions(
  companyName: string,
  manualPrivateFlag?: boolean
): CompanySuggestions {
  const companyType = detectCompanyType(companyName, manualPrivateFlag)
  const suggestedTicker = guessTickerFromName(companyName)
  const suggestedIndustry = suggestIndustryFromName(companyName)
  
  // Determine confidence level
  let confidence: 'high' | 'medium' | 'low' = 'low'
  
  if (manualPrivateFlag !== undefined) {
    confidence = 'high' // User provided explicit flag
  } else if (suggestedTicker) {
    confidence = 'high' // We found a known company
  } else if (companyType === 'private' && suggestedIndustry) {
    confidence = 'medium' // Detected as private with industry
  }
  
  return {
    isPrivate: companyType === 'private',
    suggestedTicker: suggestedTicker,
    suggestedIndustry: suggestedIndustry,
    confidence: confidence,
  }
}
