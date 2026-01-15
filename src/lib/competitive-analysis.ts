/**
 * Competitive Analysis Module
 * Tools and data for competitive deal scenarios
 */

export interface Competitor {
  id: string
  name: string
  category: 'cloud' | 'productivity' | 'security' | 'data' | 'ai' | 'crm' | 'erp'
  strengths: string[]
  weaknesses: string[]
  typicalPricing: string
  marketPosition: string
}

export interface CompetitorComparison {
  competitorId: string
  competitorName: string
  category: string
  differentiators: ComparisonPoint[]
  migrationComplexity: 'low' | 'medium' | 'high'
  switchingCosts: string
  riskFactors: string[]
  winStrategies: string[]
}

export interface ComparisonPoint {
  feature: string
  microsoft: FeatureRating
  competitor: FeatureRating
  importance: 'critical' | 'high' | 'medium' | 'low'
  notes?: string
}

export interface FeatureRating {
  score: 1 | 2 | 3 | 4 | 5
  details: string
}

export interface CompetitiveIntelligence {
  industry: string
  commonCompetitors: string[]
  marketTrends: string[]
  microsoftAdvantages: string[]
  typicalObjections: ObjectionResponse[]
}

export interface ObjectionResponse {
  objection: string
  response: string
  proofPoints: string[]
}

/**
 * Known competitors by category
 */
export const COMPETITORS: Record<string, Competitor> = {
  aws: {
    id: 'aws',
    name: 'Amazon Web Services (AWS)',
    category: 'cloud',
    strengths: [
      'Market leader with largest ecosystem',
      'Extensive service catalog',
      'Strong developer community',
      'Mature tooling and documentation',
    ],
    weaknesses: [
      'Complex pricing models',
      'Less integrated productivity suite',
      'Weaker enterprise sales relationships',
      'No native Copilot/AI assistant integration',
    ],
    typicalPricing: 'Pay-as-you-go with volume discounts',
    marketPosition: 'Market leader in IaaS, strong in startups and digital natives',
  },
  gcp: {
    id: 'gcp',
    name: 'Google Cloud Platform (GCP)',
    category: 'cloud',
    strengths: [
      'Strong AI/ML capabilities',
      'Data analytics leadership (BigQuery)',
      'Kubernetes expertise (GKE)',
      'Competitive pricing',
    ],
    weaknesses: [
      'Smaller enterprise presence',
      'Fewer hybrid/on-prem options',
      'Less comprehensive security portfolio',
      'Limited productivity suite integration for enterprises',
    ],
    typicalPricing: 'Aggressive discounting, sustained use discounts',
    marketPosition: 'Third in market share, strong in data-intensive workloads',
  },
  salesforce: {
    id: 'salesforce',
    name: 'Salesforce',
    category: 'crm',
    strengths: [
      'CRM market leader',
      'Strong AppExchange ecosystem',
      'Industry-specific solutions',
      'Extensive ISV partnerships',
    ],
    weaknesses: [
      'High total cost of ownership',
      'Complex implementation',
      'Limited non-CRM capabilities',
      'Fragmented product portfolio (acquisitions)',
    ],
    typicalPricing: 'Per-user subscription, expensive add-ons',
    marketPosition: 'CRM leader with expanding platform ambitions',
  },
  google_workspace: {
    id: 'google_workspace',
    name: 'Google Workspace',
    category: 'productivity',
    strengths: [
      'Cloud-native architecture',
      'Strong collaboration features',
      'Competitive pricing',
      'Integration with Google services',
    ],
    weaknesses: [
      'Limited enterprise security features',
      'Weaker desktop application experience',
      'Less comprehensive compliance certifications',
      'Limited offline capabilities',
    ],
    typicalPricing: 'Per-user, tiered plans',
    marketPosition: 'Strong in SMB and education, growing enterprise',
  },
  slack: {
    id: 'slack',
    name: 'Slack',
    category: 'productivity',
    strengths: [
      'Best-in-class user experience',
      'Strong developer/tech company presence',
      'Extensive app integrations',
      'Channel-based communication model',
    ],
    weaknesses: [
      'Limited to messaging (no broader productivity)',
      'Now owned by Salesforce (integration concerns)',
      'Higher per-user costs for enterprises',
      'No native video meetings or calling',
    ],
    typicalPricing: 'Per-user subscription',
    marketPosition: 'Messaging-focused, strong in tech sector',
  },
  snowflake: {
    id: 'snowflake',
    name: 'Snowflake',
    category: 'data',
    strengths: [
      'Multi-cloud data warehouse',
      'Separation of storage and compute',
      'Strong data sharing capabilities',
      'Simple pricing model',
    ],
    weaknesses: [
      'Can become expensive at scale',
      'Limited real-time streaming',
      'No broader platform play',
      'Vendor lock-in concerns',
    ],
    typicalPricing: 'Consumption-based (compute + storage)',
    marketPosition: 'Data warehouse leader, growing data platform',
  },
  databricks: {
    id: 'databricks',
    name: 'Databricks',
    category: 'data',
    strengths: [
      'Unified analytics platform',
      'Strong Apache Spark foundation',
      'Lakehouse architecture',
      'ML/AI capabilities',
    ],
    weaknesses: [
      'Complex for non-data engineers',
      'Compute costs can escalate',
      'Less mature BI tooling',
      'Requires data engineering expertise',
    ],
    typicalPricing: 'Consumption-based DBUs',
    marketPosition: 'Leading in data engineering and ML platforms',
  },
  sap: {
    id: 'sap',
    name: 'SAP',
    category: 'erp',
    strengths: [
      'ERP market leader',
      'Deep industry expertise',
      'Comprehensive business processes',
      'Strong in manufacturing and supply chain',
    ],
    weaknesses: [
      'Complex and expensive implementations',
      'Legacy architecture concerns',
      'Slow innovation cycle',
      'Challenging migration to S/4HANA',
    ],
    typicalPricing: 'Named user licensing, maintenance fees',
    marketPosition: 'ERP leader, but facing cloud transformation challenges',
  },
  oracle: {
    id: 'oracle',
    name: 'Oracle',
    category: 'erp',
    strengths: [
      'Strong database technology',
      'Comprehensive cloud applications',
      'Autonomous database capabilities',
      'Strong in financial services',
    ],
    weaknesses: [
      'Aggressive licensing practices',
      'Complex product portfolio',
      'Smaller cloud market share',
      'Customer relationship challenges',
    ],
    typicalPricing: 'Named user and processor licensing',
    marketPosition: 'Database and ERP, growing cloud infrastructure',
  },
  crowdstrike: {
    id: 'crowdstrike',
    name: 'CrowdStrike',
    category: 'security',
    strengths: [
      'Best-in-class endpoint protection',
      'Cloud-native architecture',
      'Strong threat intelligence',
      'Fast deployment',
    ],
    weaknesses: [
      'Point solution (not a platform)',
      'Premium pricing',
      'Limited identity/email security',
      'No productivity integration',
    ],
    typicalPricing: 'Per-endpoint subscription',
    marketPosition: 'Endpoint security leader',
  },
  servicenow: {
    id: 'servicenow',
    name: 'ServiceNow',
    category: 'productivity',
    strengths: [
      'IT service management leader',
      'Strong workflow automation',
      'Growing platform capabilities',
      'Good enterprise adoption',
    ],
    weaknesses: [
      'Expensive enterprise agreements',
      'Implementation complexity',
      'Limited AI capabilities vs Copilot',
      'Siloed from productivity tools',
    ],
    typicalPricing: 'Subscription per user/instance',
    marketPosition: 'ITSM leader expanding to enterprise workflows',
  },
}

