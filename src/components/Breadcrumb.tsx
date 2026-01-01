import { CaretRight } from '@phosphor-icons/react'
import { Button } from './ui/button'

export type BreadcrumbItem = {
  label: string
  onClick?: () => void
}

type BreadcrumbProps = {
  items: BreadcrumbItem[]
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  if (items.length === 0) return null

  return (
    <nav className="mb-6 flex items-center gap-2 text-sm">
      {items.map((item, index) => {
        const isLast = index === items.length - 1

        return (
          <div key={index} className="flex items-center gap-2">
            {item.onClick && !isLast ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={item.onClick}
                className="h-auto px-2 py-1 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                {item.label}
              </Button>
            ) : (
              <span
                className={
                  isLast
                    ? 'px-2 py-1 font-semibold text-foreground'
                    : 'px-2 py-1 text-muted-foreground'
                }
              >
                {item.label}
              </span>
            )}
            {!isLast && (
              <CaretRight
                size={16}
                weight="bold"
                className="text-muted-foreground"
              />
            )}
          </div>
        )
      })}
    </nav>
  )
}
