/**
 * Azure MACC (Microsoft Azure Consumption Commitment) Module
 * Consumption tracking, projections, and analysis for MACC deals
 */

export interface MACCCommitment {
  totalCommitment: number
  termMonths: number
  startDate: string
  endDate: string
  currency: 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AUD'
}

export interface ConsumptionDataPoint {
  month: string // YYYY-MM format
  consumed: number
  projected: number
  cumulative: number
  runRate: number
}

export interface MACCProjection {
  commitment: MACCCommitment
  consumptionHistory: ConsumptionDataPoint[]
  projectedConsumption: ConsumptionDataPoint[]
  summary: MACCSummary
  workloadBreakdown: WorkloadConsumption[]
  recommendations: MACCRecommendation[]
}

export interface MACCSummary {
  totalConsumed: number
  totalRemaining: number
  percentConsumed: number
  monthsRemaining: number
  currentMonthlyRunRate: number
  projectedEndConsumption: number
  projectedShortfall: number
  projectedOverage: number
  onTrack: boolean
  riskLevel: 'low' | 'medium' | 'high'
}

export interface WorkloadConsumption {
  category: string
  monthlyConsumption: number
  percentOfTotal: number
  growthRate: number
  services: ServiceConsumption[]
}

export interface ServiceConsumption {
  name: string
  monthlySpend: number
  trend: 'growing' | 'stable' | 'declining'
}

export interface MACCRecommendation {
  type: 'accelerate' | 'optimize' | 'migrate' | 'expand'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  estimatedImpact: number
  timeline: string
}

export interface MACCAnalysisInput {
  commitment: MACCCommitment
  currentMonthlyConsumption: number
  growthRatePercent: number
  plannedWorkloads?: PlannedWorkload[]
}

export interface PlannedWorkload {
  name: string
  category: WorkloadCategory
  estimatedMonthlyConsumption: number
  startMonth: number // months from now
  rampUpMonths: number
}

export type WorkloadCategory = 
  | 'compute'
  | 'storage'
  | 'networking'
  | 'databases'
  | 'analytics'
  | 'ai-ml'
  | 'security'
  | 'iot'
  | 'containers'
  | 'other'

/**
 * Azure service categories with typical consumption patterns
 */
export const AZURE_WORKLOAD_CATEGORIES: Record<WorkloadCategory, {
  name: string
  description: string
  typicalServices: string[]
  avgGrowthRate: number
}> = {
  compute: {
    name: 'Compute',
    description: 'Virtual machines, containers, and serverless compute',
    typicalServices: ['Virtual Machines', 'App Service', 'Functions', 'Container Instances'],
    avgGrowthRate: 15,
  },
  storage: {
    name: 'Storage',
    description: 'Blob, file, and disk storage',
    typicalServices: ['Blob Storage', 'File Storage', 'Managed Disks', 'Archive Storage'],
    avgGrowthRate: 25,
  },
  networking: {
    name: 'Networking',
    description: 'Virtual networks, load balancers, and CDN',
    typicalServices: ['Virtual Network', 'Load Balancer', 'Application Gateway', 'CDN'],
    avgGrowthRate: 10,
  },
  databases: {
    name: 'Databases',
    description: 'Managed database services',
    typicalServices: ['SQL Database', 'Cosmos DB', 'PostgreSQL', 'MySQL'],
    avgGrowthRate: 20,
  },
  analytics: {
    name: 'Analytics',
    description: 'Data analytics and business intelligence',
    typicalServices: ['Synapse Analytics', 'Data Factory', 'Databricks', 'HDInsight'],
    avgGrowthRate: 30,
  },
  'ai-ml': {
    name: 'AI & Machine Learning',
    description: 'AI services and machine learning',
    typicalServices: ['Azure OpenAI', 'Cognitive Services', 'Machine Learning', 'Bot Service'],
    avgGrowthRate: 50,
  },
  security: {
    name: 'Security',
    description: 'Security and identity services',
    typicalServices: ['Microsoft Defender', 'Key Vault', 'Azure AD', 'Sentinel'],
    avgGrowthRate: 20,
  },
  iot: {
    name: 'IoT',
    description: 'Internet of Things services',
    typicalServices: ['IoT Hub', 'IoT Central', 'Digital Twins', 'Time Series Insights'],
    avgGrowthRate: 35,
  },
  containers: {
    name: 'Containers & Kubernetes',
    description: 'Container orchestration and management',
    typicalServices: ['AKS', 'Container Apps', 'Container Registry', 'Service Fabric'],
    avgGrowthRate: 40,
  },
  other: {
    name: 'Other Services',
    description: 'Miscellaneous Azure services',
    typicalServices: ['Logic Apps', 'Event Grid', 'Service Bus', 'API Management'],
    avgGrowthRate: 15,
  },
}

