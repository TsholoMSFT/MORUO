/**
 * Report Templates
 * Deal-type specific report generation for business value analyses
 */

import type { Analysis, DealType } from './types'
import { DEAL_TYPE_INFO } from './types'
import type { MonteCarloResults } from './monte-carlo'
import type { GeneratedNarrative } from './ai-narratives'
import { formatCurrency, formatPercent } from './calculations'
import { formatCustomerOutcomes } from './customer-outcomes'

export type ReportFormat = 'html' | 'markdown' | 'json'
export type ReportAudience = 'customer' | 'internal' | 'executive'

export interface ReportOptions {
  format: ReportFormat
  audience: ReportAudience
  includeMonteCarloDetails: boolean
  includeStrategicFactors: boolean
  includeNarrative: boolean
  includeCompetitiveAnalysis: boolean
  includeMACCProjections: boolean
}

export interface GeneratedReport {
  title: string
  content: string
  format: ReportFormat
  audience: ReportAudience
  dealType: DealType
  generatedAt: number
}

const DEFAULT_OPTIONS: ReportOptions = {
  format: 'html',
  audience: 'customer',
  includeMonteCarloDetails: true,
  includeStrategicFactors: true,
  includeNarrative: true,
  includeCompetitiveAnalysis: false,
  includeMACCProjections: false,
}

/**
 * Generate a report based on deal type and audience
 */
export function generateReport(
  analysis: Analysis,
  options: Partial<ReportOptions> = {},
  monteCarloResults?: MonteCarloResults,
  narrative?: GeneratedNarrative
): GeneratedReport {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const dealType = analysis.projectBasics.dealType || 'new-business'
  
  // Adjust options based on deal type
  if (dealType === 'competitive') {
    opts.includeCompetitiveAnalysis = true
  }
  if (dealType === 'azure-macc') {
    opts.includeMACCProjections = true
  }

  let content: string
  switch (opts.format) {
    case 'markdown':
      content = generateMarkdownReport(analysis, opts, monteCarloResults, narrative)
      break
    case 'json':
      content = generateJSONReport(analysis, opts, monteCarloResults, narrative)
      break
    case 'html':
    default:
      content = generateHTMLReport(analysis, opts, monteCarloResults, narrative)
  }

  return {
    title: `${analysis.projectBasics.name} - Business Value Report`,
    content,
    format: opts.format,
    audience: opts.audience,
    dealType,
    generatedAt: Date.now(),
  }
}

/**
 * Get deal-type specific report sections
 */
