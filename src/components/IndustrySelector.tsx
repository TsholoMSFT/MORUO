import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Buildings, DeviceMobile, ShoppingCart, Factory, Briefcase } from '@phosphor-icons/react'
import type { Industry } from '@/lib/types'
import { industryDescriptions } from '@/lib/benchmarks'
import { cn } from '@/lib/utils'

interface IndustrySelectorProps {
  value: Industry
  onChange: (value: Industry) => void
}

const industries: Array<{ value: Industry; label: string; icon: React.ElementType }> = [
  { value: 'banking', label: 'Banking & Financial Services', icon: Buildings },
  { value: 'technology', label: 'Technology', icon: DeviceMobile },
  { value: 'retail', label: 'Retail & E-commerce', icon: ShoppingCart },
  { value: 'manufacturing', label: 'Manufacturing', icon: Factory },
  { value: 'general', label: 'General Enterprise', icon: Briefcase },
]

export function IndustrySelector({ value, onChange }: IndustrySelectorProps) {
  return (
    <div className="space-y-4">
      <Label className="text-base">Industry Sector</Label>
      <RadioGroup value={value} onValueChange={onChange as (value: string) => void}>
        <div className="grid gap-3">
          {industries.map((industry) => {
            const Icon = industry.icon
            const isSelected = value === industry.value
            return (
              <label
                key={industry.value}
                className={cn(
                  'flex cursor-pointer items-start gap-4 rounded-lg border-2 p-4 transition-all',
                  isSelected
                    ? 'border-accent bg-accent/5'
                    : 'border-border bg-card hover:border-accent/50'
                )}
              >
                <RadioGroupItem value={industry.value} id={industry.value} className="mt-1" />
                <div className="flex flex-1 gap-4">
                  <Icon
                    size={32}
                    weight={isSelected ? 'fill' : 'regular'}
                    className={cn(
                      'shrink-0 transition-colors',
                      isSelected ? 'text-accent' : 'text-muted-foreground'
                    )}
                  />
                  <div className="flex-1 space-y-1">
                    <p className="font-heading font-semibold">{industry.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {industryDescriptions[industry.value]}
                    </p>
                  </div>
                </div>
              </label>
            )
          })}
        </div>
      </RadioGroup>
    </div>
  )
}
