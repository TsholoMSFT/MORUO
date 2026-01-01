import { Badge } from '@/components/ui/badge'
import type { Priority } from '@/lib/types'
import { cn } from '@/lib/utils'

interface PriorityBadgeProps {
  priority: Priority
  className?: string
}

const priorityConfig = {
  critical: {
    label: 'Critical',
    className: 'bg-red-100 text-red-800 border-red-200',
  },
  high: {
    label: 'High',
    className: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  medium: {
    label: 'Medium',
    className: 'bg-accent/20 text-accent-foreground border-accent/30',
  },
  low: {
    label: 'Low',
    className: 'bg-muted text-muted-foreground border-border',
  },
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = priorityConfig[priority]
  
  return (
    <Badge variant="outline" className={cn(config.className, 'font-medium', className)}>
      {config.label}
    </Badge>
  )
}