function getDealTypeSpecificSections(
  analysis: Analysis,
  dealType: DealType,
  options: ReportOptions
): { title: string; content: string }[] {
  const sections: { title: string; content: string }[] = []
  const dealInfo = DEAL_TYPE_INFO[dealType]

  // Common deal context section
  sections.push({
    title: 'Deal Context',
    content: `
**Deal Type:** ${dealInfo.name}

${dealInfo.description}

**Pricing Approach:** ${dealInfo.characteristics.pricingApproach}
    `.trim()
  })

  // Deal-type specific sections
  switch (dealType) {
    case 'new-business':
      sections.push({
        title: 'New Customer Value Proposition',
        content: `
**Why This Investment Makes Sense:**
- First-mover advantage in ${analysis.projectBasics.industry}
- Platform foundation for future expansion
- Access to Microsoft's innovation ecosystem

**Risk Mitigation for New Adoption:**
${dealInfo.characteristics.riskFactors.map(r => `- ${r}`).join('\n')}

**Success Criteria:**
${dealInfo.characteristics.keyMetrics.map(m => `- ${m}`).join('\n')}
        `.trim()
      })
      break

    case 'renewal':
      sections.push({
        title: 'Partnership Continuation Value',
        content: `
**Value Delivered During Current Term:**
- Established workflows and integrations
- Team expertise and institutional knowledge
- Ongoing support relationship

**Risks of Not Renewing:**
${dealInfo.characteristics.riskFactors.map(r => `- ${r}`).join('\n')}

**Continued Partnership Benefits:**
${dealInfo.characteristics.proposalEmphasis.map(p => `- ${p}`).join('\n')}
        `.trim()
      })
      break

    case 'upsell-cross-sell':
      sections.push({
        title: 'Expansion Value',
        content: `
**Building on Existing Success:**
- Leverage existing investments and integrations
- Reduced implementation complexity
- Accelerated time-to-value

**Expansion Opportunities:**
${dealInfo.characteristics.proposalEmphasis.map(p => `- ${p}`).join('\n')}

**Integration Benefits:**
- Unified platform experience
- Consolidated vendor management
- Enhanced data insights across solutions
        `.trim()
      })
      break

    case 'competitive':
      if (options.includeCompetitiveAnalysis) {
        sections.push({
          title: 'Competitive Differentiation',
          content: `
**Why Microsoft Over Alternatives:**
- Integrated platform advantage
- Enterprise security and compliance
- AI and innovation leadership (Copilot, Azure OpenAI)
- Global support infrastructure

**Migration Support:**
- Dedicated migration assistance program
- Data migration tools and services
- Training and change management support
- Phased transition approach to minimize risk

**Key Differentiators:**
${dealInfo.characteristics.proposalEmphasis.map(p => `- ${p}`).join('\n')}
          `.trim()
        })
      }
      break

    case 'azure-macc':
      if (options.includeMACCProjections) {
        sections.push({
          title: 'Azure Consumption Commitment',
          content: `
**MACC Benefits:**
- Committed consumption with preferential pricing
- Flexibility across Azure services
- Predictable cloud investment planning

**Consumption Growth Drivers:**
- Workload migration to Azure
- AI/ML adoption (Azure OpenAI, Cognitive Services)
- Data platform modernization
- Hybrid cloud scenarios

**Commitment Optimization:**
${dealInfo.characteristics.keyMetrics.map(m => `- ${m}`).join('\n')}
          `.trim()
        })
      }
      break
  }

  return sections
}

/**
 * Generate HTML report
 */
