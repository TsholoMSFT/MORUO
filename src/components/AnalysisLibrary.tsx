import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PriorityBadge } from './PriorityBadge'
import { MagnifyingGlass, Plus, ChartBar, Calendar, Trash, PencilSimple, Globe } from '@phosphor-icons/react'
import type { Analysis } from '@/lib/types'
import { formatCurrency, formatPercent } from '@/lib/calculations'
import { industryBenchmarks } from '@/lib/benchmarks'
import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface AnalysisLibraryProps {
  analyses: Analysis[]
  onSelect: (analysis: Analysis) => void
  onNew: () => void
  onDelete: (id: string) => void
  onViewCustomer: (customerName: string) => void
  onEdit: (analysis: Analysis) => void
  onViewGlobal: () => void
  onLoadDemoData: () => void
  onViewValueGeneration: () => void
}

export function AnalysisLibrary({ analyses, onSelect, onNew, onDelete, onViewCustomer, onEdit, onViewGlobal, onLoadDemoData, onViewValueGeneration }: AnalysisLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [analysisToDelete, setAnalysisToDelete] = useState<Analysis | null>(null)

  const filteredAnalyses = analyses.filter((analysis) => {
    const searchLower = searchQuery.toLowerCase()
    const name = analysis.projectBasics.name ?? ''
    const customerName = analysis.projectBasics.customerName ?? ''
    return (
      name.toLowerCase().includes(searchLower) ||
      customerName.toLowerCase().includes(searchLower)
    )
  })

  const sortedAnalyses = [...filteredAnalyses].sort((a, b) => b.updatedAt - a.updatedAt)

  const customerMap = analyses.reduce(
    (acc, analysis) => {
      const customerName = analysis.projectBasics.customerName ?? 'Unnamed Customer'
      if (!acc[customerName]) {
        acc[customerName] = []
      }
      acc[customerName].push(analysis)
      return acc
    },
    {} as Record<string, Analysis[]>
  )

  const customers = Object.entries(customerMap)
    .map(([name, customerAnalyses]) => ({
      name,
      count: customerAnalyses.length,
      totalInvestment: customerAnalyses.reduce((sum, a) => sum + a.projectBasics.investmentAmount, 0),
      avgROI: customerAnalyses.reduce((sum, a) => sum + a.results.realistic.roi, 0) / customerAnalyses.length,
    }))
    .sort((a, b) => b.count - a.count)

  const handleDeleteClick = (e: React.MouseEvent, analysis: Analysis) => {
    e.stopPropagation()
    setAnalysisToDelete(analysis)
    setDeleteDialogOpen(true)
  }

  const handleEditClick = (e: React.MouseEvent, analysis: Analysis) => {
    e.stopPropagation()
    onEdit(analysis)
  }

  const handleConfirmDelete = () => {
    if (analysisToDelete) {
      onDelete(analysisToDelete.id)
      setDeleteDialogOpen(false)
      setAnalysisToDelete(null)
    }
  }

  if (analyses.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-6">
        <div className="rounded-full bg-accent/10 p-8">
          <ChartBar size={64} className="text-primary" weight="duotone" />
        </div>
        <div className="space-y-2 text-center">
          <h2 className="font-heading text-2xl font-bold">No Analyses Yet</h2>
          <p className="max-w-md text-muted-foreground">
            Start evaluating technology investments with M.O.R.U.O. Create your first business
            value analysis or load demo data to explore.
          </p>
        </div>
        <div className="flex gap-3">
          <Button size="lg" onClick={onNew}>
            <Plus className="mr-2" size={20} weight="bold" />
            Create New Analysis
          </Button>
          <Button size="lg" variant="outline" onClick={onLoadDemoData}>
            <ChartBar className="mr-2" size={20} weight="bold" />
            Load Demo Data
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="mb-2 font-heading text-3xl font-bold tracking-tight">Analysis Library</h1>
          <p className="text-muted-foreground">
            {analyses.length} {analyses.length === 1 ? 'analysis' : 'analyses'} saved
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onLoadDemoData}>
            <ChartBar className="mr-2" size={16} weight="bold" />
            Load Demo Data
          </Button>
          <Button variant="outline" onClick={onViewValueGeneration}>
            <ChartBar className="mr-2" size={18} weight="bold" />
            Value Dashboard
          </Button>
          <Button variant="outline" onClick={onViewGlobal}>
            <Globe className="mr-2" size={18} weight="bold" />
            Global View
          </Button>
          <Button onClick={onNew}>
            <Plus className="mr-2" size={18} weight="bold" />
            New Analysis
          </Button>
        </div>
      </div>

      <div className="relative">
        <MagnifyingGlass
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={20}
        />
        <Input
          placeholder="Search by use case or customer name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {customers.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-heading text-xl font-semibold">Customers</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {customers.map((customer) => (
              <Card
                key={customer.name}
                className="group cursor-pointer p-6 transition-all hover:shadow-lg"
                onClick={() => onViewCustomer(customer.name)}
              >
                <div className="space-y-4">
                  <div>
                    <h3 className="font-heading text-lg font-semibold transition-colors group-hover:text-primary">
                      {customer.name}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {customer.count} {customer.count === 1 ? 'use case' : 'use cases'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 border-t pt-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        Total Investment
                      </p>
                      <p className="mt-1 font-mono text-sm font-medium">
                        {formatCurrency(customer.totalInvestment)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        Avg ROI
                      </p>
                      <p className="mt-1 font-mono text-sm font-medium text-primary">
                        {formatPercent(customer.avgROI)}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="font-heading text-xl font-semibold">All Use Cases</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sortedAnalyses.map((analysis) => {
          const benchmark = industryBenchmarks[analysis.projectBasics.industry]
          const realisticROI = analysis.results.realistic.roi

          return (
            <Card
              key={analysis.id}
              className="group cursor-pointer p-6 transition-all hover:shadow-lg"
              onClick={() => onSelect(analysis)}
            >
              <div className="space-y-4">
                <div>
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-heading text-lg font-semibold leading-tight transition-colors group-hover:text-primary">
                        {analysis.projectBasics.name}
                      </h3>
                      <p className="mt-1 text-sm font-medium text-muted-foreground">
                        {analysis.projectBasics.customerName}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={analysis.recommendation.priority} />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={(e) => handleEditClick(e, analysis)}
                      >
                        <PencilSimple size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={(e) => handleDeleteClick(e, analysis)}
                      >
                        <Trash size={16} className="text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{benchmark.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {analysis.projectBasics.subsidiary} • {analysis.projectBasics.region}
                    </p>
                    <p className="text-xs font-medium text-primary">
                      {analysis.projectBasics.solutionAreas && analysis.projectBasics.solutionAreas.length > 0
                        ? analysis.projectBasics.solutionAreas.join(', ')
                        : analysis.projectBasics.solutionArea}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">ROI</p>
                    <p className="mt-1 font-mono text-xl font-medium">
                      {formatPercent(realisticROI)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">NPV</p>
                    <p className="mt-1 font-mono text-xl font-medium">
                      {formatCurrency(analysis.results.realistic.npv)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 border-t pt-4 text-xs text-muted-foreground">
                  <Calendar size={14} />
                  <span>
                    {new Date(analysis.updatedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Analysis</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{analysisToDelete?.projectBasics.name}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {filteredAnalyses.length === 0 && searchQuery && (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">No analyses found matching "{searchQuery}"</p>
        </div>
      )}
    </div>
  )
}