/**
 * Generate MACC consumption projections
 */
export function generateMACCProjection(input: MACCAnalysisInput): MACCProjection {
  const { commitment, currentMonthlyConsumption, growthRatePercent, plannedWorkloads = [] } = input
  
  const startDate = new Date(commitment.startDate)
  const endDate = new Date(commitment.endDate)
  const now = new Date()
  
  // Calculate months
  const totalMonths = commitment.termMonths
  const monthsElapsed = Math.floor((now.getTime() - startDate.getTime()) / (30 * 24 * 60 * 60 * 1000))
  const monthsRemaining = Math.max(0, totalMonths - monthsElapsed)
  
  // Generate historical consumption (mock for demo)
  const consumptionHistory = generateHistoricalConsumption(
    monthsElapsed,
    currentMonthlyConsumption,
    startDate
  )
  
  // Calculate current totals
  const totalConsumed = consumptionHistory.reduce((sum, d) => sum + d.consumed, 0)
  
  // Generate projected consumption
  const projectedConsumption = generateProjectedConsumption(
    monthsRemaining,
    currentMonthlyConsumption,
    growthRatePercent,
    plannedWorkloads,
    totalConsumed,
    now
  )
  
  // Calculate projected end state
  const projectedEndConsumption = projectedConsumption.length > 0
    ? projectedConsumption[projectedConsumption.length - 1].cumulative
    : totalConsumed
  
  const projectedShortfall = Math.max(0, commitment.totalCommitment - projectedEndConsumption)
  const projectedOverage = Math.max(0, projectedEndConsumption - commitment.totalCommitment)
  
  // Determine risk level
  const percentConsumed = (totalConsumed / commitment.totalCommitment) * 100
  const expectedPercent = (monthsElapsed / totalMonths) * 100
  const consumptionRatio = percentConsumed / expectedPercent
  
  let riskLevel: 'low' | 'medium' | 'high' = 'low'
  if (consumptionRatio < 0.7) riskLevel = 'high'
  else if (consumptionRatio < 0.9) riskLevel = 'medium'
  
  const summary: MACCSummary = {
    totalConsumed,
    totalRemaining: commitment.totalCommitment - totalConsumed,
    percentConsumed,
    monthsRemaining,
    currentMonthlyRunRate: currentMonthlyConsumption,
    projectedEndConsumption,
    projectedShortfall,
    projectedOverage,
    onTrack: consumptionRatio >= 0.9,
    riskLevel,
  }
  
  // Generate workload breakdown
  const workloadBreakdown = generateWorkloadBreakdown(currentMonthlyConsumption)
  
  // Generate recommendations
  const recommendations = generateMACCRecommendations(summary, workloadBreakdown)
  
  return {
    commitment,
    consumptionHistory,
    projectedConsumption,
    summary,
    workloadBreakdown,
    recommendations,
  }
}