/**
 * Microsoft competitive advantages by category
 */
export const MICROSOFT_ADVANTAGES: Record<string, string[]> = {
  cloud: [
    'Hybrid cloud leadership with Azure Arc',
    'Integrated security across cloud and endpoints',
    'Enterprise relationship and support infrastructure',
    'Azure OpenAI and Copilot integration',
    'Comprehensive compliance certifications',
    'Windows Server and SQL Server migration paths',
  ],
  productivity: [
    'Unified Microsoft 365 platform',
    'Copilot across all applications',
    'Teams as collaboration hub',
    'Deep SharePoint/OneDrive integration',
    'Advanced security and compliance built-in',
    'Offline and desktop application support',
  ],
  security: [
    'Microsoft Defender XDR unified platform',
    'Entra ID for identity and access',
    'Purview for data governance',
    'Sentinel cloud-native SIEM',
    'Integrated across Microsoft 365 and Azure',
    'AI-powered threat detection',
  ],
  data: [
    'Microsoft Fabric unified analytics',
    'Azure Synapse integration',
    'Power BI for visualization',
    'Seamless Microsoft 365 data access',
    'Copilot for analytics',
    'Enterprise security and governance',
  ],
  ai: [
    'Azure OpenAI Service (exclusive GPT-4 partnership)',
    'Copilot across Microsoft 365',
    'Responsible AI framework',
    'Enterprise data protection',
    'Custom AI model deployment',
    'Cognitive Services breadth',
  ],
}

/**
 * Generate competitive comparison for a specific competitor
 */
export function generateCompetitorComparison(
  competitorId: string,
  solutionArea: string
): CompetitorComparison | null {
  const competitor = COMPETITORS[competitorId]
  if (!competitor) return null

  const differentiators = generateDifferentiators(competitor, solutionArea)
  const migrationComplexity = assessMigrationComplexity(competitor)
  const switchingCosts = assessSwitchingCosts(competitor)
  const riskFactors = identifyRiskFactors(competitor)
  const winStrategies = generateWinStrategies(competitor, solutionArea)

  return {
    competitorId,
    competitorName: competitor.name,
    category: competitor.category,
    differentiators,
    migrationComplexity,
    switchingCosts,
    riskFactors,
    winStrategies,
  }
}

