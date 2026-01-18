export type CustomerOutcomeId =
  | 'revenue-growth'
  | 'cost-reduction'
  | 'productivity'
  | 'time-to-market'
  | 'customer-experience'
  | 'risk-compliance'
  | 'data-modernization'
  | 'security'

export const CUSTOMER_OUTCOMES: Array<{
  id: CustomerOutcomeId
  label: string
  description: string
}> = [
  {
    id: 'revenue-growth',
    label: 'Grow revenue / new channels',
    description: 'Increase sales, conversion, cross-sell, or enable new digital offerings.',
  },
  {
    id: 'cost-reduction',
    label: 'Reduce operating costs',
    description: 'Automation, platform consolidation, fewer manual processes, lower run costs.',
  },
  {
    id: 'productivity',
    label: 'Improve employee productivity',
    description: 'Boost throughput and reduce time spent on repetitive work.',
  },
  {
    id: 'time-to-market',
    label: 'Accelerate time-to-market',
    description: 'Deliver features/products faster with better dev + data + operations.',
  },
  {
    id: 'customer-experience',
    label: 'Improve customer experience',
    description: 'Better service, personalization, responsiveness, and reliability.',
  },
  {
    id: 'risk-compliance',
    label: 'Reduce risk / improve compliance',
    description: 'Lower audit findings, improve resilience, and reduce operational exposure.',
  },
  {
    id: 'data-modernization',
    label: 'Modernize data & analytics',
    description: 'Improve data quality, insights, forecasting, and decision speed.',
  },
  {
    id: 'security',
    label: 'Strengthen security posture',
    description: 'Reduce breaches/incidents and improve detection + response.',
  },
]

export function getCustomerOutcomeLabel(id: string): string {
  const match = CUSTOMER_OUTCOMES.find(o => o.id === id)
  return match?.label ?? id
}

export function formatCustomerOutcomes(ids?: string[]): string[] {
  if (!ids || ids.length === 0) return []
  return ids.map(getCustomerOutcomeLabel)
}
