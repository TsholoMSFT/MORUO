/**
 * Competitive Analysis Component
 * Displays competitive intelligence for competitive deal types
 */

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Sword,
  Target,
  Shield,
  TrendUp,
  Warning,
  CheckCircle,
  XCircle,
  Lightbulb,
  ChartBar,
} from '@phosphor-icons/react'
import {
  COMPETITORS,
  generateCompetitorComparison,
  getIndustryCompetitiveIntelligence,
  generateBattleCard,
  type Competitor,
  type CompetitorComparison,
  type CompetitiveIntelligence,
} from '@/lib/competitive-analysis'

interface CompetitiveAnalysisProps {
  industry: string
  solutionArea: string
  selectedCompetitor?: string
  onCompetitorSelect?: (competitorId: string) => void
}

export function CompetitiveAnalysis({
  industry,
  solutionArea,
  selectedCompetitor,
  onCompetitorSelect,
}: CompetitiveAnalysisProps) {
  const [activeCompetitor, setActiveCompetitor] = useState(selectedCompetitor || '')

  const intelligence = useMemo(
    () => getIndustryCompetitiveIntelligence(industry),
    [industry]
  )

  const comparison = useMemo(
    () => (activeCompetitor ? generateCompetitorComparison(activeCompetitor, solutionArea) : null),
    [activeCompetitor, solutionArea]
  )

  const battleCard = useMemo(
    () => (activeCompetitor ? generateBattleCard(activeCompetitor) : null),
    [activeCompetitor]
  )

  const handleCompetitorChange = (value: string) => {
    setActiveCompetitor(value)
    onCompetitorSelect?.(value)
  }

  const relevantCompetitors = useMemo(() => {
    return intelligence.commonCompetitors
      .map(id => COMPETITORS[id])
      .filter(Boolean)
  }, [intelligence])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sword size={28} weight="duotone" className="text-primary" />
            Competitive Intelligence
          </h2>
          <p className="text-muted-foreground">
            Analysis and win strategies for {industry} competitive deals
          </p>
        </div>
        <Select value={activeCompetitor} onValueChange={handleCompetitorChange}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select a competitor" />
          </SelectTrigger>
          <SelectContent>
            {Object.values(COMPETITORS).map(comp => (
              <SelectItem key={comp.id} value={comp.id}>
                {comp.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Market Intelligence */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendUp size={20} className="text-primary" />
            Market Trends - {industry}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">Key Industry Trends</h4>
              <ul className="space-y-2">
                {intelligence.marketTrends.map((trend, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <ChartBar size={16} className="text-primary mt-0.5 shrink-0" />
                    {trend}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Microsoft Advantages</h4>
              <ul className="space-y-2">
                {intelligence.microsoftAdvantages.map((adv, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle size={16} className="text-green-600 mt-0.5 shrink-0" weight="fill" />
                    {adv}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Common Competitors */}
      <Card>
        <CardHeader>
          <CardTitle>Common Competitors in {industry}</CardTitle>
          <CardDescription>
            Competitors frequently encountered in this industry
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {relevantCompetitors.map(comp => (
              <Button
                key={comp.id}
                variant={activeCompetitor === comp.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleCompetitorChange(comp.id)}
              >
                {comp.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Competitor Deep Dive */}
      {activeCompetitor && comparison && battleCard && (
        <Tabs defaultValue="comparison" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="comparison">Feature Comparison</TabsTrigger>
            <TabsTrigger value="battlecard">Battle Card</TabsTrigger>
            <TabsTrigger value="objections">Objection Handling</TabsTrigger>
            <TabsTrigger value="strategy">Win Strategy</TabsTrigger>
          </TabsList>

          <TabsContent value="comparison" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  Microsoft vs {battleCard.competitor.name}
                </CardTitle>
                <CardDescription>
                  Feature-by-feature comparison for {solutionArea}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Feature</TableHead>
                      <TableHead>Microsoft</TableHead>
                      <TableHead>{battleCard.competitor.name}</TableHead>
                      <TableHead>Importance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comparison.differentiators.map((diff, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{diff.feature}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ScoreIndicator score={diff.microsoft.score} />
                            <span className="text-sm text-muted-foreground">
                              {diff.microsoft.details}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ScoreIndicator score={diff.competitor.score} />
                            <span className="text-sm text-muted-foreground">
                              {diff.competitor.details}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <ImportanceBadge importance={diff.importance} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="battlecard" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target size={20} className="text-primary" />
                    {battleCard.competitor.name}
                  </CardTitle>
                  <Badge variant="outline">{battleCard.competitor.category}</Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2 text-green-600">Competitor Strengths</h4>
                    <ul className="space-y-1">
                      {battleCard.competitor.strengths.map((s, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <CheckCircle size={14} className="text-green-600 mt-0.5 shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2 text-red-600">Competitor Weaknesses</h4>
                    <ul className="space-y-1">
                      {battleCard.competitor.weaknesses.map((w, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <XCircle size={14} className="text-red-600 mt-0.5 shrink-0" />
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Market Position</h4>
                    <p className="text-sm text-muted-foreground">
                      {battleCard.competitor.marketPosition}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield size={20} className="text-primary" />
                    Microsoft Advantages
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {battleCard.microsoftAdvantages.map((adv, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <CheckCircle size={14} className="text-primary mt-0.5 shrink-0" weight="fill" />
                        {adv}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Key Talking Points</h4>
                    <ul className="space-y-2">
                      {battleCard.talkingPoints.map((point, i) => (
                        <li key={i} className="text-sm flex items-start gap-2 p-2 bg-primary/5 rounded">
                          <Lightbulb size={14} className="text-primary mt-0.5 shrink-0" weight="fill" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="objections" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Common Objections & Responses</CardTitle>
                <CardDescription>
                  How to handle typical objections when competing against {battleCard.competitor.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {[...intelligence.typicalObjections, ...battleCard.objectionHandling].map((obj, i) => (
                  <div key={i} className="border rounded-lg p-4">
                    <div className="flex items-start gap-2 mb-2">
                      <Warning size={18} className="text-amber-600 mt-0.5 shrink-0" weight="fill" />
                      <h4 className="font-medium text-amber-800 dark:text-amber-400">
                        "{obj.objection}"
                      </h4>
                    </div>
                    <p className="text-sm mb-3 pl-6">{obj.response}</p>
                    <div className="pl-6">
                      <h5 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                        Proof Points
                      </h5>
                      <ul className="space-y-1">
                        {obj.proofPoints.map((point, j) => (
                          <li key={j} className="text-sm flex items-start gap-2">
                            <CheckCircle size={12} className="text-green-600 mt-1 shrink-0" />
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="strategy" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target size={20} className="text-primary" />
                    Win Strategies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {comparison.winStrategies.map((strategy, i) => (
                      <li key={i} className="flex items-start gap-2 p-2 border rounded">
                        <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">
                          {i + 1}
                        </span>
                        <span className="text-sm">{strategy}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Warning size={20} className="text-amber-600" />
                    Risk Factors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {comparison.riskFactors.map((risk, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Warning size={14} className="text-amber-600 mt-0.5 shrink-0" />
                        {risk}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 p-3 bg-muted rounded">
                    <h4 className="font-medium text-sm mb-1">Migration Complexity</h4>
                    <Badge
                      variant={
                        comparison.migrationComplexity === 'low'
                          ? 'default'
                          : comparison.migrationComplexity === 'medium'
                            ? 'secondary'
                            : 'destructive'
                      }
                    >
                      {comparison.migrationComplexity.toUpperCase()}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-2">
                      {comparison.switchingCosts}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}

      {!activeCompetitor && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Sword size={48} className="mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-medium text-lg mb-2">Select a Competitor</h3>
            <p className="text-muted-foreground">
              Choose a competitor above to see detailed comparison and win strategies
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ScoreIndicator({ score }: { score: number }) {
  const colors = {
    1: 'bg-red-500',
    2: 'bg-orange-500',
    3: 'bg-yellow-500',
    4: 'bg-lime-500',
    5: 'bg-green-500',
  }
  
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <div
          key={n}
          className={`w-2 h-4 rounded-sm ${n <= score ? colors[score as keyof typeof colors] : 'bg-muted'}`}
        />
      ))}
    </div>
  )
}

function ImportanceBadge({ importance }: { importance: string }) {
  const variants: Record<string, 'destructive' | 'default' | 'secondary' | 'outline'> = {
    critical: 'destructive',
    high: 'default',
    medium: 'secondary',
    low: 'outline',
  }
  
  return (
    <Badge variant={variants[importance] || 'outline'}>
      {importance}
    </Badge>
  )
}
