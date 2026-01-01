export const REGIONS = {
  'Global': 'Worldwide corporate umbrella across all regions',
  'MEA (Middle East & Africa)': 'Includes markets such as South Africa, MEA MCC, MEA HQ, UAE, Qatar, Saudi, Kuwait, and others',
  'North Europe': 'Includes UK & Ireland, Nordics, Benelux, and broader northern European markets',
  'South Europe': 'Includes Italy, Spain, Portugal (South MCC), Greece, and Israel (remapped under South Europe in FY26)',
  'Americas': 'Includes United States, Canada, and Latin America (Brazil, Mexico, Chile, Colombia, etc.)',
} as const

export type RegionKey = keyof typeof REGIONS

export const REGION_OPTIONS: RegionKey[] = [
  'Global',
  'MEA (Middle East & Africa)',
  'North Europe',
  'South Europe',
  'Americas',
]

export const SUB_REGIONS: Record<RegionKey, string[]> = {
  'Global': ['Corporate HQ'],
  'MEA (Middle East & Africa)': [
    'South Africa',
    'MEA MCC',
    'MEA HQ',
    'UAE',
    'Qatar',
    'Saudi Arabia',
    'Kuwait',
    'East Africa',
    'West Africa',
  ],
  'North Europe': [
    'UK & Ireland',
    'Nordics',
    'Benelux',
    'Northern Europe MCC',
  ],
  'South Europe': [
    'Italy',
    'Spain',
    'Portugal (South MCC)',
    'Greece',
    'Israel',
  ],
  'Americas': [
    'United States',
    'Canada',
    'Brazil',
    'Mexico',
    'Chile',
    'Colombia',
    'Latin America',
  ],
}

export const SUBSIDIARIES: Record<RegionKey, string[]> = {
  'Global': ['Global Corp'],
  'MEA (Middle East & Africa)': [
    'South Africa Subsidiary',
    'UAE Subsidiary',
    'Qatar Subsidiary',
    'Saudi Arabia Subsidiary',
    'Kuwait Subsidiary',
    'Kenya Subsidiary',
    'Nigeria Subsidiary',
  ],
  'North Europe': [
    'UK Subsidiary',
    'Ireland Subsidiary',
    'Sweden Subsidiary',
    'Norway Subsidiary',
    'Denmark Subsidiary',
    'Netherlands Subsidiary',
    'Belgium Subsidiary',
  ],
  'South Europe': [
    'Italy Subsidiary',
    'Spain Subsidiary',
    'Portugal Subsidiary',
    'Greece Subsidiary',
    'Israel Subsidiary',
  ],
  'Americas': [
    'USA Subsidiary',
    'Canada Subsidiary',
    'Brazil Subsidiary',
    'Mexico Subsidiary',
    'Chile Subsidiary',
    'Colombia Subsidiary',
  ],
}

export function getSubRegionsForRegion(region: string): string[] {
  return SUB_REGIONS[region as RegionKey] || []
}

export function getSubsidiariesForRegion(region: string): string[] {
  return SUBSIDIARIES[region as RegionKey] || []
}

export function getRegionDescription(region: string): string {
  return REGIONS[region as RegionKey] || ''
}
