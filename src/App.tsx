import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Toaster, toast } from 'sonner'
import { AnalysisWizard } from './components/AnalysisWizard'
import { AnalysisResults } from './components/AnalysisResults'
import { AnalysisLibrary } from './components/AnalysisLibrary'
import { CustomerView } from './components/CustomerView'
import { GlobalView } from './components/GlobalView'
import { RegionView } from './components/RegionView'
import { SubsidiaryView } from './components/SubsidiaryView'
import { ValueGenerationView } from './components/ValueGenerationView'
import { Calculator } from '@phosphor-icons/react'
import type { Analysis, MarketContext } from './lib/types'
import { calculateAllScenarios } from './lib/calculations'
import { generateRecommendation } from './lib/ai-recommendations'
import { SEED_ANALYSES } from './lib/seed-data'
import type { BreadcrumbItem } from './components/Breadcrumb'
import { fetchStockQuote, fetchIndustryIndex } from './lib/stock-api'
import { generateMockEarningsInsights } from './lib/earnings-analysis'

type View = 'library' | 'wizard' | 'results' | 'customer' | 'global' | 'region' | 'subsidiary' | 'value-generation'

type NavigationContext = {
  previousView?: View
  fromSubsidiary?: string
  fromRegion?: string
  breadcrumbPath?: Array<{ view: View; id?: string }>
}