function generateDifferentiators(competitor: Competitor, solutionArea: string): ComparisonPoint[] {
  const points: ComparisonPoint[] = []

  // Common differentiators
  points.push({
    feature: 'AI/Copilot Integration',
    microsoft: { score: 5, details: 'Native Copilot across all products' },
    competitor: { score: 2, details: 'Limited or no AI assistant' },
    importance: 'critical',
    notes: 'Microsoft leads with Copilot and Azure OpenAI',
  })

  points.push({
    feature: 'Unified Platform',
    microsoft: { score: 5, details: 'Microsoft 365 + Azure integration' },
    competitor: { score: 3, details: 'Point solution or limited integration' },
    importance: 'high',
  })

  points.push({
    feature: 'Security & Compliance',
    microsoft: { score: 5, details: 'Comprehensive security portfolio' },
    competitor: { score: 3, details: competitor.weaknesses.find(w => w.toLowerCase().includes('security')) || 'Adequate security' },
    importance: 'critical',
  })

  points.push({
    feature: 'Enterprise Support',
    microsoft: { score: 5, details: 'Global enterprise support infrastructure' },
    competitor: { score: 3, details: 'Standard support options' },
    importance: 'high',
  })

  // Category-specific differentiators
  if (competitor.category === 'cloud') {
    points.push({
      feature: 'Hybrid Cloud',
      microsoft: { score: 5, details: 'Azure Arc, Azure Stack HCI' },
      competitor: { score: 3, details: 'Limited hybrid options' },
      importance: 'high',
    })
  }

  if (competitor.category === 'productivity') {
    points.push({
      feature: 'Desktop Applications',
      microsoft: { score: 5, details: 'Full Office desktop suite' },
      competitor: { score: 2, details: 'Web-first, limited offline' },
      importance: 'medium',
    })
  }

  return points
}

function assessMigrationComplexity(competitor: Competitor): 'low' | 'medium' | 'high' {
  if (['sap', 'oracle'].includes(competitor.id)) return 'high'
  if (['aws', 'gcp', 'snowflake', 'databricks'].includes(competitor.id)) return 'medium'
  return 'low'
}

function assessSwitchingCosts(competitor: Competitor): string {
  const complexity = assessMigrationComplexity(competitor)
  
  if (complexity === 'high') {
    return 'High switching costs due to deep system integration and data migration requirements. Budget 6-18 months for full transition.'
  }
  if (complexity === 'medium') {
    return 'Moderate switching costs with data migration and retraining needs. Expect 3-6 months for transition with proper planning.'
  }
  return 'Relatively low switching costs. Most migrations can be completed in 1-3 months with Microsoft FastTrack assistance.'
}

function identifyRiskFactors(competitor: Competitor): string[] {
  const risks: string[] = []
  
  risks.push(`Incumbent relationship: Customer has existing ${competitor.name} expertise and investments`)
  
  if (competitor.category === 'cloud') {
    risks.push('Workload migration complexity and potential downtime')
    risks.push('Application refactoring requirements')
  }
  
  risks.push('Change management and user adoption')
  risks.push('Contract timing and renewal cycles')
  
  return risks
}

function generateWinStrategies(competitor: Competitor, solutionArea: string): string[] {
  const strategies: string[] = []
  
  // Universal strategies
  strategies.push('Lead with Copilot and AI innovation story')
  strategies.push('Emphasize total cost of ownership across the Microsoft platform')
  strategies.push('Highlight security and compliance advantages')
  
  // Competitor-specific strategies
  if (competitor.id === 'aws' || competitor.id === 'gcp') {
    strategies.push('Position Azure for hybrid scenarios with Arc')
    strategies.push('Emphasize Microsoft 365 integration benefits')
    strategies.push('Leverage Windows Server and SQL Server migration incentives')
  }
  
  if (competitor.id === 'google_workspace') {
    strategies.push('Focus on desktop application experience and offline capabilities')
    strategies.push('Highlight advanced security and compliance features')
    strategies.push('Demonstrate Copilot productivity gains')
  }
  
  if (competitor.id === 'salesforce') {
    strategies.push('Position Dynamics 365 as unified platform with Microsoft 365')
    strategies.push('Emphasize Power Platform extensibility')
    strategies.push('Highlight Copilot for Sales integration')
  }
  
  if (competitor.category === 'security') {
    strategies.push('Position Microsoft Defender XDR as unified platform')
    strategies.push('Emphasize integration with Microsoft 365 and Azure')
    strategies.push('Highlight cost consolidation opportunity')
  }
  
  return strategies
}