function generateHTMLReport(
  analysis: Analysis,
  options: ReportOptions,
  monteCarloResults?: MonteCarloResults,
  narrative?: GeneratedNarrative
): string {
  const { projectBasics, results, recommendation, strategicFactors } = analysis
  const dealType = projectBasics.dealType || 'new-business'
  const dealInfo = DEAL_TYPE_INFO[dealType]
  const realistic = results.realistic
  const dealSections = getDealTypeSpecificSections(analysis, dealType, options)

  const customerOutcomes = formatCustomerOutcomes(projectBasics.customerOutcomes)
  const outcomesNotes = (projectBasics.customerOutcomesNotes || '').trim()

  const audienceTitles: Record<ReportAudience, string> = {
    customer: 'Business Value Assessment',
    internal: 'Internal Planning Document',
    executive: 'Executive Summary',
  }

  let html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectBasics.name} - ${audienceTitles[options.audience]}</title>
  <style>
    :root {
      --primary: #0078d4;
      --success: #107c10;
      --warning: #ffb900;
      --danger: #d13438;
      --text: #323130;
      --muted: #605e5c;
      --border: #edebe9;
      --bg: #ffffff;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: 'Segoe UI', system-ui, sans-serif; 
      color: var(--text);
      background: var(--bg);
      line-height: 1.6;
      padding: 40px;
      max-width: 900px;
      margin: 0 auto;
    }
    h1 { font-size: 2rem; margin-bottom: 0.5rem; color: var(--primary); }
    h2 { font-size: 1.5rem; margin: 2rem 0 1rem; border-bottom: 2px solid var(--primary); padding-bottom: 0.5rem; }
    h3 { font-size: 1.25rem; margin: 1.5rem 0 0.75rem; }
    p { margin-bottom: 1rem; }
    .subtitle { color: var(--muted); font-size: 1.1rem; margin-bottom: 1rem; }
    .deal-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      background: var(--primary);
      color: white;
      border-radius: 4px;
      font-size: 0.875rem;
      margin-bottom: 1rem;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
      margin: 1.5rem 0;
    }
    .metric-card {
      padding: 1rem;
      border: 1px solid var(--border);
      border-radius: 8px;
      text-align: center;
    }
    .metric-value { font-size: 1.75rem; font-weight: 600; color: var(--primary); }
    .metric-label { font-size: 0.875rem; color: var(--muted); text-transform: uppercase; }
    .recommendation {
      padding: 1.5rem;
      border-radius: 8px;
      margin: 1.5rem 0;
    }
    .recommendation.go { background: #dff6dd; border-left: 4px solid var(--success); }
    .recommendation.no-go { background: #fde7e9; border-left: 4px solid var(--danger); }
    .recommendation.conditional { background: #fff4ce; border-left: 4px solid var(--warning); }
    .section { margin: 2rem 0; }
    ul { margin: 1rem 0; padding-left: 1.5rem; }
    li { margin-bottom: 0.5rem; }
    .footer { 
      margin-top: 3rem; 
      padding-top: 1rem; 
      border-top: 1px solid var(--border); 
      font-size: 0.875rem; 
      color: var(--muted); 
    }
    @media print {
      body { padding: 20px; }
      .page-break { page-break-before: always; }
    }
  </style>
</head>
<body>
  <header>
    <h1>${projectBasics.name}</h1>
    <p class="subtitle">${projectBasics.customerName} | ${projectBasics.industry}</p>
    <span class="deal-badge">${dealInfo.name}</span>
  </header>

  ${narrative && options.includeNarrative ? `
  <section class="section">
    <h2>Executive Summary</h2>
    <p>${narrative.summary}</p>
    ${narrative.valueProposition ? `<p><strong>Value Proposition:</strong> ${narrative.valueProposition}</p>` : ''}
  </section>
  ` : ''}

  <section class="section">
    ${(customerOutcomes.length > 0 || outcomesNotes) ? `
    <h2>Customer Outcomes</h2>
    ${customerOutcomes.length > 0 ? `
    <ul>
      ${customerOutcomes.map(o => `<li>${o}</li>`).join('\n')}
    </ul>
    ` : '<p><em>No specific outcomes were selected.</em></p>'}
    ${outcomesNotes ? `<p><strong>Notes:</strong> ${outcomesNotes}</p>` : ''}
    ` : ''}

    <h2>Financial Overview</h2>
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-value">${formatCurrency(projectBasics.investmentAmount)}</div>
        <div class="metric-label">Investment</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${formatPercent(realistic.roi)}</div>
        <div class="metric-label">Expected ROI</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${formatCurrency(realistic.npv)}</div>
        <div class="metric-label">Net Present Value</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${realistic.paybackMonths.toFixed(1)} mo</div>
        <div class="metric-label">Payback Period</div>
      </div>
    </div>
    ${monteCarloResults && options.includeMonteCarloDetails ? `
    <h3>Risk-Adjusted Analysis</h3>
    <p>Based on ${monteCarloResults.iterations.toLocaleString()} Monte Carlo simulations:</p>
    <ul>
      <li><strong>Probability of Positive ROI:</strong> ${monteCarloResults.probabilityOfPositiveROI.toFixed(0)}%</li>
      <li><strong>ROI Range (80% confidence):</strong> ${monteCarloResults.roi.p10.toFixed(0)}% to ${monteCarloResults.roi.p90.toFixed(0)}%</li>
      <li><strong>Median Expected ROI:</strong> ${monteCarloResults.roi.p50.toFixed(0)}%</li>
    </ul>
    ` : ''}
  </section>

  <section class="section">
    <div class="recommendation ${recommendation.decision}">
      <h2 style="border: none; margin-top: 0;">Recommendation: ${recommendation.decision.toUpperCase()}</h2>
      <p>${recommendation.reasoning}</p>
    </div>
  </section>

  ${dealSections.map(section => `
  <section class="section">
    <h2>${section.title}</h2>
    ${section.content.split('\n').map(line => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return `<h3>${line.replace(/\*\*/g, '')}</h3>`
      }
      if (line.startsWith('- ')) {
        return `<li>${line.substring(2)}</li>`
      }
      if (line.trim()) {
        return `<p>${line.replace(/\*\*/g, '<strong>').replace(/\*\*/g, '</strong>')}</p>`
      }
      return ''
    }).join('\n')}
  </section>
  `).join('\n')}

  ${options.includeStrategicFactors ? `
  <section class="section">
    <h2>Strategic Value Assessment</h2>
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-value">${strategicFactors.competitiveDifferentiation}/5</div>
        <div class="metric-label">Competitive Diff.</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${strategicFactors.innovationEnablement}/5</div>
        <div class="metric-label">Innovation</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${strategicFactors.customerExperience}/5</div>
        <div class="metric-label">Customer Exp.</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${strategicFactors.riskMitigation}/5</div>
        <div class="metric-label">Risk Mitigation</div>
      </div>
    </div>
  </section>
  ` : ''}

  <section class="section">
    <h2>Next Steps</h2>
    <ol>
      ${recommendation.nextSteps.map(step => `<li>${step}</li>`).join('\n')}
    </ol>
  </section>

  <footer class="footer">
    <p>Generated on ${new Date().toLocaleDateString()} | ${dealInfo.name} | ${options.audience.charAt(0).toUpperCase() + options.audience.slice(1)} Report</p>
  </footer>
</body>
</html>
  `.trim()

  return html
}

/**
 * Generate Markdown report
 */
function generateMarkdownReport(
  analysis: Analysis,
  options: ReportOptions,
  monteCarloResults?: MonteCarloResults,
  narrative?: GeneratedNarrative
): string {
  const { projectBasics, results, recommendation, strategicFactors } = analysis
  const dealType = projectBasics.dealType || 'new-business'
  const dealInfo = DEAL_TYPE_INFO[dealType]
  const realistic = results.realistic
  const dealSections = getDealTypeSpecificSections(analysis, dealType, options)

  const customerOutcomes = formatCustomerOutcomes(projectBasics.customerOutcomes)
  const outcomesNotes = (projectBasics.customerOutcomesNotes || '').trim()

  let md = `# ${projectBasics.name}

**Customer:** ${projectBasics.customerName}  
**Industry:** ${projectBasics.industry}  
**Deal Type:** ${dealInfo.name}  
**Investment:** ${formatCurrency(projectBasics.investmentAmount)}  
**Timeline:** ${projectBasics.timelineMonths} months

---

`

  if (narrative && options.includeNarrative) {
    md += `## Executive Summary

${narrative.summary}

${narrative.valueProposition ? `**Value Proposition:** ${narrative.valueProposition}` : ''}

---

`
  }

  md += `## Financial Overview

| Metric | Value |
|--------|-------|
| Investment | ${formatCurrency(projectBasics.investmentAmount)} |
| Expected ROI | ${formatPercent(realistic.roi)} |
| Net Present Value | ${formatCurrency(realistic.npv)} |
| Payback Period | ${realistic.paybackMonths.toFixed(1)} months |
| Net Benefit | ${formatCurrency(realistic.netBenefit)} |

`

  if (customerOutcomes.length > 0 || outcomesNotes) {
    md += `---

## Customer Outcomes

${customerOutcomes.length > 0 ? customerOutcomes.map(o => `- ${o}`).join('\n') : '_No specific outcomes were selected._'}

${outcomesNotes ? `**Notes:** ${outcomesNotes}\n` : ''}
`
  }

  if (monteCarloResults && options.includeMonteCarloDetails) {
    md += `### Risk-Adjusted Analysis

Based on ${monteCarloResults.iterations.toLocaleString()} Monte Carlo simulations:

- **Probability of Positive ROI:** ${monteCarloResults.probabilityOfPositiveROI.toFixed(0)}%
- **ROI Range (80% confidence):** ${monteCarloResults.roi.p10.toFixed(0)}% to ${monteCarloResults.roi.p90.toFixed(0)}%
- **Median Expected ROI:** ${monteCarloResults.roi.p50.toFixed(0)}%

`
  }

  md += `---

## Recommendation: ${recommendation.decision.toUpperCase()}

${recommendation.reasoning}

### Success Metrics
${recommendation.successMetrics.map(m => `- ${m}`).join('\n')}

### Key Risks
${recommendation.risks.map(r => `- ${r}`).join('\n')}

---

`

  // Add deal-type specific sections
  dealSections.forEach(section => {
    md += `## ${section.title}

${section.content}

`
  })

  if (options.includeStrategicFactors) {
    md += `---

## Strategic Value Assessment

| Factor | Score |
|--------|-------|
| Competitive Differentiation | ${strategicFactors.competitiveDifferentiation}/5 |
| Innovation Enablement | ${strategicFactors.innovationEnablement}/5 |
| Customer Experience | ${strategicFactors.customerExperience}/5 |
| Risk Mitigation | ${strategicFactors.riskMitigation}/5 |
| Employee Productivity | ${strategicFactors.employeeProductivity}/5 |
| Regulatory Compliance | ${strategicFactors.regulatoryCompliance}/5 |

`
  }

  md += `---

## Next Steps

${recommendation.nextSteps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

---

*Generated on ${new Date().toLocaleDateString()} | ${dealInfo.name} | ${options.audience.charAt(0).toUpperCase() + options.audience.slice(1)} Report*
`

  return md
}

/**
 * Generate JSON report
 */
function generateJSONReport(
  analysis: Analysis,
  options: ReportOptions,
  monteCarloResults?: MonteCarloResults,
  narrative?: GeneratedNarrative
): string {
  const { projectBasics, results, recommendation, strategicFactors } = analysis
  const dealType = projectBasics.dealType || 'new-business'
  const dealInfo = DEAL_TYPE_INFO[dealType]
  const dealSections = getDealTypeSpecificSections(analysis, dealType, options)

  const customerOutcomes = formatCustomerOutcomes(projectBasics.customerOutcomes)

  const report = {
    metadata: {
      generatedAt: new Date().toISOString(),
      audience: options.audience,
      dealType: dealType,
      dealTypeName: dealInfo.name,
    },
    projectBasics: {
      name: projectBasics.name,
      customerName: projectBasics.customerName,
      industry: projectBasics.industry,
      solutionAreas: projectBasics.solutionAreas || [projectBasics.solutionArea],
      customerOutcomes: customerOutcomes,
      customerOutcomesNotes: projectBasics.customerOutcomesNotes || undefined,
      investmentAmount: projectBasics.investmentAmount,
      timelineMonths: projectBasics.timelineMonths,
    },
    financials: {
      realistic: results.realistic,
      optimistic: results.optimistic,
      conservative: results.conservative,
    },
    recommendation: {
      decision: recommendation.decision,
      priority: recommendation.priority,
      reasoning: recommendation.reasoning,
      successMetrics: recommendation.successMetrics,
      risks: recommendation.risks,
      nextSteps: recommendation.nextSteps,
    },
    dealTypeContext: {
      description: dealInfo.description,
      pricingApproach: dealInfo.characteristics.pricingApproach,
      proposalEmphasis: dealInfo.characteristics.proposalEmphasis,
      keyMetrics: dealInfo.characteristics.keyMetrics,
      riskFactors: dealInfo.characteristics.riskFactors,
    },
    ...(options.includeStrategicFactors && { strategicFactors }),
    ...(options.includeMonteCarloDetails && monteCarloResults && {
      monteCarloAnalysis: {
        iterations: monteCarloResults.iterations,
        probabilityOfPositiveROI: monteCarloResults.probabilityOfPositiveROI,
        probabilityOfPaybackWithinTimeline: monteCarloResults.probabilityOfPaybackWithinTimeline,
        roiDistribution: monteCarloResults.roi,
        npvDistribution: monteCarloResults.npv,
      },
    }),
    ...(options.includeNarrative && narrative && { narrative }),
    dealTypeSections: dealSections,
  }

  return JSON.stringify(report, null, 2)
}

/**
 * Download report as file
 */
export function downloadReport(report: GeneratedReport): void {
  const mimeTypes: Record<ReportFormat, string> = {
    html: 'text/html',
    markdown: 'text/markdown',
    json: 'application/json',
  }

  const extensions: Record<ReportFormat, string> = {
    html: 'html',
    markdown: 'md',
    json: 'json',
  }

  const blob = new Blob([report.content], { type: `${mimeTypes[report.format]};charset=utf-8;` })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  const filename = `${report.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${report.audience}.${extensions[report.format]}`
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

/**
 * Print HTML report
 */
export function printHTMLReport(report: GeneratedReport): void {
  if (report.format !== 'html') {
    console.error('Can only print HTML reports')
    return
  }

  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(report.content)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }
}