function generateHistoricalConsumption(
  monthsElapsed: number,
  currentConsumption: number,
  startDate: Date
): ConsumptionDataPoint[] {
  const history: ConsumptionDataPoint[] = []
  let cumulative = 0
  
  // Work backwards from current consumption with slight variability
  const avgGrowthRate = 0.03 // 3% monthly growth assumption
  
  for (let i = 0; i < Math.min(monthsElapsed, 24); i++) {
    const monthsAgo = monthsElapsed - i
    const factor = Math.pow(1 + avgGrowthRate, -monthsAgo)
    const monthlyConsumption = currentConsumption * factor * (0.9 + Math.random() * 0.2)
    cumulative += monthlyConsumption
    
    const date = new Date(startDate)
    date.setMonth(date.getMonth() + i)
    
    history.push({
      month: date.toISOString().slice(0, 7),
      consumed: Math.round(monthlyConsumption),
      projected: Math.round(monthlyConsumption), // Historical projection matches actual
      cumulative: Math.round(cumulative),
      runRate: Math.round(monthlyConsumption),
    })
  }
  
  return history
}

function generateProjectedConsumption(
  monthsRemaining: number,
  currentConsumption: number,
  growthRatePercent: number,
  plannedWorkloads: PlannedWorkload[],
  currentCumulative: number,
  startDate: Date
): ConsumptionDataPoint[] {
  const projection: ConsumptionDataPoint[] = []
  let cumulative = currentCumulative
  const monthlyGrowthRate = Math.pow(1 + growthRatePercent / 100, 1/12) - 1
  
  for (let i = 1; i <= monthsRemaining; i++) {
    // Base consumption with growth
    let monthlyConsumption = currentConsumption * Math.pow(1 + monthlyGrowthRate, i)
    
    // Add planned workloads
    for (const workload of plannedWorkloads) {
      if (i >= workload.startMonth) {
        const monthsActive = i - workload.startMonth + 1
        if (monthsActive <= workload.rampUpMonths) {
          // Ramping up
          const rampFactor = monthsActive / workload.rampUpMonths
          monthlyConsumption += workload.estimatedMonthlyConsumption * rampFactor
        } else {
          // Fully active
          monthlyConsumption += workload.estimatedMonthlyConsumption
        }
      }
    }
    
    cumulative += monthlyConsumption
    
    const date = new Date(startDate)
    date.setMonth(date.getMonth() + i)
    
    projection.push({
      month: date.toISOString().slice(0, 7),
      consumed: 0, // Future - no actual consumption yet
      projected: Math.round(monthlyConsumption),
      cumulative: Math.round(cumulative),
      runRate: Math.round(monthlyConsumption),
    })
  }
  
  return projection
}

function generateWorkloadBreakdown(totalConsumption: number): WorkloadConsumption[] {
  // Typical enterprise distribution
  const distribution: { category: WorkloadCategory; percent: number }[] = [
    { category: 'compute', percent: 35 },
    { category: 'storage', percent: 15 },
    { category: 'databases', percent: 20 },
    { category: 'analytics', percent: 10 },
    { category: 'ai-ml', percent: 8 },
    { category: 'networking', percent: 5 },
    { category: 'security', percent: 4 },
    { category: 'containers', percent: 3 },
  ]
  
  return distribution.map(({ category, percent }) => {
    const categoryInfo = AZURE_WORKLOAD_CATEGORIES[category]
    const monthlyConsumption = totalConsumption * (percent / 100)
    
    return {
      category: categoryInfo.name,
      monthlyConsumption: Math.round(monthlyConsumption),
      percentOfTotal: percent,
      growthRate: categoryInfo.avgGrowthRate,
      services: categoryInfo.typicalServices.slice(0, 3).map((name, i) => ({
        name,
        monthlySpend: Math.round(monthlyConsumption * (0.4 - i * 0.1)),
        trend: i === 0 ? 'growing' as const : 'stable' as const,
      })),
    }
  })
}