function App() {
  const [analyses, setAnalyses] = useKV<Analysis[]>('moruo-analyses', [])
  const [currentView, setCurrentView] = useState<View>('library')
  const [currentAnalysis, setCurrentAnalysis] = useState<Analysis | null>(null)
  const [currentCustomer, setCurrentCustomer] = useState<string | null>(null)
  const [currentRegion, setCurrentRegion] = useState<string | null>(null)
  const [currentSubsidiary, setCurrentSubsidiary] = useState<string | null>(null)
  const [navigationContext, setNavigationContext] = useState<NavigationContext>({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const handleStartNewAnalysis = () => {
    setCurrentAnalysis(null)
    setIsEditing(false)
    setCurrentView('wizard')
  }

  const handleEditAnalysis = (analysis: Analysis) => {
    setCurrentAnalysis(analysis)
    setIsEditing(true)
    setCurrentView('wizard')
  }

  const handleWizardComplete = async (data: Parameters<typeof AnalysisWizard>[0]['onComplete'] extends (data: infer D) => void ? D : never) => {
    setIsGenerating(true)
    toast.loading(isEditing ? 'Updating analysis...' : 'Generating business value analysis...')

    try {
      const results = calculateAllScenarios(
        data.baselineMetrics,
        data.impactProjections,
        data.projectBasics.investmentAmount,
        data.projectBasics.timelineMonths
      )

      // Fetch market context if ticker is available
      let marketContext: MarketContext | undefined
      try {
        const stockData = data.ticker
          ? await fetchStockQuote(data.ticker)
          : await fetchIndustryIndex(data.projectBasics.industry)
        
        if (stockData) {
          const earningsInsights = generateMockEarningsInsights(
            data.projectBasics.customerName,
            'Q4',
            new Date().getFullYear()
          )
          marketContext = { stockData, earningsInsights }
        }
      } catch (error) {
        console.warn('Could not fetch market context:', error)
      }

      const recommendation = await generateRecommendation(
        data.projectBasics,
        results,
        data.strategicFactors,
        marketContext
      )

      const updatedAnalysis: Analysis = {
        id: isEditing && currentAnalysis ? currentAnalysis.id : `analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: isEditing && currentAnalysis ? currentAnalysis.createdAt : Date.now(),
        updatedAt: Date.now(),
        projectBasics: data.projectBasics,
        baselineMetrics: data.baselineMetrics,
        impactProjections: data.impactProjections,
        strategicFactors: data.strategicFactors,
        results,
        recommendation,
        marketContext,
        ticker: data.ticker,
      }

      if (isEditing) {
        setAnalyses((current = []) => 
          current.map((a) => (a.id === updatedAnalysis.id ? updatedAnalysis : a))
        )
      }

      setCurrentAnalysis(updatedAnalysis)
      setCurrentView('results')
      toast.dismiss()
      toast.success(isEditing ? 'Analysis updated successfully!' : 'Analysis generated successfully!')
      setIsEditing(false)
    } catch (error) {
      console.error('Error generating analysis:', error)
      toast.dismiss()
      toast.error('Failed to generate analysis. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveAnalysis = () => {
    if (!currentAnalysis) return

    setAnalyses((current = []) => {
      const existing = current.find((a) => a.id === currentAnalysis.id)
      if (existing) {
        return current.map((a) =>
          a.id === currentAnalysis.id ? { ...currentAnalysis, updatedAt: Date.now() } : a
        )
      }
      return [...current, currentAnalysis]
    })

    toast.success('Analysis saved to library')
    setCurrentView('library')
  }

  const handleSelectAnalysis = (analysis: Analysis) => {
    setCurrentAnalysis(analysis)
    setCurrentView('results')
  }

  const handleBackToLibrary = () => {
    setCurrentView('library')
    setCurrentAnalysis(null)
    setCurrentCustomer(null)
    setCurrentRegion(null)
    setCurrentSubsidiary(null)
    setNavigationContext({})
    setIsEditing(false)
  }

  const handleViewCustomer = (customerName: string) => {
    const breadcrumbPath = navigationContext.breadcrumbPath || []
    const newPath = [...breadcrumbPath]
    
    if (currentView === 'global') {
      newPath.push({ view: 'global' })
    } else if (currentView === 'region' && currentRegion) {
      if (!newPath.some(p => p.view === 'global')) {
        newPath.push({ view: 'global' })
      }
      if (!newPath.some(p => p.view === 'region' && p.id === currentRegion)) {
        newPath.push({ view: 'region', id: currentRegion })
      }
    } else if (currentView === 'subsidiary' && currentSubsidiary) {
      if (!newPath.some(p => p.view === 'global')) {
        newPath.push({ view: 'global' })
      }
      if (!newPath.some(p => p.view === 'subsidiary' && p.id === currentSubsidiary)) {
        newPath.push({ view: 'subsidiary', id: currentSubsidiary })
      }
    }
    
    setNavigationContext({
      previousView: currentView,
      fromSubsidiary: currentView === 'subsidiary' ? currentSubsidiary || undefined : undefined,
      fromRegion: currentView === 'region' ? currentRegion || undefined : undefined,
      breadcrumbPath: newPath
    })
    setCurrentCustomer(customerName)
    setCurrentView('customer')
  }

  const handleBackFromCustomer = () => {
    if (navigationContext.previousView === 'subsidiary' && navigationContext.fromSubsidiary) {
      setCurrentView('subsidiary')
      setCurrentSubsidiary(navigationContext.fromSubsidiary)
    } else if (navigationContext.previousView === 'region' && navigationContext.fromRegion) {
      setCurrentView('region')
      setCurrentRegion(navigationContext.fromRegion)
    } else if (navigationContext.previousView === 'global') {
      setCurrentView('global')
    } else {
      handleBackToLibrary()
    }
    setNavigationContext({})
  }

  const handleViewGlobal = () => {
    setCurrentView('global')
  }

  const handleViewRegion = (region: string) => {
    setNavigationContext({
      breadcrumbPath: [{ view: 'global' }]
    })
    setCurrentRegion(region)
    setCurrentView('region')
  }

  const handleViewSubsidiary = (subsidiary: string) => {
    const breadcrumbPath = navigationContext.breadcrumbPath || []
    const newPath = [...breadcrumbPath]
    
    if (currentView === 'global') {
      newPath.push({ view: 'global' })
    } else if (currentView === 'region' && currentRegion) {
      if (!breadcrumbPath.some(p => p.view === 'global')) {
        newPath.push({ view: 'global' })
      }
      if (!breadcrumbPath.some(p => p.view === 'region' && p.id === currentRegion)) {
        newPath.push({ view: 'region', id: currentRegion })
      }
    }
    
    setNavigationContext({
      breadcrumbPath: newPath
    })
    setCurrentSubsidiary(subsidiary)
    setCurrentView('subsidiary')
  }

  const handleViewValueGeneration = () => {
    setCurrentView('value-generation')
  }

  const handleDeleteAnalysis = (id: string) => {
    setAnalyses((current = []) => current.filter((a) => a.id !== id))
    toast.success('Analysis deleted')
  }

  const handleLoadDemoData = () => {
    setAnalyses((current = []) => {
      const existingIds = new Set(current.map((a) => a.id))
      const newAnalyses = SEED_ANALYSES.filter((a) => !existingIds.has(a.id))
      if (newAnalyses.length === 0) {
        toast.info('Demo data already loaded')
        return current
      }
      toast.success(`Loaded ${newAnalyses.length} demo analyses`)
      return [...current, ...newAnalyses]
    })
  }

  const buildCustomerBreadcrumbs = (): BreadcrumbItem[] => {
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Library', onClick: handleBackToLibrary }
    ]

    const pathItems = navigationContext.breadcrumbPath || []
    
    for (const item of pathItems) {
      if (item.view === 'global') {
        breadcrumbs.push({ label: 'Global View', onClick: handleViewGlobal })
      } else if (item.view === 'region' && item.id) {
        breadcrumbs.push({ label: item.id, onClick: () => handleViewRegion(item.id!) })
      } else if (item.view === 'subsidiary' && item.id) {
        breadcrumbs.push({ label: item.id, onClick: () => handleViewSubsidiary(item.id!) })
      }
    }

    if (currentCustomer) {
      breadcrumbs.push({ label: currentCustomer })
    }

    return breadcrumbs
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        <header className="border-b bg-primary text-primary-foreground">
          <div className="container mx-auto px-8 py-6">
            <div className="flex items-center justify-between gap-3">
              <div
                className="flex cursor-pointer items-center gap-3"
                onClick={handleBackToLibrary}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleBackToLibrary()
                  }
                }}
              >
                <div className="rounded-lg bg-accent p-2">
                  <Calculator size={28} weight="bold" className="text-accent-foreground" />
                </div>
                <div>
                  <h1 className="font-heading text-2xl font-bold tracking-tight">M.O.R.U.O</h1>
                  <p className="text-sm text-primary-foreground/80">
                    Monetized Outcomes & Risk-adjusted Utility Optimizer
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-8 py-8">
          {isGenerating ? (
            <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-accent border-t-transparent" />
              <p className="text-lg font-medium">Generating analysis...</p>
              <p className="text-sm text-muted-foreground">
                AI is evaluating business value and strategic factors
              </p>
            </div>
          ) : currentView === 'library' ? (
            <AnalysisLibrary
              analyses={analyses || []}
              onSelect={handleSelectAnalysis}
              onNew={handleStartNewAnalysis}
              onDelete={handleDeleteAnalysis}
              onViewCustomer={handleViewCustomer}
              onEdit={handleEditAnalysis}
              onViewGlobal={handleViewGlobal}
              onLoadDemoData={handleLoadDemoData}
              onViewValueGeneration={handleViewValueGeneration}
            />
          ) : currentView === 'wizard' ? (
            <div className="mx-auto max-w-4xl">
              <div className="mb-6">
                <h1 className="mb-2 font-heading text-3xl font-bold tracking-tight">
                  {isEditing ? 'Edit Business Value Analysis' : 'New Business Value Analysis'}
                </h1>
                <p className="text-muted-foreground">
                  Complete the steps below to evaluate the financial impact and strategic value of
                  your technology initiative.
                </p>
              </div>
              <AnalysisWizard
                onComplete={handleWizardComplete}
                onCancel={handleBackToLibrary}
                initialData={isEditing && currentAnalysis ? currentAnalysis : undefined}
              />
            </div>
          ) : currentView === 'results' && currentAnalysis ? (
            <AnalysisResults
              analysis={currentAnalysis}
              onBack={handleBackToLibrary}
              onSave={handleSaveAnalysis}
              onEdit={handleEditAnalysis}
              isSaved={(analyses || []).some((a) => a.id === currentAnalysis.id)}
            />
          ) : currentView === 'customer' && currentCustomer ? (
            <CustomerView
              customerName={currentCustomer}
              analyses={(analyses || []).filter(
                (a) => (a.projectBasics.customerName ?? 'Unnamed Customer') === currentCustomer
              )}
              onSelectAnalysis={handleSelectAnalysis}
              onBack={handleBackFromCustomer}
              backLabel={
                navigationContext.previousView === 'subsidiary' && navigationContext.fromSubsidiary
                  ? `Back to ${navigationContext.fromSubsidiary}`
                  : navigationContext.previousView === 'region' && navigationContext.fromRegion
                  ? `Back to ${navigationContext.fromRegion}`
                  : navigationContext.previousView === 'global'
                  ? 'Back to Global View'
                  : 'Back to All Use Cases'
              }
              breadcrumbItems={buildCustomerBreadcrumbs()}
            />
          ) : currentView === 'global' ? (
            <GlobalView
              analyses={analyses || []}
              onBack={handleBackToLibrary}
              onSelectAnalysis={handleSelectAnalysis}
              onViewRegion={handleViewRegion}
              onViewSubsidiary={handleViewSubsidiary}
              onViewCustomer={handleViewCustomer}
            />
          ) : currentView === 'region' && currentRegion ? (
            <RegionView
              regionName={currentRegion}
              analyses={analyses || []}
              onBack={() => setCurrentView('global')}
              onSelectAnalysis={handleSelectAnalysis}
              onNavigateGlobal={handleViewGlobal}
              onViewCustomer={handleViewCustomer}
              onNavigateLibrary={handleBackToLibrary}
            />
          ) : currentView === 'subsidiary' && currentSubsidiary ? (
            <SubsidiaryView
              subsidiaryName={currentSubsidiary}
              analyses={analyses || []}
              onBack={() => setCurrentView('global')}
              onSelectAnalysis={handleSelectAnalysis}
              onViewCustomer={handleViewCustomer}
              onNavigateGlobal={handleViewGlobal}
              onNavigateRegion={handleViewRegion}
              onNavigateLibrary={handleBackToLibrary}
            />
          ) : currentView === 'value-generation' ? (
            <ValueGenerationView
              analyses={analyses || []}
              onBack={handleBackToLibrary}
              onSelectAnalysis={handleSelectAnalysis}
            />
          ) : null}
        </main>
      </div>
      <Toaster position="top-right" />
    </>
  )
}

export default App