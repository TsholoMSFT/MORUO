import type { Industry } from './types'

export interface IndustryBenchmarks {
  name: string
  costToIncomeTarget: number
  revenuePerEmployee: number
  roaTarget: number
  operatingMarginTarget: number
  digitalRevenuePct: number
}

export const industryBenchmarks: Record<Industry, IndustryBenchmarks> = {
  banking: {
    name: 'Banking & Financial Services',
    costToIncomeTarget: 45,
    revenuePerEmployee: 500000,
    roaTarget: 1.5,
    operatingMarginTarget: 30,
    digitalRevenuePct: 40,
  },
  technology: {
    name: 'Technology Companies',
    revenuePerEmployee: 300000,
    costToIncomeTarget: 60,
    roaTarget: 8,
    operatingMarginTarget: 25,
    digitalRevenuePct: 95,
  },
  retail: {
    name: 'Retail & E-commerce',
    revenuePerEmployee: 200000,
    costToIncomeTarget: 75,
    roaTarget: 5,
    operatingMarginTarget: 8,
    digitalRevenuePct: 30,
  },
  manufacturing: {
    name: 'Manufacturing',
    revenuePerEmployee: 250000,
    costToIncomeTarget: 70,
    roaTarget: 6,
    operatingMarginTarget: 15,
    digitalRevenuePct: 20,
  },
  general: {
    name: 'General Enterprise',
    revenuePerEmployee: 250000,
    costToIncomeTarget: 65,
    roaTarget: 5,
    operatingMarginTarget: 15,
    digitalRevenuePct: 25,
  },
}

export const industryDescriptions: Record<Industry, string> = {
  banking: 'Focus on Cost-to-Income Ratio, regulatory compliance, and digital channel adoption',
  technology: 'Emphasize revenue per employee, platform scalability, and time-to-market',
  retail: 'Optimize inventory turnover, customer acquisition cost, and conversion rates',
  manufacturing: 'Improve asset utilization, supply chain efficiency, and quality metrics',
  general: 'Balanced approach across operational efficiency and growth metrics',
}
