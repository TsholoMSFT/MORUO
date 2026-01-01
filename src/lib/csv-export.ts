import type { Analysis } from './types'
import { formatCurrency } from './calculations'

export function exportValueDashboardToCSV(
  analyses: Analysis[],
  selectedSolutionAreas: string[],
  selectedSubsidiaries: string[]
): void {
  const headers = [
    'Rank',
    'Use Case Name',
    'Customer Name',
    'Subsidiary',
    'Region',
    'Solution Area(s)',
    'Industry',
    'Investment Amount',
    'Timeline (Months)',
    'Net Benefit',
    'ROI (%)',
    'NPV',
    'Payback Period (Months)',
    'Priority',
    'Strategic Score',
    'Created Date',
  ]

  const sortedAnalyses = [...analyses]
    .sort((a, b) => b.results.realistic.netBenefit - a.results.realistic.netBenefit)

  const rows = sortedAnalyses.map((analysis, index) => {
    const areas = analysis.projectBasics.solutionAreas && analysis.projectBasics.solutionAreas.length > 0
      ? analysis.projectBasics.solutionAreas.join('; ')
      : analysis.projectBasics.solutionArea

    const strategicScore = calculateStrategicScore(analysis.strategicFactors)

    return [
      (index + 1).toString(),
      escapeCSVValue(analysis.projectBasics.name),
      escapeCSVValue(analysis.projectBasics.customerName || 'N/A'),
      escapeCSVValue(analysis.projectBasics.subsidiary || 'N/A'),
      escapeCSVValue(analysis.projectBasics.region || 'N/A'),
      escapeCSVValue(areas),
      analysis.projectBasics.industry,
      analysis.projectBasics.investmentAmount.toString(),
      analysis.projectBasics.timelineMonths.toString(),
      analysis.results.realistic.netBenefit.toString(),
      analysis.results.realistic.roi.toFixed(2),
      analysis.results.realistic.npv.toString(),
      analysis.results.realistic.paybackMonths.toFixed(2),
      analysis.recommendation.priority,
      strategicScore.toFixed(1),
      new Date(analysis.createdAt).toLocaleDateString(),
    ]
  })

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n')

  const filterInfo: string[] = []
  if (selectedSolutionAreas.length > 0) {
    filterInfo.push(`Filtered by Solution Areas: ${selectedSolutionAreas.join(', ')}`)
  }
  if (selectedSubsidiaries.length > 0) {
    filterInfo.push(`Filtered by Subsidiaries: ${selectedSubsidiaries.join(', ')}`)
  }

  let finalContent = csvContent
  if (filterInfo.length > 0) {
    finalContent = filterInfo.join('\n') + '\n\n' + csvContent
  }

  downloadCSV(finalContent, `value-dashboard-${new Date().toISOString().split('T')[0]}.csv`)
}

export function exportSolutionAreaComparisonToCSV(
  valueByAreaComparison: Array<{
    area: string
    count: number
    totalValue: number
    avgROI: number
  }>
): void {
  const headers = [
    'Solution Area',
    'Use Case Count',
    'Total Net Benefit',
    'Average ROI (%)',
  ]

  const rows = valueByAreaComparison.map(({ area, count, totalValue, avgROI }) => [
    escapeCSVValue(area),
    count.toString(),
    totalValue.toString(),
    avgROI.toFixed(2),
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n')

  downloadCSV(csvContent, `solution-area-comparison-${new Date().toISOString().split('T')[0]}.csv`)
}

function calculateStrategicScore(factors: {
  competitiveDifferentiation: number
  riskMitigation: number
  customerExperience: number
  employeeProductivity: number
  regulatoryCompliance: number
  innovationEnablement: number
}): number {
  const total = 
    factors.competitiveDifferentiation +
    factors.riskMitigation +
    factors.customerExperience +
    factors.employeeProductivity +
    factors.regulatoryCompliance +
    factors.innovationEnablement
  return total / 6
}

function escapeCSVValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}