/**
 * Get competitive intelligence for an industry
 */
export function getIndustryCompetitiveIntelligence(industry: string): CompetitiveIntelligence {
  const industryData: Record<string, Partial<CompetitiveIntelligence>> = {
    technology: {
      commonCompetitors: ['aws', 'gcp', 'slack', 'databricks'],
      marketTrends: [
        'AI/ML adoption accelerating',
        'Multi-cloud strategies common',
        'Developer experience prioritized',
      ],
    },
    financial_services: {
      commonCompetitors: ['aws', 'salesforce', 'servicenow', 'crowdstrike'],
      marketTrends: [
        'Regulatory compliance driving decisions',
        'Cloud adoption accelerating post-COVID',
        'AI for fraud detection and risk management',
      ],
    },
    healthcare: {
      commonCompetitors: ['aws', 'google_workspace', 'salesforce'],
      marketTrends: [
        'HIPAA compliance requirements',
        'Telehealth and patient experience focus',
        'AI for clinical decision support',
      ],
    },
    retail: {
      commonCompetitors: ['aws', 'gcp', 'salesforce', 'sap'],
      marketTrends: [
        'Omnichannel commerce priority',
        'Supply chain resilience focus',
        'AI for personalization and demand forecasting',
      ],
    },
    manufacturing: {
      commonCompetitors: ['aws', 'sap', 'oracle', 'snowflake'],
      marketTrends: [
        'Industry 4.0 and IoT adoption',
        'Supply chain digitization',
        'AI for predictive maintenance',
      ],
    },
  }

  const data = industryData[industry] || {}

  return {
    industry,
    commonCompetitors: data.commonCompetitors || ['aws', 'gcp', 'salesforce'],
    marketTrends: data.marketTrends || ['Digital transformation', 'Cloud adoption', 'AI investment'],
    microsoftAdvantages: [
      'Integrated platform reducing complexity',
      'Copilot productivity transformation',
      'Enterprise-grade security and compliance',
      'Industry-specific cloud solutions',
    ],
    typicalObjections: [
      {
        objection: 'We already have investments in the competitor platform',
        response: 'Microsoft offers coexistence and gradual migration paths. Many customers run hybrid environments successfully.',
        proofPoints: [
          'Azure integration with multi-cloud workloads',
          'Power Platform connecting to any data source',
          'Phased migration programs with Microsoft FastTrack',
        ],
      },
      {
        objection: 'Microsoft is too expensive',
        response: 'Total cost of ownership across the integrated platform typically shows 20-40% savings vs best-of-breed approaches.',
        proofPoints: [
          'Security consolidation savings (avg 60% reduction in tools)',
          'Productivity gains from Copilot (avg 30% time savings)',
          'Reduced integration and management overhead',
        ],
      },
      {
        objection: 'Our team prefers the competitor product',
        response: 'Microsoft has invested heavily in user experience. Copilot and modern UI significantly improve satisfaction scores.',
        proofPoints: [
          'Teams user satisfaction scores',
          'Copilot adoption and productivity metrics',
          'Training and change management support',
        ],
      },
    ],
  }
}

/**
 * Generate competitive battle card content
 */
export function generateBattleCard(competitorId: string): {
  competitor: Competitor
  microsoftAdvantages: string[]
  talkingPoints: string[]
  objectionHandling: ObjectionResponse[]
} | null {
  const competitor = COMPETITORS[competitorId]
  if (!competitor) return null

  const advantages = MICROSOFT_ADVANTAGES[competitor.category] || MICROSOFT_ADVANTAGES.cloud

  const talkingPoints = [
    `Unlike ${competitor.name}, Microsoft provides an integrated platform across productivity, cloud, and security`,
    `Copilot gives Microsoft customers AI-powered assistance that ${competitor.name} cannot match`,
    `Microsoft's hybrid cloud capabilities address on-premises requirements that ${competitor.name} struggles with`,
    `Enterprise customers choose Microsoft for comprehensive compliance certifications and support`,
  ]

  const objectionHandling: ObjectionResponse[] = [
    {
      objection: `${competitor.name} has more features in their core product`,
      response: 'While they may have depth in one area, Microsoft provides breadth across the entire technology stack with seamless integration.',
      proofPoints: competitor.weaknesses.slice(0, 2),
    },
    {
      objection: `We've already invested in ${competitor.name}`,
      response: 'Microsoft supports gradual migration and hybrid scenarios. You can start with high-value workloads while maintaining existing investments.',
      proofPoints: [
        'Azure Arc for multi-cloud management',
        'Power Platform for integration',
        'FastTrack migration assistance',
      ],
    },
  ]

  return {
    competitor,
    microsoftAdvantages: advantages,
    talkingPoints,
    objectionHandling,
  }
}