function generateMACCRecommendations(
  summary: MACCSummary,
  workloads: WorkloadConsumption[]
): MACCRecommendation[] {
  const recommendations: MACCRecommendation[] = []
  
  // Check if behind on consumption
  if (summary.projectedShortfall > 0) {
    const shortfallPercent = (summary.projectedShortfall / summary.totalRemaining) * 100
    
    if (shortfallPercent > 20) {
      recommendations.push({
        type: 'accelerate',
        priority: 'high',
        title: 'Accelerate Cloud Migration',
        description: `Current consumption trajectory shows a ${formatCurrency(summary.projectedShortfall)} shortfall. Consider accelerating workload migrations to meet commitment.`,
        estimatedImpact: summary.projectedShortfall * 0.5,
        timeline: '3-6 months',
      })
    }
    
    recommendations.push({
      type: 'migrate',
      priority: shortfallPercent > 20 ? 'high' : 'medium',
      title: 'Azure OpenAI & Copilot Adoption',
      description: 'AI workloads can significantly increase consumption while delivering productivity gains. Consider Azure OpenAI Service adoption.',
      estimatedImpact: summary.currentMonthlyRunRate * 0.3 * summary.monthsRemaining,
      timeline: '1-3 months',
    })
    
    recommendations.push({
      type: 'expand',
      priority: 'medium',
      title: 'Data Platform Modernization',
      description: 'Migrate analytics workloads to Synapse Analytics or Microsoft Fabric for increased consumption and capabilities.',
      estimatedImpact: summary.currentMonthlyRunRate * 0.25 * summary.monthsRemaining,
      timeline: '3-6 months',
    })
  }
  
  // Check for optimization opportunities if on track or ahead
  if (summary.projectedOverage > 0) {
    recommendations.push({
      type: 'optimize',
      priority: 'medium',
      title: 'Reserved Instance Optimization',
      description: 'Consider purchasing Azure Reserved Instances for predictable workloads to reduce costs while maintaining consumption credit.',
      estimatedImpact: -summary.currentMonthlyRunRate * 0.15 * summary.monthsRemaining,
      timeline: 'Immediate',
    })
  }
  
  // Always include growth opportunities
  const aiWorkload = workloads.find(w => w.category === 'AI & Machine Learning')
  if (!aiWorkload || aiWorkload.percentOfTotal < 10) {
    recommendations.push({
      type: 'expand',
      priority: summary.riskLevel === 'high' ? 'high' : 'medium',
      title: 'Increase AI/ML Investment',
      description: 'AI workloads represent high-value consumption. Expand Azure OpenAI, Cognitive Services, and ML platform usage.',
      estimatedImpact: summary.currentMonthlyRunRate * 0.2 * summary.monthsRemaining,
      timeline: '1-3 months',
    })
  }
  
  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Calculate consumption velocity and trajectory
 */
export function calculateConsumptionMetrics(projection: MACCProjection): {
  monthlyVelocity: number
  requiredVelocity: number
  velocityGap: number
  trajectoryStatus: 'ahead' | 'on-track' | 'behind' | 'at-risk'
  daysToCommitment: number
} {
  const { summary, commitment } = projection
  
  const requiredVelocity = summary.totalRemaining / summary.monthsRemaining
  const velocityGap = requiredVelocity - summary.currentMonthlyRunRate
  
  let trajectoryStatus: 'ahead' | 'on-track' | 'behind' | 'at-risk' = 'on-track'
  const velocityRatio = summary.currentMonthlyRunRate / requiredVelocity
  
  if (velocityRatio >= 1.1) trajectoryStatus = 'ahead'
  else if (velocityRatio >= 0.9) trajectoryStatus = 'on-track'
  else if (velocityRatio >= 0.7) trajectoryStatus = 'behind'
  else trajectoryStatus = 'at-risk'
  
  // Calculate days to fully consume commitment at current rate
  const daysToCommitment = (summary.totalRemaining / summary.currentMonthlyRunRate) * 30
  
  return {
    monthlyVelocity: summary.currentMonthlyRunRate,
    requiredVelocity,
    velocityGap,
    trajectoryStatus,
    daysToCommitment,
  }
}

/**
 * Format consumption for display
 */
export function formatConsumption(amount: number, currency: string = 'USD'): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M ${currency}`
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}K ${currency}`
  }
  return `${amount.toFixed(0)} ${currency}`
}
