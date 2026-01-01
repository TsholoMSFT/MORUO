import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from '@phosphor-icons/react'
import type { Analysis } from '@/lib/types'

interface SubRegionViewProps {
  subRegionName: string
  regionName: string
  analyses: Analysis[]
  onBack: () => void
  onSelectAnalysis: (analysis: Analysis) => void
}

export function SubRegionView({ onBack }: SubRegionViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" onClick={onBack} className="mb-4 -ml-2">
          <ArrowLeft className="mr-2" />
          Back
        </Button>
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Sub-region view has been deprecated.</p>
        </Card>
      </div>
    </div>
  )
}
